"use client";

import { forwardRef } from "react";
import { Icon } from "./Icon";

export interface SummaryItem {
  fieldId: string;
  message: string;
}

/**
 * Error summary at the top of a form. Receives focus on a failed submit and
 * lists each problem as a link that moves focus to the field (WCAG 3.3.1 / 3.3.3).
 */
export const ErrorSummary = forwardRef<HTMLDivElement, { title?: string; items: SummaryItem[]; id?: string }>(function ErrorSummary(
  { title = "Please fix the following", items, id = "error-summary" },
  ref,
) {
  if (!items.length) return null;
  return (
    <div ref={ref} id={id} tabIndex={-1} aria-labelledby={`${id}-title`} className="border-2 border-danger bg-danger-soft p-4">
      <h2 id={`${id}-title`} className="flex items-center gap-2 font-sans text-lg font-bold text-danger">
        <Icon name="alert" size={22} /> {title}
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((it) => (
          <li key={it.fieldId}>
            <a
              href={`#${it.fieldId}`}
              className="font-semibold text-danger underline underline-offset-4 hover:decoration-2"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(it.fieldId);
                el?.focus();
                el?.scrollIntoView({ block: "center" });
              }}
            >
              {it.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
});
