"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { HERO_IMAGES } from "@/data/hero-images";
import { scaleReveal } from "@/lib/animations";

/** Full-bleed, very low-opacity background texture. Purely decorative. */
export function BackgroundTexture() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.1] dark:opacity-[0.16]">
      <Image
        src={HERO_IMAGES.backgroundTexture.src}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
    </div>
  );
}

/** Thumbnail used inside the floating workshop card. */
export function WorkshopImage({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}>
      <Image
        src={HERO_IMAGES.workshop.src}
        alt={HERO_IMAGES.workshop.alt}
        fill
        sizes="(max-width: 768px) 50vw, 240px"
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
    </div>
  );
}

/** Thumbnail used inside the floating mechanic card. */
export function MechanicImage({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}>
      <Image
        src={HERO_IMAGES.mechanic.src}
        alt={HERO_IMAGES.mechanic.alt}
        fill
        sizes="(max-width: 768px) 50vw, 240px"
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
    </div>
  );
}

/** The large center hero image — zooms in slightly on mount, framed in glass. */
export function HeroCarImage() {
  return (
    <motion.div
      variants={scaleReveal}
      initial="hidden"
      animate="visible"
      className="group relative mx-auto aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.5)] sm:aspect-[16/10]"
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.18 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }}
        whileHover={{ scale: 1.04 }}
      >
        <Image
          src={HERO_IMAGES.heroCar.src}
          alt={HERO_IMAGES.heroCar.alt}
          fill
          priority
          sizes="(max-width: 1024px) 90vw, 760px"
          className="object-cover transition-transform duration-700"
        />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/10" />
    </motion.div>
  );
}
