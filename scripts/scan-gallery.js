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

// ── Scan ──────────────────────────────────────────────────────

const files = fs.readdirSync(GALLERY_DIR)
  .filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
  .sort() // alphabetical = deterministic order
  .map(f => ({
    src: `/images/gallery/${f}`,
    alt: '',                       // fill in descriptions if you want SEO/accessibility
  }));

fs.writeFileSync(MANIFEST, JSON.stringify(files, null, 2) + '\n');

console.log(`✓ manifest.json updated — ${files.length} photo(s) found`);
files.forEach(p => console.log(`  ${p.src}`));
