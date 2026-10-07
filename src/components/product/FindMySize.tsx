"use client";

import { useState } from "react";
import type { SizeDTO } from "@/lib/catalogue";
import { Drawer } from "../ui/Drawer";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import { Icon } from "../ui/Icon";

/**
 * "Find my size" at the size selector (X3): from the numbers inside glasses
 * that already fit, or from how glasses usually feel. Recommends one of this frame's sizes.
 */
export function FindMySize({
  open, onClose, sizes, onChoose, name,
}: { open: boolean; onClose: () => void; sizes: SizeDTO[]; onChoose: (label: string) => void; name: string }) {
  const [lens, setLens] = useState("");
  const [bridge, setBridge] = useState("");
  const [feel, setFeel] = useState<"tight" | "fine" | "loose" | null>(null);
  const [errors, setErrors] = useState<{ lens?: string; bridge?: string }>({});
  const [rec, setRec] = useState<{ label: string; why: string; outOfStock: boolean } | null>(null);

  const recommend = () => {
    const e: typeof errors = {};
    const l = lens ? Number(lens) : null;
    const b = bridge ? Number(bridge) : null;
    if (lens && (!Number.isInteger(l) || l! < 38 || l! > 64)) e.lens = "Lens width is a whole number between 38 and 64.";
    if (bridge && (!Number.isInteger(b) || b! < 12 || b! > 26)) e.bridge = "Bridge is a whole number between 12 and 26.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const avail = sizes;
    let target: number;
    let why: string;
    if (l) {
      target = l * 2 + (b ?? 18);
      why = `Your current glasses measure about ${target + 10} mm across. `;
    } else if (feel) {
      const m = avail.find((s) => s.label === "M") ?? avail[Math.floor(avail.length / 2)];
      const base = m.lensWidthMm * 2 + m.bridgeMm;
      target = feel === "tight" ? base + 4 : feel === "loose" ? base - 4 : base;
      why = feel === "tight" ? "Glasses often feel tight on you, so we suggest going one size up. " : feel === "loose" ? "Glasses often slide down on you, so we suggest one size smaller. " : "Most glasses fit you, so the standard size is a safe choice. ";
    } else {
      setErrors({ lens: "Enter your lens width, or choose how glasses usually feel." });
      return;
    }
    const best = [...avail].sort((x, y) => Math.abs(x.lensWidthMm * 2 + x.bridgeMm - target) - Math.abs(y.lensWidthMm * 2 + y.bridgeMm - target))[0];
    setRec({
      label: best.label,
      why: `${why}Size ${best.label} of ${name} (${best.lensWidthMm}□${best.bridgeMm} ${best.templeMm}) is the closest match.`,
      outOfStock: best.stock <= 0,
    });
  };

  return (
    <Drawer open={open} onClose={onClose} title="Find my size" description="Use glasses that already fit you, or tell us how glasses usually feel.">
      <div className="flex flex-col gap-6">
        <section aria-labelledby="fms-1">
          <h3 id="fms-1" className="font-sans font-bold">Option 1: Use numbers from glasses you own</h3>
          <p className="mt-1 text-sm text-muted">
            Look inside one arm (temple). You&apos;ll see numbers like <span className="num font-semibold text-ink">52□18 145</span>: lens width, bridge and arm length in mm.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Input label="Lens width" inputMode="numeric" suffix="mm" value={lens} onChange={(e) => setLens(e.target.value.trim())} error={errors.lens} placeholder="52" />
            <Input label="Bridge" optional inputMode="numeric" suffix="mm" value={bridge} onChange={(e) => setBridge(e.target.value.trim())} error={errors.bridge} placeholder="18" />
          </div>
        </section>
        <fieldset>
          <legend className="font-bold">Option 2: How do glasses usually feel?</legend>
          <div className="mt-2 flex flex-col gap-2">
            {([["tight", "Often tight at the sides"], ["fine", "Usually fine"], ["loose", "Often slide down"]] as const).map(([id, label]) => (
              <label key={id} className="flex min-h-[48px] cursor-pointer items-center gap-3 border border-line-strong px-3 has-[:checked]:border-ink has-[:checked]:bg-accent-soft has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus">
                <input type="radio" name="fms-feel" className="h-5 w-5 accent-[var(--c-ink)]" checked={feel === id} onChange={() => setFeel(id)} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <Button variant="primary" onClick={recommend}>Recommend a size</Button>
        {rec ? (
          <div className="border-2 border-accent bg-accent-soft p-4" role="status">
            <p className="flex items-center gap-2 font-bold"><Icon name="ruler" size={20} /> We suggest size {rec.label}</p>
            <p className="mt-1 text-sm">{rec.why}</p>
            {rec.outOfStock ? (
              <p className="mt-2 text-sm font-semibold text-warning">Size {rec.label} is out of stock right now. You could pick the next closest size or a similar frame.</p>
            ) : (
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => { onChoose(rec.label); onClose(); }}>Choose size {rec.label}</Button>
            )}
          </div>
        ) : null}
        <p className="text-sm text-muted">Still unsure? A free eye test at any store includes a frame fitting.</p>
      </div>
    </Drawer>
  );
}
