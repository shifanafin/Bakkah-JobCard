"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Hand-coded vector line-art placeholder for the hero "workshop scene".
 * Swap-ready: this is the only file to replace once commissioned/real
 * illustration artwork is available — the frame in HomeClient stays as-is.
 */
export default function HeroWorkshopScene() {
  const reduceMotion = useReducedMotion();

  return (
    <svg viewBox="0 0 800 600" className="h-full w-full" role="img" aria-label="Illustration of a Bakkah Autos detailing bay with a car on a lift">
      {/* Floor */}
      <line x1="40" y1="480" x2="760" y2="480" stroke="#2A2A28" strokeOpacity="0.35" strokeWidth="2" />
      <line x1="40" y1="486" x2="760" y2="486" stroke="#2A2A28" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="6 6" />

      {/* Overhead light rig */}
      <g stroke="#3A3D42" strokeWidth="2" strokeOpacity="0.5" fill="none">
        <line x1="180" y1="40" x2="180" y2="90" />
        <line x1="620" y1="40" x2="620" y2="90" />
        <rect x="140" y="90" width="80" height="14" rx="4" />
        <rect x="580" y="90" width="80" height="14" rx="4" />
      </g>
      <motion.circle
        cx="180" cy="120" r="38" fill="#C9A227" opacity={0.08}
        animate={reduceMotion ? undefined : { opacity: [0.05, 0.14, 0.05] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="620" cy="120" r="38" fill="#C9A227" opacity={0.08}
        animate={reduceMotion ? undefined : { opacity: [0.14, 0.05, 0.14] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Lift posts */}
      <g stroke="#3A3D42" strokeWidth="3" fill="none" strokeLinecap="round">
        <line x1="230" y1="470" x2="230" y2="300" />
        <line x1="570" y1="470" x2="570" y2="300" />
        <line x1="230" y1="320" x2="290" y2="320" />
        <line x1="570" y1="320" x2="510" y2="320" />
      </g>

      {/* Car body — double-stroke sketch effect */}
      <g fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M150 340 Q170 280 260 268 L330 240 Q400 220 470 240 L560 268 Q640 280 660 340 L660 380 Q660 400 640 400 L610 400 Q604 424 578 424 Q552 424 546 400 L360 400 Q354 424 328 424 Q302 424 296 400 L170 400 Q150 400 150 380 Z"
          stroke="#2A2A28" strokeWidth="3"
        />
        <path
          d="M152 342 Q172 284 262 270 L332 242 Q400 223 468 242 L558 270 Q638 282 658 342"
          stroke="#C9A227" strokeWidth="1.5" opacity="0.6"
        />
        {/* windows */}
        <path d="M300 268 L340 246 Q400 230 460 246 L500 268 Z" stroke="#1E4FA0" strokeWidth="2" opacity="0.5" />
        <line x1="400" y1="248" x2="400" y2="268" stroke="#1E4FA0" strokeWidth="1.5" opacity="0.4" />
        {/* wheels */}
        <circle cx="270" cy="400" r="34" stroke="#2A2A28" strokeWidth="3" />
        <circle cx="270" cy="400" r="16" stroke="#3A3D42" strokeWidth="2" />
        <circle cx="560" cy="400" r="34" stroke="#2A2A28" strokeWidth="3" />
        <circle cx="560" cy="400" r="16" stroke="#3A3D42" strokeWidth="2" />
      </g>

      {/* Polish pad orbit near hood */}
      <motion.circle
        cx="330" cy="300" r="10" fill="none" stroke="#C9A227" strokeWidth="2"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "330px 300px" }}
      />

      {/* Sparkles on paint */}
      {[
        { x: 300, y: 260 }, { x: 420, y: 235 }, { x: 540, y: 270 }, { x: 200, y: 350 },
      ].map((p, i) => (
        <motion.g
          key={i}
          animate={reduceMotion ? undefined : { opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
        >
          <path d={`M${p.x} ${p.y - 8} L${p.x} ${p.y + 8} M${p.x - 8} ${p.y} L${p.x + 8} ${p.y}`} stroke="#F3D87A" strokeWidth="2" strokeLinecap="round" />
        </motion.g>
      ))}

      {/* Water drops */}
      {[210, 400, 600].map((x, i) => (
        <motion.circle
          key={x}
          cx={x} cy={410} r="3" fill="#1E4FA0" opacity={0.5}
          animate={reduceMotion ? undefined : { cy: [410, 470], opacity: [0.5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.6, ease: "easeIn" }}
        />
      ))}

      {/* Tool cabinet, right */}
      <g stroke="#3A3D42" strokeWidth="2" fill="none" opacity="0.55">
        <rect x="690" y="380" width="60" height="100" rx="3" />
        <line x1="690" y1="410" x2="750" y2="410" />
        <line x1="690" y1="440" x2="750" y2="440" />
        <line x1="720" y1="380" x2="720" y2="480" opacity="0.4" />
      </g>

      {/* Caption plate */}
      <text x="60" y="550" className="font-hand" fill="#2A2A28" fillOpacity="0.55" fontSize="26">
        Fig. 01 — Detailing Bay, Al Qusais
      </text>
    </svg>
  );
}
