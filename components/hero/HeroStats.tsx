"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Star, ShieldCheck, Clock } from "lucide-react";
import { heroData, type HeroStat } from "@/data/hero";
import { fadeInUp, staggerContainer, useCounter } from "@/lib/animations";

const ICONS = { users: Users, star: Star, shield: ShieldCheck, clock: Clock } as const;

function StatItem({ stat, index }: { stat: HeroStat; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const count = useCounter(stat.value, inView);
  const Icon = ICONS[stat.icon];

  return (
    <motion.div ref={ref} variants={fadeInUp} custom={index} className="flex flex-col items-center gap-2 text-center">
      <Icon className="h-5 w-5 text-golden" aria-hidden />
      <span className="font-display text-3xl text-white sm:text-4xl">
        {count}
        {stat.suffix}
      </span>
      <span className="text-xs uppercase tracking-[0.2em] text-white/40">{stat.label}</span>
    </motion.div>
  );
}

export default function HeroStats() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="relative z-10 mx-auto grid w-full max-w-4xl grid-cols-2 gap-8 border-t border-white/10 pt-10 sm:grid-cols-4"
    >
      {heroData.stats.map((stat, i) => (
        <StatItem key={stat.id} stat={stat} index={i} />
      ))}
    </motion.div>
  );
}
