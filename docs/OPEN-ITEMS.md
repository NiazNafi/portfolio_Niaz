# Open items

Everything the site is currently unable to say, and why. Requirements §0 item 2:
missing assets are stubbed with obvious placeholders, never with invented
content. Each gap below renders on the page as a visible "Not published yet"
note, and `npm run generate` prints the whole list on every build.

---

## Blocking — decide before the site goes public

### BLOCKING-1 · How much of the US-Bangla role may be public

**Status: using the document's own stated default.**

The role is described generically — requirements gathering, specification
writing, prototyping, UAT, working with UI/UX and engineering. No vendor names,
no module or system counts, no internal process detail, and no mention of any
platform decision in progress.

There is also a line under it saying the description is generic on purpose.
That is deliberate: to a hiring panel, declining to publish your employer's
internals reads as judgement rather than as a thin CV entry.

**What is needed:** confirmation from your manager about what may be said. Then
edit the `us-bangla` entry in `content/source.mjs`. Nothing else references it.

> A CV goes to one named recruiter. This page is indexed by Google and readable
> by your employer, your employer's competitors, and the vendors themselves.
> Those are different acts.

### BLOCKING-2 · Domain

**Status: built with the placeholder `https://niaznafi.com`.**

Canonical URLs, the sitemap and the Open Graph image URL all use it, and both
`npm run generate` and `npm run build` warn while it is still a placeholder.

The recommendation in the requirements is followed throughout: **this site is
the person** (hiring audience, links out), **ghurnilipi.com is the practice**
(art audience, sells). That is why the palette here is deliberately not the
ghurnilipi palette, why there is no pricing or cart anywhere, and why every
commission route is a link out rather than a form.

**What is needed:** the real domain, set once in `content/source.mjs` →
`site.url`, and `site.urlIsPlaceholder` removed.

### BLOCKING-3 · Ambigram assets

**Status: shipping, with one deviation from the specification.**

All 17 pieces are live and turning. But §5.2 calls SVG non-negotiable, and
**these are WebP.** There are no SVG exports of the pieces — only the rendered
rasters, which are shared with the ghurnilipi build.

What that costs, concretely:

- The rotation is fine. A raster turned 180° at a fixed display size is
  pixel-identical in quality to one sitting still, so the signature interaction
  loses nothing.
- Scaling headroom is capped at the 1600px rendition. On a large high-density
  display the hero is at the edge of its resolution.
- File weight is higher than SVG would be, though the hero is 18.7KB and the
  build stays well inside the performance budget regardless.

**What is needed, if you want it fixed:** export each piece from Illustrator as
SVG, run them through SVGO, and drop them where `scripts/prepare-assets.mjs`
looks. Not urgent — the current build passes every acceptance criterion in §9.

The renditions are now **committed to this repository** rather than copied from
the ghurnilipi build workspace at build time. That folder is gitignored over
there, because its own copies come out of a Supabase Storage bucket, so a clone
of this repo could not build without one. Committing them makes this repository
self-contained and keeps every image request same-origin.

Also outstanding, and more important than the format: **the Bangla spellings in
`content/source.mjs` were transliterated from filenames, not read off the
artwork.** On an ambigram site a wrong matra is the worst possible bug. Each one
is a one-word edit.

### BLOCKING-4 · BRACU Alter media rights

**Status: no photographs published. This is a decision, not an omission.**

Two image files were supplied in the project directory. Both were examined and
neither can be published:

| File | What it actually is | Why not |
|---|---|---|
| `bracu_alter.jpg` (1024×768) | A "Meet the core team" promotional card with head-and-shoulders photographs of **nine named people**, plus BRAC University and LASSET logos | Squad media featuring identifiable third parties. Not yours to republish, and the people in it have not been asked. |
| `BracuAlter.jfif` (225×225) | A **television news graphic** about the team reaching the final, carrying a broadcaster's branding | Third-party copyright. Also 225px, against a 1600px floor. |

Useful corroboration from the first file, though: it lists you as **"Control and
AI"** with a different person as squad Team Lead — which is exactly the scoping
§3 insists on, and it is good that a document exists saying so.

**What is needed:** two or three photographs of the robot or the build that you
took, or have written clearance for, at 1600px or more on the long edge. Then
add them to `caseStudy.photos` in `content/source.mjs`. Captions and alt text
should be written from what is actually in frame.

**The video** (`facebook.com/watch/?v=1143267400016977`) is a plain text link,
which is fallback tier 3 in §5.4. Nobody has confirmed the URL resolves or who
owns it. It is **not** embedded, and should not be: the Facebook SDK would blow
the JS budget, create a cookie-consent obligation, show logged-out visitors a
login wall, and fail silently if the post's privacy changes.

If you can get the source file from whoever produced it, a self-hosted 20–40
second cut under 5MB is tier 1 and much better.

### BLOCKING-5 · The published CV leaks what the site withholds

**Status: `npm run check` fails, so this cannot be deployed by accident.**

`/cv.pdf` is the site's primary call to action, and the file currently in the
build contains all of the following:

