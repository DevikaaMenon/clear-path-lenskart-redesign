"use client";

import Link from "next/link";
import { useState } from "react";
import type { CardDTO } from "@/lib/server/catalogue-service";
import { formatINR } from "@/lib/pricing";
import { Drawer } from "../ui/Drawer";
import { Try3DPanel } from "./Try3DPanel";

/** "Try in 3D" from the listing: quick look without leaving the results. */
export function Try3DDialog({ product, colourIndex, need, onClose }: { product: CardDTO; colourIndex: number; need: string | null; onClose: () => void }) {
  const [ci, setCi] = useState(colourIndex);
  const [open, setOpen] = useState(true);
  const close = () => {
    setOpen(false);
    window.setTimeout(onClose, 300);
  };
  const initialTint = need === "sun" || (product.needs.length === 1 && product.needs[0] === "sun") ? "grey" : need === "computer" ? "blue" : "clear";
  return (
    <Drawer
      open={open}
      onClose={close}
      side="center"
      wide
      title={`${product.name} in 3D`}
      description="Drag to turn it, or use the buttons. A preview only: colours and proportions are approximate."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="num text-lg font-bold">{formatINR(product.basePrice)} <span className="font-sans text-sm font-normal text-muted">frame</span></p>
          <Link
            href={`/frames/${product.slug}${need && product.needs.includes(need) ? `?need=${need}` : ""}`}
            className="inline-flex min-h-[48px] items-center gap-2 bg-ink px-5 font-semibold text-paper transition-[transform,box-shadow] duration-micro hover:bg-ink-2"
          >
            See details and lenses for {product.name}
          </Link>
        </div>
      }
    >
      <Try3DPanel product={product} colourIndex={ci} onColourChange={setCi} initialTint={initialTint} />
    </Drawer>
  );
}
