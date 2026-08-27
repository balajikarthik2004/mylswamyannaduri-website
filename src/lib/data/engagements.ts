import type { L } from "@/lib/i18n";

/* ── Engagement types a requester can ask for ──────────────── */

export type EngagementTypeId =
  | "keynote"
  | "outreach"
  | "advisory"
  | "panel"
  | "press";

export type EngagementType = {
  id: EngagementTypeId;
  label: L;
  blurb: L;
  /** Minutes. Drives the slot length and the calendar invite. */
  duration: number;
};

export const engagementTypes: EngagementType[] = [
  {
    id: "keynote",
    label: { en: "Keynote / Guest lecture", ta: "சிறப்புரை / விருந்தினர் சொற்பொழிவு" },
    blurb: {
      en: "Conferences, convocations and corporate gatherings.",
      ta: "மாநாடுகள், பட்டமளிப்பு விழாக்கள் மற்றும் நிறுவன கூட்டங்கள்.",
    },
    duration: 60,
  },
  {
    id: "outreach",
    label: { en: "School & college outreach", ta: "பள்ளி & கல்லூரி நிகழ்ச்சி" },
    blurb: {
      en: "Student sessions — his standing priority through the holidays.",
      ta: "மாணவர் அமர்வுகள் — விடுமுறை நாட்களில் அவரது முன்னுரிமை.",
    },
    duration: 45,
  },
  {
    id: "advisory",
    label: { en: "Advisory / Board consultation", ta: "ஆலோசனை / இயக்குநர் குழு" },
    blurb: {
      en: "Space and deep-tech ventures, governing councils.",
      ta: "விண்வெளி மற்றும் ஆழ்-தொழில்நுட்ப நிறுவனங்கள், நிர்வாகக் குழுக்கள்.",
    },
    duration: 60,
  },
  {
    id: "panel",
    label: { en: "Panel discussion", ta: "கலந்துரையாடல்" },
    blurb: {
      en: "Moderated panels and policy round tables.",
      ta: "நடுவர் தலைமையிலான கலந்துரையாடல்கள் மற்றும் கொள்கை ஆய்வுக் கூட்டங்கள்.",
    },
    duration: 45,
  },
  {
    id: "press",
    label: { en: "Press / media interview", ta: "பத்திரிகை / ஊடக நேர்காணல்" },
    blurb: {
      en: "Interviews, documentaries and mission commentary.",
      ta: "நேர்காணல்கள், ஆவணப்படங்கள் மற்றும் பயண விளக்கவுரை.",
    },
    duration: 30,
  },
];

/* ── Availability rules ────────────────────────────────────── */

/** All times are Indian Standard Time. */
export const TIMEZONE = "Asia/Kolkata";
export const TIMEZONE_LABEL = "IST (UTC+5:30)";

/** Minimum notice before a requested date, in days. */
export const MIN_NOTICE_DAYS = 5;
/** How far ahead the calendar will accept requests, in months. */
export const BOOKING_HORIZON_MONTHS = 6;

/* ── Sessions ──────────────────────────────────────────────────
   Requests are made against a half-day rather than a fixed start
   time. Pinning a visitor to "11:30" implied a precision his diary
   does not have — the office settles the exact hour when it
   confirms. A morning or an afternoon is the real unit. */

export type SessionId = "morning" | "afternoon";

export type Session = {
  id: SessionId;
  label: L;
  /** Bounds of the window, IST, for display and for validating a
      preferred time against it. */
  start: string;
  end: string;
};

export const sessions: Session[] = [
  { id: "morning", label: { en: "Morning", ta: "காலை" }, start: "09:30", end: "13:00" },
  {
    id: "afternoon",
    label: { en: "Afternoon", ta: "பிற்பகல்" },
    start: "14:00",
    end: "18:00",
  },
];

/** Sessions offered per weekday (0 = Sunday). Empty means unavailable. */
export const WEEKDAY_SESSIONS: Record<number, SessionId[]> = {
  0: [], // Sunday — kept clear
  1: ["morning", "afternoon"],
  2: ["morning", "afternoon"],
  3: ["morning", "afternoon"],
  4: ["morning", "afternoon"],
  5: ["morning", "afternoon"],
  6: ["morning"], // Saturday — outreach mornings
};

