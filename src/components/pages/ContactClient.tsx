"use client";

import Link from "next/link";
import { socials } from "@/lib/data/profile";
import { Reveal, SceneAnchor, T } from "@/components/ui/primitives";

const ENQUIRY_FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLSd66oRMtBEQRxAtogzRgRMDu3Cz2ddkhip5s4GyqBucLD2Kuw/viewform";

const roles: { k: { en: string; ta?: string }; v: { en: string; ta?: string } }[] = [
  {
    k: { en: "Speaking & outreach", ta: "உரை & விழிப்புணர்வு" },
    v: {
      en: "School and college programmes, science festivals, convocations",
      ta: "பள்ளி மற்றும் கல்லூரி நிகழ்ச்சிகள், அறிவியல் விழாக்கள், பட்டமளிப்பு விழாக்கள்",
    },
  },
  {
    k: { en: "Advisory", ta: "ஆலோசனை" },
    v: {
      en: "Space and deep-tech startups, boards, governing councils",
      ta: "விண்வெளி மற்றும் ஆழ்-தொழில்நுட்ப தொடக்க நிறுவனங்கள், இயக்குநர் குழுக்கள்",
    },
  },
  {
    k: { en: "Press", ta: "பத்திரிகை" },
    v: {
      en: "Interviews, documentaries and mission commentary",
      ta: "நேர்காணல்கள், ஆவணப்படங்கள் மற்றும் பயண விளக்கவுரை",
    },
  },
];

export function ContactClient() {
  return (
    <SceneAnchor scene="contact" className="relative">
      <div className="container-x pt-36 pb-28">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
          <div>
            <Reveal>
              <p className="kicker flex items-center gap-3">
                <span className="inline-block h-px w-8 bg-ember" aria-hidden="true" />
                <T v={{ en: "Contact", ta: "தொடர்பு" }} />
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 font-display text-[clamp(2.6rem,7vw,5rem)] leading-[0.98] tracking-[-0.035em] text-ink">
                <T v={{ en: "Get in touch", ta: "தொடர்பு கொள்ளுங்கள்" }} />
              </h1>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-ink-2 lang-aware">
                <T
                  v={{
                    en: "For speaking, outreach and advisory dates, the diary shows exactly when he is free — pick a slot and his office confirms in writing. For everything else, his public channels below are the fastest route.",
                    ta: "உரை, மாணவர் நிகழ்வுகள் மற்றும் ஆலோசனைத் தேதிகளுக்கு, அவர் எப்போது காலியாக இருக்கிறார் என்பதை நாட்குறிப்பு காட்டுகிறது — ஒரு நேரத்தைத் தேர்ந்தெடுங்கள், அவரது அலுவலகம் எழுத்துப்பூர்வமாக உறுதிப்படுத்தும். மற்ற அனைத்திற்கும், கீழே உள்ள பொதுச் சேனல்கள் விரைவான வழி.",
                  }}
                />
              </p>
            </Reveal>

            <Reveal delay={220}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/engagements"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-paper transition-all duration-300 hover:bg-accent"
                >
                  <T
                    v={{
                      en: "See availability & book a slot",
                      ta: "கிடைக்கும் நேரத்தைப் பார்த்து முன்பதிவு செய்ய",
                    }}
                  />
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <a
                  href={ENQUIRY_FORM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-line-2 px-7 py-3.5 text-sm font-medium text-ink transition-all duration-300 hover:border-ink hover:bg-paper-2"
                >
                  <T v={{ en: "Official enquiry form", ta: "அதிகாரப்பூர்வ படிவம்" }} />
                  <span aria-hidden="true" className="text-[0.8em] opacity-50">↗</span>
                </a>
              </div>
            </Reveal>

            <Reveal delay={290}>
              <dl className="mt-14 border-t border-line">
                {roles.map((r) => (
                  <div
                    key={r.k.en}
                    className="grid gap-1 border-b border-line py-5 sm:grid-cols-[12rem_1fr] sm:gap-8"
                  >
                    <dt className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ember">
                      <T v={r.k} />
                    </dt>
                    <dd className="text-[0.92rem] leading-snug text-ink-2 lang-aware">
                      <T v={r.v} />
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* Channels */}
          <Reveal delay={180}>
            <div className="rounded-2xl border border-line bg-paper-2/50 p-8 backdrop-blur-sm">
              <p className="kicker">
                <T v={{ en: "Public channels", ta: "பொதுச் சேனல்கள்" }} />
              </p>
              <ul className="mt-6 divide-y divide-line">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-4 py-4 transition-colors"
                    >
                      <span className="font-display text-[1.4rem] tracking-[-0.015em] text-ink transition-colors group-hover:text-accent">
                        {s.label}
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-ink-3 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent"
                      >
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-8 border-t border-line pt-6">
                <p className="kicker">
                  <T v={{ en: "Official site", ta: "அதிகாரப்பூர்வ தளம்" }} />
                </p>
                <a
                  href="https://www.mylswamyannadurai.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[0.9rem] text-ink-2 underline decoration-line-2 underline-offset-4 transition-colors hover:text-accent"
                >
                  mylswamyannadurai.in
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </SceneAnchor>
  );
}
