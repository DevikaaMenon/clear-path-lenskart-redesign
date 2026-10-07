"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProductDTO } from "@/lib/catalogue";
import { totalWidthMm } from "@/lib/catalogue";
import { formatINR } from "@/lib/pricing";
import { lensOutline, toPath } from "@/lib/frame-geometry";
import { PX_PER_MM, VB_H, VB_W, layoutFrame } from "../frames/FrameIllustration";
import { FrameIllustration, frameAlt } from "../frames/FrameIllustration";
import { api, ApiError } from "@/lib/client/api";
import { useShop } from "../providers/ShopProvider";
import { materialLabel, shapeLabel } from "../catalogue/ProductCard";
import { useTransitionNavigate } from "../motion/ViewTransition";
import { Button, ButtonLink } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { UxMarker } from "../ux/UxMarker";
import { Icon } from "../ui/Icon";
import { CardSkeleton } from "../ui/Skeleton";

const OVERLAY = ["var(--c-ink)", "var(--c-accent)", "var(--c-signal)"];
const DASH = ["", "6 4", "2 3"]; // pattern differs too, so colour is not the only cue

type Row = { label: string; get: (p: ProductDTO) => string; num?: (p: ProductDTO) => number; best?: "min" | "max"; bestLabel?: string };

const ROWS: Row[] = [
  { label: "Frame price", get: (p) => formatINR(p.basePrice), num: (p) => p.basePrice, best: "min", bestLabel: "Lowest price" },
  { label: "Shape", get: (p) => shapeLabel(p.shape) },
  { label: "Fit", get: (p) => `${p.sizeBand[0].toUpperCase()}${p.sizeBand.slice(1)} (${totalWidthMm(p)} mm across)` },
  { label: "Lens width", get: (p) => `${p.lensWidthMm} mm`, num: (p) => p.lensWidthMm },
  { label: "Bridge", get: (p) => `${p.bridgeMm} mm`, num: (p) => p.bridgeMm },
  { label: "Temple length", get: (p) => `${p.templeMm} mm`, num: (p) => p.templeMm },
  { label: "Weight", get: (p) => `${p.weightG} g`, num: (p) => p.weightG, best: "min", bestLabel: "Lightest" },
  { label: "Material", get: (p) => materialLabel(p.material) },
  { label: "Rim style", get: (p) => p.frameType.replace("-", " ") },
  { label: "Sizes in stock", get: (p) => p.sizes.filter((s) => s.stock > 0).map((s) => s.label).join(", ") || "None" },
  { label: "Colours", get: (p) => p.colours.map((c) => c.name).join(", ") },
  { label: "Good for", get: (p) => p.needs.join(", ") },
  { label: "Often suits", get: (p) => p.faceShapes.map((f) => `${f}`).join(", ") + " faces" },
];

