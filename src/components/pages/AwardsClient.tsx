"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { awards, awardCategories, type AwardCategory } from "@/lib/data/awards";
import { Reveal, SceneAnchor, T } from "@/components/ui/primitives";

type Filter = AwardCategory | "all";

export function AwardsClient() {
  const params = useSearchParams();
  const initial = (params.get("c") as Filter | null) ?? "all";
  const [filter, setFilter] = useState<Filter>(
    awardCategories.some((c) => c.id === initial) ? initial : "all",
  );
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return awards.filter((a) => {
      if (filter !== "all" && a.category !== filter) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        (a.by ?? "").toLowerCase().includes(q) ||
        (a.year ?? "").includes(q)
      );
    });
  }, [filter, query]);

  const tabs: { id: Filter; label: string | { en: string; ta?: string }; n: number }[] = [
    { id: "all", label: { en: "All", ta: "அனைத்தும்" }, n: awards.length },
    ...awardCategories.map((c) => ({
      id: c.id as Filter,
      label: c.label,
      n: awards.filter((a) => a.category === c.id).length,
    })),
  ];

  return (
    <SceneAnchor scene="awards" className="relative">
      <div className="container-x pt-36 pb-24">
        <Reveal>
          <p className="kicker flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-ember" aria-hidden="true" />
            <T v={{ en: "Recognition", ta: "அங்கீகாரம்" }} />
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.98] tracking-[-0.035em] text-ink">
            <T
              v={{
                en: "Awards & honours",
                ta: "விருதுகள் மற்றும் கௌரவங்கள்",
              }}
            />
          </h1>
        </Reveal>
        <Reveal delay={150}>
          <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-ink-2 lang-aware">
            <T
              v={{
                en: "The complete record as published on his official site — from the Padma Shri to a township commendation in New Jersey.",
                ta: "அவரது அதிகாரப்பூர்வ இணையதளத்தில் வெளியிடப்பட்ட முழுப் பதிவு — பத்மஸ்ரீ முதல் நியூ ஜெர்சியில் ஒரு நகராட்சிப் பாராட்டு வரை.",
              }}
            />
          </p>
        </Reveal>

        {/* Controls */}
        <div className="mt-14 flex flex-col gap-5 border-y border-line py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                aria-pressed={filter === t.id}
                className={[
                  "rounded-full border px-4 py-2 text-[0.78rem] font-medium transition-all duration-300",
                  filter === t.id
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink-2 hover:border-line-2 hover:text-ink",
                ].join(" ")}
              >
                <T v={t.label} />
                <span
                  className={[
                    "ml-2 font-mono text-[0.65rem]",
                    filter === t.id ? "text-paper/60" : "text-ink-3",
                  ].join(" ")}
                >
                  {t.n}
                </span>
              </button>
            ))}
          </div>

          <label className="relative lg:w-72">
            <span className="sr-only">Search awards</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-full border border-line bg-paper-2/60 px-5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none"
            />
          </label>
        </div>

        {/* List */}
        <p className="mt-6 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ink-3">
          {shown.length} {shown.length === 1 ? "entry" : "entries"}
        </p>

        <ol className="mt-4">
          {shown.map((a, i) => (
            <li
              key={`${a.title}-${a.by ?? ""}-${i}`}
              className="group grid grid-cols-[3.5rem_1fr] items-baseline gap-x-5 border-b border-line py-5 transition-colors hover:bg-paper-2/50 sm:grid-cols-[5rem_1fr_10rem] sm:gap-x-8"
            >
              <span className="font-mono text-[0.72rem] tracking-[0.08em] text-ember">
                {a.year ?? "—"}
              </span>
              <span className="min-w-0">
                <span className="block text-[0.98rem] leading-snug text-ink">
                  {a.title}
                </span>
                {a.by ? (
                  <span className="mt-1 block text-[0.82rem] leading-snug text-ink-3">
                    {a.by}
                  </span>
                ) : null}
              </span>
              <span className="col-span-2 mt-2 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-3 sm:col-span-1 sm:mt-0 sm:text-right">
                <T
                  v={
                    awardCategories.find((c) => c.id === a.category)?.label ?? {
                      en: "",
                    }
                  }
                />
              </span>
            </li>
          ))}
        </ol>

        {shown.length === 0 ? (
          <p className="py-16 text-center text-ink-3">
            <T v={{ en: "Nothing matches that search.", ta: "அந்தத் தேடலுக்கு எதுவும் பொருந்தவில்லை." }} />
          </p>
        ) : null}
      </div>
    </SceneAnchor>
  );
}
