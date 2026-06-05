'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import {
  Sparkles, Shield, Zap, Droplets, ClipboardCheck, Truck,
  MapPin, Phone, Mail, ChevronRight, Search, ArrowRight, Star, Car,
  MessageCircle, CheckCircle, Quote, Award, Flame,
} from 'lucide-react'

// ── Data ──────────────────────────────────────────────────────

const TICKER_ITEMS = [
  'CERAMIC COATING', 'PAINT CORRECTION', 'FULL DETAIL', 'INTERIOR DEEP CLEAN',
  'RTA INSPECTION', 'FLEET SERVICES', 'NANO COATING', 'CLAY BAR TREATMENT',
  'STEAM CLEANING', 'SCRATCH REMOVAL',
]

const SERVICES = [
  {
    icon: Sparkles, title: 'Full Detail Package', tag: 'Most Popular', emoji: '✨',
    desc: "Complete exterior & interior treatment — hand wash, clay bar, machine polish, protective coating. Your car walks in. A showstopper drives out.",
  },
  {
    icon: Shield, title: 'Ceramic Coating', tag: '5-Year Warranty', emoji: '🛡️',
    desc: "Nano-ceramic bonds directly to your paint for years of brilliant gloss. Water beads off. Dust slides off. Even Dubai sand waves goodbye.",
  },
  {
    icon: Zap, title: 'Paint Correction', tag: 'Expert Only', emoji: '⚡',
    desc: "Swirl marks? Scratches? Oxidation? Parking lot regret? We erase it all with multi-stage machine polishing. Like it never happened.",
  },
  {
    icon: Droplets, title: 'Interior Detailing', tag: 'Full Sanitize', emoji: '🫧',
    desc: "Steam clean every crack, condition the leather, extract the carpets, and eliminate every odor. You'll think you bought a new car.",
  },
  {
    icon: ClipboardCheck, title: 'RTA Inspection', tag: 'Same Day', emoji: '📋',
    desc: "First-time pass guaranteed (almost always). We prep your vehicle perfectly for RTA registration — no stress, no re-visits, no drama.",
  },
  {
    icon: Truck, title: 'Fleet Services', tag: 'B2B', emoji: '🚛',
    desc: "Got 5 cars? 50 cars? An entire motorcade? Dedicated packages for corporate fleets with flexible scheduling and volume pricing.",
  },
]

const STATS = [
  { value: 5000, suffix: '+', label: 'Cars Transformed', sub: 'And counting' },
  { value: 98,   suffix: '%', label: 'Client Satisfaction', sub: 'Verified reviews' },
  { value: 12,   suffix: '+', label: 'Years of Excellence', sub: 'Since 2012' },
  { value: 500,  suffix: '+', label: 'Cars Per Month', sub: 'Busy workshop!' },
]

const HOW_IT_WORKS = [
  {
    step: '01', emoji: '🚗',
    title: 'Drop Your Car',
    desc: "Drive in any time. Our team does a full walkaround, documents every existing scratch (you're covered), and explains exactly what we'll do.",
  },
  {
    step: '02', emoji: '✨',
    title: 'We Work Our Magic',
    desc: "Certified detailers go to work with premium imported products and professional equipment. Track live status from your phone the whole time.",
  },
  {
    step: '03', emoji: '🤩',
    title: 'Pick Up & Stare',
    desc: "Come collect your car. Prepare for a double-take. We guarantee it'll look better than the day you bought it — or we make it right.",
  },
]

const FEATURES = [
  '100% Hand-Washed',
  'Imported Products Only',
  'Certified Detailers',
  'Same-Day Service Available',
  'Live Job Status Tracking',
  'Free Vehicle Inspection',
]

