"use client";

import Image from "next/image";
import { books } from "@/lib/data/missions";
import { Reveal, SceneAnchor, SectionHeading, T } from "@/components/ui/primitives";

/**
 * Cloth boards for the titles we hold no cover scan for.
 *
 * Four of the eight books have a photographed cover; the other four were
 * rendering as an all-but-empty panel with a faint index number, which reads
 * as a broken image rather than as a book. Rather than invent artwork for a
 * real published title, those get a typeset jacket — spine, rules, imprint —
 * so the shelf is eight designed objects instead of four covers and four
 * gaps. The boards cycle so no two neighbours share a colour.
 */
const BOARDS = [
  { bg: "#0b1b39", rule: "#c39b3f" }, // deep navy
  { bg: "#5c2a16", rule: "#e6c877" }, // oxblood
  { bg: "#1d2a20", rule: "#c39b3f" }, // forest
  { bg: "#4a3a12", rule: "#e6c877" }, // brass cloth
];

function Spine() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-y-0 left-0 w-[7%]"
      style={{
        background:
          "linear-gradient(90deg, rgba(0,0,0,0.42), rgba(255,255,255,0.07) 58%, rgba(0,0,0,0.22))",
      }}
    />
  );
}

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
          {books.map((b, i) => {
            const board = BOARDS[i % BOARDS.length];
            return (
              <Reveal as="li" key={b.title.en} delay={(i % 4) * 80} className="group">
                {/* The cover scans are 300×300. A 3:4 tile cropped a quarter
                    off each side of every one of them, slicing the Tamil
                    titles in half; a square tile shows each cover whole. */}
                <div
                  className="relative aspect-square overflow-hidden rounded-lg shadow-lift ring-1 ring-ink/8 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-raise"
                  style={b.image ? undefined : { background: board.bg }}
                >
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
                    <>
                      <Spine />
                      <div className="flex h-full flex-col justify-between py-6 pl-[16%] pr-6">
                        <div>
                          <span
                            className="block h-px w-9"
                            style={{ background: board.rule }}
                            aria-hidden="true"
                          />
                          <p
                            className="mt-3 font-mono text-[0.55rem] uppercase leading-relaxed tracking-[0.18em]"
                            style={{ color: board.rule }}
                          >
                            Mylswamy
                            <br />
                            Annadurai
                          </p>
                        </div>

                        <p className="font-tamil text-[1.15rem] leading-[1.45] text-paper">
                          {b.title.ta ?? b.title.en}
                        </p>

                        <div>
                          <span
                            className="block h-px w-full opacity-30"
                            style={{ background: board.rule }}
                            aria-hidden="true"
                          />
                          <p className="mt-2.5 flex items-baseline justify-between font-mono text-[0.55rem] uppercase tracking-[0.16em] text-paper/45">
                            <span>{String(i + 1).padStart(2, "0")}</span>
                            <span>
                              <T v={{ en: "Tamil", ta: "தமிழ்" }} />
                            </span>
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <p className="mt-4 text-[0.95rem] font-medium leading-snug text-ink lang-aware">
                  <T v={b.title} />
                </p>
                <p className="mt-1.5 text-[0.78rem] leading-snug text-ink-3 lang-aware">
                  <T v={b.note} />
                </p>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </SceneAnchor>
  );
}
