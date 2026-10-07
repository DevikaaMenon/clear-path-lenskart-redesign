"use client";

import Link from "next/link";
import { useState } from "react";
import type { CardDTO } from "@/lib/server/catalogue-service";
import { formatINR } from "@/lib/pricing";
import { MATERIALS, SHAPES, needToPurpose } from "@/lib/taxonomy";
import { FrameIllustration, frameAlt, type Tint } from "../frames/FrameIllustration";
import { useShop } from "../providers/ShopProvider";
import { Icon } from "../ui/Icon";

export const shapeLabel = (id: string) => SHAPES.find((s) => s.id === id)?.label ?? id;
export const materialLabel = (id: string) => MATERIALS.find((m) => m.id === id)?.label.replace(/ \(.*\)/, "") ?? id;

/**
 * Product card (U4): name, one secondary line, one price line, one short offer tag.
 * The canonical name is the only name used (U5). Offer rules live on the product page.
 */
export function ProductCard({
  p, need, offerTag, onTry3D, lensFrom,
}: {
  p: CardDTO;
  need?: string | null;
  offerTag?: string | null;
  onTry3D?: (p: CardDTO, colourIndex: number) => void;
  /** Cheapest lens for the current need, so the card never under-states the cost. */
  lensFrom?: number | null;
}) {
  const { wishlist, toggleWishlist, compare, addCompare, removeCompare, toast } = useShop();
  const [ci, setCi] = useState(0);
  const colour = p.colours[ci] ?? p.colours[0];
  const purpose = needToPurpose(need);
  const tint: Tint = p.needs.length === 1 && p.needs[0] === "sun" ? "sun" : (purpose as Tint) ?? "clear";
  const href = `/frames/${p.slug}${need && p.needs.includes(need) ? `?need=${need}` : ""}${ci ? `${need && p.needs.includes(need) ? "&" : "?"}colour=${ci}` : ""}`;
  const saved = wishlist.has(p.id);
  const inCompare = compare.some((c) => c.id === p.id);

  const onCompare = () => {
    if (inCompare) {
      removeCompare(p.id);
      return;
    }
    const r = addCompare({
      id: p.id, slug: p.slug, name: p.name, shape: p.shape, rim: colour.rim, frameType: p.frameType, lensWidthMm: p.lensWidthMm, price: p.basePrice,
    });
    if (r === "full") {
      toast({ title: "Compare tray is full", body: "You can compare up to 3 frames. Remove one to add another.", icon: "compare" });
    }
  };

  return (
    <article
      className="group/card relative flex h-full flex-col border border-line bg-surface transition-[transform,box-shadow,border-color] duration-ui ease-settle hover:-translate-x-1 hover:-translate-y-1 hover:border-ink hover:shadow-lift focus-within:border-ink"
      data-testid="product-card"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-paper">
        {/* Measurement rule behind the frame: a quiet reference to the optician's chart */}
        <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px bg-line opacity-0 transition-opacity duration-ui group-hover/card:opacity-100" aria-hidden="true" />
        <FrameIllustration
          frame={p}
          colour={colour}
          tint={tint}
          title={frameAlt(p, colour.name)}
          className="absolute inset-0 h-full w-full p-4 transition-transform duration-page ease-settle group-hover/card:scale-[1.05] group-hover/card:-rotate-[1.5deg]"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {p.soldOut ? (
            <span className="bg-ink px-2 py-0.5 text-xs font-bold text-paper">Sold out</span>
          ) : offerTag ? (
            <span className="border border-accent bg-surface px-2 py-0.5 text-xs font-bold text-accent">{offerTag}</span>
          ) : null}
        </div>
        <button
          className="absolute right-2 top-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-surface/80 text-ink transition-transform duration-micro ease-click hover:scale-110 active:scale-95"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
          onClick={() => toggleWishlist(p.id, p.name)}
        >
          <Icon name={saved ? "heart-filled" : "heart"} size={22} className={saved ? "text-signal" : ""} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-display text-xl leading-tight">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] hover:underline hover:decoration-1 hover:underline-offset-4">
            {p.name}
          </Link>
        </h3>
        <p className="text-sm text-muted">
          {shapeLabel(p.shape)} · {materialLabel(p.material)} · {p.weightG} g ·{" "}
          <span className="num" title="Lens width, bridge, temple length in mm">
            {p.lensWidthMm}□{p.bridgeMm} {p.templeMm}
          </span>
        </p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="num text-lg font-bold">{formatINR(p.basePrice)}</span>
          <span className="text-sm text-muted">
            {lensFrom === null || lensFrom === undefined ? "frame only" : lensFrom === 0 ? "frame, basic lenses included" : `frame + lenses from ${formatINR(lensFrom)}`}
          </span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="relative z-10 flex gap-1" role="group" aria-label={`Colours for ${p.name}`}>
            {p.colours.map((c, i) => (
              <button
                key={c.name}
                className="tap grid h-7 w-7 place-items-center rounded-full"
                aria-label={c.name}
                aria-pressed={i === ci}
                onClick={() => setCi(i)}
                onMouseEnter={() => setCi(i)}
              >
                <span
                  className={`h-5 w-5 rounded-full border transition-transform duration-micro ${i === ci ? "scale-110 border-ink ring-2 ring-ink ring-offset-2 ring-offset-surface" : "border-line-strong"}`}
                  style={{ background: c.pattern === "tortoise" ? `radial-gradient(circle at 30% 30%, ${c.temple} 0 30%, ${c.rim} 31%)` : c.rim }}
                />
              </button>
            ))}
          </div>
          <div className="relative z-10 flex items-center gap-1">
            {onTry3D ? (
              <button
                className="flex min-h-[40px] items-center gap-1.5 px-2 text-sm font-semibold transition-colors hover:text-accent"
                onClick={() => onTry3D(p, ci)}
                aria-label={`Try ${p.name} in 3D`}
              >
                <Icon name="cube" size={18} /> 3D
              </button>
            ) : null}
            <button
              className={`flex min-h-[40px] items-center gap-1.5 border px-2.5 text-sm font-semibold transition-colors duration-micro ${inCompare ? "border-ink bg-ink text-paper" : "border-line-strong hover:border-ink"}`}
              aria-pressed={inCompare}
              aria-label={inCompare ? `Remove ${p.name} from compare` : `Add ${p.name} to compare`}
              onClick={onCompare}
            >
              <Icon name={inCompare ? "check" : "compare"} size={18} /> Compare
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
