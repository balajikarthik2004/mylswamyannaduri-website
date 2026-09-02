import "server-only";

import {
  officeRecipients,
  sendMail,
  type MailResult,
} from "@/lib/server/mailer";
import type { BookingRecord } from "@/lib/server/booking-store";
import { durationLabel, engagementTypes, sessions } from "@/lib/data/engagements";
import { addMinutesToTime, formatDateLong, formatTime12 } from "@/lib/engagements";

/**
 * The two notes the office sends a requester.
 *
 * Both are written as plain text first and given an HTML skin second, so the
 * message reads correctly in a client that refuses HTML — a confirmation
 * nobody can read is worse than no confirmation. The HTML is deliberately
 * table-free and inline-styled, which is the only thing mail clients agree on.
 */

/**
 * Every visitor-supplied value is escaped before it reaches the HTML body.
 * A name or a note is free text from a public form; unescaped, an angle
 * bracket in it either breaks the layout or injects markup into a message
 * the office reads and trusts.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function label(record: BookingRecord): string {
  return (
    engagementTypes.find((t) => t.id === record.type)?.label.en ?? "Engagement"
  );
}

function whenLine(record: BookingRecord): string {
  const win = sessions.find((s) => s.id === record.session);
  const day = formatDateLong(record.date, "en");
  if (record.preferredTime) {
    const end = addMinutesToTime(record.preferredTime, record.durationMinutes);
    return `${day}, ${formatTime12(record.preferredTime)} – ${formatTime12(end)} IST`;
  }
  const window = win
    ? ` (${win.label.en}, ${formatTime12(win.start)}–${formatTime12(win.end)} IST)`
    : "";
  return `${day}${window}`;
}

function summaryLines(record: BookingRecord): string[] {
  return [
    `Reference:  ${record.reference}`,
    `When:       ${whenLine(record)}`,
    `Runs for:   ${durationLabel(record.durationMinutes)}`,
    `Format:     ${label(record)}`,
    `Mode:       ${record.mode === "online" ? "Online" : record.location || "In person"}`,
  ];
}

function shell(heading: string, accent: string, body: string): string {
  return `<div style="margin:0;padding:32px 16px;background:#fdfcf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#10131a;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e8e2d6;border-radius:14px;overflow:hidden;">
    <div style="padding:24px 28px;background:#10131a;color:#fdfcf9;">
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(253,252,249,.55);">Dr. Mylswamy Annadurai</div>
      <div style="margin-top:8px;font-size:22px;font-weight:600;color:${accent};">${heading}</div>
    </div>
    <div style="padding:26px 28px;font-size:15px;line-height:1.65;color:#444c59;">
      ${body}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #e8e2d6;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#7d8593;">
      This message was sent from his office
    </div>
  </div>
</div>`;
}

function detailBlock(record: BookingRecord): string {
  const rows = summaryLines(record)
    .map((line) => {
      const [k, ...rest] = line.split(":");
      return `<tr>
        <td style="padding:6px 14px 6px 0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#7d8593;white-space:nowrap;vertical-align:top;">${escapeHtml(k.trim())}</td>
        <td style="padding:6px 0;font-size:14px;color:#10131a;">${escapeHtml(rest.join(":").trim())}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;border-top:1px solid #e8e2d6;border-bottom:1px solid #e8e2d6;width:100%;">${rows}</table>`;
}

/* ── The alert the office gets when a request arrives ──────────
   A request used to exist only in the store, so the office learned about it
   by remembering to open the console. That is also the single point of
   failure this whole flow had: if the store lost a record — as it did on a
   read-only filesystem — nothing anywhere had ever named it. This mail is
   the second copy. It carries every field an operator needs to act on the
   request even if the console is empty, and `Reply-To` is the requester, so
   answering it by hand goes to the right person. */
