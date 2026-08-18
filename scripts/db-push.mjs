/**
 * Pushes content/source.mjs into the portfolio_* tables.
 *
 * Schema is applied separately — supabase/migrations/0001_portfolio_init.sql,
 * through the Supabase SQL editor or `supabase db push`. DDL wants a migration
 * history; this script only carries rows, and it is safe to run repeatedly.
 *
 *   node --env-file=.env scripts/db-push.mjs
 *
 * Needs SUPABASE_SECRET_KEY. That key bypasses row level security, which is
 * exactly why it is not the key the running site uses.
 */

import { createClient } from "@supabase/supabase-js";

import content from "../content/source.mjs";

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim();

if (!url || !key) {
  console.error(
    "SUPABASE_URL and SUPABASE_SECRET_KEY are required.\n" +
      "Copy .env.example to .env and fill them in, then run:\n" +
      "  node --env-file=.env scripts/db-push.mjs",
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const monthToDate = (m) => (m ? `${m}-01` : null);

const ordered = (rows) => rows.map((r, i) => ({ ...r, sort_order: (i + 1) * 10 }));

/** Every table, in the shape Postgres wants. Mirrors scripts/generate.mjs. */
const TABLES = [
  {
    name: "portfolio_profile",
    rows: [
      {
        id: "primary",
        name: content.profile.name,
        role: content.profile.role,
        employer: content.profile.employer,
        location: content.profile.location,
        positioning: content.profile.positioning,
        email: content.profile.email,
        links: content.profile.links,
        about: content.profile.about,
      },
    ],
  },
  {
    name: "portfolio_experience",
    rows: content.experience.map((r, i) => ({
      id: r.id,
      // Authored order: the array in source.mjs is the running order.
      sort_order: (i + 1) * 10,
      title: r.title,
      org: r.org,
      org_url: r.orgUrl ?? null,
      location: r.location,
      period: r.period,
      starts_on: monthToDate(r.start),
      ends_on: monthToDate(r.end),
      summary: r.summary,
      note: r.confidentialityNote ?? null,
      tags: r.tags,
    })),
  },
  // Array position is the running order for these three; see the comment on
  // portfolio_education in 0001_portfolio_init.sql.
  { name: "portfolio_education", rows: ordered(content.education) },
  { name: "portfolio_awards", rows: ordered(content.awards) },
  { name: "portfolio_skills", rows: ordered(content.skills) },
  {
    name: "portfolio_projects",
    rows: content.projects.map((r) => ({
      id: r.id,
      sort_order: r.order,
      title: r.title,
      kicker: r.kicker,
      one_liner: r.oneLiner,
      body: r.body,
      stack: r.stack,
      link: r.link,
      link_note: r.linkNote ?? null,
    })),
  },
  {
    name: "portfolio_ambigrams",
    rows: content.ambigrams.map((r) => ({
      id: r.id,
      sort_order: r.order,
      kind: r.kind,
      reads: r.reads,
      note: r.note ?? null,
      year: r.year ?? null,
      widths: r.widths,
      featured: Boolean(r.featured),
      is_hero: Boolean(r.hero),
    })),
  },
  {
    name: "portfolio_case_studies",
    rows: [
      {
        id: content.caseStudy.id,
        slug: content.caseStudy.slug,
        title: content.caseStudy.title,
        role: content.caseStudy.role,
        period: content.caseStudy.period,
        repo: content.caseStudy.repo,
        summary: content.caseStudy.summary,
        sections: content.caseStudy.sections,
        outcomes: content.caseStudy.outcomes,
        photos: content.caseStudy.photos,
        photos_note: content.caseStudy.photosNote ?? null,
        video: content.caseStudy.video,
      },
    ],
  },
];

let failed = false;

for (const table of TABLES) {
  const { error } = await db.from(table.name).upsert(table.rows, { onConflict: "id" });
  if (error) {
    failed = true;
    console.error(`  ✗ ${table.name}: ${error.message}`);
    if (error.message.includes("does not exist")) {
      console.error(
        `    Apply supabase/migrations/0001_portfolio_init.sql first ` +
          `(Supabase dashboard → SQL editor, or \`supabase db push\`).`,
      );
    }
  } else {
    console.log(`  ✓ ${table.name}: ${table.rows.length} row(s)`);
  }
}

/**
 * Rows deleted from source.mjs would otherwise linger in the database and keep
 * being served — the API reads whatever is there, not whatever is in the file.
 */
for (const table of TABLES) {
  const ids = table.rows.map((r) => r.id);
  const { data, error } = await db.from(table.name).select("id");
  if (error || !data) continue;
  const orphans = data.map((r) => r.id).filter((id) => !ids.includes(id));
  if (!orphans.length) continue;
  const { error: delError } = await db.from(table.name).delete().in("id", orphans);
  if (delError) console.error(`  ✗ ${table.name}: could not remove ${orphans.join(", ")}`);
  else console.log(`  − ${table.name}: removed ${orphans.length} row(s) no longer in source`);
}

process.exit(failed ? 1 : 0);
