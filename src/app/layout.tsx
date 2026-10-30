import type { Metadata } from "next";
import { Inter, Inter_Tight, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { BUSINESS } from "@/lib/business";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://junkyardgold.com"),
  title: {
    default: `${BUSINESS.name} | Used Engines & Transmissions, Bradenton FL`,
    template: `%s | ${BUSINESS.name}`,
  },
  openGraph: { images: ["/brand/og.png"], siteName: "Junkyard Gold" },
  description:
    "Tested used engines, transmissions and major parts from Junkyard Gold in Bradenton, Florida. Text your VIN for options in minutes. 3-month warranty, nationwide shipping.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${interTight.variable} ${serif.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
