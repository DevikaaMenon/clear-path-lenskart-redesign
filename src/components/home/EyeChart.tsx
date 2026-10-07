"use client";

import { forwardRef } from "react";
import { ringTicks } from "@/lib/frame-geometry";

/** The four questions of Clear Path, set like a wall eye chart (decorative; the steps carry the text). */
export const CHART_LINES = [
  { text: "WHAT FOR?", size: "clamp(1.9rem, 3.2vw, 3.3rem)", acuity: "6/60" },
  { text: "WHICH FIT?", size: "clamp(1.5rem, 2.4vw, 2.45rem)", acuity: "6/36" },
  { text: "WHAT COST?", size: "clamp(1.2rem, 1.8vw, 1.85rem)", acuity: "6/18" },
  { text: "WHAT NEXT?", size: "clamp(0.95rem, 1.3vw, 1.35rem)", acuity: "6/9" },
];

const Lines = ({ sharp }: { sharp: boolean }) => (
  <div className="flex flex-col items-center gap-9 px-10 py-14">
    {CHART_LINES.map((l, i) => (
      <div key={l.text} data-line={i} className="relative flex w-full items-center justify-center">
        <span className="num absolute left-4 text-xs text-muted">{i + 1}</span>
        <span
          className={`font-display font-semibold leading-none tracking-[0.14em] ${sharp ? "text-ink" : "text-muted"}`}
          style={{ fontSize: l.size, fontVariationSettings: '"opsz" 144, "SOFT" 0, "WONK" 0' }}
        >
          {l.text}
        </span>
        <span className="num absolute right-4 text-xs text-muted">{l.acuity}</span>
      </div>
    ))}
  </div>
);

/**
 * Two copies of the chart: a soft-focus copy, and a sharp copy revealed only
 * inside the moving lens (clip-path circle driven by --lx/--ly/--lr).
 */
export const EyeChart = forwardRef<HTMLDivElement, { activeLabel: string }>(function EyeChart({ activeLabel }, ref) {
  return (
    <div className="relative border border-ink bg-surface" aria-hidden="true">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="eyebrow">Chart CP-01</span>
        <span className="eyebrow">Read at 6 m</span>
      </div>
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{ ["--lx" as string]: "50%", ["--ly" as string]: "18%", ["--lr" as string]: "112px" }}
      >
        <div className="chart-soft select-none">
          <Lines sharp={false} />
        </div>
        <div className="chart-sharp absolute inset-0 select-none">
          <Lines sharp />
        </div>
        {/* Measuring lens */}
        <svg
          className="chart-lens pointer-events-none absolute"
          viewBox="0 0 200 200"
          style={{ left: "var(--lx)", top: "var(--ly)", width: "calc(var(--lr) * 2 + 28px)", height: "calc(var(--lr) * 2 + 28px)", transform: "translate(-50%, -50%)" }}
        >
          <circle cx="100" cy="100" r="86" fill="none" stroke="var(--c-ink)" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="93" fill="none" stroke="var(--c-ink)" strokeWidth="1" />
          {ringTicks(48, 100, 100, 93, 97).map((t) => {
            const long = t.i % 6 === 0;
            const l = long ? ringTicks(48, 100, 100, 93, 100)[t.i] : t;
            return <line key={t.i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="var(--c-ink)" strokeWidth={long ? 1.6 : 0.9} />;
          })}
          <path d="M100 8v10M100 182v10M8 100h10M182 100h10" stroke="var(--c-signal)" strokeWidth="2" />
        </svg>
      </div>
      <div className="flex items-center justify-between border-t border-line px-4 py-2">
        <span className="eyebrow">In focus</span>
        <span className="num text-sm font-semibold text-ink">{activeLabel}</span>
      </div>
    </div>
  );
});
