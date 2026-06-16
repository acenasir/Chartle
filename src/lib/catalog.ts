// Client-safe catalog: identities + dimensions only (no price series). This is
// what autocomplete needs and is the universe of possible answers. The price
// series live in data.ts and must stay server-side (puzzle payloads ship the
// chart already normalized + anonymized).

import assetsJson from "@data/assets.json";
import type { Asset } from "./types";

export const assets: Asset[] = assetsJson as Asset[];

const byTicker = new Map(assets.map((a) => [a.ticker.toUpperCase(), a]));
const byAlias = new Map<string, Asset>();
for (const a of assets) {
  byAlias.set(a.name.toLowerCase(), a);
  for (const alias of a.aliases ?? []) byAlias.set(alias.toLowerCase(), a);
}

/** Resolve free-text input (ticker, name, or alias) to a catalog asset. */
export function resolveAsset(input: string): Asset | undefined {
  const t = input.trim();
  if (!t) return undefined;
  return byTicker.get(t.toUpperCase()) ?? byAlias.get(t.toLowerCase());
}

/** Autocomplete: assets whose ticker/name/alias matches the query. */
export function searchAssets(query: string, limit = 8): Asset[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: Asset[] = [];
  const contains: Asset[] = [];
  for (const a of assets) {
    const hay = [a.ticker, a.name, ...(a.aliases ?? [])].map((s) =>
      s.toLowerCase(),
    );
    if (hay.some((h) => h.startsWith(q))) starts.push(a);
    else if (hay.some((h) => h.includes(q))) contains.push(a);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
