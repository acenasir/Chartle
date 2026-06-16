import type { Config } from "tailwindcss";

// Palette is the authoritative one from docs/IMAGE_PROMPTS.md §2.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B0E11",
        surface: "#151A21",
        "surface-2": "#1E252E",
        border: "#2A323D",
        text: "#E6EDF3",
        muted: "#8B98A5",
        up: "#3FB950",
        correct: "#3FB950",
        near: "#D9A441",
        down: "#F0506E",
        accent: "#4C9AFF",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "JetBrains Mono",
          "SF Mono",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        card: "12px",
        control: "8px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop": {
          "0%": { transform: "scale(0.96)" },
          "60%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)" },
        },
        "draw": {
          "0%": { strokeDashoffset: "var(--len)" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out both",
        "pop": "pop 160ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
