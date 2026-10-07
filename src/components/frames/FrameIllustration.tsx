/**
 * Original procedural product imagery. Each frame is drawn from its own data
 * (shape, rim style, material, colour and real measurements) at a fixed
 * 2.6 px per mm, so sizes are comparable across cards and the compare view.
 */
import { bounds, lensOutline, r2, toPath, topArcPath } from "@/lib/frame-geometry";
import type { Colour } from "@/lib/catalogue";

export const PX_PER_MM = 2.6;
export const VB_W = 420;
export const VB_H = 190;

export type Tint = "clear" | "computer" | "sun" | "reading" | "prescription" | "zero-power";

const TINTS: Record<Tint, { fill: string; opacity: number }> = {
  clear: { fill: "#cfe0e6", opacity: 0.22 },
  prescription: { fill: "#cfe0e6", opacity: 0.22 },
  reading: { fill: "#e8dfc6", opacity: 0.22 },
  "zero-power": { fill: "#cfe0e6", opacity: 0.18 },
  computer: { fill: "#a8b9e8", opacity: 0.3 },
  sun: { fill: "#2a2f33", opacity: 0.82 },
};

const RIM_WEIGHT: Record<string, number> = { acetate: 6.4, tr90: 5.2, metal: 2.2, titanium: 1.8 };

export interface FrameGeom {
  shape: string;
  frameType: string;
  material: string;
  lensWidthMm: number;
  bridgeMm: number;
}

/** Layout maths shared with the size drawing. */
export function layoutFrame(g: FrameGeom) {
  const s = PX_PER_MM;
  const pts = lensOutline(g.shape, g.lensWidthMm);
  const b = bounds(pts);
  const cy = VB_H / 2 + 4;
  // Inner edge of each lens sits half a bridge away from centre.
  const rcx = VB_W / 2 + (g.bridgeMm / 2) * s - b.minX * s; // right lens (image right)
  const lcx = VB_W / 2 - (g.bridgeMm / 2) * s + b.minX * s; // left lens (mirrored)
  return { s, pts, b, cy, rcx, lcx };
}

