import { useState } from "react";

/**
 * Proof, not promise, for Bug 3's hydration half: this button is a React
 * island hydrated with `client:visible` — the directive most likely to
 * lose a click if the user taps it in the window between it scrolling
 * into view and React finishing hydration. The visible counter makes a
 * dropped click immediately obvious to anyone testing it by hand, and
 * tests/bug3-regression.spec.ts automates the same race condition.
 */
export default function HydrationProofCounter() {
  const [count, setCount] = useState(0);

  return (
    <button
      type="button"
      data-hydration-proof-button
      onClick={() => setCount((c) => c + 1)}
      className="relative z-content inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 font-medium text-accent-text transition-opacity hover:opacity-90"
    >
      <span>Click me</span>
      <span
        className="inline-flex min-w-6 items-center justify-center rounded-full bg-black/15 px-1.5 py-0.5 font-mono text-xs leading-none tabular-nums"
        data-hydration-proof-count
      >
        {count}
      </span>
    </button>
  );
}
