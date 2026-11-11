import type { Metadata } from "next";
import { Inter, Inter_Tight, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { BUSINESS } from "@/lib/business";
import { SmoothScroll } from "@/components/smooth-scroll";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
// Google tag (Tag Manager container). Not loaded on /admin, so staff pages and customer details stay out of analytics.
const GTM_ID = "GTM-M3MHQH6H";
const googleTag = `if (!location.pathname.startsWith("/admin")) {
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtm.js?id=${GTM_ID}";
  document.head.appendChild(s);
}`;

const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://junkyardgold.com"),
  title: {
    default: `${BUSINESS.name} | Used Engines & Transmissions, Bradenton FL`,
    template: `%s | ${BUSINESS.name}`,
  },
  openGraph: { images: ["/brand/og.png"], siteName: "Junkyard Gold" },
  alternates: { canonical: "./" },
  description:
    "Quality used engines, transmissions and major parts from Junkyard Gold in Bradenton, Florida. Text your VIN for options in minutes. 3-month warranty, free delivery to repair shops.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: googleTag }} />
      </head>
      <body className={`${inter.variable} ${interTight.variable} ${serif.variable} font-sans antialiased`}>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
