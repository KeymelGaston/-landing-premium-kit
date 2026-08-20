/**
 * Shared Bug 2 fix: wait for an image's real load/decode event before
 * animating it, instead of firing on DOMContentLoaded/mount and risking a
 * fade-in over a still-blank image.
 */

export async function waitForImageLoad(img: HTMLImageElement | null): Promise<void> {
  if (!img) return;

  if (img.complete) {
    // `complete` can be true for a cached-but-not-yet-decoded image on some
    // browsers, so still call decode() when available.
    await img.decode?.().catch(() => undefined);
    return;
  }

  await new Promise<void>((resolve) => {
    img.addEventListener("load", () => resolve(), { once: true });
    img.addEventListener("error", () => resolve(), { once: true });
  });
}
