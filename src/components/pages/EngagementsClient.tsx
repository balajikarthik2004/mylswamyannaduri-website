"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BOOKING_HORIZON_MONTHS,
  MIN_NOTICE_DAYS,
  TIMEZONE_LABEL,
  engagementTypes,
  eventKindLabels,
  publicEvents,
  type PublicEvent,
} from "@/lib/data/engagements";
import {
  earliestBookable,
  formatDateShort,
  formatTime12,
  startOfToday,
  toKey,
} from "@/lib/engagements";
import { buildIcs, downloadIcs } from "@/lib/ics";
import { AvailabilityCalendar } from "@/components/engagements/AvailabilityCalendar";
import { BookingPanel } from "@/components/engagements/BookingPanel";
import { Reveal, SceneAnchor, T } from "@/components/ui/primitives";
import { useLang } from "@/lib/i18n";
import { useMounted } from "@/lib/use-mounted";

type Tab = "upcoming" | "past";

/** Same footprint as the real grid, so hydration doesn't shift the layout. */
function CalendarSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-8 w-40 rounded bg-paper-3/60" />
      <div className="mt-6 grid grid-cols-7 gap-1.5">
        {Array.from({ length: 49 }, (_, i) => (
          <div
            key={i}
            className={i < 7 ? "h-4" : "aspect-square rounded-lg bg-paper-2/70"}
          />
        ))}
      </div>
      <div className="mt-6 h-4 w-3/4 rounded bg-paper-3/40" />
    </div>
  );
}

