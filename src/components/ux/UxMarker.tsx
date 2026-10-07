"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { changeById } from "@/lib/ux-changes";
import { useUxReview } from "./UxReviewProvider";

const CARD_W = 320;
const GAP = 6;

/**
 * "What changed" marker: a small numbered circle at the top corner of the changed
 * element. Place it inside a positioned (relative) parent:
 *
 *   <div className="relative"> ...element... <UxMarker id="home-trust" /> </div>
 *
 * Hover or keyboard focus opens the card; click pins it open until closed;
 * Escape closes it. The card is portalled to <body> so it is never clipped.
 * Hidden when "Show UX changes" is off or the change doesn't belong to this page.
 */
export function UxMarker({ id, corner = "tr", className = "" }: { id: string; corner?: "tr" | "tl"; className?: string }) {
  const change = changeById(id);
  const pathname = usePathname();
  const { enabled, openId, pinned, open, close, register } = useUxReview();
  const reduce = useReducedMotion();
  const btn = useRef<HTMLButtonElement | null>(null);
  const card = useRef<HTMLDivElement | null>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const visible = !!change && enabled && change.paths.includes(pathname);
  const isOpen = visible && openId === id;
  const cardId = `ux-card-${id}`;

  const setBtn = useCallback(
    (el: HTMLButtonElement | null) => {
      btn.current = el;
      register(id, el);
    },
    [id, register],
  );

  // Place the card below the marker, flipping above / clamping inside the viewport.
  const place = useCallback(() => {
    const b = btn.current?.getBoundingClientRect();
    if (!b) return;
    const h = card.current?.offsetHeight ?? 260;
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(CARD_W, vw - 16);
    let left = corner === "tl" ? b.left : b.right - w;
    left = Math.max(8, Math.min(left, vw - w - 8));
    let top = b.bottom + GAP;
    if (top + h > vh - 8 && b.top - GAP - h > 8) top = b.top - GAP - h;
    setPos({ top, left });
  }, [corner]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    place();
    const on = () => place();
    window.addEventListener("scroll", on, { passive: true, capture: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on, { capture: true });
      window.removeEventListener("resize", on);
    };
  }, [isOpen, place]);

  // Escape closes; a click outside closes a pinned card.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(id);
        btn.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btn.current?.contains(t) && !card.current?.contains(t)) close(id);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [isOpen, id, close]);

  if (!visible || !change) return null;

  const hoverOpen = () => {
    window.clearTimeout(hoverTimer.current);
    if (openId !== id) hoverTimer.current = window.setTimeout(() => open(id, false), 80);
  };
  const hoverClose = () => {
    window.clearTimeout(hoverTimer.current);
    if (!pinned) hoverTimer.current = window.setTimeout(() => close(id), 160);
  };

  const label = `UX change ${change.n}: ${change.title} (${change.issues.join(", ")})`;

  return (
    <>
      <button
        ref={setBtn}
        type="button"
        data-ux-marker={id}
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={isOpen ? cardId : undefined}
        aria-describedby={isOpen ? cardId : undefined}
        onClick={() => {
          window.clearTimeout(hoverTimer.current); // a pending hover must not undo the pin
          if (isOpen && pinned) close(id);
          else open(id, true);
        }}
        onFocus={() => !isOpen && open(id, false)}
        onBlur={(e) => {
          if (!pinned && !card.current?.contains(e.relatedTarget as Node)) close(id);
        }}
        onPointerEnter={(e) => e.pointerType === "mouse" && hoverOpen()}
        onPointerLeave={(e) => e.pointerType === "mouse" && hoverClose()}
        className={`ux-marker absolute z-[35] grid h-11 w-11 place-items-center ${corner === "tl" ? "-left-3.5 -top-3.5" : "-right-3.5 -top-3.5"} ${className}`}
      >
        <span
          aria-hidden="true"
          className={`grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-note text-[0.75rem] font-extrabold leading-none text-white shadow-[0_1px_3px_rgb(0_0_0/0.35)] transition-transform duration-micro ${isOpen ? "scale-110" : "hover:scale-110"}`}
        >
          {change.n}
        </span>
      </button>
      {mounted
        ? createPortal(
            <AnimatePresence>
              {isOpen ? (
                <motion.div
                  ref={card}
                  id={cardId}
                  role="dialog"
                  aria-modal="false"
                  aria-labelledby={`${cardId}-title`}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  onPointerEnter={() => window.clearTimeout(hoverTimer.current)}
                  onPointerLeave={(e) => e.pointerType === "mouse" && hoverClose()}
                  style={{ position: "fixed", top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: Math.min(CARD_W, typeof window !== "undefined" ? window.innerWidth - 16 : CARD_W) }}
                  className="z-[80] border-2 border-note bg-white p-4 text-left text-sm text-[#1a1a2e] shadow-[0_8px_24px_-8px_rgb(0_0_0/0.35)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p id={`${cardId}-title`} className="font-bold leading-snug">
                      <span className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full bg-note text-[0.6875rem] font-extrabold text-white" aria-hidden="true">{change.n}</span>
                      {change.title}
                    </p>
                    {pinned ? (
                      <button
                        type="button"
                        className="-mr-2 -mt-2 grid h-9 w-9 shrink-0 place-items-center text-lg leading-none text-[#555] hover:text-black"
                        aria-label="Close"
                        onClick={() => {
                          close(id);
                          btn.current?.focus();
                        }}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                  <dl className="mt-2 grid grid-cols-[4.75rem_1fr] gap-x-2 gap-y-1.5">
                    <dt className="font-bold text-note">Before</dt>
                    <dd>{change.before}</dd>
                    <dt className="font-bold text-note">After</dt>
                    <dd>{change.after}</dd>
                    <dt className="font-bold text-note">Why</dt>
                    <dd>{change.why}</dd>
                    <dt className="font-bold text-note">Issue ID</dt>
                    <dd className="font-bold">{change.issues.join(", ")}</dd>
                  </dl>
                  {!pinned ? <p className="mt-2 text-xs text-[#555]">Click the marker to keep this open.</p> : null}
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
