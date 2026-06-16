# Chartle — Image Prompts & Visual Style Guide

This file is the **visual half of the reverse-prompt approach**: before any
pixels exist, we write the prompts that define them, and a style guide concrete
enough that code can implement it directly. The hex values and type choices
below are the same ones wired into `tailwind.config.ts` and `app/globals.css`.

---

## 1. Brand in one line

> **Chartle** — the daily markets puzzle. A Bloomberg-terminal calm meets the
> friendly satisfaction of a Wordle grid. The chart is always the hero.

Tone: confident, dry, a little insidery, never hype-y. Dark by default.

---

## 2. Style guide (authoritative — code follows this)

### Palette

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0B0E11` | App background (near-black, faint blue) |
| `surface` | `#151A21` | Cards, panels, modal |
| `surface-2` | `#1E252E` | Inputs, hover rows |
| `border` | `#2A323D` | Hairlines, dividers |
| `text` | `#E6EDF3` | Primary text |
| `muted` | `#8B98A5` | Secondary text, labels |
| `up` / `correct` | `#3FB950` | Wins, gains, 🟩 exact match |
| `near` | `#D9A441` | 🟨 related / partial match |
| `down` | `#F0506E` | Losses, drawdowns |
| `accent` | `#4C9AFF` | Links, focus ring, interactive |

Color is **never** the only signal (color-blind safety): exact/related/none are
also letters/shapes in the grid (▣ / ◪ / ☐) and labels in the UI.

### Type

- **UI / body:** Inter (system fallback: `ui-sans-serif, system-ui`).
- **Numerals, ticker, score, countdown:** a monospace — `ui-monospace,
  "JetBrains Mono", "SF Mono", Menlo, monospace`. Tabular figures everywhere a
  number can change (countdown, score, %).

### Shape & space

- Radius: `12px` cards, `8px` controls, `999px` pills.
- 8-pt spacing scale. Generous padding; the chart gets the most breathing room.
- One elevation only (subtle shadow on modal/cards); otherwise flat.
- Motion: 120–200ms ease-out; respect `prefers-reduced-motion`.

---

## 3. Image generation prompts

Each prompt is written for a modern text-to-image model (Midjourney / SDXL /
Ideogram / DALL·E). Keep the palette above. Avoid real logos/tickers.

### 3.1 App icon / logo mark (square, 1024×1024)

```
A minimalist app icon for a daily stock-chart guessing game called "Chartle".
A single bold upward-then-jagged line chart drawn as one continuous stroke,
bright green (#3FB950), on a near-black background (#0B0E11) with a faint
square grid. The line subtly forms or sits beside a lowercase "c". Flat vector,
crisp 2px stroke, generous padding, rounded-square canvas, no text, no numbers,
no ticker symbols, high contrast, modern fintech, app-store ready.
```

### 3.2 Wordmark (horizontal lockup)

```
A horizontal logo lockup: the word "Chartle" in a clean geometric sans-serif,
off-white (#E6EDF3), with the dot of a small spark-line replacing nothing but
trailing off the final letter as a tiny green (#3FB950) upward tick. Dark
background #0B0E11. Vector, balanced kerning, fintech, minimal.
```

### 3.3 Open-Graph / social share image (1200×630)

```
Open-graph banner for "Chartle, the daily markets puzzle". Centered: a large
anonymized line chart in green and red on a dark #0B0E11 panel with faint grid,
axes hidden. Above it the wordmark "Chartle". Below it a small Wordle-style row
of squares (green, amber, dark-gray) and the tagline "Guess the chart. One a
day." Monospace numerals. Clean, high-contrast, lots of negative space, no real
ticker symbols. 1200x630.
```

### 3.4 Favicon (simplified mark, 64×64 and 32×32)

```
A 32px favicon: a single bright-green (#3FB950) upward zig-zag line chart on a
near-black rounded square (#0B0E11). Extremely simplified, 2–3 segments only,
readable at 16px, no text.
```

### 3.5 Win-state illustration (optional flourish)

```
A small celebratory spot illustration: a green upward chart line breaking
through a dashed "all-time-high" line, a couple of subtle confetti ticks in
green and amber, dark background #0B0E11, flat vector, minimal, joyful but
restrained.
```

### 3.6 Empty / loading state

```
A calm placeholder: a faint pulsing skeleton of a line chart, low-contrast
gray (#2A323D) on #0B0E11, no color accents, suggesting "loading today's
puzzle". Flat, minimal.
```

### 3.7 "How to play" diagram

```
A three-panel instructional illustration on dark #0B0E11: panel 1, an
anonymized green/red chart with hidden axes; panel 2, a guess row with three
squares colored green/amber/gray and a magnifying glance; panel 3, a phone
showing a shared score grid in a chat bubble. Flat vector, consistent 2px
strokes, monospace numerals, no real tickers.
```

---

## 4. What ships in-repo without an image model

So the app has real branding immediately, the following are committed as code,
built to this guide:

- `public/icon.svg` — the logo mark from 3.1 (hand-authored SVG).
- `public/favicon.svg` — the simplified mark from 3.4.
- `app/opengraph-image.tsx` — the OG image from 3.3, rendered at the edge with
  `next/og` (so it always reflects the current brand, no binary asset).

Replace these with model-generated raster assets later if desired; the prompts
above are the source of truth for that.
