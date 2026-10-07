import { ok } from "@/lib/server/api";
import { prisma } from "@/lib/server/db";

export async function GET(req: Request) {
  const city = new URL(req.url).searchParams.get("city")?.slice(0, 40);
  const stores = await prisma.storeLocation.findMany({ where: city ? { city } : undefined, orderBy: [{ city: "asc" }, { name: "asc" }] });
  return ok({ stores });
}
