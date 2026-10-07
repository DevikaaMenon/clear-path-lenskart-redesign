"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { SHAPES } from "@/lib/taxonomy";
import { ShapeGlyph } from "../frames/ShapeGlyph";
import { Icon } from "../ui/Icon";

/**
 * Frames by shape. Each entry has a live text label and a descriptive link (U2, X9).
 * Restrained parallax: the glyph row drifts slightly against the labels to add depth.
 */
export function ShapeStrip({ counts, need }: { counts: Record<string, number>; need: string | null }) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    let revert: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !ref.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 834px)", () => {
        const glyphs = ref.current!.querySelectorAll("[data-glyph]");
        glyphs.forEach((g, i) => {
          gsap.fromTo(g, { y: 18 + (i % 3) * 8 }, { y: -10 - (i % 3) * 6, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true } });
        });
      });
      revert = () => mm.revert();
    })();
    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <section aria-labelledby="shapes-title" className="page mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-4">
        <h2 id="shapes-title" className="font-display text-4xl">Frames by shape</h2>
        <p className="max-w-[40ch] text-muted">Every shape below links to frames in that shape{need ? ", filtered to your need" : ""}.</p>
      </div>
      <ul ref={ref} className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
        {SHAPES.map((s) => (
          <li key={s.id} className="bg-paper">
            <Link
              href={`/shop?shape=${s.id}${need ? `&need=${need}` : ""}`}
              className="group flex h-full flex-col gap-4 p-5 transition-colors duration-micro hover:bg-surface md:p-6"
            >
              <span data-glyph className="block py-4">
                <ShapeGlyph shape={s.id} strokeWidth={1.6} className="h-14 w-28 text-ink transition-transform duration-page ease-click group-hover:scale-110 md:h-16 md:w-32" />
              </span>
              <span className="mt-auto">
                <span className="flex items-center gap-2 font-semibold">
                  Shop {s.label.toLowerCase()} frames
                  <Icon name="arrow-right" size={18} className="transition-transform duration-ui group-hover:translate-x-1" />
                </span>
                <span className="block text-sm text-muted">{s.helper}</span>
                <span className="num mt-1 block text-xs text-muted">{counts[s.id] ?? 0} frames</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
