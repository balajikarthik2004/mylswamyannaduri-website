"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { setScene, type SceneKey } from "@/components/three/scene-store";
import { useLang, type L } from "@/lib/i18n";

/* ── Localized text ────────────────────────────────────────── */

export function T({ v, className }: { v: L | string; className?: string }) {
  const { t, lang } = useLang();
  const isTa = lang === "ta" && typeof v !== "string" && !!v.ta;
  return (
    <span className={[isTa ? "font-tamil" : "", className].filter(Boolean).join(" ")}>
      {t(v)}
    </span>
  );
}

/* ── Reveal on scroll ──────────────────────────────────────── */

export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.shown = "true";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.shown = "true";
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Runtime stays polymorphic; TS treats it as a div so ref/className/data-*
  // all type-check instead of collapsing to `never`.
  const Comp = Tag as unknown as "div";

  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      data-reveal=""
      className={className}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/* ── Scene anchor: drives the 3D choreography ──────────────── */

const ratios = new Map<Element, number>();

function resolveScene() {
  let best: Element | null = null;
  let bestRatio = 0;
  for (const [el, r] of ratios) {
    if (r > bestRatio) {
      bestRatio = r;
      best = el;
    }
  }
  if (best) {
    const key = (best as HTMLElement).dataset.scene as SceneKey | undefined;
    if (key) setScene(key);
  }
}

export function SceneAnchor({
  scene,
  children,
  className,
  id,
  as: Tag = "section",
}: {
  scene: SceneKey;
  children: ReactNode;
  className?: string;
  id?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios.set(e.target, e.intersectionRatio);
        resolveScene();
      },
      { threshold: [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1] },
    );
    io.observe(el);
    return () => {
      ratios.delete(el);
      io.disconnect();
    };
  }, []);

  const Comp = Tag as unknown as "section";

  return (
    <Comp
      ref={ref as React.Ref<HTMLElement>}
      id={id}
      data-scene={scene}
      className={className}
    >
      {children}
    </Comp>
  );
}

/* ── Count-up number ───────────────────────────────────────── */

export function Counter({
  to,
  suffix = "",
  duration = 1900,
  className,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || done.current) return;
        done.current = true;
        // Reduced motion still gets the number, just without the count-up.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setN(to);
          return;
        }
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          // easeOutExpo
          const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          setN(Math.round(eased * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {n.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/* ── Section heading ───────────────────────────────────────── */

export function SectionHeading({
  kicker,
  title,
  lead,
  align = "left",
}: {
  kicker: L | string;
  title: L | string;
  lead?: L | string;
  align?: "left" | "center";
}) {
  const id = useId();
  return (
    <header
      className={[
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "",
      ].join(" ")}
    >
      <Reveal>
        <p className="kicker flex items-center gap-3">
          {align === "center" ? null : (
            <span className="inline-block h-px w-8 bg-line-2" aria-hidden="true" />
          )}
          <T v={kicker} />
        </p>
      </Reveal>
      <Reveal delay={90}>
        <h2
          id={id}
          className="mt-5 font-display text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.06] tracking-[-0.02em] text-ink"
        >
          <T v={title} />
        </h2>
      </Reveal>
      {lead ? (
        <Reveal delay={170}>
          <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-2 lang-aware">
            <T v={lead} />
          </p>
        </Reveal>
      ) : null}
    </header>
  );
}
