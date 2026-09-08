import { useEffect, useState } from "react";

interface GaugeProps {
  label: string;
  value: number;
  baseline?: number;
  hue: "violet" | "cyan" | "amber";
}

const STROKE: Record<GaugeProps["hue"], string> = {
  violet: "var(--accent-violet)",
  cyan: "var(--accent-cyan)",
  amber: "var(--accent-amber)",
};

export function Gauge({ label, value, baseline, hue }: GaugeProps) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const r = 42;
  const c = 2 * Math.PI * r;
  const delta = baseline === undefined ? null : value - baseline;

  return (
    <div className="glass flex flex-col items-center rounded-2xl px-3 py-4">
      <div className="relative h-[104px] w-[104px]">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" stroke="var(--track)" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            stroke={STROKE[hue]}
            strokeDasharray={c}
            strokeDashoffset={c - (c * shown) / 100}
            style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium tracking-wide text-foreground/80">{label}</p>
      {delta !== null && (
        <p className="text-[11px] tabular-nums text-emerald-400">
          {delta >= 0 ? "+" : ""}
          {delta} vs original
        </p>
      )}
    </div>
  );
}