| In the PDF | Why it must not be public |
|---|---|
| Your phone number, `01745…` | §3: "Do not publish his phone number… Those belong in a CV sent to a named recipient, not on an indexed public page." |
| **Farig Yousuf Sadeque** — Associate Professor, CSE BRAC University, work email **and a personal mobile number** | §3 forbids referee details. These are not yours to publish: it is another person's contact information, and academics get enough cold email already. |
| **Abdulla Hil Kafi** — Lecturer, EEE BRAC University, work email | As above. |
| "Airport Service Department", "7 functional modules", "competitive analysis of four Departure Control System vendors", "the feature matrix used for platform evaluation" | Exactly the material BLOCKING-1 says to keep off the public web. The page is generic; the PDF linked from it is not. |

The site's HTML was checked for every one of these and contains none of them.
The PDF was not, because no HTML scan can see inside it — which is how a
carefully-withheld phone number ended up one click from the hero anyway.

**What is needed:** a redacted CV for the web. Same document, minus the phone
number, minus the entire References section, and with the US-Bangla bullets
rewritten to the generic form already on the site. Keep the full version for
sending to named recipients. Save the redacted one over
`client/public/cv.pdf`, or drop it in the project root and re-run
`npm run assets`.

`npm run check` reads the PDF's text layer (`scripts/pdf-text.cjs`) and fails on
any of the four rows above, so it will tell you when the replacement is clean.

---

## Non-blocking

| Item | Where it shows | What is needed |
|---|---|---|
| arXiv URL for the thesis | Projects card shows a gap instead of a link | The exact URL. The CV also says "arXiv link" rather than a URL, so it is missing in both places. |
| AI Tutoring Platform demo | Projects card shows a gap | Is it still live? A dead "Live Demo" is worse than no link. The CV says "Github link" rather than a URL. |
| CV as an HTML page | Not built | Better for ATS scraping and phones, at the cost of maintaining two copies |
| DCS documentation work | Invisible on the site | Anything shareable in redacted form — it is substantial work and currently reads as absent |



## The hero seal

`SIGNATURE.gif` is now the hero object on the home page, and it is the right
thing to open with: a mark you sign work with, which is itself unchanged by a
half turn, says the site's whole argument about *you* rather than about a client's
commission. The couple's piece it replaced moved down into the featured grid.

Two things about how it is used, and one thing needed from you.

**The animation is not used.** The GIF rotates the seal by itself, in 20 frames
at 1920² and 487KB. One settled frame is extracted instead and the existing CSS
transform does the turn. The reasons are all §6: a GIF autoplays and loops, so
the reveal stops being the visitor's action; it cannot respect
`prefers-reduced-motion`; it is not keyboard-activatable or reversible; and
487KB on the LCP path is more than the entire rest of the page. The frame costs
12.5KB at the size most visitors will actually paint.

The seal is also composited to transparent ink rather than left as black on
white, so it sits on the paper instead of reading as a sticker, and its measured
rotation axis came out at 0.492 / 0.492 — dead centre, as a circular seal should
be, which is a useful confirmation that the measuring script is honest.

**What is needed: [TODO] what the seal reads.** The site currently says only what
the mark demonstrably *does* — "a circular seal of Bangla lettering, drawn so
that the mark reads the same when rotated 180°" — and does not claim to know the
word. That is deliberate: ambigram lettering is built to resist being read back,
and this one has not been checked against anything. Tell me the reading in Bangla
and transliteration and the caption can name it, which would be better. Also
worth confirming this is in fact the mark you sign work with, since that is an
inference from the filename.

## Where your CV and this site disagree

Found by reading the text layer of `Niaz Nafi Rahman_CV.pdf`. The site was built
from §3 of the requirements document, which was transcribed from an earlier
version of the CV. Where the two differ I have **not** guessed — these are facts
about your own history, so they need your call. All three are one-line edits in
`content/source.mjs`.

| | Requirements §3 / the site says | Your CV says |
|---|---|---|
| Ghurnilipi start | February **2026** | February **2020** |
| Ghurnilipi title | Independent Ambigram Artist | Founder & Artist |
| Ghurnilipi channels | sold directly | "through ghurnilipi.com **and Instagram**" |

The date is the one that matters. Six months of practice and six years of
practice are different claims, and the site currently makes the smaller one. Six
years is far more plausible given eighteen finished pieces — but I am not going
to change a date on your CV on an inference.

Two things in the CV itself worth a look while you are there:

- The **BRACU Alter systems software** project is dated "August 2026 – August
  2026", which cannot be right — the AI Team Lead entry for the same work says
  February 2023 – August 2024.
- The **Illustrator panel repo** was in your CV and is live and public, so the
  projects card now links to it. That resolves one of the gaps above.

## Deliberately not built (§10)

Bangla/English interface toggle · a writing section · an interactive rotate-your-
own-text tool · case pages for the remaining projects · dark mode · print
stylesheet · a gallery of failed pairings.

The last one is genuinely the most interesting idea in the parking lot, and it
needs curation more than it needs code.
