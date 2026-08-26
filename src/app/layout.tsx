import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Anek_Tamil } from "next/font/google";
import "./globals.css";

import { LanguageProvider } from "@/lib/i18n";
import { ScrollEngine } from "@/components/providers/ScrollEngine";
import { SceneMount } from "@/components/three/SceneMount";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });
const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
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
      <body className="min-h-dvh bg-paper">
        <LanguageProvider>
          <ScrollEngine />
          <SceneMount />
          <Nav />
          <main className="relative z-10">{children}</main>
          <Footer />
          <div className="grain-layer" aria-hidden="true" />
        </LanguageProvider>
      </body>
    </html>
  );
}
