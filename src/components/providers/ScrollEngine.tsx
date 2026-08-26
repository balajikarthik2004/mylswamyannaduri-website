"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Owns Lenis smooth scrolling and routes in-page anchor links through it.
 * Reveals and 3D scene anchors register themselves (see ui/primitives),
 * so they keep working across client-side route changes.
 */
export function ScrollEngine() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: Lenis | undefined;
    let tick: ((time: number) => void) | undefined;

    if (!reduced) {
      lenis = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.6,
        wheelMultiplier: 0.95,
      });
      window.__lenis = lenis;

      // Canonical Lenis ⇄ GSAP integration: one ticker drives both, so pinned
      // ScrollTriggers stay locked to the smoothed scroll position.
      lenis.on("scroll", ScrollTrigger.update);
      tick = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const onClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      ev.preventDefault();
      if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -72 });
      else el.scrollIntoView({ behavior: "smooth" });
    };
    document.addEventListener("click", onClick);

    return () => {
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      delete window.__lenis;
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
