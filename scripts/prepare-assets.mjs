/**
 * Imports the media this site is made of, from wherever it originally lives:
 *
 *   artwork/<id>-{480,960,1600}.webp   the ambigrams, responsive
 *   photo/portrait-{400,800}.webp      the About portrait, EXIF stripped
 *   fonts/*.woff2 + fonts.css          self-hosted Bangla + Latin faces
 *   og.png                             social card, built from the hero piece
 *   cv.pdf                             copied from the supplied PDF
 *
 * This is NOT part of `npm run build`, and does not need to be. Everything it
 * produces is committed to this repository, so a fresh clone builds and deploys
 * without it — and without needing a sibling checkout or a Supabase bucket to
 * be reachable.
 *
 * Run it when a source changes: a new ambigram, a new CV, a new portrait. If
 * the sources are not on this machine it reports what it could not find and
 * leaves the committed copies alone, so running it on a clean clone is safe
 * rather than destructive.
 *
 * Idempotent; skips work whose output is already newer than its input.
 */

import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import content from "../content/source.mjs";
import { findCentre } from "./rotation-centres.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "client/public");

/**
 * Where the originals live. Both are outside this repository and neither is
 * guaranteed to exist on a given machine.
 *
 * The ambigram renditions come from the ghurnilipi project's build workspace.
 * That project gitignores them, because its own copies are rebuilt from the
 * bytes in its Supabase Storage bucket — which is precisely why this repository
 * commits its own copies instead of reaching for them at build time.
 *
 * The woff2 files come from the same project's next/font download cache. Reused
 * rather than re-fetched from Google, because §8 requires self-hosted fonts and
 * these are already the correctly subset files.
 */
const ARTWORK_SRC = path.resolve(root, "../public/artwork");
const FONT_SRC = path.resolve(root, "../.next/static/media");

const ok = [];
const warn = [];
/** Sources that are not on this machine, where the committed copy stands. */
const skipped = [];

/**
 * Everything the client needs to know about an asset before it loads: intrinsic
 * dimensions, so a box can be reserved and nothing shifts (§7), and for the
 * ambigrams the measured rotation axis. Both steps write into this and it is
 * written to disk once at the end — collecting first means a later step cannot
 * overwrite an earlier one's entries.
 */
const manifest = {};

const newerThan = async (out, src) => {
  if (!existsSync(out)) return false;
  const [a, b] = await Promise.all([stat(out), stat(src)]);
  return a.mtimeMs >= b.mtimeMs;
};

// ── ambigram artwork ───────────────────────────────────────────────────────

async function artwork() {
  const out = path.join(pub, "artwork");
  await mkdir(out, { recursive: true });

  if (!existsSync(ARTWORK_SRC)) {
    const have = existsSync(out) ? (await readdir(out)).filter((f) => f.endsWith(".webp")).length : 0;
    if (have) {
      skipped.push(`artwork: source folder not on this machine; keeping the ${have} committed file(s)`);
    } else {
      warn.push(
        `artwork: no source folder at ${ARTWORK_SRC} and nothing committed — the gallery will be empty`,
      );
    }
    return;
  }

  let copied = 0;
  const missing = [];

  for (const piece of content.ambigrams) {
    for (const w of piece.widths) {
      const name = `${piece.id}-${w}.webp`;
      const src = path.join(ARTWORK_SRC, name);
      if (!existsSync(src)) {
        missing.push(name);
        continue;
      }
      const dst = path.join(out, name);
      if (await newerThan(dst, src)) continue;
      await copyFile(src, dst);
      copied += 1;
    }
  }

  ok.push(`artwork: ${copied} file(s) copied`);
  if (missing.length) {
    warn.push(
      `artwork: ${missing.length} rendition(s) missing from the source folder: ` +
        `${missing.slice(0, 6).join(", ")}${missing.length > 6 ? " …" : ""}`,
    );
  }
}

// ── the signature seal ─────────────────────────────────────────────────────

