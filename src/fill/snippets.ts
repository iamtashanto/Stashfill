import type { Snippet } from '../core/schemas/vault';

export interface ExpandedSnippet {
  text: string;
  cursorOffset: number | null;
}

/**
 * Expands variables {{date}}, {{time}}, {{datetime}}, and {{cursor}} inside a snippet content string.
 * Returns the expanded text and the character offset where the cursor should be placed (if {{cursor}} was present).
 */
export function expandSnippetVariables(content: string, now = new Date()): ExpandedSnippet {
  const dateStr = now.toISOString().slice(0, 10);
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${mins}`;
  const dateTimeStr = `${dateStr} ${timeStr}`;

  const withDates = content
    .replace(/\{\{\s*date\s*\}\}/gi, dateStr)
    .replace(/\{\{\s*time\s*\}\}/gi, timeStr)
    .replace(/\{\{\s*datetime\s*\}\}/gi, dateTimeStr);

  const cursorMatch = /\{\{\s*cursor\s*\}\}/i.exec(withDates);
  if (cursorMatch && typeof cursorMatch.index === 'number') {
    const text =
      withDates.slice(0, cursorMatch.index) +
      withDates.slice(cursorMatch.index + cursorMatch[0].length);
    return {
      text,
      cursorOffset: cursorMatch.index,
    };
  }

  return {
    text: withDates,
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
