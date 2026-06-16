"use client";

import { MAX_GUESSES } from "@/lib/seed";
import { winRate, type Stats as StatsT } from "@/lib/storage";

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-2xl tabular-nums text-text">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted">
        {label}
      </span>
    </div>
  );
}

export default function Stats({
  stats,
  highlight,
}: {
  stats: StatsT;
  /** Guess count of the just-finished game, to highlight its histogram row. */
  highlight?: number | null;
}) {
  const max = Math.max(1, ...stats.dist);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <Stat value={stats.played} label="Played" />
        <Stat value={`${winRate(stats)}%`} label="Win" />
        <Stat value={stats.currentStreak} label="Streak" />
        <Stat value={stats.maxStreak} label="Max" />
      </div>

      <div>
        <div className="mb-1 text-xs uppercase tracking-wide text-muted">
          Guess distribution
        </div>
        <div className="flex flex-col gap-1">
          {Array.from({ length: MAX_GUESSES }).map((_, i) => {
            const count = stats.dist[i] ?? 0;
            const isHit = highlight === i + 1;
            const pct = Math.round((count / max) * 100);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 font-mono text-xs text-muted">{i + 1}</span>
                <div className="flex-1">
                  <div
                    className={`flex h-5 min-w-6 items-center justify-end rounded px-1.5 font-mono text-xs ${
                      isHit ? "bg-correct text-bg" : "bg-surface-2 text-text"
                    }`}
                    style={{ width: `${Math.max(pct, count > 0 ? 12 : 8)}%` }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
