/**
 * Build-my-own (v2 flow): the questions the guide asks, and the ingredients it offers for each role.
 *
 * The guide asks about one role at a time, in the order a drink is thought through (a backbone first,
 * the garnish last). The mood picked first only changes which ingredients are suggested (shown first,
 * marked "Suggested") and which bases are offered; every ingredient for a role is always reachable.
 *
 * OPEN: all of this is first-pass curation for JP to review: the moods, the questions' wording, the
 * suggestions and the starting amounts. The mood list is also where "feeling and vibe" (brief §7)
 * would grow up.
 */
import type { Amount, RecipeLine } from "./drinks";
import type { IngredientId } from "./ingredients";
import type { Role } from "./roles";

export type Mood = {
  id: string;
  label: string;
  /** A short line under the label. */
  hint: string;
  /** True for a drink with no alcohol: only non-alcoholic bases are offered. */
  zeroProof?: boolean;
  /** Ingredients to suggest (shown first) for each role. */
  suggest: Partial<Record<Role, IngredientId[]>>;
};

export const MOODS: Mood[] = [
  {
    id: "bright",
    label: "Crisp & bright",
    hint: "sharp, clean, awake",
    suggest: { base: ["gin", "white-rum", "tequila"], sweet: ["simple-syrup"], sour: ["lime-juice", "lemon-juice"], aromatic: ["lime-wheel", "mint"] },
  },
  {
    id: "boozy",
    label: "Rich & boozy",
    hint: "slow, warm, serious",
    suggest: { base: ["bourbon", "rye"], modifier: ["sweet-vermouth"], sweet: ["simple-syrup"], bitter: ["angostura"], aromatic: ["orange-peel", "cherry"] },
  },
  {
    id: "bitter",
    label: "Bitter & bold",
    hint: "grown-up, complex",
    suggest: { base: ["gin", "rye"], modifier: ["sweet-vermouth"], bitter: ["campari", "aperol"], aromatic: ["orange-peel"] },
  },
  {
    id: "long",
    label: "Long & refreshing",
    hint: "tall, cold, easy to sip",
    suggest: { base: ["gin", "vodka", "white-rum"], sour: ["lime-juice", "lemon-juice"], lengthener: ["tonic-water", "soda-water", "ginger-beer"], aromatic: ["lime-wedge", "mint"] },
  },
  {
    id: "sweet",
    label: "Sweet & fruity",
    hint: "juicy, playful",
    suggest: { base: ["vodka", "white-rum", "tequila"], modifier: ["orange-liqueur", "cranberry-juice"], sweet: ["grenadine", "simple-syrup"], sour: ["lime-juice"], aromatic: ["cherry", "orange-slice"] },
  },
  {
    id: "cozy",
    label: "Warm & cozy",
    hint: "blanket weather",
    suggest: { base: ["whiskey", "bourbon"], sweet: ["honey"], sour: ["lemon-juice"], lengthener: ["hot-water"], aromatic: ["cinnamon-stick"] },
  },
  {
    id: "zero",
    label: "Non-alcoholic",
    hint: "all the flavor, none of the booze",
    zeroProof: true,
    suggest: { base: ["iced-tea", "ginger-ale", "lemonade"], sweet: ["grenadine", "honey"], sour: ["lemon-juice", "lime-juice"], lengthener: ["soda-water"], aromatic: ["lemon-wheel", "cherry"] },
  },
];

/** Every ingredient the guide can offer for a role (the first-pass rule: what plays that role in the classics). */
export const ROLE_OPTIONS: Record<Role, IngredientId[]> = {
  base: ["gin", "white-rum", "vodka", "tequila", "bourbon", "rye", "whiskey", "prosecco", "iced-tea", "ginger-ale"],
  modifier: ["orange-liqueur", "coffee-liqueur", "sweet-vermouth", "dry-vermouth", "cranberry-juice", "lemonade"],
  sweet: ["simple-syrup", "honey", "grenadine"],
  sour: ["lime-juice", "lemon-juice"],
  bitter: ["campari", "aperol", "angostura", "espresso"],
  lengthener: ["soda-water", "tonic-water", "ginger-beer", "ginger-ale", "hot-water", "prosecco"],
  aromatic: ["mint", "lime-wheel", "lime-wedge", "orange-peel", "orange-slice", "lemon-twist", "lemon-wheel", "cherry", "cinnamon-stick", "coffee-beans", "salt-rim"],
};

/** The bases with no alcohol. */
const ZERO_PROOF_BASES: IngredientId[] = ["iced-tea", "ginger-ale", "lemonade", "ginger-beer"];

/** The options for a role under a mood: suggested ones first. Returns each with whether it is marked as suggested. */
export function optionsFor(role: Role, mood: Mood | null): { id: IngredientId; suggested: boolean }[] {
  let ids: IngredientId[] = ROLE_OPTIONS[role];
  if (role === "base" && mood?.zeroProof) ids = ZERO_PROOF_BASES;
  else if (role === "base") ids = ids.filter((id) => !ZERO_PROOF_BASES.includes(id));
  const suggested = new Set(mood?.suggest[role] ?? []);
  const first = ids.filter((id) => suggested.has(id));
  const rest = ids.filter((id) => !suggested.has(id));
  // With only two choices and both suggested, suggesting says nothing, so neither is marked (JP, 2026-11-26).
  const neither = ids.length === 2 && first.length === 2;
  return [...first, ...rest].map((id) => ({ id, suggested: !neither && suggested.has(id) }));
}

/** A new recipe line for an ingredient playing a role, at a first-pass starting amount. */
export function newLine(role: Role, ingredient: IngredientId): RecipeLine {
  let amount: Amount;
  if (role === "aromatic") amount = { kind: "garnish" };
  else if (ingredient === "angostura") amount = { kind: "dash", count: 2 };
  else if (role === "base") amount = { kind: "parts", parts: 2 };
  else if (role === "lengthener") amount = { kind: "parts", parts: ingredient === "hot-water" ? 4 : 2 };
  else if (role === "modifier") amount = { kind: "parts", parts: 1 };
  else if (role === "bitter") amount = { kind: "parts", parts: ingredient === "espresso" ? 1 : 0.75 };
  else if (role === "sour") amount = { kind: "parts", parts: 0.75 };
  else amount = { kind: "parts", parts: 0.5 };
  return { ingredient, role, amount };
}

/** What the guide asks about each role, in the order it asks. */
export const GUIDE_STEPS: { role: Role; ask: string; skippable: boolean }[] = [
  { role: "base", ask: "What kind of alcohol do you like?", skippable: false },
  { role: "modifier", ask: "Want something to round it out?", skippable: true },
  { role: "sweet", ask: "How about some sweetness?", skippable: true },
  { role: "sour", ask: "Any sharpness, to wake it up?", skippable: true },
  { role: "bitter", ask: "A little bitterness for depth?", skippable: true },
  { role: "lengthener", ask: "Should it be long? Something to top it up with.", skippable: true },
  { role: "aromatic", ask: "Lastly, how should we finish it?", skippable: true },
];

/** The base question for a mood with no alcohol, where asking about alcohol would make no sense. */
export const ZERO_PROOF_BASE_ASK = "What should the base of the drink be?";

/** What each role does in a drink, in a few plain words (shown in the roles panel). */
export const ROLE_BLURB: Record<Role, string> = {
  base: "The backbone",
  modifier: "Rounds it out",
  sweet: "Softens and sweetens",
  sour: "Brightens",
  bitter: "Adds depth",
  lengthener: "Makes it long",
  aromatic: "The finish: what you smell first",
};
