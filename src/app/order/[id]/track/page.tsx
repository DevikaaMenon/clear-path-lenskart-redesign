import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadOrder } from "@/lib/server/orders";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Track order" };
export const dynamic = "force-dynamic";

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await loadOrder(id);
  if (!order) notFound();
  const stages = ["Order placed", "Lenses being made", "Quality check", "Shipped", "Out for delivery", "Delivered"];
  const current = 0; // simulated: a new order is always at the first stage
  return (
    <div className="page max-w-3xl pb-16 pt-10 md:pt-14">
      <p className="eyebrow">Order <span className="num">{order.number}</span></p>
      <h1 className="mt-2 font-display text-5xl">Track your order</h1>
      <p className="mt-3 flex gap-2 text-sm text-muted"><Icon name="info" size={18} className="shrink-0" /> Demo: tracking is simulated. Real orders would update here as they move.</p>
      <ol className="mt-8 flex flex-col">
        {stages.map((s, i) => (
          <li key={s} className="flex items-center gap-4 border-b border-line py-4" aria-current={i === current ? "step" : undefined}>
            <span className={`grid h-9 w-9 place-items-center rounded-full border-2 ${i < current ? "border-accent bg-accent text-accent-ink" : i === current ? "border-ink bg-ink text-paper" : "border-line-strong text-muted"}`}>
              {i <= current ? <Icon name="check" size={16} /> : <span className="num text-sm">{i + 1}</span>}
            </span>
            <span className={i === current ? "font-bold" : "text-muted"}>{s}{i === current ? " (current)" : ""}</span>
          </li>
        ))}
      </ol>
      <ButtonLink href={`/order/${order.id}`} variant="secondary" icon="arrow-left" className="mt-8">Back to order</ButtonLink>
    </div>
  );
}
