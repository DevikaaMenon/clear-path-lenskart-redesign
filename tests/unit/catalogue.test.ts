import { describe, expect, it } from "vitest";
import { buildCatalogue } from "../../prisma/data/catalogue";
import { activeFilters, parseQuery, runCatalogue, toSearch, withoutFilter } from "@/lib/catalogue";
import { recommend } from "@/lib/finder";
import { ALL_FILTERS, FILTER_GROUPS } from "@/lib/taxonomy";

const products = buildCatalogue();

describe("synthetic catalogue", () => {
  it("has 40 frames with unique canonical names, slugs and model codes (U5)", () => {
    expect(products.length).toBe(40);
    for (const k of ["name", "slug", "modelCode"] as const) expect(new Set(products.map((p) => p[k])).size).toBe(40);
  });
  it("includes the edge cases the brief asks for", () => {
    expect(products.some((p) => p.sizes.some((s) => s.stock === 0))).toBe(true);
    expect(products.some((p) => p.sizes.some((s) => s.stock > 0 && s.stock <= 3))).toBe(true);
    expect(products.some((p) => p.sizes.every((s) => s.stock === 0))).toBe(true);
  });
});

describe("filters (X13, U3)", () => {
  it("groups filters into the four required groups with no duplicate labels", () => {
    expect(FILTER_GROUPS.map((g) => g.label)).toEqual(["Essentials", "Fit & style", "Brand & collection", "More"]);
    const labels = ALL_FILTERS.map((f) => f.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
  it("filters by need and shape, and counts facets disjunctively", () => {
    const r = runCatalogue(products, parseQuery(new URLSearchParams("need=computer&shape=round")));
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.every((p) => p.shape === "round" && p.needs.includes("computer"))).toBe(true);
    expect(r.facets.shape?.round).toBe(r.total);
    expect(r.facets.shape?.rectangle).toBeGreaterThan(0);
  });
  it("ORs values within a filter and ANDs across filters", () => {
    const one = runCatalogue(products, { shape: ["round"] }).total;
    const two = runCatalogue(products, { shape: ["round", "oval"] }).total;
    expect(two).toBeGreaterThan(one);
  });
  it("gives an empty state with relax-one-filter suggestions that really bring results back (S4)", () => {
    const q = parseQuery(new URLSearchParams("audience=kids&material=titanium"));
    const r = runCatalogue(products, q);
    expect(r.total).toBe(0);
    expect(r.suggestions.length).toBe(2);
    for (const s of r.suggestions) expect(runCatalogue(products, withoutFilter(q, s.key, s.value)).total).toBe(s.count);
  });
  it("hides sold-out frames with In stock only", () => {
    const r = runCatalogue(products, { inStock: ["1"], pageSize: 100 });
    expect(r.items.some((p) => p.slug === "rudra-square-titanium")).toBe(false);
  });
  it("sorts by price and weight", () => {
    const asc = runCatalogue(products, { sort: "price-asc", pageSize: 100 }).items.map((p) => p.basePrice);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const light = runCatalogue(products, { sort: "lightest" }).items[0];
    expect(light.weightG).toBe(Math.min(...products.map((p) => p.weightG)));
  });
  it("round-trips the URL and ignores unknown parameters", () => {
    const q = parseQuery(new URLSearchParams("shape=round,oval&sort=price-asc&bogus=1"));
    expect(toSearch(q)).toBe("?shape=round%2Coval&sort=price-asc");
    expect(activeFilters(q).map((a) => a.label)).toEqual(["Round", "Oval"]);
  });
  it("paginates with a show-more pattern", () => {
    const r = runCatalogue(products, { page: 1, pageSize: 10 });
    expect(r.items.length).toBe(10);
    expect(r.pageCount).toBe(4);
    expect(runCatalogue(products, { page: 2, pageSize: 10 }).items.length).toBe(20);
  });
});

describe("Frame Finder (X3)", () => {
  it("maps answers to filters", () => {
    const r = recommend(products, { need: "computer", face: "square", fit: "fine" });
    expect(r.query).toMatchObject({ need: ["computer"], face: ["square"], size: ["medium"], inStock: ["1"] });
  });
  it("relaxes fit then face when nothing matches, and says so", () => {
    const r = recommend(products, { need: "reading", face: "heart", fit: "tight", audience: "kids" });
    expect(r.notes.length).toBeGreaterThan(0);
  });
  it("adds no filter for skipped answers", () => {
    const r = recommend(products, { need: null, face: "unsure", fit: "unsure" });
    expect(r.query).toEqual({ inStock: ["1"] });
  });
});
