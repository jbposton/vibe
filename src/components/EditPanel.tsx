"use client";

import type { RecipeLine } from "@/data/drinks";
import type { TraitEdit } from "@/lib/edits";
import { MakeEdits } from "./MakeEdits";

/** How tall the panel is when open, and how much of it shows when closed (Figma 117:975 and 118:1044). */
export const PANEL_OPEN_HEIGHT = 470;
// 63px of content (1px border, top padding 26, the 36px buttons) plus 12px under the buttons, the same as the padding at the sides.
// (It was 152px when the taste slider sat above the buttons: see docs/parked.md.)
export const PANEL_CLOSED_HEIGHT = 76;
/** How far the panel travels between closed and open. */
export const PANEL_TRAVEL = PANEL_OPEN_HEIGHT - PANEL_CLOSED_HEIGHT;

type Props = {
  edits: TraitEdit[];
  lines: RecipeLine[];
  onAdjust: (key: number, direction: 1 | -1) => void;
  /** Phones: the panel floats at the bottom and swipes up. Wide screens: it just sits in its column. */
  floating: boolean;
  open: boolean;
  onToggle: () => void;
  /** Pointer handlers that make the panel draggable (empty on wide screens). */
  bind: Record<string, unknown>;
};

/**
 * The edit panel in its frame (Figma 117:975): a dark card with wavy top and bottom edges holding the
 * edit buttons. On a phone it sits at the bottom and
 * swipes up to fill the screen (see useSheet and DrinkPanel). The fill is solid
 * (the app's background color), with no blur and no shadow (see .wavy-sheet in globals.css).
 */
export function EditPanel({ edits, lines, onAdjust, floating, open, onToggle, bind }: Props) {
  return (
    <section
      aria-label="Edit this drink"
      {...bind}
      className={`px-3 pt-[26px] ${
        floating ? "absolute inset-x-4 bottom-4 z-20 touch-none" : "relative rounded-[30px] border border-white/50 bg-[#2b2b2b]"
      }`}
      // Floating: the panel grows upward from the bottom (226px closed to 470px open) as --p goes 0 to 1.
      style={floating ? { height: `calc(${PANEL_CLOSED_HEIGHT}px + var(--p, 0) * ${PANEL_TRAVEL}px)` } : undefined}
    >
      {floating && (
        // The panel's body: a solid fill cut to wavy top and bottom edges, and a thin white wavy line
        // along each of those two edges (Figma 169:107).
        <>
          <span aria-hidden className="wavy-sheet" />
          <span aria-hidden className="wave-line wave-line-top" />
          <span aria-hidden className="wave-line wave-line-bottom" />
        </>
      )}
      {floating && (
        // The grip: also a button, so the panel can be opened and closed without swiping.
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? "Close the edit panel" : "Open the edit panel"}
          className="absolute left-1/2 top-0 grid h-7 w-16 -translate-x-1/2 place-items-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#F7F7F7]"
        >
          <span aria-hidden className="block h-1 w-9 rounded-full bg-white/20" />
        </button>
      )}
      <div className="relative">
        <MakeEdits edits={edits} lines={lines} onAdjust={onAdjust} />
      </div>
    </section>
  );
}
