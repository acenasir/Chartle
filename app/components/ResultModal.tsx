"use client";

import { useState } from "react";

import { buildShareText } from "@/lib/share";
import type { Stats as StatsT } from "@/lib/storage";
import type { GuessResult, Reveal } from "@/lib/types";

import Countdown from "./Countdown";
import Modal from "./Modal";
import Stats from "./Stats";

interface ResultModalProps {
  open: boolean;
  onClose: () => void;
  won: boolean;
  reveal: Reveal | null;
  results: GuessResult[];
  stats: StatsT;
  puzzleNumber: number;
}

export default function ResultModal({
  open,
  onClose,
  won,
  reveal,
  results,
  stats,
  puzzleNumber,
}: ResultModalProps) {
  const [toast, setToast] = useState<string | null>(null);

  async function onShare() {
    const url =
      typeof window !== "undefined" ? window.location.origin : "chartle.app";
    const text = buildShareText({
      number: puzzleNumber,
      results,
      streak: stats.currentStreak,
      url: url.replace(/^https?:\/\//, ""),
    });
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text });
        setToast("Shared!");
      } else {
        await navigator.clipboard.writeText(text);
        setToast("Copied to clipboard!");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setToast("Copied to clipboard!");
      } catch {
        setToast("Couldn't share — copy manually.");
      }
    }
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={won ? "Solved!" : "Out of guesses"}
    >
      <div className="space-y-5">
        {reveal && (
          <div className="rounded-card border border-border bg-bg p-4 text-center">
            <div className="font-mono text-3xl text-text">{reveal.ticker}</div>
            <div className="text-sm text-muted">{reveal.name}</div>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-xs">
              {[reveal.assetClass, reveal.region, reveal.sector].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border px-2 py-0.5 text-muted"
                >
                  {t}
                </span>
              ))}
              <span
                className={`rounded-full px-2 py-0.5 ${
                  reveal.netReturnPct >= 0
                    ? "bg-correct/15 text-correct"
                    : "bg-down/15 text-down"
                }`}
              >
                {reveal.netReturnPct >= 0 ? "+" : ""}
                {reveal.netReturnPct}% over the window
              </span>
            </div>
            {reveal.approx && (
              <div className="mt-2 text-[10px] text-muted">
                demo data — approximate series (run <code>fetch-data</code> for
                exact prices)
              </div>
            )}
          </div>
        )}

        <Stats stats={stats} highlight={won ? results.length : null} />

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <div className="flex-1">
            <Countdown />
          </div>
          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-2 rounded-control bg-correct px-5 py-3 font-semibold text-bg transition hover:brightness-110"
          >
            Share
            <span aria-hidden>↗</span>
          </button>
        </div>

        {toast && (
          <div className="rounded-control bg-surface-2 py-2 text-center text-sm text-text animate-fade-in">
            {toast}
          </div>
        )}
      </div>
    </Modal>
  );
}
