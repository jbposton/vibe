/**
 * Swapping an ingredient from the drawer (JP, 2026-11-17): tap a chip and the drink's ingredient
 * from the SAME category is replaced by it, keeping its role and amount (tap Vodka and the Gin
 * becomes Vodka). If the drink has nothing from that category yet, the ingredient is added as a
 * new layer with a first-pass role and amount for its category.
 *
 * OPEN: first-pass rules. With two lines in one category (a Cosmopolitan's two juices) the one
 * with the most liquid is the one replaced. The roles and amounts below are guesses.
 */
import type { Amount, RecipeLine } from "@/data/drinks";
import { INGREDIENTS, type Category, type IngredientId } from "@/data/ingredients";
import type { Role } from "@/data/roles";
import { volumeParts } from "./stack";

const NEW_LINE: Record<Category, { role: Role; amount: Amount }> = {
  Spirit: { role: "base", amount: { kind: "parts", parts: 1 } },
  Liqueur: { role: "modifier", amount: { kind: "parts", parts: 0.5 } },
  "Aperitif or fortified wine": { role: "modifier", amount: { kind: "parts", parts: 0.5 } },
  Sparkling: { role: "lengthener", amount: { kind: "parts", parts: 1 } },
  Juice: { role: "sour", amount: { kind: "parts", parts: 0.5 } },
  Syrup: { role: "sweet", amount: { kind: "parts", parts: 0.5 } },
  Bitters: { role: "bitter", amount: { kind: "dash", count: 2 } },
  Mixer: { role: "lengthener", amount: { kind: "parts", parts: 1 } },
  "Tea or coffee": { role: "modifier", amount: { kind: "parts", parts: 1 } },
  "Herb or garnish": { role: "aromatic", amount: { kind: "garnish" } },
};

/** The recipe after tapping `ingredient` in the drawer. Tapping one that is already in the drink changes nothing. */
export function swapIngredient(lines: RecipeLine[], ingredient: IngredientId): RecipeLine[] {
  if (lines.some((l) => l.ingredient === ingredient)) return lines;
  const category = INGREDIENTS[ingredient].category;
  let pick = -1;
  let most = -1;
  lines.forEach((l, i) => {
    if (INGREDIENTS[l.ingredient].category !== category) return;
    const v = volumeParts(l.amount);
    if (pick < 0 || v > most) {
      pick = i;
      most = v;
    }
  });
  if (pick >= 0) return lines.map((l, i) => (i === pick ? { ...l, ingredient } : l));
  return [...lines, { ingredient, ...NEW_LINE[category] }];
}
