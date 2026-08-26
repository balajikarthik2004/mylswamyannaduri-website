"use client";

import Link from "next/link";
import { profile } from "@/lib/data/profile";
import { useLang } from "@/lib/i18n";
import { SceneAnchor, T } from "@/components/ui/primitives";

function Chars({ text, base = 0 }: { text: string; base?: number }) {
  return (
    <>
      {Array.from(text).map((c, i) => (
        <span
          key={`${c}-${i}`}
          className="char"
          style={{ "--d": `${base + i * 26}ms` } as React.CSSProperties}
          aria-hidden="true"
        >
          {c === " " ? " " : c}
        </span>
      ))}
    </>
  );
}

export function Hero() {
  const { lang, t } = useLang();
  const isTa = lang === "ta";
  const name = t(profile.name);
  const [first, ...restParts] = name.split(" ");
  const rest = restParts.join(" ");

  return (
    <SceneAnchor scene="hero" id="home" className="relative">
      <div className="container-x relative flex min-h-[100svh] flex-col justify-center pt-28 pb-16">
        <div className="max-w-[46rem]">
          {/* Kicker */}
          <p
            className="kicker flex items-center gap-3 opacity-0"
            style={{ animation: "char-in .9s var(--ease-out-expo) .1s forwards" }}
          >
            <span className="inline-block h-px w-10 bg-ember" aria-hidden="true" />
            <T v={profile.epithet} />
          </p>

          {/* Name. Tamil is never split per character — its vowel signs are
              combining marks, and slicing them off the base consonant both
              breaks shaping and renders orphaned dotted circles. Tamil
              animates a line at a time instead. */}
          <h1
            className={[
              "mt-6 text-ink",
              isTa
                ? "font-tamil text-[clamp(1.9rem,6.2vw,4.4rem)] leading-[1.22] tracking-normal"
                : "font-display text-[clamp(3.1rem,10.5vw,8.5rem)] leading-[0.9] tracking-[-0.035em]",
            ].join(" ")}
          >
            <span className="sr-only">{t(profile.fullName)}</span>
            {isTa ? (
              <>
                <span
                  className="char block"
                  style={{ "--d": "300ms" } as React.CSSProperties}
                  aria-hidden="true"
                >
                  {first}
                </span>
                <span
                  className="char block text-accent"
                  style={{ "--d": "440ms" } as React.CSSProperties}
                  aria-hidden="true"
                >
                  {rest}
                </span>
              </>
            ) : (
              <>
                <span className="block">
                  <Chars text={first} base={280} />
                </span>
                <span className="block italic text-accent">
                  <Chars text={rest} base={280 + first.length * 26 + 90} />
                </span>
              </>
            )}
          </h1>

          {/* Role + tagline */}
          <div
            className="mt-8 max-w-xl opacity-0"
            style={{ animation: "char-in 1s var(--ease-out-expo) 1.05s forwards" }}
          >
            <p className="text-[1.0625rem] font-medium text-ink lang-aware">
              <T v={profile.role} />
            </p>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2 lang-aware">
              <T v={profile.tagline} />
            </p>
            <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-3">
              <T v={profile.born} />
            </p>
          </div>

          {/* CTAs */}
          <div
            className="mt-10 flex flex-wrap items-center gap-3 opacity-0"
            style={{ animation: "char-in 1s var(--ease-out-expo) 1.25s forwards" }}
          >
            <Link
              href="/missions"
              className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-all duration-300 hover:bg-accent"
            >
              <T v={{ en: "Explore the missions", ta: "பயணங்களைக் காண்க" }} />
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/#about"
              className="inline-flex items-center gap-2 rounded-full border border-line-2 px-6 py-3 text-sm font-medium text-ink transition-all duration-300 hover:border-ink hover:bg-paper-2"
            >
              <T v={{ en: "Read the profile", ta: "சுயவிவரம் படிக்க" }} />
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 opacity-0 md:flex"
          style={{ animation: "char-in 1s var(--ease-out-expo) 1.6s forwards" }}
        >
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-ink-3">
            Scroll
          </span>
          <span className="relative block h-10 w-px overflow-hidden bg-line-2">
            <span
              className="absolute inset-x-0 h-4 bg-accent"
              style={{ animation: "scroll-hint 2.2s ease-in-out infinite" }}
            />
          </span>
        </div>
      </div>
    </SceneAnchor>
  );
}
