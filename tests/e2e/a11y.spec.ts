import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, trackConsole } from "./helpers";

const PAGES = [
  ["/", "Home"],
  ["/shop?need=computer", "Listing"],
  ["/shop?audience=kids&material=titanium", "Listing empty state"],
  ["/finder", "Frame Finder"],
  ["/frames/mira-cat-eye", "Product"],
  ["/compare", "Compare (empty)"],
  ["/cart", "Cart (empty)"],
  ["/stores", "Stores"],
  ["/help", "Help"],
  ["/account", "Account"],
  ["/design-system", "Design system"],
] as const;

test.describe("Accessibility (X10)", () => {
  for (const [path, label] of PAGES) {
    test(`axe: ${label} has no WCAG 2.2 A/AA violations and no console errors`, async ({ page }) => {
      const errors = trackConsole(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expectNoAxeViolations(page, label);
      expect(errors()).toEqual([]);
    });
  }

  test("axe: filled flows (product with options, bag, checkout, prescription errors)", async ({ page }) => {
    await page.goto("/frames/kabir-rectangle?need=prescription");
    await page.getByTestId("add-to-bag").click();
    await page.waitForURL(/prescription/);
    await page.getByTestId("rx-mode-manual").check({ force: true });
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByTestId("rx-continue").click();
    await expectNoAxeViolations(page, "Prescription with errors");
    await page.goto("/cart");
    await expectNoAxeViolations(page, "Cart with item");
    await page.goto("/checkout");
    await page.getByRole("button", { name: "Continue to delivery" }).click();
    await expectNoAxeViolations(page, "Checkout with errors");
  });

  test("keyboard: skip link, visible focus, and the need tiles are reachable", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium");
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    const outline = await skip.evaluate((el) => getComputedStyle(el).outlineWidth);
    expect(parseFloat(outline)).toBeGreaterThanOrEqual(2);
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
    // Tab forward until a need tile has focus
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      if (await page.getByTestId("need-prescription").evaluate((el) => el === document.activeElement)) break;
    }
    await expect(page.getByTestId("need-prescription")).toBeFocused();
  });

  test("Larger text mode is persisted and scales the base size to 18px", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Use larger text" });
    if (await toggle.isVisible()) {
      await toggle.click();
    } else {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("dialog").getByRole("button", { name: /Larger text/ }).click();
    }
    await page.reload();
    const size = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    expect(size).toBe("18px");
  });

  test("Reduced motion: hero lens is hidden and nothing is blurred", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.locator(".chart-lens")).toBeHidden();
    const filter = await page.locator(".chart-soft").evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toBe("none");
    await ctx.close();
  });

  // Browser zoom at 200% halves the CSS viewport and the layout reflows; that is how
  // WCAG 1.4.4 is exercised here. 1.4.10 reflow is checked at 320 CSS px.
  const REFLOW_PAGES = ["/", "/shop?need=computer", "/frames/mira-cat-eye", "/finder", "/checkout", "/stores"];
  const overflowOf = (page: import("@playwright/test").Page) =>
    page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  test("200% browser zoom and 320px reflow: no horizontal scrolling", async ({ browser }, info) => {
    const width = info.project.use.viewport?.width ?? 1440;
    for (const w of [Math.round(width / 2), 320]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
      const page = await ctx.newPage();
      for (const path of REFLOW_PAGES) {
        await page.goto(path);
        expect(await overflowOf(page), `${path} at ${w}px`).toBeLessThanOrEqual(1);
      }
      await ctx.close();
    }
  });

  test("Larger text mode: no horizontal scrolling at this viewport", async ({ browser }, info) => {
    const ctx = await browser.newContext({ viewport: info.project.use.viewport ?? { width: 1440, height: 900 } });
    await ctx.addInitScript(() => localStorage.setItem("cp_text", JSON.stringify("large")));
    const page = await ctx.newPage();
    for (const path of REFLOW_PAGES) {
      await page.goto(path);
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe("18px");
      expect(await overflowOf(page), `${path} with larger text`).toBeLessThanOrEqual(1);
    }
    await ctx.close();
  });

  // Common laptop widths, including 1280 px where the desktop navigation first appears
  // (the header once overflowed there by 12 px after the brand font change).
  test("Laptop widths: no horizontal scrolling", async ({ browser }) => {
    for (const w of [1280, 1366, 1536, 1920]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
      const page = await ctx.newPage();
      for (const path of REFLOW_PAGES) {
        await page.goto(path);
        expect(await overflowOf(page), `${path} at ${w}px`).toBeLessThanOrEqual(1);
      }
      await ctx.close();
    }
  });
});
