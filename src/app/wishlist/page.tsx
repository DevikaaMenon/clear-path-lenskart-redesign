import type { Metadata } from "next";
import { WishlistView } from "@/components/catalogue/WishlistView";
import { prisma } from "@/lib/server/db";
import { getOwner } from "@/lib/server/session";
import { productsByIds } from "@/lib/server/repo";
import { toCard } from "@/lib/server/catalogue-service";

export const metadata: Metadata = { title: "Wishlist" };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const { ownerKey } = await getOwner();
  const rows = await prisma.wishlistItem.findMany({ where: { ownerKey }, orderBy: { createdAt: "desc" } });
  const items = (await productsByIds(rows.map((r) => r.productId))).map(toCard);
  return <WishlistView initial={items} />;
}
