/**
 * Stack math for the drink panel (brief §4). Pure functions, no React.
 */
import type { Amount, RecipeLine } from "@/data/drinks";
import { roleRank } from "@/data/roles";

/** Volume we count for one dash of bitters (brief §4: "about 0.1 oz"). */
export const DASH_OZ = 0.1;

/** Minimum layer height in px (brief §4). */
export const MIN_LAYER = 60;

/** Largest amount a layer can hold: 12 oz, or 12 dashes. */
const MAX_STEPS_OZ = 48; // 12 oz in ¼ oz steps
const MAX_DASHES = 12;

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
 * only on role and recipe position, never on amount, so dragging can never
 * make two layers swap mid-gesture.
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
 *
 * OPEN: what a missing role looks like (brief §7). Placeholder: a layer at
 * 0 oz keeps the minimum height so it can be dragged back up.
 */
export function layerHeights(
  lines: { amount: Amount }[],
  total: number,
  min: number = MIN_LAYER,
): number[] {
  const n = lines.length;
  if (n === 0 || total <= 0) return lines.map(() => 0);
  if (min * n >= total) return lines.map(() => total / n);

  const vol = lines.map((l) => volumeOz(l.amount));
  const fixed = vol.map((v) => v <= 0);

  for (;;) {
    const remaining = total - min * fixed.filter(Boolean).length;
    const freeVol = vol.reduce((s, v, i) => (fixed[i] ? s : s + v), 0);
    if (freeVol <= 0) return lines.map(() => total / n);
    const heights = vol.map((v, i) => (fixed[i] ? min : (remaining * v) / freeVol));
    const tooSmall = heights.map((h, i) => !fixed[i] && h < min);
    if (!tooSmall.some(Boolean)) return heights;
    tooSmall.forEach((t, i) => {
      if (t) fixed[i] = true;
    });
  }
}

/** Bottom edge of each layer, measured up from the bottom of the stack. */
export function layerBottoms(heights: number[]): number[] {
  const bottoms: number[] = [];
  heights.reduce((acc, h, i) => {
    bottoms[i] = acc;
    return acc + h;
  }, 0);
  return bottoms;
}

/**
 * Vertical part of the blurred band for one layer (Figma "v4" recipe).
 * Horizontally the band runs past both sides of the panel, which clips it.
 */
export function layerGeometry(height: number) {
  const overlap = 0.2 * height + 12;
  const totalHeight = height + 2 * overlap;
  return { overlap, totalHeight, blur: Math.min(84, Math.round(totalHeight * 0.3)) };
}

/** An amount of the same kind holding `value` (oz, or dashes). Not snapped. */
function withValue(amount: Amount, value: number): Amount {
  switch (amount.kind) {
    case "garnish":
      return amount;
    case "dash":
      return { kind: "dash", count: value };
    case "oz":
      return { kind: "oz", oz: value };
  }
}

/** Top edge (px above the stack bottom) of line `key`'s layer if it held `amount`. */
function topEdge(lines: RecipeLine[], key: number, amount: Amount, total: number): number {
  const trial = lines.map((l, i) => (i === key ? { ...l, amount } : l));
  const ordered = orderLines(trial);
  const heights = layerHeights(ordered, total);
  const idx = ordered.findIndex((l) => l.key === key);
  return heights.slice(0, idx + 1).reduce((s, h) => s + h, 0);
}

/**
 * The amount for line `key` that puts the TOP edge of its layer at `edge` px
 * above the bottom of the stack, so the divider follows the finger exactly.
 * The result is continuous (not snapped); call `snapAmount` when the drag ends.
 * Dragging well below the layer's minimum height takes it to 0.
 */
export function amountForEdge(
  lines: RecipeLine[],
  key: number,
  edge: number,
  total: number,
): Amount {
  const current = lines[key].amount;
  if (current.kind === "garnish") return current;
  const max = current.kind === "dash" ? MAX_DASHES : MAX_STEPS_OZ / 4;
  const top = (v: number) => topEdge(lines, key, withValue(current, v), total);

  if (edge < top(0) - 12) return withValue(current, 0);
  if (top(max) <= edge) return withValue(current, max);

  // The edge only moves up as the amount grows, so bisect for it.
  let lo = 0;
  let hi = max;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (top(mid) <= edge) lo = mid;
    else hi = mid;
  }
  return withValue(current, lo);
}

/** Round an amount to its notch: ¼ oz, or a whole dash. */
export function snapAmount(amount: Amount): Amount {
  switch (amount.kind) {
    case "garnish":
      return amount;
    case "dash":
      return { kind: "dash", count: clamp(Math.round(amount.count), 0, MAX_DASHES) };
    case "oz":
      return { kind: "oz", oz: clamp(Math.round(amount.oz * 4) / 4, 0, MAX_STEPS_OZ / 4) };
  }
}

/** Human-readable amount, e.g. "2 oz", "¾ oz", "2 dashes", "garnish". */
export function formatAmount(amount: Amount): string {
  switch (amount.kind) {
    case "garnish":
      return "garnish";
    case "dash": {
      const count = Math.round(amount.count);
      return `${count} ${count === 1 ? "dash" : "dashes"}`;
    }
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
      return { kind: "dash", count: clamp(Math.round(amount.count) + steps, 0, MAX_DASHES) };
    case "oz":
      return { kind: "oz", oz: clamp(Math.round(amount.oz * 4) / 4 + steps * 0.25, 0, 12) };
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
