"use client";

import Image from "next/image";
import Link from "next/link";
import { profile } from "@/lib/data/profile";
import { useLang, type L } from "@/lib/i18n";
import { SceneAnchor, T } from "@/components/ui/primitives";

/**
 * The opening screen, composed as three bands rather than two columns.
 *
 *   left    — the portrait, bled off the edge and dissolved into the paper
 *   centre  — the name and the claim
 *   right   — the Moon, from the WebGL scene behind everything
 *
 * The portrait is a ground, not a plate: no frame, no caption, masked so it
 * fades out well before the type begins and scrimmed so nothing crosses it at
 * readable contrast. Framed and captioned it competed with the wordmark for
 * the eye; as a ground it sets the subject before a word is read and then
 * gets out of the way. He and the Moon face each other across the name, which
 * is the whole story of the page in one screen.
 *
 * Everything premium here is a physical cue rather than an effect: a struck
 * seal for the Padma Shri, hairline-ruled credentials, brass rules that catch
 * light from the same side as the portrait, and one warm pool in the middle.
 */

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
          {c === " " ? " " : c}
        </span>
      ))}
    </>
  );
}

/** The three postings that are the whole claim, struck as a ruled rail. */
const credentials: { role: L; body: L }[] = [
  {
    role: { en: "Project Director", ta: "திட்ட இயக்குனர்" },
    body: { en: "Chandrayaan-1", ta: "சந்திரயான்-1" },
  },
  {
    role: { en: "Programme Director", ta: "திட்ட இயக்குனர்" },
    body: { en: "Mangalyaan", ta: "மங்கள்யான்" },
  },
  {
    role: { en: "Director, 2015–18", ta: "இயக்குனர், 2015–18" },
    body: { en: "ISRO Satellite Centre", ta: "இஸ்ரோ செயற்கைக்கோள் மையம்" },
  },
];

