import "server-only";

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { MongoClient, type Db } from "mongodb";
import type { BookingInput } from "@/lib/engagements";

/**
 * Where engagement requests live.
 *
 * The original store wrote a JSON file under `process.cwd()/.data`, which is
 * correct on a machine with a disk and silently wrong everywhere else. On a
 * serverless host the deployment directory is read-only, so the write threw,
 * the store fell back to a per-process array, and every request vanished the
 * moment the instance recycled — or was simply invisible to the instance that
 * happened to serve `/office`. That failure was completely silent, which is
 * what made it hard to see: the visitor got a reference number for a booking
 * that no longer existed anywhere.
 *
 * So the backing store is now chosen by probing what the environment can
 * actually do, in descending order of durability:
 *
 *   1. MongoDB Atlas — `MONGODB_URI`.
 *      Requires the mongodb driver and connects to the cluster.
 *   2. A JSON file — `BOOKINGS_DATA_DIR`, else `./.data`, else the OS temp
 *      directory. Writes are atomic and serialized (see below).
 *   3. Process memory — last resort only.
 *
 * Whichever it picks is reported by `describeStore()` and shown in the office
 * console, because an operator has to be able to tell "no requests yet" from
 * "requests are being thrown away".
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

export type StoreDriver = "mongodb" | "file" | "memory";

export type StoreHealth = {
  driver: StoreDriver;
  /** True when a record survives a restart and is visible to every instance. */
  durable: boolean;
  /** Where the records actually are, in one line, for the console. */
  location: string;
  /** Why a more durable driver was passed over, when one was. */
  degradedReason?: string;
};

/* ── MongoDB Atlas ─────────────────────────────────────────── */

let cachedClient: MongoClient | null = null;

async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  return cachedClient.db();
}

/* ── File store ────────────────────────────────────────────────
   Two defects made the local file "sometimes stop working":

   1. `writeFile` truncates in place. Interrupted — a dev-server restart lands
      mid-flush — it leaves half a JSON document, and the *next* read threw,
      dropped to an empty in-memory array and lost the lot. Writes now go to a
      sibling temp file and are moved into place with `rename`, which is
      atomic: a reader sees either the whole old file or the whole new one.

   2. Every mutation was read-modify-write with nothing serializing it. Two
      requests landing together both read the same array, both appended, and
      the second write erased the first. All mutations now queue behind one
      promise chain.

   A file that is corrupt despite this is moved aside rather than deleted, and
   the store says so instead of pretending the queue was always empty. */

const FILE_NAME = "bookings.json";

type FileTarget = { dir: string; file: string; durable: boolean };

async function probeDir(dir: string): Promise<boolean> {
  try {
    await fs.mkdir(dir, { recursive: true });
    const probe = path.join(dir, `.write-probe-${process.pid}`);
    await fs.writeFile(probe, "ok", "utf8");
    await fs.rm(probe, { force: true });
    return true;
  } catch {
    return false;
  }
}

async function resolveFileTarget(): Promise<FileTarget | null> {
  const candidates: { dir: string; durable: boolean }[] = [
    ...(process.env.BOOKINGS_DATA_DIR
      ? [{ dir: path.resolve(process.env.BOOKINGS_DATA_DIR), durable: true }]
      : []),
    { dir: path.join(process.cwd(), ".data"), durable: true },
    // Writable on nearly every serverless host, but wiped with the instance —
    // better than losing a request inside a single visit, never a home for one.
    { dir: path.join(os.tmpdir(), "annadurai-bookings"), durable: false },
  ];

  for (const c of candidates) {
    if (await probeDir(c.dir)) {
      return { dir: c.dir, file: path.join(c.dir, FILE_NAME), durable: c.durable };
    }
  }
  return null;
}

async function readFileRecords(target: FileTarget): Promise<BookingRecord[]> {
  let raw: string;
  try {
    raw = await fs.readFile(target.file, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as BookingRecord[]) : [];
  } catch {
    // Quarantine rather than overwrite: the bytes may still be salvageable by
    // hand, and silently starting from empty is how a queue disappears.
    const quarantine = `${target.file}.corrupt-${Date.now()}`;
    await fs.rename(target.file, quarantine).catch(() => {});
    console.error(
      `[booking-store] ${target.file} did not parse. Moved to ${quarantine}; starting a fresh file.`,
    );
    return [];
  }
}

async function writeFileRecords(
  target: FileTarget,
  all: BookingRecord[],
): Promise<void> {
  const tmp = path.join(target.dir, `.${FILE_NAME}.${process.pid}.tmp`);
  await fs.writeFile(tmp, JSON.stringify(all, null, 2), "utf8");
  await fs.rename(tmp, target.file);
}

/* ── Memory store ──────────────────────────────────────────────
   Hung off `globalThis` so the dev server's module reloads do not clear it. */

declare global {
  var __annaduraiBookings: BookingRecord[] | undefined;
}

function memoryRecords(): BookingRecord[] {
  return (globalThis.__annaduraiBookings ??= []);
}

/* ── Driver resolution ─────────────────────────────────────────
   Resolved once per process and cached as a promise, so concurrent callers
   share one probe rather than each running their own. */

type Resolved =
  | { kind: "mongodb"; db: Db; health: StoreHealth }
  | { kind: "file"; target: FileTarget; health: StoreHealth }
  | { kind: "memory"; health: StoreHealth };

let resolvedStore: Promise<Resolved> | null = null;

async function resolve(): Promise<Resolved> {
  return (resolvedStore ??= resolveOnce());
}

