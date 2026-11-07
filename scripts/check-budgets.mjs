#!/usr/bin/env node
/* global process, console */
/**
 * Stashfill Performance Budgets Verification Script
 * Validates hard production performance budgets:
 * 1. Content script bundle size: <= 60 KB gzipped (61,440 bytes)
 * 2. Matcher scan speed: 200 inputs < 50 ms
 * 3. Popup first render: 200 saved fields < 100 ms
 * 4. Memory leak check: No continuous memory growth after 100 fill/undo cycles
 * Fails the build (exit code 1) if any budget is exceeded.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const MAX_CONTENT_SCRIPT_GZIP_BYTES = 60 * 1024; // 60 KB

console.log('====================================================================');
console.log('STASHFILL PRODUCTION PERFORMANCE BUDGET VERIFICATION');
console.log('====================================================================\n');

// 1. Verify / Build extension if output missing
const contentScriptPath = join(ROOT_DIR, '.output/chrome-mv3/content-scripts/content.js');
if (!existsSync(contentScriptPath)) {
  console.log('Building Chrome MV3 extension for budget verification...');
  const buildResult = spawnSync('pnpm', ['wxt', 'build'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });
  if (buildResult.status !== 0) {
    console.error('Failed to build extension for budget check.');
    process.exit(1);
  }
}

// 2. Measure Content Script Gzipped Size
const raw = readFileSync(contentScriptPath);
const gzipped = gzipSync(raw);
const rawKb = (raw.length / 1024).toFixed(2);
const gzipKb = (gzipped.length / 1024).toFixed(2);
const maxGzipKb = (MAX_CONTENT_SCRIPT_GZIP_BYTES / 1024).toFixed(0);
const gzipPassed = gzipped.length <= MAX_CONTENT_SCRIPT_GZIP_BYTES;

console.log('1. Content Script Bundle Size:');
console.log(`   - Raw Size:     ${rawKb} KB`);
console.log(
  `   - Gzipped Size: ${gzipKb} KB (Budget: <= ${maxGzipKb} KB) -> ${gzipPassed ? 'PASS' : 'FAIL'}`,
);

if (!gzipPassed) {
  console.error(`\nFAIL: Content script exceeded ${maxGzipKb} KB gzipped limit!`);
  process.exit(1);
}

// 3. Execute Budgets Test Suite for Matcher, Popup, and Memory growth
console.log('\n2. Executing Runtime Budgets (Matcher < 50ms, Popup < 100ms, Memory Leak Check)...');
const testResult = spawnSync('pnpm', ['vitest', 'run', 'src/test/budgets.test.ts'], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
});

if (testResult.status !== 0) {
  console.error('\nFAIL: One or more runtime performance budgets exceeded.');
  process.exit(testResult.status ?? 1);
}

console.log('\n====================================================================');
console.log('SUMMARY: All performance budgets strictly satisfied:');
console.log(`- Content Script Size: ${gzipKb} KB gzipped <= 60 KB [PASS]`);
console.log(`- Matcher Scan 200 Inputs: < 50 ms [PASS]`);
console.log(`- Popup First Render (200 fields): < 100 ms [PASS]`);
console.log(`- Memory Growth (100 cycles): Bounded / Zero Leaks [PASS]`);
console.log('====================================================================\n');
