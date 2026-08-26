"use client";

import { useEffect, useRef, useState } from "react";
import { timeline, eraLabels, type Era } from "@/lib/data/timeline";
import { Reveal, SceneAnchor, SectionHeading, T } from "@/components/ui/primitives";

const eraOrder: Era[] = ["education", "isro", "leadership", "beyond"];

export function Chronicle() {
  const railRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeEra, setActiveEra] = useState<Era>("education");

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the top of the list reaches mid-screen, 1 when the bottom does.
      const p = (vh * 0.5 - r.top) / Math.max(r.height, 1);
      setProgress(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <SceneAnchor scene="timeline" id="chronicle" className="relative">
      <div className="container-x py-24 md:py-32">
        <SectionHeading
          kicker={{ en: "Chronicle", ta: "காலவரிசை" }}
          title={{
            en: "Fifty years, one line at a time",
            ta: "ஐம்பது ஆண்டுகள், ஒரு வரியாக",
          }}
          lead={{
            en: "From a village schoolroom in 1976 to boardrooms and governing councils in 2026 — the full record.",
            ta: "1976 இல் ஒரு கிராமப் பள்ளி வகுப்பறையிலிருந்து 2026 இல் நிர்வாகக் குழுக்கள் வரை — முழுப் பதிவு.",
          }}
        />

        <div className="mt-16 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
          {/* Sticky era legend */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <ul className="space-y-3">
                {eraOrder.map((e) => (
                  <li key={e}>
                    <span
                      className={[
                        "block border-l-2 py-1.5 pl-4 text-[0.8rem] leading-snug transition-all duration-500 lang-aware",
                        activeEra === e
                          ? "border-ember font-medium text-ink"
                          : "border-line text-ink-3",
                      ].join(" ")}
                    >
                      <T v={eraLabels[e]} />
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-3">
                {Math.round(progress * 100)}% ·{" "}
                {timeline.length} <T v={{ en: "entries", ta: "பதிவுகள்" }} />
              </p>
            </div>
          </aside>

          {/* The rail */}
          <div ref={railRef} className="relative pl-8 sm:pl-10">
            {/* Track */}
            <div
              className="absolute left-[3px] top-2 bottom-2 w-px bg-line"
              aria-hidden="true"
            />
            {/* Progress fill */}
            <div
              className="absolute left-[3px] top-2 w-px origin-top bg-accent"
              style={{
                height: `calc((100% - 1rem) * ${progress})`,
                transition: "height 120ms linear",
              }}
              aria-hidden="true"
            />

            <ol className="space-y-0">
              {timeline.map((entry, i) => (
                <TimelineRow
                  key={`${entry.period}-${i}`}
                  entry={entry}
                  onActive={setActiveEra}
                />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </SceneAnchor>
  );
}

function TimelineRow({
  entry,
  onActive,
}: {
  entry: (typeof timeline)[number];
  onActive: (e: Era) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onActive(entry.era);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [entry.era, onActive]);

  return (
    <li ref={ref} className="group relative">
      <Reveal className="flex flex-col gap-1.5 border-b border-line py-5 sm:flex-row sm:items-baseline sm:gap-8">
        {/* Node */}
        <span
          className={[
            "absolute -left-8 top-[1.65rem] block rounded-full ring-4 ring-paper transition-all duration-500 sm:-left-10",
            entry.major
              ? "h-2.5 w-2.5 bg-ember group-hover:scale-125"
              : "h-1.5 w-1.5 translate-x-[2px] bg-line-2 group-hover:bg-accent",
          ].join(" ")}
          aria-hidden="true"
        />
        <time className="w-[7.5rem] shrink-0 font-mono text-[0.72rem] uppercase tracking-[0.1em] text-ink-3 transition-colors group-hover:text-ember">
          {entry.period}
        </time>
        <p
          className={[
            "leading-snug text-ink-2 transition-colors group-hover:text-ink lang-aware",
            entry.major
              ? "font-display text-[1.35rem] tracking-[-0.015em] text-ink"
              : "text-[0.95rem]",
          ].join(" ")}
        >
          <T v={entry.title} />
        </p>
      </Reveal>
    </li>
  );
}
