// Deterministic seeding: the same UTC day always yields the same puzzle, on the
// edge and (if ever needed) on the client. No per-request/per-user randomness.

/** Launch epoch (UTC). Puzzle #1 is EPOCH; "#142" = 141 days later. */
export const EPOCH = "2026-01-01";

/** Trading-day window length shown per puzzle (~1 year of daily closes). */
export const DEFAULT_WINDOW = 252;

/** Maximum guesses per puzzle. */
export const MAX_GUESSES = 6;

/** FNV-1a 32-bit string hash → unsigned 32-bit integer seed. */
export function xfnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — tiny, fast, deterministic. Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable numeric seed for a given UTC day string. */
export function dailySeed(day: string): number {
  return xfnv1a(`chartle:${day}`);
}

/** Format a Date as a UTC "YYYY-MM-DD" string. */
export function isoDayUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parse a "YYYY-MM-DD" string to a UTC Date at 00:00:00. */
export function parseDayUTC(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

/** Whole UTC days between two day-strings (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = parseDayUTC(b).getTime() - parseDayUTC(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Puzzle number for a day = days since EPOCH + 1 (so EPOCH is #1). */
export function puzzleNumber(day: string, epoch: string = EPOCH): number {
  return daysBetween(epoch, day) + 1;
}

/** The next UTC midnight strictly after `from` — the "play again" appointment. */
export function nextUtcMidnight(from: Date = new Date()): Date {
  const next = new Date(from);
  next.setUTCHours(24, 0, 0, 0);
  return next;
}

/** Seconds until the next UTC midnight (for the countdown + cache TTL). */
export function secondsUntilUtcMidnight(from: Date = new Date()): number {
  return Math.max(
    0,
    Math.floor((nextUtcMidnight(from).getTime() - from.getTime()) / 1000),
  );
}
