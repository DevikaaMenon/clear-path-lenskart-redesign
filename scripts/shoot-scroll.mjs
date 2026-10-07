// Dev helper: viewport screenshots at several scroll offsets (checks scroll-linked motion).
import { chromium } from "@playwright/test";
const [out, path, w = "1440", ...ys] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto("http://localhost:3000" + path, { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
for (const y of ys) {
  await p.mouse.wheel(0, 0);
  await p.evaluate((yy) => window.scrollTo(0, yy), +y);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/scroll-${w}-${y}.png` });
  console.log("shot", y);
}
await b.close();
