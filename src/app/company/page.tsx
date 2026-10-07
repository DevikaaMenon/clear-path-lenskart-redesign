import type { Metadata } from "next";

export const metadata: Metadata = { title: "Company" };

// U1: these links used to crowd the utility bar above the shop navigation.
// In the redesign they live in the footer under "Company". Content is placeholder.
const ITEMS = [
  ["about", "About us"],
  ["careers", "Careers"],
  ["corporate", "Corporate and bulk orders"],
  ["partners", "Franchise and partners"],
  ["engineering", "Engineering blog"],
  ["international", "International sites"],
  ["investors", "Investor relations"],
] as const;

export default function CompanyPage() {
  return (
    <div className="page max-w-4xl pb-16 pt-10 md:pt-14">
      <h1 className="font-display text-5xl">Company</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">
        In this redesign, corporate, partner, engineering and international links sit here and in the footer, not above the shopping
        navigation. This page is a placeholder in the academic concept.
      </p>
      <div className="mt-8 border-t border-ink">
        {ITEMS.map(([id, title]) => (
          <section key={id} id={id} aria-labelledby={`${id}-t`} className="border-b border-line py-6">
            <h2 id={`${id}-t`} className="font-display text-2xl">{title}</h2>
            <p className="mt-1 text-muted">Placeholder content for the concept. No real company information is shown.</p>
          </section>
        ))}
      </div>
    </div>
  );
}
