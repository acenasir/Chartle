# Chartle — Product Requirements Document

> **Method note (reverse-prompt approach).** This PRD is written *backward*. We
> start from the single artifact a player posts to a group chat, define the loop
> that artifact creates, and only then derive the product, the game design, and
> the architecture required to make that loop spin. Every requirement below
> traces to "does this make the shared result more likely to be posted, clicked,
> and replayed tomorrow?"

---

## 0. The end state we are reverse-engineering

A player finishes today's puzzle and, without thinking, pastes this into a
group chat:

```
Chartle #142 🟩 3/6
🟥🟨🟩
📈 Guessed in 3 — streak 11
chartle.app
```

A friend sees it, feels the itch ("3/6? I can do better"), taps the link, plays
the **same** puzzle (because it is the same for everyone until midnight UTC),
posts their own grid, and the loop closes. No account required to play. No
data lost between days. One puzzle, one planet, one reset.

**Everything in this document exists to make that paragraph happen.** If a
feature does not increase the probability that the grid above gets posted,
clicked, or replayed, it is out of scope for v1.

---

## 1. Problem & opportunity

The "one shareable puzzle per day" format (Wordle, Connections, Worldle,
Framed) proved that a *daily reset + a spoiler-free shareable score* is a
self-propelling growth engine. The format has been cloned to death in
**words**, but barely touched in **finance**, a domain with:

- A huge, opinionated, chronically-online audience (FinTwit, r/wallstreetbets,
  trading Discords) that already shares charts compulsively.
- Endless free public data (decades of price history across thousands of
  tickers) — effectively infinite puzzle supply.
- A built-in bragging dimension ("I called it") that words games lack.

**Opportunity:** own the daily ritual for markets the way Wordle owns words.

**Why now / why this repo:** the daily-reset + seeded-puzzle mechanic is a
*textbook* fit for an edge function — one deterministic function of the date
serves the identical puzzle to every player on Earth, cached until midnight,
with near-zero per-request cost.

---

## 2. North-star metric & guardrails

| Type | Metric | v1 target |
|---|---|---|
| **North star** | **D1 share-to-play conversion** = (new players who arrive from a shared result) ÷ (results shared) | ≥ 0.35 |
| Engagement | D7 retention (played ≥1 of last 7 days) | ≥ 25% |
| Loop health | Share rate = results shared ÷ games completed | ≥ 20% |
| Funnel | Completion rate = games completed ÷ games started | ≥ 70% |
| Guardrail | p75 time-to-interactive | < 2.0 s |
| Guardrail | Puzzle correctness/abuse complaints | < 0.1% of plays |

The north star is deliberately the *loop* metric, not DAU. DAU is the output;
share-to-play is the lever.

---

## 3. Target users

1. **The FinTwit poster** — wants a daily flex and a reason to dunk on friends.
   Cares about streaks and difficulty bragging rights.
2. **The curious lurker** — doesn't trade, enjoyed Worldle/Framed, will play a
   chart game because it's *learnable* (hints teach you). Cares about hints and
   not feeling stupid.
3. **The commuter replayer** — 60-second daily habit. Cares about speed, zero
   friction, no login.

All three are served by the same loop; we do **not** gate play behind accounts.

---

## 4. The game (v1 — "Name That Asset")

Format chosen because it is the most *deductive* (Wordle-like reasoning), the
most *shareable* (a colored grid falls out naturally), and the most *learnable*
(progressive hints teach the lurker). The brief's two other ideas
("would you have bought?", logic-circuit, geo) are tracked in §10 as future
modes behind the same engine.

### 4.1 Core loop (one puzzle)

1. Player sees an **anonymized** price chart: one real asset, ~1 year of daily
   closes, **normalized to 100 at the start**, axes/labels/dates hidden. Only
   the *shape* is visible.
2. Player has **6 guesses**. Each guess is a ticker/asset picked from an
   autocomplete over the catalog (so spelling never blocks a correct answer).
3. After each **wrong** guess:
   - The guess row shows **dimension feedback** vs. the answer — for each of
     {asset class, sector, region, direction-over-window}: 🟩 exact match,
     🟨 related, ⬛ no match. This is the deduction signal.
   - One additional **progressive hint** unlocks (see 4.2).
4. **Win** on correct ticker; **lose** after 6 wrong. Either way → reveal the
   asset, its real name, and the de-anonymized chart, then the **share card**.

