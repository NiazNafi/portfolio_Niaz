/**
 * Turns the SPA build into real HTML files, one per route.
 *
 * Why this exists rather than shipping a plain single-page app:
 *
 *   · §8 caps LCP at 2.5s on simulated 4G. A blank div that waits for React to
 *     parse and execute before painting anything cannot meet that on a
 *     mid-range Android phone, which §2 says is the majority case.
 *   · §8 also wants per-page title and description. A crawler that does not
 *     run JavaScript sees whatever is in the served HTML, and for an SPA that
 *     is the same shell on every URL.
 *
 * Also emits sitemap.xml, robots.txt and a 404.html, so the whole dist/ is
 * deployable to any static host with no server-side routing configuration.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import content from "../content/source.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "client/dist");

const { render, ROUTES } = await import(
  pathToFileURL(path.join(root, "client/dist-ssr/entry-server.js")).href
);

const template = await readFile(path.join(dist, "index.html"), "utf8");

const escape = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Routes come from the router itself so this cannot fall behind a new page. */
const routes = ROUTES;

function headTags(head) {
  return [
    `<title>${escape(head.title)}</title>`,
    `<meta name="description" content="${escape(head.description)}" />`,
    `<link rel="canonical" href="${escape(head.canonical)}" />`,
    `<meta property="og:type" content="${escape(head.type)}" />`,
    `<meta property="og:title" content="${escape(head.title)}" />`,
    `<meta property="og:description" content="${escape(head.description)}" />`,
    `<meta property="og:url" content="${escape(head.canonical)}" />`,
    `<meta property="og:image" content="${escape(head.image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join("\n    ");
}

/**
 * Structured data for the home page only. A hiring panel's first contact with
 * this site is often a Google result, and Person markup is what lets the name,
 * the role and the employer travel with it.
 */
function personJsonLd() {
  const { profile, site, education } = content;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    worksFor: { "@type": "Organization", name: profile.employer },
    url: site.url,
    email: `mailto:${profile.email}`,
    alumniOf: education.map((e) => ({ "@type": "EducationalOrganization", name: e.org })),
    sameAs: [profile.links.github, profile.links.linkedin, profile.links.practice],
  });
}

await mkdir(dist, { recursive: true });

for (const route of routes) {
  const { html, head } = render(route);

  let page = template
    .replace("<!--app-->", html)
    .replace("<!--head-->", headTags(head))
    // Stamp which route this file is for, so the client can tell whether the
    // host served matching markup before it tries to hydrate against it.
    .replace('data-route="/"', `data-route="${route}"`);

  if (route === "/") {
    page = page.replace(
      "</head>",
      `  <script type="application/ld+json">${personJsonLd()}</script>\n  </head>`,
    );
  }

  const out = route === "/" ? path.join(dist, "index.html") : path.join(dist, route, "index.html");
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, page, "utf8");
  console.log(`  ✓ ${route} → ${path.relative(root, out)}`);
}

// A 404 that is a real page, so a mistyped URL on a static host is still the
// site rather than the host's default error screen.
{
  const { html, head } = render("/definitely-not-a-route");
  await writeFile(
    path.join(dist, "404.html"),
    template
      .replace("<!--app-->", html)
      .replace("<!--head-->", headTags(head))
      // No data-route: this file is deliberately served for URLs it was not
      // rendered for, so there is no route it could claim to match. The client
      // skips the check and hydrates, which is correct — every unknown path
      // renders the same 404 tree.
      .replace(' data-route="/"', ""),
    "utf8",
  );
  console.log("  ✓ 404.html");
}

// ── sitemap and robots ─────────────────────────────────────────────────────

const urls = routes
  .map((route) => {
    const loc = `${content.site.url}${route === "/" ? "" : route}`;
    const priority = route === "/" ? "1.0" : "0.8";
    return `  <url>\n    <loc>${loc}</loc>\n    <priority>${priority}</priority>\n  </url>`;
  })
  .join("\n");

await writeFile(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  "utf8",
);

await writeFile(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${content.site.url}/sitemap.xml\n`,
  "utf8",
);

console.log("  ✓ sitemap.xml, robots.txt");

if (content.site.urlIsPlaceholder) {
  console.warn(
    `\n  ! canonical URLs and the sitemap were written with the placeholder domain ` +
      `${content.site.url}. Set the real one in content/source.mjs before deploying (BLOCKING-2).`,
  );
}
