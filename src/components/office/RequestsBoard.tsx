"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type {
  BookingRecord,
  BookingStatus,
  StoreHealth,
} from "@/lib/server/booking-store";
import { durationLabel, engagementTypes, sessions } from "@/lib/data/engagements";
import { addMinutesToTime, formatDateLong, formatTime12 } from "@/lib/engagements";
import { useToast } from "@/components/ui/Toast";

type Filter = "pending" | "approved" | "rejected" | "all";

const FILTERS: { id: Filter; label: string; hint: string }[] = [
  { id: "pending", label: "Pending", hint: "Awaiting a decision" },
  { id: "approved", label: "Approved", hint: "Held in the diary" },
  { id: "rejected", label: "Rejected", hint: "Session released" },
  { id: "all", label: "All", hint: "Everything received" },
];

/** Status drives a stripe, a chip and a tile accent — one colour each. */
const STATUS = {
  pending: {
    chip: "bg-brass-soft text-brass",
    stripe: "bg-brass-2",
    tile: "text-brass",
  },
  approved: {
    chip: "bg-success-soft text-success",
    stripe: "bg-success",
    tile: "text-success",
  },
  rejected: {
    chip: "bg-ember-soft text-ember",
    stripe: "bg-ember",
    tile: "text-ember",
  },
} satisfies Record<BookingStatus, { chip: string; stripe: string; tile: string }>;

function typeLabel(id: string): string {
  return engagementTypes.find((t) => t.id === id)?.label.en ?? id;
}

function whenLine(r: BookingRecord): string {
  const win = sessions.find((s) => s.id === r.session);
  if (r.preferredTime) {
    const end = addMinutesToTime(r.preferredTime, r.durationMinutes);
    return `${formatTime12(r.preferredTime)} – ${formatTime12(end)}`;
  }
  return win
    ? `${win.label.en} · ${formatTime12(win.start)}–${formatTime12(win.end)}`
    : r.session;
}

function received(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][d.getMonth()];
  return `${day} ${month} ${d.getFullYear()}`;
}

