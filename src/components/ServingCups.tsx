/**
 * Small line-drawn cups for the Servings buttons: one cup for 1 serving, two
 * for 2, four (in a 2 x 2 grid) for 4. The lines keep one thickness at every
 * size. Color comes from the surrounding text color.
 */

/** One cup, drawn in a 10 x 12 box: a tapered glass with a rounded base. */
const CUP = "M0.5 0.5h9l-1.2 9.6a1.2 1.2 0 0 1-1.2 1.1H2.9a1.2 1.2 0 0 1-1.2-1.1L0.5 0.5z";

/** Where each cup goes: top-left corner and scale, in a 28 x 24 picture. */
const LAYOUTS: Record<number, { x: number; y: number; s: number }[]> = {
  1: [{ x: 6.5, y: 3, s: 1.5 }],
  2: [
    { x: 2, y: 5.4, s: 1.1 },
    { x: 15, y: 5.4, s: 1.1 },
  ],
  4: [
    { x: 5, y: 0.8, s: 0.85 },
    { x: 14.5, y: 0.8, s: 0.85 },
    { x: 5, y: 13, s: 0.85 },
    { x: 14.5, y: 13, s: 0.85 },
  ],
};

export function ServingCups({ count }: { count: number }) {
  const cups = LAYOUTS[count] ?? LAYOUTS[1];
  return (
    <svg width="22" height="19" viewBox="0 0 28 24" fill="none" aria-hidden>
      {cups.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
          <path
            d={CUP}
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </svg>
  );
}
