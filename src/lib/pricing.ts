/**
 * Shared pricing engine (Section 8.3).
 *
 * One pure function decides every price the user sees. It is imported by:
 *   - the product page (live price breakdown, client side)
 *   - the cart and checkout summaries
 *   - POST /api/price and POST /api/orders (server side, recalculated at order time)
 * so the UI and the server can never disagree.
 *
 * Money is integer rupees. No floating point totals.
 */

export type PurposeId = "prescription" | "computer" | "reading" | "sun" | "zero-power";

export interface OfferRules {
  /** percent: percent off a target; flat: fixed amount off; coating-free: coating price waived */
  kind: "percent" | "flat" | "coating-free";
  percent?: number;
  amount?: number;
  /** What the percent applies to. Defaults to "all". */
  target?: "frame" | "lenses" | "all";
  /** Order subtotal needed before the offer applies. */
  minSubtotal?: number;
  /** Upper limit on the discount. */
  maxDiscount?: number;
  /** Only items with one of these lens purposes count. */
  purposes?: PurposeId[];
}

export interface OfferDef {
  id: string;
  code: string | null;
  label: string;
  explanation: string;
  rules: OfferRules;
  autoApply: boolean;
}

export interface PriceItemInput {
  frame: { name: string; basePrice: number };
  size?: string;
  lens: { id: string; name: string; price: number; purpose: PurposeId };
  coating?: { id: string; name: string; price: number } | null;
  quantity?: number;
}

export type LineId = "frame" | "lens" | "coating";

export interface PriceLine {
  id: LineId;
  label: string;
  amount: number;
}

export type CodeStatus =
  | { code: string; status: "applied"; message: string }
  | { code: string; status: "not-better"; message: string }
  | { code: string; status: "not-eligible"; message: string }
  | { code: string; status: "invalid"; message: string };

export interface PriceResult {
  lines: PriceLine[];
  subtotal: number;
  discount: number;
  total: number;
  appliedOffer: { id: string; label: string; code: string | null } | null;
  /** Plain-language sentence explaining which offer applied and why. */
  explanation: string;
  codeStatus: CodeStatus | null;
}

export const formatINR = (amount: number): string =>
  "₹" + Math.round(amount).toLocaleString("en-IN");

const qty = (item: PriceItemInput) => Math.max(1, Math.floor(item.quantity ?? 1));

const itemFrame = (item: PriceItemInput) => item.frame.basePrice * qty(item);
const itemLenses = (item: PriceItemInput) => (item.lens.price + (item.coating?.price ?? 0)) * qty(item);

function subtotalOf(items: PriceItemInput[]): number {
  return items.reduce((sum, it) => sum + itemFrame(it) + itemLenses(it), 0);
}

/** Discount an offer gives on these items, or a reason it does not apply. */
export function evaluateOffer(
  offer: OfferDef,
  items: PriceItemInput[],
): { amount: number; reason?: string } {
  const r = offer.rules;
  const subtotal = subtotalOf(items);
  if (items.length === 0) return { amount: 0, reason: "Your bag is empty." };
  if (r.minSubtotal && subtotal < r.minSubtotal) {
    return {
      amount: 0,
      reason: `Needs an order of ${formatINR(r.minSubtotal)} or more (yours is ${formatINR(subtotal)}).`,
    };
  }
  const eligible = r.purposes ? items.filter((i) => r.purposes!.includes(i.lens.purpose)) : items;
  if (eligible.length === 0) {
    return { amount: 0, reason: "None of the items in your order qualify for this offer." };
  }

  let amount = 0;
  if (r.kind === "percent") {
    const base = eligible.reduce((sum, it) => {
      if (r.target === "frame") return sum + itemFrame(it);
      if (r.target === "lenses") return sum + itemLenses(it);
      return sum + itemFrame(it) + itemLenses(it);
    }, 0);
    amount = Math.round((base * (r.percent ?? 0)) / 100);
  } else if (r.kind === "flat") {
    amount = r.amount ?? 0;
  } else if (r.kind === "coating-free") {
    amount = eligible.reduce((sum, it) => sum + (it.coating?.price ?? 0) * qty(it), 0);
    if (amount === 0) return { amount: 0, reason: "Add a lens coating to use this offer." };
  }

  if (r.maxDiscount !== undefined) amount = Math.min(amount, r.maxDiscount);
  amount = Math.max(0, Math.min(amount, subtotal));
  return { amount };
}

