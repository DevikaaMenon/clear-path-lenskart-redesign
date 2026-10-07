import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/product/ProductView";
import { activeOffers, lensCatalogue, productBySlug } from "@/lib/server/repo";
import { getOwner } from "@/lib/server/session";
import { prisma } from "@/lib/server/db";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const p = await productBySlug(slug);
  // U5: the canonical name is the page title too.
  return p ? { title: p.name, description: `${p.name} (${p.modelCode}): ${p.description}` } : { title: "Frame not found" };
}

export default async function ProductPage({ params, searchParams }: P) {
  const { slug } = await params;
  const sp = await searchParams;
  const product = await productBySlug(slug);
  if (!product) notFound();
  const [{ lenses, coatings }, offers] = await Promise.all([lensCatalogue(), activeOffers()]);

  let edit = null;
  if (sp.edit) {
    const { ownerKey } = await getOwner();
    const item = await prisma.cartItem.findFirst({ where: { id: sp.edit, productId: product.id, cart: { ownerKey } } });
    if (item) edit = { id: item.id, size: item.size, colour: item.colour, purpose: item.purpose, lensOptionId: item.lensOptionId, coatingId: item.coatingId };
  }
  const colour = Number.parseInt(sp.colour ?? "0", 10);

  return (
    <ProductView
      key={product.id + (edit?.id ?? "")}
      product={product}
      lenses={lenses}
      coatings={coatings}
      offers={offers}
      initialNeed={sp.need ?? null}
      initialColour={Number.isFinite(colour) && colour >= 0 ? colour : 0}
      edit={edit}
    />
  );
}
