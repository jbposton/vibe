"use client";

import type { RecipeLine } from "@/data/drinks";
import type { TraitEdit } from "@/lib/edits";
import type { Profile } from "@/lib/flavor";
import { FlavorReadout } from "./FlavorReadout";
import { MakeEdits } from "./MakeEdits";

/** How tall the panel is when open, and how much of it shows when closed (Figma 117:975 and 118:1044). */
export const PANEL_OPEN_HEIGHT = 470;
// 140px of content (top padding 26, flavor, 27px gap, buttons) plus 12px under the buttons, the same as the padding at the sides.
export const PANEL_CLOSED_HEIGHT = 152;
/** How far the panel travels between closed and open. */
export const PANEL_TRAVEL = PANEL_OPEN_HEIGHT - PANEL_CLOSED_HEIGHT;

type Props = {
  profile: Profile;
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
 * The edit panel in its frame (Figma 117:975): a rounded dark card holding the
 * flavor profile and the edit buttons. On a phone it sits at the bottom and
 * swipes up to fill the screen (see useSheet and DrinkPanel). It is a glass
 * material (see .glass-sheet in globals.css): it blurs whatever is behind it,
 * with a soft shadow around its top and sides.
 */
export function EditPanel({ profile, edits, lines, onAdjust, floating, open, onToggle, bind }: Props) {
  return (
    <section
      aria-label="Edit this drink"
      {...bind}
      className={`rounded-[30px] border border-white/50 px-3 pt-[26px] ${
        floating ? "glass-sheet absolute inset-x-4 bottom-4 z-20 touch-none overflow-hidden" : "relative bg-[#2b2b2b]"
      }`}
      // Floating: the panel grows upward from the bottom (226px closed to 470px open) as --p goes 0 to 1.
      style={floating ? { height: `calc(${PANEL_CLOSED_HEIGHT}px + var(--p, 0) * ${PANEL_TRAVEL}px)` } : undefined}
    >
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
      <FlavorReadout profile={profile} />
      <div className="mt-[27px]">
        <MakeEdits edits={edits} lines={lines} onAdjust={onAdjust} />
      </div>
    </section>
  );
}
