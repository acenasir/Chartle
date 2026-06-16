// Guess scoring, hint progression, and grid rendering — all pure functions.

import { hashAnswer } from "./hash";
import { MAX_GUESSES } from "./seed";
import type {
  Asset,
  GuessFeedback,
  GuessResult,
  Match,
  Puzzle,
} from "./types";

export { MAX_GUESSES };

/** Equity-style classes are "related" to each other for partial feedback. */
const EQUITY_LIKE = new Set(["stock", "etf", "index"]);

function matchClass(guess: string, answer: string): Match {
  if (guess === answer) return "exact";
  if (EQUITY_LIKE.has(guess) && EQUITY_LIKE.has(answer)) return "related";
  return "none";
}

function matchExact(guess: string, answer: string): Match {
  return guess.toLowerCase() === answer.toLowerCase() ? "exact" : "none";
}

/** Is a guessed ticker the answer? Checked via salted hash, no plaintext. */
export function checkCorrect(ticker: string, puzzle: Puzzle): boolean {
  return hashAnswer(ticker, puzzle.salt) === puzzle.answerHash;
}

/** Score a resolved guess against the puzzle's answer dimensions. */
export function evaluateGuess(guess: Asset, puzzle: Puzzle): GuessResult {
  const correct = checkCorrect(guess.ticker, puzzle);
  const feedback: GuessFeedback = correct
    ? { assetClass: "exact", region: "exact", sector: "exact" }
    : {
        assetClass: matchClass(guess.assetClass, puzzle.answer.assetClass),
        region: matchExact(guess.region, puzzle.answer.region),
        sector: matchExact(guess.sector, puzzle.answer.sector),
      };
  return { ticker: guess.ticker, name: guess.name, correct, feedback };
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface Hint {
  /** 1-based position; unlocks after this many wrong guesses. */
  order: number;
  label: string;
  value: string;
}

/** The full ordered hint schedule for a puzzle. */
export function buildHints(puzzle: Puzzle): Hint[] {
  const ret = `${puzzle.netReturnPct >= 0 ? "+" : ""}${puzzle.netReturnPct}%`;
  return [
    { order: 1, label: "Asset class", value: cap(puzzle.answer.assetClass) },
    { order: 2, label: "Region", value: puzzle.answer.region },
    { order: 3, label: "Sector", value: puzzle.answer.sector },
    { order: 4, label: "Return over window", value: ret },
    { order: 5, label: "Ticker starts with", value: `“${puzzle.firstChar}”` },
  ];
}

/** Hints visible after a given number of wrong guesses. */
export function visibleHints(puzzle: Puzzle, wrongGuesses: number): Hint[] {
  return buildHints(puzzle).slice(0, Math.max(0, Math.min(wrongGuesses, 5)));
}

const SQUARE: Record<Match, string> = {
  exact: "🟩",
  related: "🟨",
  none: "⬛",
};

/** Color-blind-safe glyph counterpart to the color squares. */
export const GLYPH: Record<Match, string> = {
  exact: "▣",
  related: "◪",
  none: "☐",
};

/** One share-grid row for a guess: class, region, sector squares. */
export function gridRow(result: GuessResult): string {
  const { assetClass, region, sector } = result.feedback;
  return SQUARE[assetClass] + SQUARE[region] + SQUARE[sector];
}

/** Final score token: "n/6" on a win, "X/6" on a loss. */
export function scoreToken(results: GuessResult[]): string {
  const won = results.some((r) => r.correct);
  return `${won ? results.length : "X"}/${MAX_GUESSES}`;
}
