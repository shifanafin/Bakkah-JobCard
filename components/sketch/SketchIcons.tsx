"use client";

/**
 * Hand-drawn SVG icons — pencil-sketch style replacements for Lucide icons.
 * All icons use stroke-only rendering with slightly imperfect lines.
 */

type IconProps = { className?: string; strokeWidth?: number };

export function SketchShield({ className = "", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3 L4 7 L4 12 Q4 18 12 21 Q20 18 20 12 L20 7 Z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M9 12 L11 14 L15 10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SketchSparkle({ className = "", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2 L13.5 9 L20 8 L14.5 12.5 L18 19 L12 14.5 L6 19 L9.5 12.5 L4 8 L10.5 9 Z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function SketchCar({ className = "", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 14 L5 8 Q6 6 8 6 L16 6 Q18 6 19 8 L21 14"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M3 14 L21 14 L22 17 L2 17 Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="17" r="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="18" cy="17" r="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function SketchWrench({ className = "", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14.7 6.3 Q16.5 4.5 19 4.5 Q21 4.5 21.5 6.5 Q22 8.5 20 10 L14.5 15.5"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M9.5 10.5 L4 16 Q2 18 3.5 19.5 Q5 21 7 19 L12.5 13.5"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <line x1="9" y1="14" x2="15" y2="8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

export function SketchTruck({ className = "", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 6 L12 6 L12 15 L2 15 Z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M12 9 L17 9 L20 12 L20 15 L12 15"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="6" cy="17" r="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function SketchDroplet({ className = "", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3 Q6 11 6 15 Q6 19 12 21 Q18 19 18 15 Q18 11 12 3 Z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M10 15 Q12 12 14 15" stroke="currentColor" strokeWidth={strokeWidth * 0.7} strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function SketchZap({ className = "", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M13 2 L5 14 L11 14 L10 22 L19 10 L13 10 Z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function SketchStar({ className = "", strokeWidth = 1.5, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className={className} aria-hidden="true">
      <path
        d="M12 2 L14.5 8.5 L21.5 9 L16 14 L17.5 21 L12 17.5 L6.5 21 L8 14 L2.5 9 L9.5 8.5 Z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function SketchClock({ className = "", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="12" y1="7" x2="12" y2="12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="12" y1="12" x2="16" y2="14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function SketchAward({ className = "", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M8 13 L6 21 L12 18 L18 21 L16 13" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SketchThumbsUp({ className = "", strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 22 L7 11 L10 4 Q11 2 13 4 L11 11 L20 11 Q21 11 21 12 L20 20 Q20 22 18 22 Z"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <line x1="4" y1="11" x2="4" y2="22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function SketchQuote({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 20 Q2 20 2 16 Q2 12 6 10 L8 12 Q5 13 5 16 Q5 17 6 17 L8 17 Q10 17 10 19 Q10 21 8 21 Z"
        stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15"
      />
      <path
        d="M18 20 Q14 20 14 16 Q14 12 18 10 L20 12 Q17 13 17 16 Q17 17 18 17 L20 17 Q22 17 22 19 Q22 21 20 21 Z"
        stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15"
      />
    </svg>
  );
}
