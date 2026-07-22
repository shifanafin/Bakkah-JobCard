"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { heroData } from "@/data/hero";

export default function CTAButtons() {
  const { primary, secondary } = heroData.cta;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <motion.a
        href={primary.href}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-golden to-[#d4ab2a] px-8 py-4 text-sm font-bold text-black shadow-[0_8px_30px_rgba(201,162,39,0.35)] transition-shadow duration-300 hover:shadow-[0_8px_44px_rgba(201,162,39,0.55)]"
      >
        {primary.label}
        <ArrowRight className="h-4 w-4" />
      </motion.a>
      <motion.a
        href={secondary.href}
        whileHover={{ scale: 1.03, borderColor: "rgba(201,162,39,0.5)" }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white/80 backdrop-blur-sm transition-colors duration-300 hover:text-white"
      >
        {secondary.label}
      </motion.a>
    </div>
  );
}
