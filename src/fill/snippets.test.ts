import { describe, it, expect } from 'vitest';
import { expandSnippetVariables, findMatchingSnippetTrigger } from './snippets';
import type { Snippet } from '../core/schemas/vault';

describe('Snippet Engine and Variable Expander', () => {
  it('expands {{date}}, {{time}}, {{datetime}}, {{year}}, {{month}}, and {{day}}', () => {
    const fixedDate = new Date(2026, 10, 14, 15, 30); // 2026-11-14 15:30
    const template = 'Date: {{date}}, Time: {{time}}, DT: {{datetime}}, Y: {{year}}, M: {{month}}, D: {{day}}';
    const result = expandSnippetVariables(template, fixedDate);

    expect(result.text).toBe(
      'Date: 2026-11-14, Time: 15:30, DT: 2026-11-14 15:30, Y: 2026, M: 11, D: 14',
    );
    expect(result.cursorOffset).toBeNull();
  });

  it('correctly handles {{cursor}} offset and removes the token', () => {
    const template = 'Hello {{cursor}}, how are you?';
    const result = expandSnippetVariables(template);

    expect(result.text).toBe('Hello , how are you?');
    expect(result.cursorOffset).toBe(6);
  });

  it('expands {{uuid}} to a valid UUID v4 string', () => {
    const template = 'Request ID: {{uuid}}';
    const result = expandSnippetVariables(template);

    const uuidRegex = /Request ID: [0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
    expect(result.text).toMatch(uuidRegex);
  });

  it('expands {{random:min,max}} to an integer in the specified range', () => {
    const template = 'Code: {{random:1000,9999}}';
    const result = expandSnippetVariables(template);

    const match = /Code: (\d+)/.exec(result.text);
    expect(match).not.toBeNull();
    const val = parseInt(match![1], 10);
    expect(val).toBeGreaterThanOrEqual(1000);
    expect(val).toBeLessThanOrEqual(9999);
  });

  it('matches snippet triggers at cursor boundary with prefix', () => {
    const snippets: Snippet[] = [
      { id: '1', trigger: 'email', content: 'hello@tashanto.com', folder: 'general' },
      { id: '2', trigger: ';sig', content: 'Best,\nTanvir', folder: 'work' },
    ];

    // Trigger with prefix ';'
    const match1 = findMatchingSnippetTrigger('Please reach me at ;email', snippets, ';');
    expect(match1).not.toBeNull();
    expect(match1?.snippet.id).toBe('1');
    expect(match1?.matchedTrigger).toBe(';email');

    // Exact trigger ';sig'
    const match2 = findMatchingSnippetTrigger('Signing off\n;sig', snippets, ';');
    expect(match2).not.toBeNull();
    expect(match2?.snippet.id).toBe('2');
    expect(match2?.matchedTrigger).toBe(';sig');

    // Should NOT match inside a word (e.g. "my;email" or "somemail")
    const match3 = findMatchingSnippetTrigger('my;email', snippets, ';');
    expect(match3).toBeNull();

    const match4 = findMatchingSnippetTrigger('somemail', snippets, ';');
    expect(match4).toBeNull();
  });
});