/* ── How long it runs ──────────────────────────────────────── */

export const DURATION_CHOICES = [30, 45, 60, 90, 120] as const;
export type DurationMinutes = (typeof DURATION_CHOICES)[number];

/** "90" → "1 hr 30 min", for a label that reads the way people speak. */
export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return h === 1 ? "1 hour" : `${h} hours`;
  return `${h} hr ${m} min`;
}

/** Dates held back for travel, family or standing commitments. */
export const BLACKOUT_DATES: string[] = [
  "2026-10-02",
  "2026-10-20",
  "2026-10-21",
  "2026-11-14",
  "2026-12-25",
  "2027-01-01",
  "2027-01-14",
  "2027-01-15",
  "2027-01-26",
];

/* ── Public engagements ────────────────────────────────────── */

export type PublicEvent = {
  /** ISO date, or the first day for a multi-day event. */
  date: string;
  endDate?: string;
  time?: string;
  title: string;
  location?: string;
  mode: "in-person" | "online";
  kind: EngagementTypeId | "board" | "review";
};

/**
 * Taken from the "Upcoming Events" board on mylswamyannadurai.in, plus the
 * standing commitments named in his current appointments.
 */
export const publicEvents: PublicEvent[] = [
  {
    date: "2026-06-14",
    time: "16:00",
    title: "Meeting, ZERO MOQ Team",
    mode: "online",
    kind: "advisory",
  },
  {
    date: "2026-06-15",
    title: "Atmanirbhar Factories Review, IRIM G Meet — Part 1",
    mode: "online",
    kind: "review",
  },
  {
    date: "2026-06-17",
    title: "HONC Site Visits and Status Review",
    mode: "in-person",
    kind: "review",
  },
  {
    date: "2026-06-19",
    title: "GEM Techno Surge Conference",
    location: "Chennai",
    mode: "in-person",
    kind: "keynote",
  },
  {
    date: "2026-06-20",
    title: "HONC US Shareholders Online Meet",
    mode: "online",
    kind: "board",
  },
  {
    date: "2026-06-24",
    title: "Atmanirbhar Factories Review, IRIM G Meet — Part 2",
    mode: "online",
    kind: "review",
  },
  {
    date: "2026-07-02",
    time: "11:00",
    title: "KAYNES TECH Board Meet",
    mode: "online",
    kind: "board",
  },
  {
    date: "2026-07-17",
    endDate: "2026-07-18",
    title: "GENIE CXO & CFO Meets",
    location: "Hotel Taj, MG Road, Bangalore",
    mode: "in-person",
    kind: "panel",
  },
  {
    date: "2026-08-08",
    title: "Global Education Conclave",
    location: "Hotel Hilton, Chennai",
    mode: "in-person",
    kind: "keynote",
  },
  {
    date: "2026-08-23",
    title: "Katran Function",
    location: "Coimbatore",
    mode: "in-person",
    kind: "keynote",
  },
  {
    date: "2026-09-12",
    title: "Sectoral Innovation Programs Review, Bangalore Bio-Innovation Centre",
    location: "Bangalore",
    mode: "in-person",
    kind: "review",
  },
  {
    date: "2026-09-25",
    title: "School Curriculum Design Committee, Tamil Nadu",
    location: "Chennai",
    mode: "in-person",
    kind: "board",
  },
  {
    date: "2026-10-09",
    title: "Governing Council, GM University",
    location: "Davangere",
    mode: "in-person",
    kind: "board",
  },
  {
    date: "2026-11-06",
    title: "Cosmochute Technical Review",
    location: "Ahmedabad",
    mode: "in-person",
    kind: "review",
  },
];

export const eventKindLabels: Record<PublicEvent["kind"], L> = {
  keynote: { en: "Keynote", ta: "சிறப்புரை" },
  outreach: { en: "Outreach", ta: "மாணவர் நிகழ்ச்சி" },
  advisory: { en: "Advisory", ta: "ஆலோசனை" },
  panel: { en: "Panel", ta: "கலந்துரையாடல்" },
  press: { en: "Press", ta: "பத்திரிகை" },
  board: { en: "Board", ta: "இயக்குநர் குழு" },
  review: { en: "Review", ta: "மதிப்பாய்வு" },
};
