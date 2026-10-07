import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrescriptionFlow } from "@/components/prescription/PrescriptionFlow";
import { prisma } from "@/lib/server/db";
import { getOwner } from "@/lib/server/session";

export const metadata: Metadata = { title: "Add your prescription" };

export default async function PrescriptionPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const { ownerKey } = await getOwner();
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { ownerKey } },
    include: { product: true, lensOption: true },
  });
  if (!item) notFound();
  return (
    <PrescriptionFlow
      itemId={item.id}
      productName={item.product.canonicalName}
      purpose={item.purpose}
      lensName={item.lensOption.name}
      needsAdd={item.lensOptionId === "rx-progressive"}
    />
  );
}
