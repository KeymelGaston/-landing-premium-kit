import { test, expect } from "@playwright/test";

test.describe("scroll-triggered animations (Bug 1 regression guard)", () => {
  test("below-the-fold section reveals on scroll", async ({ page }) => {
    await page.goto("/");

    const section = page.locator("#bugs");

    // Before scrolling, GSAP's `from()` should have set opacity to 0.
    await expect(section).toHaveCSS("opacity", "0");

    await section.scrollIntoViewIfNeeded();

    // If Lenis and ScrollTrigger are out of sync, this stays at 0 forever —
    // this assertion is the thing that would fail if the Bug 1 fix broke.
    await expect(section).toHaveCSS("opacity", "1", { timeout: 5000 });
  });

  test("reduced motion shows content without animating", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const section = page.locator("#bugs");
    // Should be visible immediately, no 0-opacity flash to wait out.
    await expect(section).toHaveCSS("opacity", "1");
  });
});
