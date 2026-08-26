"use client";

import Link from "next/link";
import { profile, socials } from "@/lib/data/profile";
import { T } from "@/components/ui/primitives";

export function Footer() {
  // The background is opaque on purpose: the contact scene puts the Moon
  // rising behind this edge, so a solid footer reads as the horizon it sets
  // against.
  return (
    <footer className="relative z-10 mt-32 border-t border-line bg-paper-2">
      <div className="container-x py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-[1.75rem] leading-tight tracking-[-0.02em] text-ink">
              <T v={profile.fullName} />
            </p>
            <p className="mt-2 kicker">
              <T v={profile.epithet} />
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-2 lang-aware">
              <T v={profile.tagline} />
            </p>
          </div>

          <nav aria-label="Site">
            <p className="kicker">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/missions", label: { en: "Missions", ta: "பயணங்கள்" } },
                { href: "/awards", label: { en: "Awards", ta: "விருதுகள்" } },
                { href: "/gallery", label: { en: "Gallery", ta: "படத்தொகுப்பு" } },
                { href: "/engagements", label: { en: "Engagements", ta: "நிகழ்வுகள்" } },
                { href: "/contact", label: { en: "Contact", ta: "தொடர்பு" } },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-ink-2 transition-colors hover:text-accent"
                  >
                    <T v={l.label} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="kicker">Elsewhere</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 text-ink-2 transition-colors hover:text-accent"
                  >
                    {s.label}
                    <span
                      aria-hidden="true"
                      className="translate-y-px text-[0.7em] opacity-40 transition-transform group-hover:translate-x-0.5"
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-[0.7rem] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono uppercase tracking-[0.14em]">
            © {new Date().getFullYear()} Dr. Mylswamy Annadurai
          </p>
          <p className="font-mono uppercase tracking-[0.14em]">
            Content courtesy mylswamyannadurai.in · Lunar &amp; Martian imagery: NASA / Solar System Scope
          </p>
        </div>
      </div>
    </footer>
  );
}
