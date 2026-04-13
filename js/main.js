/**
 * main.js — Application entry point
 *
 * Bootstraps all modules and sets up global behaviors.
 * Import order: nav → render → animations
 */

import { renderProjects } from './modules/render-projects.js';
import { renderGallery }  from './modules/render-gallery.js';

/* ── Nav scroll effect ────────────────────────────────────── */

function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const update = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', update, { passive: true });
  update(); // run once immediately
}

/* ── Scroll-triggered fade-in (IntersectionObserver) ─────── */

function initFadeIns() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
  );

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ── Boot ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  renderProjects();
  await renderGallery(); // async: fetches manifest.json before rendering

  // Observe after all dynamic content is in the DOM
  requestAnimationFrame(initFadeIns);
});
