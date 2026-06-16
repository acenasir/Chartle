import type { Metadata, Viewport } from "next";

import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chartle.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Chartle — the daily markets puzzle",
  description:
    "Guess the anonymized chart in six tries. One puzzle a day, the same for everyone, resetting at midnight UTC. Share your streak.",
  applicationName: "Chartle",
  keywords: [
    "chartle",
    "daily puzzle",
    "stock chart game",
    "wordle for stocks",
    "markets game",
  ],
  openGraph: {
    title: "Chartle — the daily markets puzzle",
    description: "Guess the chart. One a day. Share your streak.",
    url: SITE,
    siteName: "Chartle",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chartle — the daily markets puzzle",
    description: "Guess the chart. One a day. Share your streak.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0E11",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
