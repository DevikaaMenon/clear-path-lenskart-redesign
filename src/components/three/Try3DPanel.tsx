"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Colour } from "@/lib/catalogue";
import { FrameIllustration, frameAlt, type Tint } from "../frames/FrameIllustration";
import { LENS_TINTS, prefersStatic3D, type LensTintId } from "./tints";

const FrameViewer3D = dynamic(() => import("./FrameViewer3D").then((m) => m.FrameViewer3D), {
  ssr: false,
  loading: () => (
    <div className="skeleton grid aspect-[4/3] w-full place-items-center border border-line" aria-label="Loading 3D preview">
      <span className="relative z-10 text-sm text-muted">Loading 3D preview…</span>
    </div>
  ),
});

const TINT_TO_SVG: Record<LensTintId, Tint> = { clear: "clear", blue: "computer", grey: "sun", brown: "sun" };

export interface Viewable {
  name: string;
  shape: string;
  frameType: string;
  material: string;
  lensWidthMm: number;
  bridgeMm: number;
  templeMm: number;
  colours: Colour[];
}

/** 3D viewer with lens-tint and colour controls and a static fallback (Section 7). */
export function Try3DPanel({
  product, colourIndex, onColourChange, initialTint = "clear",
}: {
  product: Viewable;
  colourIndex: number;
  onColourChange?: (i: number) => void;
  initialTint?: LensTintId;
}) {
  const [tint, setTint] = useState<LensTintId>(initialTint);
  const [mode, setMode] = useState<{ static: boolean; reason: string | null; canLoad: boolean } | null>(null);
  useEffect(() => setMode(prefersStatic3D()), []);
  const colour = product.colours[colourIndex] ?? product.colours[0];

  return (
    <div className="flex flex-col gap-4">
      {mode === null ? (
        <div className="skeleton aspect-[4/3] w-full border border-line" aria-hidden="true" />
      ) : mode.static ? (
        <div className="flex flex-col gap-2">
          <div className="relative aspect-[4/3] w-full border border-line bg-surface">
            <FrameIllustration frame={product} colour={colour} tint={TINT_TO_SVG[tint]} title={frameAlt(product, colour.name)} className="absolute inset-0 h-full w-full p-6" />
          </div>
          <p className="text-sm text-muted">{mode.reason}</p>
          {mode.canLoad ? (
            <button className="self-start min-h-[44px] font-semibold text-accent underline underline-offset-4" onClick={() => setMode({ static: false, reason: null, canLoad: true })}>
              Load the 3D preview anyway
            </button>
          ) : null}
        </div>
      ) : (
        <FrameViewer3D
          name={product.name}
          tint={tint}
          model={{ shape: product.shape, frameType: product.frameType, material: product.material, lensWidthMm: product.lensWidthMm, bridgeMm: product.bridgeMm, templeMm: product.templeMm, rim: colour.rim, temple: colour.temple }}
        />
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Preview lens tint</legend>
        <div className="flex flex-wrap gap-2">
          {LENS_TINTS.map((t) => (
            <label key={t.id} className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lens border border-line-strong px-3 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus">
              <input type="radio" name="tint" className="sr-only" checked={tint === t.id} onChange={() => setTint(t.id)} />
              <span className="h-4 w-4 rounded-full border border-line-strong" style={{ background: t.color, opacity: Math.max(t.opacity, 0.5) }} aria-hidden="true" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>
      {onColourChange ? (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Frame colour: {colour.name}</legend>
          <div className="flex flex-wrap gap-2">
            {product.colours.map((c, i) => (
              <label key={c.name} className="tap grid h-9 w-9 cursor-pointer place-items-center rounded-full has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus">
                <input type="radio" name="frame-colour-3d" className="sr-only" checked={i === colourIndex} onChange={() => onColourChange(i)} aria-label={c.name} />
                <span className={`h-7 w-7 rounded-full border ${i === colourIndex ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "border-line-strong"}`} style={{ background: c.rim }} aria-hidden="true" />
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
