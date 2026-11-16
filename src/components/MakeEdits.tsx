"use client";

import type { RecipeLine } from "@/data/drinks";
import { canAdjust, type NoteEdit } from "@/lib/edits";

type Props = {
  /** The notes (and their ingredients) this drink offers, from its classic recipe. */
  edits: NoteEdit[];
  /** The recipe as currently edited. */
  lines: RecipeLine[];
  /** A tap on a note's less (-1) or more (+1) button. */
  onAdjust: (key: number, direction: 1 | -1) => void;
};

const SIDE =
  "grid h-9 w-7 shrink-0 place-items-center text-sm text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#F7F7F7] disabled:pointer-events-none disabled:opacity-30";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * "Make edits": one control per flavor note of this drink, with a button on
 * each side to get a little less or a little more of that note (see lib/edits.ts).
 */
export function MakeEdits({ edits, lines, onAdjust }: Props) {
  return (
    <section aria-label="Make edits" className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-[11px] text-white">
        <span aria-hidden className="h-px flex-1 bg-white/30" />
        <h2 className="font-normal">Make edits</h2>
        <span aria-hidden className="h-px flex-1 bg-white/30" />
      </div>
      <div className="flex gap-2">
        {edits.map(({ note, key }) => (
          <div
            key={note}
            role="group"
            aria-label={capitalize(note)}
            className="flex h-9 min-w-0 flex-1 items-center justify-between overflow-hidden rounded-[9px] bg-white/[0.09] text-[11px] text-white"
          >
            <button
              type="button"
              className={SIDE}
              aria-label={`Less ${note}`}
              disabled={!canAdjust(lines, key, -1)}
              onClick={() => onAdjust(key, -1)}
            >
              −
            </button>
            <span className="truncate">{capitalize(note)}</span>
            <button
              type="button"
              className={SIDE}
              aria-label={`More ${note}`}
              disabled={!canAdjust(lines, key, 1)}
              onClick={() => onAdjust(key, 1)}
            >
              +
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
