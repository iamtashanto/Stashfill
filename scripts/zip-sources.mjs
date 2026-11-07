#!/usr/bin/env node
/* global process, console */
/**
 * Clean Source Zip Generator for Firefox AMO & Store Reviews
 * Packages clean repository sources excluding node_modules, build outputs, and logs.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT_DIR = process.cwd();
const OUTPUT_DIR = join(ROOT_DIR, '.output');
const ZIP_PATH = join(OUTPUT_DIR, 'stashfill-sources.zip');

mkdirSync(OUTPUT_DIR, { recursive: true });

if (existsSync(ZIP_PATH)) {
  rmSync(ZIP_PATH);
}

console.log('Creating clean sources zip for Mozilla AMO & store review...');

const sourceEntries = [
  'src',
  'entrypoints',
  'public',
  'scripts',
  'docs',
  'store',
  'e2e',
  '.github',
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'wxt.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  'eslint.config.js',
  'playwright.config.ts',
  'vitest.config.ts',
  'README.md',
  'BUILD.md',
  'AUDIT.md',
  'LICENSE',
  'PRIVACY.md',
  'SECURITY.md',
  'THREAT_MODEL.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'ROADMAP.md',
  'CHANGELOG.md',
  'GOOD_FIRST_ISSUES.md',
  'MANUAL_TEST_CHECKLIST.md',
];

const args = ['-r', ZIP_PATH, ...sourceEntries];

const result = spawnSync('zip', args, {
  cwd: ROOT_DIR,
  stdio: 'inherit',
});

if (result.status !== 0) {
  console.error('Failed to create sources zip using zip CLI.');
  process.exit(result.status ?? 1);
}

console.log(`\nSuccessfully created clean sources zip at:\n${ZIP_PATH}\n`);
