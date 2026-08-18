import { createContext, useContext, useEffect } from "react";

import { getContent } from "@/lib/content";

/**
 * Per-page title, description and canonical (§8).
 *
 * This component renders nothing. That is deliberate.
 *
 * React 19 will hoist a <title> or <meta> rendered anywhere in the tree up
 * into <head>, but only when it is rendering the whole document.
 * renderToString, which the prerenderer uses, emits them inline where they
 * appear — so the served HTML had them inside #root and the client then
 * hoisted them out, which is a hydration mismatch on every page.
 *
 * So the head is handled outside React entirely, in the two places that can
 * actually write it: scripts/prerender.mjs reads what was declared here via
 * the context below and writes the real tags into the HTML, and on a
 * client-side route change the effect updates the live document. The
 * prerendered tags are the ones crawlers and social cards see; the effect only
 * matters for navigation within the site.
 */

export const HeadContext = createContext(null);

/**
 * @param {object} props
 * @param {string|null} props.title  page title; null uses the site default
 * @param {string} props.description
 * @param {string} props.path        canonical path, e.g. "/ambigrams"
 * @param {'website'|'article'} [props.type]
 */
export function Head({ title, description, path, type = "website" }) {
  const { site, profile } = getContent();
  const collector = useContext(HeadContext);

  const full = title === null ? site.title : `${title} — ${profile.name}`;
  const canonical = `${site.url}${path === "/" ? "" : path}`;
  const image = `${site.url}${site.ogImage}`;

  // Prerender path: record, do not render.
  if (collector) {
    collector.title = full;
    collector.description = description;
    collector.canonical = canonical;
    collector.image = image;
    collector.type = type;
  }

  useEffect(() => {
    document.title = full;

    const set = (selector, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement(attrs.property ? "meta" : selector.startsWith("link") ? "link" : "meta");
        document.head.appendChild(el);
      }
      for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    };

    set('meta[name="description"]', { name: "description", content: description });
    set('link[rel="canonical"]', { rel: "canonical", href: canonical });
    set('meta[property="og:title"]', { property: "og:title", content: full });
    set('meta[property="og:description"]', { property: "og:description", content: description });
    set('meta[property="og:url"]', { property: "og:url", content: canonical });
    set('meta[property="og:type"]', { property: "og:type", content: type });
    set('meta[property="og:image"]', { property: "og:image", content: image });
  }, [full, description, canonical, image, type]);

  return null;
}
