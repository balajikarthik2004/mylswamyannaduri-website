"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribe to a media query the way React wants external state read: via
 * useSyncExternalStore, so there's no setState-in-effect and no flash of the
 * wrong branch after hydration. Server snapshot is always `false`.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Scroll position crossing a threshold, as external state. */
export function useScrolledPast(threshold: number): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("scroll", onChange, { passive: true });
    return () => window.removeEventListener("scroll", onChange);
  }, []);

  const getSnapshot = useCallback(
    () => window.scrollY > threshold,
    [threshold],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
