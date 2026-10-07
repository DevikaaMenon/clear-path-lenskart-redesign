import { apiError, ok } from "@/lib/server/api";
import { prisma } from "@/lib/server/db";
import { getOwner } from "@/lib/server/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owner = await getOwner();
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  const mine = order && (order.ownerKey === owner.ownerKey || order.ownerKey === owner.anonKey || (owner.user && order.userId === owner.user.id));
  if (!order || !mine) return apiError(404, "not_found", "We couldn't find that order.");
  return ok({ order: { ...order, address: JSON.parse(order.address) } });
}
