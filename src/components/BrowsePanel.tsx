"use client";

import { useState } from "react";
import type { Drink } from "@/data/drinks";
import { blurbFor } from "@/data/blurbs";
import { PrepTags } from "./PrepIcons";
import { useTuning } from "@/lib/tuning";
import { TEXT_BUTTON } from "@/components/buttonStyles";

type Props = {
  drink: Drink;
  /** MAKE EDITS: enter Build mode on the Structure tab. */
  onEdit: () => void;
  /** SUBSTITUTIONS: enter Build mode on All Ingredients. */
  onSubstitute: () => void;
  /** For a drink you saved: take it off My Drinks. Not given for the app's own drinks. */
  onRemove?: () => void;
};

const BUTTON =
  `${TEXT_BUTTON} flex-1 rounded-full bg-[#21201E] text-white transition-colors hover:bg-[#2C2A27] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]`;

/**
 * Browse mode's left column on wide screens (Figma 256:832): the drink's story, how it is best
 * prepared, and the two buttons that start Build mode.
 */
export function BrowsePanel({ drink, onEdit, onSubstitute, onRemove }: Props) {
  const tune = useTuning();
  // Removing can't be undone, so it takes two clicks. This holds the drink the first click was for.
  const [asked, setAsked] = useState<string | null>(null);
  const confirming = asked === drink.id;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="min-h-0 flex-1 overflow-y-auto font-serif opacity-80 text-[19px] leading-[23px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{blurbFor(drink.id, drink.name)}</p>

      <div className="mt-6 shrink-0">
        <p className="mb-3 text-[10px] uppercase tracking-[1px] text-[#F7F7F7]/50">Best prepared</p>
        <div className="-ml-[10px]">
          <PrepTags method={drink.method} glass={drink.glass} />
        </div>
        <span aria-hidden className="relative mb-6 block h-[7px]" style={{ marginTop: tune.prepToLine }}>
          <span className="wave-line" style={{ top: 0 }} />
        </span>
        <div className="flex gap-[7px]">
          <button type="button" className={BUTTON} onClick={onEdit}>
            Make edits
          </button>
          <button type="button" className={BUTTON} onClick={onSubstitute}>
            Substitutions
          </button>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={() => (confirming ? onRemove() : setAsked(drink.id))}
            onBlur={() => setAsked(null)}
            onMouseLeave={() => setAsked(null)}
            className={`${TEXT_BUTTON} mt-[7px] w-full rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
              confirming ? "border-[#FF8A80]/60 text-[#FF8A80]" : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"
            }`}
          >
            <span aria-live="polite">{confirming ? "Click again to remove" : "Remove drink"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
