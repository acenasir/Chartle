import Game from "./components/Game";
import { assets, seriesMap } from "@/lib/data";
import { buildPuzzle } from "@/lib/puzzle";
import { isoDayUTC } from "@/lib/seed";

// The puzzle depends on the current UTC day, so render per request. The
// cacheable distribution endpoint is /api/puzzle (edge, cached until midnight);
// here we compute the same puzzle directly for an instant first paint.
export const dynamic = "force-dynamic";

export default function Page() {
  const day = isoDayUTC(new Date());
  const puzzle = buildPuzzle(day, assets, seriesMap);
  return <Game puzzle={puzzle} />;
}
