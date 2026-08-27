"use client";

import { useMemo, useRef } from "react";
import {
  addMonths,
  eventsOn,
  formatDayLabel,
  formatMonthYear,
  fromKey,
  getDayStatus,
  isSelectable,
  monthGrid,
  sessionsForDate,
  startOfToday,
  toKey,
  type DateLang,
  type DayStatus,
} from "@/lib/engagements";
import { T } from "@/components/ui/primitives";
import type { L } from "@/lib/i18n";

const WEEKDAYS: { short: string; full: string }[] = [
  { short: "Sun", full: "Sunday" },
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
];

/** Cell treatment per availability state. */
const STATUS_STYLES: Record<DayStatus, string> = {
  open:
    "bg-card border-line text-ink shadow-sink cursor-pointer " +
    "hover:-translate-y-0.5 hover:border-brass-2 hover:shadow-lift",
  booked: "bg-accent-tint border-accent-soft text-accent cursor-default",
  blackout:
    "border-transparent text-ink-4 cursor-default " +
    "[background-image:repeating-linear-gradient(135deg,transparent,transparent_4px,var(--color-paper-3)_4px,var(--color-paper-3)_5px)]",
  closed: "bg-transparent border-transparent text-ink-4/60 cursor-default",
  notice: "bg-transparent border-transparent text-ink-4/70 cursor-default",
  past: "bg-transparent border-transparent text-ink-4/40 cursor-default",
};

export const legend: { status: DayStatus; label: L }[] = [
  { status: "open", label: { en: "Open for requests", ta: "கோரிக்கைக்குத் திறந்துள்ளது" } },
  { status: "booked", label: { en: "Committed", ta: "ஒதுக்கப்பட்டது" } },
  { status: "blackout", label: { en: "Held", ta: "ஒதுக்கி வைக்கப்பட்டது" } },
  { status: "notice", label: { en: "Inside notice period", ta: "அறிவிப்புக் காலத்திற்குள்" } },
];

