"use client";

import Modal from "./Modal";

export default function HowToPlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="How to play">
      <div className="space-y-4 text-sm text-text">
        <p>
          One anonymized chart. One real asset. <strong>Six guesses.</strong>{" "}
          The same puzzle for everyone, every day.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-muted">
          <li>
            The chart is a real asset&apos;s price over ~1 year, indexed to 100.
            Axes and labels are hidden — read the <em>shape</em>.
          </li>
          <li>
            Guess a ticker or name. Each wrong guess scores three dimensions and
            unlocks a hint.
          </li>
        </ol>
        <div className="space-y-2 rounded-control border border-border bg-bg p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted">Class · Region · Sector feedback</span>
          </div>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-correct text-bg">▣</span>
              <span className="text-muted">Exact match on this dimension</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-near text-bg">◪</span>
              <span className="text-muted">Related (e.g. both equities)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-surface-2 text-muted">☐</span>
              <span className="text-muted">No match</span>
            </li>
          </ul>
        </div>
        <p className="text-muted">
          Fewer guesses = fewer hints = a better score to share. Comes back at
          midnight UTC.
        </p>
        <p className="text-xs text-muted">
          Chartle is a game using historical data. It is not financial advice.
        </p>
      </div>
    </Modal>
  );
}
