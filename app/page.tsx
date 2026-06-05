'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import {
  Sparkles, Shield, Zap, Droplets, ClipboardCheck, Truck,
  MapPin, Phone, Mail, ChevronRight, Search, ArrowRight, Star, Car,
  MessageCircle, CheckCircle, Quote, Globe,
} from 'lucide-react'
import { useT } from '@/lib/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'

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

type Review = { id: string; customer_name: string; rating: number; comment: string | null; created_at: string }

export default function BakkahHomePage() {
  const { t } = useT()
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

  const l = t.landing

  const SERVICE_LIST = [
    { icon: Sparkles, emoji: '✨', ...l.services.items.fullDetail },
    { icon: Shield,   emoji: '🛡️', ...l.services.items.ceramic },
    { icon: Zap,      emoji: '⚡', ...l.services.items.paintCorrection },
    { icon: Droplets, emoji: '🫧', ...l.services.items.interior },
    { icon: ClipboardCheck, emoji: '📋', ...l.services.items.rta },
    { icon: Truck,    emoji: '🚛', ...l.services.items.fleet },
  ]

  const STAT_VALUES = [5000, 98, 12, 500]
  const STAT_SUFFIXES = ['+', '%', '+', '+']

  const HOW_IT_WORKS_EMOJIS = ['🚗', '✨', '🤩']

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-x-hidden">

      {/* ── Floating WhatsApp ──────────────────────────────── */}
      <motion.a
        href="https://wa.me/971589397610?text=Hi+Bakkah!+I'd+like+to+book+a+detailing+service+%F0%9F%9A%97"
        target="_blank" rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_32px_rgba(37,211,102,0.45)] hover:shadow-[0_8px_40px_rgba(37,211,102,0.6)] transition-shadow duration-300"
      >
        <MessageCircle className="h-5 w-5 fill-white" />
        <span className="hidden sm:block">{l.nav.whatsappUs}</span>
      </motion.a>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -72, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
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
            <a href="#services" className="hover:text-white transition-colors">{l.nav.services}</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">{l.nav.howItWorks}</a>
            <a href="#reviews" className="hover:text-white transition-colors">{l.nav.reviews}</a>
            <a href="#contact" className="hover:text-white transition-colors">{l.nav.contact}</a>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="website" />
            <Link
              href="/track"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white/55 hover:border-[#FF7F0A]/30 hover:text-white transition-all duration-200"
            >
              <Search className="h-3.5 w-3.5" />{l.nav.trackVehicle}
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#FF7F0A] px-4 py-2 text-sm font-bold text-black shadow-[0_0_20px_rgba(255,127,10,0.25)] hover:bg-[#FF9F3A] hover:shadow-[0_0_30px_rgba(255,127,10,0.4)] transition-all duration-200"
            >
              {l.nav.staffPortal}<ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section id="top" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-16 text-center">
        <div className="pointer-events-none absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=60"
            alt="" aria-hidden="true"
            className="h-full w-full object-cover opacity-[0.1] mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/80 via-[#050507]/20 to-[#050507]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-[320px] w-[320px] sm:h-[700px] sm:w-[700px] rounded-full bg-[#FF7F0A]/[0.06] blur-[60px] sm:blur-[140px] animate-pulse-slow" />
          </div>
        </div>

        <div className="relative z-10 max-w-5xl w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#FF7F0A]/25 bg-[#FF7F0A]/10 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF7F0A]"
          >
            <Star className="h-3 w-3 fill-[#FF7F0A]" />
            {l.hero.badge}
            <Star className="h-3 w-3 fill-[#FF7F0A]" />
          </motion.div>

          {l.hero.headline.map((word, i) => (
            <div key={i} className="overflow-hidden">
              <motion.h1
                initial={{ y: 110, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
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
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="mx-auto mt-8 max-w-lg text-[15px] leading-relaxed text-white/50 sm:text-base"
          >
            {l.hero.subheadline}{' '}
            <span className="text-white/80 font-semibold">{l.hero.subheadline2}</span>{' '}
            {l.hero.subheadline3}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/track" className="group inline-flex items-center gap-3 rounded-xl bg-[#FF7F0A] px-7 py-3.5 text-sm font-bold text-black shadow-[0_0_40px_rgba(255,127,10,0.3)] transition-all duration-300 hover:bg-[#FF9F3A] hover:shadow-[0_0_60px_rgba(255,127,10,0.4)] hover:scale-[1.03] active:scale-[0.97]">
              {l.hero.cta_track}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
            </Link>
            <a
              href="https://wa.me/971589397610?text=Hi+Bakkah!+I'd+like+to+book+a+detailing+service"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-7 py-3.5 text-sm font-semibold text-[#25D366] transition-all duration-300 hover:border-[#25D366]/50 hover:bg-[#25D366]/20 hover:scale-[1.02]"
            >
              <MessageCircle className="h-4 w-4" />
              {l.hero.cta_book}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-5 text-xs text-white/30"
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#FF7F0A] text-[#FF7F0A]" />)}
              </div>
              <span>{l.hero.trust_rating}</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <span>{l.hero.trust_reviews}</span>
            <div className="h-3 w-px bg-white/10" />
            <span>{l.hero.trust_certified}</span>
            <div className="h-3 w-px bg-white/10" />
            <span>{l.hero.trust_location}</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] uppercase tracking-[0.25em] text-white/20">{l.hero.scroll}</span>
          <div className="scroll-bob h-10 w-px bg-gradient-to-b from-[#FF7F0A]/40 to-transparent" />
        </motion.div>
      </section>

      {/* ── Service ticker ─────────────────────────────────── */}
      <div className="overflow-hidden border-y border-[#FF7F0A]/10 bg-[#FF7F0A]/[0.03] py-4">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...l.ticker, ...l.ticker].map((item, i) => (
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
              {l.services.eyebrow}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              className="font-display text-[clamp(2.2rem,5.5vw,4rem)] tracking-[0.05em] text-white">
              {l.services.title}
            </motion.h2>
            <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              className="mx-auto mt-3 h-px w-20 bg-gradient-to-r from-transparent via-[#FF7F0A] to-transparent" />
            <motion.p variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              className="mx-auto mt-5 max-w-md text-sm text-white/38 leading-relaxed">
              {l.services.subtitle}
            </motion.p>
          </div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SERVICE_LIST.map((s) => (
              <motion.div
                key={s.title} variants={fadeUp}
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
              {l.beforeAfter.eyebrow}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-white">
              {l.beforeAfter.title}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mx-auto mt-4 max-w-md text-sm text-white/40">
              {l.beforeAfter.subtitle}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="relative overflow-hidden rounded-2xl border border-white/[0.06] group">
              <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80"
                alt="Vehicle before detailing"
                className="w-full h-[260px] object-cover transition-transform duration-500 group-hover:scale-105 brightness-[0.65] saturate-50" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="rounded-lg bg-red-500/80 backdrop-blur-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">{l.beforeAfter.before}</span>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="relative overflow-hidden rounded-2xl border border-[#FF7F0A]/20 group shadow-[0_0_40px_rgba(255,127,10,0.08)]">
              <img src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80"
                alt="Vehicle after detailing"
                className="w-full h-[260px] object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="rounded-lg bg-[#FF7F0A]/90 backdrop-blur-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black">{l.beforeAfter.after}</span>
              </div>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {l.features.map(tag => (
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
              {l.stats.eyebrow}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-white">
              {l.stats.title}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mx-auto mt-4 max-w-sm text-sm text-white/38">
              {l.stats.subtitle}
            </motion.p>
          </div>

          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
            {l.stats.items.map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} custom={i * 0.7}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="text-center">
                <p className="font-display text-[clamp(2.8rem,5.5vw,4.5rem)] text-[#FF7F0A] leading-none tracking-wide">
                  <Counter value={STAT_VALUES[i]} suffix={STAT_SUFFIXES[i]} />
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
              {l.howItWorks.eyebrow}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-white">
              {l.howItWorks.title}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mx-auto mt-4 max-w-md text-sm text-white/38">
              {l.howItWorks.subtitle}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 relative">
            <div className="absolute top-14 left-[calc(33.33%_+_16px)] right-[calc(33.33%_+_16px)] hidden lg:block h-px bg-gradient-to-r from-[#FF7F0A]/30 via-[#FF7F0A]/15 to-[#FF7F0A]/30" />
            {l.howItWorks.steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-[#FF7F0A]/20 hover:bg-[#FF7F0A]/[0.02] transition-all duration-300">
                <div className="mb-6 flex items-center gap-4">
                  <span className="font-display text-[2.5rem] leading-none text-[#FF7F0A]/20 group-hover:text-[#FF7F0A]/40 transition-colors duration-300">0{i + 1}</span>
                  <span className="text-4xl">{HOW_IT_WORKS_EMOJIS[i]}</span>
                </div>
                <h3 className="mb-3 text-lg font-bold text-white">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-12 text-center">
            <a href="https://wa.me/971589397610?text=Hi+Bakkah!+I'd+like+to+book+a+detailing+service"
              target="_blank" rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-8 py-4 text-sm font-bold text-[#25D366] transition-all duration-300 hover:border-[#25D366]/50 hover:bg-[#25D366]/20 hover:scale-[1.02]">
              <MessageCircle className="h-5 w-5" />
              {l.howItWorks.bookNow}
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
                {l.reviews.eyebrow}
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-white">
                {l.reviews.title}
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="mx-auto mt-4 max-w-md text-sm text-white/38">
                {l.reviews.subtitle}
              </motion.p>
            </div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={stagger} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((r) => (
                <motion.div key={r.id} variants={fadeUp}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-[#FF7F0A]/15 hover:bg-[#FF7F0A]/[0.02] transition-all duration-300">
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-[#FF7F0A]/10" />
                  <StarRow rating={r.rating} />
                  {r.comment && (
                    <p className="mt-3 text-sm text-white/55 leading-relaxed line-clamp-4">&ldquo;{r.comment}&rdquo;</p>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF7F0A]/15 text-sm font-bold text-[#FF7F0A] shrink-0">
                      {r.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/80">{r.customer_name}</p>
                      <p className="text-[11px] text-white/25">{l.reviews.verified}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {avgRating && reviews.length >= 3 && (
              <motion.div variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="mt-10 text-center">
                <div className="inline-flex items-center gap-3 rounded-xl border border-[#FF7F0A]/15 bg-[#FF7F0A]/[0.05] px-6 py-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-[#FF7F0A] text-[#FF7F0A]" />)}
                  </div>
                  <span className="text-sm font-bold text-white">{avgRating} {l.reviews.average}</span>
                  <span className="text-sm text-white/40">{l.reviews.from} {reviews.length} {reviews.length !== 1 ? l.reviews.reviews : l.reviews.review}</span>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ── Track CTA ──────────────────────────────────────── */}
      <section id="track" className="px-5 py-28 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
            className="relative overflow-hidden rounded-3xl border border-[#FF7F0A]/15 bg-gradient-to-br from-[#FF7F0A]/[0.08] via-[#FF7F0A]/[0.04] to-transparent p-10 text-center lg:p-16">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#FF7F0A]/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-[#FF7F0A]/[0.06] blur-2xl" />
            <div className="relative">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#FF7F0A]/20 bg-[#FF7F0A]/10 shadow-[0_0_30px_rgba(255,127,10,0.15)]">
                <Search className="h-7 w-7 text-[#FF7F0A]" />
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="font-display text-[clamp(1.8rem,5vw,3rem)] tracking-[0.05em] text-white">
                {l.trackCta.title}
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="mx-auto mt-4 max-w-md text-sm text-white/45 leading-relaxed">
                {l.trackCta.subtitle}
              </motion.p>
              <motion.div variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8">
                <Link href="/track"
                  className="group inline-flex items-center gap-3 rounded-xl bg-[#FF7F0A] px-8 py-4 text-sm font-bold text-black shadow-[0_0_40px_rgba(255,127,10,0.25)] transition-all duration-300 hover:bg-[#FF9F3A] hover:shadow-[0_0_60px_rgba(255,127,10,0.4)] hover:scale-[1.03] active:scale-[0.97]">
                  {l.trackCta.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                </Link>
              </motion.div>
              <motion.p variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="mt-5 text-xs text-white/25">
                {l.trackCta.hint}
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer id="contact" className="border-t border-white/[0.06] px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 mb-14">
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
              <p className="text-sm text-white/38 leading-relaxed max-w-xs">{l.footer.tagline}</p>
              <div className="mt-5 flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#FF7F0A] text-[#FF7F0A]" />)}
                <span className="ml-2 text-xs text-white/30">{l.footer.ratingText}</span>
              </div>
              <div className="mt-5">
                <a href="https://wa.me/971589397610?text=Hi+Bakkah!+I'd+like+to+book+a+service"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#25D366]/15 border border-[#25D366]/25 px-4 py-2.5 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/25 transition-colors duration-200">
                  <MessageCircle className="h-4 w-4" />
                  {l.footer.chatWhatsApp}
                </a>
              </div>
            </div>

            <div>
              <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">{l.footer.ourServices}</h4>
              <ul className="space-y-3">
                {SERVICE_LIST.map(s => (
                  <li key={s.title} className="flex items-center gap-2.5 text-sm text-white/38">
                    <span className="text-base shrink-0">{s.emoji}</span>
                    {s.title}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">{l.footer.getInTouch}</h4>
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
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-2">{l.footer.openingHours}</p>
                <p className="text-sm text-white/50">{l.footer.monSat}</p>
                <p className="text-sm text-white/50">{l.footer.sunday}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.05] pt-8 sm:flex-row">
            <p className="text-xs text-white/20">{l.footer.copyright}</p>
            <div className="flex items-center gap-5">
              <Link href="/track" className="text-xs text-white/20 hover:text-white/50 transition-colors">{l.footer.trackVehicle}</Link>
              <span className="h-3 w-px bg-white/10" />
              <Link href="/auth/login" className="inline-flex items-center gap-1 text-xs text-white/20 hover:text-white/50 transition-colors">
                {l.footer.staffLogin} <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
