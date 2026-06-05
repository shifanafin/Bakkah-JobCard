'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import {
  Sparkles, Shield, Zap, Droplets, ClipboardCheck, Truck,
  MapPin, Phone, Mail, ChevronRight, Search, ArrowRight, Star, Car,
} from 'lucide-react'

// ── Data ──────────────────────────────────────────────────────

const SERVICES = [
  { icon: Sparkles,      title: 'Full Detail Package',  tag: 'Most Popular',    desc: 'Complete exterior & interior treatment — hand wash, clay bar, machine polish, and protective coating in one premium package.' },
  { icon: Shield,        title: 'Ceramic Coating',      tag: '5-Year Warranty', desc: 'Professional nano-ceramic protection that bonds to your paint for years of brilliant gloss and hydrophobic performance.' },
  { icon: Zap,           title: 'Paint Correction',     tag: 'Expert Only',     desc: 'Multi-stage machine polishing removes swirl marks, deep scratches, and oxidation for a truly flawless finish.' },
  { icon: Droplets,      title: 'Interior Detailing',   tag: 'Full Sanitize',   desc: 'Deep steam clean, leather conditioning, carpet extraction, and complete odor elimination — inside-out perfection.' },
  { icon: ClipboardCheck,title: 'RTA Inspection',       tag: 'Same Day',        desc: 'Pre-registration RTA checks to ensure your vehicle passes first time — no hassle, no delays, no return visits.' },
  { icon: Truck,         title: 'Fleet Services',        tag: 'B2B',             desc: 'Dedicated packages for corporate fleets of any size. Flexible scheduling, priority service, and volume pricing.' },
]

const STATS = [
  { value: 5000, suffix: '+', label: 'Vehicles Served' },
  { value: 98,   suffix: '%', label: 'Client Satisfaction' },
  { value: 12,   suffix: '+', label: 'Years Experience' },
  { value: 500,  suffix: '+', label: 'Vehicles / Month' },
]

// ── Animated counter ──────────────────────────────────────────

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let current = 0
    const steps = 60
    const increment = value / steps
    const interval = 2000 / steps
    const timer = setInterval(() => {
      current += increment
      if (current >= value) { setCount(value); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, interval)
    return () => clearInterval(timer)
  }, [inView, value])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ── Motion variants ───────────────────────────────────────────

const easeOut = [0.25, 0.1, 0.25, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, delay: i * 0.08, ease: easeOut },
  }),
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

// ── Page ──────────────────────────────────────────────────────

