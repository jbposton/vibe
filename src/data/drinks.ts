/**
 * The 18 test drinks (brief §5). Amounts are in parts (1 part = 1 oz, see PART_OZ in stack.ts). Lines are listed base
 * first, in recipe order; the stack order comes from each line's role.
 */
import type { GlassId } from "@/components/PrepIcons";
import type { IngredientId } from "./ingredients";
import type { Role } from "./roles";

export const FAMILIES = [
  "Sour",
  "Long sour",
  "Spirit-forward",
  "Highball",
  "Spritz",
  "Hot",
  "Non-alcoholic",
  "Unplaced",
] as const;

export type Family = (typeof FAMILIES)[number];

export type Amount =
  | { kind: "parts"; parts: number }
  | { kind: "dash"; count: number }
  | { kind: "garnish" };

export type RecipeLine = {
  ingredient: IngredientId;
  role: Role;
  amount: Amount;
};

export type Method = "shaken" | "stirred" | "built";

export type Drink = {
  id: string;
  name: string;
  family: Family;
  method: Method;
  /** OPEN: what the drink is served in (my first-pass mapping, for JP to review). Drawn with the prep icons. */
  glass: GlassId;
  /** OPEN: "feeling and vibe" tags (brief §7). Placeholder: a few plain words per drink. */
  tags: string[];
  lines: RecipeLine[];
};

const parts = (n: number): Amount => ({ kind: "parts", parts: n });
const dashes = (count: number): Amount => ({ kind: "dash", count });
const garnish: Amount = { kind: "garnish" };

const line = (ingredient: IngredientId, role: Role, amount: Amount): RecipeLine => ({
  ingredient,
  role,
  amount,
});

