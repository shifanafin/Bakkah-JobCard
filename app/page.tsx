import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Bakkah Premium Auto Care | Car Detailing Dubai — Al Qusais",
  description:
    "Trusted car detailing studio in Al Qusais, Dubai. Expert ceramic coating, paint correction, full detailing, RTA inspection prep & fleet services. 5,000+ cars cared for. 5.0★ Google rating. Book via WhatsApp today.",
  keywords: [
    "car detailing dubai",
    "auto detailing dubai",
    "ceramic coating dubai",
    "paint correction dubai",
    "car wash al qusais",
    "vehicle detailing uae",
    "nano coating dubai",
    "interior car cleaning dubai",
    "scratch removal dubai",
    "rta inspection prep dubai",
    "fleet detailing dubai",
    "premium car care uae",
    "car polish dubai",
    "full detail package dubai",
    "steam cleaning car dubai",
    "بوليش سيارات دبي",
    "تلميع السيارات دبي",
    "طلاء سيراميك دبي",
    "غسيل سيارات القصيص",
    "مركز تجميل سيارات دبي",
  ],
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: "https://bakkah.ae",
    siteName: "Bakkah Premium Auto Care",
    title: "Bakkah Premium Auto Care | Car Detailing Studio in Dubai",
    description:
      "Trusted car detailing studio in Al Qusais, Dubai. Ceramic coating, paint correction, RTA prep & fleet services. 5,000+ happy customers. 5.0★ rated.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Bakkah Premium Auto Care — Car Detailing Dubai, Al Qusais",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bakkah Premium Auto Care | Car Detailing Dubai",
    description:
      "Trusted car detailing in Al Qusais, Dubai. Ceramic coating, paint correction & more. Book on WhatsApp.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://bakkah.ae",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["AutoRepair", "LocalBusiness"],
      "@id": "https://bakkah.ae/#business",
      name: "Bakkah Premium Auto Care",
      alternateName: [
        "Bakkah Auto Detailing Dubai",
        "Bakkah Car Care Al Qusais",
      ],
      description:
        "A trusted vehicle detailing studio in Al Qusais, Dubai. Specialising in ceramic coating, paint correction, full interior & exterior detailing, RTA inspection preparation, and corporate fleet services. Serving Dubai since 2012 with 5,000+ satisfied customers.",
      url: "https://bakkah.ae",
      telephone: "+971545886999",
      email: "info@bakkah.ae",
      foundingDate: "2012",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Al Qusais Industrial Area",
        addressLocality: "Al Qusais",
        addressRegion: "Dubai",
        addressCountry: "AE",
        postalCode: "00000",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 25.2697,
        longitude: 55.3594,
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
          opens: "08:00",
          closes: "20:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: "Sunday",
          opens: "09:00",
          closes: "17:00",
        },
      ],
      priceRange: "AED $$",
      currenciesAccepted: "AED",
      paymentAccepted: "Cash, Credit Card, Bank Transfer",
      areaServed: [
        { "@type": "City", name: "Dubai" },
        { "@type": "State", name: "UAE" },
      ],
      serviceArea: {
        "@type": "GeoCircle",
        geoMidpoint: {
          "@type": "GeoCoordinates",
          latitude: 25.2697,
          longitude: 55.3594,
        },
        geoRadius: "50000",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Auto Detailing & Car Care Services Dubai",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Full Detail Package",
              description:
                "Complete exterior & interior treatment — hand wash, clay bar, machine polish, protective coating. Most popular service.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Ceramic Coating Dubai",
              description:
                "Nano-ceramic coating providing 3–5 years of paint protection under Dubai's harsh heat, sand and humidity conditions. 5-year warranty included.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Paint Correction Dubai",
              description:
                "Multi-stage machine polishing to remove swirl marks, scratches and oxidation from your vehicle's paintwork.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Interior Car Detailing Dubai",
              description:
                "Steam cleaning, leather conditioning, full carpet extraction and odour elimination. Complete interior sanitization.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "RTA Inspection Preparation Dubai",
              description:
                "Same-day vehicle preparation for Dubai Roads & Transport Authority (RTA) registration inspection. High first-time pass rate.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Fleet Car Detailing Dubai",
              description:
                "Dedicated corporate fleet detailing packages with volume pricing and flexible scheduling for businesses in Dubai and UAE.",
            },
          },
        ],
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5.0",
        reviewCount: "1200",
        bestRating: "5",
        worstRating: "1",
      },
      image: {
        "@type": "ImageObject",
        url: "https://bakkah.ae/logo.png",
        width: 512,
        height: 512,
      },
      logo: {
        "@type": "ImageObject",
        url: "https://bakkah.ae/logo.png",
        width: 512,
        height: 512,
      },
      sameAs: ["https://wa.me/971545886999"],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+971545886999",
        contactType: "customer service",
        availableLanguage: ["English", "Arabic"],
        contactOption: "TollFree",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://bakkah.ae/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "How long does a full car detail take in Dubai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A complete full detail takes 4–8 hours depending on vehicle size and condition. You can drop off in the morning and collect the same evening with guaranteed quality.",
          },
        },
        {
          "@type": "Question",
          name: "How long does ceramic coating last in Dubai's climate?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Our ceramic coating provides 3–5 years of protection under Dubai conditions including extreme heat, sand and humidity. All ceramic packages include a 5-year warranty backed by our in-house application guarantee.",
          },
        },
        {
          "@type": "Question",
          name: "Can you remove deep scratches and swirl marks from my car?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "In most cases, yes. Our multi-stage machine polishing removes up to 90% of light scratches, swirl marks, and oxidation. We assess your vehicle and give an honest report before starting.",
          },
        },
        {
          "@type": "Question",
          name: "Do you document existing car damage before starting work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absolutely. We conduct a full 360° walkaround with photos uploaded to your digital job card. Complete transparency — you see exactly how your car arrived.",
          },
        },
        {
          "@type": "Question",
          name: "What types of vehicles do you detail in Dubai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "All vehicles — sedans, SUVs, sports cars, and exotics. From daily drivers to Porsche, BMW, Mercedes, Rolls-Royce, and everything in between. Every car gets the same obsessive attention to detail.",
          },
        },
        {
          "@type": "Question",
          name: "How can I track my car while it is being detailed?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Every job gets a unique number (e.g. JC-2025-0001). Track your vehicle's live service status on our Track page at bakkah.ae/track — no login needed. You also receive a WhatsApp update the moment your car is ready for collection.",
          },
        },
        {
          "@type": "Question",
          name: "Where is Bakkah Premium Auto Care located in Dubai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We are located in Al Qusais Industrial Area, Dubai, UAE. Open Monday–Saturday 8:00 AM to 8:00 PM and Sunday 9:00 AM to 5:00 PM. Contact us on WhatsApp at +971 54 588 6999.",
          },
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://bakkah.ae/#website",
      url: "https://bakkah.ae",
      name: "Bakkah Premium Auto Care",
      description:
        "Trusted car detailing, ceramic coating and auto care studio in Al Qusais, Dubai",
      publisher: {
        "@id": "https://bakkah.ae/#business",
      },
      inLanguage: ["en-AE", "ar-AE"],
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://bakkah.ae/track?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://bakkah.ae/#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://bakkah.ae",
        },
      ],
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
