"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Transient notices, stacked in the corner.
 *
 * Used for the outcome of an action the visitor has just taken and does not
 * need to keep reading — an approval that went through, a save that failed.
 * Anything that must survive being glanced away from belongs in the page
 * itself: the console still marks an undelivered email on the request card,
 * because that is a state, not an event.
 *
 * Errors are held roughly twice as long as successes and are announced
 * assertively — a success is confirming what you already expect, while a
 * failure is telling you something you don't know yet.
 */

export type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  text: string;
  /** Set for the length of the exit animation, before removal. */
  leaving?: boolean;
};

type ToastApi = {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** How long each kind stays up, in ms. */
const DURATION: Record<ToastKind, number> = {
  success: 5000,
  info: 5000,
  error: 9000,
};

const EXIT_MS = 260;
/** Beyond this a burst stops being informative and just covers the page. */
const MAX_VISIBLE = 4;

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>.");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const clearTimer = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      clearTimer(id);
      setItems((list) =>
        list.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
      );
      const t = setTimeout(() => {
        setItems((list) => list.filter((x) => x.id !== id));
        timers.current.delete(id);
      }, EXIT_MS);
      timers.current.set(id, t);
    },
    [clearTimer],
  );

  const push = useCallback(
    (kind: ToastKind, text: string) => {
      const id = nextId.current++;
      setItems((list) => [...list, { id, kind, text }].slice(-MAX_VISIBLE));
      const t = setTimeout(() => dismiss(id), DURATION[kind]);
      timers.current.set(id, t);
    },
    [dismiss],
  );

  // Every pending timer holds a reference to state setters; drop them all
  // rather than firing into an unmounted tree.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending.values()) clearTimeout(t);
      pending.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (text) => push("success", text),
      error: (text) => push("error", text),
      info: (text) => push("info", text),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const TONE: Record<ToastKind, { bar: string; icon: string; glyph: string }> = {
  success: { bar: "bg-success", icon: "text-success", glyph: "✓" },
  error: { bar: "bg-ember", icon: "text-ember", glyph: "⚠" },
  info: { bar: "bg-accent-2", icon: "text-accent", glyph: "i" },
};

function ToastViewport({
  items,
  onDismiss,
}: {
  items: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      // The region is always mounted so a screen reader is already watching it
      // when the first notice arrives; a live region added at the same moment
      // as its content is not reliably announced.
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-stretch gap-2.5 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[min(24rem,calc(100vw-3rem))]"
    >
      {items.map((t) => {
        const tone = TONE[t.kind];
        return (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={[
              "pointer-events-auto flex items-start gap-3 overflow-hidden rounded-xl border border-line bg-card pr-2.5 shadow-float",
              t.leaving ? "toast-out" : "toast-in",
            ].join(" ")}
          >
            <span aria-hidden="true" className={`w-1 self-stretch ${tone.bar}`} />

            <span
              aria-hidden="true"
              className={`mt-3.5 shrink-0 text-[0.9rem] leading-none ${tone.icon}`}
            >
              {tone.glyph}
            </span>

            <p className="min-w-0 flex-1 py-3.5 text-[0.83rem] leading-relaxed text-ink-2">
              {t.text}
            </p>

            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className="mt-2.5 shrink-0 rounded-full px-2 py-1 text-[0.8rem] leading-none text-ink-4 transition-colors hover:bg-paper-2 hover:text-ink"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
