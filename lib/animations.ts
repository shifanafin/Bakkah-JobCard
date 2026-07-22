"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue, useSpring, type Variants } from "framer-motion";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: easeOut },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.9, ease: easeOut } },
};

export const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.9, ease: easeOut } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

/**
 * Mouse-driven parallax offset, spring-smoothed. `strength` controls both
 * magnitude and direction (negative drifts opposite the cursor).
 */
export function useMouseParallax(strength = 20) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 60, damping: 20, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 60, damping: 20, mass: 0.6 });

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const nx = (e.clientX / window.innerWidth - 0.5) * strength;
      const ny = (e.clientY / window.innerHeight - 0.5) * strength;
      x.set(nx);
      y.set(ny);
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [strength, x, y]);

  return { x: springX, y: springY };
}

/** Counts up from 0 to `value` once, the first time `inView` becomes true. */
export function useCounter(value: number, inView: boolean, duration = 1.8) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);
  const decimals = Number.isInteger(value) ? 0 : 1;

  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;
    const steps = 60;
    const stepDuration = (duration * 1000) / steps;
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      const progress = Math.min(step / steps, 1);
      setCount(Number((value * progress).toFixed(decimals)));
      if (progress >= 1) clearInterval(timer);
    }, stepDuration);
    return () => clearInterval(timer);
  }, [inView, value, duration, decimals]);

  return count;
}
