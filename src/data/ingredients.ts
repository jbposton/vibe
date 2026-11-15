/**
 * Ingredients and their colors (brief §3, from the Figma `Ingredients` variables).
 * Colors are hand-tuned design tokens, one per ingredient — not a ramp.
 * Several colors repeat on purpose, so color alone never identifies an
 * ingredient: always pair it with a label.
 */

export const CATEGORIES = [
  "Spirit",
  "Liqueur",
  "Aperitif or fortified wine",
  "Sparkling",
  "Juice",
  "Syrup",
  "Bitters",
  "Mixer",
  "Tea or coffee",
  "Herb or garnish",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Ingredient = {
  id: string;
  name: string;
  category: Category;
  color: string;
};

const list = [
  // Spirit
  ["gin", "Gin", "Spirit", "#E8F5FA"],
  ["white-rum", "White rum", "Spirit", "#EDEEF0"],
  ["vodka", "Vodka", "Spirit", "#E7ECEA"],
  ["tequila", "Tequila", "Spirit", "#9AEEAF"],
  ["bourbon", "Bourbon", "Spirit", "#A85A14"],
  ["rye", "Rye", "Spirit", "#F7B538"],
  ["whiskey", "Whiskey", "Spirit", "#3B1607"],
  // Liqueur
  ["orange-liqueur", "Orange liqueur", "Liqueur", "#FFC6AC"],
  ["coffee-liqueur", "Coffee liqueur", "Liqueur", "#FFCEAA"],
  // Aperitif or fortified wine
  ["campari", "Campari", "Aperitif or fortified wine", "#F4577A"],
  ["aperol", "Aperol", "Aperitif or fortified wine", "#E53B0C"],
  ["sweet-vermouth", "Sweet vermouth", "Aperitif or fortified wine", "#5C1224"],
  ["dry-vermouth", "Dry vermouth", "Aperitif or fortified wine", "#EAF268"],
  // Sparkling
  ["prosecco", "Prosecco", "Sparkling", "#F2F7CD"],
  // Juice
  ["lime-juice", "Lime juice", "Juice", "#DDE633"],
  ["lemon-juice", "Lemon juice", "Juice", "#EFE822"],
  ["cranberry-juice", "Cranberry juice", "Juice", "#E63378"],
  // Syrup
  ["simple-syrup", "Simple syrup", "Syrup", "#F7F7EF"],
  ["honey", "Honey", "Syrup", "#FFB508"],
  ["grenadine", "Grenadine", "Syrup", "#A3142F"],
  // Bitters
  ["angostura", "Angostura bitters", "Bitters", "#E45F00"],
  // Mixer
  ["soda-water", "Soda water", "Mixer", "#F4F5FE"],
  ["tonic-water", "Tonic water", "Mixer", "#001B34"],
  ["ginger-beer", "Ginger beer", "Mixer", "#F5E4B9"],
  ["ginger-ale", "Ginger ale", "Mixer", "#F2F7CD"],
  ["lemonade", "Lemonade", "Mixer", "#EAF268"],
  ["hot-water", "Hot water", "Mixer", "#562025"],
  // Tea or coffee
  ["iced-tea", "Iced tea", "Tea or coffee", "#F7B538"],
  ["espresso", "Espresso", "Tea or coffee", "#34140C"],
  // Herb or garnish
  ["mint", "Mint", "Herb or garnish", "#10D68E"],
  ["lime-wheel", "Lime wheel", "Herb or garnish", "#94FF8E"],
  ["lime-wedge", "Lime wedge", "Herb or garnish", "#94FF8E"],
  ["orange-peel", "Orange peel", "Herb or garnish", "#FF6303"],
  ["orange-slice", "Orange slice", "Herb or garnish", "#FF8349"],
  ["lemon-twist", "Lemon twist", "Herb or garnish", "#A9B52A"],
  ["lemon-wheel", "Lemon wheel", "Herb or garnish", "#FBEC11"],
  ["cherry", "Cherry", "Herb or garnish", "#E32A3C"],
  ["cinnamon-stick", "Cinnamon stick", "Herb or garnish", "#A1051B"],
  ["coffee-beans", "Coffee beans", "Herb or garnish", "#4D1B07"],
  ["salt-rim", "Salt rim", "Herb or garnish", "#F5F5F5"],
] as const satisfies readonly (readonly [string, string, Category, string])[];

export type IngredientId = (typeof list)[number][0];

export const INGREDIENTS: Record<IngredientId, Ingredient> = Object.fromEntries(
  list.map(([id, name, category, color]) => [id, { id, name, category, color }]),
) as Record<IngredientId, Ingredient>;
