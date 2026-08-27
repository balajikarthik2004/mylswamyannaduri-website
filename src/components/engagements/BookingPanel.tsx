"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMinutesToTime,
  durationFor,
  eventsOn,
  formatDateLong,
  formatTime12,
  sessionById,
  sessionsForDate,
  validateBooking,
  type BookingInput,
  type DateLang,
} from "@/lib/engagements";
import {
  DURATION_CHOICES,
  TIMEZONE_LABEL,
  durationLabel,
  engagementTypes,
  sessions as allSessions,
  type EngagementTypeId,
  type SessionId,
} from "@/lib/data/engagements";
import { T } from "@/components/ui/primitives";
import { useLang } from "@/lib/i18n";

type Confirmation = {
  reference: string;
  date: string;
  session: SessionId;
  type: EngagementTypeId;
  mode: "in-person" | "online";
  durationMinutes: number;
  preferredTime?: string;
  location?: string;
  /** Echoed back so the confirmation can show who sent it. */
  name: string;
  organisation: string;
  email: string;
  phone?: string;
};

const inputBase =
  "mt-2 w-full rounded-xl border bg-paper px-4 py-3 text-[0.9rem] text-ink " +
  "placeholder:text-ink-4 transition-all duration-200 focus:outline-none " +
  "focus:ring-4 focus:ring-accent/8";
const labelCls =
  "block font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-3";

/**
 * Bring an element into view through Lenis where it is driving the page.
 *
 * A raw `scrollIntoView` competes with the smooth-scroll engine and lands in
 * the wrong place; routing through Lenis means a programmatic scroll eases
 * exactly like every other scroll on the site.
 */
function scrollToEl(el: HTMLElement | null, offset = -100) {
  if (!el) return;
  const lenis = typeof window !== "undefined" ? window.__lenis : undefined;
  if (!lenis) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  // Swapping a tall form for a short confirmation shrinks the document under
  // Lenis, which is still holding the old height — it then clamps the target
  // against a limit that no longer exists. Let layout settle, re-measure, and
  // only then scroll.
  requestAnimationFrame(() => {
    lenis.resize();
    lenis.scrollTo(el, { offset });
  });
}

/** Which field a given error should send the visitor to, in reading order. */
const ERROR_ORDER = [
  "date",
  "session",
  "type",
  "mode",
  "durationMinutes",
  "preferredTime",
  "name",
  "organisation",
  "email",
  "phone",
  "location",
  "audience",
  "message",
] as const;

