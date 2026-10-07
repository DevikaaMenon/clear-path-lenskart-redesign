"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { formatINR, type PriceResult } from "@/lib/pricing";
import { RollingPrice } from "../ui/RollingNumber";
import { Icon } from "../ui/Icon";

/**
 * Live price breakdown: frame, lenses, coating, offer, total.
 * The line whose amount changed is briefly highlighted (system status).
 * The total is announced politely to screen readers after changes settle.
 */
export function PriceBreakdown({ result, title = "Your price", note }: { result: PriceResult; title?: string; note?: React.ReactNode }) {
  const reduce = useReducedMotion();
  const prev = useRef<Record<string, number>>({});
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [announce, setAnnounce] = useState("");

  const rows = [
    ...result.lines.map((l, i) => ({ key: `${l.id}-${i}`, label: l.label, amount: l.amount })),
    ...(result.discount ? [{ key: "offer", label: result.appliedOffer?.label ?? "Offer", amount: -result.discount }] : []),
  ];

  useEffect(() => {
    const now: Record<string, number> = {};
    const diff = new Set<string>();
    for (const r of rows) {
      now[r.key] = r.amount;
      if (prev.current[r.key] !== undefined && prev.current[r.key] !== r.amount) diff.add(r.key);
      if (prev.current[r.key] === undefined && Object.keys(prev.current).length) diff.add(r.key);
    }
    prev.current = now;
    if (diff.size) {
      setChanged(diff);
      const t = window.setTimeout(() => setChanged(new Set()), 1400);
      const a = window.setTimeout(() => setAnnounce(`Total now ${formatINR(result.total)}`), 500);
      return () => {
        window.clearTimeout(t);
        window.clearTimeout(a);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  return (
    <section aria-labelledby="price-title" className="border border-ink bg-surface">
      <h2 id="price-title" className="flex items-center justify-between border-b border-line px-4 py-3 font-sans text-base font-bold">
        {title}
        <span className="eyebrow">Updates as you choose</span>
      </h2>
      <dl className="px-4 py-2">
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <motion.div
              key={r.key}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex items-baseline justify-between gap-4 overflow-hidden py-1.5"
            >
              <dt className={r.key === "offer" ? "flex items-center gap-1.5 font-semibold text-success" : "text-ink"}>
                {/* Highlighter: positioned against the row (the motion.div), drawn behind the text */}
                {changed.has(r.key) && !reduce ? (
                  <motion.span
                    className="absolute inset-y-0.5 left-[-4px] right-[-4px] origin-left bg-highlight"
                    initial={{ scaleX: 0, opacity: 1 }}
                    animate={{ scaleX: 1, opacity: [1, 1, 0] }}
                    transition={{ scaleX: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 1.3, times: [0, 0.6, 1] } }}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative flex items-center gap-1.5">
                  {r.key === "offer" ? <Icon name="check" size={16} /> : null}
                  {r.label}
                </span>
              </dt>
              <dd className={`relative ${r.key === "offer" ? "font-semibold text-success" : ""}`}>
                {r.amount === 0 ? <span className="num">Included</span> : <RollingPrice value={r.amount < 0 ? -r.amount : r.amount} prefix={r.amount < 0 ? "−" : ""} />}
              </dd>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="flex items-baseline justify-between py-1.5 text-muted">
          <dt>Shipping</dt>
          <dd className="num">Free</dd>
        </div>
      </dl>
      <div className="flex items-baseline justify-between border-t border-ink px-4 py-3">
        <span className="font-bold">Total</span>
        <span className="text-2xl font-bold" data-testid="price-total">
          <RollingPrice value={result.total} />
        </span>
      </div>
      <p className="flex gap-2 border-t border-line px-4 py-3 text-sm text-muted">
        <Icon name="info" size={18} className="mt-0.5 shrink-0 text-accent" />
        <span>{result.explanation}</span>
      </p>
      {note ? <div className="border-t border-line px-4 py-3 text-sm">{note}</div> : null}
      <p className="sr-only" aria-live="polite" aria-atomic="true">{announce}</p>
    </section>
  );
}