export function CompareView() {
  const { compare, removeCompare } = useShop();
  const navigate = useTransitionNavigate();
  const reduce = useReducedMotion();
  const [products, setProducts] = useState<ProductDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diffOnly, setDiffOnly] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const key = compare.map((c) => c.id).join(",");

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (!hydrated) return;
    if (!key) { setProducts([]); return; }
    setError(null);
    api<{ products: ProductDTO[] }>(`/api/compare?ids=${key}`)
      .then((d) => setProducts(d.products))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load the comparison."));
  }, [key, hydrated]);

  const list = (products ?? []).filter((p) => compare.some((c) => c.id === p.id));
  const rows = diffOnly ? ROWS.filter((r) => new Set(list.map(r.get)).size > 1) : ROWS;

  if (error) {
    return (
      <div className="page py-12">
        <h1 className="font-display text-5xl">Compare frames</h1>
        <div role="alert" className="mt-6 flex items-center gap-3 border-2 border-danger bg-danger-soft p-4">
          <Icon name="alert" className="text-danger" /> <p className="flex-1 font-semibold">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => location.reload()}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page pb-16 pt-10 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-6">
        <div>
          <p className="eyebrow">Step 2 · Choose between frames</p>
          <h1 className="mt-2 font-display text-5xl">Compare frames</h1>
          <p className="mt-2 text-muted">Side by side, in the same units. Choose one to see lenses and the full price.</p>
        </div>
        {list.length > 1 ? (
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-[var(--c-ink)]" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} />
            Show only rows that differ
          </label>
        ) : null}
      </div>

      {products === null ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3" aria-busy="true" aria-label="Loading comparison">
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon="compare" title="Nothing to compare yet" body="Add two or three frames with the “Compare” button on any frame card, then come back here.">
            <ButtonLink href="/shop" variant="primary" iconRight="arrow-right">Browse frames to compare</ButtonLink>
          </EmptyState>
        </div>
      ) : (
        <>
          {/* To-scale overlay: all frames drawn on top of each other at the same mm scale */}
          <figure className="relative mt-8 grid-page items-center gap-y-4 border border-line bg-surface p-4 md:p-6">
            <UxMarker id="compare-overlay" />
            <div className="col-span-4 md:col-span-5 xl:col-span-7">
              <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full" role="img" aria-label={`Outlines of ${list.map((p) => p.name).join(", ")} drawn on top of each other at the same scale to compare size.`}>
                <line x1="20" x2={VB_W - 20} y1={VB_H / 2 + 4} y2={VB_H / 2 + 4} stroke="var(--c-line)" />
                <line x1={VB_W / 2} x2={VB_W / 2} y1="10" y2={VB_H - 10} stroke="var(--c-line)" />
                {list.map((p, i) => {
                  const L = layoutFrame(p);
                  const pts = lensOutline(p.shape, p.lensWidthMm);
                  return (
                    <motion.g key={p.id} initial={reduce ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.12, duration: 0.4 }} style={{ transformOrigin: "50% 50%" }}>
                      <path d={toPath(pts, PX_PER_MM, L.rcx, L.cy)} fill="none" stroke={OVERLAY[i]} strokeWidth="2.2" strokeDasharray={DASH[i]} />
                      <path d={toPath(pts, PX_PER_MM, L.lcx, L.cy, true)} fill="none" stroke={OVERLAY[i]} strokeWidth="2.2" strokeDasharray={DASH[i]} />
                    </motion.g>
                  );
                })}
              </svg>
            </div>
            <figcaption className="col-span-4 md:col-span-3 xl:col-span-5">
              <p className="font-bold">Size, to scale</p>
              <p className="text-sm text-muted">Each outline is drawn from the frame&apos;s real lens and bridge measurements.</p>
              <ul className="mt-3 flex flex-col gap-2">
                {list.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <svg width="40" height="10" aria-hidden="true"><line x1="0" x2="40" y1="5" y2="5" stroke={OVERLAY[i]} strokeWidth="2.5" strokeDasharray={DASH[i]} /></svg>
                    <span className="font-semibold">{p.name}</span>
                    <span className="num text-sm text-muted">{totalWidthMm(p)} mm</span>
                  </li>
                ))}
              </ul>
            </figcaption>
          </figure>

          <div className="relative mt-8">
          <UxMarker id="compare-table" />
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Comparison table, scrolls sideways on small screens">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <caption className="sr-only">Comparison of {list.length} frames</caption>
              <thead>
                <tr>
                  <td className="w-40 md:w-48" />
                  <AnimatePresence initial={false}>
                    {list.map((p, i) => (
                      <motion.th key={p.id} scope="col" layout={!reduce} exit={{ opacity: 0 }} className="border-l border-line p-3 align-top font-normal">
                        <div className="relative border border-line bg-paper">
                          <FrameIllustration frame={p} colour={p.colours[0]} title={frameAlt(p, p.colours[0].name)} className="aspect-[16/10] w-full p-3" />
                          <svg className="absolute left-2 top-2" width="28" height="8" aria-hidden="true"><line x1="0" x2="28" y1="4" y2="4" stroke={OVERLAY[i]} strokeWidth="3" strokeDasharray={DASH[i]} /></svg>
                        </div>
                        <p className="mt-3 font-display text-xl leading-tight">{p.name}</p>
                        <p className="num text-sm text-muted">{p.modelCode}</p>
                        <div className="mt-3 flex flex-col gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            iconRight="arrow-right"
                            onClick={(e) => navigate(`/frames/${p.slug}`, (e.currentTarget.closest("th") as HTMLElement)?.querySelector("div"), "frame-hero")}
                            aria-label={`Choose ${p.name}: see lenses and price`}
                          >
                            Choose this frame
                          </Button>
                          <Button variant="ghost" size="sm" icon="close" onClick={() => removeCompare(p.id)} aria-label={`Remove ${p.name} from comparison`}>
                            Remove
                          </Button>
                        </div>
                      </motion.th>
                    ))}
                  </AnimatePresence>
                  {list.length < 3 ? (
                    <td className="border-l border-line p-3 align-top">
                      <Link href="/shop" className="grid aspect-[16/10] w-full place-items-center border border-dashed border-line-strong text-center text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink">
                        <span className="flex flex-col items-center gap-2"><Icon name="plus" /> Add another frame</span>
                      </Link>
                    </td>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  let bestId: string | null = null;
                  if (r.best && r.num && list.length > 1) {
                    const vals = list.map((p) => r.num!(p));
                    const target = r.best === "min" ? Math.min(...vals) : Math.max(...vals);
                    if (vals.filter((v) => v === target).length === 1) bestId = list[vals.indexOf(target)].id;
                  }
                  return (
                    <tr key={r.label} className="border-t border-line">
                      <th scope="row" className="py-3 pr-3 text-sm font-semibold text-muted">{r.label}</th>
                      {list.map((p) => (
                        <td key={p.id} className={`border-l border-line p-3 ${r.num ? "num" : ""} ${r.label === "Rim style" ? "capitalize" : ""}`}>
                          {r.get(p)}
                          {bestId === p.id ? <span className="ml-2 inline-block bg-accent-soft px-1.5 py-0.5 font-sans text-xs font-bold text-accent">{r.bestLabel}</span> : null}
                        </td>
                      ))}
                      {list.length < 3 ? <td className="border-l border-line" /> : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
          {list.length === 1 ? <p className="mt-4 text-muted">Add at least one more frame to compare side by side.</p> : null}
        </>
      )}
    </div>
  );
}
