"use client";

import { useEffect, useState } from "react";
import { DRINKS } from "@/data/drinks";
import { INGREDIENTS } from "@/data/ingredients";
import { layerBottoms, layerHeights, orderLines } from "@/lib/stack";

/** The page's warm black. It is laid over the blurred colors to darken them. */
const DARKEN_ALPHA = 0.72; // OPEN: how dark (JP to tune)
const DARKEN = `rgba(26, 22, 18, ${DARKEN_ALPHA})`;
/** How far the color bands are blurred, in px. */
const BLUR = 56;
/** Seconds to cross-fade from one drink's colors to the next. */
const FADE_MS = 600;
/** The stack is measured on this height, then drawn as percentages so it fits any screen. */
const BASIS = 874;

/** "#rrggbb" to [r, g, b]. */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * The color the blurred, darkened background has at the very top of the screen:
 * the top band, softened by the band under it (the blur mixes them), then
 * darkened by the same overlay. Safari tints its status bar from this, so it
 * matches the top of the screen instead of showing a different color.
 */
export function topColor(drinkIndex: number): string {
  const ordered = orderLines(DRINKS[drinkIndex].lines);
  const top = rgb(INGREDIENTS[ordered[ordered.length - 1].ingredient].color);
  const next = rgb(INGREDIENTS[ordered[Math.max(0, ordered.length - 2)].ingredient].color);
  const base = rgb("#1A1612");
  const out = top.map((c, i) => {
    const soft = c * 0.7 + next[i] * 0.3;
    return Math.round(soft * (1 - DARKEN_ALPHA) + base[i] * DARKEN_ALPHA);
  });
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

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

  // Safari's top bar takes its color from the browser's theme color and from a
  // fixed strip at the very top, so both follow the drink.
  const top = topColor(drinkIndex);
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = top;
  }, [top]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#1A1612]">
      <div
        className="fixed inset-x-0 top-0 z-10"
        style={{
          height: "max(env(safe-area-inset-top, 0px), 4px)",
          background: top,
          transition: `background-color ${FADE_MS}ms ease-out`,
        }}
      />
      {shown.previous !== null && <Bands key={`p${shown.previous}`} drinkIndex={shown.previous} fadeIn={false} />}
      <Bands key={`c${shown.current}`} drinkIndex={shown.current} fadeIn={shown.previous !== null} />
      <div className="absolute inset-0" style={{ background: DARKEN }} />
    </div>
  );
}
