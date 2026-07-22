"use client";

import { motion } from "framer-motion";

/**
 * Detailed hand-drawn workshop scene SVG — luxury auto detailing studio.
 * 3/4 perspective view with Porsche, detailers, labeled callouts.
 * Matches the reference sketchbook aesthetic.
 */
export default function WorkshopIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 1000 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        aria-label="Bakkah Autos workshop — hand-drawn sketch illustration"
      >
        {/* ── Paper background ── */}
        <rect width="1000" height="600" fill="#F6EFDD" rx="2" />

        {/* ── Subtle grid ── */}
        {Array.from({ length: 21 }).map((_, i) => (
          <line key={`gv${i}`} x1={i * 50} y1="0" x2={i * 50} y2="600" stroke="#2A2A28" strokeWidth="0.25" opacity="0.04" />
        ))}
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`gh${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} stroke="#2A2A28" strokeWidth="0.25" opacity="0.04" />
        ))}

        {/* ════════════════════════════════════════════════════
            WORKSHOP ROOM — 3/4 Perspective
        ════════════════════════════════════════════════════ */}

        {/* Back wall */}
        <path d="M120 130 L500 90 L880 130 L880 400 L120 400 Z" stroke="#2A2A28" strokeWidth="1.5" fill="none" opacity="0.7" />

        {/* Left wall (perspective) */}
        <path d="M120 130 L60 200 L60 440 L120 400" stroke="#2A2A28" strokeWidth="1.2" fill="none" opacity="0.5" />

        {/* Right wall (perspective) */}
        <path d="M880 130 L940 200 L940 440 L880 400" stroke="#2A2A28" strokeWidth="1.2" fill="none" opacity="0.5" />

        {/* Floor */}
        <path d="M60 440 L120 400 L500 370 L880 400 L940 440 L940 520 L60 520 Z" stroke="#2A2A28" strokeWidth="1" fill="none" opacity="0.3" />

        {/* Floor tiles — perspective grid */}
        {Array.from({ length: 8 }).map((_, i) => {
          const y = 410 + i * 14;
          const shrink = i * 3;
          return (
            <line key={`ft${i}`} x1={65 + shrink} y1={y} x2={935 - shrink} y2={y} stroke="#2A2A28" strokeWidth="0.3" opacity="0.1" />
          );
        })}
        {Array.from({ length: 12 }).map((_, i) => {
          const x = 100 + i * 70;
          return (
            <line key={`fv${i}`} x1={x} y1="400" x2={x + (i < 6 ? -20 : 20)} y2="520" stroke="#2A2A28" strokeWidth="0.3" opacity="0.08" />
          );
        })}

        {/* Ceiling beam */}
        <line x1="120" y1="130" x2="880" y2="130" stroke="#2A2A28" strokeWidth="2" opacity="0.6" />
        <line x1="500" y1="90" x2="500" y2="130" stroke="#2A2A28" strokeWidth="1" opacity="0.3" />

        {/* ════════════════════════════════════════════════════
            BACK WALL DETAILS
        ════════════════════════════════════════════════════ */}

        {/* "BAKKAH AUTOS" sign on back wall */}
        <motion.g initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 0.6 }}>
          <rect x="380" y="145" width="240" height="42" rx="2" stroke="#2A2A28" strokeWidth="1.5" fill="#FCF9F0" />
          <text x="500" y="173" textAnchor="middle" fontFamily="'Bebas Neue', var(--font-display), cursive" fontSize="24" fontWeight="400" fill="#2A2A28" letterSpacing="6">
            BAKKAH AUTOS
          </text>
        </motion.g>

        {/* Window on back wall — left */}
        <rect x="160" y="150" width="100" height="70" rx="1" stroke="#2A2A28" strokeWidth="1" fill="none" opacity="0.4" />
        <line x1="210" y1="150" x2="210" y2="220" stroke="#2A2A28" strokeWidth="0.6" opacity="0.3" />
        <line x1="160" y1="185" x2="260" y2="185" stroke="#2A2A28" strokeWidth="0.6" opacity="0.3" />

        {/* Window on back wall — right */}
        <rect x="740" y="150" width="100" height="70" rx="1" stroke="#2A2A28" strokeWidth="1" fill="none" opacity="0.4" />
        <line x1="790" y1="150" x2="790" y2="220" stroke="#2A2A28" strokeWidth="0.6" opacity="0.3" />
        <line x1="740" y1="185" x2="840" y2="185" stroke="#2A2A28" strokeWidth="0.6" opacity="0.3" />

        {/* Wall shelf — left side with bottles */}
        <g opacity="0.6">
          <line x1="140" y1="250" x2="280" y2="250" stroke="#2A2A28" strokeWidth="1.2" />
          {/* Shelf brackets */}
          <path d="M150 250 L150 260 L160 260" stroke="#2A2A28" strokeWidth="0.8" fill="none" />
          <path d="M270 250 L270 260 L260 260" stroke="#2A2A28" strokeWidth="0.8" fill="none" />
          {/* Bottles */}
          <rect x="148" y="232" width="8" height="18" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="160" y="228" width="10" height="22" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="175" y="235" width="7" height="15" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="188" y="230" width="9" height="20" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="202" y="233" width="8" height="17" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="216" y="226" width="10" height="24" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="232" y="234" width="7" height="16" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="245" y="230" width="9" height="20" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
        </g>

        {/* Wall shelf — right side with bottles */}
        <g opacity="0.6">
          <line x1="720" y1="250" x2="860" y2="250" stroke="#2A2A28" strokeWidth="1.2" />
          <path d="M730 250 L730 260 L740 260" stroke="#2A2A28" strokeWidth="0.8" fill="none" />
          <path d="M850 250 L850 260 L840 260" stroke="#2A2A28" strokeWidth="0.8" fill="none" />
          <rect x="728" y="232" width="8" height="18" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="742" y="228" width="10" height="22" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="758" y="235" width="7" height="15" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="772" y="230" width="9" height="20" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="788" y="233" width="8" height="17" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="802" y="226" width="10" height="24" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="818" y="234" width="7" height="16" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          <rect x="832" y="230" width="9" height="20" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
        </g>

        {/* ════════════════════════════════════════════════════
            PORSCHE — Center of Workshop
        ════════════════════════════════════════════════════ */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1.2 }}>
          {/* Car body — 3/4 view Porsche 911 silhouette */}
          {/* Lower body */}
          <path
            d="M280 385 Q285 370 290 360 L310 350 Q340 340 400 338 Q460 336 500 340 L540 350 Q555 358 560 370 L562 385"
            stroke="#2A2A28" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
          {/* Roof line — curved Porsche roof */}
          <path
            d="M320 350 Q340 315 370 305 Q400 298 430 298 Q460 298 480 305 Q510 315 530 350"
            stroke="#2A2A28" strokeWidth="1.5" strokeLinecap="round" fill="none"
          />
          {/* Windshield */}
          <path d="M325 348 Q345 320 375 310 Q395 305 410 305" stroke="#2A2A28" strokeWidth="1" fill="none" opacity="0.6" />
          {/* Rear window */}
          <path d="M445 305 Q465 310 490 320 Q510 332 525 348" stroke="#2A2A28" strokeWidth="1" fill="none" opacity="0.6" />
          {/* Side window */}
          <path d="M370 310 Q395 302 430 302 Q460 302 480 310" stroke="#2A2A28" strokeWidth="0.8" fill="none" opacity="0.4" />
          {/* Door line */}
          <line x1="415" y1="305" x2="415" y2="360" stroke="#2A2A28" strokeWidth="0.6" opacity="0.3" />
          {/* Headlights */}
          <ellipse cx="295" cy="365" rx="8" ry="5" stroke="#2A2A28" strokeWidth="1" fill="none" opacity="0.5" />
          {/* Rear lights */}
          <ellipse cx="550" cy="365" rx="6" ry="4" stroke="#2A2A28" strokeWidth="1" fill="none" opacity="0.5" />
          {/* Front wheel */}
          <circle cx="320" cy="388" r="18" stroke="#2A2A28" strokeWidth="1.5" fill="none" />
          <circle cx="320" cy="388" r="11" stroke="#2A2A28" strokeWidth="0.8" fill="none" opacity="0.4" />
          <circle cx="320" cy="388" r="4" stroke="#2A2A28" strokeWidth="0.6" fill="none" opacity="0.3" />
          {/* Rear wheel */}
          <circle cx="520" cy="388" r="18" stroke="#2A2A28" strokeWidth="1.5" fill="none" />
          <circle cx="520" cy="388" r="11" stroke="#2A2A28" strokeWidth="0.8" fill="none" opacity="0.4" />
          <circle cx="520" cy="388" r="4" stroke="#2A2A28" strokeWidth="0.6" fill="none" opacity="0.3" />
          {/* Wheel spokes — front */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line key={`fs${i}`} x1={320 + Math.cos(rad) * 4} y1={388 + Math.sin(rad) * 4} x2={320 + Math.cos(rad) * 10} y2={388 + Math.sin(rad) * 10} stroke="#2A2A28" strokeWidth="0.5" opacity="0.25" />
            );
          })}
          {/* Wheel spokes — rear */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line key={`rs${i}`} x1={520 + Math.cos(rad) * 4} y1={388 + Math.sin(rad) * 4} x2={520 + Math.cos(rad) * 10} y2={388 + Math.sin(rad) * 10} stroke="#2A2A28" strokeWidth="0.5" opacity="0.25" />
            );
          })}
          {/* Shadow under car */}
          <ellipse cx="420" cy="400" rx="130" ry="8" fill="#2A2A28" opacity="0.06" />
        </motion.g>

        {/* ════════════════════════════════════════════════════
            DETAILER — Left side, polishing
        ════════════════════════════════════════════════════ */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}>
          {/* Body — standing figure */}
          <line x1="230" y1="310" x2="230" y2="380" stroke="#2A2A28" strokeWidth="1.8" strokeLinecap="round" />
          {/* Head */}
          <circle cx="230" cy="298" r="9" stroke="#2A2A28" strokeWidth="1.5" fill="none" />
          {/* Cap */}
          <path d="M221 295 Q230 288 239 295" stroke="#2A2A28" strokeWidth="1" fill="none" />
          {/* Left arm — holding polisher */}
          <path d="M230 325 Q220 335 210 340" stroke="#2A2A28" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Right arm — extended toward car */}
          <path d="M230 325 Q250 320 270 315" stroke="#2A2A28" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Polishing machine */}
          <line x1="270" y1="315" x2="285" y2="310" stroke="#2A2A28" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="290" cy="308" rx="8" ry="5" stroke="#2A2A28" strokeWidth="1.2" fill="none" />
          {/* Legs */}
          <line x1="230" y1="380" x2="220" y2="405" stroke="#2A2A28" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="230" y1="380" x2="240" y2="405" stroke="#2A2A28" strokeWidth="1.5" strokeLinecap="round" />
          {/* Feet */}
          <line x1="220" y1="405" x2="215" y2="408" stroke="#2A2A28" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="240" y1="405" x2="245" y2="408" stroke="#2A2A28" strokeWidth="1.2" strokeLinecap="round" />
        </motion.g>

        {/* ════════════════════════════════════════════════════
            DETAILER — Right side, wiping with cloth
        ════════════════════════════════════════════════════ */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.8 }}>
          <line x1="580" y1="315" x2="580" y2="385" stroke="#2A2A28" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="580" cy="303" r="9" stroke="#2A2A28" strokeWidth="1.5" fill="none" />
          <path d="M571 300 Q580 293 589 300" stroke="#2A2A28" strokeWidth="1" fill="none" />
          {/* Left arm — wiping car */}
          <path d="M580 330 Q560 325 545 320" stroke="#2A2A28" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Right arm — holding cloth */}
          <path d="M580 330 Q595 335 605 330" stroke="#2A2A28" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Cloth / towel */}
          <path d="M540 318 Q545 315 548 320 Q543 325 538 322" stroke="#2A2A28" strokeWidth="0.8" fill="none" />
          {/* Legs */}
          <line x1="580" y1="385" x2="570" y2="410" stroke="#2A2A28" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="580" y1="385" x2="590" y2="410" stroke="#2A2A28" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="570" y1="410" x2="565" y2="413" stroke="#2A2A28" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="590" y1="410" x2="595" y2="413" stroke="#2A2A28" strokeWidth="1.2" strokeLinecap="round" />
        </motion.g>

        {/* ════════════════════════════════════════════════════
            LEFT SIDE — Detailing Station Area
        ════════════════════════════════════════════════════ */}

        {/* Tool cabinet — left */}
        <g opacity="0.5">
          <rect x="80" y="320" width="50" height="70" rx="1" stroke="#2A2A28" strokeWidth="1" fill="none" />
          <line x1="80" y1="340" x2="130" y2="340" stroke="#2A2A28" strokeWidth="0.6" />
          <line x1="80" y1="358" x2="130" y2="358" stroke="#2A2A28" strokeWidth="0.6" />
          <line x1="80" y1="376" x2="130" y2="376" stroke="#2A2A28" strokeWidth="0.6" />
          {/* Drawer handles */}
          <line x1="100" y1="330" x2="110" y2="330" stroke="#2A2A28" strokeWidth="0.8" />
          <line x1="100" y1="349" x2="110" y2="349" stroke="#2A2A28" strokeWidth="0.8" />
          <line x1="100" y1="367" x2="110" y2="367" stroke="#2A2A28" strokeWidth="0.8" />
        </g>

        {/* Polishing bottles on floor — left */}
        <g opacity="0.4">
          <rect x="90" y="395" width="10" height="18" rx="1" stroke="#2A2A28" strokeWidth="0.8" fill="none" />
          <rect x="105" y="398" width="8" height="15" rx="1" stroke="#2A2A28" strokeWidth="0.8" fill="none" />
          <rect x="118" y="393" width="9" height="20" rx="1" stroke="#2A2A28" strokeWidth="0.8" fill="none" />
        </g>

        {/* ════════════════════════════════════════════════════
            RIGHT SIDE — Mechanic Bay Area
        ════════════════════════════════════════════════════ */}

        {/* Large tool cabinet — right */}
        <g opacity="0.5">
          <rect x="820" y="290" width="60" height="100" rx="1" stroke="#2A2A28" strokeWidth="1" fill="none" />
          <line x1="820" y1="315" x2="880" y2="315" stroke="#2A2A28" strokeWidth="0.6" />
          <line x1="820" y1="340" x2="880" y2="340" stroke="#2A2A28" strokeWidth="0.6" />
          <line x1="820" y1="365" x2="880" y2="365" stroke="#2A2A28" strokeWidth="0.6" />
          <line x1="843" y1="302" x2="857" y2="302" stroke="#2A2A28" strokeWidth="0.8" />
          <line x1="843" y1="327" x2="857" y2="327" stroke="#2A2A28" strokeWidth="0.8" />
          <line x1="843" y1="352" x2="857" y2="352" stroke="#2A2A28" strokeWidth="0.8" />
          <line x1="843" y1="377" x2="857" y2="377" stroke="#2A2A28" strokeWidth="0.8" />
        </g>

        {/* Wrenches / tools hanging on wall — right */}
        <g opacity="0.35" transform="translate(750, 280)">
          {/* Wrench */}
          <path d="M0 0 L0 35" stroke="#2A2A28" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="0" cy="0" r="5" stroke="#2A2A28" strokeWidth="1" fill="none" />
          {/* Screwdriver */}
          <line x1="15" y1="5" x2="15" y2="35" stroke="#2A2A28" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="12" y="2" width="6" height="8" rx="1" stroke="#2A2A28" strokeWidth="0.7" fill="none" />
          {/* Ratchet */}
          <path d="M30 0 L30 30" stroke="#2A2A28" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="26" y="-2" width="8" height="8" rx="2" stroke="#2A2A28" strokeWidth="0.8" fill="none" />
        </g>

        {/* ════════════════════════════════════════════════════
            CEILING — Hanging lights
        ════════════════════════════════════════════════════ */}
        <g opacity="0.4">
          {/* Light fixture 1 */}
          <line x1="300" y1="100" x2="300" y2="130" stroke="#2A2A28" strokeWidth="0.8" />
          <path d="M285 130 L300 140 L315 130" stroke="#2A2A28" strokeWidth="1" fill="none" />
          {/* Light fixture 2 */}
          <line x1="500" y1="95" x2="500" y2="130" stroke="#2A2A28" strokeWidth="0.8" />
          <path d="M485 130 L500 140 L515 130" stroke="#2A2A28" strokeWidth="1" fill="none" />
          {/* Light fixture 3 */}
          <line x1="700" y1="100" x2="700" y2="130" stroke="#2A2A28" strokeWidth="0.8" />
          <path d="M685 130 L700 140 L715 130" stroke="#2A2A28" strokeWidth="1" fill="none" />
        </g>

        {/* ════════════════════════════════════════════════════
            GROUND ELEMENTS — Steps, mats
        ════════════════════════════════════════════════════ */}
        {/* Floor mat under car */}
        <rect x="300" y="398" width="240" height="8" rx="1" stroke="#2A2A28" strokeWidth="0.6" fill="none" opacity="0.2" strokeDasharray="3 2" />

        {/* ════════════════════════════════════════════════════
            CALLOUT LABELS — Handwritten annotations
        ════════════════════════════════════════════════════ */}

        {/* "Detailing Station" — bottom left */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 0.5 }}>
          <line x1="110" y1="415" x2="110" y2="455" stroke="#C9A227" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="110" cy="455" r="2" fill="#C9A227" />
          <text x="110" y="472" textAnchor="middle" fontFamily="var(--font-hand), Caveat, cursive" fontSize="12" fill="#C9A227" fontWeight="600">
            Detailing Station
          </text>
          <text x="110" y="486" textAnchor="middle" fontFamily="var(--font-hand), Caveat, cursive" fontSize="9" fill="#C9A227" opacity="0.6">
            (Polishing & Coating)
          </text>
        </motion.g>

        {/* "Mechanic Bay" — center bottom */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4, duration: 0.5 }}>
          <line x1="420" y1="408" x2="420" y2="455" stroke="#C9A227" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="420" cy="455" r="2" fill="#C9A227" />
          <text x="420" y="472" textAnchor="middle" fontFamily="var(--font-hand), Caveat, cursive" fontSize="12" fill="#C9A227" fontWeight="600">
            Mechanic Bay
          </text>
        </motion.g>

        {/* "Mechanic Bay (Detail)" — right */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6, duration: 0.5 }}>
          <line x1="850" y1="310" x2="920" y2="270" stroke="#C9A227" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="920" cy="270" r="2" fill="#C9A227" />
          <text x="928" y="266" fontFamily="var(--font-hand), Caveat, cursive" fontSize="11" fill="#C9A227" fontWeight="600">
            Mechanic Bay
          </text>
          <text x="928" y="280" fontFamily="var(--font-hand), Caveat, cursive" fontSize="9" fill="#C9A227" opacity="0.6">
            (Detail)
          </text>
        </motion.g>

        {/* "Customer Reception" — far right */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8, duration: 0.5 }}>
          <line x1="900" y1="400" x2="940" y2="440" stroke="#C9A227" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="940" cy="440" r="2" fill="#C9A227" />
          <text x="948" y="436" fontFamily="var(--font-hand), Caveat, cursive" fontSize="11" fill="#C9A227" fontWeight="600">
            Customer
          </text>
          <text x="948" y="450" fontFamily="var(--font-hand), Caveat, cursive" fontSize="11" fill="#C9A227" fontWeight="600">
            Reception
          </text>
        </motion.g>

        {/* "Vehicle Storage" — bottom right */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3, duration: 0.5 }}>
          <line x1="650" y1="410" x2="650" y2="455" stroke="#C9A227" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="650" cy="455" r="2" fill="#C9A227" />
          <text x="650" y="472" textAnchor="middle" fontFamily="var(--font-hand), Caveat, cursive" fontSize="12" fill="#C9A227" fontWeight="600">
            Vehicle Storage
          </text>
        </motion.g>

        {/* "Quality Inspection" — top right */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2, duration: 0.5 }}>
          <line x1="700" y1="250" x2="750" y2="200" stroke="#C9A227" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="750" cy="200" r="2" fill="#C9A227" />
          <text x="758" y="196" fontFamily="var(--font-hand), Caveat, cursive" fontSize="11" fill="#C9A227" fontWeight="600">
            Quality
          </text>
          <text x="758" y="210" fontFamily="var(--font-hand), Caveat, cursive" fontSize="11" fill="#C9A227" fontWeight="600">
            Inspection
          </text>
        </motion.g>

        {/* ════════════════════════════════════════════════════
            CORNER BRACKETS — Architectural drawing style
        ════════════════════════════════════════════════════ */}
        {[
          "M25 25 L25 45 M25 25 L45 25",
          "M975 25 L975 45 M975 25 L955 25",
          "M25 575 L25 555 M25 575 L45 575",
          "M975 575 L975 555 M975 575 L955 575",
        ].map((d, i) => (
          <motion.path
            key={i} d={d} stroke="#2A2A28" strokeWidth="1" strokeLinecap="round" opacity="0.25"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
          />
        ))}

        {/* "Fig. 01" label — bottom right */}
        <text x="960" y="590" textAnchor="end" fontFamily="var(--font-hand), Caveat, cursive" fontSize="11" fill="#2A2A28" opacity="0.35">
          Fig. 01 — Workshop Layout
        </text>
      </svg>
    </div>
  );
}
