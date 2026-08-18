# Niaz Nafi Rahman — portfolio

A static site. React and Vite, prerendered to HTML at build time, every asset
committed to this repository and served same-origin.

<!-- counts -->
17 ambigrams · 3 projects · 3 roles
<!-- /counts -->

```
/                    home — hero, work, ambigrams, projects, about, contact
/ambigrams           full gallery + the technique explained
/work/bracu-alter    RoboCup Rescue case study
/cv.pdf              the CV
```

```bash
npm install
npm run build      # → client/dist, deployable as-is
npm run check      # enforces the §8 budgets against what was just built
npm run dev        # Vite dev server on :5173
npm run preview    # serve the built site on :4173, the way a real host would
```

Nothing above needs a `.env`, a database, or network access to anything.

---

## How it is put together

**`content/source.mjs` is the only file to edit.** Every word on the site comes
from there, and everything else is generated from it:

| Generated | By | Committed? |
|---|---|---|
| `client/src/data/content.json` | `npm run generate` (runs inside `build`) | no — regenerated |
| `client/src/data/artwork-manifest.json` | `npm run assets` | **yes** |
| `client/src/styles/fonts.css` | `npm run assets` | **yes** |
| `client/public/{artwork,fonts,photo}`, `og.png`, `cv.pdf` | `npm run assets` | **yes** |
| `supabase/migrations/0002_portfolio_seed.sql` | `npm run generate` | no — dormant, see below |

`npm run generate` refuses to complete if the content contains a phone number,
placeholder text, or a reference to a referee — the three things §3 and §9 forbid
publishing. It also prints every remaining gap.

### Why the assets are committed even though they are generated

Their inputs live outside this repository. The ambigram renditions come from the
ghurnilipi project's build workspace, which gitignores them because its own
copies are rebuilt from a Supabase Storage bucket; the woff2 subsets come from
that project's `next/font` download cache; and the measured rotation centres take
a few seconds of image analysis over those same files.

So a clone that did not carry them could not build, and would need a sibling
checkout and a storage bucket to become buildable again. Committing them is what
makes this repository stand on its own — and what keeps every request
same-origin: no CDN, no `raw.githubusercontent.com`, no third-party host on the
LCP path for a visitor on Bangladeshi mobile data.

`npm run assets` re-imports them when the sources happen to be present, and skips
quietly when they are not. It is not part of `npm run build`.

### The dormant backend

`server/` and `supabase/` are present and working, and **nothing uses them.**

They are an optional extra: an Express API that reads the same content out of
Postgres, so the CV could be edited in a table instead of in `source.mjs` and go
live without a redeploy. `VITE_API_URL` is blank, so the client never calls it.
Even if it did, the page renders from the bundled snapshot first and the request
only ever arrives later.

To turn it on: fill in `.env` from `.env.example`, apply
`supabase/migrations/0001_portfolio_init.sql`, run `npm run api:push` to load the
content, then `npm run api`. To remove it instead: delete `server/`, `supabase/`,
`scripts/db-push.mjs`, and drop the eight tables — the drop statement is at the
top of the migration. Nothing about the site changes either way.

---

## The parts worth knowing about

### The 180° turn

`client/src/components/RotatingAmbigram.jsx`, with the motion in
`client/src/styles/index.css`. Pure CSS transform, no animation library, no JS
loop. Hover on pointer devices, tap on touch, Enter/Space on a keyboard, all
interruptible.

**The rotation axis is measured, not assumed.** §6 says to rotate about the
artwork's true visual centre and to verify it per asset — so
`scripts/rotation-centres.mjs` does it arithmetically. An ambigram is by
definition a drawing that maps onto itself under a half turn, so the script
thresholds each piece to an ink mask (by high-pass, because these exports sit on
a gradient that a flat threshold turns into a large and very symmetrical block)
and searches for the centre that maximises the overlap between the mask and its
own 180° rotation. The answers come out between 0.49 and 0.54 of the width —
small offsets, and exactly the ones that make a hero-sized turn settle rather
than wobble.

Under `prefers-reduced-motion: reduce` there is no rotation and no button: both
readings are shown side by side, the second statically inverted, with the full
description in the accessible name. The second reading never lives only inside
an animation.

### Prerendering

`scripts/prerender.mjs` renders each route to its own HTML file. Two reasons: a
blank div waiting on React cannot hold LCP under 2.5s on a mid-range Android
phone, and a crawler that does not run JavaScript sees the same shell on every
URL of a single-page app.

Each file records which route it was rendered for, and `client/src/main.jsx`
checks that against the URL before hydrating — a safety net for hosts configured
with an SPA catch-all rewrite, which this site does not need. See
**[docs/DEPLOY.md](docs/DEPLOY.md)**.

### Fonts

Tiro Bangla (display) and Hind Siliguri (body), self-hosted and subset. Both
carry a Latin cut in the same family, so the two scripts share a spine rather
than being pushed together.

Bangla line-height is floored at **1.35** and must not go below it. Bengali
stacks matras above the headline stroke and conjuncts below it, and both faces
under-declare how far the ink actually travels; below 1.33 the ink leaves its
line box and any ancestor with `overflow: hidden` slices the tops off the
letterforms. Tailwind's `leading-none` and `leading-tight` are both unsafe here.

### Palette

Six values, in `client/src/styles/index.css`, with the contrast ratio of each
against the page ground written next to it. Cool paper sampled from the pale end
of the gradient the pieces are drawn on; a cool near-black ink; and a madder red
taken from the two discs in the বাংলা piece.

Deliberately **not** the ghurnilipi palette. Two brands competing for the same
visitor with the same visual language is worse than either alone — this site is
the person, ghurnilipi.com is the practice.

---

## What is not finished

See **[docs/OPEN-ITEMS.md](docs/OPEN-ITEMS.md)**. In short: the domain is a
placeholder, the US-Bangla role is described generically pending your manager's
sign-off, three project links are missing, and **the BRACU Alter case study has
no photographs** — the two files supplied are team promotional media and a TV
news graphic, and neither is yours to publish.
