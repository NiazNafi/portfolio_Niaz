import { Link, NavLink } from "react-router-dom";

import { getContent } from "@/lib/content";

/**
 * Header, footer and the small shared primitives.
 *
 * The nav carries three destinations and a CV button. §2 goal 1 is that a
 * recruiter can establish credibility and get the CV inside sixty seconds
 * without scrolling past art they did not come for, so the download is in the
 * header on every page rather than only at the bottom of the home page.
 */

export function SiteHeader() {
  const { site } = getContent();

  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
        <Link to="/" className="font-display text-lg tracking-tight">
          Niaz Nafi Rahman
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-5 text-sm">
          <Nav to="/ambigrams">Ambigrams</Nav>
          <Nav to="/work/bracu-alter">BRACU Alter</Nav>
        </nav>

        <a
          href={site.cv.href}
          download
          className="ml-auto rounded-sm bg-ink px-3.5 py-2 text-sm font-medium text-paper transition-colors hover:bg-madder"
        >
          {site.cv.label}
        </a>
      </div>
    </header>
  );
}

function Nav({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `border-b transition-colors ${
          isActive
            ? "border-madder text-ink"
            : "border-transparent text-ink-soft hover:border-rule hover:text-ink"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export function SiteFooter() {
  const { profile, site } = getContent();

  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <p>
          {profile.name} · {profile.location}
        </p>
        <nav aria-label="Elsewhere" className="flex flex-wrap gap-4">
          <a href={profile.links.github}>GitHub</a>
          <a href={profile.links.linkedin}>LinkedIn</a>
          <a href={profile.links.practice}>ghurnilipi.com</a>
          <a href={site.cv.href} download>
            CV
          </a>
        </nav>
      </div>
    </footer>
  );
}

/**
 * A section rule that is unchanged by a half turn — a mark, a line, a mark.
 * The 180° idea stated in the furniture rather than announced (§7).
 */
export function Rule({ label }) {
  return (
    <div className="rule-180 my-14" role="presentation">
      {label ? (
        <span className="text-xs uppercase tracking-[0.2em] text-ink-faint">{label}</span>
      ) : (
        <span aria-hidden="true" className="text-ink-faint">
          ·
        </span>
      )}
    </div>
  );
}

export function Section({ id, title, lede, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-20">
      <h2 id={`${id}-heading`} className="text-2xl sm:text-3xl">
        {title}
      </h2>
      {lede && <p className="measure mt-3 text-ink-soft">{lede}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

/**
 * A gap the site is honest about.
 *
 * §0 item 2: stub missing assets with obvious placeholders, never invented
 * content. This renders one visibly enough that it cannot be shipped by
 * accident, and `npm run generate` lists every instance.
 */
export function Missing({ children }) {
  return (
    <p className="measure rounded-sm border border-dashed border-madder/50 bg-madder/5 px-4 py-3 text-sm text-madder">
      <strong className="font-medium">Not published yet — </strong>
      {children}
    </p>
  );
}
