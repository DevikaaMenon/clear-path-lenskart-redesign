import { Icon, IconName } from "./Icon";

const ITEMS: { icon: IconName; title: string; body: string }[] = [
  { icon: "return", title: "14-day returns", body: "Free pickup. Full refund, lenses included." },
  { icon: "cash", title: "Cash on delivery", body: "Pay when it arrives, up to ₹10,000." },
  { icon: "truck", title: "Free shipping", body: "Delivered in 4–7 days. No minimum order." },
  { icon: "eye", title: "Free eye test", body: "At any of our stores. No purchase needed." },
];

/** Reassurance at decision points (X8): next to the buy button and in the cart. */
export function TrustStrip({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <ul
      className={`grid gap-px overflow-hidden border border-line bg-line ${compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"} ${className}`}
      aria-label="Our promises"
    >
      {ITEMS.map((it) => (
        <li key={it.title} className="flex items-start gap-3 bg-paper p-3.5">
          <Icon name={it.icon} size={22} className="mt-0.5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-bold leading-snug">{it.title}</p>
            <p className="text-sm leading-snug text-muted">{it.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
