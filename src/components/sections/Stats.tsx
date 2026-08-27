"use client";

import { stats } from "@/lib/data/profile";
import { Counter, Reveal, SceneAnchor, T } from "@/components/ui/primitives";

export function Stats() {
  return (
    <SceneAnchor scene="stats" className="relative">
      <div className="container-x py-20 md:py-28">
        <div className="card grid gap-px overflow-hidden bg-line md:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal
              key={s.label.en}
              delay={i * 90}
              className="group bg-card px-7 py-9 transition-colors duration-500 hover:bg-paper-2/70"
            >
              <p className="font-display text-[clamp(2.6rem,5vw,4rem)] leading-none tracking-[-0.03em] text-ink">
                <Counter to={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-4 text-[0.9rem] font-medium leading-snug text-ink lang-aware">
                <T v={s.label} />
              </p>
              <p className="mt-1.5 font-mono text-[0.65rem] uppercase tracking-[0.13em] text-ink-3">
                <T v={s.detail} />
              </p>
              <span className="metal-rule mt-5 block h-px w-0 transition-all duration-700 group-hover:w-12" />
            </Reveal>
          ))}
        </div>
      </div>
    </SceneAnchor>
  );
}
