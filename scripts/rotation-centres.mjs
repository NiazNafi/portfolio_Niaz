/**
 * Finds the true centre of rotation for each ambigram.
 *
 * Requirements §6: "Rotation happens about the artwork's true visual centre,
 * not the bounding box centre. Off-centre rotation reads as broken; verify per
 * asset." Verifying seventeen pieces by eye is exactly the job nobody redoes
 * after the next export, so it is measured instead.
 *
 * The method follows from what an ambigram *is*. A rotational ambigram is a
 * drawing that maps onto itself under a half turn about one particular point.
 * So: threshold the artwork to an ink mask, then find the centre c that
 * maximises the overlap between the mask and the mask rotated 180° about c.
 * That point is the piece's own axis, whatever the canvas margins do.
 *
 * Output is a fraction of width/height, ready for CSS transform-origin.
 */

import sharp from "sharp";

/** Working resolution. Enough to locate the axis to well under a pixel of
 *  display error once scaled back up; small enough for a brute-force search. */
const N = 128;

/** Half-width of the search window, in working-resolution pixels (±25%). */
const SPAN = 32;

/**
 * @param {string} file
 * @returns {Promise<{ x: number, y: number, confidence: number }>}
 */
export async function findCentre(file) {
  const base = sharp(file).resize(N, N, { fit: "fill" }).greyscale();

  /**
   * Ink is found by high-pass rather than by threshold.
   *
   * These exports sit on a warm-to-cool gradient, and any global threshold
   * turns the dark end of that gradient into a large solid block — which is
   * itself beautifully symmetrical, so the search locks onto the middle of the
   * *background band* instead of the lettering. Subtracting a blurred copy
   * removes anything that varies slowly across the canvas and leaves the
   * strokes, which is the only part with a symmetry worth finding.
   *
   * Using the absolute difference also makes this indifferent to whether the
   * piece is drawn dark-on-light or light-on-dark.
   */
  const [flat, blurred] = await Promise.all([
    base.clone().raw().toBuffer(),
    base.clone().blur(N / 16).raw().toBuffer(),
  ]);

  const diff = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i += 1) {
    diff[i] = Math.abs(flat[i] - blurred[i]);
  }

  // Take the strongest ~10% of pixels as ink. A percentile adapts to how heavy
  // the lettering is; a fixed cut does not. The floor keeps sensor noise on an
  // almost-blank canvas from being promoted to ink.
  const ranked = Uint8Array.from(diff).sort();
  const cut = Math.max(6, ranked[Math.floor(ranked.length * 0.9)]);

  const mask = new Uint8Array(N * N);
  let inkCount = 0;
  for (let i = 0; i < N * N; i += 1) {
    if (diff[i] >= cut) {
      mask[i] = 1;
      inkCount += 1;
    }
  }

  if (inkCount < 32) {
    return { x: 0.5, y: 0.5, confidence: 0 };
  }

  // Search: for candidate centre (cx, cy), a point (x, y) maps to
  // (2cx - x, 2cy - y). Score = how much ink lands on ink.
  let best = { x: N / 2, y: N / 2, score: -1 };
  const lo = N / 2 - SPAN;
  const hi = N / 2 + SPAN;

  for (let cy = lo; cy <= hi; cy += 1) {
    for (let cx = lo; cx <= hi; cx += 1) {
      let hit = 0;
      let considered = 0;
      for (let y = 0; y < N; y += 1) {
        const my = 2 * cy - y;
        if (my < 0 || my >= N) continue;
        const rowA = y * N;
        const rowB = my * N;
        for (let x = 0; x < N; x += 1) {
          if (!mask[rowA + x]) continue;
          const mx = 2 * cx - x;
          if (mx < 0 || mx >= N) continue;
          considered += 1;
          hit += mask[rowB + mx];
        }
      }
      // Normalising by `considered` alone would reward centres near a corner,
      // where almost nothing is in range. Weight by the share of ink actually
      // tested so a centre has to explain the whole drawing.
      if (considered === 0) continue;
      const coverage = considered / inkCount;
      const score = (hit / considered) * coverage;
      if (score > best.score) best = { x: cx, y: cy, score };
    }
  }

  return {
    x: Number((best.x / N).toFixed(4)),
    y: Number((best.y / N).toFixed(4)),
    confidence: Number(best.score.toFixed(3)),
  };
}
