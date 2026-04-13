/**
 * photos.js — URL-hosted photos
 *
 * Use this file for photos hosted outside the repo
 * (e.g. your own file server, CDN, etc.).
 *
 * Photos stored locally in images/gallery/ are handled automatically —
 * just drop the file in that folder and run:
 *
 *   node scripts/scan-gallery.js
 *
 * Fields:
 *   src  {string}  Full URL to the image
 *   alt  {string}  Descriptive alt text (accessibility + SEO)
 *
 * URL photos are appended after local photos in the gallery.
 */

export const urlPhotos = [

  // { src: 'https://files.crjakob.com/photos/my-photo.avif', alt: 'Description' },
  { src: 'https://fs.crjakob.com/background.JPG', alt: 'Test' }
];