### 4.2 Progressive hints (unlock one per wrong guess)

| After wrong guess | Hint revealed |
|---|---|
| 1 | Asset class (Stock / ETF / Crypto / Commodity / FX / Index) |
| 2 | Region / exchange (e.g. US, Europe, Global) |
| 3 | Sector / category (e.g. Technology, Energy, Layer-1) |
| 4 | Net return over the shown window (e.g. "+38% over the period") |
| 5 | First character of the ticker |

Hints are *earned*, not free — using fewer guesses (and thus fewer hints) is
the skill ceiling that the poster brags about.

### 4.3 Scoring & the shared artifact (the whole point — see §0)

- Result is **N/6** (or **X/6** for a loss), plus a colored grid where each row
  is one guess rendered as its dimension-feedback squares, ending in 🟩 on a
  win.
- Share text is **spoiler-free** (no ticker, no chart) so it's safe to post
  before friends play. Includes puzzle number, score, streak, and the URL.
- "Share" copies to clipboard (and uses the Web Share API on mobile).

### 4.4 Stats & streaks (retention hooks, local-first)

Stored in `localStorage` (no account in v1): games played, win %, current
streak, max streak, guess-distribution histogram, last-played puzzle number.
Streak increments only on consecutive **calendar days** (UTC) and breaks on a
miss. Replays of an already-completed day show the saved result (no
double-counting, no re-rolling for a better grid).

---

## 5. Functional requirements

- **FR1 — One puzzle per UTC day, identical for everyone.** The puzzle is a
  pure function of the UTC date. No randomness per request, per user, per
  session.
- **FR2 — Anonymization.** The served chart must not leak the answer: no axis
  numbers, no dates, no ticker, normalized series, and (server-side) the
  asset identity is **not** included in the puzzle payload until the player has
  finished. (See §7.3 — answer is verified server-side / via hashed check.)
- **FR3 — Guessing.** Autocomplete over the full catalog; case-insensitive;
  accepts ticker or company name or known aliases.
- **FR4 — Feedback.** Per-guess dimension feedback + progressive hint unlock as
  in §4.
- **FR5 — Persistence.** Stats/streak/last-result persist locally and survive
  reload. Completing a day is idempotent.
- **FR6 — Sharing.** One-tap copy of the spoiler-free grid; Web Share API where
  available; OG image + meta so the link unfurls nicely.
- **FR7 — Countdown.** After finishing, show a live countdown to the next
  puzzle (next UTC midnight) to set the return appointment.
- **FR8 — Archive (post-v1 friendly).** Engine must support fetching puzzle
  number *n* (not only "today") so an archive can be added without rework.

## 6. Non-functional requirements

- **NFR1** Cold, no-login first interaction < 2 s on a mid mobile (guardrail).
- **NFR2** Works with JS only; no backend DB required for v1 (stats are local).
- **NFR3** Accessible: keyboard-playable, color feedback also encoded as
  letters/shapes (color-blind safe), prefers-reduced-motion respected,
  semantic landmarks, focus management on modal.
- **NFR4** Deterministic & testable: seed→puzzle and guess→score are pure
  functions with unit tests.
- **NFR5** Cheap: daily puzzle response cacheable at the edge until midnight.

---

## 7. Architecture

### 7.1 Shape

```
Browser (Next.js App Router client) ──fetch──▶ /api/puzzle?day=YYYY-MM-DD
                                                  (Edge Route Handler)
                                                       │
                          deterministic seed(day) ─────┤
                                                       ▼
                                        pick asset from catalog,
                                        window + normalize series,
                                        strip identity → puzzle JSON
                                                       │
                              Cache-Control: public, s-maxage until 00:00 UTC
```

- **Edge function (`app/api/puzzle/route.ts`, `runtime = "edge"`).** Given a
  day, computes `seed = hash(day)`, deterministically selects the asset and
  window, returns the **anonymized** series + the hints schedule + a salted
  hash of the answer (for client-side guess checking without leaking the
  answer) + the dimension metadata needed to score guesses. Sets
  `Cache-Control` so a CDN serves one identical response to everyone until the
  next UTC midnight. This is the "same seeded puzzle for everyone until
  midnight" requirement, realized.
- **Client.** Renders chart, manages guesses/hints/stats locally, scores
  guesses against the served dimension metadata, checks correctness against the
  salted answer hash.

### 7.2 Determinism / seeding

