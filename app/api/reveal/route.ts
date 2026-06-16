// Edge function: serves the answer (ticker + name + dimensions). The client
// calls this only once a game is finished, so the identity never ships with the
// puzzle payload (docs/PRD.md §7.3).

import type { NextRequest } from "next/server";

import { assets, seriesMap } from "@/lib/data";
import { buildReveal } from "@/lib/puzzle";
import { isoDayUTC } from "@/lib/seed";

export const runtime = "edge";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("day");
  const today = isoDayUTC(new Date());
  const day =
    raw && DAY_RE.test(raw) && !Number.isNaN(Date.parse(`${raw}T00:00:00Z`))
      ? raw
      : today;

  const reveal = buildReveal(day, assets, seriesMap);
  return Response.json(reveal, {
    headers: {
      "Cache-Control": `public, max-age=0, s-maxage=86400, stale-while-revalidate=60`,
    },
  });
}
