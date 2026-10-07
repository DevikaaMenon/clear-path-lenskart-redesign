"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import type { CartView as CartData, CartItemView } from "@/lib/server/cart-service";
import { formatINR } from "@/lib/pricing";
import { PURPOSES } from "@/lib/taxonomy";
import { api, ApiError } from "@/lib/client/api";
import { useShop } from "../providers/ShopProvider";
import { FrameIllustration, frameAlt, type Tint } from "../frames/FrameIllustration";
import { Button, ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { TrustStrip } from "../ui/TrustStrip";
import { EmptyState } from "../ui/EmptyState";
import { RollingPrice } from "../ui/RollingNumber";
import { Input } from "../ui/Field";

const purposeLabel = (id: string) => PURPOSES.find((p) => p.id === id)?.label ?? id;

export function OrderSummary({ data, compact = false }: { data: CartData; compact?: boolean }) {
  const r = data.pricing;
  return (
    <section aria-labelledby="summary-title" className="border border-ink bg-surface">
      <h2 id="summary-title" className="border-b border-line px-4 py-3 font-sans text-base font-bold">Order summary</h2>
      <dl className="flex flex-col gap-1.5 px-4 py-3">
        {!compact
          ? data.items.map((i) => (
              <div key={i.id} className="flex justify-between gap-3">
                <dt className="min-w-0 truncate">{i.name}</dt>
                <dd className="num">{formatINR(i.framePrice + i.lens.price + (i.coating?.price ?? 0))}</dd>
              </div>
            ))
          : null}
        <div className="flex justify-between gap-3 border-t border-line pt-1.5">
          <dt>Subtotal ({data.count} {data.count === 1 ? "item" : "items"})</dt>
          <dd><RollingPrice value={r.subtotal} /></dd>
        </div>
        {r.discount ? (
          <div className="flex justify-between gap-3 font-semibold text-success">
            <dt className="flex items-center gap-1.5"><Icon name="check" size={16} /> {r.appliedOffer?.label}</dt>
            <dd><RollingPrice value={r.discount} prefix="−" /></dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3 text-muted">
          <dt>Shipping</dt><dd className="num">Free</dd>
        </div>
      </dl>
      <div className="flex items-baseline justify-between border-t border-ink px-4 py-3">
        <span className="font-bold">Total to pay</span>
        <span className="text-2xl font-bold" data-testid="cart-total"><RollingPrice value={r.total} /></span>
      </div>
      <p className="flex gap-2 border-t border-line px-4 py-3 text-sm text-muted" data-testid="offer-explanation">
        <Icon name="info" size={18} className="mt-0.5 shrink-0 text-accent" />
        <span>{r.explanation}</span>
      </p>
    </section>
  );
}

export function CartView({ initial }: { initial: CartData }) {
  const reduce = useReducedMotion();
  const { setCartCount, toast, announce } = useShop();
  const [data, setData] = useState(initial);
  const [code, setCode] = useState(initial.offerCode ?? "");
  const [codeOpen, setCodeOpen] = useState(!!initial.offerCode);
  const [codeBusy, setCodeBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (d: CartData) => {
    setData(d);
    setCartCount(d.count);
  };

  const remove = async (item: CartItemView) => {
    const before = data;
    // Optimistic: the item leaves immediately; rolled back if the server fails.
    setData({ ...data, items: data.items.filter((i) => i.id !== item.id), count: data.count - item.quantity });
    try {
      const res = await api<CartData & { removed: Record<string, unknown> }>("/api/cart", { method: "DELETE", body: { itemId: item.id } });
      update(res);
      announce(`${item.name} removed from your bag`);
      toast({
        title: `Removed ${item.name}`,
        body: "Changed your mind?",
        icon: "trash",
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              const back = await api<CartData>("/api/cart", { method: "POST", body: res.removed });
              update(back);
              announce(`${item.name} is back in your bag`);
            } catch (e) {
              toast({ title: "Couldn't restore it", body: e instanceof ApiError ? e.message : "Please add it again from the product page.", tone: "danger", icon: "alert" });
            }
          },
        },
      });
    } catch (e) {
      setData(before);
      toast({ title: "Couldn't remove it", body: e instanceof ApiError ? e.message : "Please try again.", tone: "danger", icon: "alert" });
    }
  };

  const applyCode = async (value: string | null) => {
    setCodeBusy(true);
    setError(null);
    try {
      update(await api<CartData>("/api/cart", { method: "PATCH", body: { offerCode: value } }));
      if (!value) setCode("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't check that code.");
    } finally {
      setCodeBusy(false);
    }
  };

  if (!data.items.length) {
    return (
      <div className="page py-12">
        <h1 className="font-display text-5xl">Your bag</h1>
        <div className="mt-8">
          <EmptyState icon="bag" title="Your bag is empty" body="Start with what your glasses are for, and we'll show frames that suit it.">
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/" variant="primary" iconRight="arrow-right">Choose what they&apos;re for</ButtonLink>
              <ButtonLink href="/wishlist" variant="secondary" icon="heart">See your wishlist</ButtonLink>
            </div>
          </EmptyState>
        </div>
      </div>
    );
  }

  const cs = data.pricing.codeStatus;
  const missingRx = data.items.filter((i) => i.needsPrescription && !i.prescription);

  return (
    <div className="page pb-16 pt-10 md:pt-14">
      <p className="eyebrow">Step 3 · Review</p>
      <h1 className="mt-2 font-display text-5xl">Your bag</h1>
      <div className="grid-page mt-8 gap-y-8">
        <div className="col-span-4 md:col-span-8 xl:col-span-7">
          <ul className="border-t border-ink" aria-label="Items in your bag">
            <AnimatePresence initial={false}>
              {data.items.map((i) => {
                const colour = i.colours[i.colourIndex];
                const lineTotal = i.framePrice + i.lens.price + (i.coating?.price ?? 0);
                return (
                  <motion.li
                    key={i.id}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, x: -60, height: 0, marginTop: 0, transition: { duration: 0.32, ease: [0.4, 0, 1, 1] } }}
                    className="overflow-hidden border-b border-line"
                    data-testid="cart-item"
                  >
                    <div className="grid grid-cols-[96px_1fr] gap-4 py-5 sm:grid-cols-[160px_1fr]">
                      <Link href={`/frames/${i.slug}`} className="block border border-line bg-surface" aria-hidden="true" tabIndex={-1}>
                        <FrameIllustration frame={i} colour={colour} tint={i.purpose as Tint} decorative className="aspect-[16/10] w-full p-2" />
                      </Link>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h2 className="font-display text-2xl leading-tight"><Link href={`/frames/${i.slug}`} className="hover:underline hover:decoration-1 hover:underline-offset-4">{i.name}</Link></h2>
                          <span className="num text-lg font-bold">{formatINR(lineTotal)}</span>
                        </div>
                        <span className="sr-only">{frameAlt(i, colour.name)}</span>
                        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
                          <dt className="text-muted">Colour</dt><dd>{colour.name}</dd>
                          <dt className="text-muted">Size</dt><dd className="num">{i.size} · {i.lensWidthMm}□{i.bridgeMm} {i.templeMm}</dd>
                          <dt className="text-muted">Lenses for</dt><dd>{purposeLabel(i.purpose)}</dd>
                          <dt className="text-muted">Lens</dt><dd>{i.lens.name} <span className="num text-muted">({i.lens.price ? formatINR(i.lens.price) : "included"})</span></dd>
                          <dt className="text-muted">Coating</dt><dd>{i.coating ? <>{i.coating.name} <span className="num text-muted">({formatINR(i.coating.price)})</span></> : "None"}</dd>
                          {i.needsPrescription ? (
                            <>
                              <dt className="text-muted">Prescription</dt>
                              <dd>
                                {i.prescription ? (
                                  <span className="flex items-center gap-1 text-success"><Icon name="check" size={16} />{i.prescription.mode === "manual" ? "Entered and checked" : i.prescription.mode === "upload" ? "Uploaded, optometrist will check" : "Sending later"}</span>
                                ) : (
                                  <Link href={`/prescription/${i.id}`} className="link">Add prescription</Link>
                                )}
                              </dd>
                            </>
                          ) : null}
                        </dl>
                        {i.stock <= 0 ? <p className="mt-2 text-sm font-semibold text-danger">Size {i.size} has just sold out. Edit the size to continue.</p> : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <ButtonLink href={`/frames/${i.slug}?edit=${i.id}`} variant="secondary" size="sm" icon="edit" aria-label={`Edit lenses for ${i.name}`}>Edit lenses</ButtonLink>
                          <Button variant="ghost" size="sm" icon="trash" onClick={() => remove(i)} aria-label={`Remove ${i.name} from bag`}>Remove</Button>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          {missingRx.length ? (
            <p className="mt-4 flex gap-2 border-l-2 border-accent bg-accent-soft px-3 py-2 text-sm">
              <Icon name="info" size={18} className="mt-0.5 shrink-0 text-accent" />
              You can check out now and add your prescription after ordering. We only make lenses once we have it.
            </p>
          ) : null}
        </div>

        <aside className="col-span-4 md:col-span-8 xl:col-span-5" aria-label="Summary and checkout">
          <div className="flex flex-col gap-4 xl:sticky xl:top-[calc(var(--header-h)+24px)]">
            <OrderSummary data={data} />

            {/* Optional, secondary code field (X7) */}
            <div className="border border-line bg-surface">
              <button className="flex min-h-[48px] w-full items-center justify-between px-4 text-left text-sm font-semibold" aria-expanded={codeOpen} onClick={() => setCodeOpen((v) => !v)}>
                Have an offer code? (optional)
                <Icon name="chevron-down" size={18} className={`transition-transform ${codeOpen ? "rotate-180" : ""}`} />
              </button>
              {codeOpen ? (
                <form className="flex flex-col gap-2 border-t border-line px-4 pb-4 pt-3" onSubmit={(e) => { e.preventDefault(); applyCode(code.trim() || null); }}>
                  <div className="flex items-end gap-2">
                    <Input label="Offer code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} shellClassName="flex-1" autoComplete="off" hint="We apply the best offer automatically. A code only replaces it if it saves you more." />
                    <Button type="submit" variant="secondary" loading={codeBusy}>Apply</Button>
                  </div>
                  {cs ? (
                    <p role="status" className={`flex gap-1.5 text-sm ${cs.status === "applied" ? "text-success" : cs.status === "not-better" ? "text-ink" : "text-danger"}`}>
                      <Icon name={cs.status === "applied" ? "check" : "info"} size={18} className="mt-0.5 shrink-0" /> {cs.message}
                    </p>
                  ) : null}
                  {data.offerCode ? <button type="button" className="self-start text-sm font-semibold text-muted underline underline-offset-4" onClick={() => applyCode(null)}>Remove code</button> : null}
                  {error ? <p role="alert" className="text-sm font-semibold text-danger">{error}</p> : null}
                </form>
              ) : null}
            </div>

            <ButtonLink href="/checkout" variant="primary" size="lg" full iconRight="arrow-right" data-testid="go-checkout" aria-disabled={data.items.some((i) => i.stock <= 0)}>
              Check out · {formatINR(data.pricing.total)}
            </ButtonLink>
            <p className="text-center text-sm text-muted">No account needed. Guest checkout in three short steps.</p>
            <TrustStrip compact />
          </div>
        </aside>
      </div>
    </div>
  );
}
