import { Link } from "react-router-dom";

import { Missing, Rule } from "@/components/Chrome";
import { Head } from "@/lib/head";
import { useContent } from "@/lib/content";
import manifest from "@/data/artwork-manifest.json";

/**
 * One case-study photograph.
 *
 * `figcaption` has to live inside a `figure` to mean anything — outside one it
 * is just a styled div as far as assistive technology is concerned, which is
 * how it was written before.
 *
 * Intrinsic dimensions come from the asset manifest rather than being hardcoded,
 * so the box is reserved at the right aspect and swapping the source for a
 * differently-shaped photograph cannot introduce a layout shift (§7).
 */
function Photograph({ photo, only }) {
  const dims = manifest[photo.id] ?? { width: 16, height: 9 };
  const srcSet = photo.widths.map((w) => `/photo/${photo.id}-${w}.webp ${w}w`).join(", ");

  return (
    <figure>
      <img
        src={`/photo/${photo.id}-1024.webp`}
        srcSet={srcSet}
        sizes={only ? "(min-width: 768px) 44rem, 92vw" : "(min-width: 640px) 21rem, 92vw"}
        width={dims.width}
        height={dims.height}
        loading="lazy"
        decoding="async"
        alt={photo.alt}
        className="h-auto w-full rounded-sm"
      />
      <figcaption className="mt-2 text-sm text-ink-soft">
        {photo.caption}
        {photo.credit && <span className="text-ink-faint"> — {photo.credit}</span>}
      </figcaption>
    </figure>
  );
}

/**
 * RoboCup Rescue case study (§5.4).
 *
 * Structured problem → his team's slice → what they built → the result, not a
 * bullet dump. The two hard numbers are presented as outcomes with the context
 * that makes them mean something, because both are genuinely strong and both
 * are meaningless bare.
 *
 * The role scoping in §3 is load-bearing and an interviewer will unpick it, so
 * it is stated plainly and more than once: he led the AI team *within* the
 * squad, and the robot — not him — reached the final in Eindhoven.
 */
export default function BracuAlter() {
  const [content] = useContent();
  const { caseStudy } = content;

  return (
    <>
      <Head
        title={caseStudy.title}
        description="Leading the five-person AI team inside BRACU Alter: hazmat sign detection at 95% accuracy on edge hardware, and a mapping architecture that halved the sensor cost. RoboCup Rescue 2024 global finalist."
        path={`/work/${caseStudy.slug}`}
        type="article"
      />

      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-sm text-ink-faint">
          <Link to="/#work" className="border-b border-rule pb-0.5">
            Work
          </Link>
        </p>

        <h1 className="mt-4 text-3xl sm:text-4xl">{caseStudy.title}</h1>

        <p className="mt-4 text-ink-soft">{caseStudy.role}</p>
        <p className="mt-1 text-sm text-ink-faint">{caseStudy.period}</p>

        <p className="measure mt-6 text-lg">{caseStudy.summary}</p>

        {/* ── the numbers ─────────────────────────────────────────────────
            On the inverted band: this is the part a hiring panel is scanning
            for, and it is also where the 180° idea earns its place in the
            layout rather than being decoration. */}
        <div className="verso -mx-5 mt-10 px-5 py-8 sm:mx-0 sm:rounded-sm sm:px-8">
          <h2 className="sr-only">Outcomes</h2>
          <ul className="grid gap-8 sm:grid-cols-3">
            {caseStudy.outcomes.map((outcome) => (
              <li key={outcome.id}>
                <p className="font-display text-3xl">{outcome.figure}</p>
                <p className="mt-1 text-sm font-medium">{outcome.label}</p>
                <p className="mt-2 text-sm text-paper/70">{outcome.context}</p>
              </li>
            ))}
          </ul>
        </div>

        <Rule />

        {/* ── the narrative ───────────────────────────────────────────────── */}
        {caseStudy.sections.map((section) => (
          <section key={section.id} aria-labelledby={`${section.id}-heading`} className="mb-12">
            <h2 id={`${section.id}-heading`} className="text-2xl">
              {section.heading}
            </h2>
            {section.body.map((para) => (
              <p key={para.slice(0, 24)} className="measure mt-4">
                {para}
              </p>
            ))}
          </section>
        ))}

        {/* ── media ───────────────────────────────────────────────────────── */}
        <section aria-labelledby="media-heading" className="mb-12">
          <h2 id="media-heading" className="text-2xl">
            Photographs and video
          </h2>

          {caseStudy.photos.length > 0 && (
            <ul
              // A single photograph gets the full measure; two or more share it.
              // §5.4 allows full-bleed only above ~1600px on the long edge, and
              // the one photograph here is 1920 — so it earns the width.
              className={`mt-6 ${caseStudy.photos.length > 1 ? "grid gap-6 sm:grid-cols-2" : ""}`}
            >
              {caseStudy.photos.map((photo) => (
                <li key={photo.id}>
                  <Photograph photo={photo} only={caseStudy.photos.length === 1} />
                </li>
              ))}
            </ul>
          )}

          {/* Present even when there are photographs: §5.4 asks for two or three
              and there is one, so the page says what is still wanted rather than
              implying the record is complete. */}
          {caseStudy.photosNote && (
            <div className="mt-6">
              <Missing>{caseStudy.photosNote.__todo}</Missing>
            </div>
          )}

          {/* §5.4 forbids the Facebook SDK or iframe embed outright — it loads
              tracking scripts, creates a cookie-consent obligation, shows
              logged-out visitors a login wall, and fails silently if the post
              changes. Fallback tier three, a plain link, until someone
              confirms the URL resolves and who owns the video. */}
          <div className="mt-8 rounded-sm border border-rule bg-paper-raised p-5">
            <a href={caseStudy.video.url} className="border-b border-madder pb-0.5 text-madder">
              {caseStudy.video.label} →
            </a>
            <p className="measure mt-3 text-sm text-ink-soft">{caseStudy.video.credit}</p>
            {caseStudy.video.unverified && (
              <p className="measure mt-2 text-sm text-ink-faint">
                Link not yet verified — see the open items note in the repository.
              </p>
            )}
          </div>
        </section>

        <Rule />

        <p>
          <a href={caseStudy.repo} className="border-b border-madder pb-0.5 text-madder">
            github.com/NiazNafi/Bracu-Alter
          </a>
        </p>
      </main>
    </>
  );
}
