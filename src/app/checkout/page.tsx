import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { cartView } from "@/lib/server/cart-service";
import { getOwner } from "@/lib/server/session";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const owner = await getOwner();
  const data = await cartView(owner.ownerKey);
  return <CheckoutView initial={data} user={owner.user ? { email: owner.user.email, name: owner.user.name } : null} />;
}
