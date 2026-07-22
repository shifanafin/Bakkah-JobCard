// ── Hero section dummy content ─────────────────────────────────
// Every piece of copy the hero renders lives here. Replace the
// {{placeholder}} strings with real content when it's ready — no
// component file needs to change.

export type HeroStat = {
  id: string;
  icon: "users" | "star" | "shield" | "clock";
  value: number;
  suffix: string;
  label: string;
};

export const heroData = {
  badge: "{{Badge Label}}",

  heading: {
    lines: ["{{Heading Line One}}", "{{Heading Line Two}}"],
  },

  description: "{{Hero description paragraph — one or two sentences about the workshop's positioning and craft.}}",

  contact: {
    phone: "{{Phone}}",
    address: "{{Address}}",
  },

  cta: {
    primary: { label: "{{Primary CTA}}", href: "#" },
    secondary: { label: "{{Secondary CTA}}", href: "#" },
  },

  stats: [
    { id: "stat-clients", icon: "users", value: 500, suffix: "+", label: "{{Stat 1 Label}}" },
    { id: "stat-rating", icon: "star", value: 4.9, suffix: "/5", label: "{{Stat 2 Label}}" },
    { id: "stat-satisfaction", icon: "shield", value: 98, suffix: "%", label: "{{Stat 3 Label}}" },
    { id: "stat-experience", icon: "clock", value: 12, suffix: "yrs", label: "{{Stat 4 Label}}" },
  ] as HeroStat[],

  cards: {
    workshop: {
      title: "{{Workshop Card Title}}",
      description: "{{Workshop card description}}",
    },
    mechanic: {
      title: "{{Mechanic Card Title}}",
      description: "{{Mechanic card description}}",
    },
  },

  testimonial: {
    name: "{{Customer Name}}",
    role: "{{Customer Role}}",
    quote: "{{Testimonial quote placeholder}}",
    rating: 5,
  },
} as const;
