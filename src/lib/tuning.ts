"use client";

import { useSyncExternalStore } from "react";

/**
 * Wide-screen layout numbers and text sizes that JP tunes by eye with the design editor (dev only, see
 * components/dev/DesignEditor.tsx). Each value is the gap as you see it on screen, in px, except
 * cardScale (a share of the most room the card could take), maxHeight (the page's height cap) and the
 * three text sizes.
 * These defaults are what the app uses; on the live site nothing can change them.
 */
export const TUNING_DEFAULTS = {
  /** Window top to the top of the browse-filter text. */
  filtersTop: 24,
  /** Filter text to the squiggly line under it. */
  filtersToLine: 16,
  /** Squiggly line to the top of the drink name. */
  lineToName: 16,
  /** Label under the name to the top of the edit panel. */
  labelToPanel: 24,
  /** Drink card to the serving buttons under it. */
  cardToServings: 16,
  /** Drink card to each ‹ › button. */
  cardToArrows: 12,
  /** How far past the card the side drinks fade out. */
  sideFade: 165,
  /** Drink card size, as a share of the most room it could take. */
  cardScale: 0.89,
  /** The page's height cap. */
  maxHeight: 1000,
  /** Text sizes in the serving row: the total ("3 oz"), the line under it, and "Servings" under the buttons. */
  totalSize: 18,
  subSize: 12,
  servingsSize: 12,
  /** Text sizes everywhere else on wide screens. */
  nameSize: 50, // the drink name
  labelSize: 12, // "Balanced, Intense · 27% ABV"
  prepSize: 12, // "Stirred", "Rocks"
  prepIconSize: 36, // the Stirred / Rocks illustrations (square)
  filterSize: 10, // the browse filters
  layerNameSize: 10, // ingredient names on the drink card
  layerAmountSize: 14, // "1" on the drink card
  layerUnitSize: 12, // "oz" and "Garnish" on the drink card
  servingNumSize: 12, // 1, 2, 4 in the serving buttons
  pillSize: 10, // MORE SWEET, STRONGER...
  categorySize: 10, // SPIRIT, LIQUEUR...
  chipSize: 10, // ingredient names in the drawer
};

export type Tuning = typeof TUNING_DEFAULTS;

let current: Tuning = { ...TUNING_DEFAULTS };
const listeners = new Set<() => void>();

export function setTuning(next: Partial<Tuning>) {
  current = { ...current, ...next };
  listeners.forEach((l) => l());
}

export function resetTuning() {
  setTuning(TUNING_DEFAULTS);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const read = () => current;
const readServer = () => TUNING_DEFAULTS;

/** The layout numbers, live while the spacing panel is being dragged. */
export function useTuning(): Tuning {
  return useSyncExternalStore(subscribe, read, readServer);
}
