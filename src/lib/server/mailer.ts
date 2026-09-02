import "server-only";

/**
 * Outbound mail, with the provider chosen by whatever the environment
 * actually has configured.
 *
 *   1. `RESEND_API_KEY`            → Resend, over its REST API
 *   2. `SMTP_HOST`/`USER`/`PASS`   → any SMTP server, via Nodemailer
 *   3. nothing                     → logged to the console, not sent
 *
 * Two providers rather than one because their trade-offs are opposite, and
 * which is "easier" depends on what you already own. Resend needs a verified
 * domain before it will send to arbitrary recipients — until then it only
 * delivers to the account holder's own address, which is useless for
 * notifying a requester. Gmail SMTP with an app password sends to anyone
 * immediately but is rate-limited and ties the mail to a personal account.
 *
 * The third case matters as much as the other two: a missing key must never
 * take down the approve/reject flow. The decision is recorded either way and
 * the caller is told the mail did not go out, rather than the request
 * failing halfway through.
 */

export type MailResult =
  | { ok: true; provider: "resend" | "smtp"; id?: string }
  | { ok: false; provider: "none"; reason: string };

export type Mail = {
  to: string;
  subject: string;
  /** Plain text is always sent; HTML is layered on when supplied. */
  text: string;
  html?: string;
  replyTo?: string;
};

function fromAddress(): string {
  return (
    process.env.MAIL_FROM ??
    "Dr. Mylswamy Annadurai's Office <onboarding@resend.dev>"
  );
}

/** Strip a display name: `Office <a@b.c>` → `a@b.c`. */
function bareAddress(value: string): string {
  return value.match(/<([^>]+)>/)?.[1]?.trim() ?? value.trim();
}

/**
 * Where a new request is announced.
 *
 * `OFFICE_EMAIL` takes precedence and may list several addresses. Falling back
 * to the send-from address means the office is told even on a deployment where
 * nobody thought to set the variable — which is the whole point of the alert.
 */
export function officeRecipients(): string[] {
  const configured = process.env.OFFICE_EMAIL ?? process.env.ADMIN_EMAIL ?? "";
  const list = configured
    .split(",")
    .map((s) => bareAddress(s))
    .filter(Boolean);
  if (list.length > 0) return list;
  const fallback = bareAddress(fromAddress());
  return fallback.includes("@") ? [fallback] : [];
}

/**
 * A numeric setting, or the default.
 *
 * `??` does not catch an empty string, and an env file that documents a
 * variable by naming it with no value is the normal case. `Number("")` is 0 —
 * a zero timeout aborts every send before it starts, and port 0 connects to
 * nothing.
 */
function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Outbound calls get an explicit deadline.
 *
 * A serverless platform kills a function at its own timeout, and an SMTP
 * connection to a blocked port stalls for far longer than that. Without a
 * deadline the visitor's request dies with the function and the store never
 * learns the outcome; with one, delivery fails fast, is recorded, and the
 * office sees "not emailed" against the record.
 */
const OUTBOUND_TIMEOUT_MS = positiveInt(process.env.MAIL_TIMEOUT_MS, 12000);

async function sendViaResend(mail: Mail): Promise<MailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: mail.to.split(",").map((s) => s.trim()).filter(Boolean),
      subject: mail.subject,
      text: mail.text,
      ...(mail.html ? { html: mail.html } : {}),
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(OUTBOUND_TIMEOUT_MS),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend responded ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: true, provider: "resend", id: data.id };
}

async function sendViaSmtp(mail: Mail): Promise<MailResult> {
  // Imported lazily so the module is only pulled in when SMTP is the chosen
  // provider — it is never needed on the Resend or console paths.
  const nodemailer = (await import("nodemailer")).default;

  const port = positiveInt(process.env.SMTP_PORT, 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // All three, not just one: a host that drops the SYN, a host that accepts
    // the socket and never greets, and a host that greets and then stalls
    // mid-command are three different hangs, and only `connectionTimeout`
    // covers the first.
    connectionTimeout: OUTBOUND_TIMEOUT_MS,
    greetingTimeout: OUTBOUND_TIMEOUT_MS,
    socketTimeout: OUTBOUND_TIMEOUT_MS,
  });

  try {
    const info = await transport.sendMail({
      from: fromAddress(),
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      ...(mail.html ? { html: mail.html } : {}),
      ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
    });
    return { ok: true, provider: "smtp", id: info.messageId };
  } finally {
    // Serverless invocations are not long-lived; a pooled socket left open
    // keeps the function alive past its useful work.
    transport.close();
  }
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  try {
    if (process.env.RESEND_API_KEY) return await sendViaResend(mail);
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return await sendViaSmtp(mail);
    }
    // No provider configured. Say so loudly in the log, quietly to the caller.
    console.warn(
      `[mailer] No provider configured — mail to ${mail.to} was not sent.\n` +
        `  Subject: ${mail.subject}\n` +
        `${mail.text.replace(/^/gm, "  | ")}`,
    );
    return { ok: false, provider: "none", reason: "No mail provider configured." };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unknown mail error.";
    console.error(`[mailer] Delivery to ${mail.to} failed: ${reason}`);
    return { ok: false, provider: "none", reason };
  }
}

/** Which provider a request would use right now, for the admin banner. */
export function mailProvider(): "resend" | "smtp" | "none" {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return "smtp";
  }
  return "none";
}
