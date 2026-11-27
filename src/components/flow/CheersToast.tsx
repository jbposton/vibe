/**
 * The end of Build my own: two dark glasses in silhouette that lean in and clink once, then stay touching
 * with the sparkle (JP, 2026-11-26). Drawn here and moved with CSS (globals.css, "cheers"), so there's no video to load.
 * With "reduce motion" it simply shows them touching. OPEN: a placeholder drawing, for JP to review.
 */

/** One coupe, standing on the point (0, 0): the bowl, the stem and the foot. */
const GLASS =
  "M-30 -100 H30 C30 -77 17 -64 2 -62.2 V-4 H20 Q21 -4 21 -3 V0 H-21 V-3 Q-21 -4 -20 -4 H-2 V-62.2 C-17 -64 -30 -77 -30 -100 Z";

/** The burst where they meet: short strokes fanned above the touching rims, in the Build my own glow's colors. */
const SPARKS = [
  { d: "M-9 -9 L-19 -18", color: "#db587a" },
  { d: "M-4 -13 L-8 -27", color: "#f6a852" },
  { d: "M0 -14 L0 -31", color: "#f6a852" },
  { d: "M4 -13 L8 -27", color: "#f6a852" },
  { d: "M9 -9 L19 -18", color: "#9a77bb" },
];

/**
 * One of those glasses on its own, standing upright, for Build my own's empty glass (JP, 2026-11-27).
 * It sits on the page itself, which is the toast glasses' dark color, so it is a step lighter to show up.
 */
export function GlassSilhouette() {
  return (
    <svg viewBox="-32 -102 64 104" className="mx-auto block h-[72px] w-[45px] md:h-[110px] md:w-[68px]" aria-hidden>
      <path d={GLASS} fill="#2C2A27" />
    </svg>
  );
}

export function CheersToast() {
  return (
    <svg viewBox="0 0 200 150" className="mx-auto block h-[150px] w-[200px] max-w-full" aria-hidden>
      {/* Each glass pivots on its foot. The right one is the left one in a mirror, so they move as a pair.
          Leaned in 10 degrees, their near rims meet in the middle, at (100, 45). */}
      {["translate(53.1 138)", "translate(146.9 138) scale(-1 1)"].map((place) => (
        <g key={place} transform={place}>
          <g className="cheers-glass">
            <path d={GLASS} fill="#1A1612" />
          </g>
        </g>
      ))}
      <g transform="translate(100 45)">
        <g className="cheers-spark" fill="none" strokeWidth="2.5" strokeLinecap="round">
          {SPARKS.map((s) => (
            <path key={s.d} d={s.d} stroke={s.color} />
          ))}
        </g>
      </g>
    </svg>
  );
}
