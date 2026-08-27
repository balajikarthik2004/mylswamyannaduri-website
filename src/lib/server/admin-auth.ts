import "server-only";

import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/**
 * A single-operator session for the office console.
 *
 * There is one account, its credentials live in the environment, and the
 * session is a signed cookie rather than anything server-side — with one
 * operator there is no session table worth keeping, and a stateless token
 * survives a restart and a redeploy without a store behind it.
 *
 * The cookie carries `user.expiry` plus an HMAC over both. It is signed, not
 * encrypted: nothing secret is inside it, and the only claim being made is
 * "the holder knew the password at this time", which a signature is enough
 * to establish.
 */

const COOKIE = "office_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // one working day

/**
 * The signing secret.
 *
 * A random fallback keeps a misconfigured deployment from signing with a
 * predictable key — the failure mode becomes "sessions drop on restart",
 * which is noticed and fixed, rather than "anyone can forge a session",
 * which is not.
 */
function secret(): string {
  const configured = process.env.ADMIN_SECRET;
  if (configured && configured.length >= 16) return configured;
  globalThis.__officeFallbackSecret ??= randomBytes(32).toString("hex");
  return globalThis.__officeFallbackSecret;
}

declare global {
  var __officeFallbackSecret: string | undefined;
}

/** True when both credentials are present in the environment. */
export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD);
}

/** Constant-time compare that tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // Still burn a comparison so the mismatch isn't measurably faster.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function checkCredentials(user: string, password: string): boolean {
  if (!adminConfigured()) return false;
  const okUser = safeEqual(user, process.env.ADMIN_USER!);
  const okPass = safeEqual(password, process.env.ADMIN_PASSWORD!);
  // Both are evaluated regardless, so a wrong username and a wrong password
  // take the same time to reject.
  return okUser && okPass;
}

export async function startSession(user: string): Promise<void> {
  const expiry = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${Buffer.from(user).toString("base64url")}.${expiry}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** The signed-in operator, or null. */
export async function currentSession(): Promise<{ user: string } | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [userB64, expiryStr, mac] = parts;

  const payload = `${userB64}.${expiryStr}`;
  if (!safeEqual(mac, sign(payload))) return null;

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return null;

  return { user: Buffer.from(userB64, "base64url").toString() };
}

/* ── Login throttle ─────────────────────────────────────────────
   One account with a fixed password is exactly the shape brute force
   likes. Attempts are counted per source and the window is generous
   enough that a person fumbling their password never notices it. */

const attempts = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function loginThrottled(key: string): boolean {
  const now = Date.now();
  const hits = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  attempts.set(key, hits);
  return hits.length > MAX_ATTEMPTS;
}

export function clearThrottle(key: string): void {
  attempts.delete(key);
}
