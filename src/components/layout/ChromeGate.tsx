"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Keeps the public site's furniture off the office console.
 *
 * The console lives under the same root layout as everything else, so without
 * this it would inherit the nav, the footer, the WebGL scene and Lenis. A
 * moon drifting behind an approvals queue is the least of it — smooth scroll
 * fights a long table, and the site nav offers no way back to the console.
 */
export function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/office")) return null;
  return <>{children}</>;
}
