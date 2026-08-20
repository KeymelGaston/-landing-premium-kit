import { test, expect } from "@playwright/test";

test.describe("responsive layout", () => {
  test("hero renders and CTA is clickable", async ({ page }) => {
    await page.goto("/");

    const heading = page.locator("#hero-heading");
    await expect(heading).toBeVisible();

    const cta = page.getByRole("link", { name: /see it in motion/i });
    await expect(cta).toBeVisible();

    // Bug 3 regression guard: the click must actually register, not be
    // silently swallowed by a z-index/hydration conflict.
    await cta.click();
    await expect(page).toHaveURL(/#demo$/);
  });

  test("no horizontal overflow on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });
});
