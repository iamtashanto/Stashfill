#!/usr/bin/env node
/* global process, console */
/**
 * Stashfill Icon Generator
 * Deterministically generates valid PNG icons (16, 32, 48, 128)
 * matching public/icons/icon.svg using pure Node built-in zlib (zero dependencies).
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { Buffer } from 'node:buffer';

const ROOT_DIR = process.cwd();
const ICONS_DIR = join(ROOT_DIR, 'public/icons');
mkdirSync(ICONS_DIR, { recursive: true });

// CRC32 implementation for PNG chunks
const CRC_TABLE = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function createPngChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function renderStashfillIcon(size) {
  const width = size;
  const height = size;
  // RGBA buffer: (width * 4 + 1 filter byte) per row
  const stride = width * 4 + 1;
  const rawData = Buffer.alloc(stride * height);

  const setPixel = (x, y, r, g, b, a = 255) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const offset = y * stride + 1 + x * 4;
    // Simple alpha blending
    const curA = rawData[offset + 3] / 255;
    const newA = a / 255;
    const outA = newA + curA * (1 - newA);
    if (outA <= 0) return;

    rawData[offset] = Math.round((r * newA + rawData[offset] * curA * (1 - newA)) / outA);
    rawData[offset + 1] = Math.round((g * newA + rawData[offset + 1] * curA * (1 - newA)) / outA);
    rawData[offset + 2] = Math.round((b * newA + rawData[offset + 2] * curA * (1 - newA)) / outA);
    rawData[offset + 3] = Math.round(outA * 255);
  };

  const scale = size / 128;

  // Background rounded rectangle (Indigo gradient: #4f46e5 to #6366f1)
  const bgX = 8 * scale;
  const bgY = 8 * scale;
  const bgW = 112 * scale;
  const bgH = 112 * scale;
  const bgR = 28 * scale;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Check rounded rect distance
      const dx = Math.max(bgX + bgR - x, 0, x - (bgX + bgW - bgR));
      const dy = Math.max(bgY + bgR - y, 0, y - (bgY + bgH - bgR));
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= bgR) {
        // Linear gradient between #4f46e5 (79, 70, 229) and #6366f1 (99, 102, 241)
        const t = (x + y) / (width + height);
        const r = Math.round(79 + t * (99 - 79));
        const g = Math.round(70 + t * (102 - 70));
        const b = Math.round(229 + t * (241 - 229));
        const alpha = Math.min(255, Math.max(0, Math.round((bgR - dist + 0.5) * 255)));
        setPixel(x, y, r, g, b, alpha);
      }
    }
  }

  // White Shackle (arch at x:44..84, y:16..44)
  const shackleStroke = Math.max(1, Math.round(8 * scale));
  const cx = 64 * scale;
  const shackleRadius = 20 * scale;
  const shackleTopY = 32 * scale;

  for (let y = Math.floor(16 * scale); y <= Math.ceil(48 * scale); y++) {
    for (let x = Math.floor(36 * scale); x <= Math.ceil(92 * scale); x++) {
      if (y <= shackleTopY) {
        const d = Math.abs(Math.sqrt((x - cx) ** 2 + (y - shackleTopY) ** 2) - shackleRadius);
        if (d <= shackleStroke / 2) {
          setPixel(x, y, 255, 255, 255, 255);
        }
      } else {
        // Vertical shackle bars
        const leftDist = Math.abs(x - (cx - shackleRadius));
        const rightDist = Math.abs(x - (cx + shackleRadius));
        if (leftDist <= shackleStroke / 2 || rightDist <= shackleStroke / 2) {
          setPixel(x, y, 255, 255, 255, 255);
        }
      }
    }
  }

  // Vault White Box (x:28, y:44, w:72, h:52, rx:12)
  const boxX = 28 * scale;
  const boxY = 44 * scale;
  const boxW = 72 * scale;
  const boxH = 52 * scale;
  const boxR = 12 * scale;

  for (let y = Math.floor(boxY); y <= Math.ceil(boxY + boxH); y++) {
    for (let x = Math.floor(boxX); x <= Math.ceil(boxX + boxW); x++) {
      const dx = Math.max(boxX + boxR - x, 0, x - (boxX + boxW - boxR));
      const dy = Math.max(boxY + boxR - y, 0, y - (boxY + boxH - boxR));
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= boxR) {
        setPixel(x, y, 255, 255, 255, 245);
      }
    }
  }

  // Keyhole circle & rect in indigo (#4f46e5)
  const keyholeY = 66 * scale;
  const keyholeR = Math.max(1, 6 * scale);
  for (let y = Math.floor(keyholeY - keyholeR); y <= Math.ceil(keyholeY + keyholeR * 2.2); y++) {
    for (let x = Math.floor(cx - keyholeR); x <= Math.ceil(cx + keyholeR); x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - keyholeY) ** 2);
      const isRect =
        y >= keyholeY && y <= keyholeY + 14 * scale && Math.abs(x - cx) <= Math.max(1, 3 * scale);
      if (dist <= keyholeR || isRect) {
        setPixel(x, y, 79, 70, 229, 255);
      }
    }
  }

  // Green privacy badge (#10b981) at top-right (cx: 92, cy: 36, r: 6)
  const badgeX = 92 * scale;
  const badgeY = 36 * scale;
  const badgeR = Math.max(1.5, 6 * scale);
  for (let y = Math.floor(badgeY - badgeR); y <= Math.ceil(badgeY + badgeR); y++) {
    for (let x = Math.floor(badgeX - badgeR); x <= Math.ceil(badgeX + badgeR); x++) {
      const dist = Math.sqrt((x - badgeX) ** 2 + (y - badgeY) ** 2);
      if (dist <= badgeR) {
        setPixel(x, y, 16, 185, 129, 255);
      }
    }
  }

  // Assemble PNG File
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, 8 bit, RGBA (6), deflated (0), filter (0), no interlace (0)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  // IDAT: deflated raw pixel scanlines
  const compressedData = deflateSync(rawData, { level: 9 });
  const idatChunk = createPngChunk('IDAT', compressedData);

  // IEND
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

const SIZES = [16, 32, 48, 128];
console.log('Generating deterministic Stashfill PNG icons from brand specification...');

for (const size of SIZES) {
  const png = renderStashfillIcon(size);
  const outPath = join(ICONS_DIR, `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`  -> Generated icon-${size}.png (${png.length} bytes)`);
}

console.log('Icons generated successfully.\n');
