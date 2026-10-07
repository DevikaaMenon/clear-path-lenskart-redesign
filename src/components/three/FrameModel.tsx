"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { bounds, lensOutline, type Pt } from "@/lib/frame-geometry";

/** 1 scene unit = 10 mm. */
const U = 0.1;

function offset(pts: Pt[], d: number): Pt[] {
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const tx = b[0] - a[0], ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    return [p[0] + (ty / len) * d, p[1] - (tx / len) * d];
  });
}

const toShape = (pts: Pt[]) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x * U, y * U)));

export interface FrameModelProps {
  shape: string;
  frameType: string;
  material: string;
  lensWidthMm: number;
  bridgeMm: number;
  templeMm: number;
  rim: string;
  temple: string;
  lensTint: string;
  lensOpacity: number;
}

/**
 * Procedural frame: rims and lenses are extruded from the same outline as the
 * SVG illustrations; bridge and temples are tubes. Approximate by design.
 */
export function FrameModel(p: FrameModelProps) {
  const geo = useMemo(() => {
    const pts = lensOutline(p.shape, p.lensWidthMm, 120);
    const b = bounds(pts);
    const metal = p.material === "metal" || p.material === "titanium";
    const rimW = metal ? 1.1 : p.material === "tr90" ? 2.2 : 2.8; // mm
    const depth = (metal ? 1.4 : 4) * U;

    // Lens
    const lens = new THREE.ExtrudeGeometry(toShape(pts), { depth: 0.12, bevelEnabled: false, curveSegments: 1 });

    // Rim (full, half, or none)
    let rim: THREE.BufferGeometry | null = null;
    if (p.frameType === "full-rim") {
      const outer = toShape(offset(pts, rimW));
      outer.holes.push(new THREE.Path(offset(pts, -0.2).map(([x, y]) => new THREE.Vector2(x * U, y * U))));
      rim = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2, curveSegments: 1 });
    } else if (p.frameType === "half-rim") {
      const yCut = b.minY + b.h * 0.45;
      const top = pts.filter(([, y]) => y >= yCut).sort((a, c) => Math.atan2(c[1], c[0]) - Math.atan2(a[1], a[0]));
      const out = offset(pts, rimW * 1.3).filter(([, y]) => y >= yCut).sort((a, c) => Math.atan2(a[1], a[0]) - Math.atan2(c[1], c[0]));
      const poly = [...out, ...top];
      rim = new THREE.ExtrudeGeometry(toShape(poly), { depth, bevelEnabled: false, curveSegments: 1 });
    }

    // Lens centre offset so inner edges sit half a bridge from the middle.
    const cx = (p.bridgeMm / 2 - b.minX) * U;
    const innerTopY = b.maxY * 0.42 * U;
    const outerPt = pts.reduce((best, q) => (q[0] * 0.8 + q[1] > best[0] * 0.8 + best[1] ? q : best), pts[0]);

    // Bridge
    const bx = (p.bridgeMm / 2 + 0.5) * U;
    const bridge = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-bx, innerTopY, depth / 2),
        new THREE.Vector3(0, innerTopY + (metal ? 0.6 : 0.35), depth / 2 + 0.05),
        new THREE.Vector3(bx, innerTopY, depth / 2),
      ]),
      24, metal ? 0.07 : 0.17, 8, false,
    );

    // Temples: from hinge straight back, bending down behind the ear.
    const hx = cx + (outerPt[0] + rimW * 0.6) * U;
    const hy = outerPt[1] * U * 0.92;
    const t = p.templeMm * U;
    const templeCurve = (dir: 1 | -1) =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(dir * hx, hy, depth * 0.5),
        new THREE.Vector3(dir * (hx + 0.12), hy, -0.4),
        new THREE.Vector3(dir * (hx + 0.25), hy - 0.05, -t * 0.72),
        new THREE.Vector3(dir * (hx + 0.25), hy - 0.6, -t * 0.92),
        new THREE.Vector3(dir * (hx + 0.2), hy - 1.4, -t),
      ]);
    const templeR = metal ? 0.07 : 0.16;
    const templeL = new THREE.TubeGeometry(templeCurve(-1), 48, templeR, 8, false);
    const templeRgeo = new THREE.TubeGeometry(templeCurve(1), 48, templeR, 8, false);

    return { lens, rim, cx, depth, bridge, templeL, templeRgeo, metal };
  }, [p.shape, p.frameType, p.material, p.lensWidthMm, p.bridgeMm, p.templeMm]);

  const rimMat = (
    <meshStandardMaterial
      color={p.rim}
      roughness={geo.metal ? 0.28 : 0.42}
      metalness={geo.metal ? 0.85 : 0.05}
      side={THREE.DoubleSide}
    />
  );

  return (
    <group>
      {[1, -1].map((dir) => (
        <group key={dir} position={[dir * geo.cx, 0, 0]} scale={[dir, 1, 1]}>
          <mesh geometry={geo.lens} position={[0, 0, geo.depth * 0.4]}>
            <meshStandardMaterial color={p.lensTint} transparent opacity={p.lensOpacity} roughness={0.05} metalness={0.1} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {geo.rim ? <mesh geometry={geo.rim}>{rimMat}</mesh> : null}
        </group>
      ))}
      <mesh geometry={geo.bridge}>{rimMat}</mesh>
      <mesh geometry={geo.templeL}>
        <meshStandardMaterial color={p.temple} roughness={geo.metal ? 0.3 : 0.45} metalness={geo.metal ? 0.8 : 0.05} />
      </mesh>
      <mesh geometry={geo.templeRgeo}>
        <meshStandardMaterial color={p.temple} roughness={geo.metal ? 0.3 : 0.45} metalness={geo.metal ? 0.8 : 0.05} />
      </mesh>
    </group>
  );
}
