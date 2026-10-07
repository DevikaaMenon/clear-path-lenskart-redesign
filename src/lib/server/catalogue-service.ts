import { dynamicOptions, parseQuery, runCatalogue, type CatalogueQuery, type ProductDTO } from "../catalogue";
import { allProducts } from "./repo";

export type CardDTO = Pick<
  ProductDTO,
  "id" | "slug" | "name" | "modelCode" | "shape" | "frameType" | "material" | "weightG" | "lensWidthMm" | "bridgeMm" | "templeMm" | "sizeBand" | "colours" | "basePrice" | "needs" | "audience"
> & { soldOut: boolean };

export const toCard = (p: ProductDTO): CardDTO => ({
  id: p.id, slug: p.slug, name: p.name, modelCode: p.modelCode, shape: p.shape, frameType: p.frameType,
  material: p.material, weightG: p.weightG, lensWidthMm: p.lensWidthMm, bridgeMm: p.bridgeMm, templeMm: p.templeMm,
  sizeBand: p.sizeBand, colours: p.colours, basePrice: p.basePrice, needs: p.needs, audience: p.audience,
  soldOut: !p.sizes.some((s) => s.stock > 0),
});

export async function searchCatalogue(input: URLSearchParams | Record<string, string | string[] | undefined>) {
  const q: CatalogueQuery = parseQuery(input);
  const products = await allProducts();
  const r = runCatalogue(products, q);
  return {
    query: q,
    items: r.items.map(toCard),
    total: r.total,
    page: r.page,
    pageCount: r.pageCount,
    facets: r.facets,
    active: r.active,
    suggestions: r.suggestions,
    options: dynamicOptions(products),
  };
}

export type CatalogueResponse = Awaited<ReturnType<typeof searchCatalogue>>;
