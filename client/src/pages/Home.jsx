import { Link } from "react-router-dom";

import { Missing, Rule, Section } from "@/components/Chrome";
import { RotatingAmbigram } from "@/components/RotatingAmbigram";
import { Head } from "@/lib/head";
import { useContent } from "@/lib/content";
import { Email } from "@/components/Email";

/**
 * The home page has to serve two audiences whose interests pull against each
 * other (§1). The resolution is order, not compromise:
 *
 *   hero        one live ambigram, doing the thing, plus the CV button
 *   work        the roles — the credibility a hiring panel came for
 *   ambigrams   the craft evidence, with the technique note beside it
 *   projects    what he has actually built
 *   about       short, first person
 *   contact     email, links, CV
 *
 * Work sits above the gallery so §9's first acceptance criterion holds: land,
 * understand the current role, download the CV, without scrolling past the art.
 * The hero ambigram is the exception, and it is deliberate — §5.1 says the
 * letterform *is* the thesis of the page, and it costs a recruiter one screen.
 */
export default function Home() {
  const [content] = useContent();
  const { profile, site, experience, education, awards, skills, projects, ambigrams, technique, caseStudy } =
    content;

  const hero = ambigrams.find((a) => a.hero) ?? ambigrams[0];
  const featured = ambigrams.filter((a) => a.featured && a.id !== hero.id).slice(0, 6);

  return (
    <>
      <Head
        title={null}
        description={site.description}
        path="/"
      />

      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-rule bg-paper-raised">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <h1 className="text-3xl leading-[1.15] sm:text-4xl md:text-[2.75rem]">
              {profile.name}
            </h1>
            <p className="measure mt-4 text-lg text-ink-soft">{profile.positioning}</p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={site.cv.href}
                download
                className="rounded-sm bg-ink px-5 py-2.5 font-medium text-paper transition-colors hover:bg-madder"
              >
                {site.cv.label}
              </a>
              <a href="#work" className="border-b border-rule pb-0.5 text-ink-soft hover:text-ink">
                See the work
              </a>
            </div>
          </div>

          <div>
            <RotatingAmbigram piece={hero} variant="hero" priority />
            <p className="mt-4 text-sm text-ink-faint">
              Hover, tap, or focus and press Enter. It turns 180° and reads as the other name.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 py-14">
        {/* ── work ───────────────────────────────────────────────────────── */}
        <Section id="work" title="Work">
          <ol className="space-y-10">
            {experience.map((role) => (
              <li key={role.id}>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="text-xl">{role.title}</h3>
                  <p className="text-ink-soft">
                    {role.orgUrl ? (
                      <a href={role.orgUrl} className="border-b border-rule">
                        {role.org}
                      </a>
                    ) : (
                      role.org
                    )}
                    {" · "}
                    {role.location}
                  </p>
                </div>
                <p className="mt-1 text-sm text-ink-faint">{role.period}</p>
                <p className="measure mt-3">{role.summary}</p>
                {role.confidentialityNote && (
                  <p className="measure mt-2 text-sm italic text-ink-faint">
                    {role.confidentialityNote}
                  </p>
                )}
                {role.tags?.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {role.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-sm border border-rule px-2 py-0.5 text-xs text-ink-soft"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-10 border-t border-rule pt-6">
            <h3 className="text-lg">{caseStudy.title}</h3>
            <p className="measure mt-2 text-ink-soft">{caseStudy.summary}</p>
            <Link
              to={`/work/${caseStudy.slug}`}
              className="mt-3 inline-block border-b border-madder pb-0.5 text-madder"
            >
              Read the case study
            </Link>
          </div>
        </Section>

        <Rule label="180°" />

        {/* ── ambigrams ──────────────────────────────────────────────────── */}
        <Section
          id="ambigrams"
          title="Ambigrams"
          lede="Rotational ambigrams in Bangla script. One drawing, read two ways."
        >
          <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            {featured.map((piece) => (
              <li key={piece.id}>
                <RotatingAmbigram piece={piece} />
              </li>
            ))}
          </ul>

          {/* §5.2: the explanation sits where a curious recruiter reads it by
              accident — directly under the grid they have just been playing
              with, not behind a link. */}
          <div className="mt-14 grid gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <h3 className="text-xl">{technique.heading}</h3>
              {technique.body.map((para) => (
                <p key={para.slice(0, 24)} className="measure mt-3 text-ink-soft">
                  {para}
                </p>
              ))}
            </div>

            <div className="self-start rounded-sm border border-rule bg-paper-raised p-5 md:w-64">
              <p className="text-sm text-ink-soft">{technique.commission.text}</p>
              <a
                href={technique.commission.href}
                className="mt-2 inline-block border-b border-madder pb-0.5 text-madder"
              >
                {technique.commission.linkLabel}
              </a>
            </div>
          </div>

          <p className="mt-8">
            <Link to="/ambigrams" className="border-b border-rule pb-0.5">
              All {ambigrams.length} pieces
            </Link>
          </p>
        </Section>

        <Rule label="180°" />

        {/* ── projects ───────────────────────────────────────────────────── */}
        <Section id="projects" title="Projects">
          <ul className="grid gap-8 md:grid-cols-3">
            {projects.map((project) => (
              <li
                key={project.id}
                className="flex flex-col rounded-sm border border-rule bg-paper-raised p-5"
              >
                {project.kicker && (
                  <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">
                    {project.kicker}
                  </p>
                )}
                <h3 className="mt-2 text-lg">{project.title}</h3>
                <p className="mt-2 text-ink-soft">{project.oneLiner}</p>
                <p className="mt-3 text-sm text-ink-soft">{project.body}</p>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {project.stack.map((tech) => (
                    <li key={tech} className="text-xs text-ink-faint">
                      {tech}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-1">
                  {project.link ? (
                    <a href={project.link} className="border-b border-madder pb-0.5 text-madder">
                      View project
                    </a>
                  ) : (
                    // §5.5 / open question: a dead "Live Demo" link is worse
                    // than no link, so there is no button until there is a URL.
                    <Missing>{project.linkNote.__todo}</Missing>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Rule label="180°" />

        {/* ── about ──────────────────────────────────────────────────────── */}
        <Section id="about" title="About">
          <div className="grid gap-8 md:grid-cols-[auto_1fr]">
            <img
              src="/photo/portrait-400.webp"
              srcSet="/photo/portrait-400.webp 400w, /photo/portrait-800.webp 800w"
              sizes="(min-width: 768px) 14rem, 9rem"
              width="400"
              height="533"
              loading="lazy"
              decoding="async"
              alt="Niaz Nafi Rahman in a graduation gown, holding a mortarboard."
              className="h-auto w-36 rounded-sm md:w-56"
            />

            <div>
              {profile.about.map((para) => (
                <p key={para.slice(0, 24)} className="measure mt-0 mb-4 last:mb-0">
                  {para}
                </p>
              ))}

              <div className="mt-8 grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm uppercase tracking-[0.14em] text-ink-faint">Education</h3>
                  <ul className="mt-3 space-y-3">
                    {education.map((item) => (
                      <li key={item.id}>
                        <p>{item.qualification}</p>
                        <p className="text-sm text-ink-soft">
                          {item.org} · {item.finished} · {item.result}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm uppercase tracking-[0.14em] text-ink-faint">Awards</h3>
                  <ul className="mt-3 space-y-3">
                    {awards.map((item) => (
                      <li key={item.id}>
                        <p>{item.title}</p>
                        <p className="text-sm text-ink-soft">{item.year}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-sm uppercase tracking-[0.14em] text-ink-faint">Skills</h3>
            <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((group) => (
                <div key={group.id}>
                  <dt className="text-sm font-medium">{group.label}</dt>
                  <dd className="mt-1 text-sm text-ink-soft">{group.items.join(" · ")}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>

        <Rule label="180°" />

        {/* ── contact ────────────────────────────────────────────────────── */}
        <Section id="contact" title="Contact">
          <ul className="grid gap-4 sm:grid-cols-2">
            <li>
              <p className="text-sm text-ink-faint">Email</p>
              <Email address={profile.email} />
            </li>
            <li>
              <p className="text-sm text-ink-faint">LinkedIn</p>
              <a href={profile.links.linkedin} className="border-b border-rule pb-0.5">
                in/niaz-rahman
              </a>
            </li>
            <li>
              <p className="text-sm text-ink-faint">GitHub</p>
              <a href={profile.links.github} className="border-b border-rule pb-0.5">
                github.com/NiazNafi
              </a>
            </li>
            <li>
              <p className="text-sm text-ink-faint">Commissions</p>
              <a href={profile.links.practice} className="border-b border-rule pb-0.5">
                ghurnilipi.com
              </a>
            </li>
          </ul>

          <p className="mt-8">
            <a
              href={site.cv.href}
              download
              className="inline-block rounded-sm bg-ink px-5 py-2.5 font-medium text-paper transition-colors hover:bg-madder"
            >
              {site.cv.label}
            </a>
          </p>
        </Section>
      </main>
    </>
  );
}
