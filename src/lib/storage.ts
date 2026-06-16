// Local-first stats & per-day game state. No account, no server (v1).
// All functions are SSR-safe: they no-op / return defaults without `window`.

import { MAX_GUESSES } from "./seed";
import type { GuessResult, Reveal } from "./types";

const STATS_KEY = "chartle:stats:v1";
const gameKey = (day: string) => `chartle:game:${day}`;

export interface Stats {
  played: number;
  wins: number;
  losses: number;
  currentStreak: number;
  maxStreak: number;
  /** Wins by guess count; dist[i] = wins in (i+1) guesses. */
  dist: number[];
  lastNumber: number | null;
  lastDay: string | null;
}

export interface SavedGame {
  number: number;
  day: string;
  results: GuessResult[];
  finished: boolean;
  won: boolean;
  /** Cached answer so a finished day restores instantly, even offline. */
  reveal?: Reveal | null;
}

export function defaultStats(): Stats {
  return {
    played: 0,
    wins: 0,
    losses: 0,
    currentStreak: 0,
    maxStreak: 0,
    dist: Array(MAX_GUESSES).fill(0),
    lastNumber: null,
    lastDay: null,
  };
}

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadStats(): Stats {
  if (!hasStorage()) return defaultStats();
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return defaultStats();
    return { ...defaultStats(), ...(JSON.parse(raw) as Partial<Stats>) };
  } catch {
    return defaultStats();
  }
}

export function saveStats(stats: Stats): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function loadGame(day: string): SavedGame | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(gameKey(day));
    return raw ? (JSON.parse(raw) as SavedGame) : null;
  } catch {
    return null;
  }
}

export function saveGame(game: SavedGame): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(gameKey(game.day), JSON.stringify(game));
  } catch {
    /* ignore */
  }
}

/**
 * Fold a finished game into stats. Idempotent per puzzle number — replaying or
 * reloading a completed day never double-counts or re-rolls the streak.
 */
export function recordFinish(prev: Stats, game: SavedGame): Stats {
  if (!game.finished) return prev;
  if (prev.lastNumber === game.number) return prev; // already counted

  const consecutive = prev.lastNumber === game.number - 1;
  const next: Stats = {
    ...prev,
    dist: [...prev.dist],
    played: prev.played + 1,
    lastNumber: game.number,
    lastDay: game.day,
  };

  if (game.won) {
    next.wins += 1;
    next.currentStreak = (consecutive ? prev.currentStreak : 0) + 1;
    next.maxStreak = Math.max(prev.maxStreak, next.currentStreak);
    const idx = Math.min(game.results.length, MAX_GUESSES) - 1;
    if (idx >= 0) next.dist[idx] += 1;
  } else {
    next.losses += 1;
    next.currentStreak = 0;
  }
  return next;
}

export function winRate(stats: Stats): number {
  return stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);
}
