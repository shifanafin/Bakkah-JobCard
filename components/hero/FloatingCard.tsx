"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeInUp } from "@/lib/animations";

type FloatingCardProps = {
  className?: string;
  delay?: number;
  floatDelay?: number;
  children: ReactNode;
};

/** Reusable glass card with a mount-in reveal and a gentle infinite float. */
export default function FloatingCard({ className = "", delay = 0, floatDelay = 0, children }: FloatingCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors duration-300 hover:border-golden/30 ${className}`}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: floatDelay }}
      >
        {children}
      </motion.div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-golden/0 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:from-golden/10 group-hover:opacity-100" />
    </motion.div>
  );
}