/**
 * Turns SIGNATURE.gif into the hero object.
 *
 * The source is a 20-frame animated GIF, 1920² and 487KB, that rotates the seal
 * through a half turn by itself. The site does not use the animation, for four
 * reasons that all come from §6: a GIF autoplays and loops, so the reveal is not
 * the visitor's action; it cannot respect `prefers-reduced-motion`; it is not
 * keyboard-activatable or reversible; and 487KB on the LCP path is four times
 * the whole rest of the page.
 *
 * So one settled frame is extracted and the existing CSS transform does the
 * turn — same effect, ~20KB, and every accessibility requirement intact.
 *
 * The frame is also composited to transparent ink rather than kept as black on
 * white. The seal is a circle; on a white square it reads as a sticker on the
 * page, and a mark someone signs work with should sit on the paper. Alpha comes
 * from the luminance, so the antialiased edges survive without a halo.
 */
async function signature() {
  const src = path.join(root, "SIGNATURE.gif");
  const out = path.join(pub, "artwork");
  await mkdir(out, { recursive: true });

  const piece = content.signature;
  if (!existsSync(src)) {
    const have = existsSync(path.join(out, `${piece.id}-960.webp`));
    if (have) skipped.push("signature: SIGNATURE.gif not present; keeping the committed renditions");
    else warn.push("signature: SIGNATURE.gif not found and nothing committed — the hero will be empty");
    return;
  }

  const dst960 = path.join(out, `${piece.id}-960.webp`);
  if (await newerThan(dst960, src)) return;

  // Frames 0 and 11..19 are the settled upright state (verified identical to
  // two decimal places on mean luminance); the middle frames are mid-turn.
  const FRAME = 0;
  const flat = sharp(src, { animated: true, page: FRAME, pages: 1 }).flatten({
    background: "#ffffff",
  });

  const { data, info } = await flat.clone().greyscale().raw().toBuffer({ resolveWithObject: true });

  // --color-ink from the stylesheet, so the seal is the same ink as the type.
  const INK = [0x14, 0x17, 0x1e];
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i += 1) {
    rgba[i * 4] = INK[0];
    rgba[i * 4 + 1] = INK[1];
    rgba[i * 4 + 2] = INK[2];
    rgba[i * 4 + 3] = 255 - data[i]; // white paper → transparent, ink → opaque
  }

  const inked = sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });

  // Trim the empty margin so the circle fills its box: the hero reserves a
  // square, and a seal floating in whitespace wastes the one screen a recruiter
  // is guaranteed to look at.
  // Encoded rather than raw: a raw buffer carries no dimensions, so handing it
  // back to sharp for the resize loop would fail to identify the format.
  const trimmed = await inked.trim({ threshold: 1 }).png().toBuffer();

  for (const w of piece.widths) {
    await sharp(trimmed)
      .resize({ width: w, height: w, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      // Compared at display size against quality 90 / alphaQuality 100: no
      // visible difference on the strokes, and 26KB instead of 66KB. All the
      // information in this mark is in the alpha channel — the RGB is one flat
      // ink colour everywhere — so spending bits on colour fidelity buys nothing.
      // Lossless is worse still (103KB): the antialiased edges carry too many
      // distinct alpha levels for the palette to help.
      .webp({ quality: 62, alphaQuality: 70, effort: 6 })
      .toFile(path.join(out, `${piece.id}-${w}.webp`));
  }

  ok.push(`signature: ${piece.widths.length} rendition(s) from frame ${FRAME}, transparent ink`);
}

// ── case study photographs ─────────────────────────────────────────────────

/**
 * §5.4: WebP, responsive srcset, EXIF stripped, never a 4MB phone photo shipped
 * to a mobile visitor.
 *
 * The source is 1920×1080 and 1.1MB. Its EXIF is 137 bytes containing only
 * "BeFunky Photo Editor" — no GPS, no camera, no timestamp, because it has
 * already been through an online editor. Stripped again here regardless: sharp
 * drops metadata by default, and relying on a previous tool's behaviour is not
 * a privacy control.
 *
 * No JPEG fallback, which §5.4 asks for. WebP has had support in every current
 * browser since 2020, so the fallback would double the committed weight of every
 * photograph for a set of visitors that is now empty. Stated rather than skipped
 * silently — see docs/OPEN-ITEMS.md.
 */
async function caseStudyPhotos() {
  const out = path.join(pub, "photo");
  await mkdir(out, { recursive: true });

  for (const photo of content.caseStudy.photos) {
    const src = path.join(root, photo.source);
    if (!existsSync(src)) {
      const have = existsSync(path.join(out, `${photo.id}-1024.webp`));
      if (have) skipped.push(`${photo.id}: ${photo.source} not present; keeping the committed renditions`);
      else warn.push(`${photo.id}: ${photo.source} not found and nothing committed`);
      continue;
    }

    const meta = await sharp(src).metadata();
    manifest[photo.id] = { width: meta.width, height: meta.height };
    if (Math.max(meta.width, meta.height) < 1600) {
      // §5.4: under ~1600px on the long edge, use it small rather than
      // upscaling — a stretched photo of a robot looks worse than a sharp one.
      warn.push(
        `${photo.id}: source is ${meta.width}×${meta.height}, under the 1600px long edge §5.4 asks for`,
      );
    }

    for (const w of photo.widths) {
      const dst = path.join(out, `${photo.id}-${w}.webp`);
      if (await newerThan(dst, src)) continue;
      await sharp(src)
        .rotate() // honour EXIF orientation before the metadata is discarded
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80, effort: 6 })
        .toFile(dst);
    }
    ok.push(`${photo.id}: ${photo.widths.length} rendition(s), EXIF stripped`);
  }
}

