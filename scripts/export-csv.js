// metadata.csv banata hai: har image ki ek row (file, title, tags). Excel me khol ke title/tags
// theek karo ya khali jagah bharo, save karo (CSV format me), phir npm run generate chalao.
// Jis row me title/tags likha hoga wahi use hoga, baaki images apne aap ke tags se chalti rahengi.
//
// Dhyan: pehle npm run generate (aur chaho to npm run tag) chala lo, phir ye.

import fs from "fs";
import path from "path";
import { CSV_FILE, ROOT, loadCsvOverrides, loadJson, toCsv } from "./lib.js";

const data = loadJson(path.join(ROOT, "public", "images.json"), null);
if (!data) {
  console.error("public/images.json nahi mila. Pehle: npm run generate");
  process.exit(1);
}
if (fs.existsSync(CSV_FILE) && !process.argv.includes("--force")) {
  console.error(
    "metadata.csv pehle se hai. Overwrite karne se tera edit chala jayega.\nSach me naya banana hai to:  npm run export-csv -- --force",
  );
  process.exit(1);
}

const old = loadCsvOverrides();
const rows = [["file", "title", "tags"]];
for (const img of data) {
  const o = old[img.file];
  // jinka asli title nahi bana unka title khali chhodo, taaki tu bhar sake (placeholder CSV me na jaye)
  const placeholder = img.title === `${img.category} wallpaper`;
  rows.push([
    img.file,
    o?.title ?? (placeholder ? "" : img.title),
    o?.tags ?? img.keywords,
  ]);
}
fs.writeFileSync(CSV_FILE, toCsv(rows));
console.log(
  `metadata.csv ban gayi (${data.length} rows). Excel me khol ke edit karo.`,
);
