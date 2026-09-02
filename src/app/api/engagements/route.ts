import { NextResponse, after } from "next/server";
import { append, bookedSessionsByDate } from "@/lib/server/booking-store";
import { sendRequestAlert } from "@/lib/server/booking-mail";
import { validateBooking, type BookingInput } from "@/lib/engagements";
import type { EngagementTypeId, SessionId } from "@/lib/data/engagements";

// Requests mutate a store, so this route is always dynamic.
export const dynamic = "force-dynamic";

/** Which sessions are already spoken for — used to grey out the calendar. */
export async function GET() {
  const booked = await bookedSessionsByDate();
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
    session: str(body.session) as SessionId,
    type: str(body.type) as EngagementTypeId,
    mode: str(body.mode) === "online" ? "online" : "in-person",
    durationMinutes: Number(body.durationMinutes) || 0,
    preferredTime: str(body.preferredTime) || undefined,
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
  const booked = await bookedSessionsByDate();
  const errors = validateBooking(input, booked);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const record = await append(input);

  /* Tell the office, after the response has gone out.
     Two reasons it is `after` and not awaited inline: the visitor should not
     wait on an SMTP handshake to see their reference, and a mail provider
     having a bad minute must not turn a request that was accepted and stored
     into a 500 the visitor reads as "it did not go through". `after` still
     runs on the platform's clock, so the send genuinely happens — a floating
     promise would be cut off when the invocation is frozen. */
  after(async () => {
    const alert = await sendRequestAlert(record).catch((err: unknown) => ({
      ok: false as const,
      provider: "none" as const,
      reason: err instanceof Error ? err.message : "Unknown mail error.",
    }));
    if (!alert.ok) {
      console.error(
        `[engagements] ${record.reference} stored, but the office alert did not go out: ${alert.reason}`,
      );
    }
  });

  return NextResponse.json(
    {
      ok: true,
      reference: record.reference,
      status: record.status,
      date: record.date,
      session: record.session,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
