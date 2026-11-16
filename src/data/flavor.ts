/**
 * Flavor data per ingredient (brief §3: strength, sugar, curated
 * flavor notes; acidity was dropped to keep the profile simple). Hand-set first-pass numbers: bartending approximations, not
 * lab data. Kept apart from ingredients.ts so the Figma color tokens stay
 * untouched.
 *
 * OPEN: JP to review every number; the note vocabulary is a placeholder.
 */
import type { IngredientId } from "./ingredients";

/** The small fixed vocabulary of flavor notes (curated, not calculated). */
export const NOTES = [
  "botanical",
  "citrus",
  "herbal",
  "fruity",
  "spiced",
  "oaky",
  "coffee",
  "tea",
  "fresh",
  "honeyed",
  "salty",
] as const;
export type Note = (typeof NOTES)[number];

export type Flavor = {
  /** Alcohol by volume, %. */
  abv: number;
  /** Sugar, grams per 100 ml. */
  sugar: number;
  /** Bitterness potency (0 = none). Bitters dashes are far stronger per part. */
  bitter: number;
  /** Up to three notes with an intensity of 1 to 3. */
  notes: readonly (readonly [Note, 1 | 2 | 3])[];
};

const f = (abv: number, sugar: number, bitter: number, ...notes: [Note, 1 | 2 | 3][]): Flavor => ({
  abv,
  sugar,
  bitter,
  notes,
});

export const FLAVORS: Record<IngredientId, Flavor> = {
  // Spirit
  gin: f(40, 0, 0.5, ["botanical", 3], ["citrus", 1]),
  "white-rum": f(40, 0, 0),
  vodka: f(40, 0, 0),
  tequila: f(40, 0, 0.3, ["herbal", 2], ["citrus", 1]),
  bourbon: f(45, 0, 0.3, ["oaky", 3]),
  rye: f(45, 0, 0.5, ["oaky", 2], ["spiced", 2]),
  whiskey: f(40, 0, 0.3, ["oaky", 2], ["spiced", 1]),
  // Liqueur
  "orange-liqueur": f(30, 25, 0.5, ["citrus", 2]),
  "coffee-liqueur": f(20, 35, 1, ["coffee", 2]),
  // Aperitif or fortified wine
  campari: f(25, 24, 8, ["herbal", 2], ["citrus", 2], ["fruity", 1]),
  aperol: f(11, 24, 3, ["citrus", 2], ["herbal", 1]),
  "sweet-vermouth": f(16, 14, 1.5, ["herbal", 2], ["spiced", 1], ["fruity", 1]),
  "dry-vermouth": f(17, 3.5, 1, ["herbal", 2], ["botanical", 1]),
  // Sparkling
  prosecco: f(11, 1.5, 0, ["fruity", 1], ["fresh", 1]),
  // Juice
  "lime-juice": f(0, 1, 0, ["citrus", 3]),
  "lemon-juice": f(0, 1.5, 0.3, ["citrus", 3]),
  "cranberry-juice": f(0, 11, 1, ["fruity", 3]),
  // Syrup
  "simple-syrup": f(0, 50, 0),
  honey: f(0, 80, 0, ["honeyed", 3]),
  grenadine: f(0, 55, 0, ["fruity", 2]),
  // Bitters
  angostura: f(45, 1, 25, ["spiced", 3], ["herbal", 1]),
  // Mixer
  "soda-water": f(0, 0, 0, ["fresh", 1]),
  "tonic-water": f(0, 9, 2, ["fresh", 1], ["citrus", 1]),
  "ginger-beer": f(0, 9, 0.5, ["spiced", 3]),
  "ginger-ale": f(0, 9, 0, ["spiced", 1]),
  lemonade: f(0, 10, 0, ["citrus", 2]),
  "hot-water": f(0, 0, 0),
  // Tea or coffee
  "iced-tea": f(0, 1, 1.5, ["tea", 3]),
  espresso: f(0, 0, 4, ["coffee", 3]),
  // Herb or garnish (they have no volume: only their notes count)
  mint: f(0, 0, 0, ["fresh", 3], ["herbal", 1]),
  "lime-wheel": f(0, 0, 0, ["citrus", 1]),
  "lime-wedge": f(0, 0, 0, ["citrus", 1]),
  "orange-peel": f(0, 0, 0, ["citrus", 2]),
  "orange-slice": f(0, 0, 0, ["citrus", 1], ["fruity", 1]),
  "lemon-twist": f(0, 0, 0, ["citrus", 2]),
  "lemon-wheel": f(0, 0, 0, ["citrus", 1]),
  cherry: f(0, 0, 0, ["fruity", 1]),
  "cinnamon-stick": f(0, 0, 0, ["spiced", 2]),
  "coffee-beans": f(0, 0, 0, ["coffee", 1]),
  "salt-rim": f(0, 0, 0, ["salty", 3]),
};