export function FrameIllustration({
  frame, colour, tint = "clear", className = "", title, decorative = false, nested = false,
}: {
  /** Render inside another SVG at 0,0 with the native viewBox size. */
  nested?: boolean;
  frame: FrameGeom;
  colour: Colour;
  tint?: Tint;
  className?: string;
  /** Descriptive alt text. Required unless decorative. */
  title?: string;
  decorative?: boolean;
}) {
  // Deterministic ids: identical frames produce identical defs, so sharing an id is safe,
  // and server/client markup always matches.
  const uid = `${frame.shape}-${frame.frameType}-${frame.lensWidthMm}-${frame.bridgeMm}-${colour.rim.slice(1)}-${colour.temple.slice(1)}`;
  const L = layoutFrame(frame);
  const { s, pts, b, cy } = L;
  const rcx = r2(L.rcx), lcx = r2(L.lcx);
  const weight = RIM_WEIGHT[frame.material] ?? 4;
  const isMetalLike = frame.material === "metal" || frame.material === "titanium";
  const right = toPath(pts, s, rcx, cy, false);
  const left = toPath(pts, s, lcx, cy, true);
  const t = TINTS[tint];
  const pattern = colour.pattern === "tortoise" ? `url(#tort-${uid})` : colour.rim;
  const rimOpacity = colour.pattern === "clear" ? 0.55 : 1;

  // Bridge anchor points: inner edge, a third of the way down from the top.
  const yBridge = r2(cy - b.maxY * s * 0.42);
  const rIn = r2(rcx + b.minX * s);
  const lIn = r2(lcx - b.minX * s);
  const yBar = r2(cy - b.maxY * s * 0.88);
  // Outer top corners for hinges.
  const topOuter = (cx: number, dir: 1 | -1) => {
    const p = pts.reduce((best, q) => (q[0] * 0.8 + q[1] > best[0] * 0.8 + best[1] ? q : best), pts[0]);
    return [r2(cx + dir * p[0] * s), r2(cy - p[1] * s)] as const;
  };
  const [rhx, rhy] = topOuter(rcx, 1);
  const [lhx, lhy] = topOuter(lcx, -1);
  const hinge = r2(Math.max(10, weight * 2.2));

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      {...(nested ? { x: 0, y: 0, width: VB_W, height: VB_H } : {})}
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id={`tort-${uid}`} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
          <rect width="34" height="34" fill={colour.rim} />
          <ellipse cx="8" cy="9" rx="7" ry="4" fill={colour.temple} opacity="0.9" />
          <ellipse cx="25" cy="22" rx="6" ry="3.4" fill="#2a160a" opacity="0.55" />
          <ellipse cx="20" cy="6" rx="3" ry="1.8" fill="#e0a35a" opacity="0.5" />
          <ellipse cx="6" cy="27" rx="3.5" ry="2" fill="#e0a35a" opacity="0.35" />
        </pattern>
        <clipPath id={`lens-${uid}`}>
          <path d={right} />
          <path d={left} />
        </clipPath>
      </defs>

      {/* Lenses */}
      <g>
        <path d={right} fill={t.fill} fillOpacity={t.opacity} />
        <path d={left} fill={t.fill} fillOpacity={t.opacity} />
        {/* Reflection streaks, clipped to the lens shape */}
        <g clipPath={`url(#lens-${uid})`} opacity={tint === "sun" ? 0.28 : 0.55}>
          <path d={`M${lcx - 60} ${cy + 60} L${lcx + 10} ${cy - 70} L${lcx + 26} ${cy - 70} L${lcx - 44} ${cy + 60}Z`} fill="#ffffff" />
          <path d={`M${rcx - 60} ${cy + 60} L${rcx + 10} ${cy - 70} L${rcx + 26} ${cy - 70} L${rcx - 44} ${cy + 60}Z`} fill="#ffffff" />
        </g>
      </g>

      {/* Rims */}
      {frame.frameType === "full-rim" ? (
        <g fill="none" stroke={pattern} strokeWidth={weight} strokeLinejoin="round" opacity={rimOpacity}>
          <path d={right} />
          <path d={left} />
        </g>
      ) : frame.frameType === "half-rim" ? (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={right} stroke="#7a8590" strokeWidth={0.9} opacity={0.6} />
          <path d={left} stroke="#7a8590" strokeWidth={0.9} opacity={0.6} />
          <path d={topArcPath(pts, s, rcx, cy, false)} stroke={pattern} strokeWidth={Math.max(weight, 3.4) * 1.2} />
          <path d={topArcPath(pts, s, lcx, cy, true)} stroke={pattern} strokeWidth={Math.max(weight, 3.4) * 1.2} />
        </g>
      ) : (
        <g fill="none" stroke="#5c6670" strokeWidth={0.9} opacity={0.55}>
          <path d={right} />
          <path d={left} />
        </g>
      )}

      {/* Bridge */}
      <g fill="none" stroke={pattern} strokeLinecap="round" opacity={rimOpacity}>
        <path
          d={`M${lIn - (frame.frameType === "rimless" ? 2 : 0)} ${yBridge} Q${VB_W / 2} ${yBridge - (isMetalLike ? 7 : 4)} ${rIn + (frame.frameType === "rimless" ? 2 : 0)} ${yBridge}`}
          strokeWidth={isMetalLike || frame.frameType === "rimless" ? 2.4 : weight * 0.95}
        />
        {frame.shape === "aviator" && isMetalLike ? (
          <path d={`M${lIn - 4} ${yBar} L${rIn + 4} ${yBar}`} strokeWidth={2.2} />
        ) : null}
      </g>

      {/* Nose pads (metal and rimless frames) */}
      {isMetalLike || frame.frameType === "rimless" ? (
        <g fill="#e7eef0" stroke="#8a949c" strokeWidth={0.8} opacity={0.9}>
          <ellipse cx={lIn - 3} cy={yBridge + 22} rx={3.2} ry={6} />
          <ellipse cx={rIn + 3} cy={yBridge + 22} rx={3.2} ry={6} />
        </g>
      ) : null}

      {/* Hinges and temple stubs */}
      <g stroke={colour.temple} strokeLinecap="round" opacity={rimOpacity}>
        <path d={`M${rhx - 2} ${rhy + 4} L${rhx + hinge} ${rhy + 2}`} strokeWidth={Math.max(weight * 0.9, 3)} />
        <path d={`M${lhx + 2} ${lhy + 4} L${lhx - hinge} ${lhy + 2}`} strokeWidth={Math.max(weight * 0.9, 3)} />
      </g>
    </svg>
  );
}

/** Descriptive alt text from data (X9): never a file name. */
export function frameAlt(p: { name: string; shape: string; material: string; frameType: string }, colourName: string) {
  const mat = p.material === "tr90" ? "flexible plastic" : p.material;
  return `Front view of ${p.name}: a ${colourName.toLowerCase()} ${mat} ${p.shape.replace("-", " ")} frame, ${p.frameType.replace("-", " ")}`;
}
