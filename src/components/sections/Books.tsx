"use client";

import Image from "next/image";
import { books } from "@/lib/data/missions";
import { Reveal, SceneAnchor, SectionHeading, T } from "@/components/ui/primitives";

export function Books() {
  return (
    <SceneAnchor scene="books" id="books" className="relative">
      <div className="container-x py-24 md:py-32">
        <SectionHeading
          kicker={{ en: "Writing", ta: "எழுத்து" }}
          title={{
            en: "Eight books, written in Tamil",
            ta: "தமிழில் எழுதப்பட்ட எட்டு நூல்கள்",
          }}
          lead={{
            en: "Science written for the language he grew up in — two of them award-winning, one translated into Kannada, and passages of his work carried into Tamil Nadu school textbooks.",
            ta: "அவர் வளர்ந்த மொழியில் எழுதப்பட்ட அறிவியல் — இரண்டு விருது பெற்றவை, ஒன்று கன்னடத்தில் மொழிபெயர்க்கப்பட்டது, மேலும் அவரது படைப்புகள் தமிழ்நாட்டுப் பள்ளிப் பாடநூல்களிலும் இடம்பெற்றுள்ளன.",
          }}
        />

        <ul className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((b, i) => (
            <Reveal as="li" key={b.title.en} delay={(i % 4) * 80} className="group">
              <div className="relative aspect-3/4 overflow-hidden rounded-lg border border-line bg-paper-2">
                {b.image ? (
                  <Image
                    src={b.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 22vw"
                    className="object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full flex-col justify-between p-5">
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-tamil text-[1.15rem] leading-snug text-ink">
                      {b.title.ta ?? b.title.en}
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-4 text-[0.95rem] font-medium leading-snug text-ink lang-aware">
                <T v={b.title} />
              </p>
              <p className="mt-1.5 text-[0.78rem] leading-snug text-ink-3 lang-aware">
                <T v={b.note} />
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </SceneAnchor>
  );
}
