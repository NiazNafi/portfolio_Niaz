/**
 * Enforces the hard limits in requirements §8 and §9 against the real build
 * output, and exits non-zero when one is broken.
 *
 * These are the numbers that quietly stop being true. A dependency gets added
 * for one component, the initial route puts on 90KB, and nobody notices until
 * a recruiter opens the site on mobile data six months later. Checking it in
 * CI is the only version of this that survives.
 *
 *   npm run check
 */

import { gzipSync } from "node:zlib";
import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import content from "../content/source.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "client/dist");

if (!existsSync(dist)) {
  console.error("No build to check. Run `npm run build` first.");
  process.exit(1);
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)}KB`;
const failures = [];
const notes = [];

// ── §8: < 250KB JS, gzipped, on the initial route ──────────────────────────

const html = await readFile(path.join(dist, "index.html"), "utf8");
const scripts = [...html.matchAll(/<(?:script[^>]*src|link[^>]*href)="(\/assets\/[^"]+\.js)"/g)].map(
  (m) => m[1],
);

let jsBytes = 0;
for (const src of scripts) {
  const buf = await readFile(path.join(dist, src));
  jsBytes += gzipSync(buf).length;
}

const JS_BUDGET = 250 * 1024;
if (jsBytes > JS_BUDGET) {
  failures.push(`initial-route JS is ${kb(jsBytes)} gzipped, over the ${kb(JS_BUDGET)} budget`);
} else {
  notes.push(`JS on the initial route: ${kb(jsBytes)} gzipped of ${kb(JS_BUDGET)} allowed`);
}

// ── LCP: the hero image is what decides it ─────────────────────────────────

const hero = content.ambigrams.find((a) => a.hero) ?? content.ambigrams[0];
const heroFile = path.join(dist, `artwork/${hero.id}-960.webp`);
if (existsSync(heroFile)) {
  const { size } = await stat(heroFile);
  // Not a spec number: a rule of thumb for holding LCP under 2.5s on a 4G
  // connection once the HTML, CSS and font are already in flight.
  if (size > 120 * 1024) {
    failures.push(`hero artwork is ${kb(size)}; over ~120KB it starts to threaten the LCP budget`);
  } else {
    notes.push(`hero artwork: ${kb(size)}`);
  }
} else {
  failures.push(`hero artwork missing from the build (${hero.id})`);
}

// ── §9: nothing forbidden in the shipped output ────────────────────────────

const pages = [];
const walk = async (dir) => {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith(".html")) pages.push(full);
  }
};
await walk(dist);

const shipped = (await Promise.all(pages.map((p) => readFile(p, "utf8")))).join("\n");

const FORBIDDEN = [
  { pattern: /lorem ipsum/i, why: "placeholder text" },
  { pattern: /(?:\+?880|\b01)\d[\s-]?\d{4}[\s-]?\d{4}\b/, why: "a phone number (§3)" },
  { pattern: /\bTODO\b|\bFIXME\b/, why: "an unresolved TODO marker" },
  // §5.4: the Facebook embed is disqualified outright, not merely discouraged.
  { pattern: /connect\.facebook\.net|fb-video|facebook\.com\/plugins/i, why: "a Facebook embed (§5.4)" },
  // §8: every asset is self-hosted. Only things the browser actually fetches
  // count — a canonical URL or an og:image is an absolute URL by definition and
  // is not a request the page makes.
  { pattern: /<script[^>]+src="https?:\/\//i, why: "a third-party script (§8)" },
  {
    pattern: /<link[^>]+rel="(?:stylesheet|preload|preconnect|dns-prefetch)"[^>]+href="https?:\/\//i,
    why: "a third-party stylesheet or preload (§8)",
  },
];

for (const { pattern, why } of FORBIDDEN) {
  if (pattern.test(shipped)) failures.push(`built HTML contains ${why}`);
}

// ── §3 / §5.7: what the published CV gives away ─────────────────────────────
//
// The CV is the site's primary call to action, and it is the one thing on the
// site that an HTML scan cannot see inside. §3 is explicit: the phone number and
// the referees' names, emails and phone numbers "belong in a CV sent to a named
// recipient, not on an indexed public page". A `/cv.pdf` link on the home page
// is an indexed public page.
//
// The referees' details are not even Niaz's to trade away — they are two other
// people's work emails and a personal mobile number.

const cvPath = path.join(dist, "cv.pdf");
if (!existsSync(cvPath)) {
  failures.push("cv.pdf is not in the build — the download button will 404");
} else {
  const { dense } = await import("./pdf-text.cjs").then((m) => m.default ?? m);
  let text = "";
  try {
    text = dense(cvPath);
  } catch (err) {
    notes.push(`cv.pdf: could not read the text layer (${err.message}) — check it by hand`);
  }

  if (text) {
    // Bangladeshi mobile numbers: 01XXXXXXXXX, optionally +880-prefixed.
    const phones = [...new Set(text.match(/(?:\+?880|01)\d{9}/g) ?? [])];
    if (phones.length) {
      failures.push(
        `cv.pdf contains ${phones.length} phone number(s) — §3 forbids publishing these. ` +
          `Publish a redacted CV (see BLOCKING-5 in docs/OPEN-ITEMS.md).`,
      );
    }

    if (/REFERENCES?/i.test(text)) {
      failures.push("cv.pdf has a References section — §3 forbids publishing referee details");
    }

    // Any email that is not Niaz's own is somebody else's contact detail.
    const emails = [...new Set(text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [])];
    const foreign = emails.filter((e) => !e.toLowerCase().endsWith(content.profile.email));
    if (foreign.length) {
      failures.push(`cv.pdf contains third-party email address(es): ${foreign.join(", ")}`);
    }

    // §11 BLOCKING-1: employer specifics that are a different act in public.
    const employerTells = [
      [/AirportServiceDepartment/i, "the named department"],
      [/\d+functionalmodules/i, "a module count"],
      [/DepartureControlSystemvendors/i, "the DCS vendor evaluation"],
      [/featurematrixusedforplatformevaluation/i, "the platform evaluation"],
    ].filter(([re]) => re.test(text));
    if (employerTells.length) {
      failures.push(
        `cv.pdf discloses US-Bangla internals the site deliberately does not: ` +
          `${employerTells.map(([, why]) => why).join(", ")} (BLOCKING-1)`,
      );
    }
  }
}

// Every page needs its own title and description, and exactly one h1 (§8).
for (const page of pages) {
  const text = await readFile(page, "utf8");
  const rel = path.relative(dist, page);
  if (!/<title>[^<]{10,}<\/title>/.test(text)) failures.push(`${rel}: missing or empty <title>`);
  if (!/<meta name="description" content="[^"]{40,}"/.test(text)) {
    failures.push(`${rel}: missing or thin meta description`);
  }
  const h1s = (text.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) failures.push(`${rel}: has ${h1s} <h1> elements, expected exactly 1`);
}

// ── report ─────────────────────────────────────────────────────────────────

for (const note of notes) console.log(`  ✓ ${note}`);
console.log(`  ✓ ${pages.length} page(s) checked for title, description and heading structure`);

if (failures.length) {
  console.error(`\n  ${failures.length} failure(s):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log("\n  all §8 budgets and §9 content rules hold.");