export function EngagementsClient() {
  const { lang, t } = useLang();
  // Availability is read off the visitor's clock, which the server does not
  // share. Everything derived from it renders only after hydration.
  const mounted = useMounted();

  const today = startOfToday();
  // Open on the first month that clears the notice period — landing on a wall
  // of greyed-out days reads as "nothing is available" when it just isn't yet.
  const [cursor, setCursor] = useState(() => {
    const first = earliestBookable();
    return new Date(first.getFullYear(), first.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});
  const [tab, setTab] = useState<Tab>("upcoming");

  // Pull the slots already spoken for so the grid reflects real state.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/engagements")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.booked) setBookedSlots(d.booked);
      })
      .catch(() => {
        /* the calendar still works from the static rules alone */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const todayKey = toKey(today);
  const { upcoming, past } = useMemo(() => {
    const sorted = [...publicEvents].sort((a, b) => a.date.localeCompare(b.date));
    return {
      upcoming: sorted.filter((e) => (e.endDate ?? e.date) >= todayKey),
      past: sorted.filter((e) => (e.endDate ?? e.date) < todayKey).reverse(),
    };
  }, [todayKey]);

  const shown = tab === "upcoming" ? upcoming : past;

  return (
    <SceneAnchor scene="engagements" className="relative">
      <div className="container-x pt-36 pb-24">
        {/* Masthead */}
        <Reveal>
          <p className="kicker flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-ember" aria-hidden="true" />
            <T v={{ en: "Engagements", ta: "நிகழ்வுகள்" }} />
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.98] tracking-[-0.035em] text-ink">
            <T v={{ en: "The diary", ta: "நாட்குறிப்பு" }} />
          </h1>
        </Reveal>
        <Reveal delay={150}>
          <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-ink-2 lang-aware">
            <T
              v={{
                en: "Where he already is, and where he is still free. Choose an open date to see his slots and send a request to his office.",
                ta: "அவர் ஏற்கனவே எங்கு இருக்கிறார், இன்னும் எங்கு காலியாக இருக்கிறார். ஒரு தேதியைத் தேர்ந்தெடுத்து அவரது அலுவலகத்திற்குக் கோரிக்கை அனுப்புங்கள்.",
              }}
            />
          </p>
        </Reveal>

        {/* Booking ground rules */}
        <Reveal delay={210}>
          <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                k: { en: "Notice required", ta: "தேவையான அறிவிப்பு" },
                v: `${MIN_NOTICE_DAYS} days`,
              },
              {
                k: { en: "Booking horizon", ta: "முன்பதிவு காலம்" },
                v: `${BOOKING_HORIZON_MONTHS} months`,
              },
              { k: { en: "All times", ta: "அனைத்து நேரங்களும்" }, v: TIMEZONE_LABEL },
              {
                k: { en: "Confirmation", ta: "உறுதிப்படுத்தல்" },
                v: t({ en: "≤ 3 working days", ta: "≤ 3 வேலை நாட்கள்" }),
              },
            ].map((row) => (
              <div key={row.k.en} className="bg-paper/85 px-6 py-6 backdrop-blur-sm">
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-3">
                  <T v={row.k} />
                </dt>
                <dd className="mt-2 text-[1.05rem] font-medium text-ink">{row.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* Calendar + booking */}
        <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <Reveal className="rounded-2xl border border-line bg-paper/70 p-7 backdrop-blur-sm">
            {mounted ? (
              <AvailabilityCalendar
                cursor={cursor}
                onCursorChange={setCursor}
                selected={selected}
                onSelect={setSelected}
                bookedSlots={bookedSlots}
                lang={lang}
              />
            ) : (
              <CalendarSkeleton />
            )}
          </Reveal>

          <Reveal delay={120}>
            {mounted ? (
              <BookingPanel
                date={selected}
                bookedSlots={bookedSlots}
                lang={lang}
                onBooked={(d, time) =>
                  setBookedSlots((prev) => ({
                    ...prev,
                    [d]: [...(prev[d] ?? []), time],
                  }))
                }
              />
            ) : (
              <div className="h-full min-h-[22rem] rounded-2xl border border-dashed border-line-2 bg-paper-2/30" />
            )}
          </Reveal>
        </div>

        {/* What he takes on */}
        <div className="mt-24">
          <Reveal>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-tight tracking-[-0.025em] text-ink">
              <T v={{ en: "What he takes on", ta: "அவர் ஏற்கும் நிகழ்வுகள்" }} />
            </h2>
          </Reveal>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {engagementTypes.map((et, i) => (
              <Reveal
                as="li"
                key={et.id}
                delay={i * 70}
                className="bg-paper/85 px-6 py-7 backdrop-blur-sm"
              >
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ember">
                  {et.duration} min
                </p>
                <p className="mt-3 text-[0.95rem] font-medium leading-snug text-ink lang-aware">
                  <T v={et.label} />
                </p>
                <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-3 lang-aware">
                  <T v={et.blurb} />
                </p>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* Public diary */}
        <div className="mt-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-tight tracking-[-0.025em] text-ink">
                <T v={{ en: "Public engagements", ta: "பொது நிகழ்வுகள்" }} />
              </h2>
            </Reveal>
            <Reveal delay={90}>
              <div className="flex gap-2">
                {(
                  [
                    { id: "upcoming" as Tab, label: { en: "Upcoming", ta: "வரவிருப்பவை" }, n: upcoming.length },
                    { id: "past" as Tab, label: { en: "Past", ta: "நிகழ்ந்தவை" }, n: past.length },
                  ]
                ).map((tb) => (
                  <button
                    key={tb.id}
                    onClick={() => setTab(tb.id)}
                    aria-pressed={tab === tb.id}
                    className={[
                      "rounded-full border px-4 py-2 text-[0.78rem] font-medium transition-all duration-300",
                      tab === tb.id
                        ? "border-ink bg-ink text-paper"
                        : "border-line text-ink-2 hover:border-line-2 hover:text-ink",
                    ].join(" ")}
                  >
                    <T v={tb.label} />
                    <span
                      className={[
                        "ml-2 font-mono text-[0.65rem]",
                        tab === tb.id ? "text-paper/60" : "text-ink-3",
                      ].join(" ")}
                    >
                      {tb.n}
                    </span>
                  </button>
                ))}
              </div>
            </Reveal>
          </div>

          {!mounted ? (
            <div className="mt-8 space-y-px" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[4.6rem] border-b border-line" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <p className="mt-10 rounded-xl border border-dashed border-line-2 py-14 text-center text-ink-3 lang-aware">
              <T
                v={{
                  en: "Nothing listed here yet.",
                  ta: "இங்கு இதுவரை எதுவும் பட்டியலிடப்படவில்லை.",
                }}
              />
            </p>
          ) : (
            <ol className="mt-8">
              {shown.map((e, i) => (
                <EventRow key={`${e.date}-${e.title}`} e={e} lang={lang} index={i} />
              ))}
            </ol>
          )}

          <Reveal>
            <p className="mt-8 text-[0.75rem] leading-relaxed text-ink-3 lang-aware">
              <T
                v={{
                  en: "Diary drawn from the engagements board on mylswamyannadurai.in. Dates occasionally shift — his office confirms each one.",
                  ta: "mylswamyannadurai.in இல் உள்ள நிகழ்வுப் பலகையிலிருந்து எடுக்கப்பட்டது. தேதிகள் சில நேரங்களில் மாறலாம் — அவரது அலுவலகம் ஒவ்வொன்றையும் உறுதிப்படுத்தும்.",
                }}
              />
            </p>
          </Reveal>
        </div>
      </div>
    </SceneAnchor>
  );
}

function EventRow({
  e,
  lang,
  index,
}: {
  e: PublicEvent;
  lang: "en" | "ta";
  index: number;
}) {
  const span = e.endDate
    ? `${formatDateShort(e.date, lang)} – ${formatDateShort(e.endDate, lang)}`
    : formatDateShort(e.date, lang);

  return (
    <Reveal
      as="li"
      delay={(index % 4) * 60}
      className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-2 border-b border-line py-5 transition-colors hover:bg-paper-2/40 sm:grid-cols-[9rem_1fr_auto] sm:gap-x-8"
    >
      <time className="order-1 font-mono text-[0.72rem] uppercase tracking-[0.1em] text-ember">
        {span}
        {e.time ? ` · ${formatTime12(e.time)}` : ""}
      </time>

      <div className="order-3 col-span-2 min-w-0 sm:order-2 sm:col-span-1">
        <p className="text-[0.98rem] leading-snug text-ink">{e.title}</p>
        <p className="mt-1 text-[0.8rem] text-ink-3">
          {e.location ?? (e.mode === "online" ? "Online" : "—")}
        </p>
      </div>

      <div className="order-2 flex items-center gap-3 sm:order-3">
        <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-3">
          <T v={eventKindLabels[e.kind]} />
        </span>
        <button
          type="button"
          onClick={() =>
            downloadIcs(
              `annadurai-${e.date}`,
              buildIcs({
                uid: `${e.date}-${e.title.replace(/\W+/g, "-").slice(0, 40)}@mylswamyannadurai.in`,
                dateKey: e.date,
                time: e.time,
                durationMinutes: 120,
                title: `${e.title} — Dr. Mylswamy Annadurai`,
                location: e.location ?? (e.mode === "online" ? "Online" : ""),
                createdAt: new Date(),
              }),
            )
          }
          aria-label={`Add ${e.title} to your calendar`}
          className="whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-3 opacity-0 transition-all hover:text-accent focus-visible:opacity-100 group-hover:opacity-100"
        >
          + Cal
        </button>
      </div>
    </Reveal>
  );
}
