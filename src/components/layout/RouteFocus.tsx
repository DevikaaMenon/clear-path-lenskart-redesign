"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Focus management on client-side route changes: moves focus to the page's <h1>
 * (or <main>) and announces the new page title, so keyboard and screen-reader
 * users know the page changed. Skipped on the first load.
 */
export function RouteFocus() {
  const pathname = usePathname();
  const first = useRef(true);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      // If the user has already moved focus into the new page (e.g. an error summary
      // after a quick submit), don't take it away.
      const active = document.activeElement;
      if (active && active !== document.body && document.getElementById("main")?.contains(active)) {
        setMsg(document.title);
        return;
      }
      const h1 = document.querySelector<HTMLElement>("main h1");
      const target = h1 ?? document.getElementById("main");
      if (target) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
      setMsg(document.title);
    }, 80);
    return () => window.clearTimeout(t);
  }, [pathname]);
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {msg}
    </p>
  );
}
