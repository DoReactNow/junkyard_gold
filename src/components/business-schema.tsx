// Site-wide structured data: who the business is (AutoPartsStore) and the site itself (WebSite).
// Built from BUSINESS so name, address, phone and hours always match the visible pages.
// No aggregateRating or reviews until real customer reviews exist.
import { BUSINESS, CLOSE_HOUR, OPEN_HOUR, siteUrl } from "@/lib/business";

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function businessJsonLd() {
  const url = siteUrl();
  const org = `${url}/#business`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AutoPartsStore",
        "@id": org,
        name: BUSINESS.name,
        url,
        logo: `${url}/brand/jg-mark.png`,
        image: `${url}/brand/og.png`,
        description:
          "Used engines, transmissions and major auto parts, VIN-matched and shipped by freight to all 50 states, with a 3-month warranty and free delivery to repair shops in the lower 48.",
        foundingDate: String(BUSINESS.founded),
        telephone: BUSINESS.phoneE164,
        email: BUSINESS.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: BUSINESS.street,
          addressLocality: BUSINESS.city,
          addressRegion: BUSINESS.state,
          postalCode: BUSINESS.zip,
          addressCountry: "US",
        },
        areaServed: { "@type": "Country", name: "United States" },
        currenciesAccepted: "USD",
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: hh(OPEN_HOUR),
            closes: hh(CLOSE_HOUR),
          },
        ],
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "sales",
            telephone: BUSINESS.phoneE164,
            email: BUSINESS.email,
            areaServed: "US",
            availableLanguage: "English",
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: BUSINESS.name,
        publisher: { "@id": org },
        inLanguage: "en-US",
      },
    ],
  };
}

export function BusinessSchema() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd()) }} />;
}
