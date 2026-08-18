import { useEffect, useState } from "react";

/**
 * §5.7: the email address must be published, and obfuscated against scrapers.
 *
 * The approach that works without punishing the reader: the prerendered HTML —
 * which is what a harvester fetches, since they do not run JavaScript — spells
 * the address out in words, and hydration replaces it with a real mailto link.
 * A human with JS gets a clickable address; a human without JS gets a readable
 * one; a screen reader gets whichever of those is on the page, both of which
 * are pronounceable. Nothing is hidden from anyone who is actually visiting.
 *
 * Deliberately not a contact form: §5.7 rules out one that posts to a
 * third-party endpoint without saying so, and a self-hosted one would need the
 * backend to accept writes, which is a spam target in exchange for nothing an
 * email link does not already do.
 */
export function Email({ address }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    const [user, domain] = address.split("@");
    return (
      <span className="block">
        {user} at {domain.replace(/\./g, " dot ")}
      </span>
    );
  }

  return (
    <a href={`mailto:${address}`} className="border-b border-rule pb-0.5">
      {address}
    </a>
  );
}