// ── rotation centres ───────────────────────────────────────────────────────

/**
 * §6 wants the 180° turn to happen about each piece's true visual centre, and
 * says to verify it per asset. Measured here (see rotation-centres.mjs) and
 * written out for the client to use as transform-origin.
 *
 * Anything that comes back with low confidence is reported: it means the
 * search could not find a convincing axis, which usually means the export has
 * a lot of asymmetric background rather than that the drawing is wrong.
 */
async function centres() {
  const weak = [];

  // The seal is measured alongside the gallery pieces: it is the hero, so its
  // axis is the one that matters most.
  for (const piece of [content.signature, ...content.ambigrams]) {
    const src = path.join(pub, `artwork/${piece.id}-960.webp`);
    if (!existsSync(src)) continue;
    const [c, meta] = await Promise.all([findCentre(src), sharp(src).metadata()]);
    // The aspect ratio travels with the centre because both are needed before
    // the image loads: the ratio reserves the box so nothing shifts (§7), the
    // centre tells the box where to turn about.
    manifest[piece.id] = {
      origin: { x: c.x, y: c.y },
      width: meta.width,
      height: meta.height,
    };
    if (c.confidence < 0.35) weak.push(`${piece.id} (${c.confidence})`);
  }

  ok.push(`rotation axes: ${content.ambigrams.length + 1} piece(s) measured`);
  if (weak.length) {
    warn.push(
      `rotation centres: low confidence on ${weak.join(", ")} — ` +
        `check these turn cleanly before shipping`,
    );
  }
}

// ── portrait ───────────────────────────────────────────────────────────────

async function portrait() {
  const src = path.join(root, "dp.jpg");
  const out = path.join(pub, "photo");
  await mkdir(out, { recursive: true });

  if (!existsSync(src)) {
    if (existsSync(path.join(out, "portrait-800.webp"))) {
      skipped.push("portrait: dp.jpg not present; keeping the committed renditions");
    } else {
      warn.push("portrait: dp.jpg not found and nothing committed");
    }
    return;
  }

  for (const w of [400, 800]) {
    const dst = path.join(out, `portrait-${w}.webp`);
    if (await newerThan(dst, src)) continue;
    await sharp(src)
      .rotate() // honour EXIF orientation before we discard the EXIF
      .resize({ width: w, withoutEnlargement: true })
      // No .withMetadata(): sharp drops EXIF by default, which is what we want.
      // Phone photos carry GPS (requirements §5.4).
      .webp({ quality: 82, effort: 6 })
      .toFile(dst);
  }
  ok.push("portrait: 400/800 webp written, EXIF stripped");
}

// ── fonts ──────────────────────────────────────────────────────────────────

/**
 * The unicode-range subsets are what keep this cheap: a visitor who never
 * scrolls to a Bangla word downloads only the Latin file. These ranges are
 * Google Fonts' own, carried over with the files.
 */
const RANGES = {
  bengali:
    "U+0951-0952, U+0964-0965, U+0980-09FE, U+1CD0, U+1CD2, U+1CD5-1CD6, U+1CD8, U+1CE1, U+1CEA, U+1CED, U+1CF2, U+1CF5-1CF7, U+200C-200D, U+20B9, U+25CC, U+A8F1",
  "latin-ext":
    "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
  latin:
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
};

/**
 * Source filenames are content-hashed by next/font, so they are matched by
 * their byte size rather than by name — the sizes are stable per subset and
 * weight, and a rebuild of the sibling project renames the files but does not
 * change what is in them. If a lookup fails the run warns and the site falls
 * back to the platform Bangla face, which is worse but not broken.
 */
