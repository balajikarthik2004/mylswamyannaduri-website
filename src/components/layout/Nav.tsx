"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useScrolledPast } from "@/lib/use-media-query";
import { useLang } from "@/lib/i18n";
import { T } from "@/components/ui/primitives";
import type { L } from "@/lib/i18n";

const links: { href: string; label: L }[] = [
  { href: "/#about", label: { en: "Profile", ta: "சுயவிவரம்" } },
  { href: "/missions", label: { en: "Missions", ta: "பயணங்கள்" } },
  { href: "/#chronicle", label: { en: "Chronicle", ta: "காலவரிசை" } },
  { href: "/awards", label: { en: "Awards", ta: "விருதுகள்" } },
  { href: "/gallery", label: { en: "Gallery", ta: "படத்தொகுப்பு" } },
  { href: "/engagements", label: { en: "Engagements", ta: "நிகழ்வுகள்" } },
  { href: "/contact", label: { en: "Contact", ta: "தொடர்பு" } },
];

export function Nav() {
  const scrolled = useScrolledPast(24);
  const [open, setOpen] = useState(false);
  const { lang, setLang } = useLang();
  const pathname = usePathname();

  // Close the menu when the route changes. Adjusting state during render is
  // React's documented pattern for this — an effect would cascade a render.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled
            ? "border-b border-line bg-paper/80 backdrop-blur-xl"
            : "border-b border-transparent",
        ].join(" ")}
      >
        <nav className="container-x flex h-[72px] items-center justify-between gap-6">
          <Link
            href="/"
            className="group flex items-baseline gap-2.5 whitespace-nowrap"
            aria-label="Dr. Mylswamy Annadurai — home"
          >
            <span className="font-display text-[1.3rem] leading-none tracking-[-0.015em] text-ink">
              M. Annadurai
            </span>
            <span className="hidden font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ink-3 sm:inline">
              ISRO
            </span>
          </Link>

          <ul className="hidden items-center gap-8 lg:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="group relative font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-2 transition-colors hover:text-ink"
                >
                  <T v={l.label} />
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-accent transition-all duration-400 group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center rounded-full border border-line bg-paper-2/70 p-0.5"
              role="group"
              aria-label="Language"
            >
              {(["en", "ta"] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  className={[
                    "rounded-full px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.12em] transition-all",
                    code === "ta" ? "font-tamil" : "font-mono",
                    lang === code
                      ? "bg-ink text-paper"
                      : "text-ink-3 hover:text-ink",
                  ].join(" ")}
                >
                  {code === "en" ? "EN" : "தமிழ்"}
                </button>
              ))}
            </div>

            <button
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper-2/70 lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <span className="relative block h-3 w-4">
                <span
                  className={[
                    "absolute left-0 h-px w-full bg-ink transition-all duration-300",
                    open ? "top-1.5 rotate-45" : "top-0",
                  ].join(" ")}
                />
                <span
                  className={[
                    "absolute left-0 top-1.5 h-px w-full bg-ink transition-opacity duration-200",
                    open ? "opacity-0" : "opacity-100",
                  ].join(" ")}
                />
                <span
                  className={[
                    "absolute left-0 h-px w-full bg-ink transition-all duration-300",
                    open ? "top-1.5 -rotate-45" : "top-3",
                  ].join(" ")}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile overlay */}
      <div
        className={[
          "fixed inset-0 z-40 bg-paper transition-all duration-500 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <div className="container-x flex h-full flex-col justify-center gap-1 pb-16">
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              className="border-b border-line py-4 font-display text-[2rem] leading-tight tracking-[-0.02em] text-ink transition-transform duration-500"
              style={{
                transform: open ? "none" : "translateY(1rem)",
                opacity: open ? 1 : 0,
                transitionDelay: `${i * 55}ms`,
              }}
            >
              <T v={l.label} />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
