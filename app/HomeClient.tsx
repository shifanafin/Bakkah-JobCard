"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Sparkles, Shield, Zap, Droplets, ClipboardCheck, Truck,
  MapPin, Phone, Mail, ChevronRight, ArrowRight, Star,
  Car, MessageCircle, CheckCircle, Quote, Sun, Moon,
  Play, ChevronDown, Award, Clock, ThumbsUp, Eye, Menu, X,
  BadgeCheck, Gem, Users, Navigation,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import ChatWidget from "@/components/ChatWidget";

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
      if (current >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 2000 / steps);
    return () => clearInterval(timer);
  }, [inView, value]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? "fill-[#C9A227] text-[#C9A227]" : "text-gray-300 dark:text-white/15"}`} />
      ))}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 dark:border-white/[0.06]">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between py-5 text-left gap-4 group">
        <span className={`text-[15px] font-semibold transition-colors leading-snug ${open ? "text-[#C9A227]" : "text-gray-800 dark:text-white/80 group-hover:text-[#C9A227]"}`}>
          {q}
        </span>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${open ? "border-[#C9A227] bg-[#C9A227]/15 rotate-180" : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04]"}`}>
          <ChevronDown className={`h-4 w-4 transition-colors ${open ? "text-[#C9A227]" : "text-gray-400 dark:text-white/40"}`} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <p className="pb-5 text-sm text-gray-500 dark:text-white/45 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const easeOut = [0.25, 0.1, 0.25, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: easeOut } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ── Content ────────────────────────────────────────────────────
const SERVICE_KEYS = ["fullDetail", "ceramic", "paintCorrection", "interior", "fleet"] as const;

const SERVICES = [
  {
    icon: Sparkles, emoji: "✨", key: "fullDetail",
    title: "Full Detail Package", tag: "Most Popular",
    desc: "Complete exterior & interior treatment — hand wash, clay bar, machine polish, protective coating. Your car walks in. A showstopper drives out.",
  },
  {
    icon: Shield, emoji: "🛡️", key: "ceramic",
    title: "Ceramic Coating", tag: "5-Year Warranty",
    desc: "Nano-ceramic bonds directly to your paint for years of brilliant gloss. Water beads off. Dubai sand waves goodbye. 3–5 year durability guaranteed.",
  },
  {
    icon: Zap, emoji: "⚡", key: "paintCorrection",
    title: "Paint Correction", tag: "Expert Only",
    desc: "Swirl marks? Scratches? Oxidation? We erase it all with multi-stage machine polishing. Removes up to 90% of defects. Like it never happened.",
  },
  {
    icon: Droplets, emoji: "🫧", key: "interior",
    title: "Interior Detailing", tag: "Full Sanitize",
    desc: "Steam clean every crack, condition the leather, extract the carpets, eliminate every odour. You'll think you bought a new car.",
  },
  {
    icon: Truck, emoji: "🚛", key: "fleet",
    title: "Fleet Services", tag: "Corporate B2B",
    desc: "Got 5 cars? 50? An entire motorcade? Dedicated packages for corporate fleets with flexible scheduling and tailored plans.",
  },
];

const WHY_US = [
  { icon: Award, title: "Certified Specialists", desc: "Every technician completes 200+ hours of training before touching your vehicle. Premium imported products — we never cut corners." },
  { icon: Shield, title: "Satisfaction Guaranteed", desc: "Not happy? We redo it. Full stop. That's the Bakkah promise — backed by our 98% satisfaction rate across 5,000+ vehicles." },
  { icon: Clock, title: "Same-Day Turnaround", desc: "Drop off in the morning, collect showroom-fresh by evening. We understand Dubai's pace — zero compromises on quality." },
  { icon: ThumbsUp, title: "Full Transparency", desc: "360° photo walkaround before we start. Every scratch documented. Your job status live on your phone the entire time." },
];

const FAQ_ITEMS = [
  { q: "How long does a full car detail take?", a: "A complete full detail takes 4–8 hours depending on vehicle size and condition. You can drop off in the morning and collect the same evening with guaranteed quality." },
  { q: "How long does ceramic coating last in Dubai?", a: "Our ceramic coating provides 3–5 years of protection under Dubai conditions (heat, sand, humidity). All ceramic packages include a 5-year warranty backed by our in-house application guarantee." },
  { q: "Can you remove deep scratches and swirl marks?", a: "In most cases, yes. Our multi-stage machine polishing removes up to 90% of light scratches, swirl marks, and oxidation. We give you an honest assessment before starting." },
  { q: "Do you document existing damage before starting?", a: "Absolutely. We conduct a full 360° walkaround with photos uploaded to your digital job card — complete transparency on how your car arrived." },
  { q: "What vehicles do you service?", a: "All vehicles — sedans, SUVs, sports cars, and exotics. Daily drivers to Porsche, BMW, Mercedes, Rolls-Royce, and everything in between." },
  { q: "How do I track my car while it's with you?", a: "Every job gets a unique number (e.g. JC-2025-0001). Track live status on our Track page — no login needed. You also get a WhatsApp update the moment your car is ready." },
  { q: "Where are you located in Dubai?", a: "We're in Al Qusais Industrial Area, Dubai. Open Monday–Saturday 8 AM–8 PM and Sunday 9 AM–5 PM. WhatsApp us at +971 54 588 6999 for directions." },
];

