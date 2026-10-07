import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import "./globals.css";
import { ShopProvider } from "@/components/providers/ShopProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RouteFocus } from "@/components/layout/RouteFocus";
import { Toasts } from "@/components/ui/Toasts";
import { CompareTray } from "@/components/compare/CompareTray";
import { TestMode } from "@/components/testmode/TestMode";
import { ViewTransitionBridge } from "@/components/motion/ViewTransition";
import { NEED_IDS, type NeedId } from "@/lib/taxonomy";

// Self-hosted, SIL Open Font License faces (copied from @fontsource by scripts/copy-fonts.mjs).
const display = localFont({
  src: [
    { path: "./fonts/fraunces-var.woff2", style: "normal", weight: "100 900" },
    { path: "./fonts/fraunces-var-italic.woff2", style: "italic", weight: "100 900" },
  ],
  variable: "--font-display-src",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});
const text = localFont({
  src: [
    { path: "./fonts/atkinson-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/atkinson-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/atkinson-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-text-src",
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});
const mono = localFont({
  src: [{ path: "./fonts/jetbrains-mono-var.woff2", weight: "100 800", style: "normal" }],
  variable: "--font-mono-src",
  display: "swap",
  fallback: ["ui-monospace", "Consolas", "monospace"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: { default: "Clear Path · Lenskart redesign concept", template: "%s · Lenskart redesign concept" },
  description: "Academic UX redesign concept of an eyewear store. Not affiliated with or endorsed by Lenskart.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f1e8",
};

// Applies the saved "Larger text" preference before first paint (no flash, no layout jump).
const textPrefScript = `try{var t=JSON.parse(localStorage.getItem("cp_text")||"null");if(t==="large")document.documentElement.dataset.text="large"}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const c = jar.get("cp_need")?.value;
  const initialNeed = (NEED_IDS as string[]).includes(c ?? "") ? (c as NeedId) : null;

  return (
    <html lang="en-IN" className={`${display.variable} ${text.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: textPrefScript }} />
      </head>
      <body>
        <ShopProvider initialNeed={initialNeed}>
          <a href="#main" className="skip-link">Skip to main content</a>
          <div id="app-root">
            <Header />
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <Footer />
          </div>
          <CompareTray />
          <Toasts />
          <RouteFocus />
          <TestMode />
          <ViewTransitionBridge />
        </ShopProvider>
      </body>
    </html>
  );
}
