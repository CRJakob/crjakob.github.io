#!/usr/bin/env node
/**
 * scripts/scan-gallery.js
 *
 * Scans images/gallery/ and writes a manifest.json that the site
 * fetches at runtime to populate the photo grid automatically.
 *
 * Usage:
 *   node scripts/scan-gallery.js
 *
 * Run this whenever you add or remove photos from images/gallery/.
 * The generated manifest.json must be committed alongside the images.
 */

const fs   = require('fs');
const path = require('path');

const GALLERY_DIR = path.join(__dirname, '..', 'images', 'gallery');
const MANIFEST    = path.join(GALLERY_DIR, 'manifest.json');

// Supported image extensions
const IMAGE_EXTS = new Set(['.avif', '.jpg', '.jpeg', '.png', '.webp', '.jxl']);

// HDR-capable formats that get paired with an SDR fallback
const HDR_EXTS  = new Set(['.avif']);
const SDR_EXTS  = new Set(['.jpg', '.jpeg']);

// ── Scan ──────────────────────────────────────────────────────

const allFiles = fs.readdirSync(GALLERY_DIR)
  .filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
  .sort(); // alphabetical = deterministic order

// Group by base name (without extension) so we can detect pairs
const byBase = new Map();
for (const f of allFiles) {
  const ext  = path.extname(f).toLowerCase();
  const base = f.slice(0, f.length - ext.length);
  if (!byBase.has(base)) byBase.set(base, {});
  byBase.get(base)[ext] = f;
}

const files = [];
for (const [, exts] of byBase) {
  const hdrFile = [...HDR_EXTS].map(e => exts[e]).find(Boolean) ?? null;
  const sdrFile = [...SDR_EXTS].map(e => exts[e]).find(Boolean) ?? null;
  const anyFile = Object.values(exts)[0];

  if (hdrFile && sdrFile) {
    // Paired: serve HDR AVIF only to HDR-capable displays, JPG otherwise
    files.push({
      src:      `/images/gallery/${hdrFile}`,
      fallback: `/images/gallery/${sdrFile}`,
      alt: '',
    });
  } else {
    files.push({
      src: `/images/gallery/${hdrFile ?? sdrFile ?? anyFile}`,
      alt: '',
    });
  }
}

fs.writeFileSync(MANIFEST, JSON.stringify(files, null, 2) + '\n');

console.log(`✓ manifest.json updated — ${files.length} photo(s) found`);
files.forEach(p => console.log(`  ${p.src}${p.fallback ? ` (fallback: ${p.fallback})` : ''}`));
