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
  const stride = width * 4 + 1;
  const rawData = Buffer.alloc(stride * height);

  const setPixel = (x, y, r, g, b, a = 255) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const offset = y * stride + 1 + x * 4;
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

  // Background rounded squircle (Deep Indigo #4f46e5 to Royal Violet #7c3aed)
  const bgX = 12 * scale;
  const bgY = 12 * scale;
  const bgW = 104 * scale;
  const bgH = 104 * scale;
  const bgR = 28 * scale;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = Math.max(bgX + bgR - x, 0, x - (bgX + bgW - bgR));
      const dy = Math.max(bgY + bgR - y, 0, y - (bgY + bgH - bgR));
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= bgR) {
        const t = (x + y) / (width + height);
        const r = Math.round(79 + t * (124 - 79));
        const g = Math.round(70 + t * (58 - 70));
        const b = Math.round(229 + t * (237 - 229));
        const alpha = Math.min(255, Math.max(0, Math.round((bgR - dist + 0.5) * 255)));
        setPixel(x, y, r, g, b, alpha);
      }
    }
  }

  // Draw rounded card helper
  const drawCard = (cx, cy, cw, ch, cr, r, g, b, a) => {
    for (let y = Math.floor(cy); y <= Math.ceil(cy + ch); y++) {
      for (let x = Math.floor(cx); x <= Math.ceil(cx + cw); x++) {
        const dx = Math.max(cx + cr - x, 0, x - (cx + cw - cr));
        const dy = Math.max(cy + cr - y, 0, y - (cy + ch - cr));
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= cr) {
          const edgeAlpha = Math.min(1, Math.max(0, cr - dist + 0.5));
          setPixel(x, y, r, g, b, Math.round(a * edgeAlpha));
        }
      }
    }
  };

  // Back Stash Card (Layer 1)
  drawCard(36 * scale, 38 * scale, 56 * scale, 32 * scale, 7 * scale, 255, 255, 255, 70);

  // Mid Stash Card (Layer 2)
  drawCard(36 * scale, 44 * scale, 56 * scale, 34 * scale, 7 * scale, 255, 255, 255, 120);

  // Front Vault Card (Layer 3 - Solid Clean White)
  drawCard(36 * scale, 50 * scale, 56 * scale, 42 * scale, 8 * scale, 255, 255, 255, 250);

  // Microchip Accent (Gold-Indigo Microchip)
  drawCard(43 * scale, 58 * scale, 13 * scale, 11 * scale, 2.5 * scale, 79, 70, 229, 230);

  // Fill Lightning / Arrow (Swift fill symbol)
  // Polygon vertices: [75, 55], [64, 71], [72, 71], [67, 87], [83, 69], [75, 69], [78, 55]
  const poly = [
    [75, 55],
    [64, 71],
    [72, 71],
    [67, 87],
    [83, 69],
    [75, 69],
    [78, 55],
  ].map(([px, py]) => [px * scale, py * scale]);

  const minX = Math.floor(62 * scale);
  const maxX = Math.ceil(85 * scale);
  const minY = Math.floor(54 * scale);
  const maxY = Math.ceil(89 * scale);

  const pointInPoly = (px, py) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0],
        yi = poly[i][1];
      const xj = poly[j][0],
        yj = poly[j][1];
      const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointInPoly(x + 0.5, y + 0.5)) {
        setPixel(x, y, 99, 102, 241, 255);
      }
    }
  }

  // Green Privacy Status Badge (Offline Mode) at top-right
  const badgeX = 94 * scale;
  const badgeY = 34 * scale;
  const badgeR = Math.max(1.5, 5.5 * scale);

  for (let y = Math.floor(badgeY - badgeR - 2); y <= Math.ceil(badgeY + badgeR + 2); y++) {
    for (let x = Math.floor(badgeX - badgeR - 2); x <= Math.ceil(badgeX + badgeR + 2); x++) {
      const dist = Math.sqrt((x - badgeX) ** 2 + (y - badgeY) ** 2);
      if (dist <= badgeR + 1.2 * scale) {
        if (dist > badgeR) {
          // White border ring
          setPixel(x, y, 255, 255, 255, 255);
        } else {
          // Emerald Green core (#10b981)
          setPixel(x, y, 16, 185, 129, 255);
        }
      }
    }
  }

  // Assemble PNG File
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createPngChunk('IHDR', ihdrData);
  const compressedData = deflateSync(rawData, { level: 9 });
  const idatChunk = createPngChunk('IDAT', compressedData);
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

const SIZES = [16, 32, 48, 128];
console.log('Generating deterministic Stashfill PNG icons from brand specification...');

for (const size of SIZES) {
  const png = renderStashfillIcon(size);
  const outPath = join(ICONS_DIR, `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`Generated: public/icons/icon-${size}.png (${png.length} bytes)`);
}

console.log('Icon generation successfully completed.');
