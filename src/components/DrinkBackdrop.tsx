"use client";

import { useEffect, useState } from "react";
import { DRINKS } from "@/data/drinks";
import { INGREDIENTS } from "@/data/ingredients";
import { layerBottoms, layerHeights, orderLines } from "@/lib/stack";

/** The page's warm black. It is laid over the blurred colors to darken them. */
const DARKEN = "rgba(26, 22, 18, 0.72)"; // OPEN: how dark (JP to tune)
/** How far the color bands are blurred, in px. */
const BLUR = 56;
/** Seconds to cross-fade from one drink's colors to the next. */
const FADE_MS = 600;
/** The stack is measured on this height, then drawn as percentages so it fits any screen. */
const BASIS = 874;

/** One drink's colors as soft bands, in its classic order and sizes. */
function Bands({ drinkIndex, fadeIn }: { drinkIndex: number; fadeIn: boolean }) {
  const ordered = orderLines(DRINKS[drinkIndex].lines);
  const heights = layerHeights(ordered, BASIS);
  const bottoms = layerBottoms(heights);
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={fadeIn ? { animation: `backdrop-in ${FADE_MS}ms ease-out both` } : undefined}
    >
      {/* Bigger than the screen so the blur's soft edge falls off-screen. */}
      <div className="absolute -inset-24" style={{ filter: `blur(${BLUR}px)` }}>
        {ordered.map((line, i) => (
          <div
            key={line.key}
            className="absolute inset-x-0"
            style={{
              background: INGREDIENTS[line.ingredient].color,
              bottom: `${(bottoms[i] / BASIS) * 100}%`,
              height: `${(heights[i] / BASIS) * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The app's background: the colors of the drink in view (its classic order and
 * sizes), blurred out and darkened. It cross-fades when the drink changes.
 */
export function DrinkBackdrop({ drinkIndex }: { drinkIndex: number }) {
  const [shown, setShown] = useState<{ current: number; previous: number | null }>({
    current: drinkIndex,
    previous: null,
  });
  if (shown.current !== drinkIndex) setShown({ current: drinkIndex, previous: shown.current });

  // Once the new colors have faded in, drop the old ones.
  useEffect(() => {
    if (shown.previous === null) return;
    const t = setTimeout(() => setShown((s) => ({ ...s, previous: null })), FADE_MS + 50);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#1A1612]">
      {shown.previous !== null && <Bands key={`p${shown.previous}`} drinkIndex={shown.previous} fadeIn={false} />}
      <Bands key={`c${shown.current}`} drinkIndex={shown.current} fadeIn={shown.previous !== null} />
      <div className="absolute inset-0" style={{ background: DARKEN }} />
    </div>
  );
}
