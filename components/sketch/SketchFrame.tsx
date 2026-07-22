"use client";

import { motion } from "framer-motion";

/**
 * Hand-drawn border frame with corner accents.
 * Wraps children in a sketch-style container.
 */
export default function SketchFrame({
  children,
  className = "",
  animated = true,
}: {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
}) {
  const Wrapper = animated ? motion.div : "div";
  const wrapperProps = animated
    ? {
        initial: { opacity: 0, scale: 0.97 },
        whileInView: { opacity: 1, scale: 1 },
        viewport: { once: true, margin: "-40px" },
        transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
      }
    : {};

  return (
    <Wrapper {...wrapperProps} className={`relative ${className}`}>
      {/* Corner brackets — architectural drawing style */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Top-left */}
        <path d="M2 15 L2 2 L15 2" stroke="#2A2A28" strokeWidth="0.5" fill="none" opacity="0.3" />
        {/* Top-right */}
        <path d="M85 2 L98 2 L98 15" stroke="#2A2A28" strokeWidth="0.5" fill="none" opacity="0.3" />
        {/* Bottom-left */}
        <path d="M2 85 L2 98 L15 98" stroke="#2A2A28" strokeWidth="0.5" fill="none" opacity="0.3" />
        {/* Bottom-right */}
        <path d="M85 98 L98 98 L98 85" stroke="#2A2A28" strokeWidth="0.5" fill="none" opacity="0.3" />
      </svg>

      {children}
    </Wrapper>
  );
}
