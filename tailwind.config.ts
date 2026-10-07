import type { Config } from "tailwindcss";

// All design values come from CSS variables in src/app/tokens.css.
// Tailwind only maps names to those variables, so the tokens are the single source.
const v = (name: string) => `var(--${name})`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    // Breakpoints in em (×16px at default text size) so layouts reflow when people
    // enlarge text in their browser settings, not only when they zoom (WCAG 1.4.4).
    screens: {
      sm: "30em", // 480px
      md: "52.125em", // 834px, tablet composition (8 columns)
      lg: "64em", // 1024px
      xl: "80em", // 1280px
      "2xl": "90em", // 1440px, desktop composition (12 columns)
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      paper: v("c-paper"),
      surface: v("c-surface"),
      sunk: v("c-sunk"),
      ink: v("c-ink"),
      "ink-2": v("c-ink-2"),
      muted: v("c-muted"),
      line: v("c-line"),
      "line-strong": v("c-line-strong"),
      accent: v("c-accent"),
      "accent-ink": v("c-accent-ink"),
      "accent-soft": v("c-accent-soft"),
      signal: v("c-signal"),
      highlight: v("c-highlight"),
      success: v("c-success"),
      "success-soft": v("c-success-soft"),
      warning: v("c-warning"),
      "warning-soft": v("c-warning-soft"),
      danger: v("c-danger"),
      "danger-soft": v("c-danger-soft"),
      focus: v("c-focus"),
      brand: v("c-brand"),
      note: v("c-note"),
      "note-soft": v("c-note-soft"),
      white: "#ffffff",
    },
    fontFamily: {
      display: [v("font-display"), "Georgia", "serif"],
      sans: [v("font-text"), "system-ui", "sans-serif"],
      mono: [v("font-mono"), "ui-monospace", "monospace"],
    },
    fontSize: {
      // [size, line-height]; all rem so "Larger text" mode scales everything.
      xs: ["0.875rem", { lineHeight: "1.4" }], // 14px: metadata only, never body copy
      sm: ["0.9375rem", { lineHeight: "1.5" }], // 15px: dense UI labels
      base: ["1rem", { lineHeight: "1.6" }], // 16px: minimum body
      lg: ["1.125rem", { lineHeight: "1.55" }],
      xl: ["1.375rem", { lineHeight: "1.35" }],
      "2xl": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      "3xl": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
      "4xl": ["clamp(2.25rem, 1.5rem + 2.8vw, 3.5rem)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
      "5xl": ["clamp(2.75rem, 1.4rem + 5vw, 5.5rem)", { lineHeight: "1.02", letterSpacing: "-0.025em" }],
      "6xl": ["clamp(3.25rem, 0.8rem + 8vw, 8.5rem)", { lineHeight: "0.98", letterSpacing: "-0.03em" }],
    },
    borderRadius: {
      none: "0",
      xs: v("r-xs"),
      sm: v("r-sm"),
      md: v("r-md"),
      lens: v("r-lens"),
      full: "9999px",
    },
    extend: {
      maxWidth: { page: "1440px", prose: "64ch" },
      transitionTimingFunction: {
        settle: v("ease-settle"),
        glide: v("ease-glide"),
        click: v("ease-click"),
        leave: v("ease-leave"),
      },
      transitionDuration: {
        micro: v("dur-micro"),
        ui: v("dur-ui"),
        page: v("dur-page"),
      },
      boxShadow: {
        // Elevation is an offset hairline, not a blur.
        lift: "4px 4px 0 0 var(--c-ink)",
        "lift-sm": "2px 2px 0 0 var(--c-ink)",
        sheet: "0 -1px 0 0 var(--c-line), 0 -12px 32px -16px rgb(15 29 43 / 0.25)",
      },
      zIndex: { header: "40", tray: "45", overlay: "50", toast: "60", skip: "70" },
    },
  },
  plugins: [],
};

export default config;
