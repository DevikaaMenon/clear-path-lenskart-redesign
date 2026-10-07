import { randomInt } from "node:crypto";
import { apiError, ok, readJson, zodError } from "@/lib/server/api";
import { prisma } from "@/lib/server/db";
import { getOwner } from "@/lib/server/session";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { cartView } from "@/lib/server/cart-service";
import { COD_LIMIT, DEMO_DECLINE_CARD, DEMO_DECLINE_UPI, deliveryWindow, orderSchema } from "@/lib/checkout";
import { formatINR } from "@/lib/pricing";

const orderNumber = () => `CP-${new Date().getFullYear() % 100}${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;

/**
 * POST /api/orders. Idempotent: the same idempotencyKey always returns the same order,
 * so a retry after a network failure can never create a duplicate.
 * The server recalculates the price with the shared engine and rejects a mismatch.
 */
export async function POST(req: Request) {
  const limit = rateLimit(`order:${clientIp(req)}`, 20, 60_000);
  if (!limit.ok) return apiError(429, "rate_limited", `Too many attempts. Try again in ${limit.retryAfter} seconds.`);

  const parsed = orderSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error, "Some details need fixing before we can place your order.");
  const d = parsed.data;
  const owner = await getOwner();

  const existing = await prisma.order.findUnique({ where: { idempotencyKey: d.idempotencyKey } });
  if (existing) {
    if (existing.ownerKey !== owner.ownerKey) return apiError(409, "conflict", "This order request was already used.");
    return ok({ order: { id: existing.id, number: existing.number }, replayed: true });
  }

  const cart = await cartView(owner.ownerKey);
  if (!cart.items.length) return apiError(409, "empty_cart", "Your bag is empty. Add a frame before checking out.");
  const sold = cart.items.find((i) => i.stock <= 0);
  if (sold) return apiError(409, "out_of_stock", `Size ${sold.size} of ${sold.name} has just sold out. Go back to your bag to change the size.`);

  // Price consistency: never charge something the customer wasn't shown.
  if (cart.pricing.total !== d.shownTotal) {
    return apiError(409, "price_changed", `Your total has changed to ${formatINR(cart.pricing.total)}. Please review it before paying.`, { total: String(cart.pricing.total) });
  }

  // Simulated payment. No real gateway; card details are not stored.
  const p = d.payment;
  if (p.method === "cod" && cart.pricing.total > COD_LIMIT) {
    return apiError(422, "cod_limit", `Cash on delivery is available up to ${formatINR(COD_LIMIT)}. Choose another payment method.`, { method: "Cash on delivery isn't available for this amount." });
  }
  if ((p.method === "card" && p.cardNumber === DEMO_DECLINE_CARD) || (p.method === "upi" && p.upiId.toLowerCase() === DEMO_DECLINE_UPI)) {
    return apiError(402, "payment_declined", "Your payment was declined by the bank (demo). You haven't been charged. Try again or choose another method.");
  }

  const win = deliveryWindow();
  const order = await prisma.$transaction(async (tx) => {
    // Re-check and decrement stock atomically.
    for (const i of cart.items) {
      const res = await tx.productSize.updateMany({
        where: { productId: i.productId, label: i.size, stock: { gte: i.quantity } },
        data: { stock: { decrement: i.quantity } },
      });
      if (res.count === 0) throw new Error(`OUT:${i.name}:${i.size}`);
    }
    const created = await tx.order.create({
      data: {
        number: orderNumber(),
        idempotencyKey: d.idempotencyKey,
        ownerKey: owner.ownerKey,
        userId: owner.user?.id ?? null,
        email: d.contact.email,
        name: d.contact.name,
        phone: d.contact.phone,
        address: JSON.stringify(d.address),
        paymentMethod: p.method,
        status: p.method === "cod" ? "cod-confirmed" : "paid",
        subtotal: cart.pricing.subtotal,
        discount: cart.pricing.discount,
        total: cart.pricing.total,
        offerLabel: cart.pricing.appliedOffer?.label ?? null,
        deliveryFrom: win.from,
        deliveryTo: win.to,
        items: {
          create: cart.items.map((i) => ({
            productId: i.productId,
            productName: i.name,
            modelCode: i.modelCode,
            size: i.size,
            colour: i.colours[i.colourIndex].name,
            purpose: i.purpose,
            lensName: i.lens.name,
            coatingName: i.coating?.name ?? null,
            prescriptionId: i.prescription?.id ?? null,
            unitPrice: i.framePrice + i.lens.price + (i.coating?.price ?? 0),
            quantity: i.quantity,
          })),
        },
      },
    });
    if (cart.cartId) await tx.cartItem.deleteMany({ where: { cartId: cart.cartId } });
    if (cart.cartId) await tx.cart.update({ where: { id: cart.cartId }, data: { offerCode: null } });
    return created;
  }).catch((e: Error) => {
    if (e.message.startsWith("OUT:")) return { error: e.message.split(":") } as const;
    throw e;
  });

  if ("error" in order) {
    return apiError(409, "out_of_stock", `Size ${order.error[2]} of ${order.error[1]} has just sold out. Go back to your bag to change the size.`);
  }
  return ok({ order: { id: order.id, number: order.number } }, { status: 201 });
}
