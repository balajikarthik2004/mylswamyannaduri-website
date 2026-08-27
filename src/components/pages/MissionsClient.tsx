"use client";

import Image from "next/image";
import { missions } from "@/lib/data/missions";
import { missionStats } from "@/lib/data/profile";
import { Reveal, SceneAnchor, T } from "@/components/ui/primitives";

export function MissionsClient() {
  return (
    <>
      <SceneAnchor scene="moon" className="relative">
        <div className="container-x pt-36 pb-16">
          <Reveal>
            <p className="kicker flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-brass-2" aria-hidden="true" />
              <T v={{ en: "Missions", ta: "பயணங்கள்" }} />
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.98] tracking-[-0.035em] text-ink">
              <T
                v={{
                  en: "Sixty satellites, two Moons and a Mars",
                  ta: "அறுபது செயற்கைக்கோள்கள், இரு நிலவுகள், ஒரு செவ்வாய்",
                }}
              />
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-ink-2 lang-aware">
              <T
                v={{
                  en: "Thirty-six years inside the Indian Space Research Organisation, told programme by programme.",
                  ta: "இந்திய விண்வெளி ஆராய்ச்சி நிறுவனத்தில் முப்பத்தாறு ஆண்டுகள், திட்டம் திட்டமாக.",
                }}
              />
            </p>
          </Reveal>
        </div>
      </SceneAnchor>

      {missions.map((m, i) => (
        <SceneAnchor key={m.id} scene={m.body} id={m.id} className="relative">
          <div className="container-x border-t border-line py-20 md:py-28">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
              <div>
                <Reveal>
                  <p className="kicker flex items-center gap-3">
                    <span className="font-mono text-brass">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="inline-block h-px w-7 bg-line-2" aria-hidden="true" />
                    <T v={m.role} /> · {m.years}
                  </p>
                </Reveal>
                <Reveal delay={80}>
                  <h2 className="mt-5 font-display text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.98] tracking-[-0.03em] text-ink">
                    <T v={m.name} />
                  </h2>
                </Reveal>
                <Reveal delay={130}>
                  <p className="mt-3 font-display text-[1.25rem] italic leading-snug text-accent lang-aware">
                    <T v={m.sub} />
                  </p>
                </Reveal>
                <Reveal delay={190}>
                  <p className="mt-7 max-w-xl leading-relaxed text-ink-2 lang-aware">
                    <T v={m.blurb} />
                  </p>
                </Reveal>
                <Reveal delay={250}>
                  <dl className="mt-9 grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 border-t border-line pt-7">
                    {m.facts.map((f) => (
                      <div key={f.k.en}>
                        <dt className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-3">
                          <T v={f.k} />
                        </dt>
                        <dd className="mt-1.5 font-medium leading-snug text-ink lang-aware">
                          <T v={f.v} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              </div>

              {m.image ? (
                <Reveal delay={140}>
                  <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-line bg-paper-2 shadow-raise">
                    <Image
                      src={m.image}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 46vw"
                      className="object-cover"
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                  </div>
                </Reveal>
              ) : null}
            </div>
          </div>
        </SceneAnchor>
      ))}

      <div className="container-x border-t border-line py-20">
        <div className="card grid gap-px overflow-hidden bg-line md:grid-cols-3">
          {missionStats.map((s, i) => (
            <Reveal
              key={s.label.en}
              delay={i * 100}
              className="bg-card px-7 py-9"
            >
              <p className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-none tracking-[-0.03em] text-accent">
                <T v={s.value} />
              </p>
              <p className="mt-4 leading-relaxed text-ink-2 lang-aware">
                <T v={s.label} />
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}
