"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";

/**
 * Shared-element page transitions using the View Transitions API.
 * The element you name (e.g. the lens on a need tile) morphs into the element with the
 * same view-transition-name on the next page (the lens in the listing header).
 * Falls back to a normal navigation when unsupported or when reduced motion is on.
 */
let pending: (() => void) | null = null;

function Bridge() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    if (!pending) return;
    const done = pending;
    pending = null;
    // Resolve on the next task. (requestAnimationFrame is paused while a view
    // transition is capturing, so waiting for a frame here would never resolve.)
    window.setTimeout(done, 0);
  }, [pathname, search]);
  return null;
}

export function ViewTransitionBridge() {
  return (
    <Suspense fallback={null}>
      <Bridge />
    </Suspense>
  );
}

type VT = { finished: Promise<void>; ready: Promise<void>; updateCallbackDone: Promise<void> };
type VTDocument = Document & { startViewTransition?: (cb: () => Promise<void> | void) => VT };

export function useTransitionNavigate() {
  const router = useRouter();
  return useCallback(
    (href: string, el?: HTMLElement | null, name = "need-lens") => {
      const doc = document as VTDocument;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!doc.startViewTransition || reduce) {
        router.push(href);
        return;
      }
      if (el) el.style.viewTransitionName = name;
      const t = doc.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            pending = resolve;
            router.push(href);
            // Never hang if the route is slow: resolving twice is harmless.
            window.setTimeout(() => {
              if (pending === resolve) pending = null;
              resolve();
            }, 1500);
          }),
      );
      // A skipped or aborted transition is not an error for the user: the navigation still happens.
      t.ready.catch(() => {});
      t.updateCallbackDone.catch(() => {});
      t.finished
        .catch(() => {})
        .finally(() => {
          if (el) el.style.viewTransitionName = "";
        });
    },
    [router],
  );
}
