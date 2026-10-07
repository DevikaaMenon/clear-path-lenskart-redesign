import { lensOutline, toPath } from "@/lib/frame-geometry";

/** Small line drawing of a pair of lenses in a given shape (navigation, chips, finder). */
export function ShapeGlyph({ shape, className = "", strokeWidth = 2 }: { shape: string; className?: string; strokeWidth?: number }) {
  const pts = lensOutline(shape, 20, 48);
  const s = 1;
  return (
    <svg viewBox="0 0 56 28" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round">
      <path d={toPath(pts, s, 15, 14, true)} />
      <path d={toPath(pts, s, 41, 14, false)} />
      <path d="M25 11.5q3-2 6 0" strokeLinecap="round" />
    </svg>
  );
}
