import { z } from 'zod';
import {
  type Vault,
  type Profile,
  type Field,
  FieldSchema,
  ProfileSchema,
  CURRENT_VAULT_VERSION,
} from '../core/schemas/vault';
import { CANONICAL_KEYS, type FieldKey } from '../core/canonical';
import { type EncryptedPayload, EncryptedPayloadSchema } from '../types/vault';
import { encryptVault, decryptVault } from '../vault/crypto';
import { MigrationRunner } from './migrations';

export type ImportFormat = 'json' | 'csv' | 'txt' | 'encrypted';
export type MergeStrategy = 'skip' | 'replace' | 'keepBoth';

export const PLAIN_EXPORT_CARD_NOTICE =
  'Plain JSON and CSV exports always exclude payment cards for your security. Payment cards travel only inside an Encrypted Export.';

export interface PlainJsonExportEnvelope {
  format: 'stashfill-plain-json';
  version: number;
  exportedAt: number;
  cardExportNotice: string;
  vault: Omit<Vault, 'cards'> & { cards: [] };
}

export interface EncryptedExportEnvelope {
  format: 'stashfill-encrypted-backup';
  version: 1;
  exportedAt: number;
  includesCards: true;
  envelope: EncryptedPayload;
}

export interface ParsedFieldCandidate {
  label: string;
  value: string;
  key: FieldKey;
  category: string;
  profileName: string;
  sensitive: boolean;
}

export interface ImportDryRunPreview {
  valid: boolean;
  format: ImportFormat;
  error?: string;
  newCount: number;
  duplicateCount: number;
  invalidCount: number;
  hasEncryptedVault?: boolean;
  parsedProfiles?: Profile[];
  parsedFields?: ParsedFieldCandidate[];
  fullVault?: Vault;
  encryptedPayload?: EncryptedPayload | null;
}

const FORBIDDEN_PROTOTYPE_KEYS = ['__proto__', 'constructor', 'prototype'];

/**
 * Recursively checks an unknown object for prototype pollution keys or excessive depth.
 */
function hasMaliciousStructure(obj: unknown, depth = 0): boolean {
  if (depth > 15) return true;
  if (!obj || typeof obj !== 'object') return false;

  if (Array.isArray(obj)) {
    if (obj.length > 5000) return true;
    return obj.some((item) => hasMaliciousStructure(item, depth + 1));
  }

  const record = obj as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length > 1000) return true;

  for (const k of keys) {
    if (FORBIDDEN_PROTOTYPE_KEYS.includes(k)) {
      return true;
    }
    if (hasMaliciousStructure(record[k], depth + 1)) {
      return true;
    }
  }
  return false;
}

/**
 * Safely parses JSON while rejecting raw `__proto__` or `constructor.prototype` tokens.
 */
function safeParseJson(rawText: string): unknown {
  if (rawText.length > 10 * 1024 * 1024) {
    throw new Error('Import file exceeds maximum allowed size (10 MB)');
  }
  if (/"__proto__"\s*:|"prototype"\s*:|"constructor"\s*:/i.test(rawText)) {
    throw new Error('Rejected potentially malicious prototype pollution payload');
  }
  const parsed = JSON.parse(rawText);
  if (hasMaliciousStructure(parsed)) {
    throw new Error('Rejected malformed or deeply nested object structure');
  }
  return parsed;
}

/**
 * Exports the vault as a versioned plain JSON string.
 * Strictly strips any payment cards and includes a clear notice.
 */
export function exportPlainJson(vault: Vault): PlainJsonExportEnvelope {
  const sanitizedVault: Omit<Vault, 'cards'> & { cards: [] } = {
    ...JSON.parse(JSON.stringify(vault)),
    cards: [],
  };

  return {
    format: 'stashfill-plain-json',
    version: vault.version || CURRENT_VAULT_VERSION,
    exportedAt: Date.now(),
    cardExportNotice: PLAIN_EXPORT_CARD_NOTICE,
    vault: sanitizedVault,
  };
}

