import { z } from "zod";
import { apiError, ok, readJson, zodError } from "@/lib/server/api";
import { prisma } from "@/lib/server/db";
import { getOwner } from "@/lib/server/session";
import { cartView, getOrCreateCart, resolveConfig } from "@/lib/server/cart-service";
import { formatINR, normaliseCode, price } from "@/lib/pricing";
import { activeOffers } from "@/lib/server/repo";

const PURPOSES = ["prescription", "computer", "reading", "sun", "zero-power"] as const;
const id = z.string().min(1).max(40);

const addSchema = z.object({
  productId: id,
  size: z.enum(["S", "M", "L"], { message: "Choose a size." }),
  colour: z.string().min(1).max(40),
  purpose: z.enum(PURPOSES, { message: "Choose what the lenses are for." }),
  lensOptionId: id,
  coatingId: id.nullable().optional(),
  prescriptionId: id.nullable().optional(),
  /** Total the client showed. If it differs from the server's, we say so instead of silently charging more. */
  shownTotal: z.number().int().nonnegative().optional(),
});

const patchSchema = z.union([
  z.object({
    itemId: id,
    size: z.enum(["S", "M", "L"]).optional(),
    colour: z.string().min(1).max(40).optional(),
    purpose: z.enum(PURPOSES).optional(),
    lensOptionId: id.optional(),
    coatingId: id.nullable().optional(),
  }),
  z.object({ offerCode: z.string().max(30).nullable() }),
]);

const deleteSchema = z.object({ itemId: id });

export async function GET(req: Request) {
  const { ownerKey } = await getOwner();
  const url = new URL(req.url);
  if (url.searchParams.get("summary") === "1") {
    const cart = await prisma.cart.findUnique({ where: { ownerKey }, include: { items: { select: { quantity: true } } } });
    return ok({ count: cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0 });
  }
  return ok(await cartView(ownerKey));
}

export async function POST(req: Request) {
  const parsed = addSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error, "Some choices are missing.");
  const d = parsed.data;
  const { ownerKey } = await getOwner();
  const r = await resolveConfig(d);
  if ("error" in r) return apiError(409, "invalid_config", r.error!, "field" in r && r.field ? { [r.field]: r.error! } : undefined);

  if (d.shownTotal !== undefined) {
    const server = price(
      { name: r.product.canonicalName, basePrice: r.product.basePrice },
      d.size,
      { id: r.lens.id, name: r.lens.name, price: r.lens.price, purpose: d.purpose },
      r.coating ? { id: r.coating.id, name: r.coating.name, price: r.coating.price } : null,
      await activeOffers(),
    );
    if (server.total !== d.shownTotal) {
      return apiError(409, "price_changed", `The price has changed to ${formatINR(server.total)} since this page loaded. Please check it before adding.`, { total: String(server.total) });
    }
  }

  if (d.prescriptionId) {
    const rx = await prisma.prescription.findFirst({ where: { id: d.prescriptionId, ownerKey } });
    if (!rx) return apiError(404, "not_found", "That prescription couldn't be found.");
  }
  const cart = await getOrCreateCart(ownerKey);
  const item = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: d.productId,
      size: d.size,
      colour: d.colour,
      purpose: d.purpose,
      lensOptionId: d.lensOptionId,
      coatingId: d.coatingId ?? null,
      prescriptionId: d.prescriptionId ?? null,
    },
  });
  const view = await cartView(ownerKey);
  return ok({ itemId: item.id, ...view }, { status: 201 });
}

export async function PATCH(req: Request) {
  const parsed = patchSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { ownerKey } = await getOwner();
  const cart = await getOrCreateCart(ownerKey);

  if ("offerCode" in parsed.data) {
    await prisma.cart.update({ where: { id: cart.id }, data: { offerCode: normaliseCode(parsed.data.offerCode) } });
    return ok(await cartView(ownerKey));
  }

  const d = parsed.data;
  const item = await prisma.cartItem.findFirst({ where: { id: d.itemId, cartId: cart.id } });
  if (!item) return apiError(404, "not_found", "That item is no longer in your bag.");
  const next = {
    productId: item.productId,
    size: d.size ?? item.size,
    colour: d.colour ?? item.colour,
    purpose: d.purpose ?? item.purpose,
    lensOptionId: d.lensOptionId ?? item.lensOptionId,
    coatingId: d.coatingId !== undefined ? d.coatingId : item.coatingId,
  };
  const r = await resolveConfig(next);
  if ("error" in r) return apiError(409, "invalid_config", r.error!);
  // Changing what the lenses are for invalidates an attached prescription only if the new lens doesn't need one.
  const keepRx = r.lens.needsPrescription ? item.prescriptionId : null;
  await prisma.cartItem.update({ where: { id: item.id }, data: { ...next, prescriptionId: keepRx } });
  return ok(await cartView(ownerKey));
}

export async function DELETE(req: Request) {
  const parsed = deleteSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { ownerKey } = await getOwner();
  const cart = await getOrCreateCart(ownerKey);
  const item = await prisma.cartItem.findFirst({ where: { id: parsed.data.itemId, cartId: cart.id } });
  if (!item) return apiError(404, "not_found", "That item is no longer in your bag.");
  await prisma.cartItem.delete({ where: { id: item.id } });
  // Return a snapshot so the client can offer Undo (re-adding the same configuration).
  return ok({
    removed: {
      productId: item.productId, size: item.size, colour: item.colour, purpose: item.purpose,
      lensOptionId: item.lensOptionId, coatingId: item.coatingId, prescriptionId: item.prescriptionId,
    },
    ...(await cartView(ownerKey)),
  });
}
