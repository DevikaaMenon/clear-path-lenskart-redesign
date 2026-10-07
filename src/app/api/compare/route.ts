import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, ok } from "@/lib/server/api";
import { productsByIds } from "@/lib/server/repo";

const ids = z.array(z.string().regex(/^[a-z0-9]{1,40}$/i)).min(1).max(3);

/** GET /api/compare?ids=a,b,c → up to three full products, in the order given. */
export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const parsed = ids.safeParse(raw);
  if (!parsed.success) return apiError(400, "bad_ids", "Choose between one and three frames to compare.");
  const products = await productsByIds(parsed.data);
  return ok({ products, missing: parsed.data.filter((id) => !products.some((p) => p.id === id)) });
}
