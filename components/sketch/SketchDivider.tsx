"use client";

type DividerVariant = "wavy" | "dashed" | "ruler" | "zigzag";

/**
 * Hand-drawn style divider SVGs for section separation.
 */
export default function SketchDivider({
  variant = "wavy",
  className = "",
  color = "#C9A227",
}: {
  variant?: DividerVariant;
  className?: string;
  color?: string;
}) {
  const paths: Record<DividerVariant, string> = {
    wavy: "M0 12 Q25 4, 50 12 T100 12 T150 12 T200 12 T250 12 T300 12 T350 12 T400 12 T450 12 T500 12 T550 12 T600 12 T650 12 T700 12 T750 12 T800 12 T850 12 T900 12 T950 12 T1000 12",
    dashed: "M0 12 L30 12 M40 12 L70 12 M80 12 L110 12 M120 12 L150 12 M160 12 L190 12 M200 12 L230 12 M240 12 L270 12 M280 12 L310 12 M320 12 L350 12 M360 12 L390 12 M400 12 L430 12 M440 12 L470 12 M480 12 L510 12 M520 12 L550 12 M560 12 L590 12 M600 12 L630 12 M640 12 L670 12 M680 12 L710 12 M720 12 L750 12 M760 12 L790 12 M800 12 L830 12 M840 12 L870 12 M880 12 L910 12 M920 12 L950 12 M960 12 L1000 12",
    ruler: "M0 12 L1000 12 M50 8 L50 16 M100 6 L100 18 M150 8 L150 16 M200 6 L200 18 M250 8 L250 16 M300 6 L300 18 M350 8 L350 16 M400 6 L400 18 M450 8 L450 16 M500 6 L500 18 M550 8 L550 16 M600 6 L600 18 M650 8 L650 16 M700 6 L700 18 M750 8 L750 16 M800 6 L800 18 M850 8 L850 16 M900 6 L900 18 M950 8 L950 16",
    zigzag: "M0 12 L25 4 L50 20 L75 4 L100 20 L125 4 L150 20 L175 4 L200 20 L225 4 L250 20 L275 4 L300 20 L325 4 L350 20 L375 4 L400 20 L425 4 L450 20 L475 4 L500 20 L525 4 L550 20 L575 4 L600 20 L625 4 L650 20 L675 4 L700 20 L725 4 L750 20 L775 4 L800 20 L825 4 L850 20 L875 4 L900 20 L925 4 L950 20 L975 4 L1000 20",
  };

  return (
    <svg
      viewBox="0 0 1000 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-6 ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={paths[variant]}
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}
