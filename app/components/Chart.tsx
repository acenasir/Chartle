"use client";

import { useId } from "react";

interface ChartProps {
  data: number[];
  /** When true, color by direction and stop hiding the verdict. */
  revealed?: boolean;
  ticker?: string;
}

const VIEW_W = 100;
const VIEW_H = 56;
const PAD = 4;

function toPoints(data: number[]): { line: string; area: string; baselineY: number } {
  if (data.length < 2) return { line: "", area: "", baselineY: VIEW_H / 2 };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const x = (i: number) => (i / (data.length - 1)) * VIEW_W;
  const y = (v: number) =>
    PAD + (1 - (v - min) / span) * (VIEW_H - 2 * PAD);

  const pts = data.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`);
  const line = pts.join(" ");
  const area = `${x(0)},${VIEW_H} ${line} ${x(data.length - 1)},${VIEW_H}`;
  return { line, area, baselineY: y(data[0]) };
}

export default function Chart({ data, revealed = false, ticker }: ChartProps) {
  const id = useId().replace(/:/g, "");
  const { line, area, baselineY } = toPoints(data);
  const up = data.length > 1 && data[data.length - 1] >= data[0];
  const stroke = revealed ? (up ? "#3FB950" : "#F0506E") : "#E6EDF3";

  return (
    <div className="relative w-full rounded-card border border-border bg-surface p-3 sm:p-4">
      {revealed && ticker ? (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-bg/80 px-3 py-1 font-mono text-sm text-text animate-fade-in">
          {ticker}
        </div>
      ) : (
        <div className="absolute right-3 top-3 z-10 select-none rounded-full bg-bg/60 px-3 py-1 font-mono text-xs text-muted">
          ?
        </div>
      )}
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="h-48 w-full sm:h-64"
        role="img"
        aria-label={
          revealed
            ? `Price chart for ${ticker}`
            : "Anonymized price chart to identify"
        }
      >
        <defs>
          <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Faint baseline at the indexed-to-100 start, no numbers. */}
        <line
          x1="0"
          x2={VIEW_W}
          y1={baselineY}
          y2={baselineY}
          stroke="#2A323D"
          strokeWidth="0.3"
          strokeDasharray="1.5 1.5"
          vectorEffect="non-scaling-stroke"
        />

        <polygon points={area} fill={`url(#fill-${id})`} />
        <polyline
          className="chart-line"
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={100}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