export const DRINKS: Drink[] = [
  {
    id: "gimlet",
    name: "Gimlet",
    family: "Sour",
    method: "shaken",
    glass: "coupe",
    tags: ["crisp", "sharp"],
    lines: [
      line("gin", "base", parts(2)),
      line("lime-juice", "sour", parts(0.75)),
      line("simple-syrup", "sweet", parts(0.75)),
      line("lime-wheel", "aromatic", garnish),
    ],
  },
  {
    id: "daiquiri",
    name: "Daiquiri",
    family: "Sour",
    method: "shaken",
    glass: "coupe",
    tags: ["bright", "easy"],
    lines: [
      line("white-rum", "base", parts(2)),
      line("lime-juice", "sour", parts(1)),
      line("simple-syrup", "sweet", parts(0.75)),
    ],
  },
  {
    id: "whiskey-sour",
    name: "Whiskey sour",
    family: "Sour",
    method: "shaken",
    glass: "rocks-ice",
    tags: ["cozy", "tart"],
    lines: [
      line("bourbon", "base", parts(2)),
      line("lemon-juice", "sour", parts(0.75)),
      line("simple-syrup", "sweet", parts(0.75)),
      line("cherry", "aromatic", garnish),
    ],
  },
  {
    id: "margarita",
    name: "Margarita",
    family: "Sour",
    method: "shaken",
    glass: "rocks-ice",
    tags: ["lively", "salty"],
    lines: [
      line("tequila", "base", parts(2)),
      line("orange-liqueur", "modifier", parts(0.75)),
      line("lime-juice", "sour", parts(1)),
      line("salt-rim", "aromatic", garnish),
    ],
  },
  {
    id: "cosmopolitan",
    name: "Cosmopolitan",
    family: "Sour",
    method: "shaken",
    glass: "martini",
    tags: ["playful", "tart"],
    lines: [
      line("vodka", "base", parts(1.5)),
      line("orange-liqueur", "modifier", parts(1)),
      // OPEN: Cranberry juice as modifier is a guess to confirm with JP.
      line("cranberry-juice", "modifier", parts(1)),
      line("lime-juice", "sour", parts(0.5)),
    ],
  },
  {
    id: "tom-collins",
    name: "Tom Collins",
    family: "Long sour",
    method: "shaken",
    glass: "highball-ice",
    tags: ["refreshing", "light"],
    lines: [
      line("gin", "base", parts(2)),
      line("simple-syrup", "sweet", parts(0.5)),
      line("lemon-juice", "sour", parts(1)),
      line("soda-water", "lengthener", parts(2)),
    ],
  },
  {
    id: "mojito",
    name: "Mojito",
    family: "Long sour",
    method: "built",
    glass: "highball-ice",
    tags: ["refreshing", "minty"],
    lines: [
      line("white-rum", "base", parts(2)),
      line("simple-syrup", "sweet", parts(0.75)),
      line("lime-juice", "sour", parts(1)),
      // OPEN: 2 parts soda water is assumed.
      line("soda-water", "lengthener", parts(2)),
      line("mint", "aromatic", garnish),
    ],
  },
  {
    id: "old-fashioned",
    name: "Old fashioned",
    family: "Spirit-forward",
    method: "stirred",
    glass: "rocks-ice",
    tags: ["slow", "warming"],
    lines: [
      line("bourbon", "base", parts(2)),
      line("simple-syrup", "sweet", parts(0.25)),
      line("angostura", "bitter", dashes(2)),
      line("orange-peel", "aromatic", garnish),
    ],
  },
  {
    id: "manhattan",
    name: "Manhattan",
    family: "Spirit-forward",
    method: "stirred",
    glass: "coupe",
    tags: ["rich", "serious"],
    lines: [
      line("rye", "base", parts(2)),
      line("sweet-vermouth", "modifier", parts(1)),
      line("angostura", "bitter", dashes(2)),
      line("cherry", "aromatic", garnish),
    ],
  },
  {
    id: "negroni",
    name: "Negroni",
    family: "Spirit-forward",
    method: "stirred",
    glass: "rocks-ice",
    tags: ["bittersweet", "bold"],
    lines: [
      line("gin", "base", parts(1)),
      line("sweet-vermouth", "modifier", parts(1)),
      line("campari", "bitter", parts(1)),
      line("orange-peel", "aromatic", garnish),
    ],
  },
  {
    id: "martini",
    name: "Martini",
    family: "Spirit-forward",
    method: "stirred",
    glass: "martini",
    tags: ["sharp", "elegant"],
    lines: [
      line("gin", "base", parts(2.5)),
      line("dry-vermouth", "modifier", parts(0.5)),
      line("lemon-twist", "aromatic", garnish),
    ],
  },
  {
    id: "gin-and-tonic",
    name: "Gin and tonic",
    family: "Highball",
    method: "built",
    glass: "highball-ice",
    tags: ["crisp", "easy"],
    lines: [
      line("gin", "base", parts(2)),
      line("tonic-water", "lengthener", parts(4)),
      line("lime-wedge", "aromatic", garnish),
    ],
  },
  {
    id: "moscow-mule",
    name: "Moscow mule",
    family: "Highball",
    method: "built",
    glass: "mug-ice",
    tags: ["zesty", "spicy"],
    lines: [
      line("vodka", "base", parts(2)),
      line("lime-juice", "sour", parts(0.5)),
      line("ginger-beer", "lengthener", parts(4)),
      line("lime-wedge", "aromatic", garnish),
    ],
  },
  {
    id: "aperol-spritz",
    name: "Aperol spritz",
    family: "Spritz",
    method: "built",
    glass: "wine-ice",
    tags: ["sunny", "light"],
    lines: [
      // OPEN: Prosecco as base and Aperol as bitter are guesses to confirm with JP.
      line("prosecco", "base", parts(3)),
      line("aperol", "bitter", parts(2)),
      line("soda-water", "lengthener", parts(1)),
      line("orange-slice", "aromatic", garnish),
    ],
  },
  {
    id: "hot-toddy",
    name: "Hot toddy",
    family: "Hot",
    method: "built",
    glass: "mug-hot",
    tags: ["warming", "comforting"],
    lines: [
      line("whiskey", "base", parts(2)),
      line("honey", "sweet", parts(0.5)),
      line("lemon-juice", "sour", parts(0.5)),
      line("hot-water", "lengthener", parts(4)),
      line("cinnamon-stick", "aromatic", garnish),
    ],
  },
  {
    id: "arnold-palmer",
    name: "Arnold Palmer",
    family: "Non-alcoholic",
    method: "built",
    glass: "highball-ice",
    tags: ["gentle", "sunny"],
    lines: [
      line("iced-tea", "base", parts(4)),
      // OPEN: Lemonade as modifier is a guess to confirm with JP.
      line("lemonade", "modifier", parts(4)),
      line("lemon-wheel", "aromatic", garnish),
    ],
  },
  {
    id: "shirley-temple",
    name: "Shirley Temple",
    family: "Non-alcoholic",
    method: "built",
    glass: "highball-ice",
    tags: ["sweet", "nostalgic"],
    lines: [
      // OPEN: Ginger ale as base is a guess to confirm with JP.
      line("ginger-ale", "base", parts(6)),
      line("grenadine", "sweet", parts(0.5)),
      line("cherry", "aromatic", garnish),
    ],
  },
  {
    id: "espresso-martini",
    name: "Espresso martini",
    // OPEN: which family the Espresso martini belongs to is undecided.
    family: "Unplaced",
    method: "shaken",
    glass: "martini",
    tags: ["rich", "awake"],
    lines: [
      line("vodka", "base", parts(2)),
      line("coffee-liqueur", "modifier", parts(1)),
      // OPEN: Espresso as bitter is a guess to confirm with JP.
      line("espresso", "bitter", parts(1)),
      line("coffee-beans", "aromatic", garnish),
    ],
  },
];
