import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const isNarrow = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1280;

/** On tablet and mobile, filters live in a bottom sheet. */
export async function withFilters(page: Page, fn: () => Promise<void>) {
  if (isNarrow(page)) {
    await page.getByRole("button", { name: /^Filters/ }).click();
    await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
    await fn();
    await page.getByRole("dialog").getByRole("button", { name: /^Show \d+ frame/ }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  } else {
    await fn();
  }
}

/** Scope for filter controls: the sheet on narrow screens, the sidebar on desktop. */
export const filterScope = (page: Page) => (isNarrow(page) ? page.getByRole("dialog", { name: "Filters" }) : page.getByRole("complementary", { name: "Filters" }));

export async function expectNoAxeViolations(page: Page, label: string) {
  await page.waitForTimeout(600); // let fade-ins finish: axe must measure final colours, not mid-animation
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .exclude("nextjs-portal") // Next.js dev overlay (not present in production)
    .analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) · ${v.nodes[0]?.target.join(" ")}`);
  expect(summary, `axe violations on ${label}`).toEqual([]);
}

/** Collect console errors for the page; call the returned function to read them. */
export function trackConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    // Intentional HTTP error statuses (simulated payment decline, validation) are logged by the browser; not app errors.
    if (/Failed to load resource: the server responded with a status of (402|409|422)/.test(t)) return;
    errors.push(t);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  return () => errors;
}
