import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { BUSINESS } from "@/lib/business";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://junkyardgold.com"),
  title: {
    default: `${BUSINESS.name} | Used Engines & Transmissions, Bradenton FL`,
    template: `%s | ${BUSINESS.name}`,
  },
  description:
    "Tested used engines, transmissions and major parts from Junkyard Gold in Bradenton, Florida. Text your VIN for options in minutes. 3-month warranty, nationwide shipping.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${oswald.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
