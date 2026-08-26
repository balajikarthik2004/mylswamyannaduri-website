"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `false` on the server and through the hydration pass, `true` afterwards.
 *
 * Use it to gate anything whose output depends on the visitor's clock. The
 * server renders in UTC while the visitor is in IST, so a bare `new Date()`
 * can put the two on different calendar days — and any attribute derived from
 * it (`disabled`, `aria-current`, a formatted `aria-label`) then mismatches on
 * hydration. Reading it through useSyncExternalStore keeps the lint rule
 * against setState-in-effect happy.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
