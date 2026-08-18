import snapshot from "../../content/source.mjs";
import { isConfigured, supabase } from "./supabase.js";

/**
 * Assembles the content payload.
 *
 * Shape is identical whether it came from Postgres or from the snapshot — the
 * client cannot tell, and should not have to. `meta.source` is there for
 * operators, not for rendering.
 *
 * One round trip fetches all eight tables in parallel. If any single query
 * fails the whole read is abandoned and the snapshot is served instead, rather
 * than assembling a page that is half current and half stale — a CV that shows
 * last year's job title next to this year's projects is worse than one that is
 * uniformly a build behind.
 */

const TTL_MS = 5 * 60 * 1000;

let cache = { at: 0, payload: null };

/** Postgres columns are snake_case; the client's shape is camelCase. */
const fromRows = {
  profile: (r) => ({
    name: r.name,
    role: r.role,
    employer: r.employer,
    location: r.location,
    positioning: r.positioning,
    email: r.email,
    links: r.links,
    about: r.about,
  }),
  experience: (r) => ({
    id: r.id,
    title: r.title,
    org: r.org,
    orgUrl: r.org_url,
    location: r.location,
    period: r.period,
    start: r.starts_on?.slice(0, 7),
    end: r.ends_on?.slice(0, 7) ?? null,
    summary: r.summary,
    confidentialityNote: r.note ?? undefined,
    tags: r.tags,
  }),
  education: (r) => ({
    id: r.id,
    qualification: r.qualification,
    org: r.org,
    finished: r.finished,
    result: r.result,
  }),
  awards: (r) => ({ id: r.id, title: r.title, year: r.year }),
  skills: (r) => ({ id: r.id, label: r.label, items: r.items }),
  projects: (r) => ({
    id: r.id,
    order: r.sort_order,
    title: r.title,
    kicker: r.kicker,
    oneLiner: r.one_liner,
    body: r.body,
    stack: r.stack,
    link: r.link,
    linkNote: r.link_note ?? undefined,
  }),
  ambigrams: (r) => ({
    id: r.id,
    order: r.sort_order,
    kind: r.kind,
    reads: r.reads,
    note: r.note ?? undefined,
    year: r.year ?? undefined,
    widths: r.widths,
    featured: r.featured,
    hero: r.is_hero,
  }),
  caseStudy: (r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    role: r.role,
    period: r.period,
    repo: r.repo,
    summary: r.summary,
    sections: r.sections,
    outcomes: r.outcomes,
    photos: r.photos,
    photosNote: r.photos_note ?? undefined,
    video: r.video,
  }),
};

async function readFromSupabase() {
  const q = (table, order) => {
    let query = supabase.from(table).select("*");
    if (order) query = query.order(order.column, { ascending: order.asc ?? true });
    return query;
  };

  const [profile, experience, education, awards, skills, projects, ambigrams, cases] =
    await Promise.all([
      supabase.from("portfolio_profile").select("*").eq("id", "primary").single(),
      q("portfolio_experience", { column: "sort_order" }),
      q("portfolio_education", { column: "sort_order" }),
      q("portfolio_awards", { column: "sort_order" }),
      q("portfolio_skills", { column: "sort_order" }),
      q("portfolio_projects", { column: "sort_order" }),
      q("portfolio_ambigrams", { column: "sort_order" }),
      q("portfolio_case_studies"),
    ]);

  const failed = [profile, experience, education, awards, skills, projects, ambigrams, cases]
    .map((r) => r.error)
    .filter(Boolean);
  if (failed.length) throw failed[0];

  const caseStudy = cases.data.find((c) => c.slug === snapshot.caseStudy.slug) ?? cases.data[0];
  if (!caseStudy) throw new Error("no case study rows");

  return {
    // Not stored: site config and the technique copy are build concerns, not
    // things Niaz would edit in a database at 1am.
    site: snapshot.site,
    technique: snapshot.technique,
    // The hero seal is not gallery content and has no table; it travels with the
    // snapshot so a live payload can never arrive without a hero.
    signature: snapshot.signature,

    profile: fromRows.profile(profile.data),
    experience: experience.data.map(fromRows.experience),
    education: education.data.map(fromRows.education),
    awards: awards.data.map(fromRows.awards),
    skills: skills.data.map(fromRows.skills),
    projects: projects.data.map(fromRows.projects),
    ambigrams: ambigrams.data.map(fromRows.ambigrams),
    caseStudy: fromRows.caseStudy(caseStudy),
  };
}

/**
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<{ payload: object, source: 'supabase' | 'snapshot', error?: string }>}
 */
export async function getContent(opts = {}) {
  if (!opts.force && cache.payload && Date.now() - cache.at < TTL_MS) {
    return cache.payload;
  }

  let result;
  if (!isConfigured) {
    result = { payload: snapshot, source: "snapshot" };
  } else {
    try {
      result = { payload: await readFromSupabase(), source: "supabase" };
    } catch (err) {
      console.error("[content] Supabase read failed, falling back to snapshot:", err.message);
      result = { payload: snapshot, source: "snapshot", error: err.message };
    }
  }

  cache = { at: Date.now(), payload: result };
  return result;
}

export function clearCache() {
  cache = { at: 0, payload: null };
}
