/**
 * Generates public/icon-192.png and public/icon-512.png for the PWA manifest.
 * Pure Node (zlib) — no image dependencies. Deep navy background with the
 * cyan + violet wave mark, matching the brand mark in AppLayout.tsx.
 *
 * Run: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// ---- Minimal PNG writer (8-bit RGBA, no interlace) ----
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixelAt) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelAt(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
      raw[o++] = a;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- Icon art ----
const NAVY = [0x14, 0x1b, 0x2e];
const CYAN = [0x00, 0xb8, 0xd4];
const VIOLET = [0x7c, 0x4d, 0xff];

function makeIcon(size) {
  const stroke = size * 0.045;
  const amp1 = size * 0.11;
  const amp2 = size * 0.075;
  const y1 = size * 0.42;
  const y2 = size * 0.63;
  const wavelength = size / 1.5;

  return png(size, (x, y) => {
    const w1 = y1 + amp1 * Math.sin((2 * Math.PI * x) / wavelength);
    const w2 = y2 + amp2 * Math.sin((2 * Math.PI * x) / wavelength + Math.PI / 2);
    if (Math.abs(y - w1) <= stroke) return [...CYAN, 255];
    if (Math.abs(y - w2) <= stroke) return [...VIOLET, 255];
    return [...NAVY, 255];
  });
}

for (const size of [192, 512]) {
  const out = join(here, '..', 'public', `icon-${size}.png`);
  writeFileSync(out, makeIcon(size));
  console.log(`wrote ${out}`);
}
