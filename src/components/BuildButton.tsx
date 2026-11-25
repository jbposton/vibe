"use client";

import Image from "next/image";
import { TEXT_BUTTON } from "./buttonStyles";

/**
 * The BUILD MY OWN button in the browse filters (Figma 262:3043): a pill in the page's own color with a
 * colored sparkle. On hover, a soft, still drop shadow in a pink to orange to purple gradient eases in behind it
 * (globals.css, "build-glow"). Like the other filters, the label is half white until you are in Build my own; the sparkle is always full strength.
 */
export function BuildButton({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      // Filters keep 22px between a word and a slash. The pill's own 14px padding counts toward it, so -mr-1.5
      // takes 6px off the next filter's 14px lead-in: the slash sits 8px clear of the pill's edge.
      className="group -mr-1.5 flex h-11 shrink-0 items-center outline-none"
    >
      <span className="relative block">
        {/* The gradient shadow only shows with the mouse on the button (or keyboard focus), and eases in. */}
        <span aria-hidden className="build-glow opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
        <span
          className={`${TEXT_BUTTON} relative flex items-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-[#1A1612] px-3.5 transition-colors group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[#F7F7F7] md:text-[length:var(--filter-size,10px)] ${
            selected ? "font-medium text-white" : "text-white/50 group-hover:text-white/80"
          }`}
        >
          {/* The colored AI sparkle (Figma 268:11). It takes a 16px space; its glow spills a little past it, so the
              picture is 19.6 x 19.4 and sits 1.6px left and 1.8px up. Always full strength, selected or not. */}
          <span aria-hidden className="relative block size-4">
            <Image
              src="/icons/build-ai.svg"
              alt=""
              width={20}
              height={19}
              unoptimized
              draggable={false}
              className="absolute -left-[1.6px] -top-[1.8px] h-[19.4px] w-[19.6px] max-w-none"
            />
          </span>
          Build my own
        </span>
      </span>
    </button>
  );
}
