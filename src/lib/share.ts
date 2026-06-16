// Builds the spoiler-free share artifact — the whole growth loop in one string.
// No ticker, no chart, safe to paste before friends have played.

import { gridRow, scoreToken } from "./game";
import type { GuessResult } from "./types";

export interface ShareInput {
  number: number;
  results: GuessResult[];
  streak: number;
  url?: string;
}

export function buildShareText({
  number,
  results,
  streak,
  url = "chartle.app",
}: ShareInput): string {
  const won = results.some((r) => r.correct);
  const token = scoreToken(results);
  const header = `Chartle #${number} ${won ? "🟩" : "🟥"} ${token}`;
  const grid = results.map(gridRow).join("\n");
  const streakLine =
    streak > 1 ? `\n${won ? "📈" : "📉"} streak ${streak}` : "";
  return `${header}\n${grid}${streakLine}\n${url}`;
}
