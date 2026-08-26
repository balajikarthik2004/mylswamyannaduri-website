"use client";

import Link from "next/link";
import { missions, type Mission } from "@/lib/data/missions";
import { missionStats } from "@/lib/data/profile";
import { Reveal, SceneAnchor, SectionHeading, T } from "@/components/ui/primitives";

function MissionPanel({ m, index }: { m: Mission; index: number }) {
  return (
    <SceneAnchor scene={m.body} id={m.id} className="relative">
      <div className="container-x flex min-h-[92svh] items-center py-24">
        <div className="max-w-[38rem]">
          <Reveal>
            <p className="kicker flex items-center gap-3">
              <span className="font-mono text-ember">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="inline-block h-px w-7 bg-line-2" aria-hidden="true" />
              <T v={m.role} /> · {m.years}
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h3 className="mt-5 font-display text-[clamp(2.4rem,6vw,4.75rem)] leading-[0.95] tracking-[-0.03em] text-ink">
              <T v={m.name} />
            </h3>
          </Reveal>

          <Reveal delay={150}>
            <p className="mt-3 font-display text-[clamp(1.1rem,2vw,1.5rem)] italic leading-snug text-accent lang-aware">
              <T v={m.sub} />
            </p>
          </Reveal>

          <Reveal delay={220}>
            <p className="mt-7 text-[1rem] leading-relaxed text-ink-2 lang-aware">
              <T v={m.blurb} />
            </p>
          </Reveal>

          <Reveal delay={300}>
            <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-line pt-7">
              {m.facts.map((f) => (
                <div key={f.k.en}>
                  <dt className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-3">
                    <T v={f.k} />
                  </dt>
                  <dd className="mt-1.5 text-[0.95rem] font-medium leading-snug text-ink lang-aware">
                    <T v={f.v} />
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </SceneAnchor>
  );
}

export function Missions() {
  return (
    <section className="relative">
      <div className="container-x pt-24 md:pt-32">
        <SectionHeading
          kicker={{ en: "Missions", ta: "பயணங்கள்" }}
          title={{
            en: "The satellites, the Moon, and Mars on the first try",
            ta: "செயற்கைக்கோள்கள், நிலவு, மற்றும் முதல் முயற்சியில் செவ்வாய்",
          }}
          lead={{
            en: "Four decades of Indian spaceflight, told through the programmes he directed.",
            ta: "அவர் இயக்கிய திட்டங்கள் வழியாக இந்திய விண்வெளிப் பயணத்தின் நான்கு தசாப்தங்கள்.",
          }}
        />
      </div>

      {missions.map((m, i) => (
        <MissionPanel key={m.id} m={m} index={i} />
      ))}

      {/* Mission-scale numbers */}
      <div className="container-x pb-24">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {missionStats.map((s, i) => (
            <Reveal
              key={s.label.en}
              delay={i * 100}
              className="bg-paper/85 px-7 py-9 backdrop-blur-sm"
            >
              <p className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-none tracking-[-0.03em] text-accent">
                <T v={s.value} />
              </p>
              <p className="mt-4 text-[0.9rem] leading-relaxed text-ink-2 lang-aware">
                <T v={s.label} />
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={220}>
          <div className="mt-10 flex justify-center">
            <Link
              href="/missions"
              className="group inline-flex items-center gap-2.5 rounded-full border border-line-2 px-6 py-3 text-sm font-medium text-ink transition-all duration-300 hover:border-ink hover:bg-paper-2"
            >
              <T v={{ en: "All missions in detail", ta: "அனைத்துப் பயணங்களும் விரிவாக" }} />
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
