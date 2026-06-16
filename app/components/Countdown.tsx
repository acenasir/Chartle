"use client";

import { useEffect, useState } from "react";

import { secondsUntilUtcMidnight } from "@/lib/seed";

function format(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function Countdown() {
  const [secs, setSecs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setSecs(secondsUntilUtcMidnight());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center">
      <div className="text-xs uppercase tracking-wide text-muted">
        Next puzzle in
      </div>
      <div className="font-mono text-2xl tabular-nums text-text" suppressHydrationWarning>
        {secs === null ? "--:--:--" : format(secs)}
      </div>
    </div>
  );
}
