"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./Button";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal surface. side="right" (desktop drawers), "bottom" (mobile sheets), "center" (dialogs).
 * Traps focus, closes on Escape and backdrop click, returns focus to the trigger,
 * and makes the page behind inert.
 */
export function Drawer({
  open, onClose, title, description, side = "right", children, footer, wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: "right" | "bottom" | "center" | "left";
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement;
    const main = document.getElementById("app-root");
    main?.setAttribute("inert", "");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel.current)?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab" && panel.current) {
        const els = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      main?.removeAttribute("inert");
      document.body.style.overflow = prevOverflow;
      returnTo.current?.focus?.();
    };
  }, [open, onClose]);

  const from =
    side === "right" ? { x: "100%" } : side === "left" ? { x: "-100%" } : side === "bottom" ? { y: "100%" } : { y: 24, opacity: 0, scale: 0.98 };
  const to = side === "center" ? { y: 0, opacity: 1, scale: 1 } : { x: 0, y: 0 };

  const placement =
    side === "right"
      ? `right-0 top-0 h-full w-full ${wide ? "max-w-[720px]" : "max-w-[440px]"} border-l border-ink`
      : side === "left"
        ? "left-0 top-0 h-full w-full max-w-[400px] border-r border-ink"
        : side === "bottom"
          ? "bottom-0 left-0 right-0 max-h-[88vh] rounded-t-md border-t border-ink"
          : `relative w-full ${wide ? "max-w-[880px]" : "max-w-[560px]"} max-h-[88vh] border border-ink`;

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-overlay" key="drawer">
          <motion.div
            className="absolute inset-0 bg-[rgb(15_29_43/0.45)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.24 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <div className={side === "center" ? "pointer-events-none absolute inset-0 grid place-items-center p-4" : ""}>
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descId : undefined}
              tabIndex={-1}
              className={`pointer-events-auto flex flex-col bg-paper ${side === "center" ? "" : "absolute"} ${placement}`}
              initial={reduce ? { opacity: 0 } : from}
              animate={reduce ? { opacity: 1 } : to}
              exit={reduce ? { opacity: 0 } : from}
              transition={{ duration: reduce ? 0 : 0.36, ease: [0.22, 1, 0.36, 1] }}
            >
              {side === "bottom" ? <span className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong" aria-hidden="true" /> : null}
              <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                <div>
                  <h2 id={titleId} className="font-display text-2xl">{title}</h2>
                  {description ? <p id={descId} className="mt-1 text-sm text-muted">{description}</p> : null}
                </div>
                <IconButton icon="close" label={`Close ${title}`} onClick={onClose} />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
              {footer ? <div className="border-t border-line bg-surface px-5 py-4">{footer}</div> : null}
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
