"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  photos,
  galleryCategories,
  videos,
  type GalleryCategory,
} from "@/lib/data/gallery";
import { Reveal, SceneAnchor, T } from "@/components/ui/primitives";
import { useLang } from "@/lib/i18n";

type Filter = GalleryCategory | "all";

export function GalleryClient() {
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<number | null>(null);
  const { t } = useLang();

  const shown = useMemo(
    () => (filter === "all" ? photos : photos.filter((p) => p.category === filter)),
    [filter],
  );

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (d: number) =>
      setActive((i) => (i === null ? null : (i + d + shown.length) % shown.length)),
    [shown.length],
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close, step]);

  const tabs: { id: Filter; label: { en: string; ta?: string }; n: number }[] = [
    { id: "all", label: { en: "All", ta: "அனைத்தும்" }, n: photos.length },
    ...galleryCategories.map((c) => ({
      id: c.id as Filter,
      label: c.label,
      n: photos.filter((p) => p.category === c.id).length,
    })),
  ];

  return (
    <SceneAnchor scene="gallery" className="relative">
      <div className="container-x pt-36 pb-24">
        <Reveal>
          <p className="kicker flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-brass-2" aria-hidden="true" />
            <T v={{ en: "Gallery", ta: "படத்தொகுப்பு" }} />
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.98] tracking-[-0.035em] text-ink">
            <T v={{ en: "A life in photographs", ta: "புகைப்படங்களில் ஒரு வாழ்க்கை" }} />
          </h1>
        </Reveal>

        {/* Filters */}
        <div className="mt-12 flex flex-wrap gap-2 border-y border-line py-5">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => {
                setFilter(tb.id);
                setActive(null);
              }}
              aria-pressed={filter === tb.id}
              className={[
                "rounded-full border px-4 py-2 text-[0.78rem] font-medium transition-all duration-300",
                filter === tb.id
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink-2 hover:border-line-2 hover:text-ink",
              ].join(" ")}
            >
              <T v={tb.label} />
              <span
                className={[
                  "ml-2 font-mono text-[0.65rem]",
                  filter === tb.id ? "text-paper/60" : "text-ink-3",
                ].join(" ")}
              >
                {tb.n}
              </span>
            </button>
          ))}
        </div>

        {/* Masonry-ish grid: wide spreads span two columns */}
        <ul className="mt-10 grid auto-rows-auto grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => (
            <Reveal
              as="li"
              key={p.src}
              delay={(i % 3) * 70}
              className={p.wide ? "sm:col-span-2 lg:col-span-3" : ""}
            >
              <button
                onClick={() => setActive(i)}
                className="group block w-full overflow-hidden rounded-xl border border-line bg-paper-2 shadow-lift text-left"
              >
                <span
                  className={[
                    "relative block",
                    p.wide ? "aspect-[1600/630]" : "aspect-4/3",
                  ].join(" ")}
                >
                  <Image
                    src={p.src}
                    alt={t(p.caption)}
                    fill
                    sizes={p.wide ? "(max-width: 640px) 100vw, 92vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                    className="object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-[1.04]"
                    loading={i < 6 ? "eager" : "lazy"}
                  />
                </span>
                <span className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-[0.8rem] leading-snug text-ink-2 lang-aware">
                    <T v={p.caption} />
                  </span>
                  <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-3 transition-colors group-hover:text-accent">
                    View
                  </span>
                </span>
              </button>
            </Reveal>
          ))}
        </ul>

        {/* Videos */}
        <div className="mt-24">
          <Reveal>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-tight tracking-[-0.025em] text-ink">
              <T v={{ en: "Talks & features", ta: "உரைகள் & சிறப்புப் பதிவுகள்" }} />
            </h2>
          </Reveal>
          <Reveal delay={90}>
            <p className="mt-3 max-w-2xl text-ink-2 lang-aware">
              <T
                v={{
                  en: "From his official YouTube channel.",
                  ta: "அவரது அதிகாரப்பூர்வ யூடியூப் சேனலிலிருந்து.",
                }}
              />
            </p>
          </Reveal>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((id, i) => (
              <Reveal as="li" key={id} delay={(i % 3) * 70}>
                <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-paper-2 shadow-lift">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title={`Video ${i + 1}`}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>

      {/* Lightbox — portalled to <body> so it escapes main's stacking context */}
      {active !== null && shown[active]
        ? createPortal(
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-paper/95 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-ink"
            aria-label="Close"
          >
            ✕
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            className="absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper text-ink"
            aria-label="Previous"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper text-ink"
            aria-label="Next"
          >
            →
          </button>

          <figure
            className="mx-auto max-h-[86svh] w-[min(92vw,72rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-h-[76svh] overflow-hidden rounded-xl border border-line bg-paper-2 shadow-lift">
              <Image
                src={shown[active].src}
                alt={t(shown[active].caption)}
                width={1600}
                height={1000}
                sizes="92vw"
                className="max-h-[76svh] w-full object-contain"
                priority
              />
            </div>
            <figcaption className="mt-4 flex items-center justify-between gap-4 text-[0.8rem] text-ink-2">
              <span className="lang-aware">
                <T v={shown[active].caption} />
              </span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-3">
                {active + 1} / {shown.length}
              </span>
            </figcaption>
          </figure>
        </div>,
            document.body,
          )
        : null}
    </SceneAnchor>
  );
}
