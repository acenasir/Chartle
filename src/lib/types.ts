// Shared domain types for Chartle.

export type AssetClass =
  | "stock"
  | "etf"
  | "crypto"
  | "commodity"
  | "fx"
  | "index";

export type Region = "US" | "Europe" | "Asia" | "Global";

/** One catalog entry — a possible answer and an autocomplete option. */
export interface Asset {
  /** Canonical symbol used for matching, e.g. "AAPL", "BTC". */
  ticker: string;
  /** Display name, e.g. "Apple Inc.". */
  name: string;
  /** Extra strings that should resolve to this asset in the input. */
  aliases?: string[];
  assetClass: AssetClass;
  region: Region;
  /** Free-form category, e.g. "Technology", "Layer-1", "Energy". */
  sector: string;
}

/** A price history for one asset (oldest → newest). */
export interface Series {
  ticker: string;
  /** Periodic closes, oldest first. */
  closes: number[];
  /** True when reconstructed from public milestones rather than exact feed. */
  approx?: boolean;
  /** Provenance, e.g. "stooq" or "approx-milestones". */
  source: string;
}

/** The three deduction dimensions scored on every guess. */
export interface Dims {
  assetClass: AssetClass;
  region: Region;
  sector: string;
}

/**
 * The anonymized puzzle served to the client. Deliberately omits the answer's
 * ticker/name (see docs/PRD.md §7.3). `answer` holds only category dimensions,
 * which double as hints 1–3.
 */
export interface Puzzle {
  /** UTC ISO date "YYYY-MM-DD". */
  day: string;
  /** Days since launch epoch — the "#142" in the share text. */
  number: number;
  /** Series indexed to 100 at the first shown point. */
  normalized: number[];
  /** Number of points in the shown window. */
  windowDays: number;
  /** Answer category dimensions (also hints 1–3). */
  answer: Dims;
  /** Net % return across the shown window (hint 4; derivable from `normalized`). */
  netReturnPct: number;
  /** First character of the answer ticker (hint 5). */
  firstChar: string;
  /** Salted hash of the answer ticker for client-side guess checking. */
  answerHash: number;
  /** Salt seed mixed into `answerHash`. */
  salt: number;
}

/** Full answer, fetched only once a game is finished. */
export interface Reveal extends Dims {
  day: string;
  number: number;
  ticker: string;
  name: string;
  netReturnPct: number;
  approx?: boolean;
}

export type Match = "exact" | "related" | "none";

export interface GuessFeedback {
  assetClass: Match;
  region: Match;
  sector: Match;
}

export interface GuessResult {
  /** Normalized guess ticker. */
  ticker: string;
  /** Display name of the guessed asset, if it resolved to one. */
  name: string;
  correct: boolean;
  feedback: GuessFeedback;
}