export async function sendRequestAlert(record: BookingRecord): Promise<MailResult> {
  const to = officeRecipients();
  if (to.length === 0) {
    return { ok: false, provider: "none", reason: "No office recipient configured." };
  }

  const console_ = process.env.SITE_URL
    ? `${process.env.SITE_URL.replace(/\/+$/, "")}/office`
    : "/office";

  const detail = [
    `Reference:    ${record.reference}`,
    `When:         ${whenLine(record)}`,
    `Runs for:     ${durationLabel(record.durationMinutes)}`,
    `Format:       ${label(record)}`,
    `Mode:         ${record.mode === "online" ? "Online" : record.location || "In person"}`,
    "",
    `Name:         ${record.name}`,
    `Organisation: ${record.organisation}`,
    `Email:        ${record.email}`,
    ...(record.phone ? [`Phone:        ${record.phone}`] : []),
    ...(record.audience ? [`Audience:     ${record.audience}`] : []),
  ];

  const text = [
    `A new engagement request has come in.`,
    "",
    ...detail,
    ...(record.message ? ["", "Message:", record.message] : []),
    "",
    `Approve or decline it in the console: ${console_}`,
  ].join("\n");

  const html = shell(
    "A new engagement request",
    "#e6c877",
    [
      `<p style="margin:0 0 4px;">A request has come in and is waiting for a decision.</p>`,
      detailBlock(record),
      record.message
        ? `<p style="margin:0 0 16px;padding:12px 14px;background:#f7f4ed;border-left:2px solid #d5ceba;font-size:14px;color:#10131a;white-space:pre-wrap;">${escapeHtml(record.message)}</p>`
        : "",
      `<p style="margin:0;font-size:14px;">
         <strong>${escapeHtml(record.name)}</strong> · ${escapeHtml(record.organisation)}<br/>
         <a href="mailto:${encodeURIComponent(record.email)}" style="color:#16305f;">${escapeHtml(record.email)}</a>${
           record.phone ? ` · ${escapeHtml(record.phone)}` : ""
         }
       </p>`,
      `<p style="margin:20px 0 0;"><a href="${console_}" style="display:inline-block;padding:11px 20px;border-radius:999px;background:#10131a;color:#fdfcf9;text-decoration:none;font-size:14px;">Open the console</a></p>`,
    ].join("\n"),
  );

  return sendMail({
    to: to.join(","),
    subject: `New request — ${label(record)}, ${formatDateLong(record.date, "en")} [${record.reference}]`,
    text,
    html,
    // Answering the alert should reach the requester, not the office itself.
    replyTo: record.email,
  });
}

export async function sendDecisionMail(record: BookingRecord): Promise<MailResult> {
  const approved = record.status === "approved";
  const note = record.decisionNote;

  const subject = approved
    ? `Confirmed — ${label(record)} on ${formatDateLong(record.date, "en")} [${record.reference}]`
    : `Unable to confirm — ${formatDateLong(record.date, "en")} [${record.reference}]`;

  const opening = approved
    ? `Dear ${record.name},\n\nDr. Annadurai's office is glad to confirm your request. The session below is now held in his diary.`
    : `Dear ${record.name},\n\nThank you for your interest in hosting Dr. Annadurai. His office is sorry to say it cannot take up this request — the date could not be accommodated against his existing commitments.`;

  const closing = approved
    ? `The exact hour, agenda and any travel arrangements will be settled with you directly from this address.\n\nWith regards,\nOffice of Dr. Mylswamy Annadurai`
    : `Do please write again for another date — his diary opens further ahead each month, and student and outreach events remain a standing priority.\n\nWith regards,\nOffice of Dr. Mylswamy Annadurai`;

  const text = [
    opening,
    "",
    ...summaryLines(record),
    ...(note ? ["", `A note from the office: ${note}`] : []),
    "",
    closing,
  ].join("\n");

  const html = shell(
    approved ? "Your request is confirmed" : "Your request could not be confirmed",
    approved ? "#7fd1a3" : "#e5a37f",
    [
      `<p style="margin:0 0 4px;">Dear ${escapeHtml(record.name)},</p>`,
      `<p style="margin:12px 0 0;">${
        approved
          ? "Dr. Annadurai's office is glad to confirm your request. The session below is now held in his diary."
          : "Thank you for your interest in hosting Dr. Annadurai. His office is sorry to say it cannot take up this request — the date could not be accommodated against his existing commitments."
      }</p>`,
      detailBlock(record),
      note
        ? `<p style="margin:0 0 16px;padding:12px 14px;background:#f4ecd9;border-left:2px solid #c39b3f;font-size:14px;color:#10131a;">${escapeHtml(note)}</p>`
        : "",
      `<p style="margin:0;">${
        approved
          ? "The exact hour, agenda and any travel arrangements will be settled with you directly from this address."
          : "Do please write again for another date — his diary opens further ahead each month, and student and outreach events remain a standing priority."
      }</p>`,
      `<p style="margin:18px 0 0;color:#7d8593;">With regards,<br/>Office of Dr. Mylswamy Annadurai</p>`,
    ].join("\n"),
  );

  return sendMail({ to: record.email, subject, text, html });
}
