import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  Instrument_Sans,
  JetBrains_Mono,
  Anek_Tamil,
} from "next/font/google";
import "./globals.css";

import { LanguageProvider } from "@/lib/i18n";
import { ScrollEngine } from "@/components/providers/ScrollEngine";
import { SceneMount } from "@/components/three/SceneMount";
import { Nav } from "@/components/layout/Nav";
import { ChromeGate } from "@/components/layout/ChromeGate";
import { ToastProvider } from "@/components/ui/Toast";
import { Footer } from "@/components/layout/Footer";

/* Fraunces carries the editorial voice — a variable serif with an optical-size
   axis, so headlines stay high-contrast without the body text going spindly.
   The italic is loaded as a real face: the wordmark and every mission subtitle
   set in it, and Fraunces' italic is a genuine cursive cut (single-storey a,
   swashed w) — synthesising it from the roman just shears the uprights.
   Instrument Sans handles UI copy; JetBrains Mono carries the data labels. */
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
});
const sans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});
const tamil = Anek_Tamil({
  variable: "--font-tamil",
  subsets: ["tamil"],
  display: "swap",
});

const SITE = "https://mylswamyannadurai.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Dr. Mylswamy Annadurai — Moon Man of India",
    template: "%s · Dr. Mylswamy Annadurai",
  },
  description:
    "Padma Shri Dr. Mylswamy Annadurai — Project Director of Chandrayaan-1, Programme Director of Mangalyaan, and Director of the ISRO Satellite Centre. Thirty-six years, sixty satellites, one Moon.",
  keywords: [
    "Mylswamy Annadurai",
    "Moon Man of India",
    "Chandrayaan-1",
    "Mangalyaan",
    "ISRO",
    "Padma Shri",
    "Indian Space Research Organisation",
  ],
  authors: [{ name: "Dr. Mylswamy Annadurai" }],
  openGraph: {
    type: "profile",
    title: "Dr. Mylswamy Annadurai — Moon Man of India",
    description:
      "Project Director, Chandrayaan-1 · Programme Director, Mangalyaan · Director, ISRO Satellite Centre.",
    url: SITE,
    siteName: "Dr. Mylswamy Annadurai",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@m_annadurai",
    title: "Dr. Mylswamy Annadurai — Moon Man of India",
    description:
      "Project Director, Chandrayaan-1 · Programme Director, Mangalyaan · Director, ISRO Satellite Centre.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fbfaf7",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${display.variable} ${tamil.variable} antialiased`}
    >
      {/* Extensions stamp their own attributes onto <body> before React
          hydrates — ColorZilla's `cz-shortcut-listen`, Grammarly's `data-gr-*`
          — which React then reports as a hydration mismatch the page did not
          cause and cannot prevent. The suppression is shallow: it covers this
          element's own attributes only, so every component inside is still
          hydration-checked as before. Body attributes here are static, so
          nothing real is being masked. */}
      <body className="min-h-dvh bg-paper" suppressHydrationWarning>
        <LanguageProvider>
          <ToastProvider>
            <ChromeGate>
              <ScrollEngine />
              <SceneMount />
              <Nav />
            </ChromeGate>
            <main className="relative z-10">{children}</main>
            <ChromeGate>
              <Footer />
              <div className="grain-layer" aria-hidden="true" />
            </ChromeGate>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
