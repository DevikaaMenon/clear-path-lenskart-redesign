"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { type NeedId } from "@/lib/taxonomy";
import { NEED_MENU } from "@/lib/nav";
import { NEED_ICON, needHref } from "@/lib/nav";
import { useShop } from "../providers/ShopProvider";
import { useTransitionNavigate } from "../motion/ViewTransition";
import { Icon } from "../ui/Icon";
import { ButtonLink } from "../ui/Button";
import { CHART_LINES, EyeChart } from "./EyeChart";
import { ringTicks } from "@/lib/frame-geometry";

const STEPS = [
  {
    q: "What are they for?",
    body: "Start with your need: to see clearly, for screens, for reading, for the sun, or contact lenses. Every page after this remembers it.",
    link: { href: "#needs", label: "Choose what your glasses are for" },
  },
  {
    q: "Which frame fits you?",
    body: "Answer three short questions in Frame Finder, or filter by size. Every frame shows its real measurements in millimetres.",
    link: { href: "/finder", label: "Find my frame in 3 questions" },
  },
  {
    q: "What will it cost?",
    body: "Frame, lenses, coating and offer, added up live as you choose. The best offer is applied for you, with one line saying why.",
    link: { href: "/help#payment", label: "How pricing and offers work" },
  },
  {
    q: "What happens next?",
    body: "Free delivery in 4–7 days, cash on delivery, 14-day returns, and a free eye test at any store if you need one.",
    link: { href: "/help#returns", label: "Read the returns promise" },
  },
];

export function HomeHero() {
  const { setNeed, need } = useShop();
  const navigate = useTransitionNavigate();
  const chartRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const chart = chartRef.current;
        const steps = stepsRef.current;
        if (!chart || !steps) return;
        const lines = Array.from(chart.querySelectorAll<HTMLElement>(".chart-soft [data-line]"));
        const box = () => chart.getBoundingClientRect();
        const pos = (i: number) => {
          const b = box();
          const r = lines[i].getBoundingClientRect();
          return { lx: `${((r.left + r.width / 2 - b.left) / b.width) * 100}%`, ly: `${((r.top + r.height / 2 - b.top) / b.height) * 100}%` };
        };
        const radius = (i: number) => `${[112, 92, 76, 62][i]}px`;

        // Intro: the lens slides in from the left and settles on line 1.
        const p0 = pos(0);
        gsap.fromTo(chart, { "--lx": "-15%", "--ly": p0.ly, "--lr": radius(0) }, { "--lx": p0.lx, duration: 1.1, ease: "power3.out", delay: 0.2 });

        // Scroll-linked: as each step passes the middle of the screen, the lens travels to its line.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: steps,
            start: "top 65%",
            end: "bottom 55%",
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (self) => setActive(Math.min(3, Math.floor(self.progress * 3.999))),
          },
        });
        for (let i = 1; i < 4; i++) {
          tl.to(chart, { "--lx": () => pos(i).lx, "--ly": () => pos(i).ly, "--lr": radius(i), ease: "power2.inOut", duration: 1 });
        }
        return () => tl.scrollTrigger?.kill();
      });
      ctx = mm;
    })();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  const pickNeed = (id: NeedId | "kids", e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (id !== "contacts" && id !== "kids") setNeed(id);
    const lens = e.currentTarget.querySelector<HTMLElement>("[data-lens]");
    navigate(needHref(id), lens);
  };

  return (
    <section aria-labelledby="hero-title" className="page relative">
      <div className="grid-page gap-y-10 pt-10 md:pt-16">
        {/* Left: the task */}
        <div className="col-span-4 md:col-span-8 lg:col-span-7">
          <p className="eyebrow flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-signal" aria-hidden="true" /> Step 1 · Start with what you need
          </p>
          <h1 id="hero-title" className="mt-4 font-display text-5xl" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}>
            What are your <em className="font-normal italic text-accent">glasses</em> for?
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg text-muted">
            Pick one. We&apos;ll show frames that suit it, add up the full price as you choose, and tell you exactly what happens after you order.
          </p>

          <ul id="needs" className="mt-8 grid grid-cols-1 gap-px border border-ink bg-ink sm:grid-cols-2 xl:grid-cols-3" aria-label="Shop by need">
            {NEED_MENU.map((n, i) => (
              <li key={n.id} className="bg-paper">
                <Link
                  href={needHref(n.id)}
                  onClick={(e) => pickNeed(n.id as NeedId | "kids", e)}
                  aria-describedby={`need-${n.id}-help`}
                  className="group flex h-full items-start gap-4 p-4 transition-colors duration-micro hover:bg-surface"
                  data-testid={`need-${n.id}`}
                >
                  <span
                    data-lens
                    className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-ink transition-[background-color,transform] duration-ui ease-click group-hover:scale-105 group-hover:bg-accent-soft ${need === n.id ? "bg-accent-soft" : "bg-surface"}`}
                  >
                    {/* Tick ring turns on hover, like a lens being dialled in */}
                    <svg viewBox="0 0 64 64" className="absolute inset-[-5px] h-[calc(100%+10px)] w-[calc(100%+10px)] text-ink opacity-0 transition-[opacity,transform] duration-page ease-settle group-hover:rotate-45 group-hover:opacity-100" aria-hidden="true">
                      {ringTicks(24, 32, 32, 30, 32).map((t) => (
                        <line key={t.i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="currentColor" strokeWidth="1.2" />
                      ))}
                    </svg>
                    <Icon name={NEED_ICON[n.id]} size={26} className="text-accent" />
                  </span>
                  <span className="min-w-0 flex-1">
                                        <span className="block pt-1 font-display text-xl leading-tight group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{n.label}</span>
                    <span id={`need-${n.id}-help`} className="mt-1 block text-sm leading-snug text-muted">{n.helper}</span>
                  </span>
                  <Icon name="arrow-right" size={20} className="mt-1.5 shrink-0 transition-transform duration-ui group-hover:translate-x-1 sm:hidden" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/finder" variant="primary" iconRight="arrow-right">Not sure? Find my frame in 3 questions</ButtonLink>
            <Link href="/stores" className="link inline-flex min-h-[44px] items-center">Book a free eye test first</Link>
          </div>
        </div>

        {/* Right: the eye chart, sticky while the steps scroll past */}
        <div className="col-span-4 md:col-span-8 lg:col-span-5 lg:row-span-2">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+32px)]">
            <EyeChart ref={chartRef} activeLabel={`Line ${active + 1}: ${CHART_LINES[active].text.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}`} />
          </div>
        </div>

        {/* How it works: the four questions (real text for everyone; drives the chart) */}
        <div className="col-span-4 md:col-span-8 lg:col-span-7">
          <h2 className="eyebrow mb-2 mt-6 !text-ink">How Clear Path works</h2>
          <ol ref={stepsRef} className="border-t border-ink">
            {STEPS.map((s, i) => (
              <li key={s.q} className={`grid grid-cols-[3rem_1fr] gap-x-4 border-b border-line py-8 lg:min-h-[38vh] lg:py-12 ${active === i ? "" : "lg:[&_.step-q]:text-muted"}`}>
                <span className="num pt-2 text-sm text-muted">0{i + 1}</span>
                <div>
                  <h3 className="step-q font-display text-3xl transition-colors duration-ui">{s.q}</h3>
                  <p className="mt-3 max-w-[56ch] text-lg text-muted">{s.body}</p>
                  <Link href={s.link.href} className="link mt-4 inline-flex min-h-[44px] items-center gap-1">
                    {s.link.label} <Icon name="arrow-right" size={18} />
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
