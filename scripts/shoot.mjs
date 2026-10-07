// Dev helper: screenshot pages at several widths and print console errors.
// Usage: node scripts/shoot.mjs <outDir> <path>[,<path>...] [widths=1440,390] [--full] [--reduced] [--large]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [outDir, pathsArg, widthsArg = "1440,390", ...flags] = process.argv.slice(2);
const full = flags.includes("--full");
const reduced = flags.includes("--reduced");
const large = flags.includes("--large");
const base = process.env.BASE_URL ?? "http://localhost:3000";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const w of widthsArg.split(",").map(Number)) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: w < 600 ? 844 : 900 },
    deviceScaleFactor: 1,
    reducedMotion: reduced ? "reduce" : "no-preference",
    hasTouch: w < 600,
    isMobile: w < 600,
  });
  if (large) await ctx.addInitScript(() => localStorage.setItem("cp_text", JSON.stringify("large")));
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errors.push(`${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  for (const p of pathsArg.split(",")) {
    const res = await page.goto(base + p, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(900);
    const name = `${p.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home"}-${w}${reduced ? "-rm" : ""}${large ? "-lg" : ""}.png`;
    await page.screenshot({ path: `${outDir}/${name}`, fullPage: full });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`${res?.status()} ${p} @${w} -> ${name}${overflow > 0 ? `  [HORIZONTAL OVERFLOW ${overflow}px]` : ""}`);
  }
  if (errors.length) console.log(`console @${w}:\n  ` + [...new Set(errors)].slice(0, 15).join("\n  "));
  await ctx.close();
}
await browser.close();
