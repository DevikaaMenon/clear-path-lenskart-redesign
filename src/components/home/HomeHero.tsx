"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { type NeedId } from "@/lib/taxonomy";
import { NEED_ICON, NEED_MENU, needHref } from "@/lib/nav";
import { useShop } from "../providers/ShopProvider";
import { useTransitionNavigate } from "../motion/ViewTransition";
import { Icon } from "../ui/Icon";
import { ButtonLink } from "../ui/Button";
import { CHART_LINES, EyeChart } from "./EyeChart";
import { UxMarker } from "../ux/UxMarker";
import { PHOTOS } from "@/lib/photos";

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
    <>
      {/* One hero panel: question, six choices, the alternative path, and the photo as one composition */}
      <section aria-labelledby="hero-title" className="page pt-6 md:pt-8">
        <div className="overflow-hidden rounded-[28px] bg-sunk lg:grid lg:grid-cols-12">
          <div className="p-5 sm:p-8 lg:col-span-8 lg:px-12 lg:py-10">
            <p className="eyebrow flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-signal" aria-hidden="true" /> Step 1 · Start with what you need
            </p>
            <h1 id="hero-title" className="mt-3 font-display text-5xl lg:text-[clamp(2.75rem,min(1.2rem_+_3.8vw,8svh),4.5rem)]">
              What are your <em className="font-normal italic text-accent">glasses</em> for?
            </h1>
            <p className="mt-3 max-w-[48ch] text-lg text-muted">
              Pick one. We&apos;ll show frames that suit it, add up the full price as you choose, and tell you exactly what happens after you order.
            </p>

            {/* Direct path: choose a need */}
            <div className="relative mt-6">
              <UxMarker id="home-need-tiles" />
              <ul id="needs" className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-3" aria-label="Shop by need">
                {NEED_MENU.map((n) => {
                  const selected = need === n.id;
                  return (
                    <li key={n.id}>
                      <Link
                        href={needHref(n.id)}
                        onClick={(e) => pickNeed(n.id as NeedId | "kids", e)}
                        aria-describedby={`need-${n.id}-help`}
                        className={`group flex h-full flex-col gap-2 rounded-[18px] border bg-paper p-4 shadow-[0_1px_2px_rgb(0_0_66/0.04),0_6px_20px_-12px_rgb(0_0_66/0.18)] transition-[border-color,box-shadow,transform] duration-ui ease-settle hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_2px_4px_rgb(0_0_66/0.05),0_12px_28px_-14px_rgb(0_0_66/0.28)] md:p-5 ${selected ? "border-ink" : "border-line"}`}
                        data-testid={`need-${n.id}`}
                      >
                        <span
                          data-lens
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors duration-ui ${selected ? "bg-ink text-paper" : "bg-accent-soft text-accent group-hover:bg-ink group-hover:text-paper"}`}
                        >
                          <Icon name={NEED_ICON[n.id]} size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-display text-[1.0625rem] leading-tight">{n.label}</span>
                          <span id={`need-${n.id}-help`} className="mt-1 block text-[0.8125rem] leading-snug text-muted">{n.tagline}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Alternative path: let the site help */}
            <div className="mt-4 flex items-center gap-4 text-sm text-muted" aria-hidden="true">
              <span className="h-px flex-1 bg-line-strong opacity-50" />
              or
              <span className="h-px flex-1 bg-line-strong opacity-50" />
            </div>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-xl">Not sure what you need?</p>
                <p className="mt-1 text-sm text-muted">
                  Answer three quick questions and we&apos;ll suggest frames. Or{" "}
                  <Link href="/stores" className="link inline-flex min-h-[24px] items-center">book a free eye test first</Link>.
                </p>
              </div>
              <span className="relative inline-flex shrink-0">
                <ButtonLink href="/finder" variant="primary" iconRight="arrow-right">Find my frame in 3 questions</ButtonLink>
                <UxMarker id="home-find-frame" />
              </span>
            </div>
          </div>

          {/* The photo fills the panel's right side, so it reads as part of the section (never behind text) */}
          <div className="relative h-72 sm:h-96 lg:col-span-4 lg:h-auto">
            <Image
              src={PHOTOS.hero.src}
              alt={PHOTOS.hero.alt}
              fill
              priority
              placeholder="blur"
              quality={70}
              sizes="(min-width: 64em) 33vw, 100vw"
              className="object-cover object-[55%_50%]"
            />
          </div>
        </div>
      </section>

      {/* How it works: its own section with an introduction; the four questions drive the sticky eye chart */}
      <section aria-labelledby="how-title" className="page mt-20 md:mt-28">
        <div className="grid-page gap-y-10">
          <div className="col-span-4 md:col-span-8 lg:col-span-7">
            <p className="eyebrow">How Clear Path works</p>
            <h2 id="how-title" className="mt-3 max-w-[20ch] font-display text-4xl">From choosing to delivery, in four steps.</h2>
            <ol ref={stepsRef} className="mt-10">
              {STEPS.map((s, i) => (
                <li key={s.q} className={`grid grid-cols-[3rem_1fr] gap-x-4 border-t border-line py-8 lg:min-h-[38vh] lg:py-12 ${active === i ? "" : "lg:[&_.step-q]:text-muted"}`}>
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
          <div className="col-span-4 md:col-span-8 lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+32px)]">
              <EyeChart ref={chartRef} activeLabel={`Line ${active + 1}: ${CHART_LINES[active].text.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}`} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
