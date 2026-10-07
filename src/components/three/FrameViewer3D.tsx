"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useId, useRef, useState } from "react";
import type { Group } from "three";
import { FrameModel, type FrameModelProps } from "./FrameModel";
import { Icon } from "../ui/Icon";
import { LENS_TINTS, type LensTintId } from "./tints";

const STEP_Y = Math.PI / 12; // 15°
const STEP_X = Math.PI / 18; // 10°
const MAX_X = 0.6;

function Rig({ target, children }: { target: React.MutableRefObject<{ x: number; y: number }>; children: React.ReactNode }) {
  const g = useRef<Group>(null);
  const { invalidate } = useThree();
  useFrame((_, dt) => {
    if (!g.current) return;
    const k = 1 - Math.pow(0.0008, dt); // frame-rate independent easing
    g.current.rotation.y += (target.current.y - g.current.rotation.y) * k;
    g.current.rotation.x += (target.current.x - g.current.rotation.x) * k;
    const moving = Math.abs(target.current.y - g.current.rotation.y) > 0.0005 || Math.abs(target.current.x - g.current.rotation.x) > 0.0005;
    if (moving) invalidate(); // render on demand: no work when the frame is still
  });
  return <group ref={g}>{children}</group>;
}

function describe(y: number) {
  const deg = ((Math.round((y * 180) / Math.PI) % 360) + 360) % 360;
  if (deg < 20 || deg > 340) return "Front view";
  if (deg > 160 && deg < 200) return "Back view";
  if (deg >= 60 && deg <= 120) return "Left side view";
  if (deg >= 240 && deg <= 300) return "Right side view";
  return `Angled view, ${deg} degrees`;
}

/** Rotatable procedural 3D frame. Drag, arrow keys or buttons to rotate. */
export function FrameViewer3D({ model, tint, name }: { model: Omit<FrameModelProps, "lensTint" | "lensOpacity">; tint: LensTintId; name: string }) {
  const target = useRef({ x: 0.08, y: -0.5 });
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const [view, setView] = useState("Angled view");
  const [invalidator, setInvalidator] = useState<(() => void) | null>(null);
  const helpId = useId();
  const t = LENS_TINTS.find((x) => x.id === tint) ?? LENS_TINTS[0];

  const nudge = (dy: number, dx = 0) => {
    target.current.y += dy;
    target.current.x = Math.max(-MAX_X, Math.min(MAX_X, target.current.x + dx));
    setView(describe(target.current.y));
    invalidator?.();
  };
  const reset = (y = 0) => {
    target.current = { x: 0.04, y };
    setView(describe(y));
    invalidator?.();
  };

  // Gentle settle into the front view on open (skipped by reduced motion at the dialog level).
  useEffect(() => {
    const id = window.setTimeout(() => reset(-0.35), 250);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidator]);

  return (
    <div className="flex flex-col gap-3">
      <div
        role="application"
        aria-roledescription="3D viewer"
        aria-label={`3D preview of ${name}. ${view}.`}
        aria-describedby={helpId}
        tabIndex={0}
        className="relative aspect-[4/3] w-full cursor-grab touch-none select-none overflow-hidden border border-line bg-[radial-gradient(circle_at_50%_40%,#fffefb,#eae5d8)] active:cursor-grabbing"
        onKeyDown={(e) => {
          const map: Record<string, () => void> = {
            ArrowLeft: () => nudge(-STEP_Y),
            ArrowRight: () => nudge(STEP_Y),
            ArrowUp: () => nudge(0, -STEP_X),
            ArrowDown: () => nudge(0, STEP_X),
            Home: () => reset(0),
          };
          if (map[e.key]) {
            e.preventDefault();
            map[e.key]();
          }
        }}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        }}
        onPointerMove={(e) => {
          if (!drag.current || drag.current.id !== e.pointerId) return;
          const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
          drag.current = { ...drag.current, x: e.clientX, y: e.clientY };
          target.current.y += dx * 0.012;
          target.current.x = Math.max(-MAX_X, Math.min(MAX_X, target.current.x + dy * 0.008));
          invalidator?.();
        }}
        onPointerUp={() => {
          drag.current = null;
          setView(describe(target.current.y));
        }}
      >
        <Canvas
          frameloop="demand"
          dpr={[1, 2]}
          camera={{ position: [0, 0.6, 30], fov: 30 }}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          onCreated={({ invalidate }) => setInvalidator(() => invalidate)}
          aria-hidden="true"
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[6, 8, 10]} intensity={1.6} />
          <directionalLight position={[-8, -2, -6]} intensity={0.5} />
          <Rig target={target}>
            <FrameModel {...model} lensTint={t.color} lensOpacity={t.opacity} />
          </Rig>
        </Canvas>
        <p className="pointer-events-none absolute bottom-2 left-3 text-xs text-muted">3D preview, not exact</p>
      </div>
      <p id={helpId} className="sr-only">Use left and right arrow keys to turn the frame, up and down to tilt, Home to return to the front.</p>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Rotate the frame">
        <button className="flex min-h-[44px] items-center gap-1.5 border border-line-strong px-3 text-sm font-semibold hover:border-ink" onClick={() => nudge(-STEP_Y * 2)}>
          <Icon name="arrow-left" size={18} /> Turn left
        </button>
        <button className="flex min-h-[44px] items-center gap-1.5 border border-line-strong px-3 text-sm font-semibold hover:border-ink" onClick={() => nudge(STEP_Y * 2)}>
          Turn right <Icon name="arrow-right" size={18} />
        </button>
        <button className="min-h-[44px] border border-line-strong px-3 text-sm font-semibold hover:border-ink" onClick={() => reset(0)}>Front</button>
        <button className="min-h-[44px] border border-line-strong px-3 text-sm font-semibold hover:border-ink" onClick={() => reset(Math.PI / 2)}>Side</button>
        <span className="ml-auto text-sm text-muted" aria-live="polite">{view}</span>
      </div>
    </div>
  );
}

