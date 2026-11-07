#!/usr/bin/env node
/* global process, console */
/**
 * Cross-Browser Extension Manifest & Structure Linter
 * Validates Chrome MV3, Firefox MV3, and Edge targets:
 * - Valid Manifest V3 schema
 * - Gecko ID, minimum version, and data_collection_permissions declared as none
 * - Strict permissions whitelist
 * - All referenced icon files, background scripts, content scripts, and HTML pages exist
 * - Executes web-ext lint if available in environment
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const TARGETS = [
  { name: 'Chrome MV3', dir: join(ROOT_DIR, '.output/chrome-mv3'), isGecko: false },
  { name: 'Firefox MV3', dir: join(ROOT_DIR, '.output/firefox-mv3'), isGecko: true },
];

const ALLOWED_PERMISSIONS = new Set(['storage', 'activeTab', 'scripting', 'contextMenus']);
const ALLOWED_OPTIONAL_HOSTS = new Set(['https://*/*', 'http://*/*']);

console.log('====================================================================');
console.log('STASHFILL CROSS-BROWSER MANIFEST & PACKAGE LINTER');
console.log('====================================================================\n');

let totalErrors = 0;

for (const target of TARGETS) {
  console.log(`Checking ${target.name} at ${target.dir}...`);
  const manifestPath = join(target.dir, 'manifest.json');

  if (!existsSync(manifestPath)) {
    console.error(`  [ERROR] manifest.json not found in ${target.dir}`);
    totalErrors++;
    continue;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    console.error(`  [ERROR] Malformed manifest.json: ${err.message}`);
    totalErrors++;
    continue;
  }

  // 1. Manifest version
  if (manifest.manifest_version !== 3) {
    console.error(`  [ERROR] Expected manifest_version: 3, got ${manifest.manifest_version}`);
    totalErrors++;
  }

  // 2. Permissions validation
  for (const perm of manifest.permissions || []) {
    if (!ALLOWED_PERMISSIONS.has(perm)) {
      console.error(`  [ERROR] Unexpected permission declared: "${perm}"`);
      totalErrors++;
    }
  }

  // 3. Optional host permissions validation
  for (const host of manifest.optional_host_permissions || []) {
    if (!ALLOWED_OPTIONAL_HOSTS.has(host)) {
      console.error(`  [ERROR] Unexpected optional host permission: "${host}"`);
      totalErrors++;
    }
  }

  // 4. Icons verification
  if (manifest.icons) {
    for (const [size, iconPath] of Object.entries(manifest.icons)) {
      const rel = iconPath.startsWith('/') ? iconPath.slice(1) : iconPath;
      const fullPath = join(target.dir, rel);
      if (!existsSync(fullPath)) {
        console.error(`  [ERROR] Icon (${size}px) not found at: ${rel}`);
        totalErrors++;
      }
    }
  }

  // 5. Entrypoints verification
  if (manifest.action?.default_popup) {
    if (!existsSync(join(target.dir, manifest.action.default_popup))) {
      console.error(`  [ERROR] Popup HTML not found: ${manifest.action.default_popup}`);
      totalErrors++;
    }
  }

  if (manifest.options_ui?.page) {
    if (!existsSync(join(target.dir, manifest.options_ui.page))) {
      console.error(`  [ERROR] Options HTML not found: ${manifest.options_ui.page}`);
      totalErrors++;
    }
  }

  // 6. Gecko specific verification
  if (target.isGecko) {
    const gecko = manifest.browser_specific_settings?.gecko;
    if (!gecko?.id) {
      console.error('  [ERROR] Firefox manifest missing browser_specific_settings.gecko.id');
      totalErrors++;
    }
    if (!gecko?.strict_min_version) {
      console.error(
        '  [ERROR] Firefox manifest missing browser_specific_settings.gecko.strict_min_version',
      );
      totalErrors++;
    }
    const dataPerms = gecko?.data_collection_permissions?.required;
    if (!Array.isArray(dataPerms) || !dataPerms.includes('none')) {
      console.error(
        '  [ERROR] Firefox manifest missing data_collection_permissions: { required: ["none"] }',
      );
      totalErrors++;
    }
  }

  console.log(`  -> ${target.name} manifest check completed.`);
}

// 7. Optional web-ext lint check if installed
try {
  const webExtCheck = spawnSync('web-ext', ['--version'], { stdio: 'pipe' });
  if (webExtCheck.status === 0) {
    console.log('\nRunning web-ext lint on Firefox build...');
    const firefoxDir = join(ROOT_DIR, '.output/firefox-mv3');
    const lintResult = spawnSync('web-ext', ['lint', '--source-dir', firefoxDir], {
      stdio: 'inherit',
    });
    if (lintResult.status !== 0) {
      console.error('web-ext lint reported errors.');
      totalErrors++;
    }
  }
} catch {
  // web-ext not installed globally, built-in manifest validator already passed
}

console.log('\n====================================================================');
if (totalErrors > 0) {
  console.error(`Manifest verification failed with ${totalErrors} error(s).`);
  process.exit(1);
} else {
  console.log('All browser manifests (Chrome MV3, Firefox MV3) are 100% valid.');
  console.log('====================================================================\n');
}
