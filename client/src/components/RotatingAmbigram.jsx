import { useCallback, useEffect, useId, useRef, useState } from "react";

import manifest from "@/data/artwork-manifest.json";
import { usePointerHover } from "@/lib/usePointerHover";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * The signature interaction (requirements §6).
 *
 * One drawing that reads as one word upright and another turned 180°. This is
 * the thesis of the whole site, so it is the one place boldness is spent —
 * and the one place the accessibility work is not optional, because if the
 * second reading exists only inside an animation then the site has failed to
 * say the thing it is about.
 *
 * How the behaviour is split:
 *
 *   motion       CSS transform only (see styles/index.css). No JS animation
 *                loop, no library, GPU-composited, and interruptible for free
 *                because a single transitioning property retargets from
 *                wherever it currently is rather than queueing.
 *
 *   axis         transform-origin comes from the measured centre of rotational
 *                symmetry for this specific piece, not from the bounding box.
 *                See scripts/rotation-centres.mjs.
 *
 *   caption      crossfades on a delay tuned to land as the rotation settles,
 *                also pure CSS, so a reversal mid-turn cannot desynchronise it
 *                from the artwork.
 *
 *   reduced      no rotation at all. Both readings are shown at once, side by
 *   motion       side, with the second copy statically inverted so a reader
 *                can still see what the piece does.
 *
 *   assistive    both readings are in the accessible name from the start, so
 *   tech         nothing depends on observing a state change.
 */

/** Fallback if a piece has no measured entry — e.g. a new export not yet run
 *  through `npm run assets`. Square, centre origin. */
const FALLBACK = { origin: { x: 0.5, y: 0.5 }, width: 1, height: 1 };

/**
 * @param {object} props
 * @param {import('@/lib/types').Ambigram} props.piece
 * @param {'hero'|'tile'} [props.variant]
 * @param {string} [props.sizes] rendered width, for srcset selection
 * @param {boolean} [props.priority] skip lazy-loading (the hero, and only it)
 */
export function RotatingAmbigram({ piece, variant = "tile", sizes, priority = false }) {
  const reduced = useReducedMotion();
  const canHover = usePointerHover();
  const [turned, setTurned] = useState(false);
  const [inView, setInView] = useState(priority);
  const ref = useRef(null);
  const captionId = useId();

  const art = manifest[piece.id] ?? FALLBACK;
  const [first, second] = piece.reads;
  const flips = Boolean(second); // a single-name piece reads as itself

  /**
   * §6: "Do not animate more than a handful simultaneously; use
   * IntersectionObserver to activate only what's on screen." Off-screen tiles
   * never get the transition or will-change, so the compositor is not holding
   * seventeen promoted layers on the gallery page.
   */
  useEffect(() => {
    if (priority || typeof IntersectionObserver === "undefined") return undefined;
    const el = ref.current;
    if (!el) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        // Turning back when it scrolls away means a tile is never left mid-turn
        // in a state nobody chose.
        if (!entry.isIntersecting) setTurned(false);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [priority]);

  const toggle = useCallback(() => setTurned((t) => !t), []);

  // Hover is a pointer-device affordance only. On touch, hover states latch
  // and the piece would be stuck upside down after a tap elsewhere.
  const hoverProps =
    canHover && !reduced
      ? { onPointerEnter: () => setTurned(true), onPointerLeave: () => setTurned(false) }
      : {};

  const alt = flips
    ? `Ambigram of ${first.bn} (${first.en}); rotated 180° it reads ${second.bn} (${second.en}).`
    : `Ambigram of ${first.bn} (${first.en}); it reads the same rotated 180°.`;

  const srcSet = piece.widths.map((w) => `/artwork/${piece.id}-${w}.webp ${w}w`).join(", ");

  const image = (inverted = false) => (
    <img
      src={`/artwork/${piece.id}-960.webp`}
      srcSet={srcSet}
      sizes={sizes ?? (variant === "hero" ? "(min-width: 768px) 40rem, 90vw" : "(min-width: 768px) 20rem, 45vw")}
      width={art.width}
      height={art.height}
      alt=""
      // The alt is empty because the accessible name lives on the control that
      // wraps this; a second copy would have a screen reader say it twice.
      aria-hidden="true"
      draggable="false"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      className="block h-auto w-full select-none"
      style={inverted ? { transform: "rotate(180deg)" } : undefined}
    />
  );

  // ── reduced motion ───────────────────────────────────────────────────────
  // §6: both readings visible simultaneously, no animation, no interaction
  // required. Not a degraded version — for a single-name piece it is arguably
  // the clearer presentation, because you can compare the two directly.
  if (reduced) {
    return (
      <figure ref={ref} className="not-prose">
        <div className={flips ? "grid grid-cols-2 gap-3" : ""}>
          <div>
            {image()}
            <Reading reading={first} className="mt-2" />
          </div>
          {flips && (
            <div>
              {image(true)}
              <Reading reading={second} className="mt-2" />
            </div>
          )}
        </div>
        <figcaption className="sr-only">{alt}</figcaption>
        {piece.note && <Note>{piece.note}</Note>}
      </figure>
    );
  }

  // ── the turn ─────────────────────────────────────────────────────────────

  return (
    <figure ref={ref} className="not-prose">
      <button
        type="button"
        onClick={toggle}
        {...hoverProps}
        aria-pressed={turned}
        aria-describedby={captionId}
        // Both readings are in the name from the start (§6), so a reader who
        // never triggers the rotation still learns what the piece does.
        aria-label={alt}
        className="block w-full cursor-pointer bg-transparent p-0"
      >
        <span
          className={inView ? "turn block" : "block"}
          data-turned={turned ? "true" : "false"}
          style={{
            transformOrigin: `${art.origin.x * 100}% ${art.origin.y * 100}%`,
          }}
        >
          {image()}
        </span>
      </button>

      <figcaption id={captionId} className="mt-3">
        {flips ? (
          // Both readings are rendered and crossfaded rather than swapped, so
          // the box never changes height and the turn cannot shift the layout.
          <span className="grid">
            <CrossfadeReading reading={first} visible={!turned} />
            <CrossfadeReading reading={second} visible={turned} />
          </span>
        ) : (
          <Reading reading={first} />
        )}
      </figcaption>

      {piece.note && <Note>{piece.note}</Note>}
    </figure>
  );
}

/** One reading: Bangla, then the Latin transliteration, then the gloss when
 *  the two readings differ in meaning rather than just in name (§5.2). */
function Reading({ reading, className = "" }) {
  return (
    <span className={`block ${className}`}>
      <span lang="bn" className="font-display text-xl leading-[1.35] text-ink">
        {reading.bn}
      </span>
      <span className="ml-2 text-sm text-ink-soft">
        {reading.en}
        {reading.gloss ? ` — ${reading.gloss}` : ""}
      </span>
    </span>
  );
}

/**
 * Stacked in the same grid cell so both occupy one box. The delay is 55% of
 * the turn: late enough that the words change as the drawing settles rather
 * than while it is still moving, early enough that the fade has finished by
 * the time the motion stops.
 */
function CrossfadeReading({ reading, visible }) {
  return (
    <span
      className="caption-fade col-start-1 row-start-1"
      style={{
        opacity: visible ? 1 : 0,
        transitionDelay: visible ? "calc(var(--duration-turn) * 0.55)" : "0ms",
      }}
      aria-hidden="true"
    >
      <Reading reading={reading} />
    </span>
  );
}

function Note({ children }) {
  return <p className="measure mt-2 text-sm text-ink-faint">{children}</p>;
}
