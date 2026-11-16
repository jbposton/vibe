/**
 * "Make edits" (JP's design, Figma 110:581): the buttons are about taste, and
 * only the ones that make sense for the drink are shown.
 *
 *  - Add Sweet:   shown if the drink has a sweet ingredient.
 *  - Add Bitter:  shown if the drink has a bitter ingredient.
 *  - Less / More Strong: shown if the drink has alcohol.
 *
 * Every ingredient already carries the three numbers this needs (sugar,
 * bitterness and ABV, in data/flavor.ts), so nothing new is stored. For each
 * button we pick the ingredient in this drink that does the job best, from the
 * classic recipe (so the buttons stay put while you edit):
 *  - sweet:  the ingredient with the most sugar, counting bitterness against it
 *            (so a Negroni sweetens with vermouth, not Campari);
 *  - bitter: the most bitter ingredient, counting sugar against it;
 *  - strong: the ingredient with the highest ABV.
 * Add and More put a little more of that ingredient in; Less Strong takes a
 * little out of the strongest one.
 *
 * OPEN: first-pass rules and thresholds. The step is ¼ part (¼ oz at one
 * serving; one dash for bitters); a line never goes below ¼ part or above 12.
 */
import type { RecipeLine } from "@/data/drinks";
import { FLAVORS } from "@/data/flavor";
import { MAX_DASHES, SHARE_FLOOR } from "./stack";

export const EDIT_STEP = 0.25;
const MAX_PARTS = 12;

/** What counts as a sweet / bitter / alcoholic ingredient (g per 100 ml, potency, % ABV). */
const SWEET_MIN = 8;
const BITTER_MIN = 1.5;
const ALCOHOL_MIN = 11;

export type TraitEdit = {
  id: "add-sweet" | "add-bitter" | "less-strong" | "more-strong";
  label: string;
  /** Position, in the drink's lines, of the ingredient this button changes. */
  key: number;
  /** +1 puts more of it in, -1 takes some out. */
  direction: 1 | -1;
};

/** The index of the line with the best score (at or above `min` on the raw value), or null. */
function best(
  lines: RecipeLine[],
  allow: (l: RecipeLine) => boolean,
  raw: (l: RecipeLine) => number,
  min: number,
  score: (l: RecipeLine) => number,
): number | null {
  let pick: number | null = null;
  lines.forEach((l, i) => {
    if (!allow(l) || raw(l) < min) return;
    if (pick === null || score(l) > score(lines[pick])) pick = i;
  });
  return pick;
}

/** The buttons for a drink, in order (Add Sweet, Add Bitter, Less Strong, More Strong). */
export function traitEdits(original: RecipeLine[]): TraitEdit[] {
  const f = (l: RecipeLine) => FLAVORS[l.ingredient];
  const adjustable = (l: RecipeLine) => l.amount.kind !== "garnish";
  const liquid = (l: RecipeLine) => l.amount.kind === "parts";
  const edits: TraitEdit[] = [];

  const sweet = best(original, liquid, (l) => f(l).sugar, SWEET_MIN, (l) => f(l).sugar - 2 * f(l).bitter);
  if (sweet !== null) edits.push({ id: "add-sweet", label: "Add Sweet", key: sweet, direction: 1 });

  const bitter = best(original, adjustable, (l) => f(l).bitter, BITTER_MIN, (l) => f(l).bitter - f(l).sugar / 8);
  if (bitter !== null) edits.push({ id: "add-bitter", label: "Add Bitter", key: bitter, direction: 1 });

  const strong = best(original, liquid, (l) => f(l).abv, ALCOHOL_MIN, (l) => f(l).abv);
  if (strong !== null) {
    edits.push({ id: "less-strong", label: "Less Strong", key: strong, direction: -1 });
    edits.push({ id: "more-strong", label: "More Strong", key: strong, direction: 1 });
  }
  return edits;
}

/** Whether a tap in this direction (+1 more, -1 less) would change anything. */
export function canAdjust(lines: RecipeLine[], key: number, direction: 1 | -1): boolean {
  const a = lines[key]?.amount;
  if (!a) return false;
  if (a.kind === "parts") return direction > 0 ? a.parts + EDIT_STEP <= MAX_PARTS : a.parts - EDIT_STEP >= SHARE_FLOOR;
  if (a.kind === "dash") return direction > 0 ? a.count + 1 <= MAX_DASHES : a.count - 1 >= 1;
  return false;
}

/** The recipe after one tap: a little more (+1) or less (-1) of one ingredient. */
export function adjustLine(lines: RecipeLine[], key: number, direction: 1 | -1): RecipeLine[] {
  if (!canAdjust(lines, key, direction)) return lines;
  return lines.map((l, i) => {
    if (i !== key) return l;
    if (l.amount.kind === "parts") return { ...l, amount: { kind: "parts", parts: l.amount.parts + direction * EDIT_STEP } };
    if (l.amount.kind === "dash") return { ...l, amount: { kind: "dash", count: l.amount.count + direction } };
    return l;
  });
}