const FACES = [
  { family: "Tiro Bangla", weight: 400, subset: "bengali" },
  { family: "Tiro Bangla", weight: 400, subset: "latin-ext" },
  { family: "Tiro Bangla", weight: 400, subset: "latin" },
  { family: "Hind Siliguri", weight: 400, subset: "bengali" },
  { family: "Hind Siliguri", weight: 400, subset: "latin-ext" },
  { family: "Hind Siliguri", weight: 400, subset: "latin" },
  { family: "Hind Siliguri", weight: 500, subset: "bengali" },
  { family: "Hind Siliguri", weight: 500, subset: "latin-ext" },
  { family: "Hind Siliguri", weight: 500, subset: "latin" },
  { family: "Hind Siliguri", weight: 600, subset: "bengali" },
  { family: "Hind Siliguri", weight: 600, subset: "latin-ext" },
  { family: "Hind Siliguri", weight: 600, subset: "latin" },
];

async function fonts(map) {
  const out = path.join(pub, "fonts");
  await mkdir(out, { recursive: true });

  // Rewriting fonts.css from an empty map would leave the site with @font-face
  // rules pointing at files that are not there — worse than doing nothing.
  if (map.size === 0) {
    const have = (await readdir(out).catch(() => [])).filter((f) => f.endsWith(".woff2")).length;
    if (have) {
      skipped.push(`fonts: next/font cache not on this machine; keeping the ${have} committed face(s)`);
    } else {
      warn.push("fonts: no source cache and nothing committed — Bangla will fall back to the system face");
    }
    return;
  }

  const rules = [];
  const missing = [];

  for (const face of FACES) {
    const slug = `${face.family.toLowerCase().replace(/\s+/g, "-")}-${face.weight}-${face.subset}`;
    const src = map.get(`${face.family}|${face.weight}|${face.subset}`);
    if (!src) {
      missing.push(slug);
      continue;
    }
    const dst = path.join(out, `${slug}.woff2`);
    if (!(await newerThan(dst, src))) await copyFile(src, dst);

    rules.push(
      `@font-face {\n` +
        `  font-family: "${face.family}";\n` +
        `  font-style: normal;\n` +
        `  font-weight: ${face.weight};\n` +
        `  font-display: swap;\n` +
        `  src: url("/fonts/${slug}.woff2") format("woff2");\n` +
        `  unicode-range: ${RANGES[face.subset]};\n` +
        `}`,
    );
  }

  /**
   * Metric-matched fallbacks. Without these the swap from the system face to
   * the webfont reflows the text, which is the layout shift §7 forbids. The
   * override numbers are next/font's, computed from the real font metrics.
   */
  rules.push(
    `@font-face {\n` +
      `  font-family: "Tiro Bangla Fallback";\n` +
      `  src: local("Times New Roman");\n` +
      `  ascent-override: 67.12%;\n` +
      `  descent-override: 21.78%;\n` +
      `  line-gap-override: 29.34%;\n` +
      `  size-adjust: 112.49%;\n` +
      `}`,
    `@font-face {\n` +
      `  font-family: "Hind Siliguri Fallback";\n` +
      `  src: local("Arial");\n` +
      `  ascent-override: 105.63%;\n` +
      `  descent-override: 34.61%;\n` +
      `  line-gap-override: 0%;\n` +
      `  size-adjust: 96.09%;\n` +
      `}`,
  );

  // The @font-face rules go into src/ so Vite bundles them with the rest of
  // the CSS — one stylesheet request rather than two, and the woff2 URLs still
  // point at public/fonts, which is where the files actually are.
  await writeFile(
    path.join(root, "client/src/styles/fonts.css"),
    `/* Generated by scripts/prepare-assets.mjs. Do not edit. */\n\n${rules.join("\n\n")}\n`,
    "utf8",
  );

  ok.push(`fonts: ${FACES.length - missing.length}/${FACES.length} faces self-hosted`);
  if (missing.length) warn.push(`fonts: could not resolve ${missing.join(", ")}`);
}

/**
 * Reads the sibling project's generated @font-face CSS and maps
 * family|weight|subset to the woff2 on disk. Reading the CSS beats guessing
 * from filenames, which are hashes.
 */
