import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { BookingInput } from "@/lib/engagements";

/**
 * A deliberately small persistence seam.
 *
 * Requests are appended to a JSON file under `.data/`, which is enough to run
 * the booking flow end to end locally. Point `readAll`/`append` at a database,
 * a CRM or an email provider and nothing else in the app has to change. On a
 * read-only filesystem the store degrades to in-memory rather than throwing,
 * so a request is never lost to a 500 in front of the visitor.
 */

export type BookingStatus = "pending" | "approved" | "rejected";

export type BookingRecord = BookingInput & {
  reference: string;
  status: BookingStatus;
  createdAt: string;
  /** Set when the office approves or rejects. */
  decidedAt?: string;
  /** Optional line from the office, included in the notification. */
  decisionNote?: string;
  /** Whether the requester was successfully told. */
  notified?: boolean;
  notifyError?: string;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "bookings.json");

let memory: BookingRecord[] = [];
let usingMemory = false;

async function load(): Promise<BookingRecord[]> {
  if (usingMemory) return memory;
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as BookingRecord[];
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    // Corrupt or unreadable — fall back rather than take the route down.
    usingMemory = true;
    return memory;
  }
}

async function persist(all: BookingRecord[]): Promise<void> {
  if (usingMemory) {
    memory = all;
    return;
  }
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf8");
  } catch {
    usingMemory = true;
    memory = all;
  }
}

export async function readAll(): Promise<BookingRecord[]> {
  return load();
}

/**
 * Sessions already spoken for, grouped by date, for greying out the calendar.
 *
 * A rejected request releases its half-day: the office turning something down
 * is exactly the moment that slot should become available to someone else.
 * Pending still blocks, so two people cannot queue against the same session.
 */
export async function bookedSessionsByDate(): Promise<Record<string, string[]>> {
  const all = await load();
  const out: Record<string, string[]> = {};
  for (const b of all) {
    if (b.status === "rejected") continue;
    (out[b.date] ??= []).push(b.session);
  }
  return out;
}

export function makeReference(date: string): string {
  const compact = date.replace(/-/g, "").slice(2);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MA-${compact}-${rand}`;
}

export async function append(input: BookingInput): Promise<BookingRecord> {
  const all = await load();
  const record: BookingRecord = {
    ...input,
    reference: makeReference(input.date),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  all.push(record);
  await persist(all);
  return record;
}

/** True when this half-day already has a live request against it. */
export async function isSessionTaken(date: string, session: string): Promise<boolean> {
  const all = await load();
  return all.some(
    (b) => b.date === date && b.session === session && b.status !== "rejected",
  );
}

/** One request by reference. */
export async function findByReference(
  reference: string,
): Promise<BookingRecord | undefined> {
  const all = await load();
  return all.find((b) => b.reference === reference);
}

/**
 * Record a decision. Returns the updated record, or null when the reference
 * is unknown or the request has already been decided — the office pressing
 * approve twice must not send a second email.
 */
export async function decide(
  reference: string,
  status: Exclude<BookingStatus, "pending">,
  note?: string,
): Promise<BookingRecord | null> {
  const all = await load();
  const record = all.find((b) => b.reference === reference);
  if (!record || record.status !== "pending") return null;

  record.status = status;
  record.decidedAt = new Date().toISOString();
  if (note?.trim()) record.decisionNote = note.trim();

  await persist(all);
  return record;
}

/** Note the outcome of the notification against the record. */
export async function markNotified(
  reference: string,
  notified: boolean,
  error?: string,
): Promise<void> {
  const all = await load();
  const record = all.find((b) => b.reference === reference);
  if (!record) return;
  record.notified = notified;
  if (error) record.notifyError = error;
  else delete record.notifyError;
  await persist(all);
}
