"use client";

import { useMemo, useState } from "react";
import {
  addMinutesToTime,
  durationFor,
  eventsOn,
  formatDateLong,
  formatTime12,
  slotsForDate,
  validateBooking,
  type BookingInput,
  type DateLang,
} from "@/lib/engagements";
import {
  TIMEZONE_LABEL,
  engagementTypes,
  type EngagementTypeId,
} from "@/lib/data/engagements";
import { buildIcs, downloadIcs } from "@/lib/ics";
import { T } from "@/components/ui/primitives";
import { useLang } from "@/lib/i18n";

type Confirmation = {
  reference: string;
  date: string;
  time: string;
  type: EngagementTypeId;
  mode: "in-person" | "online";
  location?: string;
};

const field =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[0.9rem] text-ink placeholder:text-ink-3 transition-colors focus:border-accent focus:outline-none";
const labelCls =
  "block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-3";

export function BookingPanel({
  date,
  bookedSlots,
  onBooked,
  lang,
}: {
  date: string | null;
  bookedSlots: Record<string, string[]>;
  onBooked: (date: string, time: string) => void;
  lang: DateLang;
}) {
  const { t } = useLang();
  const [time, setTime] = useState<string | null>(null);
  const [type, setType] = useState<EngagementTypeId>("keynote");
  const [mode, setMode] = useState<"in-person" | "online">("in-person");
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

  const slots = useMemo(() => (date ? slotsForDate(date) : []), [date]);
  const taken = (date && bookedSlots[date]) || [];

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  /* ── Confirmation view ──────────────────────────────────── */
  if (confirmed) {
    const dur = durationFor(confirmed.type);
    const typeLabel = t(
      engagementTypes.find((x) => x.id === confirmed.type)?.label ?? { en: "Engagement" },
    );
    return (
      <div className="rounded-2xl border border-line bg-paper-2/60 p-7 backdrop-blur-sm">
        <p className="kicker text-ember">
          <T v={{ en: "Request received", ta: "கோரிக்கை பெறப்பட்டது" }} />
        </p>
        <h3 className="mt-4 font-display text-[1.9rem] leading-tight tracking-[-0.02em] text-ink">
          <T
            v={{
              en: "We have your request",
              ta: "உங்கள் கோரிக்கை பெறப்பட்டுள்ளது",
            }}
          />
        </h3>
        <p className="mt-3 text-[0.92rem] leading-relaxed text-ink-2 lang-aware">
          <T
            v={{
              en: "This holds the slot provisionally. His office confirms in writing, usually within three working days.",
              ta: "இது தற்காலிகமாக நேரத்தை ஒதுக்கி வைக்கிறது. அவரது அலுவலகம் பொதுவாக மூன்று வேலை நாட்களுக்குள் எழுத்துப்பூர்வமாக உறுதிப்படுத்தும்.",
            }}
          />
        </p>

        <dl className="mt-6 divide-y divide-line border-y border-line">
          {[
            { k: { en: "Reference", ta: "குறிப்பு எண்" }, v: confirmed.reference },
            { k: { en: "Date", ta: "தேதி" }, v: formatDateLong(confirmed.date, lang) },
            {
              k: { en: "Time", ta: "நேரம்" },
              v: `${formatTime12(confirmed.time)} – ${formatTime12(
                addMinutesToTime(confirmed.time, dur),
              )} · ${TIMEZONE_LABEL}`,
            },
            { k: { en: "Type", ta: "வகை" }, v: typeLabel },
            {
              k: { en: "Mode", ta: "முறை" },
              v:
                confirmed.mode === "online"
                  ? t({ en: "Online", ta: "ஆன்லைன்" })
                  : confirmed.location || t({ en: "In person", ta: "நேரில்" }),
            },
          ].map((row) => (
            <div key={row.k.en} className="flex justify-between gap-6 py-3">
              <dt className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-3">
                <T v={row.k} />
              </dt>
              <dd className="text-right text-[0.88rem] font-medium text-ink">{row.v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              downloadIcs(
                `annadurai-${confirmed.reference}`,
                buildIcs({
                  uid: `${confirmed.reference}@mylswamyannadurai.in`,
                  dateKey: confirmed.date,
                  time: confirmed.time,
                  durationMinutes: dur,
                  title: `${typeLabel} — Dr. Mylswamy Annadurai`,
                  description: `Provisional. Reference ${confirmed.reference}. Awaiting written confirmation from his office.`,
                  location:
                    confirmed.mode === "online" ? "Online" : confirmed.location || "",
                  createdAt: new Date(),
                }),
              )
            }
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.85rem] font-medium text-paper transition-colors hover:bg-accent"
          >
            <T v={{ en: "Add to calendar", ta: "காலெண்டரில் சேர்க்க" }} />
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmed(null);
              setTime(null);
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
            }}
            className="inline-flex items-center gap-2 rounded-full border border-line-2 px-5 py-2.5 text-[0.85rem] font-medium text-ink transition-colors hover:border-ink"
          >
            <T v={{ en: "Request another", ta: "மற்றொன்று கோர" }} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Empty state ────────────────────────────────────────── */
  if (!date) {
    return (
      <div className="rounded-2xl border border-dashed border-line-2 bg-paper-2/30 p-9 text-center">
        <p className="font-display text-[1.5rem] leading-snug tracking-[-0.02em] text-ink-3">
          <T
            v={{
              en: "Pick an open date to see his free slots",
              ta: "காலியான நேரங்களைக் காண ஒரு தேதியைத் தேர்ந்தெடுக்கவும்",
            }}
          />
        </p>
        <p className="mt-3 text-[0.85rem] text-ink-3 lang-aware">
          <T
            v={{
              en: "All times are shown in Indian Standard Time.",
              ta: "அனைத்து நேரங்களும் இந்திய நிலையான நேரத்தில் காட்டப்படுகின்றன.",
            }}
          />
        </p>
      </div>
    );
  }

  const dayEvents = eventsOn(date);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const payload: Partial<BookingInput> = {
      date,
      time: time ?? "",
      type,
      mode,
      name: values.name,
      email: values.email,
      phone: values.phone,
      organisation: values.organisation,
      location: values.location,
      audience: values.audience,
      message: values.message,
    };

    const localErrors = validateBooking(payload, bookedSlots);
    setErrors(localErrors);
    if (Object.keys(localErrors).length > 0) return;

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
        return;
      }
      if (!res.ok) {
        setServerError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      onBooked(date, time!);
      setConfirmed({
        reference: data.reference,
        date,
        time: time!,
        type,
        mode,
        location: values.location || undefined,
      });
    } catch {
      setServerError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-paper-2/50 p-7 backdrop-blur-sm">
      <p className="kicker">
        <T v={{ en: "Selected date", ta: "தேர்ந்தெடுத்த தேதி" }} />
      </p>
      <h3 className="mt-3 font-display text-[1.6rem] leading-tight tracking-[-0.02em] text-ink">
        {formatDateLong(date, lang)}
      </h3>

      {dayEvents.length > 0 ? (
        <p className="mt-3 rounded-lg bg-accent-soft/60 px-4 py-3 text-[0.82rem] text-accent">
          {dayEvents.map((e) => e.title).join(" · ")}
        </p>
      ) : null}

      {/* Slots */}
      <fieldset className="mt-7">
        <legend className={labelCls}>
          <T v={{ en: "Available slots", ta: "கிடைக்கும் நேரங்கள்" }} /> ·{" "}
          {TIMEZONE_LABEL}
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {slots.map((s) => {
            const isTaken = taken.includes(s);
            const active = time === s;
            return (
              <button
                key={s}
                type="button"
                disabled={isTaken}
                aria-pressed={active}
                onClick={() => setTime(s)}
                className={[
                  "rounded-full border px-4 py-2 text-[0.8rem] font-medium transition-all duration-200",
                  isTaken
                    ? "cursor-not-allowed border-line bg-paper-3/50 text-ink-3 line-through"
                    : active
                      ? "border-ink bg-ink text-paper"
                      : "border-line-2 text-ink hover:border-ink",
                ].join(" ")}
              >
                {formatTime12(s)}
              </button>
            );
          })}
        </div>
        {errors.time ? (
          <p className="mt-2 text-[0.75rem] text-ember">{errors.time}</p>
        ) : null}
      </fieldset>

      {/* Form */}
      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="eng-type" className={labelCls}>
            <T v={{ en: "Engagement type", ta: "நிகழ்வு வகை" }} />
          </label>
          <select
            id="eng-type"
            value={type}
            onChange={(e) => setType(e.target.value as EngagementTypeId)}
            className={`${field} mt-2`}
          >
            {engagementTypes.map((et) => (
              <option key={et.id} value={et.id}>
                {t(et.label)} · {et.duration} min
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[0.75rem] text-ink-3 lang-aware">
            <T v={engagementTypes.find((x) => x.id === type)!.blurb} />
          </p>
        </div>

        <div>
          <span className={labelCls}>
            <T v={{ en: "Mode", ta: "முறை" }} />
          </span>
          <div className="mt-2 flex gap-2">
            {(["in-person", "online"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={[
                  "flex-1 rounded-lg border px-4 py-2.5 text-[0.85rem] font-medium transition-all",
                  mode === m
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink-2 hover:border-line-2 hover:text-ink",
                ].join(" ")}
              >
                {m === "in-person"
                  ? t({ en: "In person", ta: "நேரில்" })
                  : t({ en: "Online", ta: "ஆன்லைன்" })}
              </button>
            ))}
          </div>
        </div>

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
            label={{ en: "Phone (optional)", ta: "தொலைபேசி (விருப்பம்)" }}
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
          label={{ en: "Expected audience (optional)", ta: "எதிர்பார்க்கும் பார்வையாளர்கள்" }}
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
            className={`${field} mt-2 resize-y`}
            placeholder="Theme, agenda, travel arrangements…"
          />
          {errors.message ? (
            <p className="mt-1.5 text-[0.75rem] text-ember">{errors.message}</p>
          ) : null}
        </div>

        {/* Honeypot — visually and programmatically hidden from people */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
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
          <p role="alert" className="rounded-lg bg-ember-soft px-4 py-3 text-[0.82rem] text-ember">
            {serverError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-paper transition-all duration-300 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <T v={{ en: "Sending…", ta: "அனுப்புகிறது…" }} />
          ) : (
            <>
              <T v={{ en: "Request this slot", ta: "இந்த நேரத்தைக் கோர" }} />
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
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
    </div>
  );
}

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
      <label
        htmlFor={id}
        className="block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-3"
      >
        <T v={label} />
        {required ? <span className="ml-1 text-ember">*</span> : null}
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
          "mt-2 w-full rounded-lg border bg-paper px-3.5 py-2.5 text-[0.9rem] text-ink placeholder:text-ink-3 transition-colors focus:outline-none",
          error ? "border-ember focus:border-ember" : "border-line focus:border-accent",
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
