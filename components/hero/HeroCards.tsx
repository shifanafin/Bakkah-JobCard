"use client";

import { motion } from "framer-motion";
import FloatingCard from "./FloatingCard";
import { WorkshopImage, MechanicImage } from "./HeroImage";
import { heroData } from "@/data/hero";
import { useMouseParallax } from "@/lib/animations";

/**
 * Left/right floating cards for desktop (absolute, mouse-parallax'd,
 * pinned beside the center image), collapsing to a stacked grid below
 * the image on mobile/tablet where there's no room to float them.
 */
export default function HeroCards() {
  const leftParallax = useMouseParallax(-14);
  const rightParallax = useMouseParallax(14);

  return (
    <>
      <motion.div
        style={{ x: leftParallax.x, y: leftParallax.y }}
        className="pointer-events-none absolute left-4 top-1/2 hidden w-64 -translate-y-1/2 lg:left-10 lg:block xl:left-20"
      >
        <FloatingCard floatDelay={0} className="pointer-events-auto">
          <div className="p-4">
            <WorkshopImage className="aspect-[4/3] w-full" />
            <p className="mt-3 text-sm font-bold text-white">{heroData.cards.workshop.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">{heroData.cards.workshop.description}</p>
          </div>
        </FloatingCard>
      </motion.div>

      <motion.div
        style={{ x: rightParallax.x, y: rightParallax.y }}
        className="pointer-events-none absolute right-4 top-1/2 hidden w-64 -translate-y-1/2 lg:right-10 lg:block xl:right-20"
      >
        <FloatingCard floatDelay={1.2} className="pointer-events-auto">
          <div className="p-4">
            <MechanicImage className="aspect-[4/3] w-full" />
            <p className="mt-3 text-sm font-bold text-white">{heroData.cards.mechanic.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">{heroData.cards.mechanic.description}</p>
          </div>
        </FloatingCard>
      </motion.div>

      <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
        <FloatingCard>
          <div className="p-4">
            <WorkshopImage className="aspect-[16/10] w-full" />
            <p className="mt-3 text-sm font-bold text-white">{heroData.cards.workshop.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">{heroData.cards.workshop.description}</p>
          </div>
        </FloatingCard>
        <FloatingCard delay={1}>
          <div className="p-4">
            <MechanicImage className="aspect-[16/10] w-full" />
            <p className="mt-3 text-sm font-bold text-white">{heroData.cards.mechanic.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">{heroData.cards.mechanic.description}</p>
          </div>
        </FloatingCard>
      </div>
    </>
  );
}
