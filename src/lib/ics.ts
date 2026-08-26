import { addMinutesToTime } from "@/lib/engagements";

/**
 * Minimal RFC 5545 builder. Times are written as local IST wall-clock with an
 * explicit VTIMEZONE, so the invite lands at the right hour in any client
 * regardless of where the recipient is.
 */

function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold long lines at 75 octets, as the spec requires. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest) parts.push(" " + rest);
  return parts.join("\r\n");
}

function stamp(dateKey: string, time: string): string {
  return `${dateKey.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

export type IcsEvent = {
  uid: string;
  dateKey: string;
  /** "HH:MM" local IST. Omit for an all-day entry. */
  time?: string;
  durationMinutes?: number;
  title: string;
  description?: string;
  location?: string;
  /** UTC timestamp for DTSTAMP, e.g. from `new Date()`. */
  createdAt: Date;
};

export function buildIcs(event: IcsEvent): string {
  const dtstamp =
    event.createdAt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dr Mylswamy Annadurai//Engagements//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Kolkata",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0530",
    "TZOFFSETTO:+0530",
    "TZNAME:IST",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${dtstamp}`,
  ];

  if (event.time) {
    const end = addMinutesToTime(event.time, event.durationMinutes ?? 60);
    lines.push(`DTSTART;TZID=Asia/Kolkata:${stamp(event.dateKey, event.time)}`);
    lines.push(`DTEND;TZID=Asia/Kolkata:${stamp(event.dateKey, end)}`);
  } else {
    const plain = event.dateKey.replace(/-/g, "");
    const next = new Date(event.dateKey);
    next.setDate(next.getDate() + 1);
    const endPlain = next.toISOString().slice(0, 10).replace(/-/g, "");
    lines.push(`DTSTART;VALUE=DATE:${plain}`);
    lines.push(`DTEND;VALUE=DATE:${endPlain}`);
  }

  lines.push(`SUMMARY:${esc(event.title)}`);
  if (event.description) lines.push(`DESCRIPTION:${esc(event.description)}`);
  if (event.location) lines.push(`LOCATION:${esc(event.location)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(fold).join("\r\n");
}

/** Trigger a download of an .ics file in the browser. */
export function downloadIcs(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
