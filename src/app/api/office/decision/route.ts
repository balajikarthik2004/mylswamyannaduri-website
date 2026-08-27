import { NextResponse } from "next/server";
import { currentSession } from "@/lib/server/admin-auth";
import { decide, markNotified } from "@/lib/server/booking-store";
import { sendDecisionMail } from "@/lib/server/booking-mail";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { reference?: unknown; decision?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const reference = typeof body.reference === "string" ? body.reference : "";
  const decision = body.decision === "approved" || body.decision === "rejected"
    ? body.decision
    : null;
  const note = typeof body.note === "string" ? body.note : undefined;

  if (!reference || !decision) {
    return NextResponse.json(
      { error: "A reference and a decision are required." },
      { status: 400 },
    );
  }

  // `decide` refuses a second decision on the same request, so a double-click
  // cannot send the requester two contradictory emails.
  const record = await decide(reference, decision, note);
  if (!record) {
    return NextResponse.json(
      { error: "That request is unknown, or has already been decided." },
      { status: 409 },
    );
  }

  /* The decision is already committed at this point. Mail is attempted after,
     and its failure is reported rather than thrown: an outbox problem must
     not roll back a decision the office has made, and the console needs to
     show which requesters still have to be told by hand. */
  const mail = await sendDecisionMail(record);
  await markNotified(reference, mail.ok, mail.ok ? undefined : mail.reason);

  return NextResponse.json({
    ok: true,
    reference,
    status: record.status,
    notified: mail.ok,
    ...(mail.ok ? { provider: mail.provider } : { notifyError: mail.reason }),
  });
}
