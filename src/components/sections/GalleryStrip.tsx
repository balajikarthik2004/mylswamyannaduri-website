"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { photos } from "@/lib/data/gallery";
import { Reveal, SceneAnchor, SectionHeading, T } from "@/components/ui/primitives";

// Eight spreads keeps the pinned scrub to a few viewport-heights of scroll.
const strip = photos.filter((p) => p.wide).slice(0, 8);

export function GalleryStrip() {
  const section = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sec = section.current;
    const tr = track.current;
    if (!sec || !tr) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 768px)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const distance = () => tr.scrollWidth - window.innerWidth + 96;

      gsap.to(tr, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
    }, sec);

    return () => ctx.revert();
  }, []);

  return (
    <SceneAnchor scene="gallery" id="gallery" className="relative">
      <div className="container-x pt-24 md:pt-32">
        <SectionHeading
          kicker={{ en: "Gallery", ta: "படத்தொகுப்பு" }}
          title={{ en: "A life in photographs", ta: "புகைப்படங்களில் ஒரு வாழ்க்கை" }}
          lead={{
            en: "Album spreads from the ISRO years — launchpads, control rooms, and the people around them.",
            ta: "இஸ்ரோ ஆண்டுகளின் ஆல்பப் பக்கங்கள் — ஏவுதளங்கள், கட்டுப்பாட்டு அறைகள், மற்றும் அவற்றைச் சுற்றியிருந்த மனிதர்கள்.",
          }}
        />
      </div>

      {/* Pinned, full-height horizontal stage on desktop; swipe rail on mobile */}
      <div
        ref={section}
        className="relative mt-10 flex items-center overflow-hidden max-md:h-auto max-md:py-4 md:h-svh"
      >
        <div
          ref={track}
          className="flex gap-6 px-6 md:px-16 max-md:overflow-x-auto max-md:pb-4 max-md:[scrollbar-width:none]"
        >
          {strip.map((p, i) => (
            <figure
              key={p.src}
              className="group relative shrink-0 overflow-hidden rounded-xl border border-line bg-paper-2 shadow-lift max-md:aspect-[1600/630] max-md:w-[82vw] md:h-[42vh] md:w-auto md:[aspect-ratio:1600/630]"
            >
              <Image
                src={p.src}
                alt=""
                fill
                sizes="(max-width: 768px) 82vw, 60vw"
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
                loading={i < 2 ? "eager" : "lazy"}
              />
              <figcaption className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-card px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-2 backdrop-blur">
                {String(i + 1).padStart(2, "0")} / {strip.length}
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Scrub hint, pinned with the stage */}
        <p className="pointer-events-none absolute bottom-10 left-1/2 hidden -translate-x-1/2 items-center gap-3 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-ink-3 md:flex">
          <span className="inline-block h-px w-10 bg-line-2" aria-hidden="true" />
          <T v={{ en: "Keep scrolling", ta: "தொடர்ந்து உருட்டுங்கள்" }} />
          <span className="inline-block h-px w-10 bg-line-2" aria-hidden="true" />
        </p>
      </div>

      <div className="container-x pb-24 pt-12">
        <Reveal>
          <div className="flex justify-center">
            <Link
              href="/gallery"
              className="btn btn-ghost px-6 py-3"
            >
              <T v={{ en: "Open the full gallery", ta: "முழு படத்தொகுப்பைக் காண்க" }} />
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
