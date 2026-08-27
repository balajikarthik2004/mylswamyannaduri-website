"use client";

import Image from "next/image";
import { profile } from "@/lib/data/profile";
import { Reveal, SceneAnchor, SectionHeading, T } from "@/components/ui/primitives";

export function About() {
  return (
    <SceneAnchor scene="about" id="about" className="relative">
      <div className="container-x py-20 md:py-28">
        <SectionHeading
          kicker={{ en: "Profile", ta: "சுயவிவரம்" }}
          title={{
            en: "From a village in Coimbatore to lunar orbit",
            ta: "கோயம்புத்தூர் கிராமத்திலிருந்து நிலவின் சுற்றுப்பாதைக்கு",
          }}
        />

        <div className="mt-16 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20">
          {/* Portrait */}
          <Reveal className="relative">
            <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-line bg-paper-2 shadow-raise">
              <Image
                src="/img/gallery/capture1.png"
                alt="Dr. Mylswamy Annadurai"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-top"
                priority
              />
            </div>
            {/* Caption plate */}
            <div className="mt-5 flex items-start justify-between gap-6 border-t border-line pt-4">
              <p className="kicker">
                <T v={{ en: "Padma Shri, 2016", ta: "பத்மஸ்ரீ, 2016" }} />
              </p>
              <p className="max-w-[16rem] text-right text-[0.7rem] leading-relaxed text-ink-3 lang-aware">
                <T
                  v={{
                    en: "Director, ISRO Satellite Centre, 2015–18",
                    ta: "இயக்குனர், இஸ்ரோ செயற்கைக்கோள் மையம், 2015–18",
                  }}
                />
              </p>
            </div>
          </Reveal>

          {/* Copy */}
          <div>
            {profile.bio.map((para, i) => (
              <Reveal key={i} delay={i * 110}>
                <p
                  className={[
                    "leading-relaxed text-ink-2 lang-aware",
                    i === 0
                      ? "text-[1.15rem] text-ink"
                      : "mt-6 text-[1.0rem]",
                  ].join(" ")}
                >
                  <T v={para} />
                </p>
              </Reveal>
            ))}

            {/* Pull quote */}
            <Reveal delay={340}>
              <blockquote className="mt-12 border-l-2 border-brass-2 pl-6">
                <p className="font-display text-[clamp(1.35rem,2.4vw,1.85rem)] leading-[1.35] tracking-[-0.015em] text-ink lang-aware">
                  <T v={profile.quote} />
                </p>
              </blockquote>
            </Reveal>

            {/* Education strip */}
            <Reveal delay={430}>
              <dl className="mt-12 card grid gap-px overflow-hidden bg-line sm:grid-cols-3">
                {[
                  {
                    k: { en: "B.E. 1980", ta: "இளநிலை 1980" },
                    v: { en: "Government College of Technology, Coimbatore" },
                  },
                  {
                    k: { en: "M.E. 1982", ta: "முதுநிலை 1982" },
                    v: { en: "PSG College of Technology, Coimbatore" },
                  },
                  {
                    k: { en: "PhD", ta: "முனைவர்" },
                    v: { en: "Anna University" },
                  },
                ].map((d) => (
                  <div key={d.k.en} className="bg-card px-5 py-5">
                    <dt className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-brass">
                      <T v={d.k} />
                    </dt>
                    <dd className="mt-2 text-[0.82rem] leading-snug text-ink-2">
                      <T v={d.v} />
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </SceneAnchor>
  );
}
