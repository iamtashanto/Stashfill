import type { FieldMapping, SiteRule } from '../core/schemas/vault';
import type { FieldAttributes } from './matcher';

export interface FieldSignature {
  name?: string;
  id?: string;
  labelHash?: string;
  domPath?: string;
}

/**
 * Simple deterministic string hash for label texts.
 */
export function hashString(input: string): string {
  const normalized = input.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) ^ normalized.charCodeAt(i);
  }
  return `h_${(hash >>> 0).toString(16)}`;
}

/**
 * Computes a resilient DOM path for an element relative to its form or body.
 */
export function computeDomPath(el: Element): string {
  const segments: string[] = [];
  let cur: Element | null = el;
  let depth = 0;
  while (
    cur &&
    cur.tagName.toLowerCase() !== 'body' &&
    cur.tagName.toLowerCase() !== 'html' &&
    depth < 6
  ) {
    const tag = cur.tagName.toLowerCase();
    const parent: Element | null = cur.parentElement;
    if (parent) {
      const sameTagSiblings = Array.from(parent.children).filter(
        (child: Element) => child.tagName.toLowerCase() === tag,
      );
      const idx = sameTagSiblings.indexOf(cur);
      segments.unshift(sameTagSiblings.length > 1 ? `${tag}:nth(${idx})` : tag);
    } else {
      segments.unshift(tag);
    }
    if (tag === 'form') break;
    cur = parent;
    depth++;
  }
  return segments.join('>');
}

/**
 * Computes a FieldSignature (name, id, labelHash, domPath fallback) for an input element.
 */
export function computeFieldSignature(el: Element, attrs?: FieldAttributes): FieldSignature {
  const name = (attrs?.name ?? el.getAttribute('name') ?? '').trim();
  const id = (attrs?.id ?? el.getAttribute('id') ?? '').trim();
  const labelText = (
    attrs?.labelText ??
    attrs?.ariaLabel ??
    attrs?.placeholder ??
    el.getAttribute('aria-label') ??
    el.getAttribute('placeholder') ??
    ''
  ).trim();
  const labelHash = hashString(labelText);
  const domPath = computeDomPath(el);

  return {
    name: name || undefined,
    id: id || undefined,
    labelHash: labelHash || undefined,
    domPath: domPath || undefined,
  };
}

/**
 * Scores how well a saved FieldMapping signature matches a candidate FieldSignature.
 * Priority:
 * 1. Exact name match (0.95)
 * 2. Exact id match (0.90)
 * 3. Label hash match (0.85)
 * 4. DOM path fallback match (0.70)
 * Survives minor DOM wrapper changes because name, id, or labelHash match even if domPath changes,
 * and domPath matches if dynamic IDs changed.
 */
export function matchFieldSignature(
  saved: FieldSignature,
  candidate: FieldSignature,
): { matches: boolean; score: number; matchedBy?: 'name' | 'id' | 'labelHash' | 'domPath' } {
  if (saved.name && candidate.name && saved.name === candidate.name) {
    return { matches: true, score: 0.95, matchedBy: 'name' };
  }
  if (saved.id && candidate.id && saved.id === candidate.id) {
    return { matches: true, score: 0.9, matchedBy: 'id' };
  }
  if (saved.labelHash && candidate.labelHash && saved.labelHash === candidate.labelHash) {
    return { matches: true, score: 0.85, matchedBy: 'labelHash' };
  }
  if (saved.domPath && candidate.domPath && saved.domPath === candidate.domPath) {
    return { matches: true, score: 0.7, matchedBy: 'domPath' };
  }
  return { matches: false, score: 0 };
}

/**
 * Finds the best matching FieldMapping from a SiteRule for a given element signature.
 * SiteRule mappings take priority over the automatic heuristic matcher.
 */
export function findSiteRuleMapping(
  rule: SiteRule | null | undefined,
  candidateSig: FieldSignature,
): FieldMapping | null {
  if (!rule || !rule.fieldMappings || rule.fieldMappings.length === 0) return null;

  let bestMapping: FieldMapping | null = null;
  let bestScore = 0;

  for (const mapping of rule.fieldMappings) {
    const res = matchFieldSignature(mapping.signature, candidateSig);
    if (res.matches && res.score > bestScore) {
      bestScore = res.score;
      bestMapping = mapping;
    }
  }

  return bestMapping;
}
