"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Shield,
  Zap,
  Droplets,
  ClipboardCheck,
  Truck,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  ArrowRight,
  Star,
  Car,
  MessageCircle,
  CheckCircle,
  Quote,
  Sun,
  Moon,
  Play,
  ChevronDown,
  Award,
  Clock,
  Users,
  ThumbsUp,
  Eye,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

// ── CMS content types ─────────────────────────────────────────────
type CloudImg = { url: string; public_id: string };
type SiteContent = {
  hero?: { images: CloudImg[] };
  services?: Record<string, CloudImg>;
  gallery?: { images: Array<CloudImg & { alt: string; wide: boolean }> };
  before_after?: { images: Array<CloudImg & { type: "before" | "after" }> };
  strip?: { images: CloudImg[] };
};

// ── Animated Counter ──────────────────────────────────────────
function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let current = 0;
    const steps = 60;
    const increment = value / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else setCount(Math.floor(current));
    }, 2000 / steps);
    return () => clearInterval(timer);
  }, [inView, value]);
  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? "fill-[#6B7A28] text-[#6B7A28]" : "text-gray-300 dark:text-white/15"}`}
        />
      ))}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border-b border-gray-200 dark:border-white/[0.07] transition-colors`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-5 text-left gap-4"
      >
        <span
          className={`text-[15px] font-semibold transition-colors ${open ? "text-[#6B7A28]" : "text-gray-800 dark:text-white/80"}`}
        >
          {q}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#6B7A28] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-gray-500 dark:text-white/45 leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Motion helpers ────────────────────────────────────────────
const easeOut = [0.25, 0.1, 0.25, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.08, ease: easeOut },
  }),
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};


const l = {
  nav: {
    services: 'Services', howItWorks: 'How It Works', reviews: 'Reviews',
    contact: 'Contact', trackVehicle: 'Track Vehicle',
    staffPortal: 'Staff Portal', whatsappUs: 'WhatsApp Us',
  },
  hero: {
    badge: "Dubai's Premier Auto Detailing Studio",
    headline: ['EXCELLENCE', 'IN EVERY', 'DETAIL.'],
    subheadline: "Al Qusais, Dubai's most trusted specialists in ceramic coatings, paint correction, and complete vehicle detailing.",
    subheadline2: '5,000+ happy customers',
    subheadline3: '— and your car is next. 🚗',
    cta_track: 'Track My Vehicle',
    cta_book: 'Book via WhatsApp',
    trust_rating: '5.0 Rating',
    trust_reviews: '1,200+ Google Reviews',
    trust_certified: 'Certified Detailers',
    trust_location: 'Al Qusais, Dubai 🇦🇪',
    scroll: 'Scroll',
  },
  services: {
    eyebrow: 'What We Do Best',
    title: 'OUR SERVICES',
    subtitle: "Professional-grade detailing using the finest imported products and latest techniques. Yes, we're THAT good.",
    items: {
      fullDetail: { title: 'Full Detail Package', tag: 'Most Popular', desc: "Complete exterior & interior treatment — hand wash, clay bar, machine polish, protective coating. Your car walks in. A showstopper drives out." },
      ceramic: { title: 'Ceramic Coating', tag: '5-Year Warranty', desc: "Nano-ceramic bonds directly to your paint for years of brilliant gloss. Water beads off. Dust slides off. Even Dubai sand waves goodbye." },
      paintCorrection: { title: 'Paint Correction', tag: 'Expert Only', desc: "Swirl marks? Scratches? Oxidation? Parking lot regret? We erase it all with multi-stage machine polishing. Like it never happened." },
      interior: { title: 'Interior Detailing', tag: 'Full Sanitize', desc: "Steam clean every crack, condition the leather, extract the carpets, and eliminate every odor. You'll think you bought a new car." },
      rta: { title: 'RTA Inspection Prep', tag: 'Same Day', desc: "First-time pass guaranteed (almost always). We prep your vehicle perfectly for RTA registration — no stress, no re-visits, no drama." },
      fleet: { title: 'Fleet Services', tag: 'B2B', desc: "Got 5 cars? 50 cars? An entire motorcade? Dedicated packages for corporate fleets with flexible scheduling and volume pricing." },
    },
  },
  beforeAfter: {
    eyebrow: 'See The Difference',
    title: 'BEFORE & AFTER',
    subtitle: "We promised results. Here they are. Your car won't recognize itself — and neither will your neighbours.",
    before: 'Before 😩',
    after: 'After ✨',
  },
  features: [
    '100% Hand-Washed', 'Imported Products Only', 'Certified Detailers',
    'Same-Day Service Available', 'Live Job Status Tracking', 'Free Vehicle Inspection',
  ],
  stats: {
    eyebrow: 'Our Track Record',
    title: 'WHY CHOOSE BAKKAH',
    subtitle: "Numbers don't lie. We've been transforming cars since before ceramic coating was even a thing.",
    items: [
      { label: 'Cars Transformed', sub: 'And counting' },
      { label: 'Client Satisfaction', sub: 'Verified reviews' },
      { label: 'Years of Excellence', sub: 'Since 2012' },
      { label: 'Cars Per Month', sub: 'Busy workshop!' },
    ],
  },
  howItWorks: {
    eyebrow: 'Dead Simple Process',
    title: 'HOW IT WORKS',
    subtitle: 'Three steps. One immaculate car. Zero headaches. We promise.',
    bookNow: 'Book Your Appointment Now',
    steps: [
      { title: 'Drop Your Car', desc: "Drive in any time. Our team does a full walkaround, documents every existing scratch (you're covered), and explains exactly what we'll do." },
      { title: 'We Work Our Magic', desc: "Certified detailers go to work with premium imported products and professional equipment. Track live status from your phone the whole time." },
      { title: 'Pick Up & Stare', desc: "Come collect your car. Prepare for a double-take. We guarantee it'll look better than the day you bought it — or we make it right." },
    ],
  },
  trackCta: {
    title: 'TRACK YOUR VEHICLE',
    subtitle: 'Know exactly where your car is in our detailing process. Live status updates from drop-off all the way to delivery — no calls needed.',
    cta: 'Track My Vehicle',
    hint: 'Use your job number (e.g. JC-2025-0001) or your registered phone number',
  },
  reviews: {
    eyebrow: 'Customer Reviews',
    title: 'REAL WORDS. REAL CARS.',
    subtitle: "Don't take our word for it — read what our customers say after picking up their freshly-detailed rides. 🚗✨",
    verified: 'Verified Customer',
    average: 'average',
    from: 'from',
    reviews: 'reviews',
    review: 'review',
  },
  ticker: [
    'CERAMIC COATING', 'PAINT CORRECTION', 'FULL DETAIL', 'INTERIOR DEEP CLEAN',
    'RTA INSPECTION', 'FLEET SERVICES', 'NANO COATING', 'CLAY BAR TREATMENT',
    'STEAM CLEANING', 'SCRATCH REMOVAL',
  ],
  footer: {
    tagline: "Dubai's premier vehicle detailing studio. Excellence in every detail, every time. Your car deserves nothing less. 🏆",
    ratingText: '5.0 on Google',
    chatWhatsApp: 'Chat on WhatsApp',
    ourServices: 'Our Services',
    getInTouch: 'Get In Touch',
    openingHours: 'Opening Hours',
    monSat: 'Mon – Sat: 8:00 AM – 8:00 PM',
    sunday: 'Sunday: 9:00 AM – 5:00 PM',
    copyright: '© 2025 Bakkah Premium Auto Care LLC. All rights reserved. Made with ❤️ in Dubai.',
    trackVehicle: 'Track Vehicle',
    staffLogin: 'Staff Login',
  },
};

