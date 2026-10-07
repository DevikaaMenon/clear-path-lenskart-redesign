import type { Coating, LensOption, Prescription } from "@prisma/client";
import { priceOrder, type PriceItemInput, type PurposeId } from "../pricing";
import type { Colour } from "../catalogue";
import { prisma } from "./db";
import { activeOffers, toDTO } from "./repo";

export interface CartItemView {
  id: string;
  productId: string;
  slug: string;
  name: string;
  modelCode: string;
  shape: string;
  frameType: string;
  material: string;
  lensWidthMm: number;
  bridgeMm: number;
  templeMm: number;
  colours: Colour[];
  colourIndex: number;
  size: string;
  sizeMeasure: { lensWidthMm: number; bridgeMm: number; templeMm: number } | null;
  stock: number;
  purpose: string;
  lens: { id: string; name: string; price: number; needsPrescription: boolean };
  coating: { id: string; name: string; price: number } | null;
  framePrice: number;
  prescription: { id: string; mode: string; validated: boolean } | null;
  needsPrescription: boolean;
  quantity: number;
}

export const toPriceInput = (
  i: { framePrice: number; name: string; size: string; lens: { id: string; name: string; price: number }; purpose: string; coating: { id: string; name: string; price: number } | null; quantity: number },
): PriceItemInput => ({
  frame: { name: i.name, basePrice: i.framePrice },
  size: i.size,
  lens: { id: i.lens.id, name: i.lens.name, price: i.lens.price, purpose: i.purpose as PurposeId },
  coating: i.coating,
  quantity: i.quantity,
});

export async function getOrCreateCart(ownerKey: string) {
  return prisma.cart.upsert({ where: { ownerKey }, create: { ownerKey }, update: {} });
}

export async function cartView(ownerKey: string, codeOverride?: string | null) {
  const cart = await prisma.cart.findUnique({
    where: { ownerKey },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: { product: { include: { sizes: true } }, lensOption: true, coating: true, prescription: true },
      },
    },
  });
  const offers = await activeOffers();
  const items: CartItemView[] = (cart?.items ?? []).map((ci) => {
    const p = toDTO(ci.product);
    const size = p.sizes.find((s) => s.label === ci.size) ?? null;
    const colourIndex = Math.max(0, p.colours.findIndex((c) => c.name === ci.colour));
    return {
      id: ci.id,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      modelCode: p.modelCode,
      shape: p.shape,
      frameType: p.frameType,
      material: p.material,
      lensWidthMm: size?.lensWidthMm ?? p.lensWidthMm,
      bridgeMm: size?.bridgeMm ?? p.bridgeMm,
      templeMm: size?.templeMm ?? p.templeMm,
      colours: p.colours,
      colourIndex,
      size: ci.size,
      sizeMeasure: size ? { lensWidthMm: size.lensWidthMm, bridgeMm: size.bridgeMm, templeMm: size.templeMm } : null,
      stock: size?.stock ?? 0,
      purpose: ci.purpose,
      lens: lensView(ci.lensOption),
      coating: ci.coating ? coatingView(ci.coating) : null,
      framePrice: p.basePrice,
      prescription: ci.prescription ? rxView(ci.prescription) : null,
      needsPrescription: ci.lensOption.needsPrescription,
      quantity: ci.quantity,
    };
  });
  const code = codeOverride !== undefined ? codeOverride : cart?.offerCode ?? null;
  const pricing = priceOrder(items.map(toPriceInput), offers, code);
  return {
    cartId: cart?.id ?? null,
    items,
    offerCode: code,
    pricing,
    count: items.reduce((n, i) => n + i.quantity, 0),
    offers: offers.filter((o) => o.autoApply).map((o) => ({ id: o.id, label: o.label, explanation: o.explanation })),
  };
}

const lensView = (l: LensOption) => ({ id: l.id, name: l.name, price: l.price, needsPrescription: l.needsPrescription });
const coatingView = (c: Coating) => ({ id: c.id, name: c.name, price: c.price });
const rxView = (r: Prescription) => ({ id: r.id, mode: r.mode, validated: r.validated });

export type CartView = Awaited<ReturnType<typeof cartView>>;

/** Validate a configuration against the database. Returns an error message or the resolved rows. */
export async function resolveConfig(input: { productId: string; size: string; colour: string; purpose: string; lensOptionId: string; coatingId?: string | null }) {
  const product = await prisma.product.findUnique({ where: { id: input.productId }, include: { sizes: true } });
  if (!product) return { error: "That frame no longer exists." } as const;
  const size = product.sizes.find((s) => s.label === input.size);
  if (!size) return { error: `Size ${input.size} isn't made for ${product.canonicalName}.`, field: "size" } as const;
  if (size.stock <= 0) return { error: `Size ${input.size} of ${product.canonicalName} is out of stock. Choose another size.`, field: "size" } as const;
  const colours: Colour[] = JSON.parse(product.colours);
  if (!colours.some((c) => c.name === input.colour)) return { error: "Choose one of the colours shown.", field: "colour" } as const;
  const lens = await prisma.lensOption.findUnique({ where: { id: input.lensOptionId } });
  if (!lens || lens.purpose !== input.purpose) return { error: "Choose a lens that matches what the glasses are for.", field: "lens" } as const;
  let coating: Coating | null = null;
  if (input.coatingId) {
    coating = await prisma.coating.findUnique({ where: { id: input.coatingId } });
    if (!coating) return { error: "That coating isn't available.", field: "coating" } as const;
  }
  return { product, size, lens, coating } as const;
}
