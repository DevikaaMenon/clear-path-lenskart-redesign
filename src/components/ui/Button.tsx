"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { Icon, IconName } from "./Icon";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 rounded-xs font-semibold select-none " +
  "transition-[transform,box-shadow,background-color,color,border-color] duration-micro ease-settle " +
  "disabled:cursor-not-allowed aria-disabled:cursor-not-allowed text-center [overflow-wrap:anywhere]";

// Hover: the button lifts off its hairline shadow (like a card pulled from a tray).
// Active: it presses flat. Disabled: flat, muted, no lift.
const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-paper border border-ink hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-lift-sm active:translate-x-0 active:translate-y-0 active:shadow-none " +
    "disabled:bg-line disabled:border-line disabled:text-muted disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none",
  accent:
    "bg-accent text-accent-ink border border-accent hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-lift-sm active:translate-x-0 active:translate-y-0 active:shadow-none " +
    "disabled:bg-line disabled:border-line disabled:text-muted disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none",
  secondary:
    "bg-surface text-ink border border-ink hover:bg-sunk active:bg-line " +
    "disabled:text-muted disabled:border-line disabled:bg-transparent",
  ghost:
    "bg-transparent text-ink border border-transparent hover:bg-sunk active:bg-line disabled:text-muted",
  danger:
    "bg-surface text-danger border border-danger hover:bg-danger-soft active:bg-danger-soft disabled:text-muted disabled:border-line",
};

const sizes: Record<Size, string> = {
  // Labels may wrap (enlarged text, 320px screens), so height grows with padding instead of clipping.
  sm: "min-h-[40px] px-4 py-1.5 text-sm tap",
  md: "min-h-[48px] px-5 py-2 text-base",
  lg: "min-h-[56px] px-7 py-2.5 text-lg",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  loadingText?: string;
  full?: boolean;
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="animate-spin">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon, iconRight, loading, loadingText, full, className = "", children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${full ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : icon ? <Icon name={icon} size={20} className="shrink-0" /> : null}
      <span>{loading && loadingText ? loadingText : children}</span>
      {iconRight && !loading ? (
        <Icon name={iconRight} size={20} className="shrink-0 transition-transform duration-ui ease-settle group-hover/btn:translate-x-[3px]" />
      ) : null}
    </button>
  );
});

export function ButtonLink({
  href, variant = "primary", size = "md", icon, iconRight, full, className = "", children, ...rest
}: { href: string; variant?: Variant; size?: Size; icon?: IconName; iconRight?: IconName; full?: boolean } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${full ? "w-full" : ""} ${className}`} {...rest}>
      {icon ? <Icon name={icon} size={20} className="shrink-0" /> : null}
      <span>{children}</span>
      {iconRight ? (
        <Icon name={iconRight} size={20} className="shrink-0 transition-transform duration-ui ease-settle group-hover/btn:translate-x-[3px]" />
      ) : null}
    </Link>
  );
}

/** Square icon-only button with an accessible name and a 44px target. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  { icon: IconName; label: string; badge?: number; pressed?: boolean; size?: "sm" | "md" } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function IconButton({ icon, label, badge, pressed, size = "md", className = "", ...rest }, ref) {
  return (
    <button
      ref={ref}
      aria-label={label}
      aria-pressed={pressed}
      className={`relative inline-grid place-items-center ${size === "md" ? "h-11 w-11" : "h-10 w-10 tap"} rounded-full text-ink transition-colors duration-micro hover:bg-sunk active:bg-line ${className}`}
      {...rest}
    >
      <Icon name={icon} size={22} />
      {badge ? (
        <span className="num absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1 text-[0.75rem] font-bold leading-none text-white" aria-hidden="true">
          {badge}
        </span>
      ) : null}
    </button>
  );
});
