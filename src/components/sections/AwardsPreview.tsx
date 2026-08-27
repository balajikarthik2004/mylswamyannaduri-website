"use client";

import Link from "next/link";
import { awards, awardCategories, featuredAwards } from "@/lib/data/awards";
import { Counter, Reveal, SceneAnchor, SectionHeading, T } from "@/components/ui/primitives";

export function AwardsPreview() {
  return (
    <SceneAnchor scene="awards" id="awards" className="relative">
      <div className="container-x py-24 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            kicker={{ en: "Recognition", ta: "அங்கீகாரம்" }}
            title={{
              en: "One hundred and more",
              ta: "நூறுக்கும் மேற்பட்டவை",
            }}
            lead={{
              en: "The Padma Shri, four honorary doctorates, fellowships of five learned societies, and awards from Beijing to New Jersey.",
              ta: "பத்மஸ்ரீ, நான்கு கௌரவ முனைவர் பட்டங்கள், ஐந்து கல்விச் சங்கங்களின் உறுப்பினர், மற்றும் பெய்ஜிங் முதல் நியூ ஜெர்சி வரை விருதுகள்.",
            }}
          />
          <Reveal delay={200}>
            <div className="text-right">
              <p className="font-display text-[clamp(4rem,9vw,7rem)] leading-none tracking-[-0.04em] text-paper-3">
                <Counter to={awards.length} suffix="" />
              </p>
              {/* The published record lists 78; his citations put the lifetime
                  total past a hundred — label the number so they don't clash. */}
              <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">
                <T v={{ en: "listed on the record", ta: "பதிவில் உள்ளவை" }} />
              </p>
            </div>
          </Reveal>
        </div>

        {/* Category counts */}
        <Reveal delay={120}>
          <div className="mt-14 card grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-5">
            {awardCategories.map((c) => {
              const n = awards.filter((a) => a.category === c.id).length;
              return (
                <Link
                  key={c.id}
                  href={`/awards?c=${c.id}`}
                  className="group bg-card px-6 py-7 transition-colors duration-400 hover:bg-paper-2/70"
                >
                  <p className="font-display text-[2.1rem] leading-none tracking-[-0.03em] text-ink">
                    {n}
                  </p>
                  <p className="mt-3 text-[0.82rem] font-medium leading-snug text-ink-2 lang-aware">
                    <T v={c.label} />
                  </p>
                  <span className="mt-4 block h-px w-0 bg-accent transition-all duration-500 group-hover:w-10" />
                </Link>
              );
            })}
          </div>
        </Reveal>

        {/* Featured */}
        <ul className="mt-14 grid gap-x-10 gap-y-0 md:grid-cols-2">
          {featuredAwards.map((a, i) => (
            <Reveal
              as="li"
              key={`${a.title}-${i}`}
              delay={(i % 2) * 80}
              className="group flex items-baseline gap-5 border-b border-line py-5"
            >
              <span className="w-12 shrink-0 font-mono text-[0.72rem] tracking-[0.08em] text-brass">
                {a.year ?? "—"}
              </span>
              <span className="min-w-0">
                <span className="block text-[0.98rem] font-medium leading-snug text-ink">
                  {a.title}
                </span>
                {a.by ? (
                  <span className="mt-1 block text-[0.8rem] leading-snug text-ink-3">
                    {a.by}
                  </span>
                ) : null}
              </span>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={200}>
          <div className="mt-12 flex justify-center">
            <Link
              href="/awards"
              className="btn btn-primary px-6 py-3"
            >
              <T v={{ en: "See all awards", ta: "அனைத்து விருதுகளையும் காண்க" }} />
              <span className="btn-arrow">
                →
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </SceneAnchor>
  );
}
