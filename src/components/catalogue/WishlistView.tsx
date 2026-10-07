"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { CardDTO } from "@/lib/server/catalogue-service";
import { useShop } from "../providers/ShopProvider";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "../ui/EmptyState";
import { ButtonLink } from "../ui/Button";

export function WishlistView({ initial }: { initial: CardDTO[] }) {
  const { wishlist, wishlistReady } = useShop();
  const reduce = useReducedMotion();
  // Unsaving on this page removes the card (optimistic, follows the shared wishlist state).
  const shown = wishlistReady ? initial.filter((p) => wishlist.has(p.id)) : initial;
  return (
    <div className="page pb-16 pt-10 md:pt-14">
      <h1 className="font-display text-5xl">Wishlist</h1>
      <p className="mt-2 text-muted">Saved on this device{shown.length ? `: ${shown.length} ${shown.length === 1 ? "frame" : "frames"}` : ""}. Sign in to keep them across devices.</p>
      {shown.length ? (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {shown.map((p) => (
              <motion.li key={p.id} layout={!reduce} exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}>
                <ProductCard p={p} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState icon="heart" title="Nothing saved yet" body="Tap the heart on any frame to save it here.">
            <ButtonLink href="/shop" variant="primary" iconRight="arrow-right">Browse frames</ButtonLink>
          </EmptyState>
        </div>
      )}
    </div>
  );
}