const TICKER = ["CERAMIC COATING", "PAINT CORRECTION", "FULL DETAIL", "INTERIOR DEEP CLEAN", "FLEET SERVICES", "NANO COATING", "CLAY BAR TREATMENT", "STEAM CLEANING", "SCRATCH REMOVAL", "PPF PROTECTION"];

type Review = { id: string; customer_name: string; rating: number; comment: string | null; created_at: string };

// ── Gold gradient text helper (applied via className) ─────────
const goldGrad = "bg-gradient-to-r from-[#C9A227] via-[#f0d060] to-[#C9A227] bg-clip-text text-transparent";
const goldBtn = "inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#d4ab2a] px-7 py-3.5 text-sm font-bold text-black shadow-[0_4px_24px_rgba(201,162,39,0.4)] hover:shadow-[0_4px_32px_rgba(201,162,39,0.6)] hover:scale-[1.02] transition-all duration-300";

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

  useEffect(() => {
    fetch("/api/site-content").then(r => r.json()).then(d => setCms(d as SiteContent)).catch(() => { });
  }, []);

  const HERO_IMAGES = cms.hero?.images?.length ? cms.hero.images.map(i => i.url) : [];
  const SERVICE_IMGS = Object.fromEntries(SERVICE_KEYS.map(k => [k, cms.services?.[k]?.url ?? ""]));
  const GALLERY = cms.gallery?.images?.length ? cms.gallery.images.map(i => ({ src: i.url, alt: i.alt, wide: i.wide })) : [];
  const PHOTO_STRIP = cms.strip?.images?.length ? cms.strip.images.map(i => i.url) : [];
  const BEFORE_AFTER = cms.before_after?.images?.length ? cms.before_after.images.map(i => ({ src: i.url, type: i.type })) : [];

  useEffect(() => { const fn = () => setScrolled(window.scrollY > 40); window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn); }, []);
  useEffect(() => { if (!HERO_IMAGES.length) return; const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 4500); return () => clearInterval(t); }, [HERO_IMAGES.length]); // eslint-disable-line
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVideoReady(true); }, { threshold: 0.4 });
    if (videoRef.current) obs.observe(videoRef.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    fetch("/api/feedback?approved=true").then(r => r.json()).then(d => { setReviews(d.feedback ?? []); setReviewsLoaded(true); }).catch(() => setReviewsLoaded(true));
  }, []);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#050507] text-gray-900 dark:text-white overflow-x-hidden pb-[72px] sm:pb-0">

      {/* ── Floating WhatsApp ──────────────────────────────── */}
      <motion.a
        href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+service+%F0%9F%9A%97"
        target="_blank" rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.8, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-50 hidden sm:flex items-center gap-2.5 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_32px_rgba(37,211,102,0.5)] hover:shadow-[0_8px_40px_rgba(37,211,102,0.7)] transition-shadow duration-300"
      >
        <MessageCircle className="h-5 w-5 fill-white" />
        <span className="hidden sm:block">WhatsApp Us</span>
      </motion.a>
      {/* ── Navbar ─────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -72, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "bg-white/96 dark:bg-[#050507]/92 backdrop-blur-2xl border-b border-gray-200 dark:border-white/[0.07] shadow-[0_2px_24px_rgba(0,0,0,0.1)]" : ""
          }`}
      >
        {/* Announcement bar */}
        <div className="bg-[#C9A227] px-4 py-1.5 text-center text-[11px] font-bold text-black flex items-center justify-center flex-wrap gap-x-4 gap-y-0.5">
          <span>⏰ Open Today: 8 AM – 8 PM</span>
          <span className="hidden sm:inline h-3 w-px bg-black/20" />
          <a href="tel:+971545886999" className="hover:underline">📞 +971 54 588 6999</a>
          <span className="hidden sm:inline h-3 w-px bg-black/20" />
          <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book" target="_blank" rel="noopener noreferrer" className="hover:underline">💬 WhatsApp to Book Now →</a>
        </div>

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          {/* Logo */}
          <a href="#top" className="flex items-center gap-3 group select-none">
            <div className="relative">
              <img src="/logo.svg" alt="Bakkah Premium Auto Care" className="h-10 w-10 rounded-full transition-all duration-300 group-hover:shadow-[0_0_24px_rgba(201,162,39,0.5)]" />
            </div>
            <div className="leading-none">
              <p className="font-display text-xl tracking-[0.22em] text-gray-900 dark:text-white leading-none">BAKKAH</p>
              <p className="text-[8px] tracking-[0.18em] text-[#C9A227]/80 uppercase font-medium">PREMIUM AUTO CARE</p>
            </div>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-500 dark:text-white/45">
            {[["#services", "Services"], ["#gallery", "Gallery"], ["#how-it-works", "How It Works"], ["#reviews", "Reviews"], ["#contact", "Contact"]].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200">{label}</a>
            ))}
            <Link href="/blog" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Blog</Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Instagram */}
            <a href="https://www.instagram.com/bakkah_premium_auto_care/" target="_blank" rel="noopener noreferrer"
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/40 hover:border-pink-400/50 hover:text-pink-500 transition-colors" aria-label="Instagram">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
            </a>
            {/* Call */}
            <a href="tel:+971545886999"
              className="hidden lg:flex items-center gap-1.5 rounded-lg border border-[#C9A227]/30 bg-[#C9A227]/10 px-3 py-2 text-xs font-bold text-[#C9A227] hover:bg-[#C9A227]/20 hover:border-[#C9A227]/50 transition-all duration-200">
              <Phone className="h-3.5 w-3.5" /> Call Now
            </a>
            <button onClick={toggle} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/35 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/track" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] px-3 py-2 text-xs font-semibold text-gray-500 dark:text-white/50 hover:border-[#C9A227]/40 hover:text-[#C9A227] transition-all duration-200">
              <Car className="h-3.5 w-3.5" /> Track
            </Link>
            <Link href="/auth/login" className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9A227] px-3 py-2 text-xs sm:text-sm font-bold text-black shadow-[0_0_16px_rgba(201,162,39,0.3)] hover:shadow-[0_0_24px_rgba(201,162,39,0.5)] hover:bg-[#d4b22e] transition-all duration-200 whitespace-nowrap">
              <span className="hidden sm:inline">Staff Portal</span>
              <span className="sm:hidden">Login</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <button onClick={() => setMobileNavOpen(o => !o)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/35 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors md:hidden" aria-label="Toggle menu">
              {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
              className="md:hidden border-t border-gray-100 dark:border-white/[0.06] bg-white/98 dark:bg-[#050507]/95 backdrop-blur-2xl px-5 pb-5 pt-3 space-y-1">
              {[["#services", "Services"], ["#gallery", "Gallery"], ["#how-it-works", "How It Works"], ["#reviews", "Reviews"], ["#contact", "Contact"]].map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMobileNavOpen(false)} className="flex items-center py-3 text-sm font-medium text-gray-600 dark:text-white/60 hover:text-[#C9A227] transition-colors border-b border-gray-50 dark:border-white/[0.04] last:border-0">
                  {label}
                </a>
              ))}
              <Link href="/blog" onClick={() => setMobileNavOpen(false)} className="flex items-center py-3 text-sm font-medium text-gray-600 dark:text-white/60 hover:text-[#C9A227] transition-colors border-b border-gray-50 dark:border-white/[0.04]">
                Blog
              </Link>
              <div className="pt-3 flex flex-col gap-2.5">
                <Link href="/track" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-white/60 hover:border-[#C9A227]/40 hover:text-[#C9A227] transition-all">
                  <Car className="h-4 w-4" /> Track My Vehicle
                </Link>
                <Link href="/auth/login" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-4 py-3 text-sm font-bold text-black hover:bg-[#d4b22e] transition-all">
                  Staff Portal <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ═══════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════ */}
      <section id="top" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-24 text-center">
        {/* Hero background images */}
        {HERO_IMAGES.map((src, i) => (
          <motion.div key={src} className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: heroIdx === i ? 1 : 0 }} transition={{ duration: 1.8 }}>
            <img src={src} alt="" aria-hidden className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/55 to-white dark:from-black/75 dark:via-black/55 dark:to-[#050507]" />
          </motion.div>
        ))}
        {/* Subtle gold glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[500px] w-[500px] sm:h-[800px] sm:w-[800px] rounded-full bg-[#C9A227]/[0.05] dark:bg-[#C9A227]/[0.07] blur-[120px] sm:blur-[180px] animate-pulse-slow" />
        </div>
        {/* Faint grid */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]" />

        <div className="relative z-10 max-w-5xl w-full">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C9A227]">
            <Star className="h-3 w-3 fill-[#C9A227]" />
            Al Qusais, Dubai 🇦🇪
            <Star className="h-3 w-3 fill-[#C9A227]" />
          </motion.div>

          {/* Main headline — single H1 wrapping animated spans */}
          <h1 className="font-display leading-[0.88] tracking-[0.05em] text-[clamp(3rem,10.5vw,8.5rem)]">
            {(["EXCELLENCE", "IN EVERY", "DETAIL."] as const).map((word, i) => (
              <div key={i} className="overflow-hidden">
                <motion.span
                  initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: easeOut }}
                  className={`block ${i === 1 ? goldGrad : "text-gray-900 dark:text-white"}`}
                >
                  {word}
                </motion.span>
              </div>
            ))}
          </h1>

          {/* Arabic tagline */}
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.52 }}
            className="mt-5 text-base text-[#C9A227]/80 dark:text-[#C9A227]/70 font-medium tracking-wide" dir="rtl" lang="ar">
            مرحباً بك في بكه للعناية المتميزة بالسيارات — القصيص، دبي
          </motion.p>

          {/* English subtitle */}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
            className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-600 dark:text-white/55 sm:text-base">
            Al Qusais, Dubai's most trusted specialists in ceramic coatings, paint correction, and complete vehicle detailing.{" "}
            <span className="font-semibold text-gray-800 dark:text-white/80">5,000+ happy customers</span> — and your car is next.
          </motion.p>

          {/* Inspection note */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.68 }}
            className="mt-3 text-sm text-gray-500 dark:text-white/35">
            Free inspection on arrival · Reply in under 2 minutes ·{" "}
            <span className="font-semibold text-[#C9A227]">Limited slots — WhatsApp to book today</span>
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.72 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+detailing+service" target="_blank" rel="noopener noreferrer" className={goldBtn}>
              <MessageCircle className="h-5 w-5" /> Book via WhatsApp
            </a>
            <Link href="/track" className="inline-flex items-center gap-2.5 rounded-xl border border-gray-300 dark:border-white/[0.12] bg-white/80 dark:bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-gray-700 dark:text-white/65 hover:border-[#C9A227]/40 hover:text-[#C9A227] hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm">
              <Car className="h-5 w-5" /> Track My Vehicle
            </Link>
          </motion.div>

          {/* Trust pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.82 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-2 rounded-full border border-[#C9A227]/20 bg-[#C9A227]/[0.06] px-4 py-2 text-[#C9A227]">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-[#C9A227]" />)}
              <span className="font-bold ml-1">5.0</span>
            </div>
            <span className="text-gray-400 dark:text-white/30">1,200+ Google Reviews</span>
            <div className="h-3 w-px bg-gray-300 dark:bg-white/10" />
            <span className="text-gray-400 dark:text-white/30">Certified Detailers</span>
            <div className="h-3 w-px bg-gray-300 dark:bg-white/10" />
            <a href="tel:+971545886999" className="text-gray-400 dark:text-white/30 hover:text-[#C9A227] transition-colors font-semibold">📞 +971 54 588 6999</a>
          </motion.div>

          {/* Slideshow dots */}
          {HERO_IMAGES.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-10 flex items-center justify-center gap-2">
              {HERO_IMAGES.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)} aria-label={`Slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-500 ${heroIdx === i ? "w-8 bg-[#C9A227]" : "w-2 bg-gray-400/30 dark:bg-white/15 hover:bg-[#C9A227]/50"}`} />
              ))}
            </motion.div>
          )}
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.25em] text-gray-400 dark:text-white/20">Scroll</span>
          <div className="scroll-bob h-10 w-px bg-gradient-to-b from-[#C9A227]/40 to-transparent" />
        </motion.div>
      </section>

      {/* ── Photo strip marquee ──────────────────────────── */}
      {PHOTO_STRIP.length > 0 && (
        <div className="overflow-hidden py-5 bg-gray-50 dark:bg-white/[0.015] border-y border-gray-100 dark:border-white/[0.04]">
          <div className="flex animate-ticker gap-4" style={{ animationDuration: "30s" }}>
            {[...PHOTO_STRIP, ...PHOTO_STRIP].map((src, i) => (
              <div key={i} className="shrink-0 overflow-hidden rounded-xl w-[260px] h-[160px] border border-gray-200 dark:border-white/[0.05]">
                <img src={src} alt="Bakkah Auto Care work — Dubai" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Service ticker ───────────────────────────────── */}
      <div className="overflow-hidden border-b border-[#C9A227]/10 bg-[#C9A227]/[0.03] dark:bg-[#C9A227]/[0.04] py-3.5">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="inline-flex shrink-0 items-center px-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#C9A227]/60 dark:text-[#C9A227]/50">{item}</span>
              <span className="ml-8 text-[#C9A227]/25 text-xs">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SERVICES
      ═══════════════════════════════════════════════════════ */}
      <section id="services" className="relative overflow-hidden px-5 py-28 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(201,162,39,0.04),transparent)]" />
        <div className="mx-auto max-w-7xl relative">
          <div className="mb-16 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-[#C9A227]">What We Do Best</motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="font-display text-[clamp(2.2rem,5.5vw,4rem)] tracking-[0.05em] text-gray-900 dark:text-white">OUR SERVICES</motion.h2>
            <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />
            <motion.p variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="mx-auto mt-5 max-w-md text-sm text-gray-500 dark:text-white/38 leading-relaxed">
              Professional-grade detailing using the finest imported products and latest techniques. WhatsApp us for a personal quote.
            </motion.p>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <motion.div key={s.title} variants={fadeUp} whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#0c0c0e] transition-all duration-300 hover:border-[#C9A227]/30 hover:shadow-[0_20px_60px_rgba(201,162,39,0.08)] shadow-sm dark:shadow-none">
                {/* Gold top accent */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A227] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#C9A227]/10 to-[#6B7A28]/5">
                  {SERVICE_IMGS[s.key] && (
                    <img src={SERVICE_IMGS[s.key]} alt={`${s.title} — Dubai`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  {/* Tag */}
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-[#C9A227] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">{s.tag}</span>
                  </div>
                  <div className="absolute top-3 right-3 text-xl">{s.emoji}</div>
                  <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <s.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                {/* Content */}
                <div className="p-6">
                  <h3 className="mb-2 text-[15px] font-bold text-gray-900 dark:text-white">{s.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">{s.desc}</p>
                  <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'm+interested+in+your+services" target="_blank" rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#C9A227] hover:gap-3 transition-all duration-200">
                    Book this service <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Footnote */}
          <motion.p variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8 text-center text-xs text-gray-400 dark:text-white/25">
            Every job is assessed individually — WhatsApp us a photo for a quick, honest quote. No obligation.
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          THE BAKKAH DIFFERENCE
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-y border-gray-100 dark:border-white/[0.05] px-5 py-24 lg:px-8 bg-gray-50 dark:bg-[#080809]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(201,162,39,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(201,162,39,0.01)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="mx-auto max-w-7xl relative">
          <div className="mb-16 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-[#C9A227]">Why Choose Us</motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white">THE BAKKAH DIFFERENCE</motion.h2>
            <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#0c0c0e] p-7 hover:border-[#C9A227]/25 hover:shadow-[0_16px_50px_rgba(201,162,39,0.07)] transition-all duration-300 shadow-sm dark:shadow-none text-center">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A227] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />
                <div className="mb-5 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C9A227]/20 bg-[#C9A227]/10 group-hover:bg-[#C9A227]/15 group-hover:border-[#C9A227]/35 transition-colors duration-300">
                  <item.icon className="h-6 w-6 text-[#C9A227]" />
                </div>
                <h3 className="mb-3 text-[15px] font-bold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {["✅ Free condition report before every job", "✅ No hidden charges — ever", "✅ Live job tracking on your phone", "✅ Satisfaction guaranteed or we redo it", "✅ Transparent, upfront quotes"].map(item => (
              <span key={item} className="text-sm font-medium text-gray-600 dark:text-white/50">{item}</span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BEFORE / AFTER
      ═══════════════════════════════════════════════════════ */}
      {BEFORE_AFTER.length > 0 && (
        <section className="relative overflow-hidden px-5 py-24 lg:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(201,162,39,0.025),transparent)]" />
          <div className="mx-auto max-w-6xl relative">
            <div className="mb-14 text-center">
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-[#C9A227]">See The Difference</motion.p>
              <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white">BEFORE & AFTER</motion.h2>
              <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-4 max-w-md text-sm text-gray-500 dark:text-white/40">
                We promised results. Here they are. Your car won't recognise itself — and neither will your neighbours.
              </motion.p>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {BEFORE_AFTER.map((item, i) => (
                <motion.div key={i} variants={fadeUp} custom={i * 0.5} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.06] group aspect-[3/4]">
                  <img src={item.src} alt={item.type === "before" ? "Car before detailing" : "Car after detailing by Bakkah Dubai"}
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${item.type === "before" ? "brightness-[0.65] saturate-[0.4]" : ""}`} loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className={`rounded-lg backdrop-blur-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${item.type === "before" ? "bg-red-500/80 text-white" : "bg-[#C9A227]/90 text-black"}`}>
                      {item.type === "before" ? "Before 😩" : "After ✨"}
                    </span>
                  </div>
                  {item.type === "after" && (
                    <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A227]/90">
                      <Sparkles className="h-3.5 w-3.5 text-black" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            <motion.div variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {["100% Hand-Washed", "Imported Products Only", "Certified Detailers", "Same-Day Service Available", "Live Job Status Tracking", "Free Vehicle Inspection"].map(tag => (
                <div key={tag} className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/45">
                  <CheckCircle className="h-4 w-4 text-[#C9A227] shrink-0" /> <span>{tag}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          GALLERY
      ═══════════════════════════════════════════════════════ */}
      {GALLERY.length > 0 && (
        <section id="gallery" className="relative overflow-hidden px-5 py-24 lg:px-8 bg-gray-50 dark:bg-[#080809]">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 text-center">
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-[#C9A227]">Our Work</motion.p>
              <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white">RESULTS THAT SPEAK</motion.h2>
              <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />
              <motion.p variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-4 max-w-md text-sm text-gray-500 dark:text-white/38">
                Real cars. Real results. Every transformation documented.
              </motion.p>
            </div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-[200px]">
              {GALLERY.map((photo, i) => (
                <motion.div key={i} variants={fadeUp} className={`group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.06] cursor-zoom-in ${photo.wide ? "col-span-2" : ""}`}>
                  <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-3 left-3 right-3 translate-y-3 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                    <p className="text-xs font-semibold text-white truncate">{photo.alt}</p>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A227]/80 backdrop-blur-md">
                      <Eye className="h-3.5 w-3.5 text-black" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-10 text-center">
              <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+see+more+of+your+work" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[#C9A227]/25 bg-[#C9A227]/10 px-6 py-3 text-sm font-semibold text-[#C9A227] hover:bg-[#C9A227]/20 hover:border-[#C9A227]/45 transition-all duration-200">
                <MessageCircle className="h-4 w-4" /> See more on WhatsApp
              </a>
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          VIDEO SHOWCASE
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-[#C9A227]">Watch Us Work</motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white">SEE THE MAGIC HAPPEN</motion.h2>
            <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-4 max-w-md text-sm text-gray-500 dark:text-white/38">
              Watch our team transform a car from dusty and dull to a gleaming showroom finish. Every step. Every detail.
            </motion.p>
          </div>
          <motion.div ref={videoRef} variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/[0.08] shadow-[0_20px_80px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.5)] aspect-video bg-black">
            {!videoReady && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#C9A227] shadow-[0_0_50px_rgba(201,162,39,0.6)] border-4 border-white/20 animate-pulse">
                  <Play className="h-8 w-8 text-black fill-black ml-1" />
                </div>
                <p className="text-white/60 text-sm">Scroll down — video auto-plays</p>
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
              <span className="rounded-full bg-[#C9A227]/90 px-3 py-1 text-[11px] font-bold text-black uppercase tracking-wider">🎬 Auto Detailing</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          STATS
      ═══════════════════════════════════════════════════════ */}
      <section id="why-bakkah" className="relative overflow-hidden border-y border-gray-100 dark:border-white/[0.05] px-5 py-24 lg:px-8 bg-gray-50 dark:bg-[#080809]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(201,162,39,0.04),transparent)]" />
        <div className="mx-auto max-w-5xl relative">
          <div className="mb-14 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-[#C9A227]">Our Track Record</motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white">WHY CHOOSE BAKKAH</motion.h2>
            <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-4 max-w-sm text-sm text-gray-500 dark:text-white/38">
              Numbers don't lie. Transforming cars in Dubai since 2025.
            </motion.p>
          </div>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { value: 5000, suffix: "+", label: "Cars Transformed", sub: "And counting" },
              { value: 98, suffix: "%", label: "Client Satisfaction", sub: "Verified reviews" },
              { value: 100, suffix: "%", label: "Hand Washed", sub: "Never machine wash" },
              { value: 500, suffix: "+", label: "Cars Per Month", sub: "Busy workshop!" },
            ].map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} custom={i * 0.7} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center group">
                <div className="relative inline-block">
                  <p className={`font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-none tracking-wide ${goldGrad}`}>
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                </div>
                <p className="mt-2 text-sm font-bold text-gray-800 dark:text-white/75">{stat.label}</p>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-white/25">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-14 flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: BadgeCheck, label: "Dubai Certified" },
              { icon: Gem, label: "Premium Products" },
              { icon: Users, label: "Certified Team" },
              { icon: Shield, label: "Fully Insured" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-full border border-[#C9A227]/20 bg-[#C9A227]/[0.06] px-5 py-2.5">
                <Icon className="h-4 w-4 text-[#C9A227]" />
                <span className="text-sm font-semibold text-gray-700 dark:text-white/65">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative overflow-hidden px-5 py-28 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(201,162,39,0.03),transparent)]" />
        <div className="mx-auto max-w-5xl relative">
          <div className="mb-16 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-[#C9A227]">Dead Simple Process</motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white">HOW IT WORKS</motion.h2>
            <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-4 max-w-md text-sm text-gray-500 dark:text-white/38">
              Three steps. One immaculate car. Zero headaches. We promise.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 relative">
            <div className="absolute top-14 left-[calc(33.33%+16px)] right-[calc(33.33%+16px)] hidden lg:block h-px bg-gradient-to-r from-[#C9A227]/40 via-[#C9A227]/20 to-[#C9A227]/40" />
            {[
              { title: "Drop Your Car", emoji: "🚗", desc: "Drive in any time. Full walkaround, every scratch documented with photos. We explain exactly what we'll do — no surprises." },
              { title: "We Work Our Magic", emoji: "✨", desc: "Certified detailers go to work with premium imported products. Track live status from your phone the whole time." },
              { title: "Pick Up & Stare", emoji: "🤩", desc: "Come collect your car. Prepare for a double-take. Looks better than the day you bought it — or we make it right." },
            ].map((step, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="group relative rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#0c0c0e] p-8 hover:border-[#C9A227]/25 transition-all duration-300 shadow-sm dark:shadow-none">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A227] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#C9A227]/40 bg-[#C9A227]/10">
                    <span className="font-display text-xl text-[#C9A227]">0{i + 1}</span>
                  </div>
                  <span className="text-4xl">{step.emoji}</span>
                </div>
                <h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-12 text-center">
            <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+detailing+service" target="_blank" rel="noopener noreferrer" className={goldBtn + " text-base px-9 py-4"}>
              <MessageCircle className="h-5 w-5" />
              Book Your Appointment Now
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TRACK YOUR VEHICLE CTA
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-y border-[#C9A227]/15 bg-gradient-to-r from-[#C9A227]/[0.05] via-[#C9A227]/[0.08] to-[#C9A227]/[0.05] dark:from-[#C9A227]/[0.04] dark:via-[#C9A227]/[0.07] dark:to-[#C9A227]/[0.04] px-5 py-20 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(201,162,39,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(201,162,39,0.015)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="mx-auto max-w-3xl relative text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C9A227]">
            <Car className="h-3.5 w-3.5" /> Live Status Updates
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white">TRACK YOUR VEHICLE</motion.h2>
          <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mx-auto mt-4 max-w-lg text-sm text-gray-500 dark:text-white/45 leading-relaxed">
            Know exactly where your car is in our detailing process. Live status updates from drop-off all the way to delivery — no calls needed.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8">
            <Link href="/track" className={goldBtn + " text-base px-9 py-4 mx-auto"}>
              <Car className="h-5 w-5" /> Track My Vehicle <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.p variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-4 text-xs text-gray-400 dark:text-white/25">
            Use your job number (e.g. JC-2025-0001) or your registered phone number
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-5 py-24 lg:px-8 bg-gray-50 dark:bg-[#080809]">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-[#C9A227]">Common Questions</motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white">EVERYTHING YOU NEED TO KNOW</motion.h2>
            <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />
          </div>
          <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#0c0c0e] px-7 shadow-sm dark:shadow-none">
            {FAQ_ITEMS.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
          </motion.div>
          <motion.p variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8 text-center text-sm text-gray-500 dark:text-white/40">
            Still have questions?{" "}
            <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I+have+a+question" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#C9A227] hover:underline">
              Chat with us on WhatsApp
            </a>
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          REVIEWS
      ═══════════════════════════════════════════════════════ */}
      {reviewsLoaded && reviews.length > 0 && (
        <section id="reviews" className="relative overflow-hidden px-5 py-28 lg:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(201,162,39,0.025),transparent)]" />
          <div className="mx-auto max-w-7xl relative">
            <div className="mb-14 text-center">
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-[#C9A227]">Customer Reviews</motion.p>
              <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white">REAL WORDS. REAL CARS.</motion.h2>
              <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-4 max-w-md text-sm text-gray-500 dark:text-white/38">
                Don't take our word for it — read what our customers say after picking up their freshly-detailed rides.
              </motion.p>
            </div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map(r => (
                <motion.div key={r.id} variants={fadeUp} whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="relative rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#0c0c0e] p-6 hover:border-[#C9A227]/20 transition-all duration-300 shadow-sm dark:shadow-none group">
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A227] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-[#C9A227]/10" />
                  <StarRow rating={r.rating} />
                  {r.comment && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-white/55 leading-relaxed line-clamp-4">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C9A227]/15 text-sm font-bold text-[#C9A227] shrink-0">
                      {r.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/80">{r.customer_name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-white/25">Verified Customer</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {avgRating && reviews.length >= 3 && (
              <motion.div variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-10 text-center">
                <div className="inline-flex items-center gap-3 rounded-xl border border-[#C9A227]/20 bg-[#C9A227]/[0.07] px-6 py-3">
                  <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-[#C9A227] text-[#C9A227]" />)}</div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{avgRating} average</span>
                  <span className="text-sm text-gray-500 dark:text-white/40">from {reviews.length} {reviews.length !== 1 ? "reviews" : "review"}</span>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          FOOTER / CONTACT
      ═══════════════════════════════════════════════════════ */}
      <footer id="contact" className="border-t border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#050507] px-5 pt-16 pb-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 mb-14">
            {/* Brand column */}
            <div className="lg:col-span-1">
              <div className="mb-5 flex items-center gap-3">
                <img src="/logo.svg" alt="Bakkah Premium Auto Care" className="h-11 w-11 rounded-full shadow-[0_0_20px_rgba(201,162,39,0.3)]" />
                <div className="leading-none">
                  <p className="font-display text-xl tracking-[0.22em] text-gray-900 dark:text-white leading-none">BAKKAH</p>
                  <p className="text-[8px] tracking-[0.18em] text-[#C9A227]/80 uppercase font-medium">PREMIUM AUTO CARE</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-white/38 leading-relaxed max-w-xs">
                A trusted vehicle detailing studio in Al Qusais, Dubai. Excellence in every detail, every time. Your car deserves nothing less.
              </p>
              {/* Stars */}
              <div className="mt-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#C9A227] text-[#C9A227]" />)}
                <span className="ml-2 text-xs text-gray-400 dark:text-white/30">5.0 on Google</span>
              </div>
              <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+service" target="_blank" rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#25D366]/15 border border-[#25D366]/25 px-4 py-2.5 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/25 transition-colors duration-200">
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </div>

            {/* Services column */}
            <div>
              <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 dark:text-white/25">Our Services</h4>
              <ul className="space-y-3">
                {SERVICES.map(s => (
                  <li key={s.title} className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-white/38">
                    <span className="text-base shrink-0">{s.emoji}</span> {s.title}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact column */}
            <div>
              <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 dark:text-white/25">Get In Touch</h4>
              <ul className="space-y-4">
                {[
                  { icon: MapPin, text: "Al Qusais Industrial Area\nDubai, UAE 🇦🇪", href: "https://www.google.com/maps/dir/?api=1&destination=Bakkah+Premium+Auto+Care+Al+Qusais+Industrial+Area+Dubai" },
                  { icon: Phone, text: "+971 54 588 6999", href: "tel:+971545886999" },
                  { icon: Mail, text: "info@bakkah.ae", href: "mailto:info@bakkah.ae" },
                ].map(({ icon: Icon, text, href }) => (
                  <li key={text}>
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-start gap-3 group">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#C9A227]/15 bg-[#C9A227]/10 group-hover:border-[#C9A227]/30 group-hover:bg-[#C9A227]/15 transition-colors">
                        <Icon className="h-3.5 w-3.5 text-[#C9A227]" />
                      </div>
                      <span className="text-sm text-gray-500 dark:text-white/38 leading-relaxed whitespace-pre-line group-hover:text-gray-700 dark:group-hover:text-white/60 transition-colors">{text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hours + Info column */}
            <div>
              <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 dark:text-white/25">Working Hours</h4>
              <div className="space-y-2.5">
                {[
                  { day: "Mon – Sat", hours: "8:00 AM – 8:00 PM" },
                  { day: "Sunday", hours: "9:00 AM – 5:00 PM" },
                ].map(h => (
                  <div key={h.day} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-white/38">{h.day}</span>
                    <span className="font-semibold text-gray-700 dark:text-white/65">{h.hours}</span>
                  </div>
                ))}
              </div>

              {/* Payment methods */}
              <div className="mt-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/25 mb-3">We Accept</p>
                <div className="flex flex-wrap gap-2">
                  {["Cash (AED)", "Visa", "Mastercard", "Apple Pay", "Bank Transfer"].map(method => (
                    <span key={method} className="rounded-lg border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-gray-500 dark:text-white/40">{method}</span>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="mt-6 space-y-2">
                <Link href="/track" className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-white/40 hover:text-[#C9A227] transition-colors">
                  <Car className="h-4 w-4" /> Track Your Vehicle
                </Link>
                <Link href="/auth/login" className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-white/40 hover:text-[#C9A227] transition-colors">
                  <ChevronRight className="h-4 w-4" /> Staff Portal
                </Link>
              </div>
            </div>
          </div>

          {/* ── Social / Connect Row ──────────────────────────── */}
          <div className="mb-10 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-7">
            <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 dark:text-white/25">Find Us · Contact Us · Follow Us</p>
            <div className="flex flex-wrap items-stretch justify-center gap-3">
              {/* WhatsApp */}
              <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+service" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3.5 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-5 py-4 text-[#25D366] hover:bg-[#25D366]/20 hover:border-[#25D366]/50 hover:scale-[1.03] transition-all duration-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366] shadow-[0_4px_16px_rgba(37,211,102,0.45)]">
                  <MessageCircle className="h-5 w-5 fill-white text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">WhatsApp</p>
                  <p className="text-[11px] text-[#25D366] font-medium">Book instantly — 2 min reply</p>
                </div>
              </a>
              {/* Call */}
              <a href="tel:+971545886999"
                className="flex items-center gap-3.5 rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/10 px-5 py-4 hover:bg-[#C9A227]/20 hover:border-[#C9A227]/50 hover:scale-[1.03] transition-all duration-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A227] shadow-[0_4px_16px_rgba(201,162,39,0.45)]">
                  <Phone className="h-5 w-5 text-black" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Call Now</p>
                  <p className="text-[11px] text-[#C9A227] font-medium">+971 54 588 6999</p>
                </div>
              </a>
              {/* Instagram */}
              <a href="https://www.instagram.com/bakkah_premium_auto_care/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3.5 rounded-xl border border-pink-400/25 bg-pink-500/[0.07] px-5 py-4 hover:bg-pink-500/15 hover:border-pink-400/45 hover:scale-[1.03] transition-all duration-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] shadow-[0_4px_16px_rgba(225,48,108,0.45)]">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Instagram</p>
                  <p className="text-[11px] text-pink-400 font-medium">Before & after transformations</p>
                </div>
              </a>
              {/* Google */}
              <a href="https://maps.google.com/?q=Bakkah+Premium+Auto+Care+Al+Qusais+Dubai" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3.5 rounded-xl border border-blue-400/25 bg-blue-500/[0.07] px-5 py-4 hover:bg-blue-500/15 hover:border-blue-400/45 hover:scale-[1.03] transition-all duration-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_4px_16px_rgba(66,133,244,0.35)]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Google Reviews</p>
                  <p className="text-[11px] text-blue-400 font-medium">⭐ 5.0 · 1,200+ reviews</p>
                </div>
              </a>
              {/* Get Directions */}
              <a href="https://www.google.com/maps/dir/?api=1&destination=Bakkah+Premium+Auto+Care+Al+Qusais+Industrial+Area+Dubai" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3.5 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.07] px-5 py-4 hover:bg-emerald-500/15 hover:border-emerald-400/45 hover:scale-[1.03] transition-all duration-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-[0_4px_16px_rgba(16,185,129,0.45)]">
                  <Navigation className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Get Directions</p>
                  <p className="text-[11px] text-emerald-400 font-medium">Al Qusais Industrial Area</p>
                </div>
              </a>
            </div>
          </div>

          {/* Gold divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#C9A227]/30 to-transparent mb-6" />

          {/* Service area — local SEO signal for "near me" searches */}
          <p className="mb-5 text-center text-[11px] text-gray-400 dark:text-white/18 leading-relaxed">
            <span className="font-semibold text-gray-500 dark:text-white/28">Car detailing near you:</span>{" "}
            Al Qusais · Deira · Al Nahda · Muhaisnah · Mirdif · Al Rashidiya · Al Mizhar · Sharjah · Dubai International Airport area · and all of Dubai, UAE.
          </p>

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 dark:text-white/20">
            <p>© 2025 Bakkah Premium Auto Care LLC. All rights reserved. Proudly serving Dubai since 2025.</p>
            <p className="text-center sm:text-right">
              <span className="text-gray-300 dark:text-white/15">VAT Reg. No: </span>
              <span className="font-mono">100XXXXXXXXX00003</span>
              <span className="mx-2">·</span>
              <span className="text-gray-300 dark:text-white/15">Made with ❤️ in Dubai 🇦🇪</span>
            </p>
          </div>
        </div>
      </footer>

      {/* ── Website Chat Widget ───────────────────────────── */}
      <ChatWidget />

      {/* ── Sticky Mobile CTA Bar ─────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-white/96 dark:bg-[#0c0c0e]/96 backdrop-blur-xl border-t border-gray-200 dark:border-white/[0.08] px-4 py-3 flex gap-2 shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
        <a href="tel:+971545886999"
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 border-[#C9A227]/40 bg-[#C9A227]/10 py-2.5 text-[11px] font-bold text-[#C9A227]">
          <Phone className="h-4 w-4" /> Call
        </a>
        <a href="https://www.google.com/maps/dir/?api=1&destination=Bakkah+Premium+Auto+Care+Al+Qusais+Industrial+Area+Dubai" target="_blank" rel="noopener noreferrer"
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 border-emerald-400/40 bg-emerald-500/10 py-2.5 text-[11px] font-bold text-emerald-500">
          <Navigation className="h-4 w-4" /> Directions
        </a>
        <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+service" target="_blank" rel="noopener noreferrer"
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(37,211,102,0.45)]">
          <MessageCircle className="h-4 w-4 fill-white" /> WhatsApp Now
        </a>
      </div>

    </div>
  );
}
