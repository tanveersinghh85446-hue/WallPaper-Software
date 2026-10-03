// Har image ko AI se "dekh" ke title aur tags banata hai. Internet ya API key nahi chahiye.
// Model ek baar download hota hai (~150MB), uske baad sab tere computer par chalta hai.
//
//   npm install -D @huggingface/transformers
//   npm run tag
//
// Beech me band (Ctrl+C) karke dobara chala sakte ho, jo ho chuka wo dobara nahi hota.
// Natija: scripts/ai-tags.json  (phir npm run generate)
//
// Flags:  --limit=30   sirf pehli 30 nayi images (test ke liye)

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { AI_FILE, IMG_DIR, imageFiles, loadJson, relPath } from "./lib.js";
import { buildTags, normalize, pickLabels, vocabKeyFor } from "./tagging.js";

const MODEL = "Xenova/clip-vit-base-patch32";
const LIMIT =
  Number(
    (process.argv.find((a) => a.startsWith("--limit=")) || "").split("=")[1],
  ) || Infinity;

// Dhyan: yahan project ka apna `sharp` import mat karna. AI library apna sharp saath laati hai,
// dono ek process me hon to libvips takra jata hai ("VipsInterpretation" error).
let hf;
try {
  hf = await import("@huggingface/transformers");
} catch {
  console.error(
    "AI library install nahi hai. Pehle ye chalao:\n  npm install -D @huggingface/transformers",
  );
  process.exit(1);
}

const THUMBS = path.join(process.cwd(), "public", "thumbs");
// generate-data.js jaisa hi naam (path ka hash)
const thumbPath = (rel) =>
  path.join(
    THUMBS,
    `${crypto.createHash("md5").update(rel).digest("hex").slice(0, 12)}.webp`,
  );

if (!fs.existsSync(THUMBS)) {
  console.error("Thumbnails nahi mili. Pehle chalao:  npm run generate");
  process.exit(1);
}

if (!fs.existsSync(IMG_DIR)) {
  console.error("public/images folder nahi mila.");
  process.exit(1);
}

const vocab = loadJson(path.join(process.cwd(), "scripts", "vocab.json"), null);
if (!vocab) {
  console.error("scripts/vocab.json nahi mili ya galat hai.");
  process.exit(1);
}

const results = loadJson(AI_FILE, {});
const save = () => fs.writeFileSync(AI_FILE, JSON.stringify(results));
process.on("SIGINT", () => {
  save();
  console.log(
    "\nProgress save ho gayi. Dobara chalane par wahin se shuru hoga.",
  );
  process.exit(0);
});

const files = imageFiles().filter((f) => !results[relPath(f)]);
const missingThumbs = files.filter(
  (f) => !fs.existsSync(thumbPath(relPath(f))),
).length;
if (missingThumbs) {
  console.error(
    `${missingThumbs} images ki thumbnail nahi bani hai. Pehle chalao:  npm run generate`,
  );
  process.exit(1);
}
const todo = files.slice(0, LIMIT);
console.log(
  `${todo.length} images tag karni hain (${Object.keys(results).length} pehle se ho chuki).`,
);
if (!todo.length) process.exit(0);

console.log("Model load ho raha hai (pehli baar ~150MB download hoga)...");
const {
  AutoTokenizer,
  CLIPTextModelWithProjection,
  AutoProcessor,
  CLIPVisionModelWithProjection,
  RawImage,
} = hf;
const tokenizer = await AutoTokenizer.from_pretrained(MODEL);
const textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL);
const processor = await AutoProcessor.from_pretrained(MODEL);
const visionModel = await CLIPVisionModelWithProjection.from_pretrained(MODEL);

// Har vocab ke har group ke labels ka embedding ek baar nikal lo
async function embedTexts(texts) {
  const inputs = tokenizer(texts, { padding: true, truncation: true });
  const { text_embeds } = await textModel(inputs);
  const dim = text_embeds.dims[text_embeds.dims.length - 1];
  return texts.map((_, i) =>
    normalize(text_embeds.data.slice(i * dim, (i + 1) * dim)),
  );
}

const prepared = {};
for (const [key, v] of Object.entries(vocab)) {
  prepared[key] = { title: v.title || [], groups: {} };
  for (const [g, def] of Object.entries(v.groups)) {
    prepared[key].groups[g] = {
      ...def,
      embs: await embedTexts(
        def.labels.map((l) => def.template.replace("{}", l)),
      ),
    };
  }
}

// AI ko chhoti thumbnail (480px) dikhate hain, CLIP ko 224px hi chahiye, aur ye original se bahut tez hai.
async function embedImage(rel) {
  const buf = fs.readFileSync(thumbPath(rel));
  const image = await RawImage.fromBlob(new Blob([buf]));
  const { image_embeds } = await visionModel(await processor(image));
  return normalize(image_embeds.data);
}

const started = Date.now();
let n = 0;
let failed = 0;
for (const file of todo) {
  const rel = relPath(file);
  const category = rel.includes("/") ? rel.split("/")[0] : "";
  const key = vocabKeyFor(vocab, category);
  const set = prepared[key];
  try {
    const emb = await embedImage(rel);
    const groups = {};
    for (const [g, def] of Object.entries(set.groups)) {
      groups[g] = pickLabels(emb, def.embs, def.labels, {
        minProb: def.minProb,
      });
    }
    const { title, tags } = buildTags(groups, set.title);
    results[rel] = { title, tags };
    failed = 0;
  } catch (err) {
    console.warn(`Skip: ${rel} (${err.message})`);
    // lagatar fail ho raha hai to koi bada masla hai, 30 baar same error dikhane se behtar rok do
    if (++failed >= 3) {
      save();
      console.error(
        "\nLagatar 3 images fail hui, to ruk raha hoon. Upar ka error yahan paste karke bhejo.",
      );
      process.exit(1);
    }
    continue;
  }
  n++;
  if (n % 25 === 0) {
    save();
    const perImg = (Date.now() - started) / n / 1000;
    const left = Math.round(((todo.length - n) * perImg) / 60);
    console.log(
      `  ${n}/${todo.length}   (~${perImg.toFixed(2)}s per image, ~${left} min baaki)`,
    );
  }
}
save();
console.log(`Ho gaya: ${n} images tag hui. Ab chalao: npm run generate`);
