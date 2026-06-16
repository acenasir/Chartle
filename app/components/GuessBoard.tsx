"use client";

import { GLYPH } from "@/lib/game";
import { MAX_GUESSES } from "@/lib/seed";
import type { GuessResult, Match } from "@/lib/types";

const CELL_BG: Record<Match, string> = {
  exact: "bg-correct text-bg",
  related: "bg-near text-bg",
  none: "bg-surface-2 text-muted",
};

const DIMS: { key: keyof GuessResult["feedback"]; label: string }[] = [
  { key: "assetClass", label: "Class" },
  { key: "region", label: "Region" },
  { key: "sector", label: "Sector" },
];

function Cell({ match, label }: { match: Match; label: string }) {
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-bold ${CELL_BG[match]} animate-pop`}
      title={`${label}: ${match}`}
      aria-label={`${label}: ${match} match`}
    >
      <span aria-hidden>{GLYPH[match]}</span>
    </div>
  );
}

export default function GuessBoard({ results }: { results: GuessResult[] }) {
  const empties = Math.max(0, MAX_GUESSES - results.length);

  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-2 pr-0.5">
        {DIMS.map((d) => (
          <span key={d.key} className="w-9 text-center text-[10px] uppercase tracking-wide text-muted">
            {d.label}
          </span>
        ))}
      </div>
      <ul className="flex flex-col gap-2">
        {results.map((r, i) => (
          <li
            key={`${r.ticker}-${i}`}
            className={`flex items-center justify-between gap-3 rounded-control border px-3 py-2 ${
              r.correct ? "border-correct/60 bg-correct/10" : "border-border bg-surface"
            }`}
          >
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="font-mono text-sm text-text">{r.ticker}</span>
              <span className="truncate text-sm text-muted">{r.name}</span>
            </span>
            <span className="flex shrink-0 gap-2">
              {DIMS.map((d) => (
                <Cell key={d.key} match={r.feedback[d.key]} label={d.label} />
              ))}
            </span>
          </li>
        ))}
        {Array.from({ length: empties }).map((_, i) => (
          <li
            key={`empty-${i}`}
            className="flex h-[52px] items-center justify-end gap-2 rounded-control border border-dashed border-border/60 px-3"
          >
            {DIMS.map((d) => (
              <div key={d.key} className="h-9 w-9 rounded-md bg-surface-2/40" />
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
