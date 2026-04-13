/**
 * render-projects.js
 * Reads the projects array and injects project cards into the DOM.
 */

import { projects } from '../data/projects.js';

/* ── Icon helpers ─────────────────────────────────────────── */

function iconGithub() {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>`;
}

function iconExternal() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>`;
}

/* ── Card template ────────────────────────────────────────── */

function projectCard(project, index) {
  const { title, desc, tags = [], links = {}, image } = project;

  const imageHtml = image
    ? `<img class="project-card__image" src="${image}" alt="${title}" loading="lazy">`
    : '';

  const linksHtml = [
    links.github && `<a href="${links.github}" target="_blank" rel="noopener" class="project-card__link" aria-label="${title} on GitHub" title="GitHub">${iconGithub()}</a>`,
    links.live   && `<a href="${links.live}"   target="_blank" rel="noopener" class="project-card__link" aria-label="${title} live site" title="Live site">${iconExternal()}</a>`,
  ].filter(Boolean).join('');

  const tagsHtml = tags.length
    ? `<div class="project-card__tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`
    : '';

  return `
    <article class="project-card fade-in" style="--delay: ${index * 80}ms">
      ${imageHtml}
      <div class="project-card__header">
        <h3 class="project-card__title">${title}</h3>
        <div class="project-card__links">${linksHtml}</div>
      </div>
      <p class="project-card__desc">${desc}</p>
      ${tagsHtml}
    </article>
  `;
}

/* ── Render ───────────────────────────────────────────────── */

export function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  grid.innerHTML = projects.map(projectCard).join('');
}