export function RequestsBoard({
  initial,
  provider,
  store,
  user,
}: {
  initial: BookingRecord[];
  provider: "resend" | "smtp" | "none";
  store: StoreHealth;
  user: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [reloading, startReload] = useTransition();
  const toast = useToast();

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, all: initial.length };
    for (const r of initial) c[r.status] += 1;
    return c;
  }, [initial]);

  const shown = useMemo(() => {
    const list =
      filter === "all" ? initial : initial.filter((r) => r.status === filter);
    // Newest first — the queue is worked from the top.
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [initial, filter]);

  const act = async (reference: string, decision: "approved" | "rejected") => {
    // Which address the notice went to is the useful detail here; the
    // provider carrying it is already shown as a chip in the bar.
    const to = initial.find((r) => r.reference === reference)?.email ?? "them";
    setBusy(reference);
    try {
      const res = await fetch("/api/office/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, decision, note: notes[reference] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "That did not go through.");
        return;
      }
      if (data.notified) {
        toast.success(`${reference} ${decision} — the requester was emailed at ${to}.`);
      } else {
        // The card keeps a permanent "not emailed" flag, so the toast only
        // has to catch the eye now; it does not have to be the record.
        toast.error(
          `${reference} ${decision}, but the email to ${to} did not go out — ${data.notifyError}. Tell them by hand.`,
        );
      }
      router.refresh();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  };

  const signOut = async () => {
    await fetch("/api/office/logout", { method: "POST" });
    router.refresh();
  };

  return (
    <div className="min-h-dvh bg-paper-2">
      {/* ── Bar ──────────────────────────────────────────────
          Ink, sticky and slim: it marks this as a tool rather than
          a page, and keeps the operator and the way out reachable
          from anywhere in a long queue. */}
      <header className="sticky top-0 z-30 bg-ink/85 text-paper shadow-raise backdrop-blur-xl border-b border-ink-2">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="font-display text-[1.05rem] leading-none tracking-[-0.015em]">
              M. Annadurai
            </span>
            <span className="rounded-full bg-paper/12 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-paper/70">
              Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              title={
                provider === "none"
                  ? "No mail provider configured"
                  : `Decisions are emailed via ${provider}`
              }
              className={[
                "hidden items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.14em] sm:inline-flex",
                provider === "none"
                  ? "bg-ember/20 text-[#f0b48f]"
                  : "bg-success/20 text-[#8ad6ac]",
              ].join(" ")}
            >
              <span aria-hidden="true">●</span>
              {provider === "none" ? "mail off" : `mail · ${provider}`}
            </span>
            {/* The store is the other thing that can be quietly broken, and
                unlike the mailer it fails by showing an empty queue — which
                looks exactly like a quiet week. It gets a chip of its own. */}
            <span
              title={
                store.durable
                  ? `Requests are stored in ${store.location}`
                  : `${store.location} — ${store.degradedReason ?? "not durable"}`
              }
              className={[
                "hidden items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.14em] sm:inline-flex",
                store.durable
                  ? "bg-success/20 text-[#8ad6ac]"
                  : "bg-ember/20 text-[#f0b48f]",
              ].join(" ")}
            >
              <span aria-hidden="true">●</span>
              {store.durable ? `store · ${store.driver}` : "store · ephemeral"}
            </span>
            <span className="hidden font-mono text-[0.6rem] uppercase tracking-[0.14em] text-paper/45 sm:inline">
              {user}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-paper/20 px-3.5 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-paper/80 transition-colors hover:border-paper/50 hover:text-paper"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">Engagement requests</p>
            <h1 className="mt-3 font-display text-[2.4rem] leading-none tracking-[-0.035em] text-ink">
              The queue
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-3">
              {counts.all} received · {counts.pending} awaiting you
            </p>
            {/* The queue is server-rendered, so a request that arrives while
                the page is open is not on screen until something re-fetches.
                An explicit control beats an operator wondering whether the
                board is live or stale. */}
            <button
              type="button"
              onClick={() => startReload(() => router.refresh())}
              disabled={reloading}
              aria-busy={reloading}
              className="rounded-full border border-line-2 bg-card px-3.5 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-2 shadow-sink transition-colors hover:border-ink hover:text-ink disabled:opacity-60"
            >
              {reloading ? "Checking…" : "Reload"}
            </button>
          </div>
        </div>

        {/* The failure this console used to hide.
            On a read-only filesystem — which is every serverless deployment —
            the store fell back to one instance's memory, so a request could
            be accepted, given a reference, and then be invisible here. The
            banner names where records actually are and what it would take to
            make that durable, because "no requests" and "requests are being
            discarded" render identically otherwise. */}
        {!store.durable ? (
          <div className="mt-7 rounded-xl border border-ember/25 bg-ember-soft px-4 py-3.5 text-[0.82rem] leading-relaxed text-ember">
            <p>
              <strong>Requests are not being stored durably.</strong>{" "}
              {store.degradedReason ??
                "The current store does not survive a restart."}
            </p>
            <p className="mt-2 text-ink-2">
              Records are in{" "}
              <code className="font-mono text-[0.78rem]">{store.location}</code>.
              Set <code className="font-mono text-[0.78rem]">MONGODB_URI</code>{" "}
              (MongoDB Atlas cluster) — or{" "}
              <code className="font-mono text-[0.78rem]">BOOKINGS_DATA_DIR</code>{" "}
              pointing at a writable volume — and every instance will read the
              same queue. Until then, the alert email sent on each new request
              is the reliable copy.
            </p>
          </div>
        ) : store.degradedReason ? (
          <p className="mt-7 rounded-xl border border-brass-2/30 bg-brass-soft px-4 py-3.5 text-[0.82rem] leading-relaxed text-brass-deep">
            {store.degradedReason}
          </p>
        ) : null}

        {/* An operator approving requests has to know whether anyone is
            actually being told. Loud only when the answer is no. */}
        {provider === "none" ? (
          <p className="mt-7 rounded-xl border border-ember/20 bg-ember-soft px-4 py-3.5 text-[0.82rem] leading-relaxed text-ember">
            <strong>No mail provider is configured</strong>, so decisions will not
            reach requesters. Set <code className="font-mono">RESEND_API_KEY</code>,
            or <code className="font-mono">SMTP_HOST</code>/
            <code className="font-mono">SMTP_USER</code>/
            <code className="font-mono">SMTP_PASS</code>, in{" "}
            <code className="font-mono">.env</code>. Until then the message body is
            written to the server log.
          </p>
        ) : null}

        {/* ── Counts, which are also the filters ─────────────
            Two controls collapsed into one: the numbers are what an
            operator scans for, and the thing they then want is that
            list. Separating them would mean reading a figure in one
            place and clicking a tab in another. */}
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            const tone =
              f.id === "all" ? "text-ink" : STATUS[f.id as BookingStatus].tile;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={[
                  "group relative overflow-hidden rounded-xl border px-5 py-4 text-left transition-all duration-300",
                  active
                    ? "border-ink bg-card shadow-raise scale-[1.02]"
                    : "border-line bg-card/60 shadow-sink hover:-translate-y-1 hover:border-line-2 hover:bg-card hover:shadow-lift",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "absolute inset-x-0 top-0 h-0.5 transition-opacity duration-300",
                    active ? "opacity-100" : "opacity-0",
                    f.id === "all" ? "bg-ink" : STATUS[f.id as BookingStatus].stripe,
                  ].join(" ")}
                />
                <p
                  className={[
                    "tnum font-display text-[2rem] leading-none tracking-[-0.03em]",
                    active ? tone : "text-ink",
                  ].join(" ")}
                >
                  {counts[f.id]}
                </p>
                <p className="mt-2.5 text-[0.85rem] font-medium leading-none text-ink">
                  {f.label}
                </p>
                <p className="mt-1.5 hidden text-[0.72rem] leading-snug text-ink-3 sm:block">
                  {f.hint}
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Queue ────────────────────────────────────────── */}
        {shown.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line-2 bg-card/40 px-6 py-16 text-center">
            <p className="font-display text-[1.4rem] leading-snug tracking-[-0.02em] text-ink">
              {filter === "pending"
                ? "Nothing awaiting a decision"
                : `No ${filter === "all" ? "" : filter} requests`}
            </p>
            <p className="mt-2 text-[0.85rem] text-ink-3">
              {filter === "pending"
                ? "The queue is clear."
                : "Requests will appear here as they arrive."}
            </p>
          </div>
        ) : (
          /* Two per row rather than one full-width bar each. A request is a
             short record — name, date, a line or two — and stretched across a
             1150px container it became mostly empty space with the eye
             travelling a long way between the date and its status. */
          <ul className="mt-8 grid gap-4 lg:grid-cols-2">
            {shown.map((r) => {
              const tone = STATUS[r.status];
              const working = busy === r.reference;
              return (
                <li
                  key={r.reference}
                  className="group flex overflow-hidden rounded-2xl border border-line bg-card shadow-lift transition-all duration-300 hover:shadow-raise hover:-translate-y-1 hover:border-line-2"
                >
                  {/* Status reads at a glance from the edge, before any text */}
                  <span
                    aria-hidden="true"
                    className={`w-1 shrink-0 ${tone.stripe}`}
                  />

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2.5 border-b border-line px-5 py-3.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <span className="tnum font-mono text-[0.68rem] tracking-[0.1em] text-brass">
                            {r.reference}
                          </span>
                          <span className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-4">
                            received {received(r.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1.5 font-display text-[1.2rem] leading-tight tracking-[-0.025em] text-ink">
                          {formatDateLong(r.date, "en")}
                        </p>
                        <p className="tnum mt-1 font-mono text-[0.66rem] tracking-[0.06em] text-ink-3">
                          {whenLine(r)} · {durationLabel(r.durationMinutes)} IST
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span
                          className={`rounded-full px-3 py-1 font-mono text-[0.58rem] uppercase tracking-[0.14em] ${tone.chip}`}
                        >
                          {r.status}
                        </span>
                        {r.status !== "pending" && r.notified === false ? (
                          <span
                            title={r.notifyError}
                            className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ember"
                          >
                            ⚠ not emailed
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid flex-1 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-2">
                      <div>
                        <p className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-ink-4">
                          Requester
                        </p>
                        <p className="mt-2 text-[0.95rem] font-medium leading-snug text-ink">
                          {r.name}
                        </p>
                        <p className="text-[0.85rem] leading-snug text-ink-2">
                          {r.organisation}
                        </p>
                        <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-3">
                          <a
                            href={`mailto:${r.email}`}
                            className="underline underline-offset-2 transition-colors hover:text-accent"
                          >
                            {r.email}
                          </a>
                          {r.phone ? (
                            <>
                              <span aria-hidden="true"> · </span>
                              {r.phone}
                            </>
                          ) : null}
                        </p>
                      </div>

                      <div>
                        <p className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-ink-4">
                          Engagement
                        </p>
                        <p className="mt-2 text-[0.9rem] leading-snug text-ink">
                          {typeLabel(r.type)}
                        </p>
                        <p className="text-[0.85rem] leading-snug text-ink-2">
                          {r.mode === "online" ? "Online" : r.location || "In person"}
                        </p>
                        {r.audience ? (
                          <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-3">
                            {r.audience}
                          </p>
                        ) : null}
                      </div>

                      {r.message ? (
                        <div className="sm:col-span-2">
                          <p className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-ink-4">
                            Message
                          </p>
                          {/* The clamp lives on an inner element with no
                              padding of its own: `line-clamp` clips at the
                              padding box, so a padded box paints one more
                              line into its own padding before cutting. */}
                          <div className="mt-2 rounded-xl bg-paper-2/70 px-3.5 py-2.5">
                            <p
                              className={[
                                "whitespace-pre-wrap text-[0.82rem] leading-relaxed text-ink-2",
                                expanded[r.reference] ? "" : "line-clamp-4",
                              ].join(" ")}
                            >
                              {r.message}
                            </p>
                          </div>
                          {/* Clamping keeps one long note from setting the
                              height of its whole row, but the operator still
                              has to be able to read it to decide. */}
                          {r.message.length > 200 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpanded((e) => ({
                                  ...e,
                                  [r.reference]: !e[r.reference],
                                }))
                              }
                              aria-expanded={!!expanded[r.reference]}
                              className="mt-1.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-3 underline underline-offset-4 transition-colors hover:text-accent"
                            >
                              {expanded[r.reference] ? "Show less" : "Show more"}
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      {r.decisionNote ? (
                        <div className="sm:col-span-2">
                          <p className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-ink-4">
                            Note sent to requester
                          </p>
                          <p className="mt-2 border-l-2 border-brass-2 pl-4 text-[0.85rem] leading-relaxed text-ink-2">
                            {r.decisionNote}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    {r.status === "pending" ? (
                      <div className="mt-auto border-t border-line bg-paper-2/50 px-5 py-4">
                        <label
                          htmlFor={`note-${r.reference}`}
                          className="block font-mono text-[0.56rem] uppercase tracking-[0.16em] text-ink-4"
                        >
                          Note to the requester — optional
                        </label>
                        <input
                          id={`note-${r.reference}`}
                          value={notes[r.reference] ?? ""}
                          onChange={(e) =>
                            setNotes((n) => ({ ...n, [r.reference]: e.target.value }))
                          }
                          placeholder="Included in the email, whichever way you decide."
                          className="mt-2.5 w-full rounded-xl border border-line bg-card px-4 py-2.5 text-[0.85rem] text-ink shadow-sink transition-all duration-200 placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/8"
                        />
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={working}
                            onClick={() => act(r.reference, "approved")}
                            aria-busy={working}
                            className="btn btn-primary flex-1 justify-center px-5 py-3 text-[0.85rem] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                          >
                            {working ? (
                              <>
                                <span
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/30 border-t-paper"
                                />
                                Working…
                              </>
                            ) : (
                              "Approve & notify"
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={working}
                            onClick={() => act(r.reference, "rejected")}
                            className="btn btn-ghost px-5 py-3 text-[0.85rem] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
