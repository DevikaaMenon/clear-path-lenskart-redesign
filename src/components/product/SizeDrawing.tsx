"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Colour } from "@/lib/catalogue";
import { r2 } from "@/lib/frame-geometry";
import { FrameIllustration, layoutFrame, VB_H, VB_W } from "../frames/FrameIllustration";

/**
 * Technical drawing of the frame in the selected size, with dimension lines
 * for lens width, bridge and temple length. When the size changes, the frame
 * and the dimension lines move to the new measurements (X6, "dimension drawing").
 */
export function SizeDrawing({
  frame, colour, size, title,
}: {
  frame: { shape: string; frameType: string; material: string };
  colour: Colour;
  size: { label: string; lensWidthMm: number; bridgeMm: number; templeMm: number };
  title: string;
}) {
  const reduce = useReducedMotion();
  const g = { ...frame, lensWidthMm: size.lensWidthMm, bridgeMm: size.bridgeMm };
  const { s, b, cy, rcx } = layoutFrame(g);
  const lensL = r2(rcx + b.minX * s), lensR = r2(rcx + b.maxX * s);
  const top = r2(cy - b.maxY * s - 16);
  const bridgeL = r2(VB_W / 2 - (size.bridgeMm / 2) * s), bridgeR = r2(VB_W / 2 + (size.bridgeMm / 2) * s);
  const bridgeY = r2(cy - b.maxY * s * 0.42 + 40);
  const t = { duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] as const };
  const templePx = Math.min(360, size.templeMm * 2.1);
  const tx0 = r2((VB_W - templePx) / 2), tx1 = r2(tx0 + templePx);

  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${VB_W} ${VB_H + 70}`} className="w-full" role="img" aria-label={title}>
        <g>
          <FrameIllustration frame={g} colour={colour} decorative nested />
        </g>
        <g stroke="var(--c-signal)" strokeWidth="1.2" fill="none">
          {/* Lens width */}
          <motion.line initial={false} animate={{ x1: lensL, x2: lensR, y1: top, y2: top }} transition={t} />
          <motion.line initial={false} animate={{ x1: lensL, x2: lensL, y1: top - 6, y2: top + 6 }} transition={t} />
          <motion.line initial={false} animate={{ x1: lensR, x2: lensR, y1: top - 6, y2: top + 6 }} transition={t} />
          {/* Bridge */}
          <motion.line initial={false} animate={{ x1: bridgeL, x2: bridgeR, y1: bridgeY, y2: bridgeY }} transition={t} />
          <motion.line initial={false} animate={{ x1: bridgeL, x2: bridgeL, y1: bridgeY - 5, y2: bridgeY + 5 }} transition={t} />
          <motion.line initial={false} animate={{ x1: bridgeR, x2: bridgeR, y1: bridgeY - 5, y2: bridgeY + 5 }} transition={t} />
          {/* Temple length, drawn as a side-view rule under the frame */}
          <motion.path initial={false} animate={{ d: `M${tx0} ${VB_H + 40} L${tx1 - 24} ${VB_H + 40} Q${tx1} ${VB_H + 40} ${tx1} ${VB_H + 58}` }} transition={t} strokeWidth={2.4} stroke="var(--c-ink)" />
          <motion.line initial={false} animate={{ x1: tx0, x2: tx1, y1: VB_H + 26, y2: VB_H + 26 }} transition={t} />
        </g>
        <g className="num" fontSize="12" fill="var(--c-ink)" textAnchor="middle">
          <motion.text initial={false} animate={{ x: r2((lensL + lensR) / 2), y: top - 8 }} transition={t}>lens {size.lensWidthMm} mm</motion.text>
          <motion.text initial={false} animate={{ x: VB_W / 2, y: bridgeY + 18 }} transition={t}>bridge {size.bridgeMm}</motion.text>
          <motion.text initial={false} animate={{ x: VB_W / 2, y: VB_H + 20 }} transition={t}>temple {size.templeMm} mm</motion.text>
        </g>
      </svg>
      <figcaption className="num text-center text-sm text-muted">
        Size {size.label}: {size.lensWidthMm} □ {size.bridgeMm} · {size.templeMm}. These numbers are printed inside the temple of most glasses.
      </figcaption>
    </figure>
  );
}
