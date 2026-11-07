#!/usr/bin/env node
/* global process, console */
/**
 * Version Bump & CHANGELOG Automation Script
 * Usage: node scripts/bump-version.mjs [patch|minor|major|<version>]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT_DIR = process.cwd();
const PKG_PATH = join(ROOT_DIR, 'package.json');
const CHANGELOG_PATH = join(ROOT_DIR, 'CHANGELOG.md');

const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
const currentVersion = pkg.version;
const target = process.argv[2] || 'patch';

let [major, minor, patch] = currentVersion.split('.').map(Number);

let newVersion;
if (target === 'major') {
  newVersion = `${major + 1}.0.0`;
} else if (target === 'minor') {
  newVersion = `${major}.${minor + 1}.0`;
} else if (target === 'patch') {
  newVersion = `${major}.${minor}.${patch + 1}`;
} else if (/^\d+\.\d+\.\d+$/.test(target)) {
  newVersion = target;
} else {
  console.error(
    `Invalid version target: "${target}". Expected "major", "minor", "patch", or "x.y.z".`,
  );
  process.exit(1);
}

// 1. Update package.json
pkg.version = newVersion;
writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Bumped version in package.json: ${currentVersion} -> ${newVersion}`);

// 2. Update CHANGELOG.md
const today = new Date().toISOString().slice(0, 10);
let changelog = existsSync(CHANGELOG_PATH) ? readFileSync(CHANGELOG_PATH, 'utf8') : '';

if (!changelog) {
  changelog = `# Changelog

All notable changes to Stashfill will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
`;
}

const newEntry = `## [${newVersion}] - ${today}

### Added
- Cross-browser packaging for Chrome, Edge, and Firefox (MV3).
- Strict code safety verification ensuring zero runtime network calls.
- Encrypted vault storage with PBKDF2-SHA256 and AES-GCM 256.

`;

if (changelog.includes('## [Unreleased]')) {
  changelog = changelog.replace('## [Unreleased]\n', `## [Unreleased]\n\n${newEntry}`);
} else {
  changelog = changelog + `\n\n${newEntry}`;
}

writeFileSync(CHANGELOG_PATH, changelog);
console.log(`Updated CHANGELOG.md with release notes for [${newVersion}].`);
