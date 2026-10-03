// public/images ki saari images scan karke title/keywords banati hai, thumbnails banati hai
// aur public/images.json likhti hai.
//
//   npm run generate          -> thumbnails + images.json
//   npm run generate:fast     -> sirf images.json (thumbnails nahi)
//
// Title/keywords ke source (priority order):
//   1. metadata.csv        (Excel me haath se edit kiya hua, npm run export-csv se banta hai)
//   2. filename            (red-ferrari-sunset.jpg -> "red ferrari sunset")
//   3. scripts/ai-tags.json (npm run tag se: AI image dekh ke tags banata hai)

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  AI_FILE,
  IMG_DIR,
  ROOT,
  filenameWords,
  imageFiles,
  loadCsvOverrides,
  loadJson,
  relPath,
  words,
} from "./lib.js";

const THUMBS = path.join(ROOT, "public", "thumbs");
const OUT = path.join(ROOT, "public", "images.json");
const MAKE_THUMBS = !process.argv.includes("--no-thumbs");

if (!fs.existsSync(IMG_DIR)) {
  console.error(
    "public/images folder nahi mila. Pehle apni images wahan daalo.",
  );
  process.exit(1);
}

// AI labels "a mountain", "an anime character" jaise hote hain. Title/tags me "a", "an", "the" hata dete hain.
const stripArticle = (s) => s.replace(/^(a|an|the)\s+/i, "").trim();

const ai = loadJson(AI_FILE, {});
const csv = loadCsvOverrides();

let sharp = null;
if (MAKE_THUMBS) {
  try {
    sharp = (await import("sharp")).default;
    fs.mkdirSync(THUMBS, { recursive: true });
  } catch {
    console.warn("sharp load nahi hua, thumbnails skip ho rahe hain.");
  }
}

const files = imageFiles();
console.log(`${files.length} images mili.`);

let untitled = 0;
const data = files.map((file, i) => {
  const rel = relPath(file);
  const parts = rel.split("/");
  const folders = parts.slice(0, -1);
  const fileName = parts[parts.length - 1];

  const fw = filenameWords(fileName);
  const raw = ai[rel];
  const a = raw && {
    title: stripArticle(raw.title || ""),
    tags: (raw.tags || []).map(stripArticle),
  };
  const c = csv[rel];

  const title =
    c?.title ||
    (fw.length ? fw.join(" ") : a?.title) ||
    `${folders[0] || "wallpaper"} wallpaper`;
  if (!c?.title && !fw.length && !a?.title) untitled++;

  const keywords = [
    ...new Set([
      ...folders.flatMap(words),
      ...fw,
      ...(a?.tags || []).flatMap(words),
      ...words(c?.tags || ""),
      ...words(c?.title || ""),
    ]),
  ].join(" ");

  return {
    id: i + 1,
    title,
    category: folders[0] || "other",
    keywords,
    file: rel,
    // thumbnail ka naam file path se banta hai, taaki nayi images add karne par purani thumbs mismatch na ho
    thumb: crypto.createHash("md5").update(rel).digest("hex").slice(0, 12),
  };
});

if (sharp) {
  let done = 0;
  let skipped = 0;
  const queue = [...data];
  const worker = async () => {
    while (queue.length) {
      const item = queue.shift();
      const out = path.join(THUMBS, `${item.thumb}.webp`);
      if (fs.existsSync(out)) {
        skipped++;
        continue;
      }
      try {
        await sharp(path.join(IMG_DIR, ...item.file.split("/")))
          .rotate() // phone ki photos ka EXIF rotation theek karta hai
          .resize({ width: 480, withoutEnlargement: true })
          .webp({ quality: 72 })
          .toFile(out);
      } catch (err) {
        console.warn(`Thumb fail: ${item.file} (${err.message})`);
      }
      if (++done % 200 === 0) console.log(`  ${done} thumbnails ban gayi...`);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(`Thumbnails: ${done} nayi, ${skipped} pehle se thi.`);
}

fs.writeFileSync(OUT, JSON.stringify(data));
console.log(
  `Ho gaya: public/images.json (${data.length} images, thumbs: ${sharp ? "haan" : "nahi"})`,
);

if (untitled > 0) {
  console.log(
    `\nDhyan do: ${untitled} images ka koi title/tag nahi bana (filename me kuch kaam ka naam nahi hai).\n` +
      `Inpe search nahi chalegi. Do raaste:\n` +
      `  1. AI se tag karo:  npm install -D @huggingface/transformers   phir   npm run tag\n` +
      `  2. Haath se likho:  npm run export-csv, metadata.csv Excel me bharo, phir npm run generate`,
  );
}