// ── Animated Counter ──────────────────────────────────────────

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    let current = 0
    const steps = 60
    const increment = value / steps
    const timer = setInterval(() => {
      current += increment
      if (current >= value) { setCount(value); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, 2000 / steps)
    return () => clearInterval(timer)
  }, [inView, value])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? 'fill-[#FF7F0A] text-[#FF7F0A]' : 'text-white/15'}`} />
      ))}
    </div>
  )
}

// ── Motion ────────────────────────────────────────────────────

const easeOut = [0.25, 0.1, 0.25, 1] as const
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, delay: i * 0.08, ease: easeOut },
  }),
}
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }

// ── Page ──────────────────────────────────────────────────────

type Review = { id: string; customer_name: string; rating: number; comment: string | null; created_at: string }

export default function BakkahHomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoaded, setReviewsLoaded] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    fetch('/api/feedback?approved=true')
      .then(r => r.json())
      .then(d => { setReviews(d.feedback ?? []); setReviewsLoaded(true) })
      .catch(() => setReviewsLoaded(true))
  }, [])

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-x-hidden">

      {/* ── Floating WhatsApp ──────────────────────────────── */}
      <motion.a
        href="https://wa.me/971589397610?text=Hi+Bakkah!+I'd+like+to+book+a+detailing+service+%F0%9F%9A%97"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_32px_rgba(37,211,102,0.45)] hover:shadow-[0_8px_40px_rgba(37,211,102,0.6)] transition-shadow duration-300"
      >
        <MessageCircle className="h-5 w-5 fill-white" />
        <span className="hidden sm:block">WhatsApp Us</span>
      </motion.a>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_2px_30px_rgba(0,0,0,0.5)]' : ''
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#top" className="flex items-center gap-3 group select-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF7F0A] shadow-[0_0_20px_rgba(255,127,10,0.4)] group-hover:shadow-[0_0_30px_rgba(255,127,10,0.6)] transition-all duration-300">
              <Car className="h-[18px] w-[18px] text-black" />
            </div>
            <div className="leading-none">
              <p className="font-display text-xl tracking-[0.2em] text-white leading-none">BAKKAH</p>
              <p className="text-[9px] tracking-[0.15em] text-white/30">AUTO DETAILING</p>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/40">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#reviews" className="hover:text-white transition-colors">Reviews</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/track"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white/55 hover:border-[#FF7F0A]/30 hover:text-white transition-all duration-200"
            >
              <Search className="h-3.5 w-3.5" />Track Vehicle
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#FF7F0A] px-4 py-2 text-sm font-bold text-black shadow-[0_0_20px_rgba(255,127,10,0.25)] hover:bg-[#FF9F3A] hover:shadow-[0_0_30px_rgba(255,127,10,0.4)] transition-all duration-200"
            >
              Staff Portal<ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section id="top" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-16 text-center">

        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0">
          {/* Subtle car photo */}
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=60"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover opacity-[0.1] mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/80 via-[#050507]/20 to-[#050507]" />
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
          {/* Orange glow centre */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-[320px] w-[320px] sm:h-[700px] sm:w-[700px] rounded-full bg-[#FF7F0A]/[0.06] blur-[60px] sm:blur-[140px] animate-pulse-slow" />
          </div>
          <div className="absolute left-[12%] top-[20%] hidden sm:block">
            <div className="h-[400px] w-[400px] rounded-full bg-[#FF7F0A]/[0.03] blur-[120px]" />
          </div>
          <div className="absolute right-[8%] bottom-[15%] hidden sm:block">
            <div className="h-[300px] w-[300px] rounded-full bg-[#D4AF37]/[0.025] blur-[90px]" />
          </div>
        </div>

        <div className="relative z-10 max-w-5xl w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#FF7F0A]/25 bg-[#FF7F0A]/10 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF7F0A]"
          >
            <Star className="h-3 w-3 fill-[#FF7F0A]" />
            Dubai&apos;s Premier Auto Detailing Studio
            <Star className="h-3 w-3 fill-[#FF7F0A]" />
          </motion.div>

          {/* Headline */}
          {['EXCELLENCE', 'IN EVERY', 'DETAIL.'].map((word, i) => (
            <div key={word} className="overflow-hidden">
              <motion.h1
                initial={{ y: 110, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: easeOut }}
                className={`font-display leading-[0.88] tracking-[0.05em] text-[clamp(3.2rem,10.5vw,8.5rem)] ${
                  i === 1 ? 'text-[#FF7F0A]' : 'text-white'
                }`}
              >
                {word}
              </motion.h1>
            </div>
          ))}

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="mx-auto mt-8 max-w-lg text-[15px] leading-relaxed text-white/50 sm:text-base"
          >
            Al Qusais, Dubai&apos;s most trusted specialists in ceramic coatings, paint correction,
            and complete vehicle detailing.{' '}
            <span className="text-white/80 font-semibold">5,000+ happy customers</span>{' '}
            — and your car is next. 🚗
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/track"
              className="group inline-flex items-center gap-3 rounded-xl bg-[#FF7F0A] px-7 py-3.5 text-sm font-bold text-black shadow-[0_0_40px_rgba(255,127,10,0.3)] transition-all duration-300 hover:bg-[#FF9F3A] hover:shadow-[0_0_60px_rgba(255,127,10,0.4)] hover:scale-[1.03] active:scale-[0.97]"
            >
              Track My Vehicle
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
            </Link>
            <a
              href="https://wa.me/971589397610?text=Hi+Bakkah!+I'd+like+to+book+a+detailing+service"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-7 py-3.5 text-sm font-semibold text-[#25D366] transition-all duration-300 hover:border-[#25D366]/50 hover:bg-[#25D366]/20 hover:scale-[1.02]"
            >
              <MessageCircle className="h-4 w-4" />
              Book via WhatsApp
            </a>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-5 text-xs text-white/30"
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#FF7F0A] text-[#FF7F0A]" />)}
              </div>
              <span>5.0 Rating</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <span>1,200+ Google Reviews</span>
            <div className="h-3 w-px bg-white/10" />
            <span>Certified Detailers</span>
            <div className="h-3 w-px bg-white/10" />
            <span>Al Qusais, Dubai 🇦🇪</span>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] uppercase tracking-[0.25em] text-white/20">Scroll</span>
          <div className="scroll-bob h-10 w-px bg-gradient-to-b from-[#FF7F0A]/40 to-transparent" />
        </motion.div>
      </section>

      {/* ── Service ticker ─────────────────────────────────── */}
      <div className="overflow-hidden border-y border-[#FF7F0A]/10 bg-[#FF7F0A]/[0.03] py-4">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex shrink-0 items-center px-8">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FF7F0A]/60">{item}</span>
              <span className="ml-8 text-[#FF7F0A]/25 text-xs">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Services ───────────────────────────────────────── */}
      <section id="services" className="relative overflow-hidden px-5 py-28 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,127,10,0.04),transparent)]" />
        <div className="mx-auto max-w-7xl relative">
          <div className="mb-16 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF7F0A]">
              What We Do Best
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              className="font-display text-[clamp(2.2rem,5.5vw,4rem)] tracking-[0.05em] text-white">
              OUR SERVICES
            </motion.h2>
            <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              className="mx-auto mt-3 h-px w-20 bg-gradient-to-r from-transparent via-[#FF7F0A] to-transparent" />
            <motion.p variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              className="mx-auto mt-5 max-w-md text-sm text-white/38 leading-relaxed">
              Professional-grade detailing using the finest imported products and latest techniques. Yes, we&apos;re THAT good.
            </motion.p>
          </div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SERVICES.map((s) => (
              <motion.div
                key={s.title}
                variants={fadeUp}
                whileHover={{ y: -8, transition: { duration: 0.22 } }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 cursor-default transition-all duration-300 hover:border-[#FF7F0A]/20 hover:bg-[#FF7F0A]/[0.03] hover:shadow-[0_12px_40px_rgba(255,127,10,0.07)]"
              >
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#FF7F0A]/0 group-hover:bg-[#FF7F0A]/[0.07] blur-2xl transition-all duration-500" />
                <div className="mb-5 flex items-center justify-between">
                  <span className="rounded-full border border-[#FF7F0A]/20 bg-[#FF7F0A]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FF7F0A]">{s.tag}</span>
                  <span className="text-2xl">{s.emoji}</span>
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] transition-all duration-300 group-hover:border-[#FF7F0A]/25 group-hover:bg-[#FF7F0A]/[0.07]">
                  <s.icon className="h-5 w-5 text-[#FF7F0A]" />
                </div>
                <h3 className="mb-2 text-[15px] font-bold text-white">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Before / After ─────────────────────────────────── */}
      <section className="relative overflow-hidden px-5 py-24 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(255,127,10,0.025),transparent)]" />
        <div className="mx-auto max-w-6xl relative">
          <div className="mb-14 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF7F0A]">
              See The Difference
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-white">
              BEFORE & AFTER
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mx-auto mt-4 max-w-md text-sm text-white/40">
              We promised results. Here they are. Your car won&apos;t recognize itself — and neither will your neighbours.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="relative overflow-hidden rounded-2xl border border-white/[0.06] group"
            >
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80"
                alt="Vehicle before detailing"
                className="w-full h-[260px] object-cover transition-transform duration-500 group-hover:scale-105 brightness-[0.65] saturate-50"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="rounded-lg bg-red-500/80 backdrop-blur-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                  Before 😩
                </span>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="relative overflow-hidden rounded-2xl border border-[#FF7F0A]/20 group shadow-[0_0_40px_rgba(255,127,10,0.08)]"
            >
              <img
                src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80"
                alt="Vehicle after detailing"
                className="w-full h-[260px] object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="rounded-lg bg-[#FF7F0A]/90 backdrop-blur-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black">
                  After ✨
                </span>
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            {FEATURES.map(tag => (
              <div key={tag} className="flex items-center gap-2 text-sm text-white/45">
                <CheckCircle className="h-4 w-4 text-[#FF7F0A] shrink-0" />
                <span>{tag}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section id="why-bakkah" className="relative overflow-hidden border-y border-white/[0.05] px-5 py-24 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,127,10,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,127,10,0.015)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="mx-auto max-w-5xl relative">
          <div className="mb-14 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF7F0A]">
              Our Track Record
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-white">
              WHY CHOOSE BAKKAH
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mx-auto mt-4 max-w-sm text-sm text-white/38">
              Numbers don&apos;t lie. We&apos;ve been transforming cars since before ceramic coating was even a thing.
            </motion.p>
          </div>

          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp} custom={i * 0.7}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="text-center"
              >
                <p className="font-display text-[clamp(2.8rem,5.5vw,4.5rem)] text-[#FF7F0A] leading-none tracking-wide">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-sm font-bold text-white/70">{stat.label}</p>
                <p className="mt-1 text-[11px] text-white/25">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section id="how-it-works" className="relative overflow-hidden px-5 py-28 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(255,127,10,0.03),transparent)]" />
        <div className="mx-auto max-w-5xl relative">
          <div className="mb-16 text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF7F0A]">
              Dead Simple Process
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-white">
              HOW IT WORKS
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mx-auto mt-4 max-w-md text-sm text-white/38">
              Three steps. One immaculate car. Zero headaches. We promise.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 relative">
            {/* Connector lines */}
            <div className="absolute top-14 left-[calc(33.33%_+_16px)] right-[calc(33.33%_+_16px)] hidden lg:block h-px bg-gradient-to-r from-[#FF7F0A]/30 via-[#FF7F0A]/15 to-[#FF7F0A]/30" />

            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                variants={fadeUp} custom={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-[#FF7F0A]/20 hover:bg-[#FF7F0A]/[0.02] transition-all duration-300"
              >
                <div className="mb-6 flex items-center gap-4">
                  <span className="font-display text-[2.5rem] leading-none text-[#FF7F0A]/20 group-hover:text-[#FF7F0A]/40 transition-colors duration-300">{step.step}</span>
                  <span className="text-4xl">{step.emoji}</span>
                </div>
                <h3 className="mb-3 text-lg font-bold text-white">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <a
              href="https://wa.me/971589397610?text=Hi+Bakkah!+I'd+like+to+book+a+detailing+service"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-8 py-4 text-sm font-bold text-[#25D366] transition-all duration-300 hover:border-[#25D366]/50 hover:bg-[#25D366]/20 hover:scale-[1.02]"
            >
              <MessageCircle className="h-5 w-5" />
              Book Your Appointment Now
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Reviews ────────────────────────────────────────── */}
      {reviewsLoaded && reviews.length > 0 && (
        <section id="reviews" className="relative overflow-hidden px-5 py-28 lg:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(255,127,10,0.025),transparent)]" />
          <div className="mx-auto max-w-7xl relative">
            <div className="mb-14 text-center">
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF7F0A]">
                Customer Reviews
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-white">
                REAL WORDS. REAL CARS.
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="mx-auto mt-4 max-w-md text-sm text-white/38">
                Don&apos;t take our word for it — read what our customers say after picking up their freshly-detailed rides. 🚗✨
              </motion.p>
            </div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={stagger}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {reviews.slice(0, 6).map((r) => (
                <motion.div
                  key={r.id}
                  variants={fadeUp}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-[#FF7F0A]/15 hover:bg-[#FF7F0A]/[0.02] transition-all duration-300"
                >
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-[#FF7F0A]/10" />
                  <StarRow rating={r.rating} />
                  {r.comment && (
                    <p className="mt-3 text-sm text-white/55 leading-relaxed line-clamp-4">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF7F0A]/15 text-sm font-bold text-[#FF7F0A] shrink-0">
                      {r.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/80">{r.customer_name}</p>
                      <p className="text-[11px] text-white/25">Verified Customer</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {avgRating && reviews.length >= 3 && (
              <motion.div
                variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="mt-10 text-center"
              >
                <div className="inline-flex items-center gap-3 rounded-xl border border-[#FF7F0A]/15 bg-[#FF7F0A]/[0.05] px-6 py-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-[#FF7F0A] text-[#FF7F0A]" />)}
                  </div>
                  <span className="text-sm font-bold text-white">{avgRating} average</span>
                  <span className="text-sm text-white/40">from {reviews.length} verified review{reviews.length !== 1 ? 's' : ''}</span>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ── Track CTA ──────────────────────────────────────── */}
      <section id="track" className="px-5 py-28 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
            className="relative overflow-hidden rounded-3xl border border-[#FF7F0A]/15 bg-gradient-to-br from-[#FF7F0A]/[0.08] via-[#FF7F0A]/[0.04] to-transparent p-10 text-center lg:p-16"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#FF7F0A]/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-[#FF7F0A]/[0.06] blur-2xl" />

            <div className="relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#FF7F0A]/20 bg-[#FF7F0A]/10 shadow-[0_0_30px_rgba(255,127,10,0.15)]"
              >
                <Search className="h-7 w-7 text-[#FF7F0A]" />
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="font-display text-[clamp(1.8rem,5vw,3rem)] tracking-[0.05em] text-white">
                TRACK YOUR VEHICLE
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="mx-auto mt-4 max-w-md text-sm text-white/45 leading-relaxed">
                Know exactly where your car is in our detailing process. Live status updates from drop-off all the way to delivery — no calls needed.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8">
                <Link
                  href="/track"
                  className="group inline-flex items-center gap-3 rounded-xl bg-[#FF7F0A] px-8 py-4 text-sm font-bold text-black shadow-[0_0_40px_rgba(255,127,10,0.25)] transition-all duration-300 hover:bg-[#FF9F3A] hover:shadow-[0_0_60px_rgba(255,127,10,0.4)] hover:scale-[1.03] active:scale-[0.97]"
                >
                  Track My Vehicle
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                </Link>
              </motion.div>
              <motion.p variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="mt-5 text-xs text-white/25">
                Use your job number (e.g. JC-2025-0001) or your registered phone number
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer id="contact" className="border-t border-white/[0.06] px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 mb-14">

            {/* Brand column */}
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF7F0A] shadow-[0_0_20px_rgba(255,127,10,0.35)]">
                  <Car className="h-[18px] w-[18px] text-black" />
                </div>
                <div className="leading-none">
                  <p className="font-display text-xl tracking-[0.2em] text-white leading-none">BAKKAH</p>
                  <p className="text-[9px] tracking-[0.15em] text-white/30">AUTO DETAILING</p>
                </div>
              </div>
              <p className="text-sm text-white/38 leading-relaxed max-w-xs">
                Dubai&apos;s premier vehicle detailing studio. Excellence in every detail, every time. Your car deserves nothing less. 🏆
              </p>
              <div className="mt-5 flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#FF7F0A] text-[#FF7F0A]" />)}
                <span className="ml-2 text-xs text-white/30">5.0 on Google</span>
              </div>
              <div className="mt-5">
                <a
                  href="https://wa.me/971589397610?text=Hi+Bakkah!+I'd+like+to+book+a+service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#25D366]/15 border border-[#25D366]/25 px-4 py-2.5 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/25 transition-colors duration-200"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Services list */}
            <div>
              <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">Our Services</h4>
              <ul className="space-y-3">
                {SERVICES.map(s => (
                  <li key={s.title} className="flex items-center gap-2.5 text-sm text-white/38">
                    <span className="text-base shrink-0">{s.emoji}</span>
                    {s.title}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">Get In Touch</h4>
              <ul className="space-y-4">
                {[
                  { icon: MapPin, text: 'Al Qusais Industrial Area\nDubai, UAE 🇦🇪' },
                  { icon: Phone, text: '+971 50 000 0000' },
                  { icon: Mail,  text: 'info@bakkah.ae' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#FF7F0A]/15 bg-[#FF7F0A]/10">
                      <Icon className="h-3.5 w-3.5 text-[#FF7F0A]" />
                    </div>
                    <span className="text-sm text-white/38 leading-relaxed whitespace-pre-line">{text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-2">Opening Hours</p>
                <p className="text-sm text-white/50">Mon – Sat: 8:00 AM – 8:00 PM</p>
                <p className="text-sm text-white/50">Sunday: 9:00 AM – 5:00 PM</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.05] pt-8 sm:flex-row">
            <p className="text-xs text-white/20">© 2025 Bakkah Auto Detailing LLC. All rights reserved. Made with ❤️ in Dubai.</p>
            <div className="flex items-center gap-5">
              <Link href="/track" className="text-xs text-white/20 hover:text-white/50 transition-colors">Track Vehicle</Link>
              <span className="h-3 w-px bg-white/10" />
              <Link href="/auth/login" className="inline-flex items-center gap-1 text-xs text-white/20 hover:text-white/50 transition-colors">
                Staff Login <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
