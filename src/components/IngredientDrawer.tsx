"use client";

import Image from "next/image";
import type { RecipeLine } from "@/data/drinks";
import { CATEGORIES, INGREDIENTS, type IngredientId } from "@/data/ingredients";

type Props = {
  /** The recipe as currently edited: its ingredients are drawn as chosen. */
  lines: RecipeLine[];
  /** A tap on an ingredient (see lib/swap.ts for what it does). */
  onPick: (ingredient: IngredientId) => void;
};

const all = Object.values(INGREDIENTS) as { id: IngredientId; name: string; category: string }[];

/**
 * The drawer's ingredient sections (Figma 187:43): one section per category, each a wrapped row of
 * round-ended chips with the ingredient's icon on the left and the name in capitals. The ingredients in the current drink have a white outline.
 */
export function IngredientDrawer({ lines, onPick }: Props) {
  const chosen = new Set<string>(lines.map((l) => l.ingredient));
  return (
    <div className="flex flex-col gap-[30px]">
      {CATEGORIES.map((category) => (
        <section key={category} aria-label={category}>
          <h2 className="mb-2 text-[10px] uppercase leading-[17px] tracking-[1px] text-[#F7F7F7]/50 md:text-[length:var(--category-size,10px)]">{category}</h2>
          <div className="flex flex-wrap gap-x-3 gap-y-[11px]">
            {all
              .filter((i) => i.category === category)
              .map((i) => {
                const on = chosen.has(i.id);
                return (
                  <button
                    key={i.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onPick(i.id)}
                    className={`flex h-14 items-center gap-[10px] rounded-full border bg-[#1A1612] py-2 pl-[7px] pr-[14px] text-[10px] uppercase tracking-[1px] text-white md:text-[length:var(--chip-size,10px)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
                      on ? "border-white" : "border-transparent hover:bg-[#26221E]"
                    }`}
                  >
                    {/* The ingredient's picture: the 38 x 38 "Night glow" icon (Figma 196:38), saved at 4x in public/icons/ingredients. */}
                    <Image
                      src={`/icons/ingredients/${i.id}.png`}
                      alt=""
                      width={38}
                      height={38}
                      unoptimized
                      draggable={false}
                      className="size-[38px] shrink-0"
                    />
                    {i.name}
                  </button>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
