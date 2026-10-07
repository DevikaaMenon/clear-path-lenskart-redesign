import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/server/db";
import { loadOrder } from "@/lib/server/orders";
import { formatINR } from "@/lib/pricing";
import { CheckedMark } from "@/components/prescription/PrescriptionFlow";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const METHOD: Record<string, string> = { upi: "UPI", card: "Card", netbanking: "Net banking", cod: "Cash on delivery" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await loadOrder(id);
  if (!order) notFound();
  const address = JSON.parse(order.address) as { line1: string; line2?: string; city: string; state: string; pincode: string };
  const rxIds = order.items.map((i) => i.prescriptionId).filter(Boolean) as string[];
  const rx = rxIds.length ? await prisma.prescription.findMany({ where: { id: { in: rxIds } } }) : [];
  const needsRxLater = rx.some((r) => r.mode === "later");

  const steps = [
    { title: "Order placed", body: `We've emailed a receipt to ${order.email}.`, done: true },
    ...(rx.length ? [{ title: "Prescription check", body: needsRxLater ? "We'll email you a link to add your prescription. Lenses are made after that." : "An optometrist checks your prescription before lenses are cut.", done: false }] : []),
    { title: "Lenses made and checked", body: "Usually 2–3 days.", done: false },
    { title: "Shipped", body: "You'll get an SMS with a tracking link.", done: false },
    { title: "Delivered", body: `Expected ${fmtDate(order.deliveryFrom)} to ${fmtDate(order.deliveryTo)}.`, done: false },
  ];

  return (
    <div className="page pb-16 pt-10 md:pt-14">
      <div className="grid-page gap-y-10">
        <section className="col-span-4 md:col-span-8 xl:col-span-7" aria-labelledby="confirm-title">
          <CheckedMark size={80} />
          <p className="eyebrow mt-6">Step 5 · Done</p>
          <h1 id="confirm-title" className="mt-2 font-display text-5xl">Thank you, {order.name.split(" ")[0]}. Your order is placed.</h1>
          <dl className="mt-8 grid gap-px border border-ink bg-ink sm:grid-cols-3">
            <div className="bg-surface p-4">
              <dt className="eyebrow">Order number</dt>
              <dd className="num mt-1 text-2xl font-bold" data-testid="order-number">{order.number}</dd>
            </div>
            <div className="bg-surface p-4">
              <dt className="eyebrow">Arrives</dt>
              <dd className="mt-1 text-lg font-bold">{fmtDate(order.deliveryFrom)} – {fmtDate(order.deliveryTo)}</dd>
            </div>
            <div className="bg-surface p-4">
              <dt className="eyebrow">Paid</dt>
              <dd className="num mt-1 text-2xl font-bold">{formatINR(order.total)}</dd>
              <dd className="text-sm text-muted">{METHOD[order.paymentMethod]}{order.paymentMethod === "cod" ? ", pay on delivery" : " (demo, nothing charged)"}</dd>
            </div>
          </dl>

          <h2 className="mt-12 font-display text-3xl">What happens next</h2>
          <ol className="mt-4 border-l-2 border-line pl-6">
            {steps.map((s, i) => (
              <li key={s.title} className="relative pb-6 last:pb-0">
                <span className={`absolute -left-[35px] grid h-6 w-6 place-items-center rounded-full border-2 ${s.done ? "border-accent bg-accent text-accent-ink" : "border-line-strong bg-paper"}`} aria-hidden="true">
                  {s.done ? <Icon name="check" size={14} /> : <span className="num text-xs">{i + 1}</span>}
                </span>
                <p className="font-bold">{s.title}{s.done ? <span className="sr-only"> (done)</span> : null}</p>
                <p className="text-muted">{s.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={`/order/${order.id}/track`} variant="primary" icon="truck">Track order</ButtonLink>
            <ButtonLink href="/" variant="secondary">Back to home</ButtonLink>
          </div>
        </section>

        <aside className="col-span-4 md:col-span-8 xl:col-span-5" aria-label="Order details">
          <div className="border border-ink bg-surface">
            <h2 className="border-b border-line px-4 py-3 font-sans text-base font-bold">Order details</h2>
            <ul className="divide-y divide-line px-4">
              {order.items.map((i) => (
                <li key={i.id} className="py-3">
                  <p className="flex justify-between gap-3 font-semibold"><span>{i.productName}</span><span className="num">{formatINR(i.unitPrice * i.quantity)}</span></p>
                  <p className="text-sm text-muted">{i.colour} · size {i.size} · {i.lensName}{i.coatingName ? ` · ${i.coatingName}` : ""}</p>
                </li>
              ))}
            </ul>
            <dl className="border-t border-line px-4 py-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="num">{formatINR(order.subtotal)}</dd></div>
              {order.discount ? <div className="flex justify-between text-success"><dt>{order.offerLabel}</dt><dd className="num">−{formatINR(order.discount)}</dd></div> : null}
              <div className="flex justify-between"><dt>Shipping</dt><dd>Free</dd></div>
              <div className="mt-1 flex justify-between border-t border-line pt-1 text-base font-bold"><dt>Total</dt><dd className="num">{formatINR(order.total)}</dd></div>
            </dl>
            <div className="border-t border-line px-4 py-3 text-sm">
              <p className="font-bold">Delivering to</p>
              <p className="text-muted">{order.name}<br />{address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />{address.city}, {address.state} {address.pincode}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            Need to change something? <Link href="/help#returns" className="link">Cancel or return</Link> any time before it ships, free.
          </p>
        </aside>
      </div>
    </div>
  );
}
