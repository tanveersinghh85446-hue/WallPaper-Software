import fs from "fs";
import path from "path";

export const ROOT = process.cwd();
export const IMG_DIR = path.join(ROOT, "public", "images");
export const AI_FILE = path.join(ROOT, "scripts", "ai-tags.json");
export const CSV_FILE = path.join(ROOT, "metadata.csv");
export const EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

export function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

export const imageFiles = () =>
  walk(IMG_DIR)
    .filter((f) => EXT.test(f))
    .sort((a, b) => a.localeCompare(b));

export const relPath = (file) =>
  path.relative(IMG_DIR, file).split(path.sep).join("/");

// "Red_Ferrari-sunset.01" -> ["red", "ferrari", "sunset"]
export function words(text) {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    .filter((w) => w && !/^\d+$/u.test(w));
}

// Aise filenames jinse kuch pata nahi chalta (IMG_2231, pexels-mikebird-123, DSC0042...)
const NOISE = new Set([
  "pexels",
  "img",
  "dsc",
  "dscn",
  "image",
  "images",
  "photo",
  "photos",
  "wallpaper",
  "untitled",
  "screenshot",
  "pxl",
  "copy",
  "download",
  "unsplash",
  "pixabay",
  "wp",
]);

// Filename se sirf kaam ke words nikalta hai. Pexels files me sirf photographer ka naam hota hai, wo hata deta hai.
export function filenameWords(fileName) {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/\s*\(\d+\)$/, "");
  if (/^pexels-/i.test(base)) return [];
  return words(base).filter((w) => !NOISE.has(w) && w.length > 1);
}

export function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

/* ---------- CSV (Excel me edit karne ke liye) ---------- */

export function parseCsv(text) {
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    if (row.some((x) => x !== "")) rows.push(row);
  }
  return rows;
}

export function toCsv(rows) {
  const esc = (v) =>
    /[",\r\n]/.test(String(v))
      ? `"${String(v).replace(/"/g, '""')}"`
      : String(v);
  return "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n") + "\r\n";
}

// metadata.csv -> { "car/x.jpg": { title, tags } }
export function loadCsvOverrides() {
  if (!fs.existsSync(CSV_FILE)) return {};
  const [head, ...rows] = parseCsv(fs.readFileSync(CSV_FILE, "utf8"));
  if (!head) return {};
  const col = (n) => head.findIndex((h) => h.trim().toLowerCase() === n);
  const [f, t, g] = [col("file"), col("title"), col("tags")];
  if (f < 0) return {};
  const out = {};
  for (const r of rows) {
    const file = (r[f] || "").trim().replace(/\\/g, "/");
    if (!file) continue;
    out[file] = { title: (r[t] || "").trim(), tags: (r[g] || "").trim() };
  }
  return out;
}
