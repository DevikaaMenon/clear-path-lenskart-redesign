/**
 * Catalogue querying: filters, facet counts, sorting, pagination and
 * "relax one filter" suggestions for the empty state (S3, S4, X13).
 * Pure functions, unit-tested; the API runs them over the DB rows.
 */
import {
  ALL_FILTERS, FilterKey, MULTI_KEYS, PRICE_BANDS, SortId, SORTS, TOGGLE_KEYS, filterByKey,
} from "./taxonomy";

export interface Colour {
  name: string;
  family: string;
  rim: string;
  temple: string;
  pattern?: "tortoise" | "clear";
}

export interface SizeDTO {
  label: string;
  lensWidthMm: number;
  bridgeMm: number;
  templeMm: number;
  stock: number;
}

export interface ProductDTO {
  id: string;
  slug: string;
  name: string; // canonical name, used everywhere (U5)
  modelCode: string;
  shape: string;
  frameType: string;
  material: string;
  weightG: number;
  lensWidthMm: number;
  bridgeMm: number;
  templeMm: number;
  sizeBand: string;
  audience: string;
  brand: string;
  collection: string;
  colours: Colour[];
  basePrice: number;
  tags: string[];
  needs: string[];
  faceShapes: string[];
  description: string;
  popularity: number;
  createdAt: string;
  sizes: SizeDTO[];
}

export type CatalogueQuery = Partial<Record<FilterKey, string[]>> & {
  q?: string;
  sort?: SortId;
  page?: number;
  pageSize?: number;
};

const LIGHT_LIMIT_G = 15;

export const totalWidthMm = (p: Pick<ProductDTO, "lensWidthMm" | "bridgeMm">) =>
  p.lensWidthMm * 2 + p.bridgeMm + 10; // + endpieces

export const inStock = (p: ProductDTO) => p.sizes.some((s) => s.stock > 0);

/** Parse URLSearchParams into a typed query. Unknown values are ignored. */
export function parseQuery(params: URLSearchParams | Record<string, string | string[] | undefined>): CatalogueQuery {
  const get = (k: string): string[] => {
    if (params instanceof URLSearchParams) return params.getAll(k).flatMap((v) => v.split(","));
    const v = params[k];
    if (v === undefined) return [];
    return (Array.isArray(v) ? v : [v]).flatMap((x) => x.split(","));
  };
  const q: CatalogueQuery = {};
  for (const key of MULTI_KEYS) {
    const vals = get(key).map((s) => s.trim()).filter(Boolean);
    if (vals.length) q[key] = Array.from(new Set(vals));
  }
  for (const key of TOGGLE_KEYS) {
    const v = get(key)[0];
    if (v === "1" || v === "true") q[key] = ["1"];
  }
  const search = get("q")[0]?.trim();
  if (search) q.q = search.slice(0, 80);
  const sort = get("sort")[0];
  if (sort && SORTS.some((s) => s.id === sort)) q.sort = sort as SortId;
  const page = parseInt(get("page")[0] ?? "", 10);
  if (page > 0) q.page = page;
  return q;
}

