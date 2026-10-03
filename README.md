# Walls: wallpaper search app

React 19 + Vite + Tailwind CSS v4. Search browser me hi chalta hai (MiniSearch), koi backend ya API nahi chahiye.

## Chalane ka tareeka

```bash
npm install

# 1. Images public/images me daalo. Folder ka naam category ban jata hai:
#      public/images/car/ferrari-red.jpg
#      public/images/nature/snowy-lake.jpg

# 2. Thumbnails aur images.json banao (20k images me kuch minute lagte hain)
npm run generate

# 3. App chalao
npm run dev
```

Nayi images baad me daalo to bas `npm run generate` dobara chalao. Purani thumbnails dobara nahi banti.

## Search kaise kaam karta hai (zaruri)

Search images ko nahi, unke **title aur tags** ko dhoondhta hai. Ye teen jagah se aate hain (upar wala jeetta hai):

| Source | Kaise |
|---|---|
| `metadata.csv` | Excel me haath se edit kiya hua (neeche dekho) |
| Filename | `red-ferrari-sunset.jpg` -> "red ferrari sunset" |
| AI tagging | `npm run tag`, AI image dekh ke tags banata hai |

`IMG_2231.jpg` ya `pexels-mikebird-123.jpg` jaise filenames se kuch pata nahi chalta. Aisi images ke liye AI ya CSV chahiye.

### Option 1: AI se auto-tag (free, internet ya API key nahi chahiye)

```bash
npm install -D @huggingface/transformers
npm run tag -- --limit=30     # pehle 30 images pe test karo
npm run tag                   # phir sab pe
npm run generate
```

Model (CLIP) pehli baar ~150MB download hota hai, phir sab tere computer par chalta hai. 20k images me ghante lag sakte hain. Ctrl+C karke band kar sakte ho, dobara chalane par wahin se shuru hota hai.

Ye har image ka rang, type aur brand batata hai, jaise "black Mercedes-Benz sedan". Brand tabhi lagata hai jab pakka ho, shak ho to tag nahi lagata (galat tag se behtar hai). Model name (jaise "E63 AMG") ye nahi pakad pata, wo CSV se sahi karo. Kaunse labels use hon ye `scripts/vocab.json` me hai. Folder ka naam `car` ya `cars` ho to car wale labels lagte hain, baaki folders ke liye `general`. Naye folder type (jaise `bike`, `anime`) ke liye vocab.json me ek naya section jod sakte ho.

### Option 2: Excel se manually

```bash
npm run generate
npm run export-csv            # metadata.csv banti hai
```

`metadata.csv` Excel me kholo (columns: file, title, tags). Jin images ka title khali hai unka title bharo, tags me space se alag shabd likho. Save karo (CSV format me) aur `npm run generate` dobara chalao. Jis row me kuch likha hai wahi use hota hai.

Pehle AI tagging poori kar lo, phir export-csv chalao, nahi to CSV ke tags AI ke naye tags ko dabaa denge. Dobara naya banana ho to `npm run export-csv -- --force`, par usse tere edit chale jayenge.

## Structure

```
scripts/generate-data.js   images -> public/images.json + public/thumbs/
scripts/tag-images.js      AI tagging (CLIP), scripts/ai-tags.json banata hai
scripts/export-csv.js      metadata.csv banata hai
scripts/vocab.json         AI ke labels (car brands, colors, ...)
src/data/                  ImagesContext (search), FavoritesContext (localStorage)
src/Components/            Navbar, CategoryBar, Home (grid + infinite scroll), ImageCard, ImageModal
src/config.js              image/thumb URL (CDN yahin se badalta hai)
```

## Deploy

20k full images `public/` me rakhkar Vercel/Netlify pe deploy nahi hongi (size limit). Deploy ke time images **Cloudflare R2** ya kisi CDN pe daalo aur `.env` me likho:

```
VITE_IMAGE_BASE=https://your-cdn.com/images
VITE_THUMB_BASE=https://your-cdn.com/thumbs
```
