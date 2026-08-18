import { useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";

import { SiteFooter, SiteHeader } from "@/components/Chrome";
import Ambigrams from "@/pages/Ambigrams";
import BracuAlter from "@/pages/BracuAlter";
import Home from "@/pages/Home";
import { Head } from "@/lib/head";

/** Every route the site has. Kept here so scripts/prerender.mjs can import it
 *  and be certain it has emitted an HTML file for each one. */
export const ROUTES = ["/", "/ambigrams", "/work/bracu-alter"];

export default function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>

      <SiteHeader />
      <ScrollBehaviour />

      <div id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ambigrams" element={<Ambigrams />} />
          <Route path="/work/bracu-alter" element={<BracuAlter />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      <SiteFooter />
    </>
  );
}

/**
 * Client-side navigation does not move the viewport on its own, so a visitor
 * arriving on the gallery from the home page would land halfway down it. An
 * in-page hash target still wins, which is what makes "/#work" from the case
 * study go where it says.
 */
function ScrollBehaviour() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function NotFound() {
  return (
    <>
      <Head
        title="Page not found"
        description="No page at this address. The ambigram gallery, the work history and the RoboCup Rescue case study are all reachable from the home page."
        path="/404"
      />
      <main className="mx-auto max-w-3xl px-5 py-24">
        <h1 className="text-3xl">Not here</h1>
        <p className="measure mt-4 text-ink-soft">
          That address does not point at anything. The pieces are in the gallery and the rest is on
          the home page.
        </p>
        <p className="mt-6 flex gap-5">
          <Link to="/" className="border-b border-rule pb-0.5">
            Home
          </Link>
          <Link to="/ambigrams" className="border-b border-rule pb-0.5">
            Ambigrams
          </Link>
        </p>
      </main>
    </>
  );
}
