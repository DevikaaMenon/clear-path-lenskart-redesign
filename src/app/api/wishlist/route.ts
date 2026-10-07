import { z } from "zod";
import { apiError, ok, readJson, zodError } from "@/lib/server/api";
import { prisma } from "@/lib/server/db";
import { getOwner } from "@/lib/server/session";
import { productsByIds, toDTO } from "@/lib/server/repo";
import { toCard } from "@/lib/server/catalogue-service";

const body = z.object({ productId: z.string().min(1).max(40) });

export async function GET(req: Request) {
  const { ownerKey } = await getOwner();
  const rows = await prisma.wishlistItem.findMany({ where: { ownerKey }, orderBy: { createdAt: "desc" } });
  const ids = rows.map((r) => r.productId);
  if (new URL(req.url).searchParams.get("full") === "1") {
    const products = await productsByIds(ids);
    return ok({ productIds: ids, items: products.map(toCard) });
  }
  return ok({ productIds: ids });
}

export async function POST(req: Request) {
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { ownerKey } = await getOwner();
  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId }, include: { sizes: true } });
  if (!product) return apiError(404, "not_found", "That frame no longer exists.");
  await prisma.wishlistItem.upsert({
    where: { ownerKey_productId: { ownerKey, productId: product.id } },
    create: { ownerKey, productId: product.id },
    update: {},
  });
  return ok({ saved: true, product: toCard(toDTO(product)) }, { status: 201 });
}

export async function DELETE(req: Request) {
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { ownerKey } = await getOwner();
  await prisma.wishlistItem.deleteMany({ where: { ownerKey, productId: parsed.data.productId } });
  return ok({ saved: false });
}
