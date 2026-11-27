"use client";

import type { ReactNode } from "react";
import { TEXT_BUTTON } from "@/components/buttonStyles";

/** How tall the panel is closed (the grabber and one row of buttons, 34px above the buttons and 16px below, JP 2026-11-17). */
export const PANEL_CLOSED_HEIGHT = 86;
/** Where the open drawer's top edge sits (px from the top of the screen): the header stays above it. */
export const DRAWER_TOP = 102;

type Props = {
  /** MAKE EDITS OR SUBSTITUTIONS: open the drawer. */
  onOpen: () => void;
  open: boolean;
  onToggle: () => void;
  /** How far the panel grows between closed and open (px). */
  travel: number;
  /** Pointer handlers that make the panel draggable. */
  bind: Record<string, unknown>;
  /** What the open drawer holds: the drink's ingredients by role and Done (built by DrinkPanel, shared with wide screens). */
  drawer: ReactNode;
};

const BUTTON =
  `${TEXT_BUTTON} flex-1 rounded-full bg-[#1A1612] text-white transition-colors hover:bg-[#26221E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]`;

/**
 * The phone's edit panel (Figma 187:43, with v2's tabs). It is full width at the bottom with a wavy top edge.
 * Closed it shows only MAKE EDITS OR SUBSTITUTIONS; tapping it (or swiping the panel up, or tapping the
 * grabber) takes it all the way up, over the drink, to just under the header. Opened, it has one section
 * (All ingredients was taken out, JP 2026-11-26) and a Done button that closes it.
 */
export function EditPanel({ onOpen, open, onToggle, travel, bind, drawer }: Props) {
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

      {/* The grabber strip: drag it to open or close. The grabber is also a button, so the panel can be used without swiping. */}
      <div {...bind} className="absolute inset-x-0 top-0 z-30 h-7 touch-pan-x">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? "Close the edit panel" : "Open the edit panel"}
          className="absolute left-1/2 top-0 grid h-7 w-16 -translate-x-1/2 place-items-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#F7F7F7]"
        >
          <span aria-hidden className="block h-1 w-9 rounded-full bg-white/20" />
        </button>
      </div>

      {/* The button (closed). Dragging them up opens the panel too; they fade out as it rises. */}
      <div
        {...bind}
        inert={open}
        className="relative touch-pan-x px-[19px] pt-[34px]"
        style={{ opacity: "clamp(0, calc(1 - var(--p, 0) * 3), 1)", pointerEvents: open ? "none" : undefined }}
      >
        <div className="flex gap-[7px]">
          <button type="button" className={BUTTON} onClick={onOpen}>
            Make edits or substitutions
          </button>
        </div>
      </div>

      {/* What the open panel holds: they fade in as the panel rises, and scroll. */}
      <div
        inert={!open}
        className="absolute inset-x-0 bottom-0 top-7 touch-pan-y overflow-y-auto overscroll-contain"
        style={{ opacity: "clamp(0, calc((var(--p, 0) - 0.3) * 1.5), 1)" }}
      >
        {drawer}
      </div>
    </section>
  );
}
