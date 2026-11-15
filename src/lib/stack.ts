/**
 * Stack math for the drink panel (brief §4). Pure functions, no React.
 */
import type { Amount, RecipeLine } from "@/data/drinks";
import { roleRank } from "@/data/roles";

/** Volume we count for one dash of bitters (brief §4: "about 0.1 oz"). */
export const DASH_OZ = 0.1;

/** v4 artboard and stack geometry, in Figma pixels. */
export const ARTBOARD = { width: 402, height: 874 } as const;
export const STACK = { x: 62, y: 346, width: 277, height: 528 } as const;
export const MIN_LAYER = 60;

/** A recipe line plus its position in the original recipe (stable identity). */
export type StackLine = RecipeLine & { key: number };

export function volumeOz(amount: Amount): number {
  switch (amount.kind) {
    case "oz":
      return amount.oz;
    case "dash":
      return amount.count * DASH_OZ;
    case "garnish":
      return 0;
  }
}

/**
 * Sort lines into stack order, bottom to top, by role.
 * OPEN: tie-break for two lines with the same role (brief §7). Placeholder:
 * keep recipe order (earlier in the recipe = lower in the glass). It depends
 * only on role and recipe position, never on amount, so dragging a layer can
 * never make two layers swap mid-gesture.
 */
export function orderLines(lines: RecipeLine[]): StackLine[] {
  return lines
    .map((l, key) => ({ ...l, key }))
    .sort((a, b) => roleRank(a.role) - roleRank(b.role) || a.key - b.key);
}

/**
 * Height of each layer in px, in the same order as `lines`.
 * Heights are proportional to volume. Garnishes (no volume) and anything
 * that would be shorter than `min` are held at `min`; the remaining height is
 * shared by the rest in proportion. If even the minimums don't fit, every
 * layer gets an equal share.
 */
export function layerHeights(
  lines: { amount: Amount }[],
  total: number = STACK.height,
  min: number = MIN_LAYER,
): number[] {
  const n = lines.length;
  if (n === 0) return [];
  if (min * n >= total) return lines.map(() => total / n);

  const vol = lines.map((l) => volumeOz(l.amount));
  const fixed = vol.map((v) => v <= 0);

  for (;;) {
    const remaining = total - min * fixed.filter(Boolean).length;
    const freeVol = vol.reduce((s, v, i) => (fixed[i] ? s : s + v), 0);
    if (freeVol <= 0) {
      // Nothing left with volume: the fixed layers share the whole height.
      return lines.map(() => total / n);
    }
    const heights = vol.map((v, i) => (fixed[i] ? min : (remaining * v) / freeVol));
    const tooSmall = heights.map((h, i) => !fixed[i] && h < min);
    if (!tooSmall.some(Boolean)) return heights;
    tooSmall.forEach((t, i) => {
      if (t) fixed[i] = true;
    });
  }
}

/**
 * Pixels per oz for the layers that are sized by volume. Used to turn a drag
 * distance into an amount. Returns 0 if no layer is sized by volume.
 */
export function pxPerOz(lines: { amount: Amount }[], heights: number[]): number {
  let px = 0;
  let oz = 0;
  lines.forEach((l, i) => {
    const v = volumeOz(l.amount);
    if (v > 0 && heights[i] > MIN_LAYER + 0.01) {
      px += heights[i];
      oz += v;
    }
  });
  return oz > 0 ? px / oz : 0;
}

/** The blurred rectangle drawn for one layer (Figma "v4" recipe). */
export function layerGeometry(height: number) {
  const overlap = 0.2 * height + 12;
  const totalHeight = height + 2 * overlap;
  return {
    x: -106,
    width: 489,
    overlap,
    totalHeight,
    blur: Math.min(84, Math.round(totalHeight * 0.3)),
  };
}

/** Human-readable amount, e.g. "2 oz", "¾ oz", "2 dashes", "garnish". */
export function formatAmount(amount: Amount): string {
  switch (amount.kind) {
    case "garnish":
      return "garnish";
    case "dash":
      return `${amount.count} ${amount.count === 1 ? "dash" : "dashes"}`;
    case "oz": {
      const whole = Math.floor(amount.oz);
      const frac = Math.round((amount.oz - whole) * 4);
      const fracText = ["", "¼", "½", "¾"][frac] ?? "";
      if (frac === 4) return `${whole + 1} oz`;
      if (whole === 0 && !fracText) return "0 oz";
      return `${whole || ""}${fracText} oz`;
    }
  }
}

/** Step an amount up or down by one notch (¼ oz, or one dash). */
export function stepAmount(amount: Amount, steps: number): Amount {
  switch (amount.kind) {
    case "garnish":
      return amount;
    case "dash":
      return { kind: "dash", count: clamp(amount.count + steps, 0, 12) };
    case "oz":
      return { kind: "oz", oz: clamp(snap(amount.oz + steps * 0.25), 0, 12) };
  }
}

/** Set an amount from a volume in oz, snapped to its own unit. */
export function amountFromOz(amount: Amount, oz: number): Amount {
  switch (amount.kind) {
    case "garnish":
      return amount;
    case "dash":
      return { kind: "dash", count: clamp(Math.round(oz / DASH_OZ), 0, 12) };
    case "oz":
      return { kind: "oz", oz: clamp(snap(oz), 0, 12) };
  }
}

const snap = (oz: number) => Math.round(oz * 4) / 4;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