function escapeCsvCell(value: string): string {
  const clean = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Prevent CSV formula injection (=, +, -, @) by quoting
  if (/[",\n]/.test(clean) || /^[=+\-@]/.test(clean)) {
    return `"${clean.replace(/"/g, '""')}"`;
  }
  return clean;
}

/**
 * Exports all profile fields as CSV (label,value,key,category,profile,sensitive).
 * Strictly excludes payment cards and states so in a header comment.
 */
export function exportCsv(vault: Vault): string {
  const lines: string[] = [
    `# ${PLAIN_EXPORT_CARD_NOTICE}`,
    'label,value,key,category,profile,sensitive',
  ];

  for (const profile of vault.profiles) {
    for (const field of profile.fields) {
      const row = [
        escapeCsvCell(field.label),
        escapeCsvCell(field.value),
        escapeCsvCell(field.key),
        escapeCsvCell(field.category || 'general'),
        escapeCsvCell(profile.name),
        field.sensitive ? 'true' : 'false',
      ];
      lines.push(row.join(','));
    }
  }

  return lines.join('\n');
}

/**
 * Exports the full vault + encrypted cards inside a versioned AES-GCM 256-bit envelope.
 */
export async function exportEncryptedBackup(
  vault: Vault,
  encryptedVaultPayload: EncryptedPayload | null,
  exportPassphrase: string,
): Promise<EncryptedExportEnvelope> {
  if (!exportPassphrase || exportPassphrase.length < 6) {
    throw new Error('Passphrase must be at least 6 characters for encrypted export');
  }

  const bundle = {
    version: vault.version || CURRENT_VAULT_VERSION,
    exportedAt: Date.now(),
    vault,
    encryptedPayload: encryptedVaultPayload,
  };

  const envelope = await encryptVault(JSON.stringify(bundle), exportPassphrase);
  return {
    format: 'stashfill-encrypted-backup',
    version: 1,
    exportedAt: bundle.exportedAt,
    includesCards: true,
    envelope,
  };
}

/**
 * Decrypts and validates an EncryptedExportEnvelope using the provided passphrase.
 */
export async function decryptEncryptedBackup(
  rawJson: string,
  passphrase: string,
): Promise<{ vault: Vault; encryptedPayload: EncryptedPayload | null }> {
  const parsed = safeParseJson(rawJson) as Record<string, unknown>;
  const envelopeCandidate = parsed.envelope ?? parsed;
  const validatedEnvelope = EncryptedPayloadSchema.parse(envelopeCandidate);

  const decryptedStr = await decryptVault(validatedEnvelope, passphrase);
  const inner = safeParseJson(decryptedStr) as Record<string, unknown>;
  const { vault } = MigrationRunner.run(inner.vault ?? inner);
  const encryptedPayload = inner.encryptedPayload
    ? EncryptedPayloadSchema.parse(inner.encryptedPayload)
    : null;

  return { vault, encryptedPayload };
}

/**
 * Parses a single CSV line respecting quoted strings and escaped double quotes.
 */
function parseCsvLine(line: string): string[] | null {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        cells.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }

  if (inQuotes) {
    // Unclosed quote -> malformed CSV line
    return null;
  }
  cells.push(current);
  return cells;
}

function inferCanonicalKeyFromLabel(label: string): FieldKey {
  const normalized = label
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if ((CANONICAL_KEYS as readonly string[]).includes(normalized)) {
    return normalized as FieldKey;
  }
  if (normalized === 'name' || normalized === 'fullname') return 'full_name';
  if (normalized === 'firstname') return 'first_name';
  if (normalized === 'lastname') return 'last_name';
  if (normalized === 'mail' || normalized === 'email_address') return 'email';
  if (normalized === 'tel' || normalized === 'telephone' || normalized === 'phone_number')
    return 'phone';
  if (normalized === 'zip' || normalized === 'postcode') return 'postal_code';
  return `custom_${normalized.replace(/[^a-z0-9_]/g, '') || 'field'}`;
}

