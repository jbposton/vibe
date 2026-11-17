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
// Strength: five bars cover 0 to 50% ABV, so each bar is 10% (20% ABV lights 2 bars).
export const SCALE = { strength: 50, sweetness: 15, bitterness: 4 } as const;

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

/**
 * Sweet and bitter read as one continuum (JP, 2026-11-16): where the drink sits between bitter and
 * sweet, and how strong those flavors are altogether. The position alone would put a Negroni
 * (strongly both) and a Martini (barely either) in the same place, so the strength is kept too.
 *
 * OPEN: first-pass numbers. Real drinks only reach about -0.3 on the bitter side (the bitterness
 * scale is 4), so the bitter half of the track is underused. BITTER_GAIN stretches it, but at 1.5 a
 * Negroni stops reading as balanced (it lands at -0.41), so it stays at 1 until JP decides. The
 * words' cut-offs are guesses too.
 */
const BITTER_GAIN = 1;

export type TasteBalance = {
  /** -1 (all bitter) to 1 (all sweet); 0 is balanced. */
  position: number;
  /** 0 (neither flavor) to 1 (strong in both). */
  intensity: number;
};

export function tasteBalance(profile: Profile): TasteBalance {
  const sweet = barFraction("sweetness", profile.sweetness);
  const bitter = barFraction("bitterness", profile.bitterness);
  return {
    position: Math.min(1, Math.max(-1, sweet - bitter * BITTER_GAIN)),
    intensity: Math.min(1, (sweet + bitter) / 2),
  };
}

/** Where on the slider, in words: Balanced, Leans sweet, Sweet, and the same for bitter. */
export function balanceWord(position: number): string {
  const side = position >= 0 ? "sweet" : "bitter";
  const far = Math.abs(position);
  if (far < 0.12) return "Balanced";
  return far < 0.4 ? `Leans ${side}` : side === "sweet" ? "Sweet" : "Bitter";
}

/** How strong the flavors are, in words. */
export function intensityWord(intensity: number): string {
  return intensity < 0.2 ? "Light" : intensity < 0.5 ? "Medium" : "Intense";
}
