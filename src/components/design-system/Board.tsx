"use client";

import { useState } from "react";
import { formatINR, price } from "@/lib/pricing";
import { Button, IconButton } from "../ui/Button";
import { Checkbox, Input, Select } from "../ui/Field";
import { Icon, ICON_NAMES } from "../ui/Icon";
import { AccordionItem } from "../ui/Accordion";
import { Stepper } from "../ui/Stepper";
import { TrustStrip } from "../ui/TrustStrip";
import { EmptyState } from "../ui/EmptyState";
import { ErrorSummary } from "../ui/ErrorSummary";
import { CardSkeleton } from "../ui/Skeleton";
import { Drawer } from "../ui/Drawer";
import { PriceBreakdown } from "../product/PriceBreakdown";
import { ProductCard } from "../catalogue/ProductCard";
import { FrameIllustration } from "../frames/FrameIllustration";
import { ShapeGlyph } from "../frames/ShapeGlyph";
import { CheckedMark } from "../prescription/PrescriptionFlow";
import { useShop } from "../providers/ShopProvider";
import type { CardDTO } from "@/lib/server/catalogue-service";
import type { OfferDef } from "@/lib/pricing";
import { SHAPES } from "@/lib/taxonomy";

const COLOURS: [string, string, string][] = [
  ["--c-paper", "#f4f1e8", "Page background"],
  ["--c-surface", "#fffefb", "Cards, inputs, sheets"],
  ["--c-sunk", "#eae5d8", "Wells, skeletons"],
  ["--c-ink", "#0f1d2b", "Text, primary buttons · 15.1:1 on paper"],
  ["--c-muted", "#4f5b67", "Secondary text · 6.2:1"],
  ["--c-line", "#d9d2c2", "Decorative hairlines"],
  ["--c-line-strong", "#857d6c", "Control borders · 3.6:1"],
  ["--c-accent", "#0b6b63", "Lens teal: links, selection · 5.6:1"],
  ["--c-accent-soft", "#d5ebe7", "Selected backgrounds"],
  ["--c-signal", "#b83a1a", "Vermilion marks, counts · 5.1:1"],
  ["--c-highlight", "#f5df6e", "Changed-value highlight (bg only)"],
  ["--c-success", "#1b7340", "Success · 5.2:1"],
  ["--c-warning", "#8a5300", "Warning · 5.6:1"],
  ["--c-danger", "#b42318", "Errors · 5.8:1"],
];

const TYPE = [
  ["6xl", "Display", "font-display text-6xl"],
  ["5xl", "Page hero", "font-display text-5xl"],
  ["4xl", "Page title", "font-display text-4xl"],
  ["3xl", "Section", "font-display text-3xl"],
  ["2xl", "Sub-section", "font-display text-2xl"],
  ["xl", "Card title", "font-display text-xl"],
  ["lg", "Lead / large body", "text-lg"],
  ["base", "Body (16px minimum)", "text-base"],
  ["sm", "UI labels", "text-sm"],
  ["mono", "Measurements & prices", "num text-base"],
] as const;

const MOTION = [
  ["--dur-micro", "120ms", "settle", "Hover, press, toggles"],
  ["--dur-ui", "240ms", "settle / glide", "Chips, accordions, value changes"],
  ["--dur-page", "480ms", "settle", "Route & shared-element transitions"],
  ["spring", "520 / 24–38", "physical", "Selection, tray slots, chips (layout)"],
  ["--stagger", "40ms", "", "Grid entry, max 8 items"],
] as const;

