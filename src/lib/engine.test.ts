import { describe, expect, it } from "vitest";

import { assets, seriesMap, resolveAsset, searchAssets } from "./data";
import {
  checkCorrect,
  evaluateGuess,
  gridRow,
  scoreToken,
  visibleHints,
} from "./game";
import { buildPuzzle, buildReveal, normalizeWindow, playableAssets } from "./puzzle";
import {
  daysBetween,
  dailySeed,
  isoDayUTC,
  nextUtcMidnight,
  puzzleNumber,
  secondsUntilUtcMidnight,
} from "./seed";
import { buildShareText } from "./share";
import { defaultStats, recordFinish, winRate, type SavedGame } from "./storage";
import type { Asset } from "./types";

const DAY = "2026-06-16";

describe("seed", () => {
  it("is deterministic per day", () => {
    expect(dailySeed(DAY)).toBe(dailySeed(DAY));
    expect(dailySeed(DAY)).not.toBe(dailySeed("2026-06-17"));
  });

  it("computes puzzle numbers from the epoch", () => {
    expect(puzzleNumber("2026-01-01")).toBe(1);
    expect(puzzleNumber("2026-01-11")).toBe(11);
    expect(daysBetween("2026-01-01", "2026-01-02")).toBe(1);
  });

  it("formats and counts down to UTC midnight", () => {
    const noon = new Date("2026-06-16T12:00:00.000Z");
    expect(isoDayUTC(noon)).toBe("2026-06-16");
    expect(nextUtcMidnight(noon).toISOString()).toBe("2026-06-17T00:00:00.000Z");
    expect(secondsUntilUtcMidnight(noon)).toBe(12 * 3600);
  });
});

describe("normalizeWindow", () => {
  it("indexes the first point to 100", () => {
    const n = normalizeWindow([50, 75, 100]);
    expect(n[0]).toBe(100);
    expect(n[1]).toBe(150);
    expect(n[2]).toBe(200);
  });
});

describe("puzzle", () => {
  it("only uses assets with sufficient series", () => {
    const pool = playableAssets(assets, seriesMap);
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.length).toBeLessThanOrEqual(assets.length);
  });

  it("is identical for the same day and varies across days", () => {
    const a = buildPuzzle(DAY, assets, seriesMap);
    const b = buildPuzzle(DAY, assets, seriesMap);
    expect(a).toEqual(b);
    expect(a.normalized[0]).toBe(100);
    expect(a.number).toBe(puzzleNumber(DAY));

    const c = buildPuzzle("2026-06-17", assets, seriesMap);
    // Extremely unlikely to collide on both asset hash and window.
    expect(c.answerHash === a.answerHash && c.normalized.length === a.normalized.length).toBe(false);
  });

  it("never leaks the answer identity in the payload", () => {
    const p = buildPuzzle(DAY, assets, seriesMap);
    const json = JSON.stringify(p);
    const reveal = buildReveal(DAY, assets, seriesMap);
    expect(json).not.toContain(reveal.ticker);
    expect(json).not.toContain(reveal.name);
  });

  it("reveal matches the served puzzle", () => {
    const p = buildPuzzle(DAY, assets, seriesMap);
    const r = buildReveal(DAY, assets, seriesMap);
    expect(checkCorrect(r.ticker, p)).toBe(true);
    expect(r.assetClass).toBe(p.answer.assetClass);
    expect(r.netReturnPct).toBe(p.netReturnPct);
  });
});

