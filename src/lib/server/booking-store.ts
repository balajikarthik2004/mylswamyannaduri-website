import "server-only";

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
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
 *   1. Redis over the Upstash REST API  — `KV_REST_API_URL`/`KV_REST_API_TOKEN`
 *      or `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`. Plain `fetch`,
 *      no client library, so it works on every runtime.
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

export type StoreDriver = "redis" | "file" | "memory";

export type StoreHealth = {
  driver: StoreDriver;
  /** True when a record survives a restart and is visible to every instance. */
  durable: boolean;
  /** Where the records actually are, in one line, for the console. */
  location: string;
  /** Why a more durable driver was passed over, when one was. */
  degradedReason?: string;
};

/* ── Redis over the Upstash REST API ───────────────────────────
   One hash keyed by reference rather than one array under one key: a hash
   field is written independently, so two requests arriving together cannot
   overwrite each other the way a read-modify-write of a whole array does. */

const HASH_KEY = "annadurai:bookings";
const CLAIM_PREFIX = "annadurai:decided:";

type RedisConfig = { url: string; token: string };

function redisConfig(): RedisConfig | null {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

/** Run one or more commands down the REST pipeline. Throws on any error. */
async function redisPipeline(
  cfg: RedisConfig,
  commands: (string | number)[][],
): Promise<unknown[]> {
  const res = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
    // A hung store must not hold a request open until the platform kills it.
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(
      `Redis responded ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`,
    );
  }

  const body = (await res.json()) as
    | { error: string }
    | { result?: unknown; error?: string }[];

  if (!Array.isArray(body)) throw new Error(body.error ?? "Redis pipeline failed.");
  return body.map((entry) => {
    if (entry.error) throw new Error(entry.error);
    return entry.result;
  });
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
  | { kind: "redis"; cfg: RedisConfig; health: StoreHealth }
  | { kind: "file"; target: FileTarget; health: StoreHealth }
  | { kind: "memory"; health: StoreHealth };

let resolvedStore: Promise<Resolved> | null = null;

async function resolve(): Promise<Resolved> {
  return (resolvedStore ??= resolveOnce());
}

async function resolveOnce(): Promise<Resolved> {
  let degradedReason: string | undefined;

  const cfg = redisConfig();
  if (cfg) {
    try {
      await redisPipeline(cfg, [["PING"]]);
      return {
        kind: "redis",
        cfg,
        health: {
          driver: "redis",
          durable: true,
          location: `Redis · ${new URL(cfg.url).host}`,
        },
      };
    } catch (err) {
      degradedReason = `Redis is configured but unreachable — ${
        err instanceof Error ? err.message : "unknown error"
      }`;
      console.error(`[booking-store] ${degradedReason}`);
    }
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
    "No writable directory and no Redis configured — requests exist only in this process's memory and will be lost.";
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
   Redis needs no queue: each write there targets one hash field. */

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

  if (store.kind === "redis") {
    const [flat] = await redisPipeline(store.cfg, [["HGETALL", HASH_KEY]]);
    return parseHash(flat);
  }
  if (store.kind === "file") {
    return readFileRecords(store.target);
  }
  return [...memoryRecords()];
}

/** Upstash returns a hash as a flat [field, value, field, value] array. */
function parseHash(flat: unknown): BookingRecord[] {
  const out: BookingRecord[] = [];
  if (!Array.isArray(flat)) return out;
  for (let i = 1; i < flat.length; i += 2) {
    const raw = flat[i];
    if (typeof raw !== "string") continue;
    try {
      out.push(JSON.parse(raw) as BookingRecord);
    } catch {
      /* one unreadable field must not hide the rest of the queue */
    }
  }
  return out;
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
  if (store.kind === "redis") {
    const [raw] = await redisPipeline(store.cfg, [["HGET", HASH_KEY, reference]]);
    if (typeof raw !== "string") return undefined;
    try {
      return JSON.parse(raw) as BookingRecord;
    } catch {
      return undefined;
    }
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

  if (store.kind === "redis") {
    await redisPipeline(store.cfg, [
      ["HSET", HASH_KEY, record.reference, JSON.stringify(record)],
    ]);
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

  if (store.kind === "redis") {
    const [raw] = await redisPipeline(store.cfg, [["HGET", HASH_KEY, reference]]);
    if (typeof raw !== "string") return null;

    let record: BookingRecord;
    try {
      record = JSON.parse(raw) as BookingRecord;
    } catch {
      return null;
    }
    if (record.status !== "pending") return null;

    /* Two instances can hold the same pending record at the same instant, so
       "read, check, write" is not enough on its own. The claim key is set
       NX — only one caller gets it, and only that caller goes on to mail the
       requester. It expires so a crash between claim and write cannot wedge
       a request as undecidable forever. */
    const [claim] = await redisPipeline(store.cfg, [
      ["SET", `${CLAIM_PREFIX}${reference}`, status, "NX", "EX", 86400],
    ]);
    if (claim === null) return null;

    record.status = status;
    record.decidedAt = new Date().toISOString();
    if (note?.trim()) record.decisionNote = note.trim();

    try {
      await redisPipeline(store.cfg, [
        ["HSET", HASH_KEY, reference, JSON.stringify(record)],
      ]);
    } catch (err) {
      // The claim is only meaningful once the decision is stored. Release it,
      // or a failed write leaves the request permanently undecidable.
      await redisPipeline(store.cfg, [
        ["DEL", `${CLAIM_PREFIX}${reference}`],
      ]).catch(() => {});
      throw err;
    }
    return record;
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

  if (store.kind === "redis") {
    const [raw] = await redisPipeline(store.cfg, [["HGET", HASH_KEY, reference]]);
    if (typeof raw !== "string") return;
    let record: BookingRecord;
    try {
      record = JSON.parse(raw) as BookingRecord;
    } catch {
      return;
    }
    record.notified = notified;
    if (error) record.notifyError = error;
    else delete record.notifyError;
    await redisPipeline(store.cfg, [
      ["HSET", HASH_KEY, reference, JSON.stringify(record)],
    ]);
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
