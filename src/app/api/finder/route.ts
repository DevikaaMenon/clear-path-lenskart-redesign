import { finderSchema, recommend } from "@/lib/finder";
import { toSearch } from "@/lib/catalogue";
import { ok, readJson, zodError } from "@/lib/server/api";
import { allProducts } from "@/lib/server/repo";

/** POST /api/finder: Frame Finder answers → recommended filters, count and listing URL. */
export async function POST(req: Request) {
  const parsed = finderSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error, "Some answers couldn't be read.");
  const r = recommend(await allProducts(), parsed.data);
  return ok({ ...r, href: `/shop${toSearch(r.query)}` });
}
