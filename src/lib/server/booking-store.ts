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

export type BookingRecord = BookingInput & {
  reference: string;
  status: "pending";
  createdAt: string;
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

/** Slots already requested, grouped by date, for greying out the calendar. */
export async function bookedSlotsByDate(): Promise<Record<string, string[]>> {
  const all = await load();
  const out: Record<string, string[]> = {};
  for (const b of all) {
    (out[b.date] ??= []).push(b.time);
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

/** True when this exact slot already has a request against it. */
export async function isSlotTaken(date: string, time: string): Promise<boolean> {
  const all = await load();
  return all.some((b) => b.date === date && b.time === time);
}
