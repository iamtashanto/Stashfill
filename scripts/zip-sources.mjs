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

const excludePatterns = [
  'node_modules/*',
  '.output/*',
  '.wxt/*',
  'dist/*',
  'coverage/*',
  '.v8-coverage/*',
  'test-results/*',
  'playwright-report/*',
  '.git/*',
  '*.log',
  '.DS_Store',
];

const args = ['-r', ZIP_PATH, '.', '-x', ...excludePatterns];

const result = spawnSync('zip', args, {
  cwd: ROOT_DIR,
  stdio: 'inherit',
});

if (result.status !== 0) {
  console.error('Failed to create sources zip using zip CLI.');
  process.exit(result.status ?? 1);
}

console.log(`\nSuccessfully created clean sources zip at:\n${ZIP_PATH}\n`);

