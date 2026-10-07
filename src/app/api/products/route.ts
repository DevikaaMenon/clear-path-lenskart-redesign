import { NextRequest } from "next/server";
import { z } from "zod";
import { searchCatalogue } from "@/lib/server/catalogue-service";
import { apiError, ok } from "@/lib/server/api";

// Shape check only: unknown filter values are ignored by parseQuery, but absurd input is rejected.
const schema = z.object({
  q: z.string().max(80).optional(),
  page: z.string().regex(/^\d{1,3}$/, "Page must be a number.").optional(),
  sort: z.string().max(20).optional(),
}).passthrough();

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const parsed = schema.safeParse(Object.fromEntries(sp.entries()));
  if (!parsed.success) return apiError(400, "bad_query", "That search couldn't be understood.");
  for (const [, v] of sp.entries()) if (v.length > 200) return apiError(400, "bad_query", "Filter value too long.");
  const data = await searchCatalogue(sp);
  return ok(data, { headers: { "Cache-Control": "no-store" } });
}
