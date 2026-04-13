/**
 * projects.js — Project data
 *
 * Add a project by appending an object to the array below.
 *
 * Fields:
 *   id       {string}   Unique identifier (used internally)
 *   title    {string}   Display name
 *   desc     {string}   Short description, 1–2 sentences
 *   tags     {string[]} Tech stack / category labels
 *   links    {object}   { github?: string, live?: string }
 *   image    {string|null} Path to image (e.g. "/images/projects/foo.png"), or null
 */

export const projects = [
  {
    id: 'polytrackmods',
    title: 'PolyTrack Mods',
    desc: 'A collection of mods for PolyTrack that use PolyModLoader',
    tags: ['JavaScript', 'Game Modding'],
    links: {
      codeberg: 'https://codeberg.org/CRJakob/jakobspolymods',
    },
    image: null,
  },

  // ── Add more projects here ──────────────────────────────────
  // {
  //   id: 'my-project',
  //   title: 'My Project',
  //   desc: 'A short description of what this project does.',
  //   tags: ['TypeScript', 'React'],
  //   links: {
  //     github: 'https://github.com/crjakob/my-project',
  //     live:   'https://my-project.com',
  //   },
  //   image: '/images/projects/my-project.png',
  // },
];
