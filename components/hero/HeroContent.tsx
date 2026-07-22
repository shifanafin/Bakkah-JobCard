"use client";

import { motion } from "framer-motion";
import { heroData } from "@/data/hero";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import CTAButtons from "./CTAButtons";

export default function HeroContent() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="relative z-10 mx-auto max-w-3xl text-center"
    >
      <motion.div
        variants={fadeInUp}
        custom={0}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-golden/30 bg-golden/10 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-golden"
      >
        {heroData.badge}
      </motion.div>

      <h1 className="font-display text-[clamp(2.6rem,6vw,5rem)] leading-[0.95] tracking-[0.02em] text-white">
        {heroData.heading.lines.map((line, i) => (
          <motion.span
            key={line}
            variants={fadeInUp}
            custom={i + 1}
            className={`block ${i === 1 ? "bg-gradient-to-r from-golden via-[#f0d060] to-golden bg-clip-text text-transparent" : ""}`}
          >
            {line}
          </motion.span>
        ))}
      </h1>

      <motion.p
        variants={fadeInUp}
        custom={3}
        className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg"
      >
        {heroData.description}
      </motion.p>

      <motion.div
        variants={fadeInUp}
        custom={4}
        className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/40"
      >
        <span>{heroData.contact.phone}</span>
        <span className="hidden h-3 w-px bg-white/15 sm:inline" />
        <span>{heroData.contact.address}</span>
      </motion.div>

      <motion.div variants={fadeInUp} custom={5} className="mt-10">
        <CTAButtons />
      </motion.div>
    </motion.div>
  );
}
