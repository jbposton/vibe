/**
 * Stack math for the drink panel (brief §4). Pure functions, no React.
 */
import type { Amount, RecipeLine } from "@/data/drinks";
import { roleRank } from "@/data/roles";

/**
 * Parts are the base unit for every amount. The user sees them in a chosen
 * unit; for now only oz, where 1 part = 1 oz (JP, 2026-11-15). To add ml or
 * cup later, add an entry here and the labels follow.
 * OPEN: unit choice UI (brief §7).
 */
export const UNITS = {
  oz: { label: "oz", perPart: 1 },
} as const;
export type UnitId = keyof typeof UNITS;
export const DEFAULT_UNIT: UnitId = "oz";

/** Parts we count for one dash of bitters (brief §4: "about 0.1 oz"). */
export const DASH_PARTS = 0.1;

/** Minimum layer height in px (brief §4). */
export const MIN_LAYER = 60;

/** Largest amount a layer can hold: 12 parts, or 12 dashes. */
const MAX_STEPS_PARTS = 48; // 12 parts in ¼ part steps
export const MAX_DASHES = 12;

/** A recipe line plus its position in the original recipe (stable identity). */
export type StackLine = RecipeLine & { key: number };

export function volumeParts(amount: Amount): number {
  switch (amount.kind) {
    case "parts":
      return amount.parts;
    case "dash":
      return amount.count * DASH_PARTS;
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
 * 0 parts keeps the minimum height so it can be dragged back up.
 */
export function layerHeights(
  lines: { amount: Amount }[],
  total: number,
  min: number = MIN_LAYER,
): number[] {
  const n = lines.length;
  if (n === 0 || total <= 0) return lines.map(() => 0);
  if (min * n >= total) return lines.map(() => total / n);

  const vol = lines.map((l) => volumeParts(l.amount));
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

/** Round an amount to its notch: ¼ part, or a whole dash. */
export function snapAmount(amount: Amount): Amount {
  switch (amount.kind) {
    case "garnish":
      return amount;
    case "dash":
      return { kind: "dash", count: clamp(Math.round(amount.count), 0, MAX_DASHES) };
    case "parts":
      return { kind: "parts", parts: clamp(Math.round(amount.parts * 4) / 4, 0, MAX_STEPS_PARTS / 4) };
  }
}

/**
 * Human-readable amount in the chosen unit: "2 oz", "¾ oz", "2 dashes",
 * "garnish". Parts times the unit's size, shown in ¼ steps. Dashes and
 * garnishes sit outside the ratio, so units don't touch them.
 * OPEN: parts model. For ml or cup, steps may need a different rounding.
 */
export function formatAmount(amount: Amount, unit: UnitId = DEFAULT_UNIT, servings = 1): string {
  switch (amount.kind) {
    case "garnish":
      return "garnish";
    case "dash": {
      const count = Math.round(amount.count);
      return `${count} ${count === 1 ? "dash" : "dashes"}`;
    }
    case "parts": {
      const quarters = Math.round(amount.parts * UNITS[unit].perPart * servings * 4);
      if (quarters === 0) return `0 ${UNITS[unit].label}`;
      const whole = Math.floor(quarters / 4);
      const fracText = ["", "¼", "½", "¾"][quarters % 4];
      return `${whole || ""}${fracText} ${UNITS[unit].label}`;
    }
  }
}

/** Step an amount up or down by one notch (¼ part, or one dash). */
export function stepAmount(amount: Amount, steps: number): Amount {
  switch (amount.kind) {
    case "garnish":
      return amount;
    case "dash":
      return { kind: "dash", count: clamp(Math.round(amount.count) + steps, 0, MAX_DASHES) };
    case "parts":
      return { kind: "parts", parts: clamp(Math.round(amount.parts * 4) / 4 + steps * 0.25, 0, 12) };
  }
}

/** Sum of all liquid parts in a drink (dashes and garnishes sit outside the ratio). */
export function totalParts(lines: RecipeLine[]): number {
  return lines.reduce((s, l) => (l.amount.kind === "parts" ? s + l.amount.parts : s), 0);
}

/** A number of parts as a label in the chosen unit, e.g. "4½ oz". */
export function formatTotal(parts: number, unit: UnitId = DEFAULT_UNIT, servings = 1): string {
  return formatAmount({ kind: "parts", parts }, unit, servings);
}

/** Parts as a label: "2 parts", "½ part", "1½ parts". */
export function formatParts(parts: number): string {
  const quarters = Math.round(parts * 4);
  if (quarters === 0) return "0 parts";
  const whole = Math.floor(quarters / 4);
  const fracText = ["", "¼", "½", "¾"][quarters % 4];
  return `${whole || ""}${fracText} ${quarters <= 4 ? "part" : "parts"}`;
}

/**
 * "Share" drag (prototype): the drink's total stays fixed and changing one
 * ingredient rescales ALL the others in proportion, so their ratios to each
 * other don't change. Every liquid keeps at least a quarter part. Dashes and
 * garnishes sit outside the ratio and aren't touched.
 * Servings never enter here: they only scale the oz labels.
 * OPEN: gesture map (brief §6, §7).
 */
export const SHARE_FLOOR = 0.25;

const liquidIndexes = (lines: RecipeLine[]) =>
  lines.flatMap((l, i) => (l.amount.kind === "parts" ? [i] : []));
const partsOf = (l: RecipeLine) => (l.amount.kind === "parts" ? l.amount.parts : 0);

/** Lines with line `key` set to `a` parts and the others rescaled. Not snapped. */
export function shareLines(lines: RecipeLine[], key: number, a: number): RecipeLine[] {
  const liquid = liquidIndexes(lines);
  if (!liquid.includes(key)) return lines;
  const total = liquid.reduce((s, i) => s + partsOf(lines[i]), 0);
  const others = liquid.filter((i) => i !== key);
  if (others.length === 0) return lines;

  const mine = clamp(a, SHARE_FLOOR, total - SHARE_FLOOR * others.length);
  let pool = total - mine;
  const next = new Map<number, number>([[key, mine]]);
  let free = others;
  for (;;) {
    const sum = free.reduce((s, i) => s + partsOf(lines[i]), 0);
    const trial = free.map((i) => (sum > 0 ? (pool * partsOf(lines[i])) / sum : pool / free.length));
    const low = free.filter((_, j) => trial[j] < SHARE_FLOOR - 1e-9);
    if (low.length === 0) {
      free.forEach((i, j) => next.set(i, trial[j]));
      break;
    }
    for (const i of low) {
      next.set(i, SHARE_FLOOR);
      pool -= SHARE_FLOOR;
    }
    free = free.filter((i) => !low.includes(i));
    if (free.length === 0) break;
  }
  return lines.map((l, i) => (next.has(i) ? { ...l, amount: { kind: "parts", parts: next.get(i)! } } : l));
}

/**
 * Round every liquid to a quarter part while keeping their sum exactly the
 * same (largest remainders get the spare quarters), never below the floor.
 */
export function snapShare(lines: RecipeLine[]): RecipeLine[] {
  const liquid = liquidIndexes(lines);
  if (liquid.length === 0) return lines;
  const target = Math.round(liquid.reduce((s, i) => s + partsOf(lines[i]), 0) * 4);
  const q = liquid.map((i) => Math.max(1, Math.floor(partsOf(lines[i]) * 4 + 1e-9)));
  const rem = liquid.map((i, j) => partsOf(lines[i]) * 4 - q[j]);
  let diff = target - q.reduce((s, v) => s + v, 0);
  while (diff > 0) {
    const j = rem.indexOf(Math.max(...rem));
    q[j] += 1;
    rem[j] = -Infinity;
    diff -= 1;
    if (rem.every((r) => r === -Infinity)) rem.fill(0);
  }
  while (diff < 0) {
    const j = q.indexOf(Math.max(...q));
    if (q[j] <= 1) break;
    q[j] -= 1;
    diff += 1;
  }
  const byIndex = new Map(liquid.map((i, j) => [i, q[j] / 4]));
  return lines.map((l, i) => (byIndex.has(i) ? { ...l, amount: { kind: "parts", parts: byIndex.get(i)! } } : l));
}

/** One keyboard notch (¼ part) on a line: it changes, the others rescale. */
export function stepShare(lines: RecipeLine[], key: number, steps: number): RecipeLine[] {
  const current = partsOf(lines[key]);
  return snapShare(shareLines(lines, key, Math.round(current * 4) / 4 + steps * 0.25));
}

/**
 * Drag version of the above: finds the amount for line `key` that puts one of
 * its edges at `edge` px above the stack bottom (bottom edge so dragging down
 * gives it a bigger share; top edge for the base layer, which has nothing
 * below it, so dragging down shrinks it). `lines` is the drink as it was when
 * the drag began. Not snapped; call `snapShare` on release.
 */
export function shareForEdge(
  lines: RecipeLine[],
  key: number,
  edge: number,
  total: number,
  edgeOf: "bottom" | "top",
): RecipeLine[] {
  const liquid = liquidIndexes(lines);
  const sum = liquid.reduce((s, i) => s + partsOf(lines[i]), 0);
  let lo = SHARE_FLOOR;
  let hi = sum - SHARE_FLOOR * (liquid.length - 1);
  if (!liquid.includes(key) || hi <= lo) return lines;

  const edgeAt = (a: number) => {
    const ordered = orderLines(shareLines(lines, key, a));
    const heights = layerHeights(ordered, total);
    const idx = ordered.findIndex((l) => l.key === key);
    const below = heights.slice(0, idx).reduce((s, h) => s + h, 0);
    return edgeOf === "bottom" ? below : below + heights[idx];
  };
  const wantMore = (a: number) => (edgeOf === "bottom" ? edgeAt(a) > edge : edgeAt(a) < edge);
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (wantMore(mid)) lo = mid;
    else hi = mid;
  }
  return shareLines(lines, key, (lo + hi) / 2);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