`seed(day)` = a stable string hash of the ISO date → seeds a small PRNG
(mulberry32). Asset index = `prng() * catalogLength`. Window start chosen
deterministically from the same stream. Same date ⇒ same puzzle, on server and
(if needed) client, forever. Puzzle number = days since `EPOCH` (the launch
date) so "#142" is stable.

### 7.3 Anti-cheat (pragmatic, not paranoid)

Casual players will not open devtools; motivated ones can always cheat a
client-rendered game. We aim to stop *accidental* spoilers and trivial peeking:

- The puzzle payload contains **no ticker/name** and no axis values.
- Correctness is checked against a **salted SHA-256 hash** of the answer that
  ships in the payload; the plaintext answer is only fetched on game-end via a
  separate `/api/reveal?day=...&done=1` style call (or simply revealed once the
  client has a matching hash / exhausted guesses). v1 keeps it simple: hash for
  checking, reveal endpoint for the de-anonymized truth.
- Dimension metadata (class/sector/region) for *the answer* is needed to score,
  so it ships — but it describes a category, not the identity, and many assets
  share categories, so it doesn't uniquely reveal the answer.

### 7.4 Data strategy (the one real constraint)

Puzzle quality = data quality. Two-tier:

- **Production / CI:** `scripts/fetch-data.mjs` pulls **real** daily closes from
  a free, key-less source (Stooq CSV; Yahoo chart JSON as fallback) for every
  asset in `data/assets.json`, writing `data/series.json`. Run in any
  environment with open network (it is *blocked in the Claude-on-web sandbox by
  network policy*, which is why a bundled set exists).
- **Demo / offline / this sandbox:** `scripts/build-data.mjs` generates a
  bundled `data/series.json` for the curated catalog. These demo series are
  **deterministically reconstructed from well-known public milestone prices**
  (e.g. BTC's 2021 peak and 2022 trough, the 2020 COVID crash + recovery, NVDA's
  2023–24 run) and are explicitly flagged `"approx": true`. They make the game
  fully playable offline; production replaces them with exact data via the
  fetch script. **We never present approximate series as exact.**

---

## 8. Visual & content direction

See `docs/IMAGE_PROMPTS.md` for the brand/asset prompts and the concrete style
guide (palette, type, spacing). Summary: dark "terminal-meets-Wordle" aesthetic,
one accent green for wins, monospaced numerals, the chart as the hero element.

---

## 9. Out of scope for v1

- Accounts, cloud-synced stats, leaderboards, friend graphs.
- Real-money anything, brokerage links, "is this financial advice" surfaces
  (it is **not**; a disclaimer ships in the footer).
- Native apps.
- Server-side persistence / database.

## 10. Future (same engine, new modes)

1. **"Would you have bought?"** — show chart to day *T*, player picks
   buy/hold/sell, reveal forward return, score by P&L. (Brief idea #1b.)
2. **Hard mode** — fewer hints, shorter window, intraday.
3. **Archive & calendar** — replay past puzzles (engine already supports `day`).
4. **Sectors/regions ladders**, weekly themed weeks (crypto week, commodities
   week), and the non-finance domains from the brief (logic-circuit, geo) as
   sibling apps on the same daily-seed + share-loop core.

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Data source blocked / rate-limited | Two-tier data (bundled fallback + multi-source fetch script); puzzle is precomputable and cacheable. |
| Chart shape uniquely fingerprints a ticker (too easy) | Normalize to 100, hide axes, randomize window; large catalog. |
| Client-side answer leak | Hash-checked answers, identity withheld until finish (§7.3). |
| "Is this financial advice?" | Explicit non-advice disclaimer; no real-money features; data is historical. |
| Mature-clone fatigue ("another -le game") | Differentiate on domain + learnability (hints teach), not novelty of format. |

## 12. Definition of done (v1)

- [ ] Deterministic daily puzzle served by an edge route, identical for all,
      cacheable until UTC midnight.
- [ ] Full play loop: chart → 6 guesses → dimension feedback + progressive
      hints → win/lose → reveal → share card → countdown.
- [ ] Local stats/streaks, idempotent day completion.
- [ ] Spoiler-free share text + OG image; copy + Web Share.
- [ ] Accessible & responsive; TTI guardrail met.
- [ ] Pure-function engine covered by unit tests; `next build` green.
- [ ] Two-tier data with a working bundled dataset and a real-data fetch script.