export default function BakkahHomePage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: easeOut }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-black/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_2px_30px_rgba(0,0,0,0.5)]' : ''
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
            <a href="#why-bakkah" className="hover:text-white transition-colors">Why Bakkah</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/track"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white/55 hover:border-[#FF7F0A]/30 hover:text-white transition-all duration-200">
              <Search className="h-3.5 w-3.5" />Track Vehicle
            </Link>
            <Link href="/auth/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#FF7F0A] px-4 py-2 text-sm font-bold text-black shadow-[0_0_20px_rgba(255,127,10,0.25)] hover:bg-[#FF9F3A] hover:shadow-[0_0_30px_rgba(255,127,10,0.4)] transition-all duration-200">
              Staff Portal<ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section id="top" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-16 text-center">

        {/* Backgrounds */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="blob-1 h-[700px] w-[700px] rounded-full bg-[#FF7F0A]/[0.055] blur-[140px]" />
          </div>
          <div className="absolute left-[15%] top-[25%]">
            <div className="blob-2 h-[400px] w-[400px] rounded-full bg-[#FF7F0A]/[0.035] blur-[110px]" />
          </div>
          <div className="absolute right-[10%] bottom-[20%]">
            <div className="blob-3 h-[350px] w-[350px] rounded-full bg-[#FF7F0A]/[0.03] blur-[100px]" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_50%,transparent,#050507_100%)]" />
        </div>

        <div className="relative z-10 max-w-5xl w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#FF7F0A]/25 bg-[#FF7F0A]/10 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF7F0A]"
          >
            <Star className="h-3 w-3 fill-[#FF7F0A]" />
            Dubai&apos;s Premier Auto Detailing Studio
            <Star className="h-3 w-3 fill-[#FF7F0A]" />
          </motion.div>

          {/* Main headline */}
          {['EXCELLENCE', 'IN EVERY', 'DETAIL'].map((word, i) => (
            <div key={word} className="overflow-hidden">
              <motion.h1
                initial={{ y: 110, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.12, ease: easeOut }}
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
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mx-auto mt-8 max-w-lg text-[15px] leading-relaxed text-white/45 sm:text-base"
          >
            Al Qusais, Dubai&apos;s trusted specialists in ceramic coatings, paint correction,
            and complete vehicle detailing. Trusted by 5,000+ satisfied clients.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/track"
              className="group inline-flex items-center gap-3 rounded-xl bg-[#FF7F0A] px-7 py-3.5 text-sm font-bold text-black shadow-[0_0_40px_rgba(255,127,10,0.3)] transition-all duration-300 hover:bg-[#FF9F3A] hover:shadow-[0_0_60px_rgba(255,127,10,0.4)] hover:scale-[1.03] active:scale-[0.97]">
              Track My Vehicle
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
            </Link>
            <a href="#services"
              className="inline-flex items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white/60 transition-all duration-300 hover:border-white/[0.18] hover:text-white hover:bg-white/[0.07]">
              Explore Services
            </a>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
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
            <span>Al Qusais, Dubai</span>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] uppercase tracking-[0.25em] text-white/20">Scroll</span>
          <div className="scroll-bob h-10 w-px bg-gradient-to-b from-[#FF7F0A]/40 to-transparent" />
        </motion.div>
      </section>

      {/* ── Services ───────────────────────────────────────── */}
      <section id="services" className="relative overflow-hidden px-5 py-28 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,127,10,0.04),transparent)]" />
        <div className="mx-auto max-w-7xl relative">

          <div className="mb-16 text-center">
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF7F0A]"
            >What We Do Best</motion.p>
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp} custom={1}
              className="font-display text-[clamp(2.2rem,5.5vw,4rem)] tracking-[0.05em] text-white"
            >OUR SERVICES</motion.h2>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp} custom={2}
              className="mx-auto mt-3 h-px w-20 bg-gradient-to-r from-transparent via-[#FF7F0A] to-transparent"
            />
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp} custom={3}
              className="mx-auto mt-5 max-w-md text-sm text-white/38 leading-relaxed"
            >Professional grade detailing using the finest imported products and the latest techniques</motion.p>
          </div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SERVICES.map((s) => (
              <motion.div key={s.title}
                variants={fadeUp}
                whileHover={{ y: -8, transition: { duration: 0.22 } }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 cursor-default transition-colors duration-300 hover:border-[#FF7F0A]/20 hover:bg-[#FF7F0A]/[0.03] hover:shadow-[0_12px_40px_rgba(255,127,10,0.07)]"
              >
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#FF7F0A]/0 group-hover:bg-[#FF7F0A]/[0.07] blur-2xl transition-all duration-500" />
                <span className="mb-5 inline-block rounded-full border border-[#FF7F0A]/20 bg-[#FF7F0A]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FF7F0A]">{s.tag}</span>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] transition-all duration-300 group-hover:border-[#FF7F0A]/25 group-hover:bg-[#FF7F0A]/[0.07]">
                  <s.icon className="h-5 w-5 text-[#FF7F0A]" />
                </div>
                <h3 className="mb-2 text-[15px] font-bold text-white">{s.title}</h3>
                <p className="text-sm text-white/38 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section id="why-bakkah" className="relative overflow-hidden border-y border-white/[0.05] px-5 py-24 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,127,10,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,127,10,0.015)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="mx-auto max-w-5xl relative">
          <div className="mb-14 text-center">
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF7F0A]"
            >Our Track Record</motion.p>
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={1}
              className="font-display text-[clamp(2rem,5vw,3.5rem)] tracking-[0.05em] text-white"
            >WHY CHOOSE BAKKAH</motion.h2>
          </div>

          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
            {STATS.map((stat, i) => (
              <motion.div key={stat.label}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i * 0.7}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FF7F0A]/15 bg-[#FF7F0A]/[0.06]">
                  <div className="h-2 w-2 rounded-full bg-[#FF7F0A]" />
                </div>
                <p className="font-display text-[clamp(2.5rem,5vw,3.8rem)] text-[#FF7F0A] leading-none tracking-wide">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-sm font-medium text-white/38">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Track your vehicle ─────────────────────────────── */}
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

              <motion.h2
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={1}
                className="font-display text-[clamp(1.8rem,5vw,3rem)] tracking-[0.05em] text-white"
              >TRACK YOUR VEHICLE</motion.h2>

              <motion.p
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={2}
                className="mx-auto mt-4 max-w-md text-sm text-white/45 leading-relaxed"
              >
                Know exactly where your car is in our detailing process. Live status updates from
                drop-off all the way to delivery.
              </motion.p>

              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={3}
                className="mt-8"
              >
                <Link href="/track"
                  className="group inline-flex items-center gap-3 rounded-xl bg-[#FF7F0A] px-8 py-4 text-sm font-bold text-black shadow-[0_0_40px_rgba(255,127,10,0.25)] transition-all duration-300 hover:bg-[#FF9F3A] hover:shadow-[0_0_60px_rgba(255,127,10,0.4)] hover:scale-[1.03] active:scale-[0.97]">
                  Track My Vehicle
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                </Link>
              </motion.div>

              <motion.p
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={4}
                className="mt-5 text-xs text-white/25"
              >Use your job number (e.g. JC-2025-0001) or your registered phone number</motion.p>
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
                Dubai&apos;s premier vehicle detailing studio. Excellence in every detail, every time.
              </p>
              <div className="mt-5 flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#FF7F0A] text-[#FF7F0A]" />)}
                <span className="ml-2 text-xs text-white/30">5.0 on Google</span>
              </div>
            </div>

            {/* Services list */}
            <div>
              <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">Our Services</h4>
              <ul className="space-y-3">
                {SERVICES.map(s => (
                  <li key={s.title} className="flex items-center gap-2 text-sm text-white/38 cursor-default">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-[#FF7F0A]/60" />{s.title}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">Get In Touch</h4>
              <ul className="space-y-4">
                {[
                  { icon: MapPin, text: 'Al Qusais Industrial Area\nDubai, UAE' },
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
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.05] pt-8 sm:flex-row">
            <p className="text-xs text-white/20">© 2025 Bakkah Auto Detailing LLC. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link href="/track" className="text-xs text-white/20 hover:text-white/50 transition-colors">Track Vehicle</Link>
              <span className="h-3 w-px bg-white/10" />
              {/* Create account link — hidden per request */}
              <span className="hidden"><Link href="/auth/signup">Create Account</Link></span>
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
