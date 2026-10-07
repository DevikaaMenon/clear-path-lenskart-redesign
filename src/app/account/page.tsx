import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountView } from "@/components/account/AccountView";
import { prisma } from "@/lib/server/db";
import { getOwner } from "@/lib/server/session";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { user } = await getOwner();
  const orders = user
    ? (await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { _count: { select: { items: true } } } })).map((o) => ({
        id: o.id, number: o.number, total: o.total, createdAt: o.createdAt.toISOString(), items: o._count.items,
      }))
    : [];
  return (
    <Suspense fallback={null}>
      <AccountView user={user ? { name: user.name, email: user.email } : null} orders={orders} />
    </Suspense>
  );
}
