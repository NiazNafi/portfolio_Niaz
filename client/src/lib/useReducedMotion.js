import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Whether the visitor has asked for reduced motion.
 *
 * useSyncExternalStore rather than useState + useEffect for two reasons that
 * both matter here. The server snapshot is false, so the prerendered HTML is
 * the animated layout and hydration corrects it in the same commit rather than
 * after a paint — no flash of the wrong layout. And a visitor who flips the OS
 * setting while the page is open gets the change applied, which is the whole
 * point of subscribing to the query rather than reading it once.
 */
function subscribe(callback) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;

/** Prerender assumes motion is allowed; the client corrects on hydration. */
const getServerSnapshot = () => false;

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
