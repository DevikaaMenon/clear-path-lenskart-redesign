import { prisma } from "./db";

/** On sign-in, move the guest's bag and wishlist into the account so nothing is lost. */
export async function mergeGuestInto(userId: string, anonKey: string | null) {
  if (!anonKey) return;
  const userKey = `u:${userId}`;
  const guestCart = await prisma.cart.findUnique({ where: { ownerKey: anonKey }, include: { items: true } });
  if (guestCart?.items.length) {
    const userCart = await prisma.cart.upsert({ where: { ownerKey: userKey }, create: { ownerKey: userKey }, update: {} });
    await prisma.cartItem.updateMany({ where: { cartId: guestCart.id }, data: { cartId: userCart.id } });
  }
  const wish = await prisma.wishlistItem.findMany({ where: { ownerKey: anonKey } });
  for (const w of wish) {
    await prisma.wishlistItem.upsert({
      where: { ownerKey_productId: { ownerKey: userKey, productId: w.productId } },
      create: { ownerKey: userKey, productId: w.productId },
      update: {},
    });
  }
  await prisma.prescription.updateMany({ where: { ownerKey: anonKey }, data: { ownerKey: userKey } });
}
