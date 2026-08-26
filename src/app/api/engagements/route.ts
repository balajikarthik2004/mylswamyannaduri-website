import { NextResponse } from "next/server";
import { append, bookedSlotsByDate } from "@/lib/server/booking-store";
import { validateBooking, type BookingInput } from "@/lib/engagements";
import type { EngagementTypeId } from "@/lib/data/engagements";

// Requests mutate a store, so this route is always dynamic.
export const dynamic = "force-dynamic";

/** Which slots are already spoken for — used to grey out the calendar. */
export async function GET() {
  const booked = await bookedSlotsByDate();
  return NextResponse.json(
    { booked },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Naive per-process throttle. Enough to blunt casual form hammering. */
const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function throttled(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  return hits.length > MAX_PER_WINDOW;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  // Honeypot: a real person never fills a field they cannot see.
  if (str(body.company)) {
    return NextResponse.json({ ok: true, reference: "MA-IGNORED" }, { status: 202 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (throttled(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  const input: BookingInput = {
    date: str(body.date),
    time: str(body.time),
    type: str(body.type) as EngagementTypeId,
    mode: str(body.mode) === "online" ? "online" : "in-person",
    name: str(body.name),
    email: str(body.email),
    phone: str(body.phone) || undefined,
    organisation: str(body.organisation),
    location: str(body.location) || undefined,
    audience: str(body.audience) || undefined,
    message: str(body.message) || undefined,
  };

  // Re-validate on the server: the client's copy of what's free may be stale,
  // and client-side checks are a convenience, never a guarantee.
  const booked = await bookedSlotsByDate();
  const errors = validateBooking(input, booked);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const record = await append(input);

  return NextResponse.json(
    {
      ok: true,
      reference: record.reference,
      status: record.status,
      date: record.date,
      time: record.time,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
