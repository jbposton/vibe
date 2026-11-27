/**
 * Drinks you saved ("Save as a new drink"), kept in this browser's localStorage so they are still
 * there next visit. They show up under the "My Drinks" browse filter.
 *
 * OPEN: nowhere else yet (no account, no sharing). A saved drink can be renamed (by its title) and
 * removed (Browse mode, wide screens).
 */
import type { Drink } from "@/data/drinks";
import type { RecipeLine } from "@/data/drinks";
import { INGREDIENTS } from "@/data/ingredients";
import type { Mood } from "@/data/builder";

import { useSyncExternalStore } from "react";

const KEY = "vibe-my-drinks";

export function loadSaved(): Drink[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Drink[]) : [];
    // Ignore anything that is not a drink we can still draw (an ingredient may have been renamed).
    return list.filter((d) => d && Array.isArray(d.lines) && d.lines.every((l) => l.ingredient in INGREDIENTS));
  } catch {
    return [];
  }
}

let cache: Drink[] | null = null;
const listeners = new Set<() => void>();
const NONE: Drink[] = [];

/** Add a drink to the saved list (and to this browser's storage). */
export function addSaved(drink: Drink) {
  cache = [...(cache ?? loadSaved()), drink];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage is full or switched off: the drinks stay for this visit only.
  }
  listeners.forEach((l) => l());
}

/** Give a saved drink a new name (here and in this browser's storage). */
export function renameSaved(id: string, name: string) {
  cache = (cache ?? loadSaved()).map((d) => (d.id === id ? { ...d, name } : d));
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage is switched off: the new name lasts for this visit only.
  }
  listeners.forEach((l) => l());
}

/** Take a drink off the saved list (and out of this browser's storage). */
export function removeSaved(id: string) {
  cache = (cache ?? loadSaved()).filter((d) => d.id !== id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage is switched off: it is gone for this visit only.
  }
  listeners.forEach((l) => l());
}

/** The saved drinks, read from this browser's storage (empty on the server). */
export function useSavedDrinks(): Drink[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => (cache ??= loadSaved()),
    () => NONE,
  );
}

const ADJECTIVES: Record<string, string[]> = {
  bright: ["Bright", "Crisp", "Sunny", "Clear"],
  boozy: ["Slow", "Velvet", "Amber", "Deep"],
  bitter: ["Bold", "Dark", "Sharp", "Late"],
  long: ["Tall", "Cool", "Easy", "Drift"],
  sweet: ["Sweet", "Juicy", "Rosy", "Plush"],
  cozy: ["Cozy", "Ember", "Soft", "Wool"],
  zero: ["Clear", "Gentle", "Bright", "Calm"],
};
const NOUNS = ["Hour", "Spell", "Bloom", "Tide", "Dusk", "Hush", "Glow", "Drift", "Echo"];

/** A made-up starting name for a drink the guide just finished (JP can change it). Same drink, same name. */
export function madeUpName(mood: Mood | null, lines: RecipeLine[]): string {
  const key = lines.map((l) => l.ingredient).join("|");
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const adjectives = ADJECTIVES[mood?.id ?? "bright"] ?? ADJECTIVES.bright;
  return `${adjectives[hash % adjectives.length]} ${NOUNS[Math.floor(hash / 7) % NOUNS.length]}`;
}

/** A first-pass guess at how a made-up drink is prepared and served, from what is in it. */
export function servingFor(lines: RecipeLine[]): { method: Drink["method"]; glass: Drink["glass"] } {
  const has = (role: RecipeLine["role"]) => lines.some((l) => l.role === role);
  if (has("lengthener")) return { method: has("sour") ? "shaken" : "built", glass: "highball-ice" };
  if (has("sour")) return { method: "shaken", glass: "coupe" };
  return { method: "stirred", glass: "rocks-ice" };
}
