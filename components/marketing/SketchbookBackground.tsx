"use client";

/**
 * Decorative "sketchbook page" backdrop — blueprint grid, ruler ticks and
 * faint automotive motifs (gear, tire tread, engine-diagram circles).
 * Pure decoration: aria-hidden, pointer-events-none, no layout impact.
 * Flips from warm-paper (light) to blueprint (dark) via the site's existing
 * dark-mode class, so it follows the same toggle as the rest of the page.
 */
export default function SketchbookBackground({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Paper / blueprint base tint */}
      <div className="absolute inset-0 bg-paper-100 dark:bg-blueprint-900 transition-colors duration-500" />

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.05] dark:opacity-[0.06] mix-blend-multiply dark:mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 0.6px, transparent 0.6px)",
          backgroundSize: "3px 3px",
          color: "#2A2A28",
        }}
      />

      {/* Blueprint grid */}
      <div
        className="absolute inset-0 opacity-[0.07] dark:opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(#2A2A28 1px, transparent 1px), linear-gradient(90deg, #2A2A28 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.16] hidden dark:block"
        style={{
          backgroundImage:
            "linear-gradient(#B9BFC6 1px, transparent 1px), linear-gradient(90deg, #B9BFC6 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Ruler ticks — top edge */}
      <svg className="absolute inset-x-0 top-0 h-4 w-full text-graphite/25 dark:text-silver/25" preserveAspectRatio="none">
        <line x1="0" y1="0" x2="100%" y2="0" stroke="currentColor" strokeWidth="1" />
        {Array.from({ length: 60 }).map((_, i) => (
          <line key={i} x1={`${i * 1.7}%`} y1="0" x2={`${i * 1.7}%`} y2={i % 5 === 0 ? 12 : 6} stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>

      {/* Gear motif — top right, slow rotation */}
      <svg
        className="absolute -top-6 right-4 h-28 w-28 text-graphite/[0.07] dark:text-golden/[0.1] sm:h-40 sm:w-40 motion-safe:animate-[spin_60s_linear_infinite]"
        viewBox="0 0 100 100" fill="none"
      >
        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="2" />
        <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="2" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x1 = 50 + Math.cos(a) * 30, y1 = 50 + Math.sin(a) * 30;
          const x2 = 50 + Math.cos(a) * 38, y2 = 50 + Math.sin(a) * 38;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="3" strokeLinecap="round" />;
        })}
      </svg>

      {/* Tire tread arc — bottom left */}
      <svg className="absolute -bottom-10 -left-10 h-48 w-48 text-graphite/[0.06] dark:text-silver/[0.1] sm:h-64 sm:w-64" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
        <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="1.5" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          return <line key={i} x1={100 + Math.cos(a) * 30} y1={100 + Math.sin(a) * 30} x2={100 + Math.cos(a) * 70} y2={100 + Math.sin(a) * 70} stroke="currentColor" strokeWidth="1.5" />;
        })}
      </svg>

      {/* Engine-diagram dashed circles — center right, very faint */}
      <svg className="absolute top-1/3 right-[8%] h-24 w-24 text-graphite/[0.05] dark:text-golden/[0.08] hidden md:block" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        <path d="M50 5 L50 20 M50 80 L50 95 M5 50 L20 50 M80 50 L95 50" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Fine vignette so text stays legible over the texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_40%,transparent,rgba(246,239,221,0.6))] dark:bg-[radial-gradient(ellipse_75%_65%_at_50%_40%,transparent,rgba(10,28,46,0.65))]" />
    </div>
  );
}