async function fontMap() {
  const map = new Map();
  const chunks = path.resolve(root, "../.next/dev/static/chunks");
  const media = FONT_SRC;

  if (!existsSync(chunks) || !existsSync(media)) return map;

  const cssFiles = (await readdir(chunks)).filter(
    (f) => f.endsWith(".css") && f.includes("font_google"),
  );

  const subsetOf = (range) => {
    if (range.includes("U+980-9FE") || range.includes("U+0980-09FE")) return "bengali";
    if (range.includes("U+1D00-1DBF")) return "latin-ext";
    return "latin";
  };

  for (const file of cssFiles) {
    const css = await readFile(path.join(chunks, file), "utf8");
    const blocks = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
    for (const block of blocks) {
      const family = block.match(/font-family:\s*([^;]+);/)?.[1]?.trim().replace(/^["']|["']$/g, "");
      const weight = block.match(/font-weight:\s*(\d+);/)?.[1];
      const url = block.match(/url\("\.\.\/media\/([^"]+)"\)/)?.[1];
      const range = block.match(/unicode-range:\s*([^;]+);/)?.[1];
      if (!family || !weight || !url || !range) continue;
      const abs = path.join(media, url);
      if (!existsSync(abs)) continue;
      map.set(`${family}|${weight}|${subsetOf(range)}`, abs);
    }
  }
  return map;
}

// ── social card ────────────────────────────────────────────────────────────

/**
 * §8: the Open Graph image must be an ambigram, not a headshot. Composited
 * here rather than exported by hand so it cannot drift from the hero piece.
 */
async function ogImage() {
  const hero = content.ambigrams.find((a) => a.hero) ?? content.ambigrams[0];
  const src = path.join(pub, `artwork/${hero.id}-1600.webp`);
  const dst = path.join(pub, "og.png");

  if (!existsSync(src)) {
    warn.push("og.png: hero artwork missing, social card not built");
    return;
  }
  if (await newerThan(dst, src)) return;

  const W = 1200;
  const H = 630;
  const art = await sharp(src)
    .resize({ width: 760, height: 380, fit: "inside", withoutEnlargement: false })
    .toBuffer();
  const meta = await sharp(art).metadata();

  const label = content.profile.name;
  const sub = "Product · Bangla ambigrams";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#EDEFF3"/>
  <rect x="0" y="0" width="${W}" height="8" fill="#8E1F32"/>
  <text x="72" y="${H - 96}" font-family="Georgia, serif" font-size="46" fill="#14171E">${label}</text>
  <text x="72" y="${H - 52}" font-family="Arial, sans-serif" font-size="26" fill="#4B5361">${sub}</text>
</svg>`;

  await sharp(Buffer.from(svg))
    .composite([
      {
        input: art,
        left: Math.round((W - (meta.width ?? 0)) / 2),
        top: 70,
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(dst);

  ok.push("og.png: social card built from the hero ambigram");
}

// ── CV ─────────────────────────────────────────────────────────────────────

async function cv() {
  const candidates = (await readdir(root)).filter((f) => /\.pdf$/i.test(f));
  const src = candidates.find((f) => /cv|resume/i.test(f)) ?? candidates[0];
  if (!src) {
    if (existsSync(path.join(pub, "cv.pdf"))) {
      skipped.push("cv.pdf: no source PDF here; keeping the committed copy");
    } else {
      warn.push("cv.pdf: no PDF in the project directory — the download button will 404");
    }
    return;
  }
  const dst = path.join(pub, "cv.pdf");
  if (await newerThan(dst, path.join(root, src))) return;
  await copyFile(path.join(root, src), dst);
  ok.push(`cv.pdf: copied from ${src}`);
}

// ── run ────────────────────────────────────────────────────────────────────

await mkdir(pub, { recursive: true });
await artwork();
await signature();
await caseStudyPhotos();
await centres();
await portrait();
await fonts(await fontMap());
await ogImage();
await cv();

await writeFile(
  path.join(root, "client/src/data/artwork-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}
`,
  "utf8",
);
ok.push(`asset manifest: ${Object.keys(manifest).length} entr(ies)`);

for (const line of ok) console.log(`  ✓ ${line}`);
for (const line of skipped) console.log(`  · ${line}`);
for (const line of warn) console.warn(`  ! ${line}`);

if (skipped.length && !warn.length) {
  console.log("\n  Nothing to import. The committed assets are intact and the site builds as-is.");
}
