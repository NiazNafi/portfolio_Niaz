# Deploying

```bash
npm install
npm run build      # → client/dist
npm run check      # enforces the §8 budgets against what was just built
```

`client/dist` is the whole site: HTML, CSS, JS, images, fonts, the CV. Upload it
anywhere. No server, no database, no environment variables, no build-time
secrets.

Before the first deploy, set the real domain in `content/source.mjs` →
`site.url` and delete `site.urlIsPlaceholder`. The build warns until you do,
because canonical URLs, the sitemap and the Open Graph image URL all use it.

---

## One thing to get right: do not add an SPA rewrite

Every route is a real prerendered file:

```
dist/index.html                      /
dist/ambigrams/index.html            /ambigrams
dist/work/bracu-alter/index.html     /work/bracu-alter
dist/404.html                        anything else
```

So the site needs **no** routing configuration. Hosts resolve `/ambigrams` to
`/ambigrams/index.html` by themselves.

The thing to avoid is the standard single-page-app recipe — a catch-all rewrite
of every path to `index.html`. It is the first result for "deploy React to
Netlify" and it is wrong here: it would serve the home page's markup under every
URL, so a crawler would see the same title and description on all three pages,
and `/404` would be indistinguishable from `/`.

The app defends itself against this (`client/src/main.jsx` compares the route the
HTML was rendered for against the URL, and re-renders from scratch rather than
hydrating mismatched markup) — but that is a safety net, not the plan.

## Per host

**GitHub Pages.** Push `dist` to a `gh-pages` branch or point Pages at it. It
resolves directory indexes and serves `404.html` for unknown paths, both of which
are what we want, with no configuration. If you serve from a subpath rather than
a domain root, set `base` in `client/vite.config.js`.

**Netlify.** Build `npm run build`, publish `client/dist`. The committed
`netlify.toml` sets the headers and, deliberately, no redirects. Do not add
`/* → /index.html`.

**Vercel.** The committed `vercel.json` sets `cleanUrls` and no rewrites.

**Anything else (S3, nginx, Cloudflare Pages).** Two settings: index document
`index.html`, error document `404.html`. Nothing more.

## Caching

Assets under `/assets/` carry content hashes and can be cached for a year.
HTML must not be. The host config files set this; if you deploy elsewhere,
carry the same two rules over.

## Checking a build before it ships

```bash
npm run preview
```

The preview server is configured to resolve directory indexes the way a real
host does (see `staticHostPreview` in `client/vite.config.js`), because Vite's
default is the SPA fallback — which would make the one command meant to rehearse
production the only place that does not behave like it.

Worth checking by hand on the built site, since none of it is automated:

- an ambigram turns 180° and settles, and turning back mid-flight is not stuck
- with reduced motion enabled in the OS, no rotation and both readings visible
- Tab through: every ambigram is reachable and has a visible focus ring
- 360px wide: no horizontal scroll
- Bangla conjuncts and matras render correctly on Chrome/Android, Safari/iOS and
  desktop Firefox — the one thing a Windows dev machine cannot tell you

---

## First-deploy checklist

In order. The first three are hard blockers.

1. **Replace `client/public/cv.pdf` with a redacted copy.** The current one
   publishes your phone number, two referees' contact details, and the
   US-Bangla specifics the site deliberately withholds. `npm run check` fails
   until it is clean. See BLOCKING-5 in [OPEN-ITEMS.md](OPEN-ITEMS.md).
2. **Set the real domain** in `content/source.mjs` → `site.url`, and delete
   `site.urlIsPlaceholder`. Deploying with the placeholder puts a canonical URL
   on every page pointing at a domain you may not own, which is worse than
   having no canonical at all.
3. **Check the Bangla spellings** in `content/source.mjs`. They were
   transliterated from filenames, not read off the artwork. A wrong matra on an
   ambigram site undermines the thing the site is arguing.
4. Confirm the US-Bangla wording with your manager (BLOCKING-1). The current
   text is the safe default, so this does not block a deploy — but it is worth
   doing before you send the link to anyone.
5. `npm run build && npm run check` — both must pass.

## Vercel, concretely

The repository root is not the project root: `package.json` is in `portfolio/`.
So in the Vercel project settings set **Root Directory** to `portfolio` if you
push the whole GhurniLipi repo, or leave it blank if `portfolio/` is its own
repository.

Everything else is already in the committed `vercel.json`: build command, output
directory, `cleanUrls`, cache headers and the content security policy. Vercel
reads it automatically, so there is nothing to configure in the dashboard.

**No environment variables.** If you set `VITE_API_URL` you would switch on the
dormant backend, which is not deployed — leave it unset.

### Then the domain

Buy the domain, add it under the project's Domains tab, and point DNS where
Vercel tells you — an `A` record for the apex and a `CNAME` for `www`, or
delegate the nameservers. It is not a redirect: the domain serves the site
directly, and Vercel issues the certificate.

Do that *before* announcing the link. Changing the canonical domain after Google
has indexed `*.vercel.app` means asking it to re-crawl and re-attribute
everything, and the `vercel.app` copy competes with the real one in the
meantime.
