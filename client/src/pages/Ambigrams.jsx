import { useMemo, useState } from "react";

import { Rule, Section } from "@/components/Chrome";
import { RotatingAmbigram } from "@/components/RotatingAmbigram";
import { Head } from "@/lib/head";
import { useContent } from "@/lib/content";

/**
 * The full gallery, plus the technique explained at length (§5.2).
 *
 * §5.2 says grouping is warranted above roughly twelve pieces and not before.
 * There are seventeen, so there is a filter — but as three plain buttons over
 * a list that is otherwise complete, not a control panel. The default is
 * everything, and the filter is skippable.
 */

const GROUPS = [
  { id: "all", label: "All" },
  { id: "couple", label: "Two names" },
  { id: "single", label: "One name" },
  { id: "word", label: "Words" },
];

export default function Ambigrams() {
  const [content] = useContent();
  const { ambigrams, technique } = content;
  const [group, setGroup] = useState("all");

  const shown = useMemo(
    () => (group === "all" ? ambigrams : ambigrams.filter((a) => a.kind === group)),
    [ambigrams, group],
  );

  return (
    <>
      <Head
        title="Ambigrams"
        description="Rotational ambigrams hand-drawn in Bangla script: couple's names, single names, and words. Each one reads as something different turned 180°."
        path="/ambigrams"
      />

      <main className="mx-auto max-w-5xl px-5 py-14">
        <h1 className="text-3xl sm:text-4xl">Ambigrams</h1>
        <p className="measure mt-4 text-lg text-ink-soft">
          A rotational ambigram is one drawing that reads as one word the right way up and a
          different word turned 180°. These are all in Bangla, which makes it considerably harder.
        </p>

        <Rule label="180°" />

        <div className="flex flex-wrap items-center gap-2">
          <h2 className="sr-only">Filter by kind</h2>
          {GROUPS.map((option) => {
            const active = option.id === group;
            const count =
              option.id === "all"
                ? ambigrams.length
                : ambigrams.filter((a) => a.kind === option.id).length;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setGroup(option.id)}
                aria-pressed={active}
                className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-rule text-ink-soft hover:border-ink-faint hover:text-ink"
                }`}
              >
                {option.label}{" "}
                <span className={active ? "text-paper/70" : "text-ink-faint"}>{count}</span>
              </button>
            );
          })}
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3">
          {shown.map((piece) => (
            <li key={piece.id}>
              <RotatingAmbigram piece={piece} />
              {piece.year && <p className="mt-1 text-xs text-ink-faint">{piece.year}</p>}
            </li>
          ))}
        </ul>

        <Rule label="180°" />

        <Section id="technique" title={technique.heading}>
          {technique.body.map((para) => (
            <p key={para.slice(0, 24)} className="measure mb-4 text-ink-soft last:mb-0">
              {para}
            </p>
          ))}

          <div className="mt-10 rounded-sm border border-rule bg-paper-raised p-6">
            <p className="measure text-ink-soft">{technique.commission.text}</p>
            <a
              href={technique.commission.href}
              className="mt-2 inline-block border-b border-madder pb-0.5 text-madder"
            >
              {technique.commission.linkLabel}
            </a>
            <p className="measure mt-4 text-sm text-ink-faint">
              Everything here is my own work. Commissions, pricing and delivery are handled through
              the practice rather than from this page.
            </p>
          </div>
        </Section>
      </main>
    </>
  );
}
