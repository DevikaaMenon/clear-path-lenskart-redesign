"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { ProductDTO } from "@/lib/catalogue";
import { fitHint, totalWidthMm } from "@/lib/catalogue";
import { formatINR, price, type OfferDef, type PurposeId } from "@/lib/pricing";
import { PURPOSES, needById, type PurposeIdT } from "@/lib/taxonomy";
import { api, ApiError } from "@/lib/client/api";
import { FrameIllustration, frameAlt, type Tint } from "../frames/FrameIllustration";
import { useShop } from "../providers/ShopProvider";
import { materialLabel, shapeLabel } from "../catalogue/ProductCard";
import { Button } from "../ui/Button";
import { UxMarker } from "../ux/UxMarker";
import { Icon } from "../ui/Icon";
import { TrustStrip } from "../ui/TrustStrip";
import { PriceBreakdown } from "./PriceBreakdown";
import { SizeDrawing } from "./SizeDrawing";
import { FindMySize } from "./FindMySize";
import { Try3DPanel } from "../three/Try3DPanel";
import { reportTestEvent } from "../testmode/TestMode";

export interface LensOpt { id: string; purpose: string; name: string; description: string; price: number; needsPrescription: boolean }
export interface CoatingOpt { id: string; name: string; description: string; price: number }
export interface EditItem { id: string; size: string; colour: string; purpose: string; lensOptionId: string; coatingId: string | null }

const LOW_STOCK = 3;

/** Lens purposes this frame can take. Sun-only frames take sun lenses only. */
function purposesFor(p: ProductDTO): PurposeIdT[] {
  if (p.needs.length === 1 && p.needs[0] === "sun") return ["sun"];
  const list: PurposeIdT[] = ["prescription", "computer", "reading"];
  if (p.needs.includes("sun")) list.push("sun");
  list.push("zero-power");
  return list;
}

const TINT_FOR: Record<string, Tint> = { prescription: "prescription", computer: "computer", reading: "reading", sun: "sun", "zero-power": "zero-power" };

