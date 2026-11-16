/**
 * "Make edits" (JP's design, 2026-11-16): the buttons depend on the drink.
 * Each drink gets up to three of its own flavor notes (citrus, botanical,
 * herbal...), and each note has a less / more pair. "More citrus" puts a
 * little more of the ingredient that gives the drink most of its citrus;
 * "less citrus" takes a little out of it.
 *
 * The notes and the ingredient behind each one are worked out from the
 * classic recipe, so the buttons stay put while you edit.
 *
 * OPEN: first-pass rules. The step is ¼ part (¼ oz at one serving; one dash for
 * bitters); a line never goes below ¼ part or above 12. Garnishes can't be
 * changed, so a note that only comes from a garnish gets no buttons.
 */
import type { RecipeLine } from "@/data/drinks";
import { FLAVORS, type Note } from "@/data/flavor";
import { MAX_DASHES, SHARE_FLOOR, volumeParts } from "./stack";

export const EDIT_STEP = 0.25;
const MAX_PARTS = 12;
/** Bitters dashes are tiny in volume but strong in flavor (same boost as the flavor notes). */
const DASH_NOTE_BOOST = 5;
const MAX_NOTES = 3;

export type NoteEdit = {
  note: Note;
  /** Position, in the drink's lines, of the ingredient this note's buttons change. */
  key: number;
};

/** The drink's top flavor notes, each with the ingredient that carries it most. */
export function noteEdits(original: RecipeLine[]): NoteEdit[] {
  const total = original.reduce((s, l) => s + volumeParts(l.amount), 0);
  if (total <= 0) return [];
  const score = new Map<Note, { sum: number; best: number; key: number }>();
  original.forEach((l, key) => {
    if (l.amount.kind === "garnish") return; // garnishes can't be changed
    const share = volumeParts(l.amount) / total;
    const weight = l.amount.kind === "dash" ? share * DASH_NOTE_BOOST : share;
    for (const [note, intensity] of FLAVORS[l.ingredient].notes) {
      const part = weight * intensity;
      const s = score.get(note) ?? { sum: 0, best: 0, key };
      s.sum += part;
      if (part > s.best) {
        s.best = part;
        s.key = key;
      }
      score.set(note, s);
    }
  });
  return [...score.entries()]
    .filter(([, s]) => s.sum >= 0.15)
    .sort((a, b) => b[1].sum - a[1].sum)
    .slice(0, MAX_NOTES)
    .map(([note, s]) => ({ note, key: s.key }));
}

/** Whether a tap in this direction (+1 more, -1 less) would change anything. */
export function canAdjust(lines: RecipeLine[], key: number, direction: 1 | -1): boolean {
  const a = lines[key]?.amount;
  if (!a) return false;
  if (a.kind === "parts") return direction > 0 ? a.parts + EDIT_STEP <= MAX_PARTS : a.parts - EDIT_STEP >= SHARE_FLOOR;
  if (a.kind === "dash") return direction > 0 ? a.count + 1 <= MAX_DASHES : a.count - 1 >= 1;
  return false;
}

/** The recipe after one tap: a little more (+1) or less (-1) of one ingredient. */
export function adjustLine(lines: RecipeLine[], key: number, direction: 1 | -1): RecipeLine[] {
  if (!canAdjust(lines, key, direction)) return lines;
  return lines.map((l, i) => {
    if (i !== key) return l;
    if (l.amount.kind === "parts") return { ...l, amount: { kind: "parts", parts: l.amount.parts + direction * EDIT_STEP } };
    if (l.amount.kind === "dash") return { ...l, amount: { kind: "dash", count: l.amount.count + direction } };
    return l;
  });
}
