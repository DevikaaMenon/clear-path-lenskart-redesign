import Link from "next/link";
import { NEED_MENU, needHref } from "@/lib/nav";

const HELP = [
  ["/help#size", "Size and fit guide"],
  ["/help#prescription", "Reading your prescription"],
  ["/help#returns", "Returns and refunds"],
  ["/help#shipping", "Shipping and delivery"],
  ["/help#payment", "Payment and COD"],
  ["/stores", "Book a free eye test"],
] as const;

// U1: corporate, partner, engineering and international links live here, not in the header.
const COMPANY = [
  ["/company#about", "About us"],
  ["/company#careers", "Careers"],
  ["/company#corporate", "Corporate and bulk orders"],
  ["/company#partners", "Franchise and partners"],
  ["/company#engineering", "Engineering blog"],
  ["/company#international", "International sites"],
  ["/company#investors", "Investor relations"],
] as const;

export function Footer() {
  return (
    <footer className="theme-ink mt-24" aria-labelledby="footer-title">
      <h2 id="footer-title" className="sr-only">Site information</h2>
      <div className="page grid-page gap-y-12 py-16">
        <div className="col-span-4 md:col-span-8 xl:col-span-4">
          <p className="font-display text-4xl leading-[1.02]">
            Know what you need.
            <br />
            <em className="text-accent">See what it costs.</em>
          </p>
          <p className="mt-4 max-w-sm text-muted">
            Clear Path is a task-first redesign concept for buying glasses online, built for a UI/UX design course.
          </p>
        </div>
        <FooterCol title="Shop" className="col-span-2 md:col-span-2 xl:col-span-2 xl:col-start-6">
          {NEED_MENU.map((n) => (
            <li key={n.id}><Link className="footer-link" href={needHref(n.id)}>{n.label}</Link></li>
          ))}
          <li><Link className="footer-link" href="/finder">Find my frame</Link></li>
        </FooterCol>
        <FooterCol title="Help" className="col-span-2 md:col-span-3 xl:col-span-2">
          {HELP.map(([href, label]) => (
            <li key={href}><Link className="footer-link" href={href}>{label}</Link></li>
          ))}
        </FooterCol>
        <FooterCol title="Company" className="col-span-4 md:col-span-3 xl:col-span-3">
          {COMPANY.map(([href, label]) => (
            <li key={href}><Link className="footer-link" href={href}>{label}</Link></li>
          ))}
        </FooterCol>
      </div>
      <div className="border-t border-line">
        <div className="page flex flex-col gap-3 py-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p className="font-semibold text-ink">Academic redesign concept. Not affiliated with or endorsed by Lenskart.</p>
          <p>
            MCA263D4 Principles of UI/UX Design · Synthetic catalogue and demo checkout, no real payment.{" "}
            <Link href="/design-system" className="footer-link">Design system</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <nav aria-label={title} className={className}>
      <h3 className="eyebrow mb-3 !text-ink">{title}</h3>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </nav>
  );
}
