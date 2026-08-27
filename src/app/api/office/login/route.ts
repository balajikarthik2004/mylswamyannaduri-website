import { NextResponse } from "next/server";
import {
  adminConfigured,
  checkCredentials,
  clearThrottle,
  loginThrottled,
  startSession,
} from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "The console has no credentials configured on this server." },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (loginThrottled(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: { user?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const user = typeof body.user === "string" ? body.user : "";
  const password = typeof body.password === "string" ? body.password : "";

  // One message for both failure modes: naming which half was wrong tells an
  // attacker whether the username exists.
  if (!checkCredentials(user, password)) {
    return NextResponse.json(
      { error: "Those credentials were not recognised." },
      { status: 401 },
    );
  }

  clearThrottle(ip);
  await startSession(user);
  return NextResponse.json({ ok: true });
}
