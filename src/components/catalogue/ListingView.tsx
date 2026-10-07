"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { toSearch, withoutFilter, type CatalogueQuery } from "@/lib/catalogue";
import type { CardDTO, CatalogueResponse } from "@/lib/server/catalogue-service";
import { NEED_ICON } from "@/lib/nav";
import { SORTS, needById, type FilterKey, type NeedId, type SortId } from "@/lib/taxonomy";
import { api, ApiError } from "@/lib/client/api";
import { useShop } from "../providers/ShopProvider";
import { ProductCard } from "./ProductCard";
import { FilterPanel } from "./FilterPanel";
import { Drawer } from "../ui/Drawer";
import { Button } from "../ui/Button";
import { UxMarker } from "../ux/UxMarker";
import { Icon } from "../ui/Icon";
import { EmptyState } from "../ui/EmptyState";
import { CardSkeleton } from "../ui/Skeleton";

const Try3DDialog = dynamic(() => import("../three/Try3DDialog").then((m) => m.Try3DDialog), { ssr: false });

export function ListingView({
  initial, offerTag, lensFromByNeed,
}: {
  initial: CatalogueResponse;
  offerTag: string | null;
  lensFromByNeed: Record<string, number>;
}) {
  const reduce = useReducedMotion();
  const { setNeed, announce } = useShop();
  const [data, setData] = useState(initial);
  const [query, setQuery] = useState<CatalogueQuery>(initial.query);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [try3d, setTry3d] = useState<{ p: CardDTO; ci: number } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const chipsRef = useRef<HTMLUListElement>(null);
  const firstRun = useRef(true);

  const singleNeed = query.need?.length === 1 ? (query.need[0] as NeedId) : null;
  const needObj = needById(singleNeed);

  // Carry a single chosen need into the rest of the journey (X2).
  useEffect(() => {
    if (singleNeed) setNeed(singleNeed);
  }, [singleNeed, setNeed]);

  // Keep in sync if the URL changes from outside (header links, back/forward).
  useEffect(() => {
    setData(initial);
    setQuery(initial.query);
  }, [initial]);

  const load = useCallback(async (q: CatalogueQuery) => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    const slow = window.setTimeout(() => setLoading(true), 220); // only show skeletons if it's slow
    setError(null);
    try {
      const res = await api<CatalogueResponse>(`/api/products${toSearch(q)}`, { signal: ctrl.signal });
      setData(res);
      announce(`${res.total} ${res.total === 1 ? "frame" : "frames"} found`);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof ApiError ? e.message : "We couldn't load frames.");
    } finally {
      window.clearTimeout(slow);
      if (abort.current === ctrl) setLoading(false);
    }
  }, [announce]);

  const apply = useCallback((q: CatalogueQuery) => {
    setQuery(q);
    // Native history API (synced with the Next router) updates the URL without a
    // server round trip; the client fetch below is the single source of new data.
    window.history.replaceState(null, "", `/shop${toSearch(q)}`);
    load(q);
  }, [load]);

  useEffect(() => {
    firstRun.current = false;
  }, []);

  const toggle = (key: FilterKey, value: string) => {
    const cur = query[key] ?? [];
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    const q: CatalogueQuery = { ...query, page: undefined };
    if (next.length) q[key] = next; else delete q[key];
    apply(q);
  };

  // After a chip is removed, focus moves to the next chip or the results heading
  // once the new results have rendered (never left on <body>).
  const pendingFocus = useRef<number | null>(null);
  useEffect(() => {
    if (pendingFocus.current === null) return;
    const index = pendingFocus.current;
    pendingFocus.current = null;
    const t = window.setTimeout(() => {
      const chips = Array.from(chipsRef.current?.querySelectorAll<HTMLButtonElement>("button[data-chip]:not([data-exiting])") ?? []);
      const target = index >= 0 ? chips[Math.min(index, chips.length - 1)] : undefined;
      (target ?? headingRef.current)?.focus();
    }, 220); // after the chip exit animation
    return () => window.clearTimeout(t);
  }, [data]);

  const removeChip = (key: FilterKey, value: string, index: number) => {
    pendingFocus.current = index;
    apply(withoutFilter(query, key, value));
  };

  const clearAll = () => {
    pendingFocus.current = -1;
    apply({ sort: query.sort, q: query.q });
  };

  const title = needObj ? needObj.label : query.q ? `Results for “${query.q}”` : query.audience?.includes("kids") ? "Kids' glasses" : "All frames";
  const activeCount = data.active.length;
  const lensFrom = singleNeed ? lensFromByNeed[singleNeed] ?? null : null;

  return (
    <div className="page pb-16">
      {/* Listing header: the chosen need's lens carries over from the home tile (view transition) */}
      <section className="grid-page items-end gap-y-6 border-b border-ink pb-8 pt-10 md:pt-14" aria-labelledby="listing-title">
        <div className="relative col-span-4 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-5 md:col-span-6 xl:col-span-8">
          <UxMarker id="listing-need" corner="tl" />
          {needObj ? (
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-ink bg-accent-soft text-accent sm:h-20 sm:w-20 md:h-28 md:w-28"
              style={{ viewTransitionName: "need-lens" }}
              aria-hidden="true"
            >
              <Icon name={NEED_ICON[needObj.id]} size={40} />
            </span>
          ) : null}
          <div>
            <p className="eyebrow">{needObj ? "Shopping for" : "Shop"}</p>
            <h1 id="listing-title" className="font-display text-4xl" style={{ viewTransitionName: needObj ? "need-title" : undefined }}>
              {title}
            </h1>
            {needObj ? <p className="mt-2 max-w-prose text-muted">{needObj.helper}</p> : null}
          </div>
        </div>
        <div className="col-span-4 hidden md:col-span-2 md:block md:text-right xl:col-span-4">
          <p className="num text-3xl" aria-hidden="true">
            <motion.span key={data.total} initial={reduce ? false : { y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block">
              {data.total}
            </motion.span>
          </p>
          <p className="text-sm text-muted" aria-hidden="true">{data.total === 1 ? "frame matches" : "frames match"}</p>
        </div>
      </section>

      <div className="grid-page gap-y-6 pt-6">
        {/* Desktop filters */}
        <aside className="hidden xl:col-span-3 xl:block" aria-label="Filters">
          <div className="sticky top-[calc(var(--header-h)+16px)] max-h-[calc(100vh-var(--header-h)-32px)] overflow-y-auto pb-8">
            <div className="relative">
              <h2 className="eyebrow mb-3 flex items-center gap-2 !text-ink"><Icon name="sliders" size={18} /> Filters</h2>
              <UxMarker id="listing-filters" className="!top-[-10px] !right-0" />
            </div>
            <FilterPanel query={query} facets={data.facets} options={data.options} onToggle={toggle} />
          </div>
        </aside>

        <div className="col-span-4 md:col-span-8 xl:col-span-9">
          {/* Toolbar: live count, chips, sort */}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" icon="sliders" className="xl:hidden" onClick={() => setSheet(true)} aria-haspopup="dialog">
              Filters{activeCount ? ` (${activeCount})` : ""}
            </Button>
            <h2 ref={headingRef} tabIndex={-1} id="results-heading" className="order-last w-full font-sans text-base font-semibold sm:order-none sm:w-auto" aria-live="polite" aria-atomic="true">
              {loading ? "Updating…" : `${data.total} ${data.total === 1 ? "frame" : "frames"}`}
            </h2>
            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="sort" className="sr-only text-sm text-muted sm:not-sr-only">Sort by</label>
              <div className="relative">
                <select
                  id="sort"
                  className="min-h-[44px] appearance-none border border-line-strong bg-surface py-2 pl-3 pr-9 text-sm font-semibold hover:border-ink"
                  value={query.sort ?? "popular"}
                  onChange={(e) => apply({ ...query, sort: e.target.value as SortId, page: undefined })}
                >
                  {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <Icon name="chevron-down" size={18} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeCount ? (
            <div className="relative mt-4 flex w-fit max-w-full flex-wrap items-center gap-2 pr-6">
              <UxMarker id="listing-chips" />
              <ul ref={chipsRef} className="flex flex-wrap gap-2" aria-label="Active filters">
                <AnimatePresence initial={false} mode="popLayout">
                  {data.active.map((a, i) => (
                    <motion.li
                      key={`${a.key}-${a.value}`}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, transition: { duration: 0.14 } }}
                      transition={{ type: "spring", stiffness: 520, damping: 30 }}
                    >
                      <button
                        data-chip
                        className="group/chip flex min-h-[40px] items-center gap-2 rounded-lens border border-ink bg-surface py-1 pl-3.5 pr-2 text-sm transition-colors duration-micro hover:bg-ink hover:text-paper"
                        onClick={() => removeChip(a.key, a.value, i)}
                        aria-label={`Remove filter ${a.groupLabel}: ${a.label}`}
                      >
                        <span className="text-muted transition-colors group-hover/chip:text-paper/70">{a.groupLabel}:</span>
                        <span className="font-semibold">{a.label}</span>
                        <span className="grid h-6 w-6 place-items-center rounded-full transition-transform duration-ui ease-click group-hover/chip:rotate-90"><Icon name="close" size={14} /></span>
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              <button className="min-h-[40px] px-2 text-sm font-semibold text-accent underline underline-offset-4 hover:decoration-2" onClick={clearAll}>
                Clear all
              </button>
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 flex flex-wrap items-center gap-3 border-2 border-danger bg-danger-soft p-4" role="alert">
              <Icon name="alert" className="text-danger" />
              <p className="flex-1 font-semibold">{error}</p>
              <Button variant="secondary" size="sm" icon="rotate" onClick={() => load(query)}>Try again</Button>
            </div>
          ) : null}

          {/* Results */}
          <div className="relative mt-6" aria-busy={loading}>
            {loading && !data.items.length ? (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <li key={i}><CardSkeleton /></li>)}
              </ul>
            ) : data.total === 0 ? (
              <div className="relative">
              <UxMarker id="listing-empty" />
              <EmptyState
                title="No frames match all of these filters"
                body={
                  <>
                    <p>Nothing is wrong. This combination is just too narrow. Remove one filter to see more frames.</p>
                  </>
                }
              >
                {data.suggestions.length ? (
                  <div>
                    <p className="mb-2 font-semibold">Try removing one filter:</p>
                    <ul className="flex flex-wrap gap-2">
                      {data.suggestions.map((s) => (
                        <li key={`${s.key}-${s.value}`}>
                          <Button variant="secondary" size="sm" icon="close" onClick={() => removeChip(s.key, s.value, 0)}>
                            Remove “{s.label}” · {s.count} {s.count === 1 ? "frame" : "frames"}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <Button variant="primary" onClick={clearAll}>Clear all filters</Button>
              </EmptyState>
              </div>
            ) : (
              <LayoutGroup>
                <UxMarker id="listing-cards" corner="tl" />
                <motion.ul className={`grid grid-cols-1 gap-4 transition-opacity duration-ui sm:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-50" : ""}`} data-testid="results">
                  <AnimatePresence initial={false} mode="popLayout">
                    {data.items.map((p, i) => (
                      <motion.li
                        key={p.id}
                        layout={!reduce ? "position" : false}
                        initial={reduce ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: firstRun.current ? 0 : Math.min(i, 8) * 0.03 } }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, transition: { duration: 0.16 } }}
                        transition={{ type: "spring", stiffness: 420, damping: 38 }}
                      >
                        <ProductCard p={p} need={singleNeed} offerTag={offerTag} lensFrom={lensFrom} onTry3D={(pp, ci) => setTry3d({ p: pp, ci })} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              </LayoutGroup>
            )}
            {data.page < data.pageCount ? (
              <div className="mt-8 flex justify-center">
                <Button variant="secondary" onClick={() => apply({ ...query, page: data.page + 1 })} loading={loading} loadingText="Loading">
                  Show more frames ({data.total - data.items.length} more)
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile and tablet filter sheet */}
      <Drawer
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filters"
        side="bottom"
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={clearAll} disabled={!activeCount}>Clear all</Button>
            <Button variant="primary" full onClick={() => setSheet(false)}>
              {loading ? "Updating…" : `Show ${data.total} ${data.total === 1 ? "frame" : "frames"}`}
            </Button>
          </div>
        }
      >
        <FilterPanel query={query} facets={data.facets} options={data.options} onToggle={toggle} />
      </Drawer>

      {try3d ? <Try3DDialog product={try3d.p} colourIndex={try3d.ci} need={singleNeed} onClose={() => setTry3d(null)} /> : null}
    </div>
  );
}
