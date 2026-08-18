/**
 * Reads the text out of a PDF.
 *
 * This exists so `npm run check` can look inside client/public/cv.pdf. The CV is
 * the site's primary call to action, and it is the one published document whose
 * contents no HTML scan can see — which is exactly how a phone number and two
 * referees' contact details came to be published from a site whose markup had
 * been carefully checked for both.
 *
 * The fonts are subset with custom encodings, so the byte values in the content
 * streams are glyph ids rather than characters. Each font's /ToUnicode CMap is
 * parsed and used to map them back. This is not a general-purpose extractor —
 * it is good enough to answer "does this document contain a phone number".
 *
 * CommonJS so the check script can require it with no build step.
 */

const fs = require("fs");
const zlib = require("zlib");

function parseCMap(text) {
  const map = new Map();
  const hex = (h) => parseInt(h, 16);
  const toStr = (h) => {
    let out = "";
    for (let i = 0; i < h.length; i += 4) {
      const cp = parseInt(h.slice(i, i + 4), 16);
      if (!Number.isNaN(cp) && cp) out += String.fromCharCode(cp);
    }
    return out;
  };

  for (const block of text.match(/beginbfchar([\s\S]*?)endbfchar/g) ?? []) {
    for (const p of block.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      map.set(hex(p[1]), toStr(p[2]));
    }
  }
  for (const block of text.match(/beginbfrange([\s\S]*?)endbfrange/g) ?? []) {
    for (const p of block.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      const lo = hex(p[1]);
      const hi = hex(p[2]);
      const dst = hex(p[3]);
      for (let c = lo; c <= hi && c - lo < 512; c += 1) {
        map.set(c, String.fromCharCode(dst + (c - lo)));
      }
    }
  }
  return map;
}

const unescapePdf = (s) =>
  s.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, g) => {
    const simple = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" };
    return simple[g] ?? String.fromCharCode(parseInt(g, 8));
  });

function decodeString(literal, cmap, isHex) {
  const codes = [];
  if (isHex) {
    const h = literal.replace(/[^0-9A-Fa-f]/g, "");
    for (let i = 0; i < h.length; i += 4) codes.push(parseInt(h.slice(i, i + 4), 16));
  } else {
    const s = unescapePdf(literal);
    // Two-byte codes for CID-keyed subsets, one byte for simple fonts. Decided
    // by which interpretation actually lands in this font's cmap.
    const two = [];
    for (let i = 0; i + 1 < s.length; i += 2) two.push((s.charCodeAt(i) << 8) | s.charCodeAt(i + 1));
    const one = [...s].map((ch) => ch.charCodeAt(0));
    const twoHits = two.filter((c) => cmap?.has(c)).length;
    const oneHits = one.filter((c) => cmap?.has(c)).length;
    codes.push(...(twoHits > oneHits ? two : one));
  }
  return codes
    .map((c) => cmap?.get(c) ?? (c >= 32 && c < 127 ? String.fromCharCode(c) : ""))
    .join("");
}

/**
 * @param {string} file path to a PDF
 * @returns {string} its text, best effort
 */
function extract(file) {
  const buf = fs.readFileSync(file);
  const raw = buf.toString("latin1");

  // Every indirect object, with stream bodies inflated where possible.
  const objects = new Map();
  const objRe = /(\d+)\s+(\d+)\s+obj\b/g;
  let m;
  while ((m = objRe.exec(raw))) {
    const id = `${m[1]} ${m[2]}`;
    const bodyStart = m.index + m[0].length;
    const endIdx = raw.indexOf("endobj", bodyStart);
    if (endIdx < 0) continue;
    const body = raw.slice(bodyStart, endIdx);

    let stream = null;
    const sm = /stream\r?\n/.exec(body);
    if (sm) {
      const s = bodyStart + sm.index + sm[0].length;
      const e = raw.indexOf("endstream", s);
      if (e > 0) {
        try {
          stream = zlib.inflateSync(buf.subarray(s, e));
        } catch {
          stream = buf.subarray(s, e);
        }
      }
    }
    objects.set(id, { dict: sm ? body.slice(0, sm.index) : body, stream });
  }

  // ToUnicode CMaps, by the object id that holds them.
  const cmapByObj = new Map();
  for (const [id, o] of objects) {
    if (!o.stream) continue;
    const t = o.stream.toString("latin1");
    if (t.includes("beginbfchar") || t.includes("beginbfrange")) {
      cmapByObj.set(id, parseCMap(t));
    }
  }

  // Font resource name (/F1) -> cmap. Every /Font dictionary in the file is
  // merged rather than resolved per page: for a scan this is enough, and a
  // wrong-font decode still produces the digits we are looking for.
  const fontMaps = new Map();
  for (const [, o] of objects) {
    if (!o.dict?.includes("/Font")) continue;
    const fontBlock = /\/Font\s*<<([\s\S]*?)>>/.exec(o.dict);
    if (!fontBlock) continue;
    for (const p of fontBlock[1].matchAll(/\/([A-Za-z0-9+._-]+)\s+(\d+)\s+(\d+)\s+R/g)) {
      const font = objects.get(`${p[2]} ${p[3]}`);
      if (!font) continue;
      const tu = /\/ToUnicode\s+(\d+)\s+(\d+)\s+R/.exec(font.dict);
      if (!tu) continue;
      const cm = cmapByObj.get(`${tu[1]} ${tu[2]}`);
      if (cm) fontMaps.set(p[1], cm);
    }
  }

  let text = "";
  for (const [, o] of objects) {
    if (!o.stream) continue;
    const content = o.stream.toString("latin1");
    if (!/\bBT\b/.test(content)) continue;

    let current = null;
    const tokenRe =
      /\/([A-Za-z0-9+._-]+)\s+[\d.]+\s+Tf|\(((?:\\.|[^()\\])*)\)\s*(?:Tj|TJ|')|<([0-9A-Fa-f\s]+)>\s*(?:Tj|TJ)|\bTd\b|\bTD\b|\bT\*\b|\bET\b/g;
    let t;
    while ((t = tokenRe.exec(content))) {
      if (t[1] !== undefined) current = fontMaps.get(t[1]) ?? null;
      else if (t[2] !== undefined) text += decodeString(t[2], current, false);
      else if (t[3] !== undefined) text += decodeString(t[3], current, true);
      else text += " ";
    }
    text += "\n";
  }

  return text.replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim();
}

/**
 * The same text with every space removed.
 *
 * This producer emits one glyph per show-string, so `extract` returns
 * "N i a z N a f i" and trying to re-infer the word breaks is guesswork.
 * Stripping whitespace entirely sidesteps it: the things worth scanning for —
 * phone numbers, email addresses — contain no spaces anyway, so they survive
 * intact and become findable. Unreadable, and exactly right for a grep.
 */
function dense(file) {
  return extract(file).replace(/\s+/g, "");
}

/** A rough word-broken rendering, for eyeballing. Not authoritative. */
function readable(file) {
  return dense(file)
    .replace(/([a-z0-9.])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/([•·])/g, " $1 ");
}

module.exports = { extract, dense, readable };

// node scripts/pdf-text.cjs <file> [maxChars]
if (require.main === module) {
  console.log(readable(process.argv[2]).slice(0, Number(process.argv[3] ?? 6000)));
}
