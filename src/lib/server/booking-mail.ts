import "server-only";

import { sendMail, type MailResult } from "@/lib/server/mailer";
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
        <td style="padding:6px 14px 6px 0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#7d8593;white-space:nowrap;vertical-align:top;">${k.trim()}</td>
        <td style="padding:6px 0;font-size:14px;color:#10131a;">${rest.join(":").trim()}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;border-top:1px solid #e8e2d6;border-bottom:1px solid #e8e2d6;width:100%;">${rows}</table>`;
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
      `<p style="margin:0 0 4px;">Dear ${record.name},</p>`,
      `<p style="margin:12px 0 0;">${
        approved
          ? "Dr. Annadurai's office is glad to confirm your request. The session below is now held in his diary."
          : "Thank you for your interest in hosting Dr. Annadurai. His office is sorry to say it cannot take up this request — the date could not be accommodated against his existing commitments."
      }</p>`,
      detailBlock(record),
      note
        ? `<p style="margin:0 0 16px;padding:12px 14px;background:#f4ecd9;border-left:2px solid #c39b3f;font-size:14px;color:#10131a;">${note}</p>`
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
