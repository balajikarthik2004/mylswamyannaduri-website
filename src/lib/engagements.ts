import {
  BLACKOUT_DATES,
  BOOKING_HORIZON_MONTHS,
  DURATION_CHOICES,
  MIN_NOTICE_DAYS,
  WEEKDAY_SESSIONS,
  engagementTypes,
  publicEvents,
  sessions,
  type EngagementTypeId,
  type PublicEvent,
  type SessionId,
} from "@/lib/data/engagements";

/**
 * Dates are handled as plain `YYYY-MM-DD` keys throughout, never as Date
 * objects crossing a timezone boundary. Everything the visitor sees is IST,
 * which is the only timezone his diary is actually kept in.
 */

export type DayStatus = "past" | "notice" | "closed" | "blackout" | "booked" | "open";

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function addMonths(d: Date, n: number): Date {
  const next = new Date(d.getFullYear(), d.getMonth() + n, 1);
  return next;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Earliest date that satisfies the notice period. */
export function earliestBookable(): Date {
  return addDays(startOfToday(), MIN_NOTICE_DAYS);
}

/** Last date inside the booking horizon. */
export function latestBookable(): Date {
  const t = startOfToday();
  return new Date(t.getFullYear(), t.getMonth() + BOOKING_HORIZON_MONTHS, t.getDate());
}

/** Every public event touching a given date (multi-day events included). */
export function eventsOn(key: string): PublicEvent[] {
  return publicEvents.filter((e) => {
    if (!e.endDate) return e.date === key;
    return key >= e.date && key <= e.endDate;
  });
}

export function sessionsForDate(key: string): SessionId[] {
  return WEEKDAY_SESSIONS[fromKey(key).getDay()] ?? [];
}

export function sessionById(id: SessionId) {
  return sessions.find((s) => s.id === id);
}

/** Minutes past midnight, for comparing an "HH:MM" against a window. */
export function minutesOfDay(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function getDayStatus(
  key: string,
  bookedSessions: Record<string, string[]> = {},
): DayStatus {
  const date = fromKey(key);
  if (date < startOfToday()) return "past";
  if (eventsOn(key).length > 0) return "booked";
  if (BLACKOUT_DATES.includes(key)) return "blackout";
  if (sessionsForDate(key).length === 0) return "closed";
  if (date < earliestBookable()) return "notice";
  if (date > latestBookable()) return "closed";
  const taken = bookedSessions[key] ?? [];
  if (taken.length >= sessionsForDate(key).length) return "booked";
  return "open";
}

export function isSelectable(status: DayStatus): boolean {
  return status === "open";
}

/** The 6×7 grid of day keys for a month, padded with neighbouring days. */
export function monthGrid(year: number, month: number): { key: string; inMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const cells: { key: string; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startOffset + i);
    cells.push({ key: toKey(d), inMonth: d.getMonth() === month });
  }
  return cells;
}

export function durationFor(typeId: EngagementTypeId): number {
  return engagementTypes.find((t) => t.id === typeId)?.duration ?? 45;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Where an engagement ends, as a date key *and* a wall-clock time.
 *
 * `addMinutesToTime` wraps the clock at midnight but leaves the date where it
 * was, so anything running past midnight would report an end earlier than its
 * own start. Rolling the date alongside the clock keeps the pair coherent —
 * which matters the moment a time is handed to a calendar, where a backwards
 * end is not a cosmetic error but an invalid event.
 *
 * The day arithmetic goes through UTC so it can never be bent by the
 * viewer's own daylight-saving rules; only the calendar date is being
 * counted, never an instant.
 */
export function endDateTime(
  dateKey: string,
  time: string,
  minutes: number,
): { dateKey: string; time: string } {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);

  const total = h * 60 + mi + minutes;
  const dayShift = Math.floor(total / 1440);
  const rem = ((total % 1440) + 1440) % 1440;

  const rolled = new Date(Date.UTC(y, mo - 1, d + dayShift));
  const yy = rolled.getUTCFullYear();
  const mm = String(rolled.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(rolled.getUTCDate()).padStart(2, "0");

  return {
    dateKey: `${yy}-${mm}-${dd}`,
    time: `${String(Math.floor(rem / 60)).padStart(2, "0")}:${String(
      rem % 60,
    ).padStart(2, "0")}`,
  };
}

/**
 * Dates are formatted from our own tables, never `toLocaleDateString`.
 *
 * Node and the browser ship different ICU builds, so the same call can return
 * "12 Sep 2026" on the server and "12 Sept 2026" in Chrome. When that string
 * lands in an attribute (an `aria-label`, say) React reports a hydration
 * mismatch. Fixed tables render identically everywhere — and let us give Tamil
 * real month names rather than whatever `ta-IN` happens to support.
 */

export type DateLang = "en" | "ta";

const MONTHS_LONG: Record<DateLang, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July",
       "August", "September", "October", "November", "December"],
  ta: ["ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்", "ஜூலை",
       "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"],
};