export function Hero() {
  const { lang, t } = useLang();
  const isTa = lang === "ta";
  const name = t(profile.name);
  const [first, ...restParts] = name.split(" ");
  const rest = restParts.join(" ");

  return (
    <SceneAnchor scene="hero" id="home" className="relative overflow-hidden">
      {/* ── Left band: the portrait as ground ─────────────────
          Two separate fades do two different jobs. The mask dissolves the
          photograph itself, so its right edge never exists as a line; the
          paper gradient over the top holds whatever survives the mask below
          the contrast of the type. One without the other is either a photo
          with a visible cut or a photo the copy has to fight. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[86%] sm:w-[62%] lg:w-[46%] xl:w-[42%]"
      >
        {/* A narrow screen has no left gutter for him to stand in, so the
            band and the centred type occupy the same pixels. Rather than
            move him, he drops to a wash there and comes up to full strength
            only once there is a column of paper for the copy to sit on. */}
        <div className="hero-portrait-mask relative h-full w-full opacity-[0.3] sm:opacity-65 lg:opacity-100">
          <Image
            src="/img/gallery/capture1.png"
            alt=""
            fill
            sizes="(max-width: 640px) 86vw, (max-width: 1024px) 62vw, 46vw"
            className="plate-image object-cover object-[42%_top]"
            priority
          />
        </div>
        {/* Ivory poured back over it, left to right — and it must reach
            *transparent*, not paper. Ending on opaque paper painted a solid
            rectangle over the body's own background washes, and the right
            edge of that rectangle showed as a vertical seam down the middle
            of the screen. Fading to nothing at the same width the mask does
            leaves no edge to see. */}
        <div className="absolute inset-0 bg-gradient-to-r from-paper/25 via-paper/60 to-transparent" />
      </div>

      {/* One warm pool under the wordmark. The page-wide washes on <body> are
          deliberately too faint to compose with; this shapes the screen. */}
      <div
        aria-hidden="true"
        className="hero-light pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-80"
      />

      {/* Haze along the top edge. The navigation bar is transparent until the
          page is scrolled, and both the portrait and the Moon pass behind it —
          dark tones under dark labels put them below readable contrast. A fade
          rather than a block, so it reads as atmosphere and not as a strip
          laid over the picture. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-paper via-paper/65 to-transparent"
      />

      {/* ── Centre band: the name and the claim ─────────────── */}
      <div className="container-x relative flex min-h-[100svh] flex-col items-center justify-center pt-32 pb-24 text-center lg:pt-28">
        <div className="w-full max-w-[42rem]">
          {/* The Padma Shri, struck rather than stated, and centred above the
              name the way a seal sits at the head of a citation. */}
          <div
            className="flex justify-center opacity-0"
            style={{ animation: "char-in .9s var(--ease-out-expo) .1s forwards" }}
          >
            <span className="inline-flex items-center gap-2.5 rounded-full border border-line bg-card/85 py-1.5 pl-1.5 pr-4 shadow-lift backdrop-blur-sm">
              <span
                aria-hidden="true"
                className="seal flex h-7 w-7 items-center justify-center rounded-full text-[0.6rem] leading-none text-paper"
              >
                ★
              </span>
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ink">
                Padma Shri
                <span className="text-ink-3"> · 2016</span>
              </span>
            </span>
          </div>

          {/* Kicker */}
          <p
            className="kicker mt-7 flex items-center justify-center gap-3 opacity-0"
            style={{ animation: "char-in .9s var(--ease-out-expo) .25s forwards" }}
          >
            <span className="metal-rule inline-block h-px w-8" aria-hidden="true" />
            <T v={profile.epithet} />
            <span className="metal-rule inline-block h-px w-8" aria-hidden="true" />
          </p>

          {/* Name. Tamil is never split per character — its vowel signs are
              combining marks, and slicing them off the base consonant both
              breaks shaping and renders orphaned dotted circles. Tamil
              animates a line at a time instead. */}
          <h1
            className={[
              "mt-5 text-ink drop-shadow-sm",
              isTa
                ? "font-tamil text-[clamp(1.8rem,5.4vw,3.4rem)] leading-[1.22] tracking-normal"
                : "font-display text-[clamp(2.85rem,8.4vw,6rem)] leading-[0.92] tracking-[-0.035em]",
            ].join(" ")}
          >
            <span className="sr-only">{t(profile.fullName)}</span>
            {isTa ? (
              <>
                <span
                  className="char block"
                  style={{ "--d": "420ms" } as React.CSSProperties}
                  aria-hidden="true"
                >
                  {first}
                </span>
                <span
                  className="char block text-accent"
                  style={{ "--d": "560ms" } as React.CSSProperties}
                  aria-hidden="true"
                >
                  {rest}
                </span>
              </>
            ) : (
              <>
                <span className="block">
                  <Chars text={first} base={400} />
                </span>
                <span className="block italic text-accent drop-shadow-md">
                  <Chars text={rest} base={400 + first.length * 26 + 90} />
                </span>
              </>
            )}
          </h1>

          {/* Lead.
              The tagline that used to sit here — "Padma Shri · Project
              Director, Chandrayaan-1 · Programme Director, Mangalyaan" — is
              now the seal above and the credentials rail below, word for
              word. Repeating it in prose between the two made the opening
              read as a CV three times over, so this line carries the voice
              and the rail carries the facts. */}
          <div
            className="opacity-0"
            style={{ animation: "char-in 1s var(--ease-out-expo) 1.15s forwards" }}
          >
            <div className="rule-fade mx-auto mt-9 w-28" aria-hidden="true" />
            <p className="mx-auto mt-8 max-w-[34rem] text-[1.0625rem] leading-[1.75] text-ink-2 lang-aware">
              <T v={profile.quote} />
            </p>
            <p className="mt-5 font-mono text-[0.64rem] uppercase leading-relaxed tracking-[0.14em] text-ink-3">
              <T v={profile.role} />
              <span aria-hidden="true"> · </span>
              <T v={profile.born} />
            </p>
          </div>

          {/* CTAs */}
          <div
            className="mt-10 flex flex-wrap items-center justify-center gap-4 opacity-0"
            style={{ animation: "char-in 1s var(--ease-out-expo) 1.35s forwards" }}
          >
            <Link href="/engagements" className="btn btn-primary px-7 py-3.5 shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all text-[0.95rem] font-medium tracking-wide">
              <T v={{ en: "Invite him to speak", ta: "பேச அழைக்க" }} />
              <span className="btn-arrow transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link href="/missions" className="btn btn-ghost px-7 py-3.5 hover:bg-paper/50 hover:text-ink transition-all text-[0.95rem] font-medium tracking-wide border border-transparent hover:border-line/50">
              <T v={{ en: "Explore the missions", ta: "பயணங்களைக் காண்க" }} />
            </Link>
          </div>

          {/* ── Credentials rail ────────────────────────────
              The postings, not adjectives. Three ruled cells carry more
              authority in less space than a paragraph claiming the same
              thing, and they give the centre column a base to sit on.

              Stacked cells on a phone became three tall blocks for six short
              words, so a narrow screen gets them as ruled lines with the
              posting and the mission on one baseline instead. The cell ground
              is near-opaque because both the portrait and the Moon can pass
              behind this rail at exactly the point the copy is smallest. */}
          <dl
            className="mt-12 grid gap-px overflow-hidden border-y border-line bg-line text-left opacity-0 sm:grid-cols-3 sm:text-center"
            style={{ animation: "char-in 1s var(--ease-out-expo) 1.55s forwards" }}
          >
            {credentials.map((c) => (
              <div
                key={c.body.en}
                className="flex items-baseline justify-between gap-4 bg-paper/85 px-3 py-3 backdrop-blur-[2px] sm:block sm:px-4 sm:py-4"
              >
                <dt className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-brass">
                  <T v={c.role} />
                </dt>
                <dd className="text-right text-[0.85rem] font-medium leading-snug text-ink lang-aware sm:mt-1.5 sm:text-center">
                  <T v={c.body} />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Scroll hint, on the centre line under the rail. */}
        <div
          className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2.5 opacity-0 lg:flex"
          style={{ animation: "char-in 1s var(--ease-out-expo) 1.8s forwards" }}
        >
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-ink-3">
            Scroll
          </span>
          <span className="relative block h-9 w-px overflow-hidden bg-line-2">
            <span
              className="absolute inset-x-0 h-3.5 bg-accent"
              style={{ animation: "scroll-hint 2.2s ease-in-out infinite" }}
            />
          </span>
        </div>
      </div>
    </SceneAnchor>
  );
}
