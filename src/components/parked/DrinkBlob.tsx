"use client";

import { useMemo } from "react";
import type { RecipeLine } from "@/data/drinks";
import { INGREDIENTS } from "@/data/ingredients";
import { volumeParts } from "@/lib/stack";
import { LAYER_GRAIN_STYLE } from "../surfaceEffects";

/** How much a garnish counts toward the picture (it has no volume). */
const GARNISH_WEIGHT = 0.2;

/** A soft, uneven outline: not a circle, not a square. */
const BLOB_RADIUS = "64% 36% 55% 45% / 52% 62% 38% 48%";

/**
 * A mesh gradient of the drink's colors: one soft spot of color for each ingredient in the drink,
 * the bigger the more of it there is, spread around the picture and fading into each other over
 * the color of the main ingredient.
 */
function meshBackground(lines: RecipeLine[]): string {
  const items = lines
    .map((l) => ({
      color: INGREDIENTS[l.ingredient].color,
      weight: l.amount.kind === "garnish" ? GARNISH_WEIGHT : Math.max(0.1, volumeParts(l.amount)),
    }))
    .sort((a, b) => b.weight - a.weight);
  if (items.length === 0) return "#D9D9D9";
  const total = items.reduce((s, i) => s + i.weight, 0);
  const spots = items.map((item, i) => {
    const angle = (i / items.length) * Math.PI * 2 + 0.6;
    const cx = 50 + 24 * Math.cos(angle);
    const cy = 50 + 24 * Math.sin(angle);
    const reach = 52 + 48 * (item.weight / total); // how far the spot spreads (%)
    return `radial-gradient(circle at ${cx.toFixed(1)}% ${cy.toFixed(1)}%, ${item.color} 0%, ${item.color}00 ${reach.toFixed(0)}%)`;
  });
  return `${spots.join(", ")}, ${items[0].color}`;
}

/**
 * The drink's picture in the open drawer's header (a stand-in for a real picture): a blobby
 * mesh gradient of the colors of the ingredients in the drink right now, with film grain on it
 * and a soft glow behind, like the icon illustrations. The outline drifts slowly.
 */
export function DrinkBlob({ lines }: { lines: RecipeLine[] }) {
  const background = useMemo(() => meshBackground(lines), [lines]);
  return (
    <div aria-hidden className="relative size-[43px]">
      {/* The glow behind (a blurred copy). */}
      <span
        className="blob-shape absolute -inset-2 opacity-70 blur-[10px]"
        style={{ background, borderRadius: BLOB_RADIUS }}
      />
      {/* The picture, with grain over it. */}
      <span
        className="blob-shape absolute inset-0 isolate overflow-hidden"
        style={{ background, borderRadius: BLOB_RADIUS }}
      >
        <span className="absolute inset-0" style={{ ...LAYER_GRAIN_STYLE, opacity: 0.55 }} />
      </span>
    </div>
  );
}
