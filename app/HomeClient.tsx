"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  MapPin, Phone, Mail, ChevronRight, ArrowRight,
  Car, MessageCircle, Sun, Moon,
  ChevronDown, Menu, X, Navigation, Play,
  Shield, Sparkles, Wrench, Droplets, Truck, Clock,
  Award, ThumbsUp, Star, Quote,
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

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 dark:border-white/[0.06] last:border-0">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between py-5 text-left gap-4 group">
        <span className={`text-[15px] font-semibold transition-colors leading-snug ${open ? "text-golden" : "text-gray-800 dark:text-white/80 group-hover:text-golden"}`}>
          {q}
        </span>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${open ? "bg-golden/15 rotate-180" : "bg-gray-100 dark:bg-white/[0.04]"}`}>
          <ChevronDown className={`h-4 w-4 transition-colors ${open ? "text-golden" : "text-gray-500 dark:text-white/30"}`} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <p className="pb-5 text-sm text-gray-500 dark:text-white/40 leading-relaxed">{a}</p>
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
    icon: Sparkles, key: "fullDetail",
    title: "Full Detail Package", tag: "Most Popular",
    desc: "Complete exterior & interior treatment — hand wash, clay bar, machine polish, protective coating. Your car walks in. A showstopper drives out.",
  },
  {
    icon: Shield, key: "ceramic",
    title: "Ceramic Coating", tag: "5-Year Warranty",
    desc: "Nano-ceramic bonds directly to your paint for years of brilliant gloss. Water beads off. Dubai sand waves goodbye. 3–5 year durability guaranteed.",
  },
  {
    icon: Wrench, key: "paintCorrection",
    title: "Paint Correction", tag: "Expert Only",
    desc: "Swirl marks? Scratches? Oxidation? We erase it all with multi-stage machine polishing. Removes up to 90% of defects. Like it never happened.",
  },
  {
    icon: Droplets, key: "interior",
    title: "Interior Detailing", tag: "Full Sanitize",
    desc: "Steam clean every crack, condition the leather, extract the carpets, eliminate every odour. You'll think you bought a new car.",
  },
  {
    icon: Truck, key: "fleet",
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

// ── Helpers ─────────────────────────────────────────────────────
const goldBtn = "inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#d4ab2a] px-7 py-3.5 text-sm font-bold text-black shadow-[0_4px_24px_rgba(201,162,39,0.4)] hover:shadow-[0_4px_32px_rgba(201,162,39,0.6)] hover:scale-[1.02] transition-all duration-300";

export default function BakkahHomePage() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [cms, setCms] = useState<SiteContent>({});
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    fetch("/api/site-content").then(r => r.json()).then(d => setCms(d as SiteContent)).catch(() => { });
  }, []);

  const HERO_IMGS = cms.hero?.images?.length
    ? cms.hero.images.map(i => i.url)
    : ["/images/hero/hero-car.jpg"];
  const SERVICE_IMGS = Object.fromEntries(SERVICE_KEYS.map(k => [k, cms.services?.[k]?.url ?? ""]));
  const GALLERY = cms.gallery?.images?.length ? cms.gallery.images.map(i => ({ src: i.url, alt: i.alt, wide: i.wide })) : [];
  const PHOTO_STRIP = cms.strip?.images?.length ? cms.strip.images.map(i => i.url) : [];
  const BEFORE_AFTER = cms.before_after?.images?.length ? cms.before_after.images.map(i => ({ src: i.url, type: i.type })) : [];

  useEffect(() => { const fn = () => setScrolled(window.scrollY > 40); window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn); }, []);
  useEffect(() => { if (HERO_IMGS.length <= 1) return; const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMGS.length), 5000); return () => clearInterval(t); }, [HERO_IMGS.length]);
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
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white overflow-x-hidden pb-[72px] sm:pb-0">

      {/* ── Floating WhatsApp ──────────────────────────────── */}
      <motion.a
        href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+service+%F0%9F%9A%97"
        target="_blank" rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.8, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-50 hidden sm:flex items-center gap-2.5 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-bold text-gray-900 dark:text-white shadow-[0_8px_32px_rgba(37,211,102,0.5)] hover:shadow-[0_8px_40px_rgba(37,211,102,0.7)] transition-shadow duration-300"
      >
        <MessageCircle className="h-5 w-5 fill-white" />
        <span className="hidden sm:block">WhatsApp Us</span>
      </motion.a>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -72, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-2xl border-b border-gray-200 dark:border-white/[0.08] shadow-[0_2px_24px_rgba(0,0,0,0.3)]" : "bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/[0.05]"}`}
      >
        {/* Announcement bar */}
        <div className="bg-gradient-to-r from-[#C9A227] via-[#d4ab2a] to-[#C9A227] px-4 py-1.5 text-center text-[11px] font-bold text-black flex items-center justify-center flex-wrap gap-x-4 gap-y-0.5">
          <span>Open Today: 8 AM – 8 PM</span>
          <span className="hidden sm:inline h-3 w-px bg-black/20" />
          <a href="tel:+971545886999" className="hover:underline">+971 54 588 6999</a>
          <span className="hidden sm:inline h-3 w-px bg-black/20" />
          <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book" target="_blank" rel="noopener noreferrer" className="hover:underline">WhatsApp to Book Now →</a>
        </div>

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          {/* Logo */}
          <a href="#top" className="flex items-center gap-3 group select-none">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-white/20 transition-all duration-300 group-hover:border-golden/50 group-hover:shadow-[0_0_18px_rgba(201,162,39,0.3)]">
              <img src="/logo.svg" alt="Bakkah Premium Auto Care" className="h-10 w-10 rounded-full" />
            </div>
            <div className="leading-none">
              <p className="font-display text-xl tracking-[0.22em] text-gray-900 dark:text-white leading-none">BAKKAH</p>
              <p className="text-[8px] tracking-[0.18em] text-golden/80 uppercase font-medium">Premium Auto Care</p>
            </div>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-500 dark:text-white/40">
            {[["#services", "Services"], ["#gallery", "Gallery"], ["#how-it-works", "How It Works"], ["#reviews", "Reviews"], ["#contact", "Contact"]].map(([href, label]) => (
              <a key={href} href={href} className="relative hover:text-gray-900 dark:text-white transition-colors duration-200 group/link">
                {label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-golden transition-all duration-300 group-hover/link:w-full" />
              </a>
            ))}
            <Link href="/blog" className="hover:text-gray-900 dark:text-white transition-colors duration-200">Blog</Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Instagram */}
            <a href="https://www.instagram.com/bakkah_premium_auto_care/" target="_blank" rel="noopener noreferrer"
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/30 hover:border-pink-400/50 hover:text-pink-500 transition-colors" aria-label="Instagram">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
            </a>
            {/* Call */}
            <a href="tel:+971545886999"
              className="hidden lg:flex items-center gap-1.5 rounded-lg border border-golden/30 bg-golden/10 px-3 py-2 text-xs font-bold text-golden hover:bg-golden/20 hover:border-golden/50 transition-all duration-200">
              <Phone className="h-3.5 w-3.5" /> Call Now
            </a>
            <button onClick={toggle} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/30 hover:bg-gray-100 dark:bg-white/[0.06] transition-colors" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/track" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-white/40 hover:border-golden/40 hover:text-golden transition-all duration-200">
              <Car className="h-3.5 w-3.5" /> Track
            </Link>
            <Link href="/auth/login" className="inline-flex items-center gap-1.5 rounded-lg bg-golden px-3 py-2 text-xs sm:text-sm font-bold text-black shadow-[0_0_16px_rgba(201,162,39,0.3)] hover:shadow-[0_0_24px_rgba(201,162,39,0.5)] hover:bg-[#d4b22e] transition-all duration-200 whitespace-nowrap">
              <span className="hidden sm:inline">Staff Portal</span>
              <span className="sm:hidden">Login</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <button onClick={() => setMobileNavOpen(o => !o)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/30 hover:bg-gray-100 dark:bg-white/[0.06] transition-colors md:hidden" aria-label="Toggle menu">
              {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
              className="md:hidden border-t border-gray-200 dark:border-white/[0.06] bg-white/98 dark:bg-[#0a0a0a]/98 backdrop-blur-2xl px-5 pb-5 pt-3 space-y-1">
              {[["#services", "Services"], ["#gallery", "Gallery"], ["#how-it-works", "How It Works"], ["#reviews", "Reviews"], ["#contact", "Contact"]].map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMobileNavOpen(false)} className="flex items-center py-3 text-sm font-medium text-gray-600 dark:text-white/50 hover:text-golden transition-colors border-b border-gray-200 dark:border-white/[0.04] last:border-0">
                  {label}
                </a>
              ))}
              <Link href="/blog" onClick={() => setMobileNavOpen(false)} className="flex items-center py-3 text-sm font-medium text-gray-600 dark:text-white/50 hover:text-golden transition-colors border-b border-gray-200 dark:border-white/[0.04]">
                Blog
              </Link>
              <div className="pt-3 flex flex-col gap-2.5">
                <Link href="/track" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-white/50 hover:border-golden/40 hover:text-golden transition-all">
                  <Car className="h-4 w-4" /> Track My Vehicle
                </Link>
                <Link href="/auth/login" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-golden px-4 py-3 text-sm font-bold text-black hover:bg-[#d4b22e] transition-all">
                  Staff Portal <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ═══════════════════════════════════════════════════════
          HERO — Automotive Theme
      ═══════════════════════════════════════════════════════ */}
      <section id="top" className="relative overflow-hidden bg-white dark:bg-[#0a0a0a] pt-24 pb-16 px-5 lg:px-8">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-golden/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-carbon-fiber pointer-events-none opacity-50" />

        <div className="relative z-10 mx-auto max-w-6xl">
          {/* Title block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-golden/20 bg-golden/[0.06] px-4 py-1.5 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-golden animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-golden">Al Qusais, Dubai</span>
            </div>
            <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] tracking-[0.06em] text-gray-900 dark:text-white uppercase leading-[0.95]">
              Premium Car<br />
              <span className="hero-gradient">Detailing Studio</span>
            </h1>
            <p className="mt-5 text-base text-gray-500 dark:text-white/40 max-w-xl mx-auto leading-relaxed">
              Expert ceramic coating, paint correction & full detailing. 5,000+ cars transformed. 5.0★ Google rating.
            </p>
          </motion.div>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-surface-50 dark:bg-surface-900">
              {HERO_IMGS.length > 0 ? (
                <>
                  {HERO_IMGS.map((src, i) => (
                    <motion.img
                      key={src}
                      src={src}
                      alt="Bakkah Premium Auto Care — professional car detailing workshop in Dubai"
                      className="absolute inset-0 w-full h-auto"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: heroIdx === i ? 1 : 0 }}
                      transition={{ duration: 1.2 }}
                    />
                  ))}

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0a0a0a] via-transparent to-white/30 dark:to-[#0a0a0a]/30" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/40 dark:from-[#0a0a0a]/40 via-transparent to-white/40 dark:to-[#0a0a0a]/40" />

                  {/* Overlay labels */}
                  <div className="absolute bottom-[18%] left-[8%] hidden sm:block">
                    <div className="flex items-start gap-2">
                      <div className="w-px h-8 bg-golden/60" />
                      <div>
                        <p className="text-sm text-golden font-bold">Detailing Station</p>
                        <p className="text-xs text-golden/50">(Polishing & Coating)</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-[18%] left-[42%] hidden sm:block">
                    <div className="flex items-start gap-2">
                      <div className="w-px h-8 bg-golden/60" />
                      <div>
                        <p className="text-sm text-golden font-bold">Mechanic Bay</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-[25%] right-[12%] hidden sm:block">
                    <div className="flex items-start gap-2 flex-row-reverse">
                      <div className="w-px h-8 bg-golden/60" />
                      <div className="text-right">
                        <p className="text-sm text-golden font-bold">Quality Check</p>
                        <p className="text-xs text-golden/50">(360° Inspection)</p>
                      </div>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="rounded-full bg-golden/90 px-3 py-1 text-[11px] font-bold text-black uppercase tracking-wider">Auto Detailing</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-32 text-center border-2 border-dashed border-gray-200 dark:border-white/10">
                  <svg className="h-20 w-20 text-gray-400 dark:text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <p className="text-xl text-gray-400 dark:text-white/20">Upload your workshop image</p>
                  <p className="text-sm text-gray-400 dark:text-white/10 max-w-sm">
                    Go to <span className="font-semibold text-golden/50">Admin → Website → Hero Slideshow</span> and upload your image.
                  </p>
                </div>
              )}

              {/* Corner accents */}
              {["top-3 left-3", "top-3 right-3 rotate-90", "bottom-3 left-3 -rotate-90", "bottom-3 right-3 rotate-180"].map((pos, i) => (
                <svg key={i} className={`absolute h-5 w-5 text-golden/30 ${pos}`} viewBox="0 0 20 20" fill="none">
                  <path d="M1 8V1H8" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              ))}
            </div>

            {/* Slideshow dots */}
            {HERO_IMGS.length > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {HERO_IMGS.map((_, i) => (
                  <button key={i} onClick={() => setHeroIdx(i)} aria-label={`Slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-500 ${heroIdx === i ? "w-8 bg-golden" : "w-2 bg-white/20 hover:bg-golden/50"}`} />
                ))}
              </div>
            )}
          </motion.div>

          {/* Feature callouts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {[
              { n: 1, title: "Detailing Station", desc: "Polishing & Coating" },
              { n: 2, title: "Mechanic Bay", desc: "Paint correction" },
              { n: 3, title: "Quality Check", desc: "360° inspection" },
              { n: 4, title: "Vehicle Delivery", desc: "Showroom-ready handover" },
            ].map((item) => (
              <div key={item.n}
                className="flex items-start gap-2.5 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] px-3.5 py-3 metallic-border">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-golden/15 text-[12px] font-bold text-golden">{item.n}</span>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-white/30">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Divider */}
        <div className="auto-divider mt-12" />
      </section>

      {/* ── Photo strip marquee ──────────────────────────── */}
      {PHOTO_STRIP.length > 0 && (
        <div className="overflow-hidden py-6 bg-surface-50 dark:bg-surface-900 border-y border-gray-200 dark:border-white/[0.04]">
          <div className="flex animate-ticker gap-6" style={{ animationDuration: "40s" }}>
            {[...PHOTO_STRIP, ...PHOTO_STRIP].map((src, i) => (
              <div key={i} className="shrink-0 rounded-xl overflow-hidden w-[240px] border border-gray-200 dark:border-white/[0.06]">
                <img src={src} alt="Bakkah Auto Care work — Dubai" className="w-full h-[140px] object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Service ticker ────────────────────────────────── */}
      <div className="overflow-hidden border-b border-gray-200 dark:border-white/[0.04] bg-surface-50 dark:bg-surface-900 py-3.5">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="inline-flex shrink-0 items-center px-8">
              <span className="text-sm text-golden/40 font-medium tracking-wider">{item}</span>
              <span className="ml-8 text-golden/20 text-xs">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SERVICES
      ═══════════════════════════════════════════════════════ */}
      <section id="services" className="relative overflow-hidden px-5 py-28 lg:px-8 bg-gray-50 dark:bg-[#0d0d0f]">
        <div className="absolute inset-0 bg-carbon-fiber pointer-events-none opacity-30" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(201,162,39,0.04),transparent)]" />
        <div className="mx-auto max-w-7xl relative">
          <div className="mb-16 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-golden/60">What We Do Best</motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="font-display text-[clamp(2.2rem,5.5vw,4rem)] tracking-[0.05em] text-gray-900 dark:text-white uppercase">Our Services</motion.h2>
            <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
              <div className="auto-divider mx-auto mt-3 max-w-xs" />
            </motion.div>
            <motion.p variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="mx-auto mt-5 max-w-md text-sm text-gray-500 dark:text-white/35 leading-relaxed">
              Professional-grade detailing using the finest imported products and latest techniques. WhatsApp us for a personal quote.
            </motion.p>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <motion.div key={s.title} variants={fadeUp} whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] transition-all duration-300 hover:border-golden/20 hover:shadow-[0_16px_50px_rgba(201,162,39,0.06)] shine-hover">
                {/* Image area */}
                <div className="relative h-40 overflow-hidden bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
                  {SERVICE_IMGS[s.key] ? (
                    <>
                      <img src={SERVICE_IMGS[s.key]} alt={`${s.title} — Dubai`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent" />
                    </>
                  ) : (
                    <s.icon className="h-12 w-12 text-golden/20" />
                  )}
                  {/* Tag */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-block bg-golden/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black rounded-md">{s.tag}</span>
                  </div>
                  {/* Icon */}
                  <div className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-black/60 border border-gray-200 dark:border-white/10 backdrop-blur-sm">
                    <s.icon className="h-5 w-5 text-golden" />
                  </div>
                </div>
                {/* Content */}
                <div className="p-5">
                  <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">{s.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-white/35 leading-relaxed">{s.desc}</p>
                  <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'm+interested+in+your+services" target="_blank" rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-golden hover:gap-3 transition-all duration-200">
                    Book this service <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.p variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8 text-center text-sm text-gray-400 dark:text-white/25">
            Every job is assessed individually — WhatsApp us a photo for a quick, honest quote. No obligation.
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          THE BAKKAH DIFFERENCE
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-y border-gray-200 dark:border-white/[0.04] px-5 py-24 lg:px-8 bg-white dark:bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-carbon-fiber pointer-events-none opacity-20" />
        <div className="mx-auto max-w-7xl relative">
          <div className="mb-16 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-golden/60">Why Choose Us</motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white uppercase">The Bakkah Difference</motion.h2>
            <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="auto-divider mx-auto mt-3 max-w-xs" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((item, i) => {
              const icons = [Award, Shield, Clock, ThumbsUp];
              const Icon = icons[i] || Shield;
              return (
                <motion.div key={item.title} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="group relative rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-7 hover:border-golden/20 hover:shadow-[0_16px_50px_rgba(201,162,39,0.04)] transition-all duration-300 text-center">
                  <div className="mb-5 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-golden/15 bg-golden/[0.06] group-hover:bg-golden/10 group-hover:border-golden/30 transition-colors duration-300">
                    <Icon className="h-6 w-6 text-golden" />
                  </div>
                  <h3 className="mb-3 text-base font-bold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-white/35 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <motion.div variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {["Free condition report before every job", "No hidden charges — ever", "Live job tracking on your phone", "Satisfaction guaranteed or we redo it", "Transparent, upfront quotes"].map(item => (
              <span key={item} className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-white/40">
                <Shield className="h-4 w-4 text-golden/60 shrink-0" /> {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BEFORE / AFTER
      ═══════════════════════════════════════════════════════ */}
      {BEFORE_AFTER.length > 0 && (
        <section className="relative overflow-hidden px-5 py-24 lg:px-8 bg-gray-50 dark:bg-[#0d0d0f]">
          <div className="mx-auto max-w-6xl relative">
            <div className="mb-14 text-center">
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-golden/60">See The Difference</motion.p>
              <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white uppercase">Before & After</motion.h2>
              <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="auto-divider mx-auto mt-3 max-w-xs" />
              </motion.div>
              <motion.p variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-4 max-w-md text-base text-gray-500 dark:text-white/30">
                We promised results. Here they are.
              </motion.p>
            </div>
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {BEFORE_AFTER.map((item, i) => (
                <motion.div key={i} variants={fadeUp} custom={i * 0.5} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
                  className="relative group aspect-[3/4]">
                  <div className="rounded-2xl overflow-hidden h-full border border-gray-200 dark:border-white/[0.06]">
                    <div className="relative overflow-hidden h-full">
                      <img src={item.src} alt={item.type === "before" ? "Car before detailing" : "Car after detailing by Bakkah Dubai"}
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${item.type === "before" ? "brightness-[0.65] saturate-[0.4]" : ""}`} loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className={`inline-block text-sm px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider ${item.type === "before" ? "bg-red-900/80 text-gray-900 dark:text-white" : "bg-golden/90 text-black"}`}>
                          {item.type === "before" ? "Before" : "After"}
                        </span>
                      </div>
                      {item.type === "after" && (
                        <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-golden/90">
                          <Sparkles className="h-3.5 w-3.5 text-black" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {["100% Hand-Washed", "Imported Products Only", "Certified Detailers", "Same-Day Service", "Live Job Tracking", "Free Inspection"].map(tag => (
                <div key={tag} className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/35">
                  <Shield className="h-4 w-4 text-golden/50 shrink-0" /> <span>{tag}</span>
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
        <section id="gallery" className="relative overflow-hidden px-5 py-24 lg:px-8 bg-white dark:bg-[#0a0a0a]">
          <div className="mx-auto max-w-7xl relative">
            <div className="mb-14 text-center">
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-golden/60">Our Work</motion.p>
              <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white uppercase">Results That Speak</motion.h2>
              <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="auto-divider mx-auto mt-3 max-w-xs" />
              </motion.div>
              <motion.p variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-4 max-w-md text-base text-gray-500 dark:text-white/30">
                Real cars. Real results. Every transformation documented.
              </motion.p>
            </div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[220px]">
              {GALLERY.map((photo, i) => (
                <motion.div key={i} variants={fadeUp}
                  whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                  className={`group relative cursor-zoom-in ${photo.wide ? "col-span-2" : ""}`}>
                  <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.06] h-full">
                    <div className="relative aspect-square overflow-hidden">
                      <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    </div>
                    <p className="mt-2 text-center text-sm text-gray-500 dark:text-white/30 truncate px-1">{photo.alt}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-10 text-center">
              <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+see+more+of+your+work" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-golden/20 bg-golden/[0.06] px-6 py-3 text-sm font-semibold text-golden hover:bg-golden/15 hover:border-golden/40 transition-all duration-200">
                <MessageCircle className="h-4 w-4" /> See more on WhatsApp
              </a>
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          VIDEO SHOWCASE
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-5 py-24 lg:px-8 bg-gray-50 dark:bg-[#0d0d0f]">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-golden/60">Watch Us Work</motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white uppercase">See The Magic Happen</motion.h2>
            <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-4 max-w-md text-base text-gray-500 dark:text-white/30">
              Watch our team transform a car from dusty and dull to a gleaming showroom finish. Every step. Every detail.
            </motion.p>
          </div>
          <motion.div ref={videoRef} variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-[0_20px_80px_rgba(0,0,0,0.4)] aspect-video bg-black">
            {!videoReady && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#C9A227] shadow-[0_0_50px_rgba(201,162,39,0.6)] border-4 border-gray-200 dark:border-white/20 animate-pulse">
                  <Play className="h-8 w-8 text-black fill-black ml-1" />
                </div>
                <p className="text-gray-500 dark:text-white/40 text-sm">Scroll down — video auto-plays</p>
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
                <span className="rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-[11px] font-semibold text-gray-600 dark:text-white/60 flex items-center gap-1.5">
                  Use player controls to unmute
                </span>
              </div>
            )}
            <div className="absolute top-4 right-4 pointer-events-none">
              <span className="rounded-full bg-[#C9A227]/90 px-3 py-1 text-[11px] font-bold text-black uppercase tracking-wider">Auto Detailing</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          STATS
      ═══════════════════════════════════════════════════════ */}
      <section id="why-bakkah" className="relative overflow-hidden border-y border-gray-200 dark:border-white/[0.04] px-5 py-24 lg:px-8 bg-white dark:bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-carbon-fiber pointer-events-none opacity-20" />
        <div className="mx-auto max-w-5xl relative">
          <div className="mb-14 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-golden/60">Our Track Record</motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white uppercase">Why Choose Bakkah</motion.h2>
            <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-4 max-w-sm text-base text-gray-500 dark:text-white/30">
              Numbers don&apos;t lie. Transforming cars in Dubai since 2025.
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
                  <p className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-none tracking-wide stat-number">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                </div>
                <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">{stat.label}</p>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-white/25">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-14 flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: Award, label: "Dubai Certified" },
              { icon: Sparkles, label: "Premium Products" },
              { icon: Shield, label: "Certified Team" },
              { icon: Shield, label: "Fully Insured" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-xl border border-golden/15 bg-golden/[0.04] px-5 py-2.5">
                <Icon className="h-4 w-4 text-golden/60" />
                <span className="text-sm font-semibold text-gray-600 dark:text-white/50">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative overflow-hidden px-5 py-28 lg:px-8 bg-gray-50 dark:bg-[#0d0d0f]">
        <div className="absolute inset-0 bg-carbon-fiber pointer-events-none opacity-30" />
        <div className="mx-auto max-w-5xl relative">
          <div className="mb-16 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-golden/60">Dead Simple Process</motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white uppercase">How It Works</motion.h2>
            <div className="auto-divider mx-auto mt-3 max-w-sm" />
            <motion.p variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-4 max-w-md text-base text-gray-500 dark:text-white/30">
              Three steps. One immaculate car. Zero headaches. We promise.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 relative">
            {/* Connecting line */}
            <div className="absolute top-14 left-[calc(33.33%+16px)] right-[calc(33.33%+16px)] hidden lg:block">
              <div className="h-px bg-gradient-to-r from-transparent via-golden/30 to-transparent" />
            </div>
            {[
              { title: "Drop Your Car", icon: Car, desc: "Drive in any time. Full walkaround, every scratch documented with photos. We explain exactly what we'll do — no surprises." },
              { title: "We Work Our Magic", icon: Sparkles, desc: "Certified detailers go to work with premium imported products. Track live status from your phone the whole time." },
              { title: "Pick Up & Stare", icon: ThumbsUp, desc: "Come collect your car. Prepare for a double-take. Looks better than the day you bought it — or we make it right." },
            ].map((step, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="group relative rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-8 hover:border-golden/20 transition-all duration-300">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-golden/20 bg-golden/[0.06]">
                    <span className="text-lg text-golden font-bold">0{i + 1}</span>
                  </div>
                  <step.icon className="h-8 w-8 text-golden/40" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-white/35 leading-relaxed">{step.desc}</p>
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
      <section className="relative overflow-hidden border-y border-golden/10 bg-white dark:bg-[#0a0a0a] px-5 py-20 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(201,162,39,0.06),transparent)] pointer-events-none" />
        <div className="mx-auto max-w-3xl relative text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-golden/20 bg-golden/[0.06] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-golden">
            <Car className="h-3.5 w-3.5" /> Live Status Updates
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white uppercase">Track Your Vehicle</motion.h2>
          <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mx-auto mt-4 max-w-lg text-base text-gray-500 dark:text-white/40 leading-relaxed">
            Know exactly where your car is in our detailing process. Live status from drop-off to delivery.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8">
            <Link href="/track" className={goldBtn + " text-base px-9 py-4 mx-auto"}>
              <Car className="h-5 w-5" /> Track My Vehicle <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.p variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-4 text-sm text-gray-400 dark:text-white/25">
            Use your job number (e.g. JC-2025-0001) or your registered phone number
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-5 py-24 lg:px-8 bg-gray-50 dark:bg-[#0d0d0f]">
        <div className="mx-auto max-w-3xl relative">
          <div className="mb-14 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-golden/60">Common Questions</motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white uppercase">Everything You Need To Know</motion.h2>
            <div className="auto-divider mx-auto mt-3 max-w-xs" />
          </div>
          <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] px-7">
            {FAQ_ITEMS.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
          </motion.div>
          <motion.p variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8 text-center text-base text-gray-500 dark:text-white/30">
            Still have questions?{" "}
            <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I+have+a+question" target="_blank" rel="noopener noreferrer" className="font-semibold text-golden hover:underline">
              Chat with us on WhatsApp
            </a>
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          REVIEWS
      ═══════════════════════════════════════════════════════ */}
      {reviewsLoaded && reviews.length > 0 && (
        <section id="reviews" className="relative overflow-hidden px-5 py-28 lg:px-8 bg-white dark:bg-[#0a0a0a]">
          <div className="absolute inset-0 bg-carbon-fiber pointer-events-none opacity-20" />
          <div className="mx-auto max-w-7xl relative">
            <div className="mb-14 text-center">
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-golden/60">Customer Reviews</motion.p>
              <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-gray-900 dark:text-white uppercase">Real Words. Real Cars.</motion.h2>
              <div className="auto-divider mx-auto mt-3 max-w-xs" />
              <motion.p variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-4 max-w-md text-base text-gray-500 dark:text-white/30">
                Don&apos;t take our word for it — read what our customers say.
              </motion.p>
            </div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((r) => (
                <motion.div key={r.id} variants={fadeUp} whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="relative rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-6">
                  <Quote className="absolute top-3 right-3 h-8 w-8 text-golden/10" />
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`h-4 w-4 ${star <= r.rating ? "text-golden" : "text-gray-400 dark:text-white/10"}`} fill={star <= r.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                  {r.comment && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-white/45 leading-relaxed line-clamp-4 italic">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-golden/15 bg-golden/[0.06] text-sm font-bold text-golden shrink-0">
                      {r.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{r.customer_name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-white/25">Verified Customer</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {avgRating && reviews.length >= 3 && (
              <motion.div variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-10 text-center">
                <div className="inline-flex items-center gap-3 rounded-xl border border-golden/15 bg-golden/[0.04] px-6 py-3">
                  <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 text-golden" fill="currentColor" />)}</div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{avgRating} average</span>
                  <span className="text-sm text-gray-500 dark:text-white/30">from {reviews.length} {reviews.length !== 1 ? "reviews" : "review"}</span>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          FOOTER / CONTACT
      ═══════════════════════════════════════════════════════ */}
      <footer id="contact" className="border-t border-gray-200 dark:border-white/[0.04] bg-white dark:bg-[#0a0a0a] px-5 pt-16 pb-10 lg:px-8">
        <div className="mx-auto max-w-7xl relative">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 mb-14">
            {/* Brand column */}
            <div className="lg:col-span-1">
              <div className="mb-5 flex items-center gap-3">
                <div className="relative">
                  <img src="/logo.svg" alt="Bakkah Premium Auto Care" className="h-11 w-11 rounded-full" />
                </div>
                <div className="leading-none">
                  <p className="font-display text-xl tracking-[0.22em] text-gray-900 dark:text-white leading-none">BAKKAH</p>
                  <p className="text-sm text-golden/70">Premium Auto Care</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-white/35 leading-relaxed max-w-xs">
                A trusted vehicle detailing studio in Al Qusais, Dubai. Excellence in every detail, every time.
              </p>
              <div className="mt-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 text-golden" fill="currentColor" />)}
                <span className="ml-2 text-sm text-gray-400 dark:text-white/25">5.0 on Google</span>
              </div>
              <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+service" target="_blank" rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#25D366]/20 bg-[#25D366]/[0.06] px-4 py-2.5 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/15 transition-colors duration-200">
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </div>

            {/* Services column */}
            <div>
              <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-golden/50">Our Services</h4>
              <ul className="space-y-3">
                {SERVICES.map(s => (
                  <li key={s.title} className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-white/35">
                    <s.icon className="h-4 w-4 text-golden/40 shrink-0" /> {s.title}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact column */}
            <div>
              <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-golden/50">Get In Touch</h4>
              <ul className="space-y-4">
                {[
                  { icon: MapPin, text: "Al Qusais Industrial Area\nDubai, UAE", href: "https://www.google.com/maps/dir/?api=1&destination=Bakkah+Premium+Auto+Care+Al+Qusais+Industrial+Area+Dubai" },
                  { icon: Phone, text: "+971 54 588 6999", href: "tel:+971545886999" },
                  { icon: Mail, text: "info@bakkah.ae", href: "mailto:info@bakkah.ae" },
                ].map(({ icon: Icon, text, href }) => (
                  <li key={text}>
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-start gap-3 group">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] group-hover:border-golden/30 group-hover:bg-golden/[0.06] transition-colors">
                        <Icon className="h-3.5 w-3.5 text-golden/60" />
                      </div>
                      <span className="text-sm text-gray-500 dark:text-white/35 leading-relaxed whitespace-pre-line group-hover:text-gray-600 dark:text-white/50 transition-colors">{text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hours + Info column */}
            <div>
              <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-golden/50">Working Hours</h4>
              <div className="space-y-2.5">
                {[
                  { day: "Mon – Sat", hours: "8:00 AM – 8:00 PM" },
                  { day: "Sunday", hours: "9:00 AM – 5:00 PM" },
                ].map(h => (
                  <div key={h.day} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-white/35">{h.day}</span>
                    <span className="font-semibold text-gray-600 dark:text-white/55">{h.hours}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-golden/40 mb-3">We Accept</p>
                <div className="flex flex-wrap gap-2">
                  {["Cash (AED)", "Visa", "Mastercard", "Apple Pay", "Bank Transfer"].map(method => (
                    <span key={method} className="rounded-lg border border-gray-200 dark:border-white/[0.04] bg-gray-50 dark:bg-white/[0.02] px-2.5 py-1 text-xs text-gray-500 dark:text-white/30">{method}</span>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Link href="/track" className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-white/35 hover:text-golden transition-colors">
                  <Car className="h-4 w-4" /> Track Your Vehicle
                </Link>
                <Link href="/auth/login" className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-white/35 hover:text-golden transition-colors">
                  <ChevronRight className="h-4 w-4" /> Staff Portal
                </Link>
              </div>
            </div>
          </div>

          {/* Social / Connect Row */}
          <div className="mb-10 rounded-2xl border border-gray-200 dark:border-white/[0.04] bg-white/[0.01] p-7">
            <p className="mb-6 text-center text-sm font-bold uppercase tracking-wider text-golden/40">Find Us · Contact Us · Follow Us</p>
            <div className="flex flex-wrap items-stretch justify-center gap-3">
              {/* WhatsApp */}
              <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+service" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3.5 rounded-xl border border-[#25D366]/20 bg-[#25D366]/[0.06] px-5 py-4 text-[#25D366] hover:bg-[#25D366]/15 hover:border-[#25D366]/40 hover:scale-[1.03] transition-all duration-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]">
                  <MessageCircle className="h-5 w-5 fill-white text-gray-900 dark:text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">WhatsApp</p>
                  <p className="text-sm text-[#25D366]/70">Book instantly — 2 min reply</p>
                </div>
              </a>
              {/* Call */}
              <a href="tel:+971545886999"
                className="flex items-center gap-3.5 rounded-xl border border-golden/20 bg-golden/[0.06] px-5 py-4 hover:bg-golden/15 hover:border-golden/40 hover:scale-[1.03] transition-all duration-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-golden">
                  <Phone className="h-5 w-5 text-black" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Call Now</p>
                  <p className="text-sm text-golden/70">+971 54 588 6999</p>
                </div>
              </a>
              {/* Instagram */}
              <a href="https://www.instagram.com/bakkah_premium_auto_care/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3.5 rounded-xl border border-pink-400/15 bg-pink-500/[0.04] px-5 py-4 hover:bg-pink-500/10 hover:border-pink-400/35 hover:scale-[1.03] transition-all duration-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]">
                  <svg className="h-5 w-5 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Instagram</p>
                  <p className="text-sm text-pink-400/70">Before & after transformations</p>
                </div>
              </a>
              {/* Google */}
              <a href="https://maps.google.com/?q=Bakkah+Premium+Auto+Care+Al+Qusais+Dubai" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3.5 rounded-xl border border-blue-400/15 bg-blue-500/[0.04] px-5 py-4 hover:bg-blue-500/10 hover:border-blue-400/35 hover:scale-[1.03] transition-all duration-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Google Reviews</p>
                  <p className="text-sm text-blue-400/70">5.0 · 1,200+ reviews</p>
                </div>
              </a>
              {/* Get Directions */}
              <a href="https://www.google.com/maps/dir/?api=1&destination=Bakkah+Premium+Auto+Care+Al+Qusais+Industrial+Area+Dubai" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3.5 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.04] px-5 py-4 hover:bg-emerald-500/10 hover:border-emerald-400/35 hover:scale-[1.03] transition-all duration-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500">
                  <Navigation className="h-5 w-5 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Get Directions</p>
                  <p className="text-sm text-emerald-400/70">Al Qusais Industrial Area</p>
                </div>
              </a>
            </div>
          </div>

          {/* Gold divider */}
          <div className="auto-divider mb-6" />

          {/* Service area — local SEO signal */}
          <p className="mb-5 text-center text-sm text-gray-400 dark:text-white/15 leading-relaxed">
            <span className="font-semibold text-gray-400 dark:text-white/25">Car detailing near you:</span>{" "}
            Al Qusais · Deira · Al Nahda · Muhaisnah · Mirdif · Al Rashidiya · Al Mizhar · Sharjah · Dubai International Airport area · and all of Dubai, UAE.
          </p>

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400 dark:text-white/20">
            <p>© 2025 Bakkah Premium Auto Care LLC. All rights reserved. Proudly serving Dubai since 2025.</p>
            <p className="text-center sm:text-right">
              <span className="text-gray-400 dark:text-white/10">VAT Reg. No: </span>
              <span className="font-mono">100XXXXXXXXX00003</span>
              <span className="mx-2">·</span>
              <span className="text-gray-400 dark:text-white/10">Made with care in Dubai</span>
            </p>
          </div>
        </div>
      </footer>

      {/* ── Website Chat Widget ───────────────────────────── */}
      <ChatWidget />

      {/* ── Sticky Mobile CTA Bar ─────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-[#0a0a0a]/96 backdrop-blur-xl border-t border-gray-200 dark:border-white/[0.06] px-4 py-3 flex gap-2 shadow-[0_-8px_32px_rgba(0,0,0,0.3)]">
        <a href="tel:+971545886999"
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-golden/20 bg-golden/[0.06] py-2.5 font-bold text-golden text-xs">
          <Phone className="h-4 w-4" /> Call
        </a>
        <a href="https://www.google.com/maps/dir/?api=1&destination=Bakkah+Premium+Auto+Care+Al+Qusais+Industrial+Area+Dubai" target="_blank" rel="noopener noreferrer"
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] py-2.5 font-bold text-emerald-500 text-xs">
          <Navigation className="h-4 w-4" /> Directions
        </a>
        <a href="https://wa.me/971545886999?text=Hi+Bakkah!+I'd+like+to+book+a+service" target="_blank" rel="noopener noreferrer"
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-bold text-gray-900 dark:text-white shadow-[0_4px_16px_rgba(37,211,102,0.3)]">
          <MessageCircle className="h-4 w-4 fill-white" /> WhatsApp Now
        </a>
      </div>

    </div>
  );
}
