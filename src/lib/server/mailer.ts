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
};

function fromAddress(): string {
  return (
    process.env.MAIL_FROM ??
    "Dr. Mylswamy Annadurai's Office <onboarding@resend.dev>"
  );
}

async function sendViaResend(mail: Mail): Promise<MailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      ...(mail.html ? { html: mail.html } : {}),
    }),
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

  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const info = await transport.sendMail({
    from: fromAddress(),
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    ...(mail.html ? { html: mail.html } : {}),
  });
  return { ok: true, provider: "smtp", id: info.messageId };
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