const CsvCandidateSchema = z.object({
  label: z.string().min(1).max(200),
  value: z.string().max(10000),
  key: z.string().min(1),
  category: z.string().default('general'),
  profileName: z.string().default('Personal'),
  sensitive: z.boolean().default(false),
});

/**
 * Performs a dry-run preview of an import file (JSON, CSV, or key-value TXT).
 * Validates with Zod, counts new, duplicate, and invalid items, and rejects malformed/malicious files atomically.
 */
export function previewImport(
  rawInput: string,
  format: ImportFormat,
  existingProfiles: Profile[],
): ImportDryRunPreview {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      valid: false,
      format,
      error: 'Import file is empty',
      newCount: 0,
      duplicateCount: 0,
      invalidCount: 0,
    };
  }

  // Reject binary / null-byte files immediately
  if (trimmed.includes('\u0000')) {
    return {
      valid: false,
      format,
      error: 'Binary or corrupted file rejected',
      newCount: 0,
      duplicateCount: 0,
      invalidCount: 0,
    };
  }

  const existingFieldMap = new Map<string, Field>();
  for (const prof of existingProfiles) {
    for (const f of prof.fields) {
      existingFieldMap.set(`${prof.name.toLowerCase()}::${f.label.toLowerCase()}`, f);
      existingFieldMap.set(`any::${f.label.toLowerCase()}`, f);
    }
  }

  if (format === 'json') {
    try {
      const parsed = safeParseJson(trimmed) as Record<string, unknown>;

      if (parsed.format === 'stashfill-encrypted-backup' || parsed.envelope) {
        EncryptedPayloadSchema.parse(parsed.envelope ?? parsed);
        return {
          valid: true,
          format: 'encrypted',
          hasEncryptedVault: true,
          newCount: 1,
          duplicateCount: 0,
          invalidCount: 0,
        };
      }

      const rawVault = (parsed.vault ?? parsed) as Record<string, unknown>;
      if (!rawVault || typeof rawVault !== 'object' || !Array.isArray(rawVault.profiles)) {
        return {
          valid: false,
          format: 'json',
          error: 'Invalid JSON schema: missing profiles array',
          newCount: 0,
          duplicateCount: 0,
          invalidCount: 1,
        };
      }

      let newCount = 0;
      let duplicateCount = 0;
      let invalidCount = 0;
      const validatedProfiles: Profile[] = [];

      for (const rawProf of rawVault.profiles) {
        if (!rawProf || typeof rawProf !== 'object') {
          invalidCount++;
          continue;
        }
        const profObj = rawProf as Record<string, unknown>;
        const rawFields = Array.isArray(profObj.fields) ? profObj.fields : null;
        if (!rawFields || typeof profObj.name !== 'string' || !profObj.name.trim()) {
          invalidCount++;
          continue;
        }

        const validFields: Field[] = [];
        for (const rf of rawFields) {
          const res = FieldSchema.safeParse(rf);
          if (!res.success) {
            invalidCount++;
          } else {
            validFields.push(res.data);
            const dupKey = `${profObj.name.toLowerCase()}::${res.data.label.toLowerCase()}`;
            if (existingFieldMap.has(dupKey)) {
              duplicateCount++;
            } else {
              newCount++;
            }
          }
        }

        const profRes = ProfileSchema.safeParse({
          ...profObj,
          fields: validFields,
        });
        if (!profRes.success) {
          invalidCount++;
        } else {
          validatedProfiles.push(profRes.data);
        }
      }

      // Atomic rejection if any profile/field is structurally invalid or if zero valid profiles exist
      if (invalidCount > 0 && validatedProfiles.length === 0) {
        return {
          valid: false,
          format: 'json',
          error: 'Malformed JSON backup: failed Zod schema validation',
          newCount: 0,
          duplicateCount: 0,
          invalidCount,
        };
      }

      const { vault } = MigrationRunner.run({
        ...rawVault,
        profiles: validatedProfiles,
        // Never allow plain JSON import to smuggle unencrypted cards
        cards: [],
      });

      const encryptedPayload = parsed.encryptedPayload
        ? EncryptedPayloadSchema.parse(parsed.encryptedPayload)
        : null;

      return {
        valid: true,
        format: 'json',
        newCount,
        duplicateCount,
        invalidCount,
        hasEncryptedVault: Boolean(encryptedPayload),
        parsedProfiles: validatedProfiles,
        fullVault: vault,
        encryptedPayload,
      };
    } catch (err) {
      return {
        valid: false,
        format: 'json',
        error: err instanceof Error ? err.message : 'Invalid JSON file',
        newCount: 0,
        duplicateCount: 0,
        invalidCount: 1,
      };
    }
  }

  if (format === 'csv') {
    const rawLines = trimmed
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    if (rawLines.length === 0) {
      return {
        valid: false,
        format: 'csv',
        error: 'CSV file contains no data rows',
        newCount: 0,
        duplicateCount: 0,
        invalidCount: 0,
      };
    }

    let startIndex = 0;
    const firstRow = parseCsvLine(rawLines[0]!);
    if (!firstRow) {
      return {
        valid: false,
        format: 'csv',
        error: 'Malformed CSV header row (unclosed quotes)',
        newCount: 0,
        duplicateCount: 0,
        invalidCount: 1,
      };
    }

    const firstCellLower = (firstRow[0] || '').trim().toLowerCase();
    if (firstCellLower === 'label' && (firstRow[1] || '').trim().toLowerCase() === 'value') {
      startIndex = 1;
    }

    let newCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;
    const parsedFields: ParsedFieldCandidate[] = [];

    for (let i = startIndex; i < rawLines.length; i++) {
      const cells = parseCsvLine(rawLines[i]!);
      if (!cells || cells.length < 2) {
        invalidCount++;
        continue;
      }

      const label = (cells[0] || '').trim();
      const value = (cells[1] || '').trim();
      const keyRaw = (cells[2] || '').trim();
      const category = (cells[3] || '').trim() || 'general';
      const profileName = (cells[4] || '').trim() || existingProfiles[0]?.name || 'Personal';
      const sensitive = (cells[5] || '').trim().toLowerCase() === 'true';

      const key = keyRaw || inferCanonicalKeyFromLabel(label);
      const candidateRes = CsvCandidateSchema.safeParse({
        label,
        value,
        key,
        category,
        profileName,
        sensitive,
      });

      if (!candidateRes.success) {
        invalidCount++;
        continue;
      }

      parsedFields.push(candidateRes.data);
      const dupKey = `${profileName.toLowerCase()}::${label.toLowerCase()}`;
      if (existingFieldMap.has(dupKey) || existingFieldMap.has(`any::${label.toLowerCase()}`)) {
        duplicateCount++;
      } else {
        newCount++;
      }
    }

    if (parsedFields.length === 0) {
      return {
        valid: false,
        format: 'csv',
        error: 'No valid CSV rows found',
        newCount: 0,
        duplicateCount: 0,
        invalidCount: invalidCount || 1,
      };
    }

    return {
      valid: true,
      format: 'csv',
      newCount,
      duplicateCount,
      invalidCount,
      parsedFields,
    };
  }

  // format === 'txt' (key=value or key: value per line)
  const rawLines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  let newCount = 0;
  let duplicateCount = 0;
  let invalidCount = 0;
  const parsedFields: ParsedFieldCandidate[] = [];
  const defaultProfName = existingProfiles[0]?.name || 'Personal';

  for (const line of rawLines) {
    const match = line.match(/^([^=:]+)[=:](.*)$/);
    if (!match) {
      invalidCount++;
      continue;
    }

    const label = match[1]!.trim();
    const value = match[2]!.trim();
    const key = inferCanonicalKeyFromLabel(label);

    const candidateRes = CsvCandidateSchema.safeParse({
      label,
      value,
      key,
      category: 'general',
      profileName: defaultProfName,
      sensitive: false,
    });

    if (!candidateRes.success) {
      invalidCount++;
      continue;
    }

    parsedFields.push(candidateRes.data);
    if (existingFieldMap.has(`any::${label.toLowerCase()}`)) {
      duplicateCount++;
    } else {
      newCount++;
    }
  }

  if (parsedFields.length === 0) {
    return {
      valid: false,
      format: 'txt',
      error: 'No valid key=value or key: value lines found',
      newCount: 0,
      duplicateCount: 0,
      invalidCount: invalidCount || 1,
    };
  }

  return {
    valid: true,
    format: 'txt',
    newCount,
    duplicateCount,
    invalidCount,
    parsedFields,
  };
}