/** Serialise a query back to a URL search string (stable order). */
export function toSearch(q: CatalogueQuery): string {
  const sp = new URLSearchParams();
  for (const f of ALL_FILTERS) {
    const vals = q[f.key];
    if (vals?.length) sp.set(f.key, vals.join(","));
  }
  if (q.q) sp.set("q", q.q);
  if (q.sort && q.sort !== "popular") sp.set("sort", q.sort);
  if (q.page && q.page > 1) sp.set("page", String(q.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function matchesKey(p: ProductDTO, key: FilterKey, vals: string[]): boolean {
  switch (key) {
    case "need": return vals.some((v) => p.needs.includes(v));
    case "price": return vals.some((v) => {
      const b = PRICE_BANDS.find((x) => x.id === v);
      return b ? p.basePrice >= b.min && p.basePrice <= b.max : false;
    });
    case "size": return vals.includes(p.sizeBand);
    case "shape": return vals.includes(p.shape);
    case "frameType": return vals.includes(p.frameType);
    case "material": return vals.includes(p.material);
    case "colour": return p.colours.some((c) => vals.includes(c.family));
    case "face": return vals.some((v) => p.faceShapes.includes(v));
    case "brand": return vals.includes(p.brand);
    case "collection": return vals.includes(p.collection);
    case "audience": return vals.includes(p.audience);
    case "light": return p.weightG < LIGHT_LIMIT_G;
    case "inStock": return inStock(p);
  }
}

function matchesSearch(p: ProductDTO, q: string): boolean {
  const hay = `${p.name} ${p.modelCode} ${p.shape} ${p.material} ${p.brand} ${p.collection} ${p.colours.map((c) => c.name).join(" ")} ${p.tags.join(" ")}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}

function apply(products: ProductDTO[], q: CatalogueQuery, except?: FilterKey): ProductDTO[] {
  return products.filter((p) => {
    for (const f of ALL_FILTERS) {
      if (f.key === except) continue;
      const vals = q[f.key];
      if (vals?.length && !matchesKey(p, f.key, vals)) return false;
    }
    if (q.q && !matchesSearch(p, q.q)) return false;
    return true;
  });
}

export function sortProducts(list: ProductDTO[], sort: SortId = "popular"): ProductDTO[] {
  const s = [...list];
  switch (sort) {
    case "price-asc": return s.sort((a, b) => a.basePrice - b.basePrice || a.name.localeCompare(b.name));
    case "price-desc": return s.sort((a, b) => b.basePrice - a.basePrice || a.name.localeCompare(b.name));
    case "lightest": return s.sort((a, b) => a.weightG - b.weightG || a.name.localeCompare(b.name));
    case "newest": return s.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name));
    default: return s.sort((a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name));
  }
}

export type Facets = Partial<Record<FilterKey, Record<string, number>>>;

export interface ActiveFilter { key: FilterKey; value: string; label: string; groupLabel: string }

export interface Suggestion { key: FilterKey; value: string; label: string; count: number }

export interface CatalogueResult {
  items: ProductDTO[];
  total: number;
  page: number;
  pageCount: number;
  facets: Facets;
  active: ActiveFilter[];
  suggestions: Suggestion[];
}

export function activeFilters(q: CatalogueQuery): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  for (const f of ALL_FILTERS) {
    for (const v of q[f.key] ?? []) {
      const opt = f.options?.find((o) => o.id === v);
      out.push({
        key: f.key,
        value: v,
        label: f.kind === "toggle" ? f.label : (opt?.label ?? v),
        groupLabel: f.chip,
      });
    }
  }
  return out;
}

export function withoutFilter(q: CatalogueQuery, key: FilterKey, value?: string): CatalogueQuery {
  const next: CatalogueQuery = { ...q, page: undefined };
  const vals = (q[key] ?? []).filter((v) => value !== undefined && v !== value);
  if (vals.length) next[key] = vals; else delete next[key];
  return next;
}

export function runCatalogue(products: ProductDTO[], q: CatalogueQuery): CatalogueResult {
  const pageSize = q.pageSize ?? 24;
  const filtered = sortProducts(apply(products, q), q.sort);
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, q.page ?? 1), pageCount);

  // Disjunctive facet counts: each facet is counted with all *other* filters applied.
  const facets: Facets = {};
  for (const f of ALL_FILTERS) {
    const base = apply(products, q, f.key);
    const counts: Record<string, number> = {};
    if (f.kind === "toggle") {
      counts["1"] = base.filter((p) => matchesKey(p, f.key, ["1"])).length;
    } else {
      const ids = f.options?.length
        ? f.options.map((o) => o.id)
        : Array.from(new Set(products.map((p) => String(p[f.key as keyof ProductDTO])))).sort();
      for (const id of ids) counts[id] = base.filter((p) => matchesKey(p, f.key, [id])).length;
    }
    facets[f.key] = counts;
  }

  // Empty-state suggestions: which single filter, if removed, brings results back?
  const active = activeFilters(q);
  const suggestions: Suggestion[] = [];
  if (total === 0) {
    for (const a of active) {
      const count = apply(products, withoutFilter(q, a.key, a.value)).length;
      if (count > 0) suggestions.push({ key: a.key, value: a.value, label: a.label, count });
    }
    suggestions.sort((a, b) => b.count - a.count);
  }

  return {
    items: filtered.slice(0, page * pageSize), // "Show more" pattern: pages accumulate
    total,
    page,
    pageCount,
    facets,
    active,
    suggestions: suggestions.slice(0, 4),
  };
}

/** Brand / collection options are data-driven; fill them for the UI. */
export function dynamicOptions(products: ProductDTO[]) {
  const uniq = (xs: string[]) => Array.from(new Set(xs)).sort().map((id) => ({ id, label: id }));
  return { brand: uniq(products.map((p) => p.brand)), collection: uniq(products.map((p) => p.collection)) };
}

export const filterLabel = (key: string) => filterByKey(key)?.label ?? key;

/** Fit hint from measurements (X3): compare a frame with the user's known size, if any. */
export function fitHint(p: Pick<ProductDTO, "lensWidthMm" | "bridgeMm" | "sizeBand">, preferredBand?: string | null): string {
  const w = totalWidthMm(p);
  const base = `About ${w} mm across the front`;
  if (!preferredBand) return `${base}. ${p.sizeBand === "narrow" ? "A narrower fit." : p.sizeBand === "wide" ? "A wider fit." : "A medium fit that suits most adults."}`;
  if (preferredBand === p.sizeBand) return `${base}. Matches the ${preferredBand} fit you chose.`;
  const order = ["narrow", "medium", "wide"];
  const d = order.indexOf(p.sizeBand) - order.indexOf(preferredBand);
  return `${base}. ${d > 0 ? "Wider" : "Narrower"} than the ${preferredBand} fit you chose.`;
}
