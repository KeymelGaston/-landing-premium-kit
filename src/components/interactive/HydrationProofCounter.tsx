import { useEffect, useState } from "react";

/**
 * Proof, not promise, for Bug 3's hydration half — and now proof of the
 * mitigation too, found by tests/bug3-regression.spec.ts actually failing
 * under real parallel test load. A `client:visible` island's HTML renders
 * before its listeners attach; a click that lands in that window is a
 * genuine no-op, not a display issue. The fix isn't "wait longer and hope"
 * — it's to never present the button as clickable until hydration has
 * actually confirmed itself, via a state flip that can only happen once
 * this component's own effect has run on the client.
 */
export default function HydrationProofCounter() {
  const [count, setCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Runs only after hydration completes and this component is mounted on
  // the client — the correct, verifiable signal, unlike a fixed delay.
  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <button
      type="button"
      data-hydration-proof-button
      disabled={!hydrated}
      onClick={() => setCount((c) => c + 1)}
      className="relative z-content inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 font-medium text-accent-text transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>{hydrated ? "Click me" : "Loading…"}</span>
      <span
        className="inline-flex min-w-6 items-center justify-center rounded-full bg-black/15 px-1.5 py-0.5 font-mono text-xs leading-none tabular-nums"
        data-hydration-proof-count
      >
        {count}
      </span>
    </button>
  );
}
