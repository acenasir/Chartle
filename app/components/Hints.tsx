"use client";

import type { Hint } from "@/lib/game";

export default function Hints({
  hints,
  nextInGuesses,
}: {
  hints: Hint[];
  nextInGuesses: boolean;
}) {
  if (hints.length === 0) {
    return (
      <p className="rounded-control border border-dashed border-border px-3 py-2 text-center text-sm text-muted">
        Hints unlock with each wrong guess. Guess from the shape alone for the
        best score.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {hints.map((h) => (
        <li
          key={h.order}
          className="flex items-center justify-between gap-3 rounded-control border border-border bg-surface px-3 py-2 text-sm animate-fade-in"
        >
          <span className="text-muted">{h.label}</span>
          <span className="font-mono text-text">{h.value}</span>
        </li>
      ))}
      {nextInGuesses && (
        <li className="px-3 py-1 text-center text-xs text-muted">
          Next hint unlocks on your next wrong guess
        </li>
      )}
    </ul>
  );
}
