"use client";

export default function Header({
  puzzleNumber,
  onHowTo,
  onStats,
}: {
  puzzleNumber: number;
  onHowTo: () => void;
  onStats: () => void;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border pb-3">
      <div className="flex items-center gap-2.5">
        <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden>
          <rect width="32" height="32" rx="7" fill="#151A21" />
          <polyline
            points="5,22 12,15 17,19 27,7"
            fill="none"
            stroke="#3FB950"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="27" cy="7" r="2.6" fill="#3FB950" />
        </svg>
        <div>
          <h1 className="text-lg font-bold leading-none text-text">Chartle</h1>
          <p className="font-mono text-xs text-muted">
            #{puzzleNumber} · daily markets puzzle
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onHowTo}
          aria-label="How to play"
          className="rounded-control px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-text"
        >
          ?
        </button>
        <button
          type="button"
          onClick={onStats}
          aria-label="Statistics"
          className="rounded-control px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-text"
        >
          📊
        </button>
      </div>
    </header>
  );
}
