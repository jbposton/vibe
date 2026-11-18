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
  "flex h-9 shrink-0 items-center gap-[3px] rounded-full border border-transparent bg-[#1A1612] text-[10px] uppercase tracking-[0.08em] md:text-[length:var(--pill-size,10px)] text-white transition-colors hover:bg-[#26221E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] disabled:pointer-events-none disabled:opacity-35";

/** What each taste button says. */
const LABEL: Record<TraitEdit["id"], string> = {
  "more-sweet": "More sweet",
  "less-sweet": "Less sweet",
  "more-bitter": "More bitter",
  "less-bitter": "Less bitter",
  "more-strong": "Stronger",
  "less-strong": "Lighter",
};

/**
 * The buttons under the drink: SUBSTITUTE, then MORE / LESS SWEET, MORE / LESS BITTER, STRONGER and LIGHTER, but
 * only the taste ones that fit the drink (see lib/edits.ts). JP, 2026-11-17: a Less button for each.
 */
export function MakeEdits({ edits, lines, onAdjust, onSubstitute }: Props) {
  return (
    <section aria-label="Make edits">
      {/* More room inside each button (16px at the sides), so the row can be wider than the screen:
          it scrolls sideways on a phone (JP, 2026-11-17). Wide screens wrap the pills onto more lines instead
          (JP, 2026-11-18). */}
      <div className="-mx-[19px] overflow-x-auto px-[19px] [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-[7px] pr-[19px] md:w-auto md:flex-wrap md:gap-y-2 md:pr-0">
        {/* Wide screens show the ingredients all the time, so there's nothing for this to open (JP, 2026-11-18). */}
        <button type="button" className={`${PILL} px-4 md:hidden`} onClick={onSubstitute}>
          Make a substitute
        </button>
        {edits.map((edit) => (
          <button
            key={edit.id}
            type="button"
            aria-label={edit.label}
            className={`${PILL} px-4`}
            disabled={!canAdjust(lines, edit.key, edit.direction)}
            onClick={() => onAdjust(edit.key, edit.direction)}
          >
            {LABEL[edit.id]}
          </button>
        ))}
      </div>
      </div>
    </section>
  );
}
