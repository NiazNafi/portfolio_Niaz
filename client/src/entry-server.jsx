import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";

import App from "@/App";
import { HeadContext } from "@/lib/head";

/** Re-exported so the prerenderer takes its route list from the router itself
 *  and cannot fall a page behind it. */
export { ROUTES } from "@/App";

/**
 * Prerender entry. Renders one route to a string and reports back what <Head>
 * declared for it, so scripts/prerender.mjs can write the title, description
 * and canonical into the HTML rather than leaving them to be filled in by
 * JavaScript a crawler may never run.
 *
 * @param {string} url
 */
export function render(url) {
  const head = {};

  const html = renderToString(
    <HeadContext.Provider value={head}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </HeadContext.Provider>,
  );

  return { html, head };
}
