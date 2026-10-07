import type { Product, ProductSize } from "@prisma/client";
import type { ProductDTO } from "../catalogue";
import type { OfferDef } from "../pricing";
import { prisma } from "./db";

type Row = Product & { sizes: ProductSize[] };

const SIZE_ORDER = ["S", "M", "L"];

export function toDTO(p: Row): ProductDTO {
  return {
    id: p.id,
    slug: p.slug,
    name: p.canonicalName,
    modelCode: p.modelCode,
    shape: p.shape,
    frameType: p.frameType,
    material: p.material,
    weightG: p.weightG,
    lensWidthMm: p.lensWidthMm,
    bridgeMm: p.bridgeMm,
    templeMm: p.templeMm,
    sizeBand: p.sizeBand,
    audience: p.audience,
    brand: p.brand,
    collection: p.collection,
    colours: JSON.parse(p.colours),
    basePrice: p.basePrice,
    tags: JSON.parse(p.tags),
    needs: JSON.parse(p.needs),
    faceShapes: JSON.parse(p.faceShapes),
    description: p.description,
    popularity: p.popularity,
    createdAt: p.createdAt.toISOString(),
    sizes: [...p.sizes]
      .sort((a, b) => SIZE_ORDER.indexOf(a.label) - SIZE_ORDER.indexOf(b.label))
      .map((s) => ({ label: s.label, lensWidthMm: s.lensWidthMm, bridgeMm: s.bridgeMm, templeMm: s.templeMm, stock: s.stock })),
  };
}

export async function allProducts(): Promise<ProductDTO[]> {
  const rows = await prisma.product.findMany({ include: { sizes: true } });
  return rows.map(toDTO);
}

export async function productBySlug(slug: string): Promise<ProductDTO | null> {
  const row = await prisma.product.findUnique({ where: { slug }, include: { sizes: true } });
  return row ? toDTO(row) : null;
}

export async function productsByIds(ids: string[]): Promise<ProductDTO[]> {
  const rows = await prisma.product.findMany({ where: { id: { in: ids } }, include: { sizes: true } });
  return ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean).map((r) => toDTO(r!));
}

export async function activeOffers(): Promise<OfferDef[]> {
  const rows = await prisma.offer.findMany({ where: { active: true } });
  return rows.map((o) => ({
    id: o.id, code: o.code, label: o.label, explanation: o.explanation, autoApply: o.autoApply, rules: JSON.parse(o.rules),
  }));
}

export async function lensCatalogue() {
  const [lenses, coatings] = await Promise.all([
    prisma.lensOption.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.coating.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return { lenses, coatings };
}
