import { prisma } from "./db";
import { getOwner } from "./session";

/** Load an order only if it belongs to the current visitor (anonymous id or signed-in user). */
export async function loadOrder(id: string) {
  const owner = await getOwner();
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  const mine = order && (order.ownerKey === owner.ownerKey || order.ownerKey === owner.anonKey || (owner.user && order.userId === owner.user.id));
  return mine ? order : null;
}
