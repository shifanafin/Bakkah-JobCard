// ── Hero section image paths ───────────────────────────────────
// Single source of truth for every image the hero renders. Drop the
// real files into /public/images/hero/ using these exact names and
// the components pick them up automatically — no other file changes.

export const HERO_IMAGES = {
  heroCar: {
    src: "/images/hero/hero-car.jpg",
    alt: "{{Alt text for the main hero vehicle image}}",
  },
  workshop: {
    src: "/images/hero/workshop-bay.jpg",
    alt: "{{Alt text for the workshop bay image}}",
  },
  mechanic: {
    src: "/images/hero/mechanic-portrait.jpg",
    alt: "{{Alt text for the mechanic/technician image}}",
  },
  backgroundTexture: {
    src: "/images/hero/background-texture.jpg",
    alt: "",
  },
} as const;
