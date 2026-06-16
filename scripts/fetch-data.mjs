// Fetches EXACT daily closes from free, key-less sources and writes
// data/series.json. Run wherever outbound network is allowed (CI, local, prod
// build) — it is blocked in the Claude-on-web sandbox by network policy, which
// is why scripts/build-data.mjs ships an approximate fallback.
//
//   node scripts/fetch-data.mjs
//
// Source: Stooq daily CSV (no API key). Failures per-symbol are tolerated; the
// previously bundled series is kept so the app never ends up with no data.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Catalog ticker -> Stooq symbol.
const STOOQ = {
  SPX: "^spx",
  NDX: "^ndx",
  BTC: "btcusd",
  ETH: "ethusd",
  SOL: "solusd",
  DOGE: "dogeusd",
  XRP: "xrpusd",
  GOLD: "xauusd",
  WTI: "cl.f",
  EURUSD: "eurusd",
  USDJPY: "usdjpy",
  ASML: "asml.us",
  SAP: "sap.de",
  NESN: "nesn.ch",
  TSM: "tsm.us",
  BABA: "baba.us",
  SONY: "sony.us",
};

function stooqSymbol(ticker) {
  return STOOQ[ticker] ?? `${ticker.toLowerCase()}.us`;
}

async function fetchCsv(symbol, attempts = 3) {
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (chartle data fetch)" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.includes("Date") || text.includes("Exceeded")) {
        throw new Error("unexpected body");
      }
      return text;
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** i));
    }
  }
}

function parseCloses(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const closes = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const close = Number(cols[4]);
    if (Number.isFinite(close) && close > 0) closes.push(close);
  }
  return closes;
}

async function main() {
  const assets = JSON.parse(
    readFileSync(join(root, "data", "assets.json"), "utf8"),
  );
  const outPath = join(root, "data", "series.json");
  const existing = existsSync(outPath)
    ? JSON.parse(readFileSync(outPath, "utf8"))
    : {};

  const series = { ...existing };
  let ok = 0;
  let kept = 0;

  for (const a of assets) {
    const symbol = stooqSymbol(a.ticker);
    try {
      const csv = await fetchCsv(symbol);
      const closes = parseCloses(csv);
      if (closes.length < 60) throw new Error(`only ${closes.length} rows`);
      series[a.ticker] = {
        ticker: a.ticker,
        closes,
        approx: false,
        source: "stooq",
      };
      ok++;
      console.log(`  ✓ ${a.ticker} (${symbol}) — ${closes.length} closes`);
    } catch (err) {
      kept++;
      console.warn(
        `  ! ${a.ticker} (${symbol}) failed: ${err.message} — keeping bundled`,
      );
    }
    await new Promise((r) => setTimeout(r, 250)); // be polite
  }

  writeFileSync(outPath, JSON.stringify(series) + "\n");
  console.log(`fetch-data: ${ok} fetched, ${kept} kept. Wrote ${outPath}`);
}

main().catch((err) => {
  console.error("fetch-data failed:", err);
  process.exit(1);
});
