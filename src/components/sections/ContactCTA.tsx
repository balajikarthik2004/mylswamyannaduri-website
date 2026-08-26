"use client";

import Link from "next/link";
import { socials } from "@/lib/data/profile";
import { Reveal, SceneAnchor, T } from "@/components/ui/primitives";

export function ContactCTA() {
  return (
    <SceneAnchor scene="contact" id="contact" className="relative">
      <div className="container-x py-28 md:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="kicker">
              <T v={{ en: "Invitations & enquiries", ta: "அழைப்புகள் & விசாரணைகள்" }} />
            </p>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="mt-6 font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[1.02] tracking-[-0.03em] text-ink">
              <T
                v={{
                  en: "Still touring, still teaching",
                  ta: "இன்னும் பயணிக்கிறார், இன்னும் கற்பிக்கிறார்",
                }}
              />
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-xl text-[1.0rem] leading-relaxed text-ink-2 lang-aware">
              <T
                v={{
                  en: "He still tours India through the school holidays to sit with students and argue for science. For speaking invitations, advisory roles and press enquiries, get in touch.",
                  ta: "பள்ளி விடுமுறை நாட்களில் இன்றும் இந்தியா முழுவதும் பயணித்து மாணவர்களுடன் அமர்ந்து அறிவியலுக்காக வாதிடுகிறார். உரை நிகழ்த்த அழைப்புகள், ஆலோசனைப் பொறுப்புகள் மற்றும் பத்திரிகை விசாரணைகளுக்கு தொடர்பு கொள்ளவும்.",
                }}
              />
            </p>
          </Reveal>

          <Reveal delay={230}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/engagements"
                className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-paper transition-all duration-300 hover:bg-accent"
              >
                <T v={{ en: "Check availability", ta: "கிடைக்கும் நேரத்தைப் பார்க்க" }} />
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-line-2 px-7 py-3.5 text-sm font-medium text-ink transition-all duration-300 hover:border-ink hover:bg-paper-2"
              >
                <T v={{ en: "Get in touch", ta: "தொடர்பு கொள்ள" }} />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-accent"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </SceneAnchor>
  );
}
