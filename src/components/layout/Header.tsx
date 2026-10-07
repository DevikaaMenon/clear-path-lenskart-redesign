"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { NEEDS, SHAPES, needById, type NeedId } from "@/lib/taxonomy";
import { useShop } from "../providers/ShopProvider";
import { Icon } from "../ui/Icon";
import { NEED_ICON, NEED_MENU, needHref } from "@/lib/nav";
import { IconButton } from "../ui/Button";
import { Drawer } from "../ui/Drawer";
import { ShapeGlyph } from "../frames/ShapeGlyph";
import { UxMarker } from "../ux/UxMarker";

type MenuId = "need" | "shape" | null;

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group flex items-baseline gap-2 ${className}`} aria-label="Lenskart redesign concept, home">
      <span className="font-display text-[1.6rem] font-semibold leading-none tracking-[-0.03em]">Lenskart</span>
      <span className="eyebrow hidden !text-[0.6875rem] sm:inline">redesign concept</span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { need, setNeed, cartCount, wishlist, largeText, setLargeText } = useShop();
  const [menu, setMenu] = useState<MenuId>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [needOpen, setNeedOpen] = useState(false);
  const reduce = useReducedMotion();
  const headerRef = useRef<HTMLElement>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  const needMenuId = useId();
  const shapeMenuId = useId();

  // Close menus on navigation
  useEffect(() => {
    setMenu(null);
    setMobileOpen(false);
    setSearchOpen(false);
    setNeedOpen(false);
  }, [pathname]);

  // Escape and outside click close desktop menus
  useEffect(() => {
    if (!menu && !needOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setNeedOpen(false);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setMenu(null);
        setNeedOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [menu, needOpen]);

  const hoverOpen = (id: MenuId) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setMenu(id), 120); // hover intent
  };
  const hoverClose = () => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setMenu(null), 220);
  };

  const needObj = needById(need);
  const withNeed = (href: string) => (need && need !== "contacts" && href.startsWith("/shop") ? `${href}${href.includes("?") ? "&" : "?"}need=${need}` : href);

  const navItem =
    "relative flex h-full items-center gap-1 whitespace-nowrap px-2.5 2xl:px-3 text-[0.9375rem] font-semibold text-ink transition-colors duration-micro hover:text-accent " +
    "after:absolute after:inset-x-2.5 2xl:after:inset-x-3 after:bottom-[18px] after:h-[2px] after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-ui after:ease-settle hover:after:scale-x-100 aria-[current=page]:after:scale-x-100 aria-expanded:after:scale-x-100";

  return (
    <header ref={headerRef} className="sticky top-0 z-header border-b border-ink bg-paper" onMouseLeave={hoverClose}>
      <div className="page flex h-[var(--header-h)] items-center gap-4">
        {/* Mobile: menu button */}
        <IconButton icon="menu" label="Open menu" data-menu-button className="-ml-2 xl:hidden" onClick={() => setMobileOpen(true)} aria-haspopup="dialog" />
        <div className="relative">
          <Wordmark />
          <UxMarker id="home-header" />
        </div>

        {/* Desktop navigation: shopping only, plus Stores and Help (U1) */}
        <nav aria-label="Main" data-desktop-nav className="ml-2 hidden h-full xl:block">
          <ul className="flex h-full items-stretch">
            <li className="h-full" onMouseEnter={() => hoverOpen("need")}>
              <button className={navItem} aria-expanded={menu === "need"} aria-controls={needMenuId} onClick={() => setMenu(menu === "need" ? null : "need")}>
                Shop by need <Icon name="chevron-down" size={16} className={`transition-transform duration-ui ${menu === "need" ? "rotate-180" : ""}`} />
              </button>
            </li>
            <li className="h-full" onMouseEnter={() => hoverOpen("shape")}>
              <button className={navItem} aria-expanded={menu === "shape"} aria-controls={shapeMenuId} onClick={() => setMenu(menu === "shape" ? null : "shape")}>
                Frames by shape <Icon name="chevron-down" size={16} className={`transition-transform duration-ui ${menu === "shape" ? "rotate-180" : ""}`} />
              </button>
            </li>
            <li className="relative h-full" onMouseEnter={() => hoverOpen(null)}>
              <Link href="/finder" className={navItem} aria-current={pathname === "/finder" ? "page" : undefined}>Find my frame</Link>
              <UxMarker id="home-nav-help" className="!top-0.5" />
            </li>
            <li className="h-full" onMouseEnter={() => hoverOpen(null)}>
              <Link href="/stores" className={navItem} aria-current={pathname === "/stores" ? "page" : undefined}>Eye test &amp; stores</Link>
            </li>
            <li className="h-full" onMouseEnter={() => hoverOpen(null)}>
              <Link href="/help" className={navItem} aria-current={pathname === "/help" ? "page" : undefined}>Help</Link>
            </li>
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {/* Need carried through the journey (X2) */}
          <div className="relative hidden md:block">
            <button
              className="flex min-h-[44px] items-center gap-2 rounded-lens border border-line-strong bg-surface py-1.5 pl-2 pr-3 text-sm transition-colors duration-micro hover:border-ink"
              aria-expanded={needOpen}
              aria-haspopup="true"
              onClick={() => setNeedOpen((v) => !v)}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-accent">
                <Icon name={needObj ? NEED_ICON[needObj.id] : "help"} size={16} />
              </span>
              <span className="whitespace-nowrap text-left leading-tight">
                <span className="block text-[0.75rem] text-muted">Glasses for</span>
                <span className="block font-semibold">{needObj ? needObj.short : "Not chosen"}</span>
              </span>
              <Icon name="chevron-down" size={16} />
            </button>
            <AnimatePresence>
              {needOpen ? (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-[calc(100%+8px)] w-[300px] border border-ink bg-surface p-2 shadow-lift"
                >
                  <NeedRadioList
                    value={need}
                    onChange={(n) => {
                      setNeed(n);
                      setNeedOpen(false);
                      if (pathname.startsWith("/shop") && n) router.push(n === "contacts" ? "/contact-lenses" : `/shop?need=${n}`);
                    }}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <IconButton
            icon="text"
            label={largeText ? "Use standard text size" : "Use larger text"}
            pressed={largeText}
            onClick={() => setLargeText(!largeText)}
            className="hidden sm:inline-grid"
            title="Larger text"
          />
          <IconButton icon="search" label="Search frames" aria-expanded={searchOpen} onClick={() => setSearchOpen((v) => !v)} />
          <Link href="/wishlist" className="relative hidden h-11 w-11 place-items-center rounded-full transition-colors hover:bg-sunk sm:grid" aria-label={`Wishlist, ${wishlist.size} saved`}>
            <Icon name="heart" size={22} />
            {wishlist.size ? <span className="num absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.75rem] font-bold text-paper" aria-hidden="true">{wishlist.size}</span> : null}
          </Link>
          <Link href="/cart" className="relative grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-sunk" aria-label={`Bag, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}>
            <Icon name="bag" size={22} />
            <AnimatePresence>
              {cartCount ? (
                <motion.span
                  key={cartCount}
                  initial={reduce ? false : { scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 520, damping: 18 }}
                  className="num absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1 text-[0.75rem] font-bold text-white"
                  aria-hidden="true"
                >
                  {cartCount}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </Link>
          <Link href="/account" className="hidden h-11 w-11 place-items-center rounded-full transition-colors hover:bg-sunk md:grid" aria-label="Account">
            <Icon name="user" size={22} />
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {searchOpen ? (
          <motion.div
            initial={reduce ? false : { height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line bg-surface"
          >
            <form
              role="search"
              className="page flex items-center gap-3 py-3"
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get("q")?.toString().trim();
                router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
              }}
            >
              <label htmlFor="site-search" className="sr-only">Search frames by name, shape, colour or model code</label>
              <Icon name="search" size={22} className="text-muted" />
              <input
                id="site-search"
                name="q"
                autoFocus
                placeholder="Search by name, shape, colour or model code"
                className="min-h-[48px] flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
              />
              <button className="min-h-[44px] px-3 font-semibold text-accent underline-offset-4 hover:underline">Search</button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Desktop mega panels */}
      <AnimatePresence>
        {menu ? (
          <motion.div
            key={menu}
            id={menu === "need" ? needMenuId : shapeMenuId}
            onMouseEnter={() => window.clearTimeout(hoverTimer.current)}
            initial={reduce ? false : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            data-mega
            className="absolute inset-x-0 top-full hidden border-b border-ink bg-paper xl:block"
          >
            {menu === "need" ? (
              <div className="page grid grid-cols-6 gap-px bg-line py-0">
                {NEED_MENU.map((n, i) => (
                  <Link
                    key={n.id}
                    href={needHref(n.id)}
                    onClick={() => (n.id !== "kids" ? setNeed(n.id as NeedId) : undefined)}
                    className="group flex flex-col gap-3 bg-paper px-4 py-6 transition-colors duration-micro hover:bg-surface"
                  >
                    <span className="num text-xs text-muted">0{i + 1}</span>
                    <Icon name={NEED_ICON[n.id]} size={28} className="text-accent transition-transform duration-ui ease-click group-hover:-translate-y-0.5" />
                    <span className="font-display text-xl leading-tight group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{n.label}</span>
                    <span className="text-sm text-muted">{n.helper}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="page grid grid-cols-8 gap-px bg-line">
                {SHAPES.map((s) => (
                  <Link key={s.id} href={withNeed(`/shop?shape=${s.id}`)} className="group flex flex-col items-start gap-3 bg-paper px-4 py-6 transition-colors duration-micro hover:bg-surface">
                    <ShapeGlyph shape={s.id} className="h-8 w-16 text-ink transition-transform duration-ui ease-click group-hover:scale-110" />
                    <span className="font-display text-xl">{s.label}</span>
                    <span className="text-sm text-muted">{s.helper}</span>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Mobile navigation drawer */}
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} title="Menu" side="left">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="m-need">
            <h3 id="m-need" className="eyebrow mb-2">What are the glasses for?</h3>
            <NeedRadioList
              value={need}
              onChange={(n) => {
                setNeed(n);
                setMobileOpen(false);
                if (n) router.push(n === "contacts" ? "/contact-lenses" : `/shop?need=${n}`);
              }}
            />
          </section>
          <nav aria-label="Main">
            <ul className="flex flex-col border-t border-line">
              {[
                ["/shop?audience=kids", "Kids' glasses"],
                ["/shop", "All frames"],
                ["/finder", "Find my frame"],
                ["/stores", "Eye test & stores"],
                ["/help", "Help"],
                ["/wishlist", `Wishlist (${wishlist.size})`],
                ["/account", "Account"],
              ].map(([href, label]) => (
                <li key={href} className="border-b border-line">
                  <Link href={href} className="flex min-h-[52px] items-center justify-between text-lg font-semibold">
                    {label} <Icon name="chevron-right" size={20} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <section aria-labelledby="m-shape">
            <h3 id="m-shape" className="eyebrow mb-2">Frames by shape</h3>
            <ul className="grid grid-cols-2 gap-2">
              {SHAPES.map((s) => (
                <li key={s.id}>
                  <Link href={withNeed(`/shop?shape=${s.id}`)} className="flex min-h-[52px] items-center gap-2 border border-line px-3 hover:border-ink">
                    <ShapeGlyph shape={s.id} className="h-5 w-10" /> {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <button
            className="flex min-h-[48px] items-center justify-between border border-line-strong px-3"
            aria-pressed={largeText}
            onClick={() => setLargeText(!largeText)}
          >
            <span className="flex items-center gap-2 font-semibold"><Icon name="text" /> Larger text</span>
            <span className="num text-sm">{largeText ? "On" : "Off"}</span>
          </button>
        </div>
      </Drawer>
    </header>
  );
}

/** Radio list for choosing the need (used in header popover and mobile menu). */
export function NeedRadioList({ value, onChange }: { value: NeedId | null; onChange: (n: NeedId | null) => void }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="sr-only">What are the glasses for?</legend>
      <div className="flex flex-col">
        {NEEDS.map((n) => (
          <label
            key={n.id}
            className="group flex min-h-[48px] cursor-pointer items-center gap-3 px-2 py-2 transition-colors duration-micro hover:bg-sunk has-[:checked]:bg-accent-soft has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus"
          >
            <input type="radio" name={name} className="sr-only" checked={value === n.id} onChange={() => onChange(n.id)} />
            <Icon name={NEED_ICON[n.id]} size={20} className="text-accent" />
            <span className="flex-1">
              <span className="block font-semibold">{n.label}</span>
              <span className="block text-sm text-muted">{n.helper}</span>
            </span>
            {value === n.id ? <Icon name="check" size={18} /> : null}
          </label>
        ))}
        {value ? (
          <button className="mt-1 min-h-[44px] px-2 text-left text-sm font-semibold text-accent underline-offset-4 hover:underline" onClick={() => onChange(null)}>
            Clear choice
          </button>
        ) : null}
      </div>
    </fieldset>
  );
}
