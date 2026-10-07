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
import { UxReviewProvider } from "@/components/ux/UxReviewProvider";
import { UxReviewBar } from "@/components/ux/UxReviewBar";
import { NEED_IDS, type NeedId } from "@/lib/taxonomy";

// Brand typeface as used on lenskart.com: Plus Jakarta Sans (SIL Open Font License),
// self-hosted (copied from @fontsource by scripts/copy-fonts.mjs). One family for
// headings, body text and numbers, as on the real site.
const brand = localFont({
  src: [
    { path: "./fonts/jakarta-var.woff2", style: "normal", weight: "200 800" },
    { path: "./fonts/jakarta-var-italic.woff2", style: "italic", weight: "200 800" },
  ],
  variable: "--font-brand-src",
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
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
  themeColor: "#ffffff",
};

// Applies the saved "Larger text" preference before first paint (no flash, no layout jump).
const textPrefScript = `try{var t=JSON.parse(localStorage.getItem("cp_text")||"null");if(t==="large")document.documentElement.dataset.text="large";if(localStorage.getItem("cp_ux_markers")==="off")document.documentElement.dataset.ux="off"}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const c = jar.get("cp_need")?.value;
  const initialNeed = (NEED_IDS as string[]).includes(c ?? "") ? (c as NeedId) : null;

  return (
    <html lang="en-IN" className={brand.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: textPrefScript }} />
      </head>
      <body>
        <ShopProvider initialNeed={initialNeed}>
          <UxReviewProvider>
          <a href="#main" className="skip-link">Skip to main content</a>
          <div id="app-root">
            <UxReviewBar />
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
          </UxReviewProvider>
        </ShopProvider>
      </body>
    </html>
  );
}
