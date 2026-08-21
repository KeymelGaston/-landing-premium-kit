import { test, expect } from "@playwright/test";

test.describe("scroll-triggered animations (Bug 1 regression guard)", () => {
  test("bug list reveals via clip-path on scroll, item by item", async ({ page }) => {
    await page.goto("/");

    // Scoped selector: DifferentiatorTable reuses the same ".diff-item"
    // class for its own rows, so an unscoped locator would be ambiguous.
    const firstItem = page.locator("#bug-diff-list .diff-item").first();

    // Before scrolling, diffReveal's gsap.set() clips each item to zero width.
    await expect(firstItem).toHaveCSS("clip-path", "inset(0px 100% 0px 0px)");

    await firstItem.scrollIntoViewIfNeeded();

    // If Lenis and ScrollTrigger are out of sync, this stays clipped forever —
    // this assertion is the thing that would fail if the Bug 1 fix broke.
    await expect(firstItem).toHaveCSS("clip-path", "inset(0px 0% 0px 0px)", {
      timeout: 5000,
    });
  });

  test("reduced motion shows the bug list without animating", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const firstItem = page.locator("#bug-diff-list .diff-item").first();
    // Should be fully visible immediately, no clipped flash to wait out.
    await expect(firstItem).toHaveCSS("clip-path", "inset(0px)");
  });
});
