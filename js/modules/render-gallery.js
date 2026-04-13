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

export async function renderGallery() {
  // 1. Fetch auto-scanned local photos from manifest
  const localPhotos = await fetch('/images/gallery/manifest.json')
    .then(r => r.ok ? r.json() : [])
    .catch(() => []);

  // 2. Merge with URL-hosted photos
  photos    = [...localPhotos, ...urlPhotos];
  exifCache = new Array(photos.length).fill(undefined);

  const grid  = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');
  if (!grid) return;

  if (photos.length === 0) {
    grid.hidden = true;
    if (empty) empty.hidden = false;
    return;
  }

  grid.innerHTML = photos.map((photo, i) => `
    <div class="gallery-item fade-in" data-index="${i}" style="--delay: ${i * 60}ms">
      <img src="${photo.src}" alt="${photo.alt}" loading="lazy">
      <div class="gallery-item__exif" id="exif-${i}"></div>
    </div>
  `).join('');

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

  img.src = photos[index].src;
  img.alt = photos[index].alt;

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
