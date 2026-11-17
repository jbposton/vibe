"use client";

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
 * round-ended chips with a picture on the left (a gray circle for now: the imagery is a placeholder)
 * and the name in capitals. The ingredients in the current drink have a white outline.
 */
export function IngredientDrawer({ lines, onPick }: Props) {
  const chosen = new Set<string>(lines.map((l) => l.ingredient));
  return (
    <div className="flex flex-col gap-[30px]">
      {CATEGORIES.map((category) => (
        <section key={category} aria-label={category}>
          <h2 className="mb-2 text-sm leading-[17px] text-[#F7F7F7]/50">{category}</h2>
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
                    className={`flex h-14 items-center gap-[10px] rounded-full border py-2 pl-[7px] pr-[14px] text-[10px] uppercase tracking-[0.08em] text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
                      on ? "border-white" : "border-white/[0.12] hover:border-white/40"
                    }`}
                  >
                    {/* OPEN: the picture of each ingredient (a placeholder circle for now). */}
                    <span aria-hidden className="size-[38px] shrink-0 rounded-full bg-[#D9D9D9]" />
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
