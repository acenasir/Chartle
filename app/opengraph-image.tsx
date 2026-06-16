// Dynamic Open-Graph card (docs/IMAGE_PROMPTS.md §3.3), rendered at the edge so
// the share link always unfurls with current branding — no binary asset.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Chartle — the daily markets puzzle";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const chartSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="320" viewBox="0 0 900 320">
  <polyline points="0,250 120,210 210,260 300,150 400,190 500,90 620,140 720,60 820,110 900,30"
    fill="none" stroke="#3FB950" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function OpengraphImage() {
  const chart = `data:image/svg+xml;base64,${btoa(chartSvg)}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0B0E11",
          padding: "64px",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#151A21",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
            }}
          >
            📈
          </div>
          <div style={{ color: "#E6EDF3", fontSize: 56, fontWeight: 700 }}>
            Chartle
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={chart} width={900} height={320} alt="" />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ color: "#8B98A5", fontSize: 34 }}>
            Guess the chart. One a day.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {["#3FB950", "#D9A441", "#2A323D", "#3FB950"].map((c, i) => (
              <div
                key={i}
                style={{ width: 40, height: 40, borderRadius: 8, background: c }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