async function resolveOnce(): Promise<Resolved> {
  let degradedReason: string | undefined;

  try {
    const db = await getMongoDb();
    if (db) {
      await db.command({ ping: 1 });
      return {
        kind: "mongodb",
        db,
        health: {
          driver: "mongodb",
          durable: true,
          location: `MongoDB Atlas`,
        },
      };
    }
  } catch (err) {
    degradedReason = `MongoDB is configured but unreachable — ${
      err instanceof Error ? err.message : "unknown error"
    }`;
    console.error(`[booking-store] ${degradedReason}`);
  }

  const target = await resolveFileTarget();
  if (target) {
    return {
      kind: "file",
      target,
      health: {
        driver: "file",
        durable: target.durable,
        location: target.file,
        degradedReason:
          degradedReason ??
          (target.durable
            ? undefined
            : "The project directory is read-only, so requests are being written to a temporary directory that is wiped when the server instance recycles."),
      },
    };
  }

  const reason =
    degradedReason ??
    "No writable directory and no MongoDB configured — requests exist only in this process's memory and will be lost.";
  console.error(`[booking-store] ${reason}`);
  return {
    kind: "memory",
    health: { driver: "memory", durable: false, location: "process memory", degradedReason: reason },
  };
}

/** What the store is doing right now — surfaced in the office console. */
export async function describeStore(): Promise<StoreHealth> {
  return (await resolve()).health;
}

/* ── Mutation queue ────────────────────────────────────────────
   Serializes file and memory read-modify-write cycles within this process.
   Redis/MongoDB needs no queue: each write there targets one document. */

let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.then(work, work);
  // Keep one rejection from poisoning every later caller's turn.
  queue = next.catch(() => {});
  return next;
}

/* ── Reads ─────────────────────────────────────────────────── */

export async function readAll(): Promise<BookingRecord[]> {
  const store = await resolve();

  if (store.kind === "mongodb") {
    const docs = await store.db.collection("bookings").find({}).toArray();
    return docs.map((doc) => {
      const { _id, ...rest } = doc;
      return rest as unknown as BookingRecord;
    });
  }
  if (store.kind === "file") {
    return readFileRecords(store.target);
  }
  return [...memoryRecords()];
}

/**
 * Sessions already spoken for, grouped by date, for greying out the calendar.
 *
 * A rejected request releases its half-day: the office turning something down
 * is exactly the moment that slot should become available to someone else.
 * Pending still blocks, so two people cannot queue against the same session.
 */
export async function bookedSessionsByDate(): Promise<Record<string, string[]>> {
  const all = await readAll();
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

/** True when this half-day already has a live request against it. */
export async function isSessionTaken(date: string, session: string): Promise<boolean> {
  const all = await readAll();
  return all.some(
    (b) => b.date === date && b.session === session && b.status !== "rejected",
  );
}

/** One request by reference. */
export async function findByReference(
  reference: string,
): Promise<BookingRecord | undefined> {
  const store = await resolve();
  if (store.kind === "mongodb") {
    const doc = await store.db.collection("bookings").findOne({ reference });
    if (!doc) return undefined;
    const { _id, ...rest } = doc;
    return rest as unknown as BookingRecord;
  }
  const all = await readAll();
  return all.find((b) => b.reference === reference);
}

/* ── Writes ────────────────────────────────────────────────── */

export async function append(input: BookingInput): Promise<BookingRecord> {
  const record: BookingRecord = {
    ...input,
    reference: makeReference(input.date),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const store = await resolve();

  if (store.kind === "mongodb") {
    await store.db.collection("bookings").insertOne({ ...record });
    return record;
  }

  return serialize(async () => {
    if (store.kind === "file") {
      const all = await readFileRecords(store.target);
      all.push(record);
      await writeFileRecords(store.target, all);
    } else {
      memoryRecords().push(record);
    }
    return record;
  });
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
  const store = await resolve();

  if (store.kind === "mongodb") {
    const collection = store.db.collection("bookings");
    const updates: Partial<BookingRecord> = {
      status,
      decidedAt: new Date().toISOString(),
    };
    if (note?.trim()) updates.decisionNote = note.trim();

    const result = await collection.findOneAndUpdate(
      { reference, status: "pending" }, // Only update if still pending
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) return null;
    const { _id, ...rest } = result;
    return rest as unknown as BookingRecord;
  }

  return serialize(async () => {
    const all =
      store.kind === "file" ? await readFileRecords(store.target) : memoryRecords();
    const record = all.find((b) => b.reference === reference);
    if (!record || record.status !== "pending") return null;

    record.status = status;
    record.decidedAt = new Date().toISOString();
    if (note?.trim()) record.decisionNote = note.trim();

    if (store.kind === "file") await writeFileRecords(store.target, all);
    return record;
  });
}

/** Note the outcome of the notification against the record. */
export async function markNotified(
  reference: string,
  notified: boolean,
  error?: string,
): Promise<void> {
  const store = await resolve();

  if (store.kind === "mongodb") {
    const updateQuery: any = { $set: { notified } };
    if (error) updateQuery.$set.notifyError = error;
    else updateQuery.$unset = { notifyError: "" };

    await store.db.collection("bookings").updateOne({ reference }, updateQuery);
    return;
  }

  await serialize(async () => {
    const all =
      store.kind === "file" ? await readFileRecords(store.target) : memoryRecords();
    const record = all.find((b) => b.reference === reference);
    if (!record) return;
    record.notified = notified;
    if (error) record.notifyError = error;
    else delete record.notifyError;
    if (store.kind === "file") await writeFileRecords(store.target, all);
  });
}
