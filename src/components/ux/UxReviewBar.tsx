"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { changesForPath } from "@/lib/ux-changes";
import { Drawer } from "../ui/Drawer";
import { useUxReview } from "./UxReviewProvider";

/**
 * Slim bar at the very top: "Show UX changes" switch and the
 * "Changes on this page" panel. Uses the annotation colour, not the brand blue,
 * so it reads as a review tool rather than part of the product.
 */
export function UxReviewBar() {
  const pathname = usePathname();
  const { enabled, setEnabled, open, elementFor } = useUxReview();
  const [panel, setPanel] = useState(false);
  // Markers whose element isn't shown at this screen width (e.g. desktop-only navigation).
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const openPanel = () => {
    setHiddenIds(new Set(changes.filter((c) => { const el = elementFor(c.id); return enabled && (!el || el.getClientRects().length === 0); }).map((c) => c.id)));
    setPanel(true);
  };
  const changes = changesForPath(pathname);

  const goTo = (id: string) => {
    setPanel(false);
    if (!enabled) setEnabled(true);
    // Wait for the drawer to close (it restores focus) and markers to render, then jump.
    window.setTimeout(() => {
      const el = elementFor(id);
      if (!el || el.getClientRects().length === 0) return; // not on screen right now (noted in the panel)
      el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      el.focus({ preventScroll: true });
      open(id, true);
    }, 380);
  };

  return (
    <div className="border-b border-note/30 bg-note-soft text-[0.8125rem] text-[#5c0a2c]" role="region" aria-label="UX review">
      <div className="page flex min-h-[34px] flex-wrap items-center gap-x-4 gap-y-0.5 py-0.5">
        <span className="font-bold">UX review</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className="flex min-h-[32px] items-center gap-2 font-semibold"
          data-testid="ux-toggle"
        >
          <span className={`relative h-5 w-9 rounded-full border-2 border-note transition-colors ${enabled ? "bg-note" : "bg-white"}`} aria-hidden="true">
            <span className={`absolute top-0.5 h-3 w-3 rounded-full transition-[left] duration-micro ${enabled ? "left-[18px] bg-white" : "left-0.5 bg-note"}`} />
          </span>
          Show UX changes
        </button>
        <button
          type="button"
          onClick={openPanel}
          disabled={!changes.length}
          className="min-h-[32px] font-semibold underline underline-offset-4 hover:decoration-2 disabled:no-underline disabled:opacity-60"
          aria-haspopup="dialog"
        >
          Changes on this page ({changes.length})
        </button>
      </div>
      <Drawer open={panel} onClose={() => setPanel(false)} title="Changes on this page" description="Every place on this page where the redesign improves on the original website. Select one to jump to its marker.">
        <ol className="flex flex-col gap-2">
          {changes.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => goTo(c.id)}
                className="flex w-full items-start gap-3 border border-line-strong p-3 text-left transition-colors hover:border-note hover:bg-note-soft"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-note text-xs font-extrabold text-white" aria-hidden="true">{c.n}</span>
                <span>
                  <span className="block font-semibold">{c.title}</span>
                  <span className="block text-sm text-muted">{c.issues.join(", ")} · {c.why.split(":")[0]}</span>
                  {hiddenIds.has(c.id) ? <span className="block text-sm font-semibold text-note">{c.hiddenNote ?? "Not visible on screen right now."}</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Drawer>
    </div>
  );
}
