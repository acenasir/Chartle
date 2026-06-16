// Generates data/series.json for OFFLINE / DEMO play.
//
// Each series is reconstructed deterministically from well-known *public
// milestone* arcs (e.g. BTC's 2021 double peak + 2022 crash, the 2020 COVID
// crash + recovery, NVDA's 2023-24 run). The arcs are directionally real public
// knowledge; the point-by-point path is an approximation, so every series is
// flagged `approx: true`. Run `npm run fetch-data` in a networked environment
// to replace these with exact feed data.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// --- deterministic PRNG (mirrors src/lib/seed.ts) -------------------------
function xfnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussian(rng) {
  // Box-Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Interpolate a multiple at fractional position t in log space.
function interpLog(anchors, t) {
  for (let i = 1; i < anchors.length; i++) {
    const [t0, l0] = anchors[i - 1];
    const [t1, l1] = anchors[i];
    if (t <= t1) {
      const f = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
      return Math.exp(Math.log(l0) + (Math.log(l1) - Math.log(l0)) * f);
    }
  }
  return anchors[anchors.length - 1][1];
}

// --- per-asset arcs (directional public history) --------------------------
// anchors: [fractionThroughWindow, priceMultipleVsStart]
const N = 1300; // ~5 trading years so windows vary day to day
const PROFILES = {
  NVDA: { base: 15, vol: 0.028, anchors: [[0, 1], [0.5, 1.5], [0.78, 1.7], [0.88, 3.4], [1, 7.5]] },
  AMD: { base: 30, vol: 0.03, anchors: [[0, 1], [0.4, 3], [0.6, 2], [0.85, 1.4], [1, 3.2]] },
  TSLA: { base: 25, vol: 0.035, anchors: [[0, 1], [0.32, 1.3], [0.5, 7], [0.62, 4], [0.8, 2.4], [1, 3.6]] },
  AAPL: { base: 60, vol: 0.018, anchors: [[0, 1], [0.5, 1.6], [0.75, 2], [1, 2.6]] },
  MSFT: { base: 120, vol: 0.016, anchors: [[0, 1], [0.5, 1.5], [1, 2.4]] },
  AMZN: { base: 90, vol: 0.02, anchors: [[0, 1], [0.55, 1.9], [0.78, 1.1], [1, 1.7]] },
  GOOGL: { base: 60, vol: 0.018, anchors: [[0, 1], [0.55, 1.6], [0.78, 1.1], [1, 1.9]] },
  META: { base: 180, vol: 0.026, anchors: [[0, 1], [0.5, 1.7], [0.74, 0.55], [1, 1.9]] },
  NFLX: { base: 300, vol: 0.026, anchors: [[0, 1], [0.5, 1.8], [0.68, 0.55], [1, 1.5]] },
  GME: { base: 5, vol: 0.05, anchors: [[0, 1], [0.46, 1.2], [0.5, 28], [0.56, 6], [0.75, 5], [1, 7]] },
  JPM: { base: 100, vol: 0.016, anchors: [[0, 1], [0.25, 0.8], [0.6, 1.3], [1, 1.7]] },
  XOM: { base: 80, vol: 0.018, anchors: [[0, 1], [0.3, 0.5], [0.7, 1.2], [1, 1.5]] },
  KO: { base: 45, vol: 0.011, anchors: [[0, 1], [0.5, 1.1], [1, 1.3]] },
  DIS: { base: 110, vol: 0.02, anchors: [[0, 1], [0.4, 1.6], [0.7, 0.8], [1, 0.85]] },
  BA: { base: 200, vol: 0.026, anchors: [[0, 1], [0.25, 0.4], [0.6, 1.1], [1, 0.95]] },
  PLTR: { base: 9, vol: 0.035, anchors: [[0, 1], [0.2, 3], [0.45, 0.8], [0.8, 1.5], [1, 4.5]] },
  ASML: { base: 250, vol: 0.022, anchors: [[0, 1], [0.5, 2.2], [0.7, 1.5], [1, 2.8]] },
  SAP: { base: 90, vol: 0.016, anchors: [[0, 1], [0.5, 1.2], [1, 1.7]] },
  NESN: { base: 90, vol: 0.01, anchors: [[0, 1], [0.5, 1.25], [1, 1.15]] },
  TSM: { base: 50, vol: 0.022, anchors: [[0, 1], [0.5, 2], [0.72, 1.2], [1, 2.4]] },
  BABA: { base: 200, vol: 0.028, anchors: [[0, 1], [0.3, 1.5], [0.7, 0.35], [1, 0.5]] },
  SONY: { base: 70, vol: 0.018, anchors: [[0, 1], [0.5, 1.7], [1, 1.6]] },
  SPY: { base: 250, vol: 0.011, anchors: [[0, 1], [0.2, 1.1], [0.26, 0.78], [0.5, 1.25], [0.72, 1.1], [1, 1.6]] },
  QQQ: { base: 170, vol: 0.014, anchors: [[0, 1], [0.2, 1.15], [0.26, 0.75], [0.5, 1.5], [0.72, 1.05], [1, 1.8]] },
  ARKK: { base: 50, vol: 0.03, anchors: [[0, 1], [0.45, 2.6], [0.5, 2.2], [0.8, 0.7], [1, 1]] },
  SPX: { base: 2700, vol: 0.011, anchors: [[0, 1], [0.2, 1.1], [0.26, 0.78], [0.5, 1.25], [0.72, 1.1], [1, 1.6]] },
  NDX: { base: 7000, vol: 0.014, anchors: [[0, 1], [0.2, 1.15], [0.26, 0.75], [0.5, 1.5], [0.72, 1.05], [1, 1.85]] },
  BTC: { base: 8000, vol: 0.04, anchors: [[0, 1], [0.24, 3.6], [0.34, 1.2], [0.6, 5.5], [0.7, 2.1], [1, 4.6]] },
  ETH: { base: 200, vol: 0.045, anchors: [[0, 1], [0.25, 2.5], [0.35, 1], [0.6, 12], [0.7, 5], [1, 9]] },
  SOL: { base: 1.5, vol: 0.06, anchors: [[0, 1], [0.55, 120], [0.7, 8], [1, 60]] },
  DOGE: { base: 0.002, vol: 0.07, anchors: [[0, 1], [0.55, 300], [0.62, 120], [1, 45]] },
  XRP: { base: 0.3, vol: 0.05, anchors: [[0, 1], [0.55, 3], [0.7, 1.2], [1, 1.8]] },
  GOLD: { base: 1300, vol: 0.009, anchors: [[0, 1], [0.5, 1.3], [0.8, 1.25], [1, 1.6]] },
  WTI: { base: 55, vol: 0.03, anchors: [[0, 1], [0.45, 0.1], [0.6, 1.2], [0.8, 1.9], [1, 1.4]] },
  EURUSD: { base: 1.13, vol: 0.005, anchors: [[0, 1], [0.4, 1.06], [0.7, 0.93], [1, 1.0]] },
  USDJPY: { base: 108, vol: 0.006, anchors: [[0, 1], [0.5, 1.0], [0.8, 1.35], [1, 1.42]] },
};

function genCloses(ticker) {
  const p = PROFILES[ticker] ?? {
    base: 100,
    vol: 0.02,
    anchors: [[0, 1], [1, 1.4]],
  };
  const rng = mulberry32(xfnv1a(`series:${ticker}`));
  let w = 0;
  const closes = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const trend = interpLog(p.anchors, t);
    w = 0.94 * w + p.vol * gaussian(rng);
    const price = p.base * trend * Math.exp(w);
    const decimals = price < 1 ? 5 : price < 10 ? 3 : 2;
    closes.push(Number(price.toFixed(decimals)));
  }
  return closes;
}

const assets = JSON.parse(
  readFileSync(join(root, "data", "assets.json"), "utf8"),
);

const series = {};
for (const a of assets) {
  series[a.ticker] = {
    ticker: a.ticker,
    closes: genCloses(a.ticker),
    approx: true,
    source: "approx-milestones",
  };
}

writeFileSync(
  join(root, "data", "series.json"),
  JSON.stringify(series) + "\n",
);
console.log(
  `build-data: wrote ${Object.keys(series).length} approx series ` +
    `(${N} points each) to data/series.json`,
);