export function BookingPanel({
  date,
  bookedSessions,
  onBooked,
  lang,
}: {
  date: string | null;
  bookedSessions: Record<string, string[]>;
  onBooked: (date: string, session: SessionId) => void;
  lang: DateLang;
}) {
  const { t } = useLang();
  const [session, setSession] = useState<SessionId | null>(null);
  const [type, setType] = useState<EngagementTypeId>("keynote");
  const [mode, setMode] = useState<"in-person" | "online">("in-person");
  const [duration, setDuration] = useState<number>(durationFor("keynote"));
  const [preferredTime, setPreferredTime] = useState("");
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    organisation: "",
    location: "",
    audience: "",
    message: "",
    company: "", // honeypot
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Confirmation | null>(null);

  const sessionsRef = useRef<HTMLFieldSetElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLFormElement>(null);

  /* A session chosen on one day must not survive a jump to another: Saturday
     runs no afternoon, so a stale pick would leave the form open on a window
     this date does not offer. React's documented adjust-during-render
     pattern; an effect here would cascade a second render. */
  const [lastDate, setLastDate] = useState(date);
  if (lastDate !== date) {
    setLastDate(date);
    setSession(null);
    setErrors({});
    setServerError(null);
  }

  const offered = useMemo(() => (date ? sessionsForDate(date) : []), [date]);
  const taken = (date && bookedSessions[date]) || [];

  /* The confirmation replaces a form that can run well past a screen in
     height, so on a tall page it lands entirely above the fold: the visitor
     presses submit and, as far as they can see, nothing happens. Move the
     view and the focus ring to it, and announce it. */
  useEffect(() => {
    if (!confirmed) return;
    const el = confirmRef.current;
    scrollToEl(el, -110);
    el?.focus({ preventScroll: true });
  }, [confirmed]);

  const set =
    (k: keyof typeof values) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setValues((v) => ({ ...v, [k]: e.target.value }));

  /** Send the visitor to whatever they have to fix, rather than leaving the
      message stranded off-screen next to a control they scrolled past. */
  const revealFirstError = (errs: Record<string, string>) => {
    const key = ERROR_ORDER.find((k) => errs[k]);
    if (!key) return;
    if (key === "session" || key === "date") {
      scrollToEl(sessionsRef.current, -120);
      return;
    }
    const el = document.getElementById(key);
    if (!el) {
      scrollToEl(detailsRef.current, -120);
      return;
    }
    scrollToEl(el, -160);
    (el as HTMLElement).focus({ preventScroll: true });
  };

  const reset = () => {
    setConfirmed(null);
    setSession(null);
    setPreferredTime("");
    setErrors({});
    setServerError(null);
    setValues({
      name: "",
      email: "",
      phone: "",
      organisation: "",
      location: "",
      audience: "",
      message: "",
      company: "",
    });
  };

  /* ══ Step 4 — confirmation ═════════════════════════════════ */
  if (confirmed) {
    const typeLabel = t(
      engagementTypes.find((x) => x.id === confirmed.type)?.label ?? {
        en: "Engagement",
      },
    );
    const win = sessionById(confirmed.session);
    const sessionLabel = win ? t(win.label) : confirmed.session;

    return (
      <div
        ref={confirmRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        /* Focus moves here only to carry a screen reader to the result; the
           card is not interactive, and a ring around the whole panel reads as
           an error state rather than as confirmation. */
        className="card-raised overflow-hidden focus:outline-none focus-visible:outline-none"
      >
        {/* Stub */}
        <div className="relative bg-ink px-7 py-7 text-paper">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success/18 text-[1.25rem] text-[#7fd1a3] ring-1 ring-[#7fd1a3]/35"
            >
              ✓
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-paper/50">
                <T v={{ en: "Provisional hold", ta: "தற்காலிக ஒதுக்கீடு" }} />
              </p>
              <p className="mt-1.5 font-display text-[1.7rem] leading-none tracking-[-0.02em]">
                <T v={{ en: "Request received", ta: "கோரிக்கை பெறப்பட்டது" }} />
              </p>
              <p className="mt-3 tnum font-mono text-[0.8rem] tracking-[0.1em] text-brass-2">
                {confirmed.reference}
              </p>
            </div>
          </div>
          {/* Perforation */}
          <span
            aria-hidden="true"
            className="absolute -bottom-2.5 left-0 right-0 flex justify-between px-4"
          >
            <span className="h-5 w-5 rounded-full bg-paper" />
            <span className="h-5 w-5 rounded-full bg-paper" />
          </span>
        </div>

        <div className="px-7 pb-7 pt-8">
          <p className="text-[0.9rem] leading-relaxed text-ink-2 lang-aware">
            <T
              v={{
                en: "The session is held provisionally and a copy of this request has gone to his office.",
                ta: "அமர்வு தற்காலிகமாக ஒதுக்கப்பட்டுள்ளது; இந்தக் கோரிக்கையின் நகல் அவரது அலுவலகத்திற்கு அனுப்பப்பட்டுள்ளது.",
              }}
            />{" "}
            <span className="font-medium text-ink">
              <T
                v={{
                  en: "Written confirmation goes to",
                  ta: "எழுத்துப்பூர்வ உறுதிப்படுத்தல் இங்கு வரும்",
                }}
              />{" "}
              {confirmed.email}
            </span>
            .
          </p>

          {/* ── What was requested ─────────────────────────── */}
          <p className={`${labelCls} mt-8`}>
            <T v={{ en: "The request", ta: "கோரிக்கை" }} />
          </p>
          <dl className="mt-3 space-y-0 divide-y divide-line border-y border-line">
            {[
              { k: { en: "Date", ta: "தேதி" }, v: formatDateLong(confirmed.date, lang) },
              {
                k: { en: "Session", ta: "அமர்வு" },
                v: confirmed.preferredTime
                  ? `${formatTime12(confirmed.preferredTime)} – ${formatTime12(
                      addMinutesToTime(
                        confirmed.preferredTime,
                        confirmed.durationMinutes,
                      ),
                    )}`
                  : sessionLabel,
                sub: win
                  ? `${sessionLabel} · ${formatTime12(win.start)}–${formatTime12(
                      win.end,
                    )} ${TIMEZONE_LABEL}`
                  : TIMEZONE_LABEL,
              },
              {
                k: { en: "Runs for", ta: "கால அளவு" },
                v: durationLabel(confirmed.durationMinutes),
              },
              { k: { en: "Format", ta: "வகை" }, v: typeLabel },
              {
                k: { en: "Mode", ta: "முறை" },
                v:
                  confirmed.mode === "online"
                    ? t({ en: "Online", ta: "ஆன்லைன்" })
                    : confirmed.location || t({ en: "In person", ta: "நேரில்" }),
              },
            ].map((row) => (
              <div key={row.k.en} className="flex items-baseline justify-between gap-6 py-3.5">
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-3">
                  <T v={row.k} />
                </dt>
                <dd className="text-right">
                  <span className="text-[0.9rem] font-medium text-ink">{row.v}</span>
                  {row.sub ? (
                    <span className="mt-0.5 block font-mono text-[0.6rem] text-ink-4">
                      {row.sub}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>

          {/* ── Who sent it ────────────────────────────────── */}
          <p className={`${labelCls} mt-8`}>
            <T v={{ en: "Submitted by", ta: "சமர்ப்பித்தவர்" }} />
          </p>
          <div className="mt-3 rounded-xl border border-line bg-paper-2/50 px-5 py-4">
            <p className="text-[0.95rem] font-medium leading-snug text-ink">
              {confirmed.name}
            </p>
            <p className="mt-1 text-[0.83rem] leading-snug text-ink-2">
              {confirmed.organisation}
            </p>
            <p className="mt-2.5 text-[0.8rem] leading-relaxed text-ink-3">
              {confirmed.email}
              {confirmed.phone ? (
                <>
                  <span aria-hidden="true"> · </span>
                  {confirmed.phone}
                </>
              ) : null}
            </p>
          </div>

          {/* What happens next — a provisional hold that says nothing about
              the next step reads as a dead end. */}
          <div className="mt-8">
            <p className={labelCls}>
              <T v={{ en: "What happens next", ta: "அடுத்து என்ன" }} />
            </p>
            <ol className="mt-3.5 space-y-3">
              {[
                {
                  en: "His office reviews the request against his travel diary.",
                  ta: "அவரது அலுவலகம் பயணக் குறிப்பேட்டுடன் ஒப்பிட்டு ஆய்வு செய்யும்.",
                },
                {
                  en: "You receive written confirmation, usually within three working days.",
                  ta: "பொதுவாக மூன்று வேலை நாட்களுக்குள் எழுத்துப்பூர்வ உறுதிப்படுத்தல் வரும்.",
                },
                {
                  en: "The exact hour, agenda and travel are settled directly with the office.",
                  ta: "சரியான நேரம், நிகழ்ச்சி நிரல் மற்றும் பயணம் அலுவலகத்துடன் நேரடியாக முடிவு செய்யப்படும்.",
                },
              ].map((s, i) => (
                <li key={s.en} className="flex gap-3.5">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brass-soft font-mono text-[0.6rem] text-brass"
                  >
                    {i + 1}
                  </span>
                  <span className="text-[0.83rem] leading-relaxed text-ink-2 lang-aware">
                    <T v={s} />
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={reset}
              className="btn btn-ghost w-full justify-center px-5 py-3 text-[0.85rem]"
            >
              <T v={{ en: "Request another", ta: "மற்றொன்று கோர" }} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══ Step 1 — no date yet ══════════════════════════════════ */
  if (!date) {
    return (
      <div className="card flex min-h-[26rem] flex-col px-9 py-9">
        <Stepper step={1} />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-paper-2 text-[1.4rem] text-ink-3"
          >
            ◷
          </span>
          <p className="mt-6 max-w-xs font-display text-[1.5rem] leading-snug tracking-[-0.02em] text-ink">
            <T
              v={{
                en: "Choose an open date to see when he is free",
                ta: "அவர் காலியாக இருக்கும் நேரத்தைக் காண ஒரு தேதியைத் தேர்ந்தெடுக்கவும்",
              }}
            />
          </p>
          <p className="mt-3 max-w-xs text-[0.85rem] leading-relaxed text-ink-3 lang-aware">
            <T
              v={{
                en: "Every time shown is Indian Standard Time. The exact hour is settled with his office once the request is confirmed.",
                ta: "காட்டப்படும் அனைத்து நேரங்களும் இந்திய நிலையான நேரம். கோரிக்கை உறுதி செய்யப்பட்ட பிறகு சரியான நேரம் அவரது அலுவலகத்துடன் முடிவு செய்யப்படும்.",
              }}
            />
          </p>
        </div>
      </div>
    );
  }

  const dayEvents = eventsOn(date);
  const step = !session ? 2 : 3;
  const win = session ? sessionById(session) : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const payload: Partial<BookingInput> = {
      date,
      session: session ?? undefined,
      type,
      mode,
      durationMinutes: duration,
      preferredTime: mode === "online" ? preferredTime : undefined,
      name: values.name,
      email: values.email,
      phone: values.phone,
      organisation: values.organisation,
      location: values.location,
      audience: values.audience,
      message: values.message,
    };

    const localErrors = validateBooking(payload, bookedSessions);
    setErrors(localErrors);
    if (Object.keys(localErrors).length > 0) {
      revealFirstError(localErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/engagements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, company: values.company }),
      });
      const data = await res.json();

      if (res.status === 422 && data.errors) {
        setErrors(data.errors);
        revealFirstError(data.errors);
        return;
      }
      if (!res.ok) {
        setServerError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      onBooked(date, session!);
      setConfirmed({
        reference: data.reference,
        date,
        session: session!,
        type,
        mode,
        durationMinutes: duration,
        preferredTime: mode === "online" ? preferredTime : undefined,
        location: values.location || undefined,
        name: values.name.trim(),
        organisation: values.organisation.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
      });
    } catch {
      setServerError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-raised overflow-hidden">
      {/* ── Selected date header ───────────────────────────── */}
      <div className="border-b border-line bg-paper-2/60 px-7 py-6">
        <Stepper step={step} />
        <p className="mt-4 kicker">
          <T v={{ en: "Selected date", ta: "தேர்ந்தெடுத்த தேதி" }} />
        </p>
        <h3 className="mt-1.5 font-display text-[1.5rem] leading-tight tracking-[-0.025em] text-ink">
          {formatDateLong(date, lang)}
        </h3>
        {dayEvents.length > 0 ? (
          <p className="mt-3 rounded-lg border-l-2 border-accent bg-accent-tint px-3.5 py-2.5 text-[0.8rem] leading-snug text-accent">
            {dayEvents.map((e) => e.title).join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="px-7 py-7">
        {/* ── Step 2: morning or afternoon ─────────────────── */}
        <fieldset ref={sessionsRef}>
          <legend className={labelCls}>
            <T v={{ en: "Which half of the day", ta: "நாளின் எந்தப் பகுதி" }} />
            <span className="ml-2 normal-case tracking-normal text-ink-4">
              {TIMEZONE_LABEL}
            </span>
          </legend>
          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            {allSessions.map((s) => {
              const isOffered = offered.includes(s.id);
              const isTaken = taken.includes(s.id);
              const disabled = !isOffered || isTaken;
              const active = session === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={disabled}
                  aria-pressed={active}
                  onClick={() => {
                    setSession(s.id);
                    // Clearing the error the moment a valid pick is made keeps
                    // the message from lingering under a resolved choice.
                    setErrors((prev) => {
                      if (!prev.session) return prev;
                      const rest = { ...prev };
                      delete rest.session;
                      return rest;
                    });
                  }}
                  className={[
                    "rounded-xl border px-4 py-4 text-left transition-all duration-200",
                    disabled
                      ? "cursor-not-allowed border-line bg-paper-2 text-ink-4"
                      : active
                        ? "border-transparent bg-ink text-paper shadow-lift"
                        : "border-line bg-card text-ink shadow-sink hover:-translate-y-0.5 hover:border-brass-2 hover:shadow-lift",
                  ].join(" ")}
                >
                  <span className="block text-[0.95rem] font-medium">
                    <T v={s.label} />
                  </span>
                  <span
                    className={[
                      "tnum mt-1 block font-mono text-[0.65rem] tracking-[0.06em]",
                      active ? "text-paper/60" : "text-ink-3",
                    ].join(" ")}
                  >
                    {isTaken
                      ? t({ en: "Taken", ta: "ஒதுக்கப்பட்டது" })
                      : !isOffered
                        ? t({ en: "Not offered", ta: "இல்லை" })
                        : `${formatTime12(s.start)} – ${formatTime12(s.end)}`}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.session ? (
            <p role="alert" className="mt-2.5 text-[0.75rem] text-ember">
              {errors.session}
            </p>
          ) : null}
        </fieldset>

        {/* ── Step 3: details, disclosed only once a session is held ── */}
        {!session ? (
          <div className="mt-7 rounded-xl border border-dashed border-line-2 bg-paper-2/40 px-5 py-6 text-center">
            <p className="text-[0.85rem] leading-relaxed text-ink-3 lang-aware">
              <T
                v={{
                  en: "Pick morning or afternoon to fill in your details.",
                  ta: "உங்கள் விவரங்களை நிரப்ப காலை அல்லது பிற்பகலைத் தேர்ந்தெடுக்கவும்.",
                }}
              />
            </p>
          </div>
        ) : (
          <form
            ref={detailsRef}
            onSubmit={submit}
            noValidate
            className="step-in mt-8 space-y-6"
          >
            {/* Held session, with a way back to step 2 */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-paper-2/50 px-4 py-3">
              <div className="min-w-0">
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ink-3">
                  <T v={{ en: "Holding", ta: "ஒதுக்கியுள்ளது" }} />
                </p>
                <p className="mt-1 text-[0.9rem] font-medium text-ink">
                  <T v={win?.label ?? { en: "Session" }} />
                  {win ? (
                    <span className="tnum ml-2 font-mono text-[0.65rem] font-normal text-ink-3">
                      {formatTime12(win.start)} – {formatTime12(win.end)}
                    </span>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSession(null);
                  scrollToEl(sessionsRef.current, -120);
                }}
                className="shrink-0 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-3 underline underline-offset-4 transition-colors hover:text-accent"
              >
                <T v={{ en: "Change", ta: "மாற்ற" }} />
              </button>
            </div>

            <div>
              <label htmlFor="eng-type" className={labelCls}>
                <T v={{ en: "Engagement type", ta: "நிகழ்வு வகை" }} />
              </label>
              <select
                id="eng-type"
                value={type}
                onChange={(e) => {
                  const next = e.target.value as EngagementTypeId;
                  setType(next);
                  // The type's own length is a sensible default for the
                  // duration; the visitor stays free to override it.
                  setDuration(durationFor(next));
                }}
                className={`${inputBase} border-line focus:border-accent`}
              >
                {engagementTypes.map((et) => (
                  <option key={et.id} value={et.id}>
                    {t(et.label)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[0.75rem] leading-relaxed text-ink-3 lang-aware">
                <T v={engagementTypes.find((x) => x.id === type)!.blurb} />
              </p>
            </div>

            {/* ── How long ─────────────────────────────────── */}
            <div>
              <label htmlFor="durationMinutes" className={labelCls}>
                <T v={{ en: "How long should it run", ta: "எவ்வளவு நேரம்" }} />
                <span className="ml-1 text-brass">*</span>
              </label>
              <select
                id="durationMinutes"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                aria-invalid={!!errors.durationMinutes}
                className={[
                  inputBase,
                  errors.durationMinutes
                    ? "border-ember focus:border-ember focus:ring-ember/8"
                    : "border-line focus:border-accent",
                ].join(" ")}
              >
                {DURATION_CHOICES.map((m) => (
                  <option key={m} value={m}>
                    {durationLabel(m)}
                  </option>
                ))}
              </select>
              {errors.durationMinutes ? (
                <p className="mt-1.5 text-[0.75rem] text-ember">
                  {errors.durationMinutes}
                </p>
              ) : null}
            </div>

            <div>
              <span className={labelCls}>
                <T v={{ en: "Mode", ta: "முறை" }} />
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2.5">
                {(
                  [
                    { id: "in-person", label: { en: "In person", ta: "நேரில்" }, icon: "◉" },
                    { id: "online", label: { en: "Online", ta: "ஆன்லைன்" }, icon: "⬡" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={mode === m.id}
                    onClick={() => setMode(m.id)}
                    className={[
                      "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[0.85rem] font-medium transition-all duration-200",
                      mode === m.id
                        ? "border-transparent bg-ink text-paper shadow-lift"
                        : "border-line bg-card text-ink-2 shadow-sink hover:border-brass-2 hover:text-ink",
                    ].join(" ")}
                  >
                    <span aria-hidden="true" className="text-[0.75em] opacity-60">
                      {m.icon}
                    </span>
                    <T v={m.label} />
                  </button>
                ))}
              </div>
            </div>

            {/* An online call has to start at a stated minute; an in-person
                visit is pinned down with the office, so it only needs the
                half-day. */}
            {mode === "online" ? (
              <div className="step-in">
                <label htmlFor="preferredTime" className={labelCls}>
                  <T
                    v={{ en: "Start time for the call", ta: "அழைப்பு தொடங்கும் நேரம்" }}
                  />
                  <span className="ml-1 text-brass">*</span>
                </label>
                <input
                  id="preferredTime"
                  type="time"
                  value={preferredTime}
                  min={win?.start}
                  max={win?.end}
                  step={900}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  aria-invalid={!!errors.preferredTime}
                  aria-describedby="preferredTime-hint"
                  className={[
                    inputBase,
                    "tnum",
                    errors.preferredTime
                      ? "border-ember focus:border-ember focus:ring-ember/8"
                      : "border-line focus:border-accent",
                  ].join(" ")}
                />
                <p
                  id="preferredTime-hint"
                  className="mt-1.5 font-mono text-[0.65rem] tracking-[0.06em] text-ink-3"
                >
                  {win
                    ? `${formatTime12(win.start)} – ${formatTime12(win.end)} ${TIMEZONE_LABEL}`
                    : TIMEZONE_LABEL}
                </p>
                {errors.preferredTime ? (
                  <p className="mt-1.5 text-[0.75rem] text-ember">
                    {errors.preferredTime}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="name"
                label={{ en: "Your name", ta: "உங்கள் பெயர்" }}
                value={values.name}
                onChange={set("name")}
                error={errors.name}
                required
              />
              <Field
                id="organisation"
                label={{ en: "Organisation", ta: "நிறுவனம்" }}
                value={values.organisation}
                onChange={set("organisation")}
                error={errors.organisation}
                required
              />
              <Field
                id="email"
                type="email"
                label={{ en: "Email", ta: "மின்னஞ்சல்" }}
                value={values.email}
                onChange={set("email")}
                error={errors.email}
                required
              />
              <Field
                id="phone"
                type="tel"
                label={{ en: "Phone (optional)", ta: "தொலைபேசி" }}
                value={values.phone}
                onChange={set("phone")}
                error={errors.phone}
              />
            </div>

            {mode === "in-person" ? (
              <Field
                id="location"
                label={{ en: "Venue / city", ta: "இடம் / நகரம்" }}
                value={values.location}
                onChange={set("location")}
                error={errors.location}
                required
              />
            ) : null}

            <Field
              id="audience"
              label={{
                en: "Expected audience (optional)",
                ta: "எதிர்பார்க்கும் பார்வையாளர்கள்",
              }}
              value={values.audience}
              onChange={set("audience")}
              error={errors.audience}
              placeholder="e.g. 400 undergraduate students"
            />

            <div>
              <label htmlFor="message" className={labelCls}>
                <T v={{ en: "Anything else", ta: "வேறு தகவல்" }} />
              </label>
              <textarea
                id="message"
                rows={4}
                value={values.message}
                onChange={set("message")}
                className={`${inputBase} resize-y border-line focus:border-accent`}
                placeholder="Theme, agenda, travel arrangements…"
              />
              {errors.message ? (
                <p className="mt-1.5 text-[0.75rem] text-ember">{errors.message}</p>
              ) : null}
            </div>

            {/* Honeypot — hidden from people, catnip for bots */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-[-9999px] h-0 w-0 overflow-hidden"
            >
              <label htmlFor="company">Company</label>
              <input
                id="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={values.company}
                onChange={set("company")}
              />
            </div>

            {serverError ? (
              <p
                role="alert"
                className="rounded-xl border border-ember/20 bg-ember-soft px-4 py-3 text-[0.82rem] text-ember"
              >
                {serverError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="btn btn-primary group w-full justify-center px-7 py-4 text-[0.9rem] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/30 border-t-paper"
                  />
                  <T v={{ en: "Sending…", ta: "அனுப்புகிறது…" }} />
                </>
              ) : (
                <>
                  <T v={{ en: "Send request", ta: "கோரிக்கையை அனுப்ப" }} />
                  <span className="btn-arrow">→</span>
                </>
              )}
            </button>

            <p className="text-center text-[0.72rem] leading-relaxed text-ink-3 lang-aware">
              <T
                v={{
                  en: "Requests are provisional until his office confirms in writing.",
                  ta: "அவரது அலுவலகம் எழுத்துப்பூர்வமாக உறுதிப்படுத்தும் வரை கோரிக்கைகள் தற்காலிகமானவை.",
                }}
              />
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Step indicator ─────────────────────────────────────────── */

function Stepper({ step }: { step: 1 | 2 | 3 | number }) {
  const steps: { n: number; label: { en: string; ta?: string } }[] = [
    { n: 1, label: { en: "Date", ta: "தேதி" } },
    { n: 2, label: { en: "Session", ta: "அமர்வு" } },
    { n: 3, label: { en: "Details", ta: "விவரங்கள்" } },
  ];
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = s.n < step;
        const active = s.n === step;
        return (
          <li key={s.n} className="flex items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={[
                "flex h-6 items-center gap-1.5 rounded-full pl-1.5 pr-2.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] transition-colors",
                active
                  ? "bg-ink text-paper"
                  : done
                    ? "bg-brass-soft text-brass"
                    : "bg-paper-3/70 text-ink-4",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-3.5 w-3.5 items-center justify-center rounded-full text-[0.55rem]",
                  active ? "bg-paper/20" : done ? "bg-brass/20" : "bg-ink/5",
                ].join(" ")}
              >
                {done ? "✓" : s.n}
              </span>
              <T v={s.label} />
            </span>
            {i < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={["h-px w-3", done ? "bg-brass/40" : "bg-line-2"].join(" ")}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Text field ─────────────────────────────────────────────── */

function Field({
  id,
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  placeholder,
}: {
  id: string;
  label: { en: string; ta?: string };
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        <T v={label} />
        {required ? <span className="ml-1 text-brass">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[
          inputBase,
          error
            ? "border-ember focus:border-ember focus:ring-ember/8"
            : "border-line focus:border-accent",
        ].join(" ")}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.75rem] text-ember">
          {error}
        </p>
      ) : null}
    </div>
  );
}
