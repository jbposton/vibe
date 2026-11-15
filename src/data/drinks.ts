/**
 * The 18 test drinks (brief §5). Amounts are in oz. Lines are listed base
 * first, in recipe order; the stack order comes from each line's role.
 */
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
  | { kind: "oz"; oz: number }
  | { kind: "dash"; count: number }
  | { kind: "garnish" };

export type RecipeLine = {
  ingredient: IngredientId;
  role: Role;
  amount: Amount;
};

export type Drink = {
  id: string;
  name: string;
  family: Family;
  lines: RecipeLine[];
};

const oz = (n: number): Amount => ({ kind: "oz", oz: n });
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
    lines: [
      line("gin", "base", oz(2)),
      line("lime-juice", "sour", oz(0.75)),
      line("simple-syrup", "sweet", oz(0.75)),
      line("lime-wheel", "aromatic", garnish),
    ],
  },
  {
    id: "daiquiri",
    name: "Daiquiri",
    family: "Sour",
    lines: [
      line("white-rum", "base", oz(2)),
      line("lime-juice", "sour", oz(1)),
      line("simple-syrup", "sweet", oz(0.75)),
    ],
  },
  {
    id: "whiskey-sour",
    name: "Whiskey sour",
    family: "Sour",
    lines: [
      line("bourbon", "base", oz(2)),
      line("lemon-juice", "sour", oz(0.75)),
      line("simple-syrup", "sweet", oz(0.75)),
      line("cherry", "aromatic", garnish),
    ],
  },
  {
    id: "margarita",
    name: "Margarita",
    family: "Sour",
    lines: [
      line("tequila", "base", oz(2)),
      line("orange-liqueur", "modifier", oz(0.75)),
      line("lime-juice", "sour", oz(1)),
      line("salt-rim", "aromatic", garnish),
    ],
  },
  {
    id: "cosmopolitan",
    name: "Cosmopolitan",
    family: "Sour",
    lines: [
      line("vodka", "base", oz(1.5)),
      line("orange-liqueur", "modifier", oz(1)),
      // OPEN: Cranberry juice as modifier is a guess to confirm with JP.
      line("cranberry-juice", "modifier", oz(1)),
      line("lime-juice", "sour", oz(0.5)),
    ],
  },
  {
    id: "tom-collins",
    name: "Tom Collins",
    family: "Long sour",
    lines: [
      line("gin", "base", oz(2)),
      line("simple-syrup", "sweet", oz(0.5)),
      line("lemon-juice", "sour", oz(1)),
      line("soda-water", "lengthener", oz(2)),
    ],
  },
  {
    id: "mojito",
    name: "Mojito",
    family: "Long sour",
    lines: [
      line("white-rum", "base", oz(2)),
      line("simple-syrup", "sweet", oz(0.75)),
      line("lime-juice", "sour", oz(1)),
      // OPEN: 2 oz soda water is assumed.
      line("soda-water", "lengthener", oz(2)),
      line("mint", "aromatic", garnish),
    ],
  },
  {
    id: "old-fashioned",
    name: "Old fashioned",
    family: "Spirit-forward",
    lines: [
      line("bourbon", "base", oz(2)),
      line("simple-syrup", "sweet", oz(0.25)),
      line("angostura", "bitter", dashes(2)),
      line("orange-peel", "aromatic", garnish),
    ],
  },
  {
    id: "manhattan",
    name: "Manhattan",
    family: "Spirit-forward",
    lines: [
      line("rye", "base", oz(2)),
      line("sweet-vermouth", "modifier", oz(1)),
      line("angostura", "bitter", dashes(2)),
      line("cherry", "aromatic", garnish),
    ],
  },
  {
    id: "negroni",
    name: "Negroni",
    family: "Spirit-forward",
    lines: [
      line("gin", "base", oz(1)),
      line("sweet-vermouth", "modifier", oz(1)),
      line("campari", "bitter", oz(1)),
      line("orange-peel", "aromatic", garnish),
    ],
  },
  {
    id: "martini",
    name: "Martini",
    family: "Spirit-forward",
    lines: [
      line("gin", "base", oz(2.5)),
      line("dry-vermouth", "modifier", oz(0.5)),
      line("lemon-twist", "aromatic", garnish),
    ],
  },
  {
    id: "gin-and-tonic",
    name: "Gin and tonic",
    family: "Highball",
    lines: [
      line("gin", "base", oz(2)),
      line("tonic-water", "lengthener", oz(4)),
      line("lime-wedge", "aromatic", garnish),
    ],
  },
  {
    id: "moscow-mule",
    name: "Moscow mule",
    family: "Highball",
    lines: [
      line("vodka", "base", oz(2)),
      line("lime-juice", "sour", oz(0.5)),
      line("ginger-beer", "lengthener", oz(4)),
      line("lime-wedge", "aromatic", garnish),
    ],
  },
  {
    id: "aperol-spritz",
    name: "Aperol spritz",
    family: "Spritz",
    lines: [
      // OPEN: Prosecco as base and Aperol as bitter are guesses to confirm with JP.
      line("prosecco", "base", oz(3)),
      line("aperol", "bitter", oz(2)),
      line("soda-water", "lengthener", oz(1)),
      line("orange-slice", "aromatic", garnish),
    ],
  },
  {
    id: "hot-toddy",
    name: "Hot toddy",
    family: "Hot",
    lines: [
      line("whiskey", "base", oz(2)),
      line("honey", "sweet", oz(0.5)),
      line("lemon-juice", "sour", oz(0.5)),
      line("hot-water", "lengthener", oz(4)),
      line("cinnamon-stick", "aromatic", garnish),
    ],
  },
  {
    id: "arnold-palmer",
    name: "Arnold Palmer",
    family: "Non-alcoholic",
    lines: [
      line("iced-tea", "base", oz(4)),
      // OPEN: Lemonade as modifier is a guess to confirm with JP.
      line("lemonade", "modifier", oz(4)),
      line("lemon-wheel", "aromatic", garnish),
    ],
  },
  {
    id: "shirley-temple",
    name: "Shirley Temple",
    family: "Non-alcoholic",
    lines: [
      // OPEN: Ginger ale as base is a guess to confirm with JP.
      line("ginger-ale", "base", oz(6)),
      line("grenadine", "sweet", oz(0.5)),
      line("cherry", "aromatic", garnish),
    ],
  },
  {
    id: "espresso-martini",
    name: "Espresso martini",
    // OPEN: which family the Espresso martini belongs to is undecided.
    family: "Unplaced",
    lines: [
      line("vodka", "base", oz(2)),
      line("coffee-liqueur", "modifier", oz(1)),
      // OPEN: Espresso as bitter is a guess to confirm with JP.
      line("espresso", "bitter", oz(1)),
      line("coffee-beans", "aromatic", garnish),
    ],
  },
];
