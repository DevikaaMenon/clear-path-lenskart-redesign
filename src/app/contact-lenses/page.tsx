import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Contact lenses" };

export default function ContactLensesPage() {
  return (
    <div className="page grid-page gap-y-8 pb-16 pt-10 md:pt-14">
      <div className="col-span-4 md:col-span-8 xl:col-span-7">
        <p className="eyebrow">Shopping for</p>
        <div className="mt-2 flex items-end gap-5">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-2 border-ink bg-accent-soft text-accent md:h-28 md:w-28" style={{ viewTransitionName: "need-lens" }} aria-hidden="true">
            <Icon name="contact" size={40} />
          </span>
          <h1 className="font-display text-5xl">Contact lenses</h1>
        </div>
        <p className="mt-6 max-w-prose text-lg">
          Contact lenses need a contact-lens prescription, which is different from a glasses prescription. It includes the lens curve and diameter.
        </p>
        <div className="mt-6 border-l-2 border-accent bg-accent-soft p-4">
          <p className="font-bold">Not part of this prototype</p>
          <p className="mt-1 text-muted">This academic concept focuses on frames and lenses. A real contact-lens catalogue would follow the same need-first pattern: choose daily, monthly or coloured, then enter your contact-lens prescription.</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/stores" variant="primary" iconRight="arrow-right">Book a free contact-lens eye test</ButtonLink>
          <ButtonLink href="/shop?need=computer" variant="secondary">Shop computer glasses instead</ButtonLink>
        </div>
      </div>
    </div>
  );
}
