#!/usr/bin/env node
/**
 * Generates responsive AVIF/WebP/JPEG derivatives for the site's images.
 *
 * The source files are far larger than they are ever displayed: project
 * screenshots average ~3350px wide but render in ~400px cards, and the two
 * portraits are 1024x1536 shown at 170x170. That was ~35MB of transfer.
 *
 * Originals live in src/images/ (build inputs, never deployed). Derivatives are
 * written to public/optimized/ and committed, so the deploy needs no image
 * pipeline. Re-run after adding or replacing an image:
 *
 *   npm run images
 *
 * Existing outputs are skipped unless --force is passed.
 */
import sharp from "sharp";
import { readdir, mkdir, stat, access } from "node:fs/promises";
import { join, parse } from "node:path";

const FORCE = process.argv.includes("--force");

// Widths chosen for how each image is actually used, with a 2x tier for retina.
// Sources live in src/images/ rather than public/: they are build inputs, not
// deployable assets. Only the derivatives under public/optimized/ ship.
const SETS = [
  { dir: "src/images/projects", out: "public/optimized/projects", widths: [400, 800] },
  { dir: "src/images", out: "public/optimized", widths: [200, 400], only: ["mainimage.png", "hoverimage.png"] },
];

const exists = async (p) => access(p).then(() => true).catch(() => false);

async function emit(src, outDir, base, width) {
  const targets = [
    { ext: "avif", opts: (p) => p.avif({ quality: 50, effort: 4 }) },
    { ext: "webp", opts: (p) => p.webp({ quality: 65 }) },
    { ext: "jpg", opts: (p) => p.jpeg({ quality: 74, mozjpeg: true }) },
  ];
  let written = 0;
  for (const t of targets) {
    const out = join(outDir, `${base}-${width}.${t.ext}`);
    if (!FORCE && (await exists(out))) continue;
    // withoutEnlargement: never upscale a source that is already small.
    await t.opts(sharp(src).resize({ width, withoutEnlargement: true })).toFile(out);
    written++;
  }
  return written;
}

let srcBytes = 0;
let outBytes = 0;
let count = 0;

for (const set of SETS) {
  await mkdir(set.out, { recursive: true });
  const entries = (await readdir(set.dir)).filter((f) => /\.(jpe?g|png)$/i.test(f));
  const files = set.only ? entries.filter((f) => set.only.includes(f)) : entries;

  for (const file of files) {
    const src = join(set.dir, file);
    const { name } = parse(file);
    srcBytes += (await stat(src)).size;
    for (const w of set.widths) await emit(src, set.out, name, w);
    count++;
  }
}

// Report the real total, including files skipped as already present.
for (const set of SETS) {
  if (!(await exists(set.out))) continue;
  for (const f of await readdir(set.out)) {
    const p = join(set.out, f);
    if ((await stat(p)).isFile()) outBytes += (await stat(p)).size;
  }
}

const mb = (b) => (b / 1024 / 1024).toFixed(2);
console.log(`optimized ${count} images`);
console.log(`  source:     ${mb(srcBytes)} MB`);
console.log(`  derivatives:${mb(outBytes)} MB`);
