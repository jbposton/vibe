"use client";

import type { RecipeLine } from "@/data/drinks";
import type { IngredientId } from "@/data/ingredients";
import type { TraitEdit } from "@/lib/edits";
import { IngredientDrawer } from "./IngredientDrawer";
import { MakeEdits } from "./MakeEdits";

/** How tall the panel is closed (Figma 187:43: the grabber, one row of buttons and a little room). */
export const PANEL_CLOSED_HEIGHT = 109;
/** Where the open drawer's top edge sits (px from the top of the screen): the header stays above it. */
export const DRAWER_TOP = 102;

type Props = {
  edits: TraitEdit[];
  lines: RecipeLine[];
  onAdjust: (key: number, direction: 1 | -1) => void;
  /** SUBSTITUTE: open the drawer. */
  onSubstitute: () => void;
  /** A tap on an ingredient in the drawer. */
  onPick: (ingredient: IngredientId) => void;
  /** Phones: the panel floats at the bottom and swipes up. Wide screens: it just sits in its column. */
  floating: boolean;
  open: boolean;
  onToggle: () => void;
  /** How far the panel grows between closed and open (px). */
  travel: number;
  /** Pointer handlers that make the panel draggable (empty on wide screens). */
  bind: Record<string, unknown>;
};

/**
 * The edit panel (Figma 187:43). On a phone it is full width at the bottom with a wavy top edge;
 * closed it shows the grabber and the buttons, and swiping it up (or tapping the grabber or
 * SUBSTITUTE) takes it all the way up, over the drink, to just under the header. Opened, it
 * shows the ingredients in sections by category. Only the top strip (grabber and buttons) is
 * dragged; the ingredients below scroll.
 */
export function EditPanel({ edits, lines, onAdjust, onSubstitute, onPick, floating, open, onToggle, travel, bind }: Props) {
  const buttons = <MakeEdits edits={edits} lines={lines} onAdjust={onAdjust} onSubstitute={onSubstitute} />;

  if (!floating) {
    // Wide screens: the buttons, then the ingredients, in the column.
    return (
      <section aria-label="Edit this drink" className="rounded-[30px] bg-[#21201E] px-[19px] py-6">
        {buttons}
        <div className="mt-6">
          <IngredientDrawer lines={lines} onPick={onPick} />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Edit this drink"
      className="absolute inset-x-0 bottom-0 z-20"
      // The panel grows upward from the bottom as --p goes 0 to 1.
      style={{ height: `calc(${PANEL_CLOSED_HEIGHT}px + var(--p, 0) * ${travel}px)` }}
    >
      {/* The solid fill cut to a wavy top edge, and a thin white wavy line along it (Figma 169:107). */}
      <span aria-hidden className="wavy-sheet" />
      <span aria-hidden className="wave-line wave-line-top" />

      {/* The drag strip: the grabber and the buttons. */}
      <div {...bind} className="relative touch-none px-[19px] pt-[42px]">
        {/* The grabber: also a button, so the panel can be opened and closed without swiping. */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? "Close the edit panel" : "Open the edit panel"}
          className="absolute left-1/2 top-0 grid h-7 w-16 -translate-x-1/2 place-items-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#F7F7F7]"
        >
          <span aria-hidden className="block h-1 w-9 rounded-full bg-white/20" />
        </button>
        {buttons}
      </div>

      {/* The ingredients: they fade in as the panel rises, and scroll. */}
      <div
        inert={!open}
        className="absolute inset-x-0 bottom-0 top-[74px] touch-pan-y overflow-y-auto overscroll-contain px-[19px] pb-10 pt-5"
        style={{ opacity: "clamp(0, calc((var(--p, 0) - 0.3) * 1.5), 1)" }}
      >
        <IngredientDrawer lines={lines} onPick={onPick} />
      </div>
    </section>
  );
}
