"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { Icon } from "./Icon";

/** Disclosure section with a button header (WAI-ARIA accordion pattern). */
export function AccordionItem({
  title, summary, open, onToggle, children, status, disabled, headingLevel = 3,
}: {
  title: React.ReactNode;
  summary?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  status?: "done" | "error" | null;
  disabled?: boolean;
  headingLevel?: 2 | 3 | 4;
}) {
  const id = useId();
  const reduce = useReducedMotion();
  const H = `h${headingLevel}` as "h3";
  return (
    <div className={`border-b border-line ${open ? "bg-surface" : ""}`}>
      <H className="font-sans text-base">
        <button
          id={`${id}-btn`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          disabled={disabled}
          onClick={onToggle}
          className="group flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-micro hover:bg-sunk disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
        >
          {status === "done" ? (
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
              <Icon name="check" size={14} />
              <span className="sr-only">Completed:</span>
            </span>
          ) : status === "error" ? (
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-danger text-white">
              <Icon name="alert" size={14} />
              <span className="sr-only">Needs attention:</span>
            </span>
          ) : null}
          <span className="flex-1">
            <span className="block text-lg font-bold">{title}</span>
            {!open && summary ? <span className="block text-sm text-muted">{summary}</span> : null}
          </span>
          <Icon name="chevron-down" size={22} className={`shrink-0 transition-transform duration-ui ease-settle ${open ? "rotate-180" : ""}`} />
        </button>
      </H>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-btn`}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