const SERVICE_KEYS = [
  "fullDetail",
  "ceramic",
  "paintCorrection",
  "interior",
  "rta",
  "fleet",
] as const;

const WHY_US = [
  {
    icon: Award,
    title: "ASE-Certified Experts",
    desc: "Every technician completes 200+ hours of training before touching your car. Premium products only — we never cut corners.",
  },
  {
    icon: Shield,
    title: "Guaranteed Satisfaction",
    desc: "Not happy? We redo it. Full stop. That's the Bakkah promise — backed by our 98% satisfaction rate across 5,000+ vehicles.",
  },
  {
    icon: Clock,
    title: "Same-Day Turnaround",
    desc: "Drop off in the morning, collect showroom-fresh by evening. We understand Dubai's pace — zero compromises on quality.",
  },
  {
    icon: ThumbsUp,
    title: "Full Transparency",
    desc: "360° photo walkaround before we start. Every scratch documented. Your job status live on your phone the entire time.",
  },
];

const FAQ_ITEMS = [
  {
    q: "How long does a full detail take?",
    a: "A complete full detail takes 4–8 hours depending on vehicle size and condition. We never rush — you can drop off in the morning and collect the same evening with guaranteed quality.",
  },
  {
    q: "How long does ceramic coating last?",
    a: "Our ceramic coating provides 3–5 years of protection under Dubai conditions (heat, sand, humidity). All ceramic packages include a 5-year warranty backed by our in-house application guarantee.",
  },
  {
    q: "Can you remove deep scratches and swirl marks?",
    a: "In most cases, yes. Our multi-stage machine polishing removes up to 90% of light scratches, swirl marks, and oxidation. We assess your vehicle and give an honest report before starting.",
  },
  {
    q: "Do you document existing damage before starting?",
    a: "Absolutely. We conduct a full 360° walkaround with photos uploaded to your digital job card. Complete transparency — you see exactly how your car arrived.",
  },
  {
    q: "What vehicles do you service?",
    a: "All vehicles — sedans, SUVs, sports cars, and exotics. From daily drivers to Porsche, BMW, Mercedes, Rolls-Royce, and everything in between. Every car gets the same obsessive attention.",
  },
  {
    q: "How do I track my car while it's with you?",
    a: "Every job gets a unique number (e.g. JC-2025-0001). Track your vehicle's live service status on our Track page — no login needed. You also get a WhatsApp update the moment your car is ready.",
  },
];

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export default function BakkahHomePage() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [cms, setCms] = useState<SiteContent>({});

  // Load CMS content (non-blocking — falls back to static defaults)
  useEffect(() => {
    fetch("/api/site-content")
      .then((r) => r.json())
      .then((d) => setCms(d as SiteContent))
      .catch(() => { }); // silent — statics remain
  }, []);
  // All images come from CMS only — empty arrays when not yet loaded
  const HERO_IMAGES = cms.hero?.images?.length
    ? cms.hero.images.map((i) => i.url)
    : [];
  const SERVICE_IMAGES = Object.fromEntries(
    SERVICE_KEYS.map((k) => [k, cms.services?.[k]?.url ?? ""]),
  );
  const GALLERY = cms.gallery?.images?.length
    ? cms.gallery.images.map((i) => ({ src: i.url, alt: i.alt, wide: i.wide }))
    : [];
  const PHOTO_STRIP = cms.strip?.images?.length
    ? cms.strip.images.map((i) => i.url)
    : [];
  const BEFORE_AFTER = cms.before_after?.images?.length
    ? cms.before_after.images.map((i) => ({ src: i.url, type: i.type }))
    : [];

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!HERO_IMAGES.length) return;
    const t = setInterval(
      () => setHeroIdx((i) => (i + 1) % HERO_IMAGES.length),
      4000,
    );
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [HERO_IMAGES.length]);

  // Auto-play video when scrolled into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVideoReady(true);
      },
      { threshold: 0.45 },
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/feedback?approved=true")
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.feedback ?? []);
        setReviewsLoaded(true);
      })
      .catch(() => setReviewsLoaded(true));
  }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const SERVICE_LIST = [
    {
      icon: Sparkles,
      emoji: "✨",
      key: "fullDetail",
      ...l.services.items.fullDetail,
    },
    { icon: Shield, emoji: "🛡️", key: "ceramic", ...l.services.items.ceramic },
    {
      icon: Zap,
      emoji: "⚡",
      key: "paintCorrection",
      ...l.services.items.paintCorrection,
    },
    {
      icon: Droplets,
      emoji: "🫧",
      key: "interior",
      ...l.services.items.interior,
    },
    { icon: ClipboardCheck, emoji: "📋", key: "rta", ...l.services.items.rta },
    { icon: Truck, emoji: "🚛", key: "fleet", ...l.services.items.fleet },
  ];
  const STAT_VALUES = [5000, 98, 12, 500];
  const STAT_SUFFIXES = ["+", "%", "+", "+"];

  return (
    <div className="min-h-screen bg-white dark:bg-[#050507] text-gray-900 dark:text-white overflow-x-hidden">
      {/* ── Floating WhatsApp ─────────────────────────────── */}
      <motion.a
        href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+detailing+service+%F0%9F%9A%97"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_32px_rgba(37,211,102,0.45)] hover:shadow-[0_8px_40px_rgba(37,211,102,0.6)] transition-shadow duration-300"
      >
        <MessageCircle className="h-5 w-5 fill-white" />
        <span className="hidden sm:block">{l.nav.whatsappUs}</span>
      </motion.a>

      {/* ── Navbar ──────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled
            ? "bg-white/95 dark:bg-black/85 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.06] shadow-[0_2px_20px_rgba(0,0,0,0.08)]"
            : ""
          }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#top" className="flex items-center gap-3 group select-none">
            <img src="/logo.svg" alt="Bakkah Premium Auto Care Logo" className="h-10 w-10 rounded-full shadow-[0_0_20px_rgba(107,122,40,0.4)] group-hover:shadow-[0_0_30px_rgba(107,122,40,0.6)] transition-all duration-300" />
            <div className="leading-none">
              <p className="font-display text-xl tracking-[0.2em] text-gray-900 dark:text-white leading-none">
                BAKKAH
              </p>
              <p className="text-[9px] tracking-[0.15em] text-gray-400 dark:text-white/30">
                AUTO PREMIUM CARE
              </p>
            </div>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500 dark:text-white/40">
            <a
              href="#services"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {l.nav.services}
            </a>
            <a
              href="#gallery"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Gallery
            </a>
            <a
              href="#how-it-works"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {l.nav.howItWorks}
            </a>
            <a
              href="#reviews"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {l.nav.reviews}
            </a>
            <a
              href="#contact"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {l.nav.contact}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/40 transition hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <Link
              href="/track"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] px-3 py-2 text-xs sm:text-sm font-semibold text-gray-600 dark:text-white/60 hover:border-[#6B7A28]/30 hover:text-[#6B7A28] transition-all duration-200 whitespace-nowrap"
            >
              <Car className="h-3.5 w-3.5" />
              Track Vehicle
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#6B7A28] px-3 py-2 text-xs sm:text-sm font-bold text-black shadow-[0_0_20px_rgba(107,122,40,0.25)] hover:bg-[#C9A227] hover:shadow-[0_0_30px_rgba(107,122,40,0.4)] transition-all duration-200 whitespace-nowrap"
            >
              <span className="hidden sm:inline">{l.nav.staffPortal}</span>
              <span className="sm:hidden">Staff Login</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => setMobileNavOpen(o => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/40 transition hover:bg-gray-100 dark:hover:bg-white/[0.06] md:hidden"
              aria-label="Open menu"
            >
              {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="md:hidden border-t border-gray-200 dark:border-white/[0.06] bg-white/95 dark:bg-black/90 backdrop-blur-xl px-5 pb-4 pt-3 space-y-1"
            >
              {[
                { href: '#services', label: l.nav.services },
                { href: '#gallery', label: 'Gallery' },
                { href: '#how-it-works', label: l.nav.howItWorks },
                { href: '#reviews', label: l.nav.reviews },
                { href: '#contact', label: l.nav.contact },
              ].map(({ href, label }) => (
                <a key={href} href={href} onClick={() => setMobileNavOpen(false)}
                  className="flex items-center py-2.5 text-sm font-medium text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {label}
                </a>
              ))}
              <div className="pt-2 flex flex-col gap-2 border-t border-gray-100 dark:border-white/[0.06]">
                <Link href="/track" onClick={() => setMobileNavOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-white/[0.08] px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-white/60 hover:border-[#6B7A28]/30 hover:text-[#6B7A28] transition-all">
                  <Car className="h-4 w-4" />
                  Track Vehicle
                </Link>
                <Link href="/auth/login" onClick={() => setMobileNavOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#6B7A28] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#C9A227] transition-all">
                  {l.nav.staffPortal}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ══════════════════════════════════════════════════════
          HERO — Cinematic full-screen with image slideshow
      ══════════════════════════════════════════════════════ */}
      <section
        id="top"
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-16 text-center"
      >
        {/* Background image slideshow */}
        {HERO_IMAGES?.map((src, i) => (
          <motion.div
            key={src}
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: heroIdx === i ? 1 : 0 }}
            transition={{ duration: 1.5 }}
          >
            <img
              src={src}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-white dark:from-black/70 dark:via-black/50 dark:to-[#050507]" />
          </motion.div>
        ))}

        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />

        {/* Glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[320px] w-[320px] sm:h-[700px] sm:w-[700px] rounded-full bg-[#6B7A28]/[0.06] dark:bg-[#6B7A28]/[0.08] blur-[80px] sm:blur-[150px] animate-pulse-slow" />
        </div>

        <div className="relative z-10 max-w-5xl w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#6B7A28]/25 bg-[#6B7A28]/10 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B7A28]"
          >
            <Star className="h-3 w-3 fill-[#6B7A28]" />
            {l.hero.badge}
            <Star className="h-3 w-3 fill-[#6B7A28]" />
          </motion.div>

          {l.hero.headline.map((word, i) => (
            <div key={i} className="overflow-hidden">
              <motion.h1
                initial={{ y: 110, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.7,
                  delay: 0.2 + i * 0.1,
                  ease: easeOut,
                }}
                className={`font-display leading-[0.88] tracking-[0.05em] text-[clamp(3.2rem,10.5vw,8.5rem)] ${i === 1 ? "text-[#6B7A28]" : "text-gray-900 dark:text-white"}`}
              >
                {word}
              </motion.h1>
            </div>
          ))}

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="mx-auto mt-8 max-w-lg text-[15px] leading-relaxed text-gray-600 dark:text-white/60 sm:text-base"
          >
            {l.hero.subheadline}{" "}
            <span className="text-gray-800 dark:text-white/85 font-semibold">
              {l.hero.subheadline2}
            </span>{" "}
            {l.hero.subheadline3}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+detailing+service"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-7 py-3.5 text-sm font-semibold text-[#25D366] transition-all duration-300 hover:border-[#25D366]/50 hover:bg-[#25D366]/20 hover:scale-[1.02]"
            >
              <MessageCircle className="h-4 w-4" />
              {l.hero.cta_book}
            </a>
            <Link
              href="/track"
              className="inline-flex items-center gap-3 rounded-xl border border-gray-300 dark:border-white/[0.12] bg-white/80 dark:bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-gray-700 dark:text-white/70 transition-all duration-300 hover:border-[#6B7A28]/30 hover:text-[#6B7A28] hover:scale-[1.02]"
            >
              <Car className="h-4 w-4" />
              {l.hero.cta_track}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-5 text-xs text-gray-500 dark:text-white/35"
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-[#6B7A28] text-[#6B7A28]"
                  />
                ))}
              </div>
              <span>{l.hero.trust_rating}</span>
            </div>
            <div className="h-3 w-px bg-gray-300 dark:bg-white/10" />
            <span>{l.hero.trust_reviews}</span>
            <div className="h-3 w-px bg-gray-300 dark:bg-white/10" />
            <span>{l.hero.trust_certified}</span>
            <div className="h-3 w-px bg-gray-300 dark:bg-white/10" />
            <span>{l.hero.trust_location}</span>
          </motion.div>

          {/* Slide indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 flex items-center justify-center gap-2"
          >
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${heroIdx === i ? "w-8 bg-[#6B7A28]" : "w-2 bg-gray-400/40 dark:bg-white/20 hover:bg-[#6B7A28]/50"}`}
              />
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] uppercase tracking-[0.25em] text-gray-400 dark:text-white/20">
            {l.hero.scroll}
          </span>
          <div className="scroll-bob h-10 w-px bg-gradient-to-b from-[#6B7A28]/40 to-transparent" />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PHOTO STRIP — Scrolling photo marquee
      ══════════════════════════════════════════════════════ */}
      <div className="overflow-hidden py-6 bg-gray-50 dark:bg-white/[0.02] border-y border-gray-100 dark:border-white/[0.04]">
        <div
          className="flex animate-ticker gap-4"
          style={{ animationDuration: "30s" }}
        >
          {[...PHOTO_STRIP, ...PHOTO_STRIP].map((src, i) => (
            <div
              key={i}
              className="shrink-0 overflow-hidden rounded-xl w-[280px] h-[170px] border border-gray-200 dark:border-white/[0.06]"
            >
              <img
                src={src}
                alt="Car detailing work by Bakkah Auto Care Dubai"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Service ticker ──────────────────────────────── */}
      <div className="overflow-hidden border-b border-[#6B7A28]/10 bg-brand-50/50 dark:bg-[#6B7A28]/[0.03] py-4">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...l.ticker, ...l.ticker].map((item, i) => (
            <span key={i} className="inline-flex shrink-0 items-center px-8">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#6B7A28]/70 dark:text-[#6B7A28]/60">
                {item}
              </span>
              <span className="ml-8 text-[#6B7A28]/30 dark:text-[#6B7A28]/25 text-xs">
                ◆
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SERVICES — Cards with real images
      ══════════════════════════════════════════════════════ */}
      <section
        id="services"
        className="relative overflow-hidden px-5 py-28 lg:px-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(107,122,40,0.04),transparent)]" />
        <div className="mx-auto max-w-7xl relative">
          <div className="mb-16 text-center">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#6B7A28]"
            >
              {l.services.eyebrow}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="font-display text-[clamp(2.2rem,5.5vw,4rem)] tracking-[0.05em] text-gray-900 dark:text-white"
            >
              {l.services.title}
            </motion.h2>
            <motion.div
              variants={fadeUp}
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="mx-auto mt-3 h-px w-20 bg-gradient-to-r from-transparent via-[#6B7A28] to-transparent"
            />
            <motion.p
              variants={fadeUp}
              custom={3}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="mx-auto mt-5 max-w-md text-sm text-gray-500 dark:text-white/38 leading-relaxed"
            >
              {l.services.subtitle}
            </motion.p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SERVICE_LIST.map((s) => (
              <motion.div
                key={s.title}
                variants={fadeUp}
                whileHover={{ y: -10, transition: { duration: 0.22 } }}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] cursor-default transition-all duration-300 hover:border-[#6B7A28]/25 hover:shadow-[0_20px_60px_rgba(107,122,40,0.1)] shadow-sm dark:shadow-none"
              >
                {/* Service image */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#6B7A28]/10 to-[#6B7A28]/5">
                  {SERVICE_IMAGES[s.key] && (
                    <img
                      src={SERVICE_IMAGES[s.key]}
                      alt={`${s.title} — Bakkah Auto Care Dubai`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full border border-[#6B7A28]/40 bg-[#6B7A28]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black backdrop-blur-sm">
                      {s.tag}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-xl">{s.emoji}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <s.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                {/* Content */}
                <div className="p-6">
                  <h3 className="mb-2 text-[15px] font-bold text-gray-900 dark:text-white">
                    {s.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">
                    {s.desc}
                  </p>
                  <a
                    href="https://wa.me/971545886999?text=Hi+Bakkah!+I'm+interested+in+your+detailing+services"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7A28] hover:gap-3 transition-all duration-200"
                  >
                    Book this service <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHY CHOOSE BAKKAH
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-y border-gray-100 dark:border-white/[0.05] px-5 py-24 lg:px-8 bg-gray-50/80 dark:bg-[#6B7A28]/[0.02]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(107,122,40,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(107,122,40,0.012)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="mx-auto max-w-7xl relative">
          <div className="mb-16 text-center">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#6B7A28]"
            >
              Why Choose Us
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white"
            >
              THE BAKKAH DIFFERENCE
            </motion.h2>
            <motion.div
              variants={fadeUp}
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto mt-3 h-px w-20 bg-gradient-to-r from-transparent via-[#6B7A28] to-transparent"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-7 hover:border-[#6B7A28]/20 hover:shadow-[0_16px_50px_rgba(107,122,40,0.08)] transition-all duration-300 shadow-sm dark:shadow-none text-center"
              >
                <div className="mb-5 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#6B7A28]/20 bg-[#6B7A28]/10 group-hover:bg-[#6B7A28]/15 group-hover:border-[#6B7A28]/30 transition-colors duration-300">
                  <item.icon className="h-6 w-6 text-[#6B7A28]" />
                </div>
                <h3 className="mb-3 text-[15px] font-bold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Trust strip */}
          <motion.div
            variants={fadeUp}
            custom={4}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
          >
            {[
              "✅ Free condition report before every job",
              "✅ No hidden charges — ever",
              "✅ Live job tracking via phone",
              "✅ Satisfaction guaranteed or we redo it",
            ].map((item) => (
              <span
                key={item}
                className="text-sm font-medium text-gray-600 dark:text-white/50"
              >
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BEFORE / AFTER
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-5 py-24 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(107,122,40,0.025),transparent)]" />
        <div className="mx-auto max-w-6xl relative">
          <div className="mb-14 text-center">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#6B7A28]"
            >
              {l.beforeAfter.eyebrow}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white"
            >
              {l.beforeAfter.title}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto mt-4 max-w-md text-sm text-gray-500 dark:text-white/40"
            >
              {l.beforeAfter.subtitle}
            </motion.p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {BEFORE_AFTER.map((item, i) => ({
              ...item,
              label:
                item.type === "before"
                  ? l.beforeAfter.before
                  : l.beforeAfter.after,
            })).map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i * 0.5}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.06] group aspect-[3/4]"
              >
                <img
                  src={item.src}
                  alt={
                    item.type === "before"
                      ? "Car before detailing — Al Qusais Dubai"
                      : "Car after detailing — Bakkah Premium Auto Care Dubai"
                  }
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${item.type === "before" ? "brightness-[0.7] saturate-50" : ""}`}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span
                    className={`rounded-lg backdrop-blur-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${item.type === "before"
                        ? "bg-red-500/80 text-white"
                        : "bg-[#6B7A28]/90 text-black"
                      }`}
                  >
                    {item.label}
                  </span>
                </div>
                {item.type === "after" && (
                  <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#6B7A28]/90">
                    <Sparkles className="h-3.5 w-3.5 text-black" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            {l.features.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/45"
              >
                <CheckCircle className="h-4 w-4 text-[#6B7A28] shrink-0" />
                <span>{tag}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          GALLERY — Masonry photo grid
      ══════════════════════════════════════════════════════ */}
      <section
        id="gallery"
        className="relative overflow-hidden px-5 py-24 lg:px-8 bg-gray-50/50 dark:bg-transparent"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#6B7A28]"
            >
              Our Work
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white"
            >
              RESULTS THAT SPEAK
            </motion.h2>
            <motion.div
              variants={fadeUp}
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto mt-3 h-px w-20 bg-gradient-to-r from-transparent via-[#6B7A28] to-transparent"
            />
            <motion.p
              variants={fadeUp}
              custom={3}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto mt-4 max-w-md text-sm text-gray-500 dark:text-white/38"
            >
              Real cars. Real results. Every transformation documented. This is
              what happens when professionals obsess over details.
            </motion.p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-[200px]"
          >
            {GALLERY.map((photo, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.06] cursor-zoom-in ${photo.wide ? "col-span-2" : ""}`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-3 left-3 right-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                  <p className="text-xs font-semibold text-white truncate">
                    {photo.alt}
                  </p>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                    <Eye className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={4}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-10 text-center"
          >
            <a
              href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+see+more+of+your+work"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#6B7A28]/25 bg-[#6B7A28]/10 px-6 py-3 text-sm font-semibold text-[#6B7A28] hover:bg-[#6B7A28]/20 hover:border-[#6B7A28]/40 transition-all duration-200"
            >
              <MessageCircle className="h-4 w-4" /> See more of our work on WhatsApp
            </a>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          VIDEO SHOWCASE
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#6B7A28]"
            >
              Watch Us Work
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white"
            >
              SEE THE MAGIC HAPPEN
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto mt-4 max-w-md text-sm text-gray-500 dark:text-white/38"
            >
              Watch our team transform a car from dusty and dull to a gleaming
              showroom finish. Every step. Every detail.
            </motion.p>
          </div>

          <motion.div
            ref={videoRef}
            variants={fadeUp}
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/[0.08] shadow-[0_20px_80px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.5)] aspect-video bg-black"
          >
            {!videoReady && (
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#6B7A28] shadow-[0_0_50px_rgba(107,122,40,0.6)] border-4 border-white/20 animate-pulse">
                    <Play className="h-8 w-8 text-black fill-black ml-1" />
                  </div>
                  <p className="text-white/70 text-sm">
                    Scroll down a little — video auto-plays
                  </p>
                </div>
              </div>
            )}

            {videoReady && (
              <iframe
                src="https://www.youtube.com/embed/dU9mC9wKblI?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=dU9mC9wKblI"
                title="Professional Car Detailing — Bakkah Premium Auto Care Dubai"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}

            {videoReady && (
              <div className="absolute top-4 left-4 pointer-events-none">
                <span className="rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                  🔇 Use player controls to unmute
                </span>
              </div>
            )}

            <div className="absolute top-4 right-4 pointer-events-none">
              <span className="rounded-full bg-[#6B7A28]/90 px-3 py-1 text-[11px] font-bold text-black uppercase tracking-wider">
                🎬 Auto Detailing
              </span>
            </div>
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-4 text-center text-xs text-gray-400 dark:text-white/25"
          >
            Professional car detailing — ceramic coating, paint correction &
            interior deep clean
          </motion.p>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section
        id="why-bakkah"
        className="relative overflow-hidden border-y border-gray-100 dark:border-white/[0.05] px-5 py-24 lg:px-8 bg-gray-50/50 dark:bg-transparent"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(107,122,40,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(107,122,40,0.015)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="mx-auto max-w-5xl relative">
          <div className="mb-14 text-center">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#6B7A28]"
            >
              {l.stats.eyebrow}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white"
            >
              {l.stats.title}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto mt-4 max-w-sm text-sm text-gray-500 dark:text-white/38"
            >
              {l.stats.subtitle}
            </motion.p>
          </div>
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
            {l.stats.items.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                custom={i * 0.7}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="font-display text-[clamp(2.8rem,5.5vw,4.5rem)] text-[#6B7A28] leading-none tracking-wide">
                  <Counter value={STAT_VALUES[i]} suffix={STAT_SUFFIXES[i]} />
                </p>
                <p className="mt-2 text-sm font-bold text-gray-700 dark:text-white/70">
                  {stat.label}
                </p>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-white/25">
                  {stat.sub}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section
        id="how-it-works"
        className="relative overflow-hidden px-5 py-28 lg:px-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(107,122,40,0.03),transparent)]" />
        <div className="mx-auto max-w-5xl relative">
          <div className="mb-16 text-center">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#6B7A28]"
            >
              {l.howItWorks.eyebrow}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white"
            >
              {l.howItWorks.title}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto mt-4 max-w-md text-sm text-gray-500 dark:text-white/38"
            >
              {l.howItWorks.subtitle}
            </motion.p>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 relative">
            <div className="absolute top-14 left-[calc(33.33%+16px)] right-[calc(33.33%+16px)] hidden lg:block h-px bg-gradient-to-r from-[#6B7A28]/30 via-[#6B7A28]/15 to-[#6B7A28]/30" />
            {l.howItWorks.steps.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group relative rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-8 hover:border-[#6B7A28]/20 hover:bg-brand-50/40 dark:hover:bg-[#6B7A28]/[0.02] transition-all duration-300 shadow-sm dark:shadow-none"
              >
                <div className="mb-6 flex items-center gap-4">
                  <span className="font-display text-[2.5rem] leading-none text-[#6B7A28]/20 group-hover:text-[#6B7A28]/40 transition-colors duration-300">
                    0{i + 1}
                  </span>
                  <span className="text-4xl">{["🚗", "✨", "🤩"][i]}</span>
                </div>
                <h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <a
              href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+detailing+service"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-8 py-4 text-sm font-bold text-[#25D366] transition-all duration-300 hover:border-[#25D366]/50 hover:bg-[#25D366]/20 hover:scale-[1.02]"
            >
              <MessageCircle className="h-5 w-5" />
              {l.howItWorks.bookNow}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TRACK YOUR VEHICLE CTA
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-5 py-20 lg:px-8 bg-[#6B7A28]/[0.04] dark:bg-[#6B7A28]/[0.06] border-y border-[#6B7A28]/10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(107,122,40,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(107,122,40,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="mx-auto max-w-3xl relative text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#6B7A28]/25 bg-[#6B7A28]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B7A28]"
          >
            <Car className="h-3 w-3" />
            Live Status
          </motion.div>
          <motion.h2
            variants={fadeUp}
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white"
          >
            {l.trackCta.title}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto mt-4 max-w-lg text-sm text-gray-500 dark:text-white/45 leading-relaxed"
          >
            {l.trackCta.subtitle}
          </motion.p>
          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/track"
              className="inline-flex items-center gap-3 rounded-xl bg-[#6B7A28] px-8 py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(107,122,40,0.3)] hover:bg-[#C9A227] hover:shadow-[0_0_40px_rgba(107,122,40,0.5)] transition-all duration-300 hover:scale-[1.02]"
            >
              <Car className="h-5 w-5" />
              {l.trackCta.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.p
            variants={fadeUp}
            custom={4}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-4 text-xs text-gray-400 dark:text-white/25"
          >
            {l.trackCta.hint}
          </motion.p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-5 py-24 lg:px-8 bg-gray-50/50 dark:bg-transparent">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#6B7A28]"
            >
              Common Questions
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white"
            >
              EVERYTHING YOU NEED TO KNOW
            </motion.h2>
            <motion.div
              variants={fadeUp}
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto mt-3 h-px w-20 bg-gradient-to-r from-transparent via-[#6B7A28] to-transparent"
            />
          </div>

          <motion.div
            variants={fadeUp}
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] px-7 shadow-sm dark:shadow-none"
          >
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-8 text-center text-sm text-gray-500 dark:text-white/40"
          >
            Still have questions?{" "}
            <a
              href="https://wa.me/971545886999?text=Hi+Bakkah!+I+have+a+question"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#6B7A28] hover:underline"
            >
              Chat with us on WhatsApp
            </a>
          </motion.p>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────── */}
      {reviewsLoaded && reviews.length > 0 && (
        <section
          id="reviews"
          className="relative overflow-hidden px-5 py-28 lg:px-8"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(107,122,40,0.025),transparent)]" />
          <div className="mx-auto max-w-7xl relative">
            <div className="mb-14 text-center">
              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#6B7A28]"
              >
                {l.reviews.eyebrow}
              </motion.p>
              <motion.h2
                variants={fadeUp}
                custom={1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white"
              >
                {l.reviews.title}
              </motion.h2>
              <motion.p
                variants={fadeUp}
                custom={2}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="mx-auto mt-4 max-w-md text-sm text-gray-500 dark:text-white/38"
              >
                {l.reviews.subtitle}
              </motion.p>
            </div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={stagger}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {reviews.slice(0, 6).map((r) => (
                <motion.div
                  key={r.id}
                  variants={fadeUp}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="relative rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6 hover:border-[#6B7A28]/15 hover:bg-brand-50/30 dark:hover:bg-[#6B7A28]/[0.02] transition-all duration-300 shadow-sm dark:shadow-none"
                >
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-[#6B7A28]/10" />
                  <StarRow rating={r.rating} />
                  {r.comment && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-white/55 leading-relaxed line-clamp-4">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6B7A28]/15 text-sm font-bold text-[#6B7A28] shrink-0">
                      {r.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/80">
                        {r.customer_name}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-white/25">
                        {l.reviews.verified}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            {avgRating && reviews.length >= 3 && (
              <motion.div
                variants={fadeUp}
                custom={4}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="mt-10 text-center"
              >
                <div className="inline-flex items-center gap-3 rounded-xl border border-[#6B7A28]/15 bg-[#6B7A28]/[0.05] px-6 py-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-[#6B7A28] text-[#6B7A28]"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {avgRating} {l.reviews.average}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-white/40">
                    {l.reviews.from} {reviews.length}{" "}
                    {reviews.length !== 1
                      ? l.reviews.reviews
                      : l.reviews.review}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────── */}
      <footer
        id="contact"
        className="border-t border-gray-100 dark:border-white/[0.06] px-5 py-16 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 mb-14">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <img src="/logo.svg" alt="Bakkah Premium Auto Care" className="h-10 w-10 rounded-full shadow-[0_0_20px_rgba(107,122,40,0.35)]" />
                <div className="leading-none">
                  <p className="font-display text-xl tracking-[0.2em] text-gray-900 dark:text-white leading-none">
                    BAKKAH
                  </p>
                  <p className="text-[9px] tracking-[0.15em] text-gray-400 dark:text-white/30">
                    AUTO PREMIUM CARE
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-white/38 leading-relaxed max-w-xs">
                {l.footer.tagline}
              </p>
              <div className="mt-5 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-[#6B7A28] text-[#6B7A28]"
                  />
                ))}
                <span className="ml-2 text-xs text-gray-400 dark:text-white/30">
                  {l.footer.ratingText}
                </span>
              </div>
              <div className="mt-5">
                <a
                  href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#25D366]/15 border border-[#25D366]/25 px-4 py-2.5 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/25 transition-colors duration-200"
                >
                  <MessageCircle className="h-4 w-4" />
                  {l.footer.chatWhatsApp}
                </a>
              </div>
            </div>

            <div>
              <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 dark:text-white/25">
                {l.footer.ourServices}
              </h4>
              <ul className="space-y-3">
                {SERVICE_LIST.map((s) => (
                  <li
                    key={s.title}
                    className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-white/38"
                  >
                    <span className="text-base shrink-0">{s.emoji}</span>
                    {s.title}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 dark:text-white/25">
                {l.footer.getInTouch}
              </h4>
              <ul className="space-y-4">
                {[
                  {
                    icon: MapPin,
                    text: "Al Qusais Industrial Area\nDubai, UAE 🇦🇪",
                  },
                  { icon: Phone, text: "+971 54 588 6999" },
                  { icon: Mail, text: "info@bakkah.ae" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#6B7A28]/15 bg-[#6B7A28]/10">
                      <Icon className="h-3.5 w-3.5 text-[#6B7A28]" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-white/38 leading-relaxed whitespace-pre-line">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/25 mb-2">
                  {l.footer.openingHours}
                </p>
                <p className="text-sm text-gray-500 dark:text-white/50">
                  {l.footer.monSat}
                </p>
                <p className="text-sm text-gray-500 dark:text-white/50">
                  {l.footer.sunday}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 dark:border-white/[0.05] pt-8 sm:flex-row">
            <p className="text-xs text-gray-400 dark:text-white/20">
              {l.footer.copyright}
            </p>
            <div className="flex items-center gap-5">
              <Link
                href="/track"
                className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-white/20 hover:text-gray-600 dark:hover:text-white/50 transition-colors"
              >
                {l.footer.trackVehicle}
                <ChevronRight className="h-3 w-3" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-white/20 hover:text-gray-600 dark:hover:text-white/50 transition-colors"
              >
                {l.footer.staffLogin}
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
