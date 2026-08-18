import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import "@/styles/index.css";

const container = document.getElementById("root");

/**
 * Which route's HTML did the server actually send?
 *
 * Normally the answer is "this one" — every route is prerendered to its own file
 * by scripts/prerender.mjs, and any static host that resolves /ambigrams to
 * /ambigrams/index.html serves matching markup.
 *
 * But the standard single-page-app recipe on Netlify and Vercel is a catch-all
 * rewrite of every path to index.html, and if someone adds that here, an unknown
 * URL arrives carrying the *home page's* markup while the router resolves it to
 * the 404 page. Hydrating one against the other throws away the tree and logs a
 * hydration error, and for a moment the visitor sees the wrong page.
 *
 * So the served route is stamped into the HTML and checked. This site does not
 * need the rewrite, and docs/DEPLOY.md says so — but a deploy setting is not
 * something the app should be relying on to render correctly.
 */
const served = container?.dataset.route;
const here = window.location.pathname.replace(/\/$/, "") || "/";

/**
 * Was this HTML prerendered at all?
 *
 * `vite build` leaves the <!--app--> placeholder in index.html; only
 * scripts/prerender.mjs replaces it with real markup. If the placeholder is
 * still there then the deploy skipped the prerender step — which happens when a
 * host is pointed at client/ instead of the repository root, so the root build
 * script that runs the prerenderer never executes.
 *
 * The site still works in that state, as an ordinary single-page app; it just
 * loses the prerendering. What it must not do is try to hydrate against a
 * placeholder comment and throw. `npm run check` reports the same condition as a
 * failure so the deploy gets fixed rather than quietly shipping without it.
 */
const prerendered = !container?.innerHTML.includes("<!--app-->");

const tree = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

if (!prerendered || (served && served !== here)) {
  // Either there is no real markup to hydrate, or what is there describes a
  // different route. Do not try to reconcile it — discard it and render from
  // scratch. Slower for this one request, and correct, which is the right way
  // round.
  container.innerHTML = "";
  createRoot(container).render(tree);
} else {
  // The normal path: real HTML for this exact route is already on screen, so
  // hydration attaches to it and the first paint never waited on this file.
  hydrateRoot(container, tree);
}
