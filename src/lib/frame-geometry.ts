/**
 * Procedural lens outlines for every frame shape. Used by the SVG illustrations
 * (FrameIllustration, SizeDrawing) and by the 3D viewer, so both always agree.
 * Coordinates are in millimetres, origin at the lens centre, y pointing UP,
 * +x pointing towards the TEMPLE (outer side) of the lens.
 */
export type Pt = [number, number];

/** Round to 2 decimals so server- and client-rendered SVG match exactly (no hydration drift). */
export const r2 = (n: number) => Math.round(n * 100) / 100;

/** Points on a ring (tick marks), pre-rounded. */
export function ringTicks(n: number, cx: number, cy: number, r1: number, r2_: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x1: r2(cx + Math.cos(a) * r1), y1: r2(cy + Math.sin(a) * r1), x2: r2(cx + Math.cos(a) * r2_), y2: r2(cy + Math.sin(a) * r2_), i };
  });
}

/** Lens height as a fraction of lens width, per shape. */
export const HEIGHT_RATIO: Record<string, number> = {
  round: 0.94,
  oval: 0.72,
  rectangle: 0.6,
  square: 0.84,
  "cat-eye": 0.7,
  aviator: 0.86,
  wayfarer: 0.72,
  geometric: 0.86,
};

const sgn = (n: number) => (n < 0 ? -1 : 1);

function superellipse(w: number, h: number, e: number, n: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    pts.push([(w / 2) * sgn(c) * Math.abs(c) ** (2 / e), (h / 2) * sgn(s) * Math.abs(s) ** (2 / e)]);
  }
  return pts;
}

function polygon(vertices: Pt[], n: number): Pt[] {
  // Resample a closed polygon evenly by perimeter.
  const segs = vertices.map((v, i) => [v, vertices[(i + 1) % vertices.length]] as [Pt, Pt]);
  const lens = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const total = lens.reduce((x, y) => x + y, 0);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    let d = (i / n) * total;
    let k = 0;
    while (d > lens[k]) { d -= lens[k]; k++; }
    const [a, b] = segs[k];
    const f = d / lens[k];
    pts.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  return pts;
}

export function lensOutline(shape: string, widthMm: number, n = 96): Pt[] {
  const w = widthMm;
  const h = widthMm * (HEIGHT_RATIO[shape] ?? 0.8);
  switch (shape) {
    case "round":
      return superellipse(w, h, 2, n);
    case "oval":
      return superellipse(w, h, 2.3, n);
    case "rectangle":
      return superellipse(w, h, 5, n);
    case "square":
      return superellipse(w, h, 4.2, n);
    case "wayfarer":
      // Trapezoid: wider at the top, with the outer top corner pushed up and out.
      return superellipse(w, h, 4.5, n).map(([x, y]) => {
        const ty = y / (h / 2); // -1..1
        const nx = x * (1 + 0.1 * ty);
        const lift = x > 0 && y > 0 ? 0.08 * h * (x / (w / 2)) ** 2 : 0;
        return [nx, y + lift] as Pt;
      });
    case "cat-eye":
      return superellipse(w, h, 3, n).map(([x, y]) => {
        const fx = Math.max(0, x / (w / 2));
        const lift = y > 0 ? 0.32 * h * fx ** 3 : -0.08 * h * fx ** 2 * (y / (h / 2));
        return [x * (1 + 0.04 * fx), y + lift] as Pt;
      });
    case "aviator":
      // Teardrop: flat-ish brow, bottom bulges towards the nose.
      return superellipse(w, h, 2.4, n).map(([x, y]) => {
        const ty = y / (h / 2);
        const brow = y > 0 ? -0.12 * h * ty ** 2 * (1 - Math.abs(x) / w) : 0;
        const pull = y < 0 ? -0.14 * w * ty ** 2 : 0; // towards the nose (-x)
        return [x + pull * (1 - x / w), y + brow] as Pt;
      });
    case "geometric": {
      const r = w / 2, k = h / 2;
      const verts: Pt[] = [
        [r, 0.1 * k], [0.55 * r, k], [-0.55 * r, k], [-r, 0.1 * k], [-0.6 * r, -k], [0.6 * r, -k],
      ];
      return polygon(verts, n);
    }
    default:
      return superellipse(w, h, 2.6, n);
  }
}

/** Bounding box of an outline. */
export function bounds(pts: Pt[]) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

/** Closed SVG path for points, in SVG space (y down), scaled and offset. */
export function toPath(pts: Pt[], scale: number, ox: number, oy: number, mirror = false): string {
  return (
    pts
      .map(([x, y], i) => {
        const px = ox + (mirror ? -x : x) * scale;
        const py = oy - y * scale;
        return `${i === 0 ? "M" : "L"}${px.toFixed(2)} ${py.toFixed(2)}`;
      })
      .join("") + "Z"
  );
}

/** Open path for the top part of an outline only (half-rim frames). */
export function topArcPath(pts: Pt[], scale: number, ox: number, oy: number, mirror = false, cutoff = -0.05): string {
  const b = bounds(pts);
  const yCut = b.minY + (b.maxY - b.minY) * (0.5 + cutoff);
  // Rotate the point list so we start at the first point below the cut on the right side.
  const idx = pts.findIndex(([x, y]) => x > 0 && y < yCut);
  const start = idx < 0 ? 0 : idx;
  const rot = [...pts.slice(start), ...pts.slice(0, start)];
  const top = rot.filter(([, y]) => y >= yCut);
  return top
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${(ox + (mirror ? -x : x) * scale).toFixed(2)} ${(oy - y * scale).toFixed(2)}`)
    .join("");
}
