"use client";

import { useSyncExternalStore } from "react";

/**
 * Wide-screen layout numbers that JP tunes by eye with the spacing panel (dev only, see
 * components/dev/SpacingPanel.tsx). Each value is the gap as you see it on screen, in px, except
 * cardScale (a share of the most room the card could take), maxHeight (the page's height cap) and the
 * three text sizes.
 * These defaults are what the app uses; on the live site nothing can change them.
 */
export const TUNING_DEFAULTS = {
  /** Window top to the top of the browse-filter text. */
  filtersTop: 30,
  /** Filter text to the squiggly line under it. */
  filtersToLine: 22,
  /** Squiggly line to the top of the drink name. */
  lineToName: 30,
  /** Label under the name to the top of the edit panel. */
  labelToPanel: 30,
  /** Drink card to the serving buttons under it. */
  cardToServings: 24,
  /** Drink card to each ‹ › button. */
  cardToArrows: 16,
  /** How far past the card the side drinks fade out. */
  sideFade: 240,
  /** Drink card size, as a share of the most room it could take. */
  cardScale: 0.8,
  /** The page's height cap. */
  maxHeight: 1000,
  /** Text sizes in the serving row: the total ("3 oz"), the line under it, and "Servings" under the buttons. */
  totalSize: 22,
  subSize: 14,
  servingsSize: 14,
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
