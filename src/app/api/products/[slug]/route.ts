import { apiError, ok } from "@/lib/server/api";
import { productBySlug } from "@/lib/server/repo";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return apiError(400, "bad_slug", "That product link isn't valid.");
  const product = await productBySlug(slug);
  if (!product) return apiError(404, "not_found", "We couldn't find that frame. It may have been removed.");
  return ok({ product });
}