export function normaliseCode(code: string | null | undefined): string | null {
  const c = (code ?? "").trim().toUpperCase();
  return c.length ? c : null;
}

/**
 * Price an order (one or more items).
 * Rules:
 *  1. The best eligible automatic offer is applied. Only one offer applies per order.
 *  2. A typed code replaces it only if it saves more. Otherwise we keep the better one and say so.
 */
export function priceOrder(
  items: PriceItemInput[],
  offers: OfferDef[],
  code?: string | null,
): PriceResult {
  const lines: PriceLine[] = [];
  const single = items.length === 1;
  for (const it of items) {
    const q = qty(it);
    const suffix = q > 1 ? ` × ${q}` : "";
    lines.push({
      id: "frame",
      label: single
        ? `Frame${it.size ? ` (size ${it.size})` : ""}${suffix}`
        : `${it.frame.name}${it.size ? ` (${it.size})` : ""}${suffix}`,
      amount: itemFrame(it),
    });
    lines.push({ id: "lens", label: `${it.lens.name}${suffix}`, amount: it.lens.price * q });
    if (it.coating) {
      lines.push({ id: "coating", label: `${it.coating.name}${suffix}`, amount: it.coating.price * q });
    }
  }
  const subtotal = subtotalOf(items);

  // 1. Best automatic offer
  let best: { offer: OfferDef; amount: number } | null = null;
  for (const o of offers) {
    if (!o.autoApply || o.code) continue;
    const { amount } = evaluateOffer(o, items);
    if (amount > 0 && (!best || amount > best.amount)) best = { offer: o, amount };
  }

  // 2. Optional code
  let codeStatus: CodeStatus | null = null;
  const typed = normaliseCode(code);
  if (typed) {
    const match = offers.find((o) => o.code && o.code.toUpperCase() === typed);
    if (!match) {
      codeStatus = { code: typed, status: "invalid", message: `We don't recognise the code ${typed}. Check the spelling, or keep the offer already applied.` };
    } else {
      const { amount, reason } = evaluateOffer(match, items);
      if (amount === 0) {
        codeStatus = { code: typed, status: "not-eligible", message: `${typed} can't be used on this order. ${reason ?? ""}`.trim() };
      } else if (best && amount <= best.amount) {
        codeStatus = {
          code: typed,
          status: "not-better",
          message: `${typed} would save ${formatINR(amount)}. The offer already applied saves ${formatINR(best.amount)}, so we kept that one.`,
        };
      } else {
        best = { offer: match, amount };
        codeStatus = { code: typed, status: "applied", message: `${typed} applied. It saves you ${formatINR(amount)}.` };
      }
    }
  }

  const discount = best?.amount ?? 0;
  const explanation = best
    ? `We applied “${best.offer.label}”. ${best.offer.explanation} It saves you ${formatINR(discount)}. Only one offer applies per order, and we always pick the one that saves you the most.`
    : subtotal === 0
      ? "Prices update as you choose options."
      : "No offer applies to this order. The total is the full price, with no extra charges at checkout.";

  return {
    lines,
    subtotal,
    discount,
    total: subtotal - discount,
    appliedOffer: best ? { id: best.offer.id, label: best.offer.label, code: best.offer.code } : null,
    explanation,
    codeStatus,
  };
}

/** Single-frame convenience wrapper with the signature from the brief. */
export function price(
  frame: PriceItemInput["frame"],
  size: string | undefined,
  lensOption: PriceItemInput["lens"],
  coating: PriceItemInput["coating"],
  offers: OfferDef[],
  code?: string | null,
): PriceResult {
  return priceOrder([{ frame, size, lens: lensOption, coating }], offers, code);
}

/** Shipping is always free in this concept; kept explicit so the summary can say so. */
export const SHIPPING_FEE = 0;
