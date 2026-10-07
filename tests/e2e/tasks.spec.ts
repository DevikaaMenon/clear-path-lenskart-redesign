import { expect, test } from "@playwright/test";
import { filterScope, trackConsole, withFilters } from "./helpers";

test.describe("Usability tasks T1–T6", () => {
  test("T1: from the home page, find a frame for my need", async ({ page }) => {
    const errors = trackConsole(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: /What are your glasses for/ })).toBeVisible();
    await page.getByTestId("need-computer").click();
    await expect(page).toHaveURL(/\/shop\?need=computer/);
    await expect(page.getByRole("heading", { level: 1, name: "Computer glasses" })).toBeVisible();
    // The need is carried forward (X2): the first card links to the product with the need attached.
    const first = page.getByTestId("product-card").first();
    await first.getByRole("heading").getByRole("link").click();
    await expect(page).toHaveURL(/\/frames\/.+need=computer/);
    await expect(page.getByRole("radio", { name: /Screen use/ })).toBeChecked();
    expect(errors()).toEqual([]);
  });

  test("T2a: narrow down with grouped filters, chips and a live count; recover from no results", async ({ page }) => {
    const errors = trackConsole(page);
    await page.goto("/shop?need=computer");
    const heading = page.locator("#results-heading");
    const before = Number((await heading.innerText()).match(/\d+/)![0]);
    await withFilters(page, async () => {
      await filterScope(page).getByRole("checkbox", { name: /^Round/ }).check();
    });
    await expect(page).toHaveURL(/shape=round/);
    await expect(heading).not.toHaveText(`${before} frames`);
    await expect(page.getByRole("button", { name: "Remove filter Shape: Round" })).toBeVisible();

    // Empty state (S4): an impossible combination, then relax one filter
    await page.goto("/shop?audience=kids&material=titanium");
    await expect(page.getByRole("heading", { name: "No frames match all of these filters" })).toBeVisible();
    await page.getByRole("button", { name: /Remove “Titanium”/ }).click();
    await expect(page.getByTestId("product-card").first()).toBeVisible();
    await expect(page).not.toHaveURL(/material=titanium/);
    expect(errors()).toEqual([]);
  });

  test("T2b: Frame Finder keeps answers on Back and lands on a pre-filtered listing", async ({ page }) => {
    await page.goto("/finder");
    const group = page.getByRole("radiogroup");
    await group.getByText("Computer glasses").click();
    await page.getByRole("button", { name: "Next question" }).click();
    await page.getByRole("radiogroup").getByText("Oval", { exact: true }).click();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("radio", { name: /Computer glasses/ })).toBeChecked();
    await page.getByRole("button", { name: "Next question" }).click();
    await expect(page.getByRole("radio", { name: /^Oval/ })).toBeChecked();
    await page.getByRole("button", { name: "Next question" }).click();
    await page.getByRole("button", { name: "Skip this question" }).click();
    await expect(page.getByRole("heading", { name: /We found \d+ frames? for you/ })).toBeVisible();
    await page.getByTestId("finder-see-results").click();
    await expect(page).toHaveURL(/need=computer.*face=oval|face=oval.*need=computer/);
  });

  test("T3: compare frames and choose one", async ({ page }) => {
    await page.goto("/shop?need=prescription");
    await page.getByRole("button", { name: /^Add Arlo Round to compare/ }).click();
    await page.getByRole("button", { name: /^Add Kabir Rectangle to compare/ }).click();
    const tray = page.getByRole("complementary", { name: "Compare tray" });
    await expect(tray).toBeVisible();
    await tray.getByRole("link", { name: /Compare/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Compare frames" })).toBeVisible();
    await expect(page.getByRole("columnheader")).toHaveCount(2);
    await expect(page.getByRole("row", { name: /Weight/ })).toContainText("Lightest");
    await page.getByRole("button", { name: /Choose Kabir Rectangle/ }).click();
    await expect(page).toHaveURL(/\/frames\/kabir-rectangle/);
    await expect(page.getByRole("heading", { level: 1, name: "Kabir Rectangle" })).toBeVisible();
  });

  test("T4: pick lens purpose and size; the price updates live and matches the bag", async ({ page }) => {
    await page.goto("/frames/mira-cat-eye");
    const total = page.getByTestId("price-total");
    await page.getByRole("radio", { name: /^S\b/ }).check({ force: true });
    await page.getByRole("radio", { name: /Screen use/ }).check();
    await expect(total).toContainText("₹2,969"); // 2,299 + 900 − 230 (10% of frame)
    // Real-stock scarcity only (X12): size M has 2 left in the seed data
    await page.getByRole("radio", { name: /^M\b/ }).check({ force: true });
    await expect(page.getByTestId("low-stock")).toContainText("live warehouse count");
    // Adding a ₹400 coating lifts the order to ₹3,599, so the engine switches to the bigger
    // "₹600 off orders of ₹3,500+" offer and explains why (X5, X7).
    await page.getByRole("radio", { name: /Anti-glare coating/ }).check();
    await expect(page.getByText(/We applied “₹600 off orders of ₹3,500\+”/)).toBeVisible();
    await expect(total).toContainText("₹2,999");
    // Read the settled value (screen-reader text), not the digits that are still rolling.
    const shown = await total.locator(".sr-only").innerText();
    await page.getByTestId("add-to-bag").click();
    await expect(page.getByRole("status").filter({ hasText: "Added to your bag" })).toBeVisible();
    await page.getByRole("link", { name: /Go to bag/ }).click();
    expect(shown).toBe("₹2,999");
    await expect(page.getByTestId("cart-total").locator(".sr-only")).toHaveText(shown); // bag matches what the product page showed
  });

  test("T5: enter a prescription and recover from validation errors", async ({ page }) => {
    await page.goto("/frames/kabir-rectangle?need=prescription");
    await page.getByTestId("add-to-bag").click();
    await expect(page).toHaveURL(/\/prescription\//);
    await page.getByTestId("rx-mode-manual").check({ force: true });
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator("#rx-right-sph").fill("-1.30");
    await page.locator("#rx-left-sph").fill("-1.25");
    await page.getByTestId("rx-continue").click();
    const summary = page.locator("#error-summary");
    await expect(summary).toBeFocused();
    await expect(summary).toContainText("steps of 0.25");
    await expect(page.locator("#rx-right-sph")).toHaveAttribute("aria-invalid", "true");
    // Error summary links move focus to the field
    await summary.getByRole("link", { name: /Right eye \(OD\): Sphere/ }).click();
    await expect(page.locator("#rx-right-sph")).toBeFocused();
    await page.locator("#rx-right-sph").fill("-1.25");
    await page.locator("#rx-pd").fill("62");
    await page.getByTestId("rx-continue").click();
    await expect(page.getByRole("heading", { name: "Check and save" })).toBeVisible();
    await page.getByTestId("rx-save").click();
    await expect(page).toHaveURL(/\/cart/, { timeout: 15_000 });
    await expect(page.getByText("Entered and checked")).toBeVisible();
  });

  test("T6: guest checkout with a declined payment, recovery, and confirmation", async ({ page }) => {
    await page.goto("/frames/dev-wayfarer?need=sun");
    await page.getByTestId("add-to-bag").click();
    await page.getByRole("link", { name: /Go to bag/ }).click();
    // Remove with undo
    await page.getByRole("button", { name: /Remove Dev Wayfarer from bag/ }).click();
    await expect(page.getByRole("heading", { name: "Your bag is empty" })).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("cart-item")).toHaveCount(1);
    const cartTotal = (await page.getByTestId("cart-total").innerText()).replace(/\s/g, "");

    await page.getByTestId("go-checkout").click();
    await page.getByRole("button", { name: "Continue to delivery" }).click();
    await expect(page.locator("#summary-contact")).toBeFocused();
    await page.locator("#contact-email").fill("suresh@example.com");
    await page.locator("#contact-name").fill("Suresh Demo");
    await page.locator("#contact-phone").fill("98765 43210");
    await page.getByRole("button", { name: "Continue to delivery" }).click();
    await page.locator("#address-line1").fill("22 Example Road");
    await page.locator("#address-city").fill("Bengaluru");
    await page.locator("#address-state").selectOption("Karnataka");
    await page.locator("#address-pincode").fill("560011");
    await page.getByRole("button", { name: "Continue to payment" }).click();
    await page.getByRole("radio", { name: /Debit or credit card/ }).check();
    await page.locator("#payment-cardNumber").fill("4000 0000 0000 0002");
    await page.locator("#payment-expiry").fill("08/30");
    await page.locator("#payment-cvc").fill("123");
    await expect(page.getByTestId("place-order")).toContainText(cartTotal.match(/₹[\d,]+/)![0]);
    await page.getByTestId("place-order").click();
    const banner = page.getByTestId("checkout-error");
    await expect(banner).toContainText("Payment didn't go through");
    await expect(banner).toBeFocused();
    await banner.getByRole("button", { name: "Change method" }).click();
    await page.getByRole("radio", { name: /Cash on delivery/ }).check();
    await page.getByTestId("place-order").click();
    await expect(page).toHaveURL(/\/order\//, { timeout: 15_000 });
    await expect(page.getByTestId("order-number")).toHaveText(/^CP-\d{8}$/);
    await expect(page.getByRole("link", { name: "Track order" })).toBeVisible();
    // Bag is empty afterwards
    await expect(page.getByRole("link", { name: /Bag, 0 items/ })).toBeVisible();
  });
});
