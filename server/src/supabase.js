import { createClient } from "@supabase/supabase-js";

/**
 * Supabase is optional here, on purpose.
 *
 * The site's content is a CV. It changes a few times a year, it is already
 * compiled into the client bundle at build time, and none of it is private.
 * So the database is the place the content is *edited and owned*, not a
 * dependency the page needs in order to render. If the project is paused, the
 * key is rotated, or Supabase has a bad afternoon, the API degrades to serving
 * the committed snapshot and nobody looking at the site can tell.
 *
 * Read-only, anon key: the portfolio_* tables carry a select-only RLS policy
 * and no write policy at all, so there is nothing the anon key can damage.
 */

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_ANON_KEY?.trim();

export const isConfigured = Boolean(url && key);

if (!isConfigured) {
  console.warn(
    "[supabase] SUPABASE_URL / SUPABASE_ANON_KEY not set — serving the committed snapshot",
  );
} else if (/service_role|^sb_secret_/.test(key)) {
  // Loud, because a secret key on a public-read API is a real mistake and the
  // symptom (everything works) gives you no reason to look.
  throw new Error(
    "[supabase] SUPABASE_ANON_KEY looks like a service-role/secret key. " +
      "This API needs read access only — use the anon/publishable key.",
  );
}

export const supabase = isConfigured
  ? createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": "niaz-portfolio-api" } },
    })
  : null;
