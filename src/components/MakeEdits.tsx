"use client";

import type { RecipeLine } from "@/data/drinks";
import { canAdjust, type TraitEdit } from "@/lib/edits";

type Props = {
  /** The buttons this drink offers (from its classic recipe). */
  edits: TraitEdit[];
  /** The recipe as currently edited. */
  lines: RecipeLine[];
  /** A tap on a button: change the ingredient at `key` a little more (+1) or less (-1). */
  onAdjust: (key: number, direction: 1 | -1) => void;
  /** SUBSTITUTE: bring up the drawer with the ingredients. */
  onSubstitute: () => void;
};

const PILL =
  "flex h-[30px] shrink-0 items-center gap-[3px] rounded-full border border-white/[0.12] bg-[#1A1612] text-[10px] uppercase tracking-[0.08em] text-white transition-colors hover:border-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] disabled:pointer-events-none disabled:opacity-35";

/** The small plus before SWEET, BITTER and STRENGTH. */
function Plus() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <path d="M5.5 2.5V8.5M2.5 5.5H8.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

/** What each taste button says (the plus is drawn in front of these). */
const WORD: Record<TraitEdit["id"], string> = {
  "add-sweet": "Sweet",
  "add-bitter": "Bitter",
  "more-strong": "Strength",
  "less-strong": "Less strength",
};

/**
 * The buttons under the drink (Figma 187:43): SUBSTITUTE, then + SWEET, + BITTER and + STRENGTH, but
 * only the taste ones that fit the drink (see lib/edits.ts). There is no "less strength" button in
 * the design, so Less Strong is not shown.
 */
export function MakeEdits({ edits, lines, onAdjust, onSubstitute }: Props) {
  return (
    <section aria-label="Make edits">
      <div className="flex gap-[7px]">
        <button type="button" className={`${PILL} px-2.5`} onClick={onSubstitute}>
          Substitute
        </button>
        {edits
          .filter((edit) => edit.id !== "less-strong")
          .map((edit) => (
            <button
              key={edit.id}
              type="button"
              aria-label={`Add ${WORD[edit.id].toLowerCase()}`}
              className={`${PILL} pl-2.5 pr-[13px]`}
              disabled={!canAdjust(lines, edit.key, edit.direction)}
              onClick={() => onAdjust(edit.key, edit.direction)}
            >
              <Plus />
              {WORD[edit.id]}
            </button>
          ))}
      </div>
    </section>
  );
}