export function ProductView({
  product: p, lenses, coatings, offers, initialNeed, initialColour, edit,
}: {
  product: ProductDTO;
  lenses: LensOpt[];
  coatings: CoatingOpt[];
  offers: OfferDef[];
  initialNeed: string | null;
  initialColour: number;
  edit: EditItem | null;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { refreshCart, setCartCount, compare, addCompare, removeCompare, wishlist, toggleWishlist, toast } = useShop();
  const allowed = purposesFor(p);
  const needPurpose = needById(initialNeed)?.lensPurpose as PurposeIdT | null | undefined;

  const [colour, setColour] = useState(() => (edit ? Math.max(0, p.colours.findIndex((c) => c.name === edit.colour)) : Math.min(initialColour, p.colours.length - 1)));
  const [size, setSize] = useState<string | null>(() => {
    if (edit) return edit.size;
    const m = p.sizes.find((s) => s.label === "M" && s.stock > 0);
    return (m ?? p.sizes.find((s) => s.stock > 0))?.label ?? null;
  });
  const [purpose, setPurpose] = useState<PurposeIdT>(() => (edit?.purpose as PurposeIdT) ?? (needPurpose && allowed.includes(needPurpose) ? needPurpose : allowed[0]));
  const lensFor = (pp: string) => lenses.filter((l) => l.purpose === pp);
  const [lensId, setLensId] = useState<string>(() => edit?.lensOptionId ?? lensFor(purpose)[0]?.id);
  const [coatingId, setCoatingId] = useState<string | null>(edit?.coatingId ?? null);
  const [view, setView] = useState<"front" | "3d">("front");
  const [fms, setFms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState<"measure" | "details" | "lenses">("measure");
  const sizeHelpId = "size-help";
  const ctaRef = useRef<HTMLDivElement>(null);

  const sizeObj = p.sizes.find((s) => s.label === size) ?? null;
  const lens = lenses.find((l) => l.id === lensId) ?? lensFor(purpose)[0];
  const coating = coatings.find((c) => c.id === coatingId) ?? null;
  const soldOut = !p.sizes.some((s) => s.stock > 0);

  const result = useMemo(
    () =>
      price(
        { name: p.name, basePrice: p.basePrice },
        size ?? undefined,
        { id: lens.id, name: lens.name, price: lens.price, purpose: purpose as PurposeId },
        coating ? { id: coating.id, name: coating.name, price: coating.price } : null,
        offers,
      ),
    [p, size, lens, purpose, coating, offers],
  );

  const choosePurpose = (pp: PurposeIdT) => {
    setPurpose(pp);
    setLensId(lensFor(pp)[0].id);
    setAdded(false);
  };

  const inCompare = compare.some((c) => c.id === p.id);
  const saved = wishlist.has(p.id);

  const submit = async () => {
    if (!size || !sizeObj || sizeObj.stock <= 0) {
      setError("Choose a size that's in stock first.");
      document.getElementById("size-group")?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (edit) {
        await api("/api/cart", { method: "PATCH", body: { itemId: edit.id, size, colour: p.colours[colour].name, purpose, lensOptionId: lens.id, coatingId } });
        await refreshCart();
        toast({ title: "Bag updated", body: `${p.name}: ${lens.name}`, tone: "success", icon: "check" });
        router.push("/cart");
        return;
      }
      const res = await api<{ itemId: string; count: number }>("/api/cart", {
        method: "POST",
        body: { productId: p.id, size, colour: p.colours[colour].name, purpose, lensOptionId: lens.id, coatingId, shownTotal: result.total },
      });
      setCartCount(res.count);
      reportTestEvent("T4");
      if (lens.needsPrescription) {
        router.push(`/prescription/${res.itemId}`);
        return;
      }
      setAdded(true);
    } catch (e) {
      if (e instanceof ApiError && e.code === "price_changed") {
        setError(`${e.message} We've refreshed the page with the latest price.`);
        router.refresh();
      } else {
        setError(e instanceof ApiError ? e.message : "Couldn't add to your bag. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const needLabel = needById(initialNeed);
  const ctaLabel = edit ? "Save changes" : lens.needsPrescription ? "Continue: add your prescription" : "Add to bag";

  return (
    <div className="page pb-16">
      <nav aria-label="Breadcrumb" className="pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <li><Link href="/" className="underline-offset-4 hover:text-ink hover:underline">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={needLabel ? `/shop?need=${needLabel.id}` : "/shop"} className="underline-offset-4 hover:text-ink hover:underline">
              {needLabel ? needLabel.label : "All frames"}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">{p.name}</li>
        </ol>
      </nav>

      <div className="grid-page gap-y-10 pt-6">
        {/* Gallery */}
        <div className="col-span-4 md:col-span-8 xl:col-span-7">
          <div className="xl:sticky xl:top-[calc(var(--header-h)+24px)]">
            <div className="flex items-center justify-between border-b border-ink pb-2">
              <div role="tablist" aria-label="Product views" className="flex gap-1">
                {(["front", "3d"] as const).map((v) => (
                  <button
                    key={v}
                    role="tab"
                    aria-selected={view === v}
                    aria-controls={`view-${v}`}
                    id={`tab-${v}`}
                    onClick={() => setView(v)}
                    className={`flex min-h-[44px] items-center gap-2 px-3 font-semibold transition-colors ${view === v ? "bg-ink text-paper" : "hover:bg-sunk"}`}
                  >
                    <Icon name={v === "front" ? "glasses" : "cube"} size={18} /> {v === "front" ? "Front view" : "Try in 3D"}
                  </button>
                ))}
              </div>
              <span className="num text-sm text-muted">{p.modelCode}</span>
            </div>
            <div className="relative mt-4">
              <UxMarker id="product-image" />
              {view === "front" ? (
                <div id="view-front" role="tabpanel" aria-labelledby="tab-front" className="relative aspect-[4/3] border border-line bg-surface" style={{ viewTransitionName: "frame-hero" }}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={`${colour}-${purpose}`} className="absolute inset-0" initial={reduce ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      <FrameIllustration
                        frame={{ ...p, lensWidthMm: sizeObj?.lensWidthMm ?? p.lensWidthMm, bridgeMm: sizeObj?.bridgeMm ?? p.bridgeMm }}
                        colour={p.colours[colour]}
                        tint={TINT_FOR[purpose]}
                        title={frameAlt(p, p.colours[colour].name)}
                        className="h-full w-full p-8 md:p-14"
                      />
                    </motion.div>
                  </AnimatePresence>
                  <p className="absolute bottom-3 left-4 text-xs text-muted">Illustration drawn to scale from the frame&apos;s measurements</p>
                </div>
              ) : (
                <div id="view-3d" role="tabpanel" aria-labelledby="tab-3d">
                  <Try3DPanel product={p} colourIndex={colour} onColourChange={setColour} initialTint={purpose === "sun" ? "grey" : purpose === "computer" ? "blue" : "clear"} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="col-span-4 md:col-span-8 xl:col-span-5">
          <p className="eyebrow">{p.brand} · {p.collection}</p>
          <h1 className="mt-2 font-display text-4xl">{p.name}</h1>
          <p className="mt-2 text-muted">
            {shapeLabel(p.shape)} · {materialLabel(p.material)} · {p.weightG} g · {p.frameType.replace("-", " ")}
          </p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="num text-2xl font-bold">{formatINR(p.basePrice)}</span>
            <span className="text-muted">frame price</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={saved ? "heart-filled" : "heart"}
              aria-pressed={saved}
              onClick={() => toggleWishlist(p.id, p.name)}
            >
              {saved ? "Saved" : "Save"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={inCompare ? "check" : "compare"}
              aria-pressed={inCompare}
              onClick={() => {
                if (inCompare) return removeCompare(p.id);
                const r = addCompare({ id: p.id, slug: p.slug, name: p.name, shape: p.shape, rim: p.colours[colour].rim, frameType: p.frameType, lensWidthMm: p.lensWidthMm, price: p.basePrice });
                if (r === "full") toast({ title: "Compare tray is full", body: "Remove a frame to add this one.", icon: "compare" });
              }}
            >
              {inCompare ? "In compare" : "Compare"}
            </Button>
          </div>

          {/* 1. Colour */}
          <fieldset className="mt-8 border-t border-line pt-6">
            <legend className="float-left mb-3 w-full font-bold">
              <span className="num mr-2 text-muted">1</span>Colour: <span className="font-normal">{p.colours[colour].name}</span>
            </legend>
            <div className="clear-both flex flex-wrap gap-2">
              {p.colours.map((c, i) => (
                <label key={c.name} className="grid h-11 w-11 cursor-pointer place-items-center rounded-full has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus">
                  <input type="radio" name="colour" className="sr-only" checked={i === colour} onChange={() => setColour(i)} aria-label={c.name} />
                  <span className={`h-8 w-8 rounded-full border transition-transform duration-micro ${i === colour ? "scale-110 ring-2 ring-ink ring-offset-2 ring-offset-paper" : "border-line-strong hover:scale-105"}`} style={{ background: c.pattern === "tortoise" ? `radial-gradient(circle at 30% 30%, ${c.temple} 0 30%, ${c.rim} 31%)` : c.rim }} aria-hidden="true" />
                </label>
              ))}
            </div>
          </fieldset>

          {/* 2. Size with measurements (X6) */}
          <fieldset className="relative mt-8 border-t border-line pt-6" aria-describedby={sizeHelpId}>
            <UxMarker id="product-size" />
            <legend className="float-left mb-1 flex w-full items-center justify-between font-bold">
              <span><span className="num mr-2 text-muted">2</span>Size</span>
              <button type="button" onClick={() => setFms(true)} className="link inline-flex min-h-[44px] items-center gap-1 text-sm">
                <Icon name="ruler" size={18} /> Find my size
              </button>
            </legend>
            <p id={sizeHelpId} className="clear-both mb-3 text-sm text-muted">
              Lens width □ bridge · temple length, in mm.
            </p>
            <div id="size-group" tabIndex={-1} className="grid grid-cols-3 gap-2">
              {(["S", "M", "L"] as const).map((label) => {
                const s = p.sizes.find((x) => x.label === label);
                const out = !s || s.stock <= 0;
                const sel = size === label;
                return (
                  <label
                    key={label}
                    className={`relative flex min-h-[88px] flex-col justify-between border p-3 transition-colors duration-micro has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                      out ? "cursor-not-allowed border-dashed border-line-strong bg-sunk text-muted" : sel ? "cursor-pointer border-ink bg-ink text-paper" : "cursor-pointer border-line-strong bg-surface hover:border-ink"
                    }`}
                  >
                    <input type="radio" name="size" className="sr-only" disabled={out} checked={sel} onChange={() => { setSize(label); setAdded(false); }} aria-describedby={`size-${label}-note`} />
                    <span className="flex items-baseline justify-between">
                      <span className="text-lg font-bold">{label}</span>
                      {sel ? <Icon name="check" size={18} /> : null}
                    </span>
                    {s ? <span className="num text-sm">{s.lensWidthMm}□{s.bridgeMm} {s.templeMm}</span> : null}
                    <span id={`size-${label}-note`} className={`text-xs ${sel ? "text-paper/80" : "text-muted"}`}>
                      {!s ? "Not made in this size" : s.stock <= 0 ? "Out of stock" : s.stock <= LOW_STOCK ? `${s.stock} left` : "In stock"}
                    </span>
                  </label>
                );
              })}
            </div>
            {sizeObj ? (
              <p className="mt-3 flex gap-2 text-sm">
                <Icon name="ruler" size={18} className="mt-0.5 shrink-0 text-accent" />
                <span>{fitHint({ lensWidthMm: sizeObj.lensWidthMm, bridgeMm: sizeObj.bridgeMm, sizeBand: totalWidthMm(sizeObj) < 132 ? "narrow" : totalWidthMm(sizeObj) <= 140 ? "medium" : "wide" })}</span>
              </p>
            ) : null}
            {/* Real-stock scarcity only (X12), with an explanation */}
            {sizeObj && sizeObj.stock > 0 && sizeObj.stock <= LOW_STOCK ? (
              <p className="mt-2 flex gap-2 border-l-2 border-warning bg-warning-soft px-3 py-2 text-sm" data-testid="low-stock">
                <Icon name="info" size={18} className="mt-0.5 shrink-0 text-warning" />
                <span>
                  <strong>Only {sizeObj.stock} left in size {sizeObj.label}.</strong> This is our live warehouse count for this size. We&apos;ll restock, but we can&apos;t promise when.
                </span>
              </p>
            ) : null}
            {soldOut ? (
              <p className="mt-2 border-l-2 border-danger bg-danger-soft px-3 py-2 text-sm font-semibold">
                This frame is sold out in every size. <Link className="link" href={`/shop?shape=${p.shape}&inStock=1`}>See in-stock {shapeLabel(p.shape).toLowerCase()} frames</Link>.
              </p>
            ) : null}
          </fieldset>

          {/* 3. Lens purpose (X6 rename) */}
          <fieldset className="relative mt-8 border-t border-line pt-6">
            <UxMarker id="product-purpose" />
            <legend className="float-left mb-3 w-full font-bold"><span className="num mr-2 text-muted">3</span>What are the lenses for?</legend>
            <div className="clear-both flex flex-col gap-2">
              {PURPOSES.filter((pp) => allowed.includes(pp.id)).map((pp) => (
                <label key={pp.id} className="flex min-h-[56px] cursor-pointer items-start gap-3 border border-line-strong bg-surface p-3 transition-colors duration-micro hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-accent-soft has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus">
                  <input type="radio" name="purpose" className="mt-1 h-5 w-5 shrink-0 accent-[var(--c-ink)]" checked={purpose === pp.id} onChange={() => choosePurpose(pp.id)} />
                  <span>
                    <span className="block font-semibold">{pp.label}</span>
                    <span className="block text-sm text-muted">{pp.helper}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* 4. Lens type */}
          <fieldset className="mt-8 border-t border-line pt-6">
            <legend className="float-left mb-3 w-full font-bold"><span className="num mr-2 text-muted">4</span>Lens type</legend>
            <div className="clear-both flex flex-col gap-2">
              {lensFor(purpose).map((l) => (
                <label key={l.id} className="flex min-h-[56px] cursor-pointer items-start gap-3 border border-line-strong bg-surface p-3 transition-colors duration-micro hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-accent-soft has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus">
                  <input type="radio" name="lens" className="mt-1 h-5 w-5 shrink-0 accent-[var(--c-ink)]" checked={lens.id === l.id} onChange={() => { setLensId(l.id); setAdded(false); }} />
                  <span className="flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{l.name}</span>
                      <span className="num shrink-0 text-sm font-semibold">{l.price ? `+${formatINR(l.price)}` : "Included"}</span>
                    </span>
                    <span className="block text-sm text-muted">{l.description}</span>
                    {l.needsPrescription ? <span className="mt-1 block text-xs font-semibold text-accent">Needs your prescription: upload, type it in, or send it later</span> : null}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* 5. Coating: optional, nothing pre-ticked */}
          <fieldset className="mt-8 border-t border-line pt-6">
            <legend className="float-left mb-3 w-full font-bold"><span className="num mr-2 text-muted">5</span>Coating <span className="font-normal text-muted">(optional)</span></legend>
            <div className="clear-both flex flex-col gap-2">
              {[{ id: null as string | null, name: "No extra coating", description: "Anti-scratch coat is already included.", price: 0 }, ...coatings].map((c) => (
                <label key={c.id ?? "none"} className="flex min-h-[48px] cursor-pointer items-start gap-3 border border-line-strong bg-surface p-3 transition-colors duration-micro hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-accent-soft has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus">
                  <input type="radio" name="coating" className="mt-1 h-5 w-5 shrink-0 accent-[var(--c-ink)]" checked={coatingId === c.id} onChange={() => { setCoatingId(c.id); setAdded(false); }} />
                  <span className="flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{c.name}</span>
                      <span className="num shrink-0 text-sm font-semibold">{c.price ? `+${formatINR(c.price)}` : "₹0"}</span>
                    </span>
                    <span className="block text-sm text-muted">{c.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Live price + CTA + trust (X5, X8) */}
          <div className="mt-8 flex flex-col gap-4" ref={ctaRef}>
            <div className="relative">
              <PriceBreakdown result={result} note={<span>Have a code? You can add it in your bag. We&apos;ll only use it if it saves you more.</span>} />
              <UxMarker id="product-price" />
            </div>
            {error ? (
              <p role="alert" className="flex gap-2 border-2 border-danger bg-danger-soft p-3 font-semibold text-danger">
                <Icon name="alert" size={20} className="mt-0.5 shrink-0" /> {error}
              </p>
            ) : null}
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.div
                  key="added"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-2 border-success bg-success-soft p-4"
                  role="status"
                >
                  <p className="flex items-center gap-3 font-bold">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 text-success" aria-hidden="true">
                      <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="2" />
                      <motion.path d="m7 12.5 3.5 3.5L17 9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.1 }} />
                    </svg>
                    Added to your bag: {p.name}, size {size}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href="/cart" className="inline-flex min-h-[48px] items-center gap-2 bg-ink px-5 font-semibold text-paper hover:bg-ink-2 transition-[transform,box-shadow]">
                      Go to bag <Icon name="arrow-right" size={18} />
                    </Link>
                    <Button variant="secondary" onClick={() => setAdded(false)}>Keep shopping</Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="cta" initial={false} exit={{ opacity: 0 }}>
                  <Button variant="primary" size="lg" full iconRight="arrow-right" onClick={submit} loading={busy} loadingText={edit ? "Saving" : "Adding"} disabled={soldOut} data-testid="add-to-bag">
                    {ctaLabel} · {formatINR(result.total)}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-center text-sm text-muted">Delivered in 4–7 days. Free shipping. Pay online or cash on delivery.</p>
            <div className="relative">
              <TrustStrip compact />
              <UxMarker id="product-trust" />
            </div>
          </div>
        </div>
      </div>

      {/* Measurements and details */}
      <section className="mt-16 border-t border-ink pt-6" aria-label="More about this frame">
        <div role="tablist" aria-label="Frame information" className="flex flex-wrap gap-1">
          {([["measure", "Measurements"], ["details", "Details"], ["lenses", "Lenses explained"]] as const).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              id={`info-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`info-${id}`}
              onClick={() => setTab(id)}
              onKeyDown={(e) => {
                const ids = ["measure", "details", "lenses"] as const;
                const i = ids.indexOf(id);
                if (e.key === "ArrowRight") { setTab(ids[(i + 1) % 3]); document.getElementById(`info-tab-${ids[(i + 1) % 3]}`)?.focus(); }
                if (e.key === "ArrowLeft") { setTab(ids[(i + 2) % 3]); document.getElementById(`info-tab-${ids[(i + 2) % 3]}`)?.focus(); }
              }}
              tabIndex={tab === id ? 0 : -1}
              className={`min-h-[48px] px-4 font-semibold transition-colors ${tab === id ? "bg-ink text-paper" : "hover:bg-sunk"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-6">
          {tab === "measure" ? (
            <div id="info-measure" role="tabpanel" aria-labelledby="info-tab-measure" className="grid-page gap-y-6">
              <div className="col-span-4 md:col-span-5 xl:col-span-7">
                {sizeObj ? <SizeDrawing frame={p} colour={p.colours[colour]} size={sizeObj} title={`Technical drawing of ${p.name} in size ${sizeObj.label}: lens ${sizeObj.lensWidthMm} mm, bridge ${sizeObj.bridgeMm} mm, temple ${sizeObj.templeMm} mm.`} /> : null}
              </div>
              <div className="col-span-4 md:col-span-3 xl:col-span-5">
                <table className="w-full text-left">
                  <caption className="mb-2 text-left font-bold">All sizes, in millimetres</caption>
                  <thead>
                    <tr className="border-b border-ink text-sm">
                      <th scope="col" className="py-2">Size</th><th scope="col">Lens</th><th scope="col">Bridge</th><th scope="col">Temple</th><th scope="col">Across</th><th scope="col">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="num">
                    {p.sizes.map((s) => (
                      <tr key={s.label} className={`border-b border-line ${s.label === size ? "bg-accent-soft" : ""}`}>
                        <th scope="row" className="py-2 font-sans">{s.label}</th>
                        <td>{s.lensWidthMm}</td><td>{s.bridgeMm}</td><td>{s.templeMm}</td><td>{totalWidthMm(s)}</td>
                        <td className="font-sans text-sm">{s.stock <= 0 ? "Out" : s.stock <= LOW_STOCK ? `${s.stock} left` : "Yes"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 text-sm text-muted">Weight: {p.weightG} g (frame only). “Across” is the approximate total front width.</p>
              </div>
            </div>
          ) : tab === "details" ? (
            <div id="info-details" role="tabpanel" aria-labelledby="info-tab-details" className="max-w-prose">
              <p className="text-lg">{p.description}</p>
              <dl className="mt-4 grid grid-cols-[10rem_1fr] gap-y-2">
                <dt className="text-muted">Model code</dt><dd className="num">{p.modelCode}</dd>
                <dt className="text-muted">Brand</dt><dd>{p.brand}</dd>
                <dt className="text-muted">Collection</dt><dd>{p.collection}</dd>
                <dt className="text-muted">Material</dt><dd>{materialLabel(p.material)}</dd>
                <dt className="text-muted">Rim style</dt><dd className="capitalize">{p.frameType.replace("-", " ")}</dd>
                <dt className="text-muted">Often suits</dt><dd>{p.faceShapes.map((f) => `${f} faces`).join(", ")} (a suggestion, not a rule)</dd>
              </dl>
            </div>
          ) : (
            <div id="info-lenses" role="tabpanel" aria-labelledby="info-tab-lenses" className="grid max-w-4xl gap-4 md:grid-cols-2">
              {PURPOSES.map((pp) => (
                <div key={pp.id} className="border border-line bg-surface p-4">
                  <h3 className="font-sans font-bold">{pp.label}</h3>
                  <p className="text-sm text-muted">{pp.helper}</p>
                  <ul className="mt-2 text-sm">
                    {lensFor(pp.id).map((l) => <li key={l.id} className="flex justify-between gap-2 border-t border-line py-1"><span>{l.name}</span><span className="num">{l.price ? formatINR(l.price) : "Included"}</span></li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <FindMySize open={fms} onClose={() => setFms(false)} sizes={p.sizes} name={p.name} onChoose={(l) => setSize(l)} />
    </div>
  );
}
