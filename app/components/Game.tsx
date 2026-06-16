"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { evaluateGuess, visibleHints } from "@/lib/game";
import { MAX_GUESSES } from "@/lib/seed";
import {
  defaultStats,
  loadGame,
  loadStats,
  recordFinish,
  saveGame,
  saveStats,
  type SavedGame,
  type Stats as StatsT,
} from "@/lib/storage";
import type { Asset, GuessResult, Puzzle, Reveal } from "@/lib/types";

import Chart from "./Chart";
import Countdown from "./Countdown";
import GuessBoard from "./GuessBoard";
import GuessInput from "./GuessInput";
import Header from "./Header";
import Hints from "./Hints";
import HowToPlay from "./HowToPlay";
import Modal from "./Modal";
import ResultModal from "./ResultModal";
import Stats from "./Stats";

type Status = "playing" | "won" | "lost";

const ONBOARD_KEY = "chartle:onboarded";

export default function Game({ puzzle }: { puzzle: Puzzle }) {
  const [results, setResults] = useState<GuessResult[]>([]);
  const [status, setStatus] = useState<Status>("playing");
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [stats, setStats] = useState<StatsT>(defaultStats);
  const [showResult, setShowResult] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const statsRef = useRef<StatsT>(defaultStats());
  const recordedRef = useRef(false);

  const setStatsBoth = useCallback((next: StatsT) => {
    statsRef.current = next;
    setStats(next);
  }, []);

  const fetchReveal = useCallback(async (): Promise<Reveal | null> => {
    try {
      const res = await fetch(`/api/reveal?day=${puzzle.day}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const r = (await res.json()) as Reveal;
        setReveal(r);
        return r;
      }
    } catch {
      /* offline — reveal stays null, game still ends */
    }
    return null;
  }, [puzzle.day]);

  // Hydrate saved state after mount (keeps SSR markup deterministic).
  useEffect(() => {
    const loaded = loadStats();
    setStatsBoth(loaded);

    const saved = loadGame(puzzle.day);
    if (saved) {
      setResults(saved.results);
      if (saved.finished) {
        recordedRef.current = true;
        setStatus(saved.won ? "won" : "lost");
        if (saved.reveal) setReveal(saved.reveal);
        else void fetchReveal();
      }
    } else if (
      loaded.played === 0 &&
      typeof window !== "undefined" &&
      !window.localStorage.getItem(ONBOARD_KEY)
    ) {
      setShowHowTo(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.day]);

  const finish = useCallback(
    async (finalResults: GuessResult[], won: boolean) => {
      setStatus(won ? "won" : "lost");
      const r = await fetchReveal();

      if (!recordedRef.current) {
        recordedRef.current = true;
        const game: SavedGame = {
          number: puzzle.number,
          day: puzzle.day,
          results: finalResults,
          finished: true,
          won,
        };
        const next = recordFinish(statsRef.current, game);
        setStatsBoth(next);
        saveStats(next);
        saveGame({ ...game, reveal: r });
      }
      window.setTimeout(() => setShowResult(true), 1100);
    },
    [fetchReveal, puzzle.day, puzzle.number, setStatsBoth],
  );

  const handleGuess = useCallback(
    (asset: Asset) => {
      if (status !== "playing") return;
      if (results.some((r) => r.ticker === asset.ticker)) return;

      const result = evaluateGuess(asset, puzzle);
      const next = [...results, result];
      setResults(next);

      const won = result.correct;
      const finished = won || next.length >= MAX_GUESSES;
      if (finished) {
        void finish(next, won);
      } else {
        saveGame({
          number: puzzle.number,
          day: puzzle.day,
          results: next,
          finished: false,
          won: false,
        });
      }
    },
    [finish, puzzle, results, status],
  );

  const handleInvalid = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const closeHowTo = useCallback(() => {
    setShowHowTo(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARD_KEY, "1");
    }
  }, []);

  const wrongCount = useMemo(
    () => results.filter((r) => !r.correct).length,
    [results],
  );
  const guessed = useMemo(
    () => new Set(results.map((r) => r.ticker)),
    [results],
  );
  const finished = status !== "playing";

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 py-4">
      <Header
        puzzleNumber={puzzle.number}
        onHowTo={() => setShowHowTo(true)}
        onStats={() => setShowStats(true)}
      />

      <Chart
        data={puzzle.normalized}
        revealed={finished}
        ticker={reveal?.ticker}
      />

      <Hints
        hints={visibleHints(puzzle, wrongCount)}
        nextInGuesses={status === "playing" && wrongCount < 5}
      />

      <GuessBoard results={results} />

      {finished ? (
        <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-3">
          <div className="flex-1">
            <Countdown />
          </div>
          <button
            type="button"
            onClick={() => setShowResult(true)}
            className="rounded-control bg-correct px-5 py-3 font-semibold text-bg transition hover:brightness-110"
          >
            {status === "won" ? "See result" : "See answer"}
          </button>
        </div>
      ) : (
        <GuessInput
          guessesLeft={MAX_GUESSES - results.length}
          alreadyGuessed={guessed}
          onGuess={handleGuess}
          onInvalid={handleInvalid}
        />
      )}

      <footer className="mt-auto pt-4 text-center text-[11px] leading-relaxed text-muted">
        Same puzzle for everyone, resets at midnight UTC. Historical data, for
        fun — <span className="text-muted">not financial advice</span>.
      </footer>

      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-40 mx-auto w-fit rounded-full bg-surface-2 px-4 py-2 text-sm text-text shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      <ResultModal
        open={showResult}
        onClose={() => setShowResult(false)}
        won={status === "won"}
        reveal={reveal}
        results={results}
        stats={stats}
        puzzleNumber={puzzle.number}
      />

      <HowToPlay open={showHowTo} onClose={closeHowTo} />

      <Modal
        open={showStats}
        onClose={() => setShowStats(false)}
        title="Statistics"
      >
        <Stats stats={stats} highlight={status === "won" ? results.length : null} />
      </Modal>
    </main>
  );
}