export function DesignSystemBoard({ sample, offers }: { sample: CardDTO; offers: OfferDef[] }) {
  const [open, setOpen] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [chk, setChk] = useState(true);
  const [coat, setCoat] = useState(false);
  const { toast } = useShop();
  const r = price({ name: sample.name, basePrice: sample.basePrice }, "M", { id: "rx-standard", name: "Single vision, standard", price: 800, purpose: "prescription" }, coat ? { id: "anti-glare", name: "Anti-glare coating", price: 400 } : null, offers);

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <section id={id} aria-labelledby={`${id}-t`} className="border-t border-ink py-10">
      <h2 id={`${id}-t`} className="font-display text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
  const State = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col items-start gap-2">
      <span className="eyebrow">{label}</span>
      {children}
    </div>
  );

  return (
    <div className="page pb-16 pt-10 md:pt-14">
      <p className="eyebrow">Clear Path · Measured clarity</p>
      <h1 className="mt-2 font-display text-5xl">Design system</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">Every token and component, with its states. Documented in docs/design-system.md. Tokens live in src/app/tokens.css.</p>

      <Section id="colour" title="Colour">
        <ul className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4 xl:grid-cols-7">
          {COLOURS.map(([n, hex, use]) => (
            <li key={n} className="bg-paper">
              <span className="block h-20 border-b border-line" style={{ background: `var(${n})` }} />
              <span className="block p-2.5">
                <span className="num block text-xs font-bold">{n}</span>
                <span className="num block text-xs text-muted">{hex}</span>
                <span className="block text-xs text-muted">{use}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="theme-ink mt-4 flex flex-wrap items-center gap-4 p-5">
          <span className="font-semibold">Ink theme (footer, eye-test band)</span>
          <span className="text-muted">Muted 8.1:1</span>
          <span className="text-accent">Accent 8.2:1</span>
          <Button variant="accent" size="sm">Accent button</Button>
          <button className="min-h-[40px] px-3 outline outline-2 outline-offset-2 outline-[var(--c-focus)]">Focus ring (yellow, 12.7:1)</button>
        </div>
      </Section>

      <Section id="type" title="Typography">
        <p className="mb-4 text-muted">Display: Fraunces (variable, optical size). Text: Atkinson Hyperlegible Next (designed for low-vision readers). Numbers: JetBrains Mono. All SIL OFL, self-hosted, font-display: swap. “Larger text” scales the root to 18px.</p>
        <ul className="border-t border-line">
          {TYPE.map(([k, use, cls]) => (
            <li key={k} className="grid grid-cols-[6rem_1fr] items-baseline gap-4 border-b border-line py-3 md:grid-cols-[8rem_12rem_1fr]">
              <span className="num text-sm">{k}</span>
              <span className="hidden text-sm text-muted md:block">{use}</span>
              <span className={`${cls} truncate`}>{k === "mono" ? "52□18 145 · ₹2,499" : "See what it costs"}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="space" title="Spacing, grid, radii, elevation">
        <div className="flex flex-wrap items-end gap-3">
          {[1, 2, 3, 4, 6, 8, 10, 12, 16, 24].map((n) => (
            <div key={n} className="flex flex-col items-center gap-1">
              <span className="block bg-accent" style={{ width: n * 4, height: n * 4 }} />
              <span className="num text-xs">{n * 4}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">4px base. Grid: 12 columns at 1440 (80px margin, 16px gutter) · 8 at 834 (40 / 16) · 4 at 390 (16 / 12).</p>
        <div className="mt-6 flex flex-wrap gap-6">
          {[["--r-xs", "2px · buttons, inputs"], ["--r-sm", "6px · small tags"], ["--r-md", "14px · sheet top corners"], ["--r-lens", "pill/ring · lens-like things only"]].map(([t, d]) => (
            <div key={t} className="flex items-center gap-3">
              <span className="h-14 w-20 border-2 border-ink bg-surface" style={{ borderRadius: `var(${t})` }} />
              <span className="num text-xs">{t}<br /><span className="font-sans text-muted">{d}</span></span>
            </div>
          ))}
          <div className="flex items-center gap-3"><span className="h-14 w-20 border border-ink bg-surface shadow-lift" /><span className="num text-xs">lift<br /><span className="font-sans text-muted">offset hairline, no blur</span></span></div>
        </div>
      </Section>

      <Section id="motion" title="Motion tokens">
        <table className="w-full max-w-3xl text-left text-sm">
          <thead><tr className="border-b border-ink"><th className="py-2">Token</th><th>Value</th><th>Easing</th><th>Used for</th></tr></thead>
          <tbody>{MOTION.map((m) => <tr key={m[0]} className="border-b border-line"><td className="num py-2">{m[0]}</td><td className="num">{m[1]}</td><td>{m[2]}</td><td>{m[3]}</td></tr>)}</tbody>
        </table>
        <p className="mt-3 text-sm text-muted">Named curves: settle cubic-bezier(.22,1,.36,1) · glide (.65,0,.35,1) · click (.34,1.56,.64,1) · leave (.4,0,1,1). Under prefers-reduced-motion every duration collapses to 1ms and JS motion is skipped or becomes a fade.</p>
      </Section>

      <Section id="icons" title="Icons (24px grid, 2px stroke)">
        <ul className="grid grid-cols-6 gap-px border border-line bg-line sm:grid-cols-10 xl:grid-cols-[repeat(16,minmax(0,1fr))]">
          {ICON_NAMES.map((n) => <li key={n} className="flex flex-col items-center gap-1 bg-paper p-2" title={n}><Icon name={n} /><span className="num w-full truncate text-center text-[0.625rem] text-muted">{n}</span></li>)}
        </ul>
        <div className="mt-4 flex flex-wrap gap-4">{SHAPES.map((s) => <span key={s.id} className="flex items-center gap-2 text-sm"><ShapeGlyph shape={s.id} className="h-6 w-12" />{s.label}</span>)}</div>
      </Section>

      <Section id="buttons" title="Buttons">
        <div className="flex flex-wrap gap-6">
          <State label="Default"><Button>Add to bag</Button></State>
          <State label="Hover (lift)"><Button className="-translate-x-[2px] -translate-y-[2px] shadow-lift-sm">Add to bag</Button></State>
          <State label="Focus"><Button className="outline outline-2 outline-offset-2 outline-[var(--c-focus)]">Add to bag</Button></State>
          <State label="Active (pressed)"><Button className="!translate-x-0 !translate-y-0 !shadow-none brightness-125">Add to bag</Button></State>
          <State label="Disabled"><Button disabled>Add to bag</Button></State>
          <State label="Loading"><Button loading loadingText="Adding">Add to bag</Button></State>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button variant="accent">Accent</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button>
          <Button variant="danger" icon="trash">Danger</Button><Button size="sm" iconRight="arrow-right">Small</Button><Button size="lg" iconRight="arrow-right">Large</Button>
          <IconButton icon="heart" label="Icon button" /><IconButton icon="bag" label="With badge" badge={2} />
        </div>
      </Section>

      <Section id="inputs" title="Inputs, select, checkbox">
        <div className="grid gap-6 md:grid-cols-3">
          <Input label="Default" placeholder="Type here" />
          <Input label="With hint" hint="A short hint sits under the label." defaultValue="560011" />
          <Input label="Error" error="Enter a 6-digit PIN code, like 560011." defaultValue="5600" />
          <Input label="Warning" warning="+10.00 is a high power. Please double-check it." defaultValue="+10.00" />
          <Input label="Disabled" disabled defaultValue="Can't edit" />
          <Input label="With unit" suffix="mm" defaultValue="52" />
          <Select label="Select" defaultValue=""><option value="">Choose a state</option><option>Karnataka</option></Select>
          <Select label="Select error" error="Choose your state." defaultValue=""><option value="">Choose a state</option></Select>
          <div>
            <Checkbox label="Checked" checked={chk} onChange={setChk} count={12} />
            <Checkbox label="Unchecked with hint" hint="Total width under 132 mm." checked={false} onChange={() => {}} count={8} />
            <Checkbox label="Disabled (0 results)" checked={false} disabled onChange={() => {}} count={0} />
          </div>
        </div>
      </Section>

      <Section id="chips" title="Chips, filter group, selectors">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex min-h-[40px] items-center gap-2 rounded-lens border border-ink bg-surface py-1 pl-3.5 pr-2 text-sm"><span className="text-muted">Shape:</span><b>Round</b><Icon name="close" size={14} /></span>
          <span className="flex min-h-[40px] items-center gap-2 rounded-lens border border-ink bg-ink py-1 pl-3.5 pr-2 text-sm text-paper"><span className="opacity-70">Shape:</span><b>Round</b><Icon name="close" size={14} className="rotate-90" /> <span className="eyebrow !text-paper">hover</span></span>
          <span className="flex min-h-[44px] items-center gap-2 rounded-lens border border-ink bg-ink px-3 text-sm text-paper">Grey sun · selected</span>
          <span className="flex min-h-[44px] items-center gap-2 rounded-lens border border-line-strong px-3 text-sm">Clear · default</span>
        </div>
        <div className="mt-6 grid max-w-md grid-cols-3 gap-2" aria-label="Size selector states">
          <span className="flex min-h-[88px] flex-col justify-between border border-line-strong bg-surface p-3"><b>S</b><span className="num text-sm">50□16 135</span><span className="text-xs text-muted">In stock</span></span>
          <span className="flex min-h-[88px] flex-col justify-between border border-ink bg-ink p-3 text-paper"><b>M · selected</b><span className="num text-sm">52□17 140</span><span className="text-xs opacity-80">2 left</span></span>
          <span className="flex min-h-[88px] flex-col justify-between border border-dashed border-line-strong bg-sunk p-3 text-muted"><b>L</b><span className="num text-sm">54□18 145</span><span className="text-xs">Out of stock</span></span>
        </div>
        <div className="mt-6 max-w-md border-t border-ink">
          <AccordionItem title="Essentials (filter group)" summary="Need · Price · Size · Shape" open={open} onToggle={() => setOpen((v) => !v)}>
            <Checkbox label="Computer" checked onChange={() => {}} count={25} />
            <Checkbox label="Reading" checked={false} onChange={() => {}} count={13} />
          </AccordionItem>
          <AccordionItem title="Accordion: done" summary="Meera Demo · meera@example.com" open={false} onToggle={() => {}} status="done" />
          <AccordionItem title="Accordion: error" summary="Needs attention" open={false} onToggle={() => {}} status="error" />
        </div>
      </Section>

      <Section id="cards" title="Product card, price breakdown, compare slot">
        <div className="grid gap-6 xl:grid-cols-3">
          <ProductCard p={sample} offerTag="10% off frame" lensFrom={800} />
          <div className="flex flex-col gap-3">
            <PriceBreakdown result={r} />
            <Button variant="secondary" size="sm" onClick={() => setCoat((v) => !v)}>{coat ? "Remove" : "Add"} coating (watch the line highlight)</Button>
          </div>
          <div className="flex flex-col gap-3">
            <span className="flex min-h-[56px] items-center gap-2 rounded-lens border border-ink bg-surface pl-3 pr-1"><ShapeGlyph shape="round" className="h-5 w-10" /><span className="flex-1 text-sm font-semibold">Arlo Round<span className="num block text-xs font-normal text-muted">{formatINR(1499)}</span></span><Icon name="close" size={16} className="m-3" /></span>
            <span className="flex min-h-[56px] items-center gap-2 rounded-lens border border-dashed border-line-strong px-4 text-sm text-muted"><Icon name="plus" size={16} /> Empty slot</span>
            <CardSkeleton />
          </div>
        </div>
      </Section>

      <Section id="feedback" title="Stepper, trust strip, empty state, error summary, toast, drawer">
        <div className="flex flex-col gap-8">
          <Stepper steps={["How to add it", "Enter values", "Check and save"]} current={1} />
          <TrustStrip />
          <div className="grid gap-6 md:grid-cols-2">
            <ErrorSummary items={[{ fieldId: "x1", message: "Right eye (OD): Axis is needed because cylinder is not 0." }, { fieldId: "x2", message: "PD must be between 50 and 80 mm." }]} id="ds-summary" />
            <EmptyState title="No frames match all of these filters" body="Remove one filter to see more frames." headingLevel={3} />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="secondary" icon="check" onClick={() => toast({ title: "Added to compare", body: "2 of 3 slots used", icon: "compare" })}>Show a toast</Button>
            <Button variant="secondary" icon="trash" onClick={() => toast({ title: "Removed Arlo Round", body: "Changed your mind?", icon: "trash", action: { label: "Undo", onClick: () => {} } })}>Toast with Undo</Button>
            <Button variant="secondary" onClick={() => setDrawer(true)}>Open drawer</Button>
            <CheckedMark size={56} />
            <span className="text-sm text-muted">“Checked” micro-interaction (SVG + motion; Rive not used)</span>
          </div>
          <div className="max-w-sm"><FrameIllustration frame={sample} colour={sample.colours[0]} tint="sun" title="Sun tint preview" /></div>
        </div>
        <Drawer open={drawer} onClose={() => setDrawer(false)} title="Drawer / sheet" description="Focus is trapped; Escape closes; focus returns to the trigger.">
          <p>Right-side drawer on desktop, bottom sheet for filters on mobile, centred dialog for 3D.</p>
        </Drawer>
      </Section>
    </div>
  );
}
