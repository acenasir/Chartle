// Edge function: serves the anonymized daily puzzle. Because the puzzle is a
// pure function of the UTC day, one identical response is cacheable at the CDN
// for every player on Earth until the next UTC midnight. This is the
// "same seeded puzzle for everyone until midnight" requirement, realized.

import type { NextRequest } from "next/server";

import { assets, seriesMap } from "@/lib/data";
import { buildPuzzle } from "@/lib/puzzle";
import { isoDayUTC, secondsUntilUtcMidnight } from "@/lib/seed";

export const runtime = "edge";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function resolveDay(raw: string | null): { day: string; isToday: boolean } {
  const today = isoDayUTC(new Date());
  if (raw && DAY_RE.test(raw) && !Number.isNaN(Date.parse(`${raw}T00:00:00Z`))) {
    return { day: raw, isToday: raw === today };
  }
  return { day: today, isToday: true };
}

export function GET(req: NextRequest) {
  const { day, isToday } = resolveDay(req.nextUrl.searchParams.get("day"));
  const puzzle = buildPuzzle(day, assets, seriesMap);

  // Cache today's puzzle only until midnight; past puzzles are immutable.
  const ttl = isToday ? secondsUntilUtcMidnight() : 86_400;
  return Response.json(puzzle, {
    headers: {
      "Cache-Control": `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=60`,
    },
  });
}
