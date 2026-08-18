import { useSyncExternalStore } from "react";

/**
 * Whether this device has a pointer that can genuinely hover.
 *
 * §6 asks for hover on pointer devices and tap on touch. Feature-detecting the
 * pointer rather than sniffing the user agent also handles the cases that
 * actually break things: a tablet with a keyboard and trackpad attached, and a
 * touchscreen laptop, where guessing from screen width gets it backwards.
 *
 * Without this, a tap on a touch device leaves the piece latched in its hover
 * state and it stays upside down until something else steals the hover.
 */
const QUERY = "(hover: hover) and (pointer: fine)";

function subscribe(callback) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;

/**
 * Prerender assumes no hover. Getting this wrong in the other direction would
 * attach pointer handlers to the server HTML that a touch visitor then has to
 * fight; assuming touch is the safe default, and §2 says a mid-range Android
 * phone is the majority case here, not an edge case.
 */
const getServerSnapshot = () => false;

export function usePointerHover() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
