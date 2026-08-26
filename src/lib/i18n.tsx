"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

export type Lang = "en" | "ta";

/** A string that may have a Tamil counterpart. Falls back to English. */
export type L = { en: string; ta?: string };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  /** Resolve a localized value for the active language. */
  t: (value: L | string) => string;
};

const LangContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "ma-lang";

/* ── External store: the preference lives in localStorage ──────
   Reading it through useSyncExternalStore (rather than a mount effect that
   calls setState) keeps hydration correct and satisfies the React rule
   against synchronous setState inside effects. */

let cached: Lang | null = null;
const listeners = new Set<() => void>();

function readLang(): Lang {
  if (cached) return cached;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    cached = saved === "ta" ? "ta" : "en";
  } catch {
    cached = "en";
  }
  return cached;
}

function writeLang(next: Lang) {
  if (cached === next) return;
  cached = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable — keep the in-memory value */
  }
  for (const fn of listeners) fn();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Keep other tabs in step.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cached = e.newValue === "ta" ? "ta" : "en";
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, () => "en" as Lang);

  const setLang = useCallback((l: Lang) => writeLang(l), []);

  // Effects may talk to external systems — here, the document element.
  useEffect(() => {
    document.documentElement.lang = lang === "ta" ? "ta" : "en";
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(lang === "en" ? "ta" : "en"),
      t: (v) => {
        if (typeof v === "string") return v;
        return (lang === "ta" && v.ta) || v.en;
      },
    }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}
