/**
 * render-gallery.js
 * Renders the photo gallery grid and manages the lightbox.
 *
 * Photo sources (merged in order):
 *   1. images/gallery/manifest.json  — auto-scanned local files
 *                                      (regenerate with: node scripts/scan-gallery.js)
 *   2. js/data/photos.js urlPhotos   — manually specified URL-hosted photos
 */

import { urlPhotos } from '../data/photos.js';
import exifr from 'https://cdn.jsdelivr.net/npm/exifr@7/dist/full.esm.js';

let currentIndex = 0;
let photos       = [];  // populated in renderGallery()
let exifCache    = [];  // parallel array caching formatted EXIF strings

/* ── EXIF ─────────────────────────────────────────────────── */

async function fetchExif(src) {
  try {
    const exif = await exifr.parse(src, {
      pick: ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ISO', 'ExposureTime'],
    });
    if (!exif) return null;
    return formatExif(exif);
  } catch {
    return null;
  }
}

function formatExif(exif) {
  const parts = [];
  if (exif.Model)          parts.push(exif.Model.trim());
  if (exif.LensModel)      parts.push(exif.LensModel.trim());
  if (exif.FocalLength != null) parts.push(`${Math.round(exif.FocalLength)}mm`);
  if (exif.FNumber != null) {
    const f = exif.FNumber;
    parts.push(`f/${Number.isInteger(f) ? f : f.toFixed(1)}`);
  }
  if (exif.ExposureTime != null) {
    const t = exif.ExposureTime;
    parts.push(t >= 1 ? `${t}s` : `1/${Math.round(1 / t)}s`);
  }
  if (exif.ISO != null) parts.push(`ISO\u00a0${exif.ISO}`);
  return parts.length ? parts.join(' · ') : null;
}

/* ── Gallery ──────────────────────────────────────────────── */

/**
 * Reorder photos so they stripe across columns rather than filling one
 * column at a time.  CSS `columns` lays items out top-to-bottom within
 * each column in source order, so without reordering the first ~N/cols
 * photos all appear in the left column before any appear to the right.
 *
 * After reordering, source positions 0..numRows-1 land in column 1,
 * positions numRows..2*numRows-1 in column 2, etc., which means the
 * photos at the *top of every column* are those that were originally
 * adjacent — so the gallery fills row-by-row as images arrive.
 */
function reorderForColumns(arr, numCols) {
  if (numCols <= 1) return arr;
  const numRows = Math.ceil(arr.length / numCols);
  const result  = [];
  for (let col = 0; col < numCols; col++) {
    for (let row = 0; row < numRows; row++) {
      const idx = row * numCols + col;
      if (idx < arr.length) result.push(arr[idx]);
    }
  }
  return result;
}

function getColumnCount() {
  const w = window.innerWidth;
  if (w <= 580) return 1;
  if (w <= 900) return 2;
  return 3;
}

export async function renderGallery() {
  // 1. Fetch auto-scanned local photos from manifest
  const localPhotos = await fetch('/images/gallery/manifest.json')
    .then(r => r.ok ? r.json() : [])
    .catch(() => []);

  // 2. Merge with URL-hosted photos, then stripe across columns so the
  //    gallery fills left-to-right rather than top-to-bottom per column.
  photos    = reorderForColumns([...localPhotos, ...urlPhotos], getColumnCount());
  exifCache = new Array(photos.length).fill(undefined);

  const grid  = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');
  if (!grid) return;

  if (photos.length === 0) {
    grid.hidden = true;
    if (empty) empty.hidden = false;
    return;
  }

  const numCols = getColumnCount();
  const numRows = Math.ceil(photos.length / numCols);

  grid.innerHTML = photos.map((photo, i) => {
    // Items in the same visual row share the same delay so they fade in together.
    const rowDelay = (i % numRows) * 60;
    const imgAttrs = `alt="${photo.alt}" loading="lazy" decoding="async"`;
    const imgHtml  = photo.fallback
      ? `<picture>
          <source srcset="${photo.src}" type="image/avif" media="(dynamic-range: high)">
          <img src="${photo.fallback}" ${imgAttrs}>
        </picture>`
      : `<img src="${photo.src}" ${imgAttrs}>`;
    return `
    <div class="gallery-item fade-in" data-index="${i}" style="--delay: ${rowDelay}ms">
      ${imgHtml}
      <div class="gallery-item__exif" id="exif-${i}"></div>
    </div>`;
  }).join('');

  // Load EXIF for each photo asynchronously (non-blocking)
  photos.forEach((photo, i) => {
    fetchExif(photo.src).then(text => {
      exifCache[i] = text ?? null;
      const el = document.getElementById(`exif-${i}`);
      if (el && text) el.textContent = text;
    });
  });

  grid.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => openLightbox(Number(item.dataset.index)));
  });

  initLightbox();
}

/* ── Lightbox ─────────────────────────────────────────────── */

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const close    = document.getElementById('lightbox-close');
  const backdrop = document.getElementById('lightbox-backdrop');
  const prev     = document.getElementById('lightbox-prev');
  const next     = document.getElementById('lightbox-next');

  if (!lightbox) return;

  lightbox.dataset.count = photos.length;

  const closeLightbox = () => {
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const navigate = dir => {
    currentIndex = (currentIndex + dir + photos.length) % photos.length;
    showPhoto(currentIndex);
  };

  close?.addEventListener('click', closeLightbox);
  backdrop?.addEventListener('click', closeLightbox);
  prev?.addEventListener('click', () => navigate(-1));
  next?.addEventListener('click', () => navigate(1));

  document.addEventListener('keydown', e => {
    if (lightbox.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });
}

function showPhoto(index) {
  const img     = document.getElementById('lightbox-img');
  const exifBar = document.getElementById('lightbox-exif');

  const photo = photos[index];
  const useHdr = photo.fallback
    ? window.matchMedia('(dynamic-range: high)').matches
    : true;
  img.src = (photo.fallback && !useHdr) ? photo.fallback : photo.src;
  img.alt = photo.alt;

  if (exifBar) {
    const cached = exifCache[index];
    if (cached !== undefined) {
      exifBar.textContent = cached ?? '';
    } else {
      exifBar.textContent = '';
      fetchExif(photos[index].src).then(text => {
        exifCache[index] = text ?? null;
        if (currentIndex === index) exifBar.textContent = text ?? '';
      });
    }
  }
}

function openLightbox(index) {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  currentIndex = index;
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  showPhoto(index);
}
