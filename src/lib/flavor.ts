/**
 * Flavor profile (brief §3), kept simple: strength, sweetness and bitterness,
 * plus a few flavor notes. Pure functions, no React.
 *
 * Everything comes from each ingredient's share of the glass (its parts out of
 * the drink's total), so it doesn't change with Servings and it moves live
 * while you drag. Strength and sweetness are plain averages of the ingredients'
 * alcohol and sugar. Bitterness and notes use hand-set numbers in
 * data/flavor.ts.
 * OPEN: acidity and dilution were dropped on purpose (JP, 2026-11-15), so
 * these are the drink as poured, not after ice melts.
 */
import type { RecipeLine } from "@/data/drinks";
import { FLAVORS, type Note } from "@/data/flavor";
import { volumeParts } from "./stack";

/** What a full bar means on each axis (fixed, so bars compare across drinks). */
export const SCALE = { strength: 40, sweetness: 15, bitterness: 4 } as const;

/** How much a garnish counts toward notes, as a share of the glass. */
const GARNISH_NOTE_SHARE = 0.25;
/** Bitters dashes are tiny in volume but strong in flavor. */
const DASH_NOTE_BOOST = 5;

export type Profile = {
  /** Alcohol by volume of the drink as poured, %. */
  strength: number;
  /** Sugar, g per 100 ml. */
  sweetness: number;
  /** Bitterness potency (hand-set scale). */
  bitterness: number;
  /** The strongest notes, most prominent first (up to three). */
  notes: Note[];
};

export function flavorProfile(lines: RecipeLine[]): Profile {
  const volumes = lines.map((l) => volumeParts(l.amount));
  const total = volumes.reduce((s, v) => s + v, 0);
  const sums = { abv: 0, sugar: 0, bitter: 0 };
  const noteScore = new Map<Note, number>();

  lines.forEach((l, i) => {
    const flavor = FLAVORS[l.ingredient];
    const share = total > 0 ? volumes[i] / total : 0;
    sums.abv += share * flavor.abv;
    sums.sugar += share * flavor.sugar;
    sums.bitter += share * flavor.bitter;

    const weight =
      l.amount.kind === "garnish" ? GARNISH_NOTE_SHARE : l.amount.kind === "dash" ? share * DASH_NOTE_BOOST : share;
    for (const [note, intensity] of flavor.notes) {
      noteScore.set(note, (noteScore.get(note) ?? 0) + weight * intensity);
    }
  });

  const notes = [...noteScore.entries()]
    .filter(([, score]) => score >= 0.15)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([note]) => note);

  return {
    strength: sums.abv,
    sweetness: sums.sugar,
    bitterness: sums.bitter,
    notes,
  };
}

/** A value as a 0 to 1 bar length on its axis. */
export const barFraction = (axis: keyof typeof SCALE, value: number) =>
  Math.min(1, Math.max(0, value / SCALE[axis]));
