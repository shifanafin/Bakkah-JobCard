"use client";

import { motion } from "framer-motion";
import HeroContent from "./HeroContent";
import HeroCards from "./HeroCards";
import HeroStats from "./HeroStats";
import { HeroCarImage, BackgroundTexture } from "./HeroImage";

// Deterministic positions/timings (no Math.random) so server and client
// markup match on first paint — avoids hydration mismatches.
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  duration: 4 + (i % 5),
  delay: i * 0.3,
}));

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen w-full flex-col items-center justify-center gap-16 overflow-hidden bg-[#050507] px-5 py-32 lg:px-8"
    >
      {/* ── Background: texture, blueprint grid, gradients, particles ── */}
      <BackgroundTexture />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-pattern-dark [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(201,162,39,0.1),transparent)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(30,79,160,0.1),transparent)]" />
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-golden/70 blur-[1px]"
          style={{ left: `${p.left}%`, top: `${p.top}%` }}
          animate={{ opacity: [0, 1, 0], y: [0, -30, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}

      {/* ── Foreground content ── */}
      <HeroContent />

      <div className="relative w-full max-w-5xl">
        <HeroCarImage />
        <HeroCards />
      </div>

      <HeroStats />
    </section>
  );
}
