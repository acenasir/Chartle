// Pure puzzle construction. Given a day + the catalog + series, this returns the
// identical puzzle everywhere, forever. No I/O here — callers inject data.

import { hashAnswer } from "./hash";
import {
  DEFAULT_WINDOW,
  dailySeed,
  mulberry32,
  puzzleNumber,
} from "./seed";
import type { Asset, Puzzle, Reveal, Series } from "./types";

export interface BuildOptions {
  window?: number;
  epoch?: string;
}

/** Index a price window to 100 at its first point. */
export function normalizeWindow(closes: number[]): number[] {
  if (closes.length === 0) return [];
  const base = closes[0];
  if (!base) return closes.map(() => 100);
  return closes.map((c) => Math.round((c / base) * 10000) / 100);
}

/** Assets that have a usable series, in a stable order (by ticker). */
export function playableAssets(
  assets: Asset[],
  series: Record<string, Series>,
): Asset[] {
  return assets
    .filter((a) => {
      const s = series[a.ticker];
      return s && s.closes.length >= 30;
    })
    .sort((a, b) => a.ticker.localeCompare(b.ticker));
}

interface Selection {
  asset: Asset;
  series: Series;
  start: number;
  window: number;
}

/** Deterministically choose the asset + window for a day. */
function select(
  day: string,
  assets: Asset[],
  series: Record<string, Series>,
  window: number,
): Selection {
  const pool = playableAssets(assets, series);
  if (pool.length === 0) {
    throw new Error("No playable assets: run `npm run build-data` first.");
  }
  const rng = mulberry32(dailySeed(day));
  const asset = pool[Math.floor(rng() * pool.length)];
  const s = series[asset.ticker];

  const w = Math.min(window, s.closes.length);
  const maxStart = s.closes.length - w;
  const start = maxStart > 0 ? Math.floor(rng() * (maxStart + 1)) : 0;
  return { asset, series: s, start, window: w };
}

/** Build the anonymized puzzle payload for a day (no answer identity). */
export function buildPuzzle(
  day: string,
  assets: Asset[],
  series: Record<string, Series>,
  opts: BuildOptions = {},
): Puzzle {
  const window = opts.window ?? DEFAULT_WINDOW;
  const { asset, series: s, start } = select(day, assets, series, window);
  const w = Math.min(window, s.closes.length);

  const slice = s.closes.slice(start, start + w);
  const normalized = normalizeWindow(slice);
  const netReturnPct =
    Math.round((normalized[normalized.length - 1] - 100) * 10) / 10;

  const salt = dailySeed(day);
  return {
    day,
    number: puzzleNumber(day, opts.epoch),
    normalized,
    windowDays: normalized.length,
    answer: {
      assetClass: asset.assetClass,
      region: asset.region,
      sector: asset.sector,
    },
    netReturnPct,
    firstChar: asset.ticker[0],
    answerHash: hashAnswer(asset.ticker, salt),
    salt,
  };
}

/** Recompute the same selection and return the full answer (for game-end). */
export function buildReveal(
  day: string,
  assets: Asset[],
  series: Record<string, Series>,
  opts: BuildOptions = {},
): Reveal {
  const window = opts.window ?? DEFAULT_WINDOW;
  const { asset, series: s, start } = select(day, assets, series, window);
  const w = Math.min(window, s.closes.length);
  const normalized = normalizeWindow(s.closes.slice(start, start + w));
  const netReturnPct =
    Math.round((normalized[normalized.length - 1] - 100) * 10) / 10;

  return {
    day,
    number: puzzleNumber(day, opts.epoch),
    ticker: asset.ticker,
    name: asset.name,
    assetClass: asset.assetClass,
    region: asset.region,
    sector: asset.sector,
    netReturnPct,
    approx: s.approx,
  };
}