/**
 * Applies a validated ImportDryRunPreview onto the existing profiles using the chosen MergeStrategy:
 * - 'skip': Keep existing field when a duplicate label exists; only add new fields.
 * - 'replace': Overwrite existing field value/metadata when a duplicate label matches.
 * - 'keepBoth': Keep existing field and append the imported duplicate as an additional field.
 */
export function applyImportWithStrategy(
  preview: ImportDryRunPreview,
  existingProfiles: Profile[],
  strategy: MergeStrategy,
): Profile[] {
  if (!preview.valid) {
    throw new Error(preview.error || 'Cannot apply invalid import preview');
  }

  const workingProfiles: Profile[] = JSON.parse(JSON.stringify(existingProfiles));
  const now = Date.now();

  const mergeFieldIntoProfile = (prof: Profile, incoming: Field) => {
    const dupIndex = prof.fields.findIndex(
      (f) => f.label.trim().toLowerCase() === incoming.label.trim().toLowerCase(),
    );

    if (dupIndex < 0) {
      prof.fields.push(incoming);
      return;
    }

    if (strategy === 'skip') {
      return;
    }

    if (strategy === 'replace') {
      prof.fields[dupIndex] = {
        ...prof.fields[dupIndex]!,
        value: incoming.value,
        key: incoming.key,
        category: incoming.category,
        sensitive: incoming.sensitive,
        updatedAt: now,
      };
      return;
    }

    // strategy === 'keepBoth'
    prof.fields.push({
      ...incoming,
      id: `f_${now}_${Math.random().toString(36).slice(2, 7)}`,
      label: `${incoming.label} (Imported)`,
    });
  };

  if (preview.parsedProfiles && preview.parsedProfiles.length > 0) {
    for (const incomingProf of preview.parsedProfiles) {
      let targetProf = workingProfiles.find(
        (p) => p.name.trim().toLowerCase() === incomingProf.name.trim().toLowerCase(),
      );
      if (!targetProf) {
        targetProf = {
          id: incomingProf.id || `prof_${now}_${Math.random().toString(36).slice(2, 6)}`,
          name: incomingProf.name,
          icon: incomingProf.icon || 'user',
          fields: [],
        };
        workingProfiles.push(targetProf);
      }

      for (const field of incomingProf.fields) {
        mergeFieldIntoProfile(targetProf, field);
      }
    }
    return workingProfiles;
  }

  if (preview.parsedFields && preview.parsedFields.length > 0) {
    for (const item of preview.parsedFields) {
      let targetProf = workingProfiles.find(
        (p) => p.name.trim().toLowerCase() === item.profileName.trim().toLowerCase(),
      );
      if (!targetProf) {
        targetProf = workingProfiles[0];
      }
      if (!targetProf) {
        targetProf = {
          id: `prof_${now}`,
          name: item.profileName || 'Personal',
          icon: 'user',
          fields: [],
        };
        workingProfiles.push(targetProf);
      }

      const candidateField: Field = FieldSchema.parse({
        id: `f_${now}_${Math.random().toString(36).slice(2, 7)}`,
        label: item.label,
        key: item.key,
        value: item.value,
        type: 'text',
        category: item.category,
        tags: [item.category],
        sensitive: item.sensitive,
        createdAt: now,
        updatedAt: now,
        useCount: 0,
        lastUsedAt: null,
      });

      mergeFieldIntoProfile(targetProf, candidateField);
    }
  }

  return workingProfiles;
}
