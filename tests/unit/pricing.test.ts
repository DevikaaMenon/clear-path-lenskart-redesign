import { describe, expect, it } from "vitest";
import { evaluateOffer, formatINR, normaliseCode, price, priceOrder, type OfferDef, type PriceItemInput } from "@/lib/pricing";
import { OFFERS } from "../../prisma/data/catalogue";

const offers = OFFERS as unknown as OfferDef[];
const frame = (basePrice: number) => ({ name: "Test Frame", basePrice });
const rx = { id: "rx-standard", name: "Single vision, standard", price: 800, purpose: "prescription" as const };
const thin = { id: "rx-thin", name: "Single vision, thin", price: 2200, purpose: "prescription" as const };
const pc = { id: "pc-zero", name: "Blue-light filter", price: 900, purpose: "computer" as const };
const coat = { id: "anti-glare", name: "Anti-glare coating", price: 400 };

describe("price()", () => {
  it("adds frame, lens and coating into lines and a subtotal", () => {
    const r = price(frame(1500), "M", rx, coat, []);
    expect(r.lines.map((l) => l.amount)).toEqual([1500, 800, 400]);
    expect(r.lines[0].label).toBe("Frame (size M)");
    expect(r.subtotal).toBe(2700);
    expect(r.total).toBe(2700);
    expect(r.appliedOffer).toBeNull();
  });

  it("explains when no offer applies (no hidden costs)", () => {
    const r = price(frame(1500), "M", rx, null, []);
    expect(r.explanation).toMatch(/No offer applies/);
    expect(r.explanation).toMatch(/no extra charges/);
  });

  it("auto-applies 10% off the frame for small orders, with a plain explanation", () => {
    const r = price(frame(1500), "M", rx, null, offers);
    expect(r.appliedOffer?.id).toBe("auto-frame10");
    expect(r.discount).toBe(150);
    expect(r.total).toBe(2150);
    expect(r.explanation).toMatch(/saves you ₹150/);
    expect(r.explanation).toMatch(/Only one offer applies/);
  });

  it("caps the frame offer at ₹500", () => {
    const r = price(frame(6000), "M", rx, null, offers.filter((o) => o.id === "auto-frame10"));
    expect(r.discount).toBe(500);
  });

  it("switches to ₹600 off once the order reaches ₹3,500 (an offer that changes the total)", () => {
    const below = price(frame(1299), "M", thin, null, offers);
    expect(below.subtotal).toBe(3499);
    expect(below.appliedOffer?.id).toBe("auto-frame10");
    const above = price(frame(1299), "M", thin, { id: "h", name: "Repellent", price: 300 }, offers);
    expect(above.appliedOffer?.id).toBe("auto-flat600");
    expect(above.total).toBe(3799 - 600);
  });

  it("makes the coating free for computer glasses when that is the best offer", () => {
    const r = price(frame(1000), "M", pc, { id: "blue-anti-glare", name: "Blue + anti-glare", price: 700 }, offers);
    expect(r.appliedOffer?.id).toBe("auto-screen-coat");
    expect(r.discount).toBe(700);
  });

  it("applies only one offer per order: the biggest saving", () => {
    const r = price(frame(4000), "M", pc, coat, offers);
    expect(r.discount).toBe(600);
    expect(r.appliedOffer?.id).toBe("auto-flat600");
  });
});

describe("offer codes", () => {
  it("uses a code only if it saves more, and says so otherwise", () => {
    const r = price(frame(1500), "M", rx, null, offers, "welcome200");
    expect(r.codeStatus?.status).toBe("applied");
    expect(r.discount).toBe(200);
    const worse = price(frame(4000), "M", thin, null, offers, "WELCOME200");
    expect(worse.codeStatus?.status).toBe("not-better");
    expect(worse.codeStatus?.message).toMatch(/kept that one/);
    expect(worse.discount).toBe(600);
  });

  it("caps STUDENT15 at ₹1,000", () => {
    const r = price(frame(5000), "M", { ...thin, price: 3900 }, null, offers, "STUDENT15");
    expect(r.discount).toBe(1000);
    expect(r.appliedOffer?.code).toBe("STUDENT15");
  });

  it("reports unknown codes in plain language without changing the total", () => {
    const r = price(frame(1500), "M", rx, null, offers, "NOPE");
    expect(r.codeStatus?.status).toBe("invalid");
    expect(r.total).toBe(2150);
  });

  it("explains why an eligible-looking code cannot be used", () => {
    const limited: OfferDef = { id: "c", code: "BIG", autoApply: false, label: "Big", explanation: "x", rules: { kind: "flat", amount: 100, minSubtotal: 10000 } };
    const r = price(frame(1500), "M", rx, null, [limited], "BIG");
    expect(r.codeStatus?.status).toBe("not-eligible");
    expect(r.codeStatus?.message).toMatch(/₹10,000 or more/);
  });

  it("normalises codes", () => {
    expect(normaliseCode("  student15 ")).toBe("STUDENT15");
    expect(normaliseCode("   ")).toBeNull();
  });
});

describe("priceOrder() for a bag", () => {
  const items: PriceItemInput[] = [
    { frame: { name: "A", basePrice: 1500 }, size: "M", lens: rx, coating: null },
    { frame: { name: "B", basePrice: 2000 }, size: "L", lens: pc, coating: coat },
  ];
  it("sums items and labels lines by frame name", () => {
    const r = priceOrder(items, []);
    expect(r.subtotal).toBe(1500 + 800 + 2000 + 900 + 400);
    expect(r.lines[0].label).toBe("A (M)");
  });
  it("never discounts more than the subtotal and never goes negative", () => {
    const huge: OfferDef = { id: "x", code: null, autoApply: true, label: "x", explanation: "x", rules: { kind: "flat", amount: 99999 } };
    const r = priceOrder(items, [huge]);
    expect(r.total).toBe(0);
    expect(r.discount).toBe(r.subtotal);
  });
  it("handles an empty bag", () => {
    const r = priceOrder([], offers);
    expect(r.total).toBe(0);
    expect(r.appliedOffer).toBeNull();
    expect(evaluateOffer(offers[0], []).reason).toMatch(/empty/);
  });
  it("respects quantity", () => {
    const r = priceOrder([{ ...items[0], quantity: 2 }], []);
    expect(r.subtotal).toBe(2 * 2300);
  });
});

describe("formatINR", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(125000)).toBe("₹1,25,000");
    expect(formatINR(999)).toBe("₹999");
  });
});
