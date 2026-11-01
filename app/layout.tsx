import type { Metadata } from "next";
import { Bagel_Fat_One, Caveat, Instrument_Sans } from "next/font/google";
import "./globals.css";

const bagel = Bagel_Fat_One({ weight: "400", subsets: ["latin"], variable: "--f-bagel", display: "swap" });
const instrument = Instrument_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--f-sans", display: "swap" });
const caveat = Caveat({ weight: ["500", "700"], subsets: ["latin"], variable: "--f-hand", display: "swap" });

export const metadata: Metadata = {
  title: "Poké Ma-Ma",
  description: "Le poké bowl de la maison. Restaurant de famille, sur invitation.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${bagel.variable} ${instrument.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
