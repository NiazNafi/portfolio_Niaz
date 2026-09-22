import { useContent } from "@/lib/content";

/**
 * The work history as a time axis, with concurrent roles on opposite sides of
 * the rail.
 *
 * The role list beside this is in *editorial* order — the salaried job first,
 * the independent practice second — because that is how the CV is arranged and
 * how a hiring panel should read it. That ordering deliberately hides the
 * chronology, and the chronology is interesting: the practice has been running
 * underneath everything else the whole time. So this shows what the list cannot,
 * and neither view has to compromise.
 *
 * Lane assignment is a greedy interval colouring: sort by start, drop each role
 * into the lowest-numbered lane whose previous occupant has already finished.
 * Even lanes sit right of the rail, odd lanes left, stepping outward — so two
 * concurrent roles land either side, and a fourth or fifth would still find room
 * rather than overlapping. Nothing here assumes only two things overlap.
 *
 * Two orientations, chosen with CSS rather than JavaScript: vertical in a column
 * beside the list on wide screens, horizontal above it on narrow ones. §2 calls a
 * mid-range Android phone the majority case, not an edge case, so hiding this
 * below `md` would mean most visitors never see it.
 *
 * The chart is `aria-hidden`. Every bar's title, organisation and period are
 * already in the list next to it, verbatim; announcing them a second time as an
 * unlabelled pile of positioned divs would be worse than silence. The one fact
 * the chart adds and the text does not — that the practice overlaps the rest —
 * is stated in the section's opening line instead.
 */

/** "2025-09" → a month index that can be subtracted. */
const toMonths = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
};

const yearOf = (months) => Math.floor(months / 12);

/**
 * @param {Array<{id: string, start: string, end: string|null}>} roles
 * @param {string} asOf build-time "present", so server and client agree
 */
function layout(roles, asOf) {
  const present = toMonths(asOf);

  const spans = roles.map((role) => ({
    ...role,
    startM: toMonths(role.start),
    endM: role.end ? toMonths(role.end) : present,
    current: !role.end,
  }));

  // Greedy interval colouring, earliest start first.
  const laneEnds = [];
  for (const span of [...spans].sort((a, b) => a.startM - b.startM)) {
    let lane = laneEnds.findIndex((end) => end <= span.startM);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(span.endM);
    } else {
      laneEnds[lane] = span.endM;
    }
    span.lane = lane;
  }

  const earliest = Math.min(...spans.map((s) => s.startM));
  // Pad the axis to whole years at both ends so the tick labels sit inside it.
  const from = yearOf(earliest) * 12;
  const to = (yearOf(present) + 1) * 12;
  const total = to - from;

  /** 0 at the earliest edge, 1 at the present edge. */
  const at = (months) => (months - from) / total;

  const years = [];
  for (let y = yearOf(from); y <= yearOf(present); y += 1) years.push(y);

  return { spans, at, years, lanes: laneEnds.length };
}

/** Bar geometry for one span, in whichever axis is in play. */
function bar(span, at, vertical) {
  const a = at(span.startM);
  const b = at(span.endM);

  // Rail offset: even lanes one side, odd lanes the other, stepping outward.
  const side = span.lane % 2 === 0 ? 1 : -1;
  const depth = Math.floor(span.lane / 2);
  const gap = `${0.6 + depth * 1.4}rem`;

  if (vertical) {
    // Present at the top, so the axis descends into the past — which matches a
    // list that opens with the current role.
    return {
      top: `${(1 - b) * 100}%`,
      height: `${(b - a) * 100}%`,
      ...(side === 1 ? { left: `calc(50% + ${gap})` } : { right: `calc(50% + ${gap})` }),
    };
  }
  return {
    left: `${a * 100}%`,
    width: `${(b - a) * 100}%`,
    top: `${span.lane * 1.65 + 0.9}rem`,
  };
}

export function ExperienceTimeline({ orientation = "vertical", className = "" }) {
  const [content] = useContent();
  const { experience, site } = content;

  // Without a stamped `asOf` the chart would be non-deterministic between the
  // prerender and the browser; rather than guess, draw nothing.
  if (!site.asOf) return null;

  const vertical = orientation === "vertical";
  const { spans, at, years, lanes } = layout(experience, site.asOf);

  return (
    <div className={className} aria-hidden="true">
      <p className="mb-3 text-xs uppercase tracking-[0.18em] text-ink-faint">Timeline</p>

      <div
        className="relative"
        style={vertical ? { height: "20rem" } : { height: `${lanes * 1.65 + 2.4}rem` }}
      >
        {/*
          Vertically, the year labels get their own gutter down the left and the
          plotting area starts after it. The obvious alternative — centring each
          year on the rail with the page colour behind it — puts a 24px-wide
          label across a rail the bars sit 10px from, so the years and the bars
          collide. Horizontally there is no such problem: the labels run along
          the bottom, below every bar.
        */}
        {years.map((year) => {
          const p = at(year * 12);
          return (
            <span
              key={year}
              className="absolute text-[10px] tabular-nums text-ink-faint"
              style={
                vertical
                  ? { top: `${(1 - p) * 100}%`, left: 0, transform: "translateY(-50%)" }
                  : { left: `${p * 100}%`, bottom: 0, transform: "translateX(-50%)" }
              }
            >
              {year}
            </span>
          );
        })}

        {/* The plotting area: inset past the year gutter when vertical, so the
            rail sits in the middle of the space the bars actually have. */}
        <div
          className="absolute"
          style={
            vertical
              ? { left: "2.25rem", right: 0, top: 0, bottom: 0 }
              : { left: 0, right: 0, top: 0, bottom: 0 }
          }
        >
          <div
            className="absolute bg-rule"
            style={
              vertical
                ? { left: "50%", top: 0, bottom: 0, width: "1px" }
                : { left: 0, right: 0, bottom: "1.15rem", height: "1px" }
            }
          />

          {/* A tick crossing the rail at each year, so the label in the gutter
              reads as belonging to a position rather than floating. */}
          {vertical &&
            years.map((year) => (
              <div
                key={year}
                className="absolute bg-rule"
                style={{
                  top: `${(1 - at(year * 12)) * 100}%`,
                  left: "calc(50% - 3px)",
                  width: "7px",
                  height: "1px",
                }}
              />
            ))}

          {spans.map((span) => {
            const geometry = bar(span, at, vertical);
            const leftOfRail = span.lane % 2 !== 0;

            return (
              <div key={span.id} className="absolute" style={geometry}>
                <div
                  className={`rounded-full ${span.current ? "bg-ink" : "bg-ink-faint"}`}
                  style={
                    vertical ? { width: "5px", height: "100%" } : { height: "5px", width: "100%" }
                  }
                />

                <span
                  className={`absolute whitespace-nowrap text-[10px] leading-tight ${
                    span.current ? "text-ink-soft" : "text-ink-faint"
                  }`}
                  style={
                    vertical
                      ? leftOfRail
                        ? { right: "10px", top: "-1px", textAlign: "right" }
                        : { left: "10px", top: "-1px" }
                      : { left: 0, bottom: "9px" }
                  }
                >
                  {span.shortLabel ?? span.org}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
