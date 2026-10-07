"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useShop } from "../providers/ShopProvider";
import { Icon } from "./Icon";

/** Toast stack. Announced politely; never steals focus. Undo toasts stay 8s. */
export function Toasts() {
  const { toasts, dismissToast } = useShop();
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-toast flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40, transition: { duration: 0.18 } }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={`pointer-events-auto flex w-full max-w-[420px] items-start gap-3 border bg-surface px-4 py-3 shadow-lift ${t.tone === "danger" ? "border-danger" : "border-ink"}`}
          >
            {t.icon ? (
              <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${t.tone === "danger" ? "bg-danger-soft text-danger" : t.tone === "success" ? "bg-success-soft text-success" : "bg-sunk text-ink"}`}>
                <Icon name={t.icon} size={18} />
              </span>
            ) : null}
            <div className="min-w-0 flex-1 pt-1">
              <p className="font-semibold leading-snug">{t.title}</p>
              {t.body ? <p className="text-sm text-muted">{t.body}</p> : null}
            </div>
            {t.action ? (
              <button
                className="min-h-[44px] shrink-0 px-2 font-semibold text-accent underline underline-offset-4 hover:decoration-2"
                onClick={() => {
                  t.action!.onClick();
                  dismissToast(t.id);
                }}
              >
                {t.action.label}
              </button>
            ) : null}
            <button className="grid h-11 w-11 shrink-0 place-items-center text-muted hover:text-ink" aria-label="Dismiss notification" onClick={() => dismissToast(t.id)}>
              <Icon name="close" size={18} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
