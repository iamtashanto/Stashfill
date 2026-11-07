#!/usr/bin/env node
/* global process, console */
/**
 * Code Safety & Zero-Network CI Verification Script
 * Fails the build (exit code 1) if any forbidden network, dynamic execution,
 * or unsafe DOM injection primitives appear in production source files (`src/` and `entrypoints/`).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT_DIR = process.cwd();
const SCAN_DIRS = ['src', 'entrypoints'];

const FORBIDDEN_PATTERNS = [
  { name: 'fetch', regex: /\bfetch\s*\(/ },
  { name: 'XMLHttpRequest', regex: /\bXMLHttpRequest\b/ },
  { name: 'WebSocket', regex: /\bWebSocket\b/ },
  { name: 'eval', regex: /\beval\s*\(/ },
  { name: 'new Function', regex: /\bnew\s+Function\b/ },
  { name: 'innerHTML assignment', regex: /\.innerHTML\s*=/ },
];

function collectSourceFiles(dirPath) {
  const results = [];
  for (const entry of readdirSync(dirPath)) {
    const fullPath = join(dirPath, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...collectSourceFiles(fullPath));
    } else if (
      /\.(ts|tsx|js|jsx|mjs)$/.test(entry) &&
      !entry.endsWith('.test.ts') &&
      !entry.endsWith('.test.tsx') &&
      !entry.endsWith('.spec.ts')
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

let violations = 0;

for (const dir of SCAN_DIRS) {
  const absDir = join(ROOT_DIR, dir);
  const files = collectSourceFiles(absDir);

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, idx) => {
      // Strip single-line comments before matching
      const codeOnly = line.replace(/\/\/.*$/, '');
      for (const rule of FORBIDDEN_PATTERNS) {
        if (rule.regex.test(codeOnly)) {
          console.error(
            `[CODE-SAFETY VIOLATION] ${relative(ROOT_DIR, file)}:${idx + 1} -> Forbidden "${rule.name}": ${line.trim()}`,
          );
          violations++;
        }
      }
    });
  }
}

if (violations > 0) {
  console.error(`\nCode safety check failed with ${violations} violation(s).`);
  process.exit(1);
} else {
  console.log(
    'Code safety check passed: zero fetch, XMLHttpRequest, WebSocket, eval, new Function, or innerHTML assignments in production source.',
  );
}
