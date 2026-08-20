import { test, expect } from "@playwright/test";

test.describe("Bug 3 regression guard: dead click targets", () => {
  test("click registers despite the animated decorative layer overlapping it", async ({ page }) => {
    await page.goto("/");
    const button = page.locator("[data-hydration-proof-button]");
    await button.scrollIntoViewIfNeeded();

    // Let the decorative blob's loop actually move over the button before
    // clicking — this is the exact moment a missing pointer-events: none
    // or wrong z-index would swallow the click.
    await page.waitForTimeout(700);
    await button.click();

    await expect(page.locator("[data-hydration-proof-count]")).toHaveText("1");
  });

  test("click registers immediately after scroll-into-view (hydration race)", async ({ page }) => {
    await page.goto("/");
    const button = page.locator("[data-hydration-proof-button]");

    // No wait after scrolling — this is the race a client:visible island
    // can lose if hydration hasn't attached its listener yet.
    await button.scrollIntoViewIfNeeded();
    await button.click({ timeout: 3000 });

    await expect(page.locator("[data-hydration-proof-count]")).toHaveText("1");
  });

  test("z-index scale keeps the decorative layer non-interactive", async ({ page }) => {
    await page.goto("/");
    const blob = page.locator("#decorative-blob");
    await expect(blob).toHaveCSS("pointer-events", "none");
  });
});
