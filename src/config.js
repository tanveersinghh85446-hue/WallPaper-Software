// Images ya thumbnails baad me CDN (R2, Cloudinary...) pe daalni ho to .env me ye set karo:
//   VITE_IMAGE_BASE=https://cdn.example.com/images
//   VITE_THUMB_BASE=https://cdn.example.com/thumbs
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE || "/images";
const THUMB_BASE = import.meta.env.VITE_THUMB_BASE || "/thumbs";

export const fullUrl = (img) =>
  `${IMAGE_BASE}/${img.file.split("/").map(encodeURIComponent).join("/")}`;

export const thumbUrl = (img) => `${THUMB_BASE}/${img.thumb}.webp`;

export const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
