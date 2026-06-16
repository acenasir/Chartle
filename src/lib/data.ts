// Server/edge-only data module: catalog + price series. Importing this pulls
// data/series.json into the bundle, so only the edge routes and the server
// component (page.tsx) should use it — never a client component. Client code
// imports from ./catalog instead.
//
// In production `npm run fetch-data` overwrites series.json with exact feed
// data; in the sandbox/demo it holds the reconstructed (approx) series from
// `npm run build-data`.

import seriesJson from "@data/series.json";
import type { Series } from "./types";

export { assets, resolveAsset, searchAssets } from "./catalog";

export const seriesMap: Record<string, Series> = seriesJson as Record<
  string,
  Series
>;
