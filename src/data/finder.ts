/**
 * Finder filters (brief §1, §7): quick filters that group drinks by taste or
 * by occasion. Picking one swaps the drink carousel to that curated list.
 *
 * OPEN: "feeling and vibe" is undecided (brief §7). The labels and every list
 * below are JP's categories filled in with a first-pass curation, to review.
 * Lists are in curated order (the most typical drink first).
 */
import { DRINKS } from "./drinks";

export type FilterGroup = "start" | "flavor" | "occasion";

export type Filter = {
  id: string;
  label: string;
  group: FilterGroup;
  /** Drink ids in order; null means every drink, in the app's usual order. */
  drinks: string[] | null;
  /** True for a chip that is on screen but doesn't do anything yet. */
  placeholder?: boolean;
};

export const CLASSICS_ID = "classics";

export const FILTERS: Filter[] = [
  // Top row, start: the full list, and the build-your-own flow (placeholder).
  { id: CLASSICS_ID, label: "Classics", group: "start", drinks: null },
  // OPEN: build-your-glass (feeling and vibe picker) isn't designed yet.
  { id: "build-my-own", label: "Build my own", group: "start", drinks: [], placeholder: true },

  // a) Flavor and taste
  { id: "bright", label: "Bright", group: "flavor", drinks: ["daiquiri", "gimlet", "margarita", "tom-collins", "moscow-mule", "cosmopolitan"] },
  { id: "fresh-herbal", label: "Fresh & Herbal", group: "flavor", drinks: ["mojito", "gin-and-tonic", "tom-collins", "gimlet", "martini"] },
  { id: "fruity", label: "Fruity", group: "flavor", drinks: ["cosmopolitan", "aperol-spritz", "shirley-temple", "arnold-palmer", "daiquiri"] },
  { id: "bitter", label: "Bitter", group: "flavor", drinks: ["negroni", "aperol-spritz", "old-fashioned", "manhattan", "gin-and-tonic", "espresso-martini"] },
  { id: "boozy", label: "Boozy", group: "flavor", drinks: ["old-fashioned", "martini", "manhattan", "negroni", "margarita", "whiskey-sour"] },
  { id: "warm", label: "Warm", group: "flavor", drinks: ["hot-toddy", "old-fashioned", "manhattan", "whiskey-sour"] },
  { id: "rich-roasted", label: "Rich & Roasted", group: "flavor", drinks: ["espresso-martini", "old-fashioned", "manhattan", "hot-toddy", "whiskey-sour"] },

  // b) Occasion and vibe
  { id: "happy-hour", label: "Happy Hour", group: "occasion", drinks: ["margarita", "daiquiri", "mojito", "cosmopolitan", "moscow-mule", "gimlet"] },
  { id: "daytime", label: "Daytime", group: "occasion", drinks: ["aperol-spritz", "arnold-palmer", "mojito", "tom-collins", "gin-and-tonic", "shirley-temple"] },
  { id: "night-out", label: "Night Out", group: "occasion", drinks: ["cosmopolitan", "espresso-martini", "margarita", "negroni", "martini"] },
  { id: "nightcap", label: "Nightcap", group: "occasion", drinks: ["old-fashioned", "manhattan", "hot-toddy", "martini"] },
  { id: "cozy", label: "Cozy", group: "occasion", drinks: ["hot-toddy", "old-fashioned", "whiskey-sour", "manhattan"] },
  // OPEN: only two non-alcoholic drinks exist so far (brief §1 plans more).
  { id: "zero-proof", label: "Zero-proof", group: "occasion", drinks: ["arnold-palmer", "shirley-temple"] },
  { id: "after-dinner", label: "After Dinner", group: "occasion", drinks: ["espresso-martini", "negroni", "manhattan", "old-fashioned"] },
];

/** The drinks in a filter, as positions in DRINKS, in curated order. */
export function filterList(id: string): number[] {
  const filter = FILTERS.find((f) => f.id === id);
  if (!filter || filter.drinks === null) return DRINKS.map((_, i) => i);
  return filter.drinks.flatMap((drinkId) => {
    const i = DRINKS.findIndex((d) => d.id === drinkId);
    return i >= 0 ? [i] : [];
  });
}