describe("game", () => {
  const puzzle = buildPuzzle(DAY, assets, seriesMap);
  const reveal = buildReveal(DAY, assets, seriesMap);
  const answer = assets.find((a) => a.ticker === reveal.ticker) as Asset;

  it("scores the correct guess as all-exact and wins", () => {
    const res = evaluateGuess(answer, puzzle);
    expect(res.correct).toBe(true);
    expect(res.feedback).toEqual({
      assetClass: "exact",
      region: "exact",
      sector: "exact",
    });
    expect(gridRow(res)).toBe("🟩🟩🟩");
  });

  it("scores a wrong guess by shared dimensions", () => {
    const wrong = assets.find(
      (a) => a.ticker !== answer.ticker && a.sector === answer.sector,
    );
    if (wrong) {
      const res = evaluateGuess(wrong, puzzle);
      expect(res.correct).toBe(false);
      expect(res.feedback.sector).toBe("exact");
    }
    const farClass = answer.assetClass === "crypto" ? "fx" : "crypto";
    const far = assets.find((a) => a.assetClass === farClass);
    if (far) {
      expect(evaluateGuess(far, puzzle).feedback.assetClass).toBe("none");
    }
  });

  it("unlocks one hint per wrong guess, capped at five", () => {
    expect(visibleHints(puzzle, 0)).toHaveLength(0);
    expect(visibleHints(puzzle, 3)).toHaveLength(3);
    expect(visibleHints(puzzle, 9)).toHaveLength(5);
  });

  it("formats score tokens", () => {
    const win = [evaluateGuess(answer, puzzle)];
    expect(scoreToken(win)).toBe("1/6");
    const other = assets.find((a) => a.ticker !== answer.ticker) as Asset;
    const loss = Array(6).fill(evaluateGuess(other, puzzle));
    expect(scoreToken(loss)).toBe("X/6");
  });
});

describe("share text", () => {
  const puzzle = buildPuzzle(DAY, assets, seriesMap);
  const reveal = buildReveal(DAY, assets, seriesMap);
  const answer = assets.find((a) => a.ticker === reveal.ticker) as Asset;
  const other = assets.find((a) => a.ticker !== answer.ticker) as Asset;

  it("is spoiler-free and well-formed", () => {
    const results = [evaluateGuess(other, puzzle), evaluateGuess(answer, puzzle)];
    const text = buildShareText({ number: 142, results, streak: 5 });
    expect(text).toContain("Chartle #142");
    expect(text).toContain("2/6");
    expect(text).toContain("streak 5");
    expect(text).not.toContain(answer.ticker);
    expect(text.split("\n").length).toBeGreaterThanOrEqual(4);
  });
});

describe("data lookup", () => {
  it("resolves tickers, names and aliases", () => {
    expect(resolveAsset("aapl")?.ticker).toBe("AAPL");
    expect(resolveAsset("Bitcoin")?.ticker).toBe("BTC");
    expect(resolveAsset("nope-xyz")).toBeUndefined();
  });
  it("autocompletes by prefix", () => {
    const hits = searchAssets("ap");
    expect(hits.some((a) => a.ticker === "AAPL")).toBe(true);
  });
});

describe("stats & streaks", () => {
  const game = (number: number, won: boolean): SavedGame => ({
    number,
    day: `2026-01-${String(number).padStart(2, "0")}`,
    results: [],
    finished: true,
    won,
  });

  it("increments streak on consecutive-day wins", () => {
    let s = defaultStats();
    s = recordFinish(s, game(1, true));
    s = recordFinish(s, game(2, true));
    s = recordFinish(s, game(3, true));
    expect(s.currentStreak).toBe(3);
    expect(s.maxStreak).toBe(3);
    expect(s.wins).toBe(3);
    expect(winRate(s)).toBe(100);
  });

  it("breaks streak on a loss and on a skipped day", () => {
    let s = defaultStats();
    s = recordFinish(s, game(1, true));
    s = recordFinish(s, game(2, false));
    expect(s.currentStreak).toBe(0);
    s = recordFinish(s, game(3, true));
    expect(s.currentStreak).toBe(1);
    s = recordFinish(s, game(5, true)); // skipped #4
    expect(s.currentStreak).toBe(1);
    expect(s.maxStreak).toBe(1);
  });

  it("is idempotent for an already-counted day", () => {
    let s = defaultStats();
    s = recordFinish(s, game(1, true));
    const before = { ...s };
    s = recordFinish(s, game(1, true));
    expect(s).toEqual(before);
  });
});
