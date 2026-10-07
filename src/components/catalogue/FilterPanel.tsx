"use client";

import { useState } from "react";
import type { CatalogueQuery, Facets } from "@/lib/catalogue";
import { FILTER_GROUPS, type FilterDef, type FilterKey } from "@/lib/taxonomy";
import { AccordionItem } from "../ui/Accordion";
import { Checkbox } from "../ui/Field";
import { ShapeGlyph } from "../frames/ShapeGlyph";

/**
 * Filters grouped into Essentials, Fit & style, Brand & collection, More (X13).
 * Every label is plain language with a helper where it needs one (U3).
 * Counts are disjunctive facets: what you'd get if you ticked that box.
 */
export function FilterPanel({
  query, facets, options, onToggle,
}: {
  query: CatalogueQuery;
  facets: Facets;
  options: { brand: { id: string; label: string }[]; collection: { id: string; label: string }[] };
  onToggle: (key: FilterKey, value: string) => void;
}) {
  const activeIn = (gid: string) =>
    FILTER_GROUPS.find((g) => g.id === gid)!.filters.reduce((n, f) => n + (query[f.key]?.length ?? 0), 0);
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = { essentials: true };
    for (const g of FILTER_GROUPS) if (activeIn(g.id)) init[g.id] = true;
    return init;
  });

  return (
    <div className="border-t border-ink">
      {FILTER_GROUPS.map((g) => {
        const n = activeIn(g.id);
        return (
          <AccordionItem
            key={g.id}
            title={
              <span className="flex items-center gap-2">
                {g.label}
                {n ? <span className="num grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-xs text-paper">{n}<span className="sr-only"> active</span></span> : null}
              </span>
            }
            summary={g.filters.map((f) => f.label).join(" · ")}
            open={!!open[g.id]}
            onToggle={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))}
          >
            <div className="flex flex-col gap-6">
              {g.filters.map((f) => (
                <FilterField
                  key={f.key}
                  def={f.key === "brand" || f.key === "collection" ? { ...f, options: options[f.key] } : f}
                  selected={query[f.key] ?? []}
                  counts={facets[f.key] ?? {}}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </AccordionItem>
        );
      })}
    </div>
  );
}

function FilterField({
  def, selected, counts, onToggle,
}: {
  def: FilterDef;
  selected: string[];
  counts: Record<string, number>;
  onToggle: (key: FilterKey, value: string) => void;
}) {
  if (def.kind === "toggle") {
    return (
      <Checkbox
        label={<span className="font-semibold">{def.label}</span>}
        hint={def.helper}
        checked={selected.includes("1")}
        count={counts["1"]}
        onChange={() => onToggle(def.key, "1")}
      />
    );
  }
  return (
    <fieldset>
      <legend className="font-semibold">{def.label}</legend>
      {def.helper ? <p className="text-sm text-muted">{def.helper}</p> : null}
      <div className="mt-1 flex flex-col">
        {def.options?.map((o) => {
          const count = counts[o.id] ?? 0;
          const checked = selected.includes(o.id);
          return (
            <Checkbox
              key={o.id}
              label={
                def.key === "shape" ? (
                  <span className="flex items-center gap-2"><ShapeGlyph shape={o.id} className="h-4 w-8 text-muted" strokeWidth={2.2} />{o.label}</span>
                ) : o.label
              }
              hint={def.key === "size" || def.key === "frameType" || def.key === "material" ? o.helper : undefined}
              checked={checked}
              disabled={!checked && count === 0}
              count={count}
              onChange={() => onToggle(def.key, o.id)}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
