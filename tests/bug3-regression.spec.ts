import { test, expect } from "@playwright/test";

test.describe("Bug 3 regression guard: dead click targets", () => {
  test("click registers despite the animated decorative layer overlapping it", async ({ page }) => {
    await page.goto("/");
    const button = page.locator("[data-hydration-proof-button]");
    await button.scrollIntoViewIfNeeded();

    // Wait for the real hydration signal (disabled attribute removed) —
    // not a fixed delay — then let the decorative blob's loop actually
    // move over the button before clicking.
    await expect(button).toBeEnabled({ timeout: 5000 });
    await page.waitForTimeout(700);
    await button.click();

    await expect(page.locator("[data-hydration-proof-count]")).toHaveText("1");
  });

  test("button stays disabled — never clickable-but-broken — until hydration confirms", async ({ page }) => {
    await page.goto("/");
    const button = page.locator("[data-hydration-proof-button]");
    await button.scrollIntoViewIfNeeded();

    // This is the actual fix for the hydration race: instead of hoping a
    // click lands after the listener attaches, the button is disabled
    // until an effect (which only runs post-hydration) flips it. Playwright's
    // click() auto-waits for the disabled attribute to clear, so this same
    // call that used to race hydration now waits on a real, verifiable signal.
    await button.click({ timeout: 5000 });

    await expect(page.locator("[data-hydration-proof-count]")).toHaveText("1");
  });

  test("z-index scale keeps the decorative layer non-interactive", async ({ page }) => {
    await page.goto("/");
    const blob = page.locator("#decorative-blob");
    await expect(blob).toHaveCSS("pointer-events", "none");
  });
});
