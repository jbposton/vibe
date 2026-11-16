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
};

const BUTTON =
  "h-9 min-w-0 flex-1 truncate rounded-[9px] bg-white/[0.09] px-2 text-[11px] text-white transition-colors hover:bg-white/[0.16] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] disabled:pointer-events-none disabled:opacity-35";

/**
 * "Make edits" (Figma 110:581): Add Sweet, Add Bitter, Less Strong and More
 * Strong, but only the ones that fit the drink: a drink with no alcohol has no
 * strength buttons, and a single button fills the row (see lib/edits.ts).
 */
export function MakeEdits({ edits, lines, onAdjust }: Props) {
  if (edits.length === 0) return null;
  return (
    <section aria-label="Make edits" className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-[11px] text-white">
        <span aria-hidden className="h-px flex-1 bg-white/30" />
        <h2 className="font-normal">Make edits</h2>
        <span aria-hidden className="h-px flex-1 bg-white/30" />
      </div>
      <div className="flex gap-2">
        {edits.map((edit) => (
          <button
            key={edit.id}
            type="button"
            className={BUTTON}
            disabled={!canAdjust(lines, edit.key, edit.direction)}
            onClick={() => onAdjust(edit.key, edit.direction)}
          >
            {edit.label}
          </button>
        ))}
      </div>
    </section>
  );
}
