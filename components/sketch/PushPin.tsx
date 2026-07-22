"use client";

/**
 * SVG pushpin for polaroid-style gallery items.
 * Can be customized with color prop.
 */
export default function PushPin({ color = "#c0392b", className = "" }: { color?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-5 h-5 ${className}`}
      aria-hidden="true"
    >
      {/* Pin shadow */}
      <ellipse cx="12" cy="21" rx="4" ry="1.5" fill="rgba(0,0,0,0.15)" />
      {/* Pin body */}
      <circle cx="12" cy="10" r="7" fill={color} />
      {/* Highlight */}
      <circle cx="9.5" cy="8" r="2.5" fill="white" opacity="0.35" />
      {/* Pin point */}
      <line x1="12" y1="17" x2="12" y2="22" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
