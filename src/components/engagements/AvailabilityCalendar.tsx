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
  startOfToday,
  toKey,
  type DateLang,
  type DayStatus,
} from "@/lib/engagements";
import { T } from "@/components/ui/primitives";
import type { L } from "@/lib/i18n";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const STATUS_STYLES: Record<DayStatus, string> = {
  open: "bg-paper text-ink border-line-2 hover:border-ink hover:bg-paper-2 cursor-pointer",
  booked: "bg-accent-soft/70 text-accent border-transparent cursor-default",
  blackout: "bg-paper-3/60 text-ink-3 border-transparent cursor-default",
  closed: "bg-transparent text-ink-3/50 border-transparent cursor-default",
  notice: "bg-transparent text-ink-3/60 border-transparent cursor-default",
  past: "bg-transparent text-ink-3/35 border-transparent cursor-default",
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
  bookedSlots,
  lang,
}: {
  cursor: Date;
  onCursorChange: (d: Date) => void;
  selected: string | null;
  onSelect: (key: string) => void;
  bookedSlots: Record<string, string[]>;
  lang: DateLang;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const cells = useMemo(
    () => monthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const todayKey = toKey(startOfToday());
  const monthLabel = formatMonthYear(cursor, lang);

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
      gridRef.current
        ?.querySelector<HTMLElement>(`[data-day="${nextKey}"]`)
        ?.focus();
    });
  };

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-[1.6rem] leading-none tracking-[-0.02em] text-ink">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onCursorChange(addMonths(cursor, -1))}
            disabled={atFloor}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => onCursorChange(addMonths(cursor, 1))}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink"
          >
            →
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="mt-6 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="pb-1 text-center font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-3"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div ref={gridRef} className="grid grid-cols-7 gap-1.5" role="grid">
        {cells.map(({ key, inMonth }) => {
          const status = getDayStatus(key, bookedSlots);
          const selectable = inMonth && isSelectable(status);
          const events = eventsOn(key);
          const isSelected = selected === key;
          const dayNum = fromKey(key).getDate();

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
                    ? "available"
                    : "unavailable"
              }`}
              aria-selected={isSelected}
              aria-current={key === todayKey ? "date" : undefined}
              tabIndex={selectable ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, key)}
              onClick={() => selectable && onSelect(key)}
              title={events.length ? events.map((e) => e.title).join(" · ") : undefined}
              className={[
                "relative aspect-square rounded-lg border text-[0.85rem] transition-all duration-200",
                !inMonth ? "pointer-events-none opacity-25" : "",
                isSelected
                  ? "border-ink bg-ink text-paper hover:bg-ink"
                  : STATUS_STYLES[status],
              ].join(" ")}
            >
              <span
                className={[
                  "absolute inset-0 flex items-center justify-center",
                  key === todayKey && !isSelected ? "font-semibold underline underline-offset-4" : "",
                ].join(" ")}
              >
                {dayNum}
              </span>
              {events.length > 0 && !isSelected ? (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
        {legend.map((l) => (
          <li key={l.status} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={[
                "inline-block h-3 w-3 rounded-[3px] border",
                l.status === "open"
                  ? "border-line-2 bg-paper"
                  : l.status === "booked"
                    ? "border-transparent bg-accent-soft"
                    : l.status === "blackout"
                      ? "border-transparent bg-paper-3"
                      : "border-line border-dashed bg-transparent",
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