const MONTHS_SHORT: Record<DateLang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ta: ["ஜன", "பிப்", "மார்", "ஏப்", "மே", "ஜூன்",
       "ஜூலை", "ஆக", "செப்", "அக்", "நவ", "டிச"],
};

const WEEKDAYS_LONG: Record<DateLang, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ta: ["ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி"],
};

export function formatMonthYear(d: Date, lang: DateLang = "en"): string {
  return `${MONTHS_LONG[lang][d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateLong(key: string, lang: DateLang = "en"): string {
  const d = fromKey(key);
  return `${WEEKDAYS_LONG[lang][d.getDay()]}, ${d.getDate()} ${
    MONTHS_LONG[lang][d.getMonth()]
  } ${d.getFullYear()}`;
}

export function formatDateShort(key: string, lang: DateLang = "en"): string {
  const d = fromKey(key);
  return `${d.getDate()} ${MONTHS_SHORT[lang][d.getMonth()]} ${d.getFullYear()}`;
}

/** Weekday + day + month, for calendar cell labels. */
export function formatDayLabel(key: string, lang: DateLang = "en"): string {
  const d = fromKey(key);
  return `${WEEKDAYS_LONG[lang][d.getDay()]}, ${d.getDate()} ${
    MONTHS_LONG[lang][d.getMonth()]
  }`;
}

export function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Validation shared by the form and the API route. */
export type BookingInput = {
  date: string;
  /** Half-day window the request is against. */
  session: SessionId;
  type: EngagementTypeId;
  mode: "in-person" | "online";
  /** How long the engagement should run, in minutes. */
  durationMinutes: number;
  /**
   * An exact start time, IST. Only meaningful online, where a call has to
   * begin at a stated minute; an in-person visit is settled with the office.
   */
  preferredTime?: string;
  name: string;
  email: string;
  phone?: string;
  organisation: string;
  location?: string;
  audience?: string;
  message?: string;
};

export function validateBooking(
  input: Partial<BookingInput>,
  bookedSessions: Record<string, string[]> = {},
): Record<string, string> {
  const errors: Record<string, string> = {};
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!input.date) errors.date = "Choose a date.";
  else {
    const status = getDayStatus(input.date, bookedSessions);
    if (status !== "open") errors.date = "That date is not open for requests.";
  }

  if (!input.session) errors.session = "Choose morning or afternoon.";
  else if (input.date && !sessionsForDate(input.date).includes(input.session)) {
    errors.session = "That session is not offered on this day.";
  } else if (input.date && (bookedSessions[input.date] ?? []).includes(input.session)) {
    errors.session = "That session has just been taken.";
  }

  if (!input.type || !engagementTypes.some((t) => t.id === input.type)) {
    errors.type = "Choose an engagement type.";
  }
  if (input.mode !== "in-person" && input.mode !== "online") {
    errors.mode = "Choose in person or online.";
  }

  if (!input.durationMinutes) errors.durationMinutes = "Choose how long it should run.";
  else if (!DURATION_CHOICES.includes(input.durationMinutes as never)) {
    errors.durationMinutes = "That duration is not offered.";
  }

  // Online calls state an exact start; it must land inside the session and
  // leave room for the duration that was asked for.
  if (input.mode === "online") {
    if (!input.preferredTime) {
      errors.preferredTime = "Give a start time for the call.";
    } else if (!/^\d{2}:\d{2}$/.test(input.preferredTime)) {
      errors.preferredTime = "Use a time like 10:30.";
    } else if (input.session) {
      const window = sessionById(input.session);
      const start = minutesOfDay(input.preferredTime);
      if (window) {
        const from = minutesOfDay(window.start);
        const to = minutesOfDay(window.end);
        if (start < from || start > to) {
          errors.preferredTime = `Pick a time between ${formatTime12(
            window.start,
          )} and ${formatTime12(window.end)}.`;
        } else if (start + (input.durationMinutes ?? 0) > to) {
          errors.preferredTime = `That runs past ${formatTime12(
            window.end,
          )} — start earlier or shorten it.`;
        }
      }
    }
  }

  if (!input.name?.trim()) errors.name = "Your name is required.";
  if (!input.email?.trim()) errors.email = "An email address is required.";
  else if (!emailRe.test(input.email.trim())) errors.email = "That email doesn't look right.";
  if (!input.organisation?.trim()) errors.organisation = "Tell us who you represent.";
  if (input.mode === "in-person" && !input.location?.trim()) {
    errors.location = "A venue or city is required for in-person events.";
  }
  if ((input.message?.length ?? 0) > 2000) errors.message = "Please keep this under 2000 characters.";

  return errors;
}
