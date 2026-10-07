"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import type { CardDTO } from "@/lib/server/catalogue-service";
import { needById } from "@/lib/taxonomy";
import { ProductCard } from "../catalogue/ProductCard";
import { Icon } from "../ui/Icon";

const Try3DDialog = dynamic(() => import("../three/Try3DDialog").then((m) => m.Try3DDialog), { ssr: false });

export function PopularFrames({
  items, need, total, offerTag, lensFrom,
}: { items: CardDTO[]; need: string | null; total: number; offerTag: string | null; lensFrom: number | null }) {
  const [try3d, setTry3d] = useState<{ p: CardDTO; ci: number } | null>(null);
  const n = needById(need);
  return (
    <section aria-labelledby="popular-title" className="page mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-4">
        <div>
          <p className="eyebrow">{n ? `For ${n.short.toLowerCase()} glasses` : "Across all needs"}</p>
          <h2 id="popular-title" className="font-display text-4xl">Popular right now</h2>
        </div>
        <Link href={n ? `/shop?need=${n.id}` : "/shop"} className="link inline-flex min-h-[44px] items-center gap-1">
          See all {total} {n ? n.label.toLowerCase() : "frames"} <Icon name="arrow-right" size={18} />
        </Link>
      </div>
      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((p) => (
          <li key={p.id}>
            <ProductCard p={p} need={need} offerTag={offerTag} lensFrom={lensFrom} onTry3D={(pp, ci) => setTry3d({ p: pp, ci })} />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted">“Popular” is ranked by this demo&apos;s synthetic popularity score, not real sales.</p>
      {try3d ? <Try3DDialog product={try3d.p} colourIndex={try3d.ci} need={need} onClose={() => setTry3d(null)} /> : null}
    </section>
  );
}