export function AvailabilityCalendar({
  cursor,
  onCursorChange,
  selected,
  onSelect,
  bookedSessions,
  lang,
}: {
  cursor: Date;
  onCursorChange: (d: Date) => void;
  selected: string | null;
  onSelect: (key: string) => void;
  bookedSessions: Record<string, string[]>;
  lang: DateLang;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const cells = useMemo(
    () => monthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const todayKey = toKey(startOfToday());
  const monthLabel = formatMonthYear(cursor, lang);

  const openThisMonth = cells.filter(
    (c) => c.inMonth && getDayStatus(c.key, bookedSessions) === "open",
  ).length;

  // Don't let the visitor page back before the current month.
  const atFloor =
    cursor.getFullYear() === startOfToday().getFullYear() &&
    cursor.getMonth() === startOfToday().getMonth();

  /** Roving focus so the grid is usable from the keyboard. */
  const onKeyDown = (e: React.KeyboardEvent, key: string) => {
    const deltas: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const delta = deltas[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = new Date(fromKey(key));
    next.setDate(next.getDate() + delta);
    const nextKey = toKey(next);
    if (next.getMonth() !== cursor.getMonth()) {
      onCursorChange(new Date(next.getFullYear(), next.getMonth(), 1));
    }
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLElement>(`[data-day="${nextKey}"]`)?.focus();
    });
  };

  return (
    <div>
      {/* ── Month header ─────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="kicker">
            <T v={{ en: "Availability", ta: "கிடைக்கும் நாட்கள்" }} />
          </p>
          <h3 className="mt-2 font-display text-[2rem] leading-none tracking-[-0.03em] text-ink">
            {monthLabel}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-brass-soft px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-brass sm:inline-block">
            {openThisMonth} <T v={{ en: "open", ta: "காலி" }} />
          </span>
          <div className="flex items-center gap-1">
            <NavButton
              onClick={() => onCursorChange(addMonths(cursor, -1))}
              disabled={atFloor}
              label="Previous month"
            >
              ←
            </NavButton>
            <NavButton
              onClick={() => onCursorChange(addMonths(cursor, 1))}
              label="Next month"
            >
              →
            </NavButton>
          </div>
        </div>
      </div>

      <div className="rule-fade mt-6" />

      {/* ── Weekday header ───────────────────────────────── */}
      <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((d) => (
          <div
            key={d.full}
            className="pb-2 text-center font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-4"
          >
            <abbr title={d.full} className="no-underline">
              {d.short.charAt(0)}
              <span className="hidden sm:inline">{d.short.slice(1)}</span>
            </abbr>
          </div>
        ))}
      </div>

      {/* ── Days ─────────────────────────────────────────── */}
      <div
        ref={gridRef}
        className="grid grid-cols-7 gap-1.5 sm:gap-2"
        role="grid"
        aria-label={`${monthLabel} availability`}
      >
        {cells.map(({ key, inMonth }) => {
          const status = getDayStatus(key, bookedSessions);
          const selectable = inMonth && isSelectable(status);
          const events = eventsOn(key);
          const isSelected = selected === key;
          const isToday = key === todayKey;
          const dayNum = fromKey(key).getDate();
          const free =
            status === "open"
              ? sessionsForDate(key).length - (bookedSessions[key]?.length ?? 0)
              : 0;

          return (
            <button
              key={key}
              type="button"
              data-day={key}
              role="gridcell"
              disabled={!selectable}
              aria-label={`${formatDayLabel(key, lang)} — ${
                events.length
                  ? events[0].title
                  : status === "open"
                    ? `${free} ${free === 1 ? "session" : "sessions"} available`
                    : "unavailable"
              }`}
              aria-selected={isSelected}
              aria-current={isToday ? "date" : undefined}
              tabIndex={selectable ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, key)}
              onClick={() => selectable && onSelect(key)}
              title={events.length ? events.map((e) => e.title).join(" · ") : undefined}
              className={[
                "group relative flex aspect-square flex-col items-center justify-center rounded-xl border",
                "transition-all duration-[240ms] ease-[var(--ease-spring)]",
                !inMonth ? "pointer-events-none opacity-0" : "",
                isSelected
                  ? "border-transparent bg-ink text-paper shadow-raise ring-2 ring-brass-2 ring-offset-2 ring-offset-card"
                  : STATUS_STYLES[status],
              ].join(" ")}
            >
              <span
                className={[
                  "tnum text-[0.95rem] leading-none",
                  isSelected ? "font-semibold" : "",
                  isToday && !isSelected ? "font-bold text-brass" : "",
                ].join(" ")}
              >
                {dayNum}
              </span>

              {/* Free-slot pips */}
              {status === "open" && !isSelected ? (
                <span
                  aria-hidden="true"
                  className="mt-1.5 flex items-center gap-[3px]"
                >
                  {Array.from({ length: Math.min(free, 4) }, (_, i) => (
                    <span
                      key={i}
                      className="block h-[3px] w-[3px] rounded-full bg-brass-2/70 transition-colors group-hover:bg-brass"
                    />
                  ))}
                </span>
              ) : null}

              {/* Committed marker */}
              {events.length > 0 && !isSelected ? (
                <span
                  aria-hidden="true"
                  className="mt-1.5 block h-[3px] w-4 rounded-full bg-accent/45"
                />
              ) : null}

              {isToday && !isSelected ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-1 h-px bg-brass/40"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ── Legend ───────────────────────────────────────── */}
      <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5 border-t border-line pt-5">
        {legend.map((l) => (
          <li key={l.status} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={[
                "inline-block h-3.5 w-3.5 rounded-[5px] border",
                l.status === "open"
                  ? "border-line bg-card shadow-sink"
                  : l.status === "booked"
                    ? "border-accent-soft bg-accent-tint"
                    : l.status === "blackout"
                      ? "border-transparent [background-image:repeating-linear-gradient(135deg,transparent,transparent_3px,var(--color-paper-3)_3px,var(--color-paper-3)_4px)]"
                      : "border-dashed border-line-2 bg-transparent",
              ].join(" ")}
            />
            <span className="text-[0.72rem] text-ink-3 lang-aware">
              <T v={l.label} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-ink shadow-sink transition-all duration-200 hover:-translate-y-px hover:border-ink hover:shadow-lift disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-ink-4 disabled:shadow-none disabled:hover:translate-y-0"
    >
      {children}
    </button>
  );
}
