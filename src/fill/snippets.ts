import type { Snippet } from '../core/schemas/vault';

export interface ExpandedSnippet {
  text: string;
  cursorOffset: number | null;
}

/**
 * Generates a crypto-random or pseudo-random UUID v4.
 */
function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Expands variables inside a snippet content string:
 * - {{date}} -> YYYY-MM-DD
 * - {{time}} -> HH:MM
 * - {{datetime}} -> YYYY-MM-DD HH:MM
 * - {{year}} -> YYYY
 * - {{month}} -> MM
 * - {{day}} -> DD
 * - {{uuid}} -> UUID v4
 * - {{random:min,max}} -> Random integer between min and max (inclusive)
 * - {{cursor}} -> Sets the cursor position target and is stripped from output
 */
export function expandSnippetVariables(content: string, now = new Date()): ExpandedSnippet {
  const yearStr = String(now.getFullYear());
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const dayStr = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${mins}`;
  const dateTimeStr = `${dateStr} ${timeStr}`;

  let expanded = content
    .replace(/\{\{\s*date\s*\}\}/gi, dateStr)
    .replace(/\{\{\s*time\s*\}\}/gi, timeStr)
    .replace(/\{\{\s*datetime\s*\}\}/gi, dateTimeStr)
    .replace(/\{\{\s*year\s*\}\}/gi, yearStr)
    .replace(/\{\{\s*month\s*\}\}/gi, monthStr)
    .replace(/\{\{\s*day\s*\}\}/gi, dayStr)
    .replace(/\{\{\s*uuid\s*\}\}/gi, () => generateUuid())
    .replace(/\{\{\s*random:(\d+)\s*,\s*(\d+)\s*\}\}/gi, (_match, p1, p2) => {
      const min = parseInt(p1, 10);
      const max = parseInt(p2, 10);
      if (isNaN(min) || isNaN(max) || min > max) return '0';
      const rand = Math.floor(Math.random() * (max - min + 1)) + min;
      return String(rand);
    });

  const cursorMatch = /\{\{\s*cursor\s*\}\}/i.exec(expanded);
  if (cursorMatch && typeof cursorMatch.index === 'number') {
    const text =
      expanded.slice(0, cursorMatch.index) +
      expanded.slice(cursorMatch.index + cursorMatch[0].length);
    return {
      text,
      cursorOffset: cursorMatch.index,
    };
  }

  return {
    text: expanded,
    cursorOffset: null,
  };
}

/**
 * Checks whether the current input value ends with a snippet trigger (using either the snippet's own
 * trigger or the configured triggerPrefix + trigger name, e.g. `;email`).
 */
export function findMatchingSnippetTrigger(
  currentTextBeforeCursor: string,
  snippets: Snippet[],
  triggerPrefix = ';',
): { snippet: Snippet; matchedTrigger: string } | null {
  if (!currentTextBeforeCursor || snippets.length === 0) return null;

  for (const snippet of snippets) {
    const rawTrigger = snippet.trigger.trim();
    if (!rawTrigger) continue;

    // Candidate triggers: exact stored trigger (e.g. ";email" or ":sig") AND prefix + bare trigger (e.g. ";" + "email")
    const bare = rawTrigger.replace(/^[;:!/]+/, '');
    const candidates = Array.from(new Set([rawTrigger, `${triggerPrefix}${bare}`]));

    for (const candidate of candidates) {
      if (currentTextBeforeCursor.endsWith(candidate)) {
        const charBefore =
          currentTextBeforeCursor[currentTextBeforeCursor.length - candidate.length - 1];
        if (!charBefore || /\s/.test(charBefore)) {
          return { snippet, matchedTrigger: candidate };
        }
      }
    }
  }

  return null;
}
