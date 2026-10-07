import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Help" };

const SECTIONS = [
  {
    id: "size",
    title: "Size and fit guide",
    body: (
      <>
        <p>Every frame lists three numbers, like <span className="num font-semibold">52□18 145</span>:</p>
        <ul className="mt-2 list-disc pl-5">
          <li><strong>Lens width (52)</strong>: the width of one lens in millimetres.</li>
          <li><strong>Bridge (18)</strong>: the gap between the lenses, over your nose.</li>
          <li><strong>Temple length (145)</strong>: the length of each arm.</li>
        </ul>
        <p className="mt-2">If you own glasses that fit well, look inside an arm for these numbers and choose a frame within 2 mm. On any product page, use <strong>Find my size</strong>. Or try <Link className="link" href="/finder">Frame Finder</Link>.</p>
      </>
    ),
  },
  {
    id: "prescription",
    title: "Reading your prescription",
    body: (
      <>
        <p>OD is your right eye and OS your left. <strong>SPH</strong> (sphere) is the main power: minus for distance, plus for near. <strong>CYL</strong> and <strong>AXIS</strong> correct astigmatism and always appear together. <strong>ADD</strong> is extra power for reading, used in progressive lenses. <strong>PD</strong> is the distance between your pupils.</p>
        <p className="mt-2">Powers above ±4.00 are called <strong>high power</strong>. Thin 1.67 lenses are lighter and look better for these.</p>
        <p className="mt-2">You can upload a photo, type the values in, or add it after ordering. Lenses are only made once an optometrist has checked it.</p>
      </>
    ),
  },
  {
    id: "payment",
    title: "Prices, offers and payment",
    body: (
      <>
        <p>The price you see on the product page is the full price: frame, lenses and coating, minus one offer. Shipping is free and there are no extra charges at checkout.</p>
        <p className="mt-2">We apply the single best offer for you automatically and explain it in one line. If you have a code, add it in your bag; we only use it if it saves you more.</p>
        <p className="mt-2">Pay by UPI, card, net banking, or cash on delivery (up to ₹10,000). <em>In this concept, payment is simulated and nothing is charged.</em></p>
      </>
    ),
  },
  {
    id: "shipping",
    title: "Shipping and delivery",
    body: <p>Free delivery anywhere in India in 4–7 days. Glasses with a prescription you add later ship 4–7 days after we receive it. You&apos;ll get an SMS when your order ships.</p>,
  },
  {
    id: "returns",
    title: "Returns and refunds",
    body: <p>Return any order within 14 days of delivery for a full refund, lenses included. We pick it up free. If your prescription lenses don&apos;t feel right, we remake them free within 14 days. You can cancel any order free until it ships.</p>,
  },
];

export default function HelpPage() {
  return (
    <div className="page grid-page gap-y-10 pb-16 pt-10 md:pt-14">
      <div className="col-span-4 md:col-span-8 xl:col-span-4">
        <h1 className="font-display text-5xl">Help</h1>
        <nav aria-label="Help topics" className="mt-6 xl:sticky xl:top-[calc(var(--header-h)+24px)]">
          <ul className="border-t border-ink">
            {SECTIONS.map((s) => (
              <li key={s.id} className="border-b border-line">
                <a href={`#${s.id}`} className="flex min-h-[48px] items-center justify-between font-semibold hover:text-accent">
                  {s.title} <Icon name="chevron-right" size={18} />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">Still stuck? <Link className="link" href="/stores">Visit a store</Link>. Staff can help with fit, lenses and orders.</p>
        </nav>
      </div>
      <div className="col-span-4 md:col-span-8 xl:col-span-7 xl:col-start-6">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="border-b border-line py-8 first:pt-0">
            <h2 id={`${s.id}-t`} className="font-display text-3xl">{s.title}</h2>
            <div className="mt-3 max-w-prose text-lg leading-relaxed">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
