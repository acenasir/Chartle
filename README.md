# Chartle 📈

**The daily markets puzzle.** One anonymized price chart, one real asset, six
guesses — the same puzzle for everyone, resetting at midnight UTC. Guess it,
then share your spoiler-free grid.

> Wordle proved the "one shareable puzzle per day" loop. It's been cloned to
> death in *words* and barely touched in *markets* — a domain with a
> chronically-online audience and effectively infinite puzzle supply. Chartle
> claims that ritual.

This repo was built with a **reverse-prompt method**: start from the artifact a
player posts to a group chat, define the loop it creates, then derive the
product, the design, and the architecture backward from there. The thinking is
captured in [`docs/PRD.md`](docs/PRD.md) and
[`docs/IMAGE_PROMPTS.md`](docs/IMAGE_PROMPTS.md).

---

## The loop we built toward

```
Chartle #167 🟩 3/6
⬛🟨⬛
🟩⬛🟩
🟩🟩🟩
📈 streak 11
chartle.app
```

Spoiler-free (no ticker, no chart), so it's safe to post before friends play.
They see it, feel the itch, tap the link, play the *same* puzzle, post theirs.
That paragraph is the entire growth engine — everything else serves it.

## How to play

1. You see a real asset's ~1-year chart, **indexed to 100**, axes hidden. Read
   the shape.
2. Guess a ticker or name (autocomplete, so spelling never blocks you).
3. Each wrong guess scores three dimensions — **Class · Region · Sector**
   (🟩 exact / 🟨 related / ⬛ none) — and unlocks one progressive hint.
4. Solve in as few guesses as possible (fewer guesses = fewer hints = a better
   brag). Comes back at midnight UTC.

## Architecture

```
Browser ── server-rendered page (instant first paint) ── <Game/> client island
   │
   ├─ GET /api/puzzle?day=YYYY-MM-DD   (Edge) → anonymized puzzle, NO answer,
   │     Cache-Control s-maxage = seconds-until-UTC-midnight  ── one identical,
   │     CDN-cached response for every player until the reset.
   │
   └─ GET /api/reveal?day=YYYY-MM-DD   (Edge) → the answer, fetched only on
         game-end so the identity never ships with the puzzle.
```

- **Determinism.** The puzzle is a pure function of the UTC day:
  `dailySeed(day)` → `mulberry32` PRNG → asset + window. Same day ⇒ same puzzle,
  everywhere, forever. Puzzle number = days since the `EPOCH` launch date.
- **Anonymization.** The puzzle payload carries the normalized series + category
  dimensions + a salted hash of the answer for client-side guess checking — but
  **no ticker or name**. Verified by a test and at the HTTP layer.
- **Local-first.** Stats, streaks, and the day's game live in `localStorage`.
  No account, no database. Finishing a day is idempotent (no streak re-rolls).
- **Pure, tested engine.** Seeding, puzzle construction, scoring, hints, share
  text, and streak math are pure functions in `src/lib`, covered by
  `src/lib/engine.test.ts`.

See [`docs/PRD.md` §7](docs/PRD.md) for the anti-cheat stance and trade-offs.

## Data strategy (two-tier)

Puzzle quality = data quality, and external market APIs are blocked in some
sandboxes — so data is two-tier:

| Tier | Script | Output | Use |
|---|---|---|---|
| **Exact** | `npm run fetch-data` | real daily closes from Stooq (free, no key) | production / CI |
| **Demo** | `npm run build-data` | series reconstructed from public milestone arcs, flagged `approx: true` | offline / sandbox / fallback |

A bundled `data/series.json` ships so the app runs immediately. Run
`npm run fetch-data` anywhere with network to replace it with exact prices.
**Approximate series are always flagged as such — never presented as exact.**

## Develop

```bash
npm install
npm run build-data     # generate the bundled demo dataset (already committed)
npm run dev            # http://localhost:3000

npm test               # engine unit tests (vitest)
npm run typecheck      # tsc --noEmit
npm run build          # production build

npm run fetch-data     # (where network is allowed) pull EXACT prices into series.json
```

## Project layout

```
app/
  page.tsx              server component → today's puzzle → <Game/>
  api/puzzle/route.ts   edge: anonymized daily puzzle (cached to midnight)
  api/reveal/route.ts   edge: the answer, on game-end
  opengraph-image.tsx   dynamic OG card (next/og)
  components/           Chart, GuessInput, GuessBoard, Hints, Result/Stats, …
src/lib/
  seed.ts  puzzle.ts  game.ts  share.ts  hash.ts  catalog.ts  data.ts  storage.ts
  engine.test.ts        18 unit tests
data/
  assets.json           the catalog (≈36 assets across 6 classes)
  series.json           bundled price series (generated)
scripts/
  build-data.mjs        demo data from milestone arcs
  fetch-data.mjs        exact data from Stooq
docs/
  PRD.md  IMAGE_PROMPTS.md
```

## Roadmap (same engine, new modes)

- **"Would you have bought?"** — chart to day *T*, pick buy/hold/sell, score by
  forward P&L.
- Hard mode (fewer hints, shorter window), an **archive** (the engine already
  takes `?day=`), themed weeks, and sibling daily games in other domains
  (logic-circuit, geo) on the same seed + share-loop core.

---

*Chartle uses historical data for a game. It is **not** financial advice.*
