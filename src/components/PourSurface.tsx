import type { Pouring } from "./usePour";

/** How high the stirred-up surface stands (px). */
const SURFACE_WAVE = 16;

/**
 * What you see of an ingredient flowing in: a rolling surface on the liquid as it rises, lying flat as the
 * layer fills. (The stream of color falling from the top was removed: JP, 2026-11-27.) `surface` is px up
 * from the bottom of the glass.
 */
export function PourSurface({ pouring, color, surface }: { pouring: Pouring; color: string; surface: number }) {
  const { p, fill } = pouring;
  const wave = SURFACE_WAVE * Math.sin(Math.PI * Math.min(1, fill)) ** 0.8;
  if (!(wave > 0.5)) return null;
  const points = Array.from({ length: 41 }, (_, k) => {
    const u = k / 40;
    // Highest in the middle, where it pours in, with ripples running out from there.
    const ripple = 0.5 + 0.5 * Math.cos((Math.abs(u - 0.5) * 5 - p * 7) * Math.PI);
    const y = SURFACE_WAVE - wave * ripple * (1 - Math.abs(u - 0.5));
    return `L${(u * 100).toFixed(1)} ${y.toFixed(2)}`;
  }).join(" ");

  return (
    <svg aria-hidden className="pointer-events-none absolute inset-x-0" width="100%" height={SURFACE_WAVE + 1} viewBox={`0 0 100 ${SURFACE_WAVE + 1}`} preserveAspectRatio="none" style={{ bottom: surface - 1 }}>
      <path d={`M0 ${SURFACE_WAVE + 1} ${points} L100 ${SURFACE_WAVE + 1} Z`} fill={color} />
    </svg>
  );
}
