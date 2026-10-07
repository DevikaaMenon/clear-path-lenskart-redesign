"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { formatINR } from "@/lib/pricing";
import { MAX_COMPARE, useShop } from "../providers/ShopProvider";
import { ShapeGlyph } from "../frames/ShapeGlyph";
import { Icon } from "../ui/Icon";

const HIDDEN_ON = ["/compare", "/checkout", "/order", "/design-system"];

/**
 * "Trial frame" compare tray (X4). Slides up when the first frame is added;
 * each frame drops into one of three lens-shaped slots. Bottom bar on mobile.
 */
export function CompareTray() {
  const { compare, removeCompare, clearCompare } = useShop();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visible = compare.length > 0 && !HIDDEN_ON.some((p) => pathname.startsWith(p));

  // Reserve space so the tray never covers the end of the page.
  useEffect(() => {
    const h = visible ? (ref.current?.offsetHeight ?? 88) + 16 : 0;
    document.body.style.paddingBottom = h ? `${h}px` : "";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [visible, expanded, compare.length]);

  const slots = Array.from({ length: MAX_COMPARE }, (_, i) => compare[i] ?? null);
  const canCompare = compare.length >= 2;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.aside
          ref={ref}
          aria-label="Compare tray"
          initial={reduce ? { opacity: 0 } : { y: "110%" }}
          animate={reduce ? { opacity: 1 } : { y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: "110%" }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="fixed inset-x-0 bottom-0 z-tray border-t border-ink bg-paper md:bottom-4 md:mx-auto md:w-[min(1080px,calc(100%-32px))] md:border md:shadow-lift"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              className="flex min-h-[44px] items-center gap-2 text-left md:pointer-events-none"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
            >
              <span className="num grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-bold text-paper">{compare.length}/{MAX_COMPARE}</span>
              <span className="leading-tight">
                <span className="block font-semibold">Compare frames</span>
                <span className="block text-sm text-muted" aria-live="polite">
                  {compare.length < 2 ? "Add one more to compare" : compare.length < MAX_COMPARE ? `${MAX_COMPARE - compare.length} slot left` : "Tray full"}
                </span>
              </span>
              <Icon name="chevron-up" size={20} className={`md:hidden transition-transform ${expanded ? "" : "rotate-180"}`} />
            </button>

            {/* Slots (always visible on desktop; expandable on mobile) */}
            <ul className="hidden flex-1 gap-2 md:flex" aria-label="Frames in tray">
              {slots.map((s, i) => (
                <Slot key={s?.id ?? `empty-${i}`} entry={s} onRemove={removeCompare} reduce={!!reduce} />
              ))}
            </ul>

            <div className="ml-auto flex items-center gap-1">
              <button className="hidden min-h-[44px] px-3 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline md:block" onClick={clearCompare}>
                Clear
              </button>
              <Link
                href="/compare"
                aria-disabled={!canCompare}
                onClick={(e) => !canCompare && e.preventDefault()}
                className={`inline-flex min-h-[44px] items-center gap-2 px-4 font-semibold transition-[transform,box-shadow] duration-micro ${
                  canCompare ? "bg-ink text-paper hover:bg-ink-2" : "cursor-not-allowed bg-line text-muted"
                }`}
              >
                Compare <Icon name="arrow-right" size={18} />
              </Link>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.ul
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="flex flex-col gap-2 overflow-hidden px-4 md:hidden"
                aria-label="Frames in tray"
              >
                {slots.map((s, i) => (
                  <Slot key={s?.id ?? `m-empty-${i}`} entry={s} onRemove={removeCompare} reduce={!!reduce} />
                ))}
                <li className="pb-3">
                  <button className="min-h-[44px] text-sm font-semibold text-muted underline underline-offset-4" onClick={clearCompare}>Clear tray</button>
                </li>
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function Slot({ entry, onRemove, reduce }: { entry: ReturnType<typeof useShop>["compare"][number] | null; onRemove: (id: string) => void; reduce: boolean }) {
  if (!entry) {
    return (
      <li className="flex min-h-[56px] flex-1 items-center gap-2 rounded-lens border border-dashed border-line-strong px-4 text-sm text-muted">
        <Icon name="plus" size={16} /> Empty slot
      </li>
    );
  }
  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { y: -28, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 24 }}
      className="flex min-h-[56px] min-w-0 flex-1 items-center gap-2 rounded-lens border border-ink bg-surface pl-3 pr-1"
    >
      <ShapeGlyph shape={entry.shape} className="h-5 w-10 shrink-0" />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-sm font-semibold">{entry.name}</span>
        <span className="num block text-xs text-muted">{formatINR(entry.price)}</span>
      </span>
      <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-sunk" aria-label={`Remove ${entry.name} from compare`} onClick={() => onRemove(entry.id)}>
        <Icon name="close" size={16} />
      </button>
    </motion.li>
  );
}
