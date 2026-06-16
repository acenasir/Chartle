// Lightweight synchronous hash for client-side guess checking.
//
// This is NOT a security primitive. Its only jobs are (a) keep the plaintext
// answer out of the puzzle payload so a glance at the network tab doesn't spoil
// the day, and (b) check a guess without a server round-trip. A determined user
// can still brute-force the (few hundred) catalog tickers; true anti-cheat would
// require server-side guess validation (tracked as future work in the PRD).

/** cyrb53 — a fast 53-bit string hash with a numeric seed. */
export function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** Normalize any ticker/symbol to its canonical comparison form. */
export function normalizeTicker(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Salted hash of a normalized ticker. */
export function hashAnswer(ticker: string, salt: number): number {
  return cyrb53(normalizeTicker(ticker), salt);
}
