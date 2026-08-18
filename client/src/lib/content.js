import { useEffect, useState } from "react";

import snapshot from "@/data/content.json";

/**
 * Content is available synchronously, always.
 *
 * The snapshot is compiled into the bundle at build time from the same source
 * that seeds the database, so the first paint never waits on a network round
 * trip — which is what keeps LCP inside the §8 budget on Bangladeshi mobile
 * data, where the request the page did not make is the fastest one.
 *
 * The Express API is then consulted in the background. If it answers with
 * something different — Niaz edited a row in Supabase since the last deploy —
 * the page updates in place. If it does not answer, nothing happens and no
 * error surfaces, because the content already on screen is correct, just
 * possibly a build old.
 */

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export function getContent() {
  return snapshot;
}

/**
 * @returns {[typeof snapshot, { live: boolean }]}
 */
export function useContent() {
  const [content, setContent] = useState(snapshot);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!API) return undefined;

    const ac = new AbortController();

    /**
     * Deferred to idle: revalidating a CV is never more urgent than finishing
     * the first paint.
     *
     * The timeout is not belt-and-braces. A page opened in a background tab is
     * never idle in the sense requestIdleCallback means, so without it the
     * callback can be starved indefinitely and the visitor gets whatever was
     * in the bundle at build time forever — which is correct content, but it
     * quietly disables the live path on exactly the visitors who opened the
     * link in a new tab and came back to it.
     */
    const schedule =
      typeof requestIdleCallback === "function"
        ? (fn) => requestIdleCallback(fn, { timeout: 3000 })
        : (fn) => setTimeout(fn, 200);

    const handle = schedule(async () => {
      try {
        const res = await fetch(`${API}/api/content`, {
          signal: ac.signal,
          headers: { accept: "application/json" },
        });
        if (!res.ok) return;
        const fresh = await res.json();
        // Only re-render when something actually differs. A deep equal on a
        // payload this size is cheaper than an unnecessary reconciliation of
        // every section, and avoids re-running the ambigrams' effects.
        if (JSON.stringify(fresh) !== JSON.stringify(content)) setContent(fresh);
        setLive(true);
      } catch {
        // Deliberately silent. See above: the page is already correct.
      }
    });

    return () => {
      ac.abort();
      if (typeof cancelIdleCallback === "function" && typeof handle === "number") {
        cancelIdleCallback(handle);
      }
    };
    // Runs once. `content` is read inside but re-subscribing on every update
    // would poll the API forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [content, { live }];
}
