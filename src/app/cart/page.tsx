import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { cartView } from "@/lib/server/cart-service";
import { getOwner } from "@/lib/server/session";

export const metadata: Metadata = { title: "Your bag" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const { ownerKey } = await getOwner();
  const data = await cartView(ownerKey);
  return <CartView initial={data} />;
}
