"use client";

import { FILTERS } from "@/data/finder";

/** The thin slash between two filters (Figma 132:35: 3.9 x 9.7, white at 50%). */
function Slash() {
  return (
    <svg width="4" height="10" viewBox="0 0 4 10" fill="none" aria-hidden className="shrink-0 opacity-50">
      <path d="M3.5 0.2L0.5 9.8" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  active: string;
  onSelect: (id: string) => void;
};

/**
 * Quick filters across the top: one row that scrolls sideways, as capitals split by thin
 * slashes (Figma 132:35). Start filters (Classics, Build my own) and taste come first, then
 * the occasion filters. Picking one swaps the carousel to that curated list.
 */
export function FilterBar({ active, onSelect }: Props) {
  return (
    <section aria-label="Find a drink" className="flex flex-col gap-2 md:col-span-2 md:row-start-1 md:gap-[var(--filters-gap,16px)]">
      {/* One row that scrolls sideways, edge to edge on a phone; both edges fade out (the left one only shows once you scroll). */}
      <div
        role="group"
        aria-label="Filters"
        className="-mx-4 -my-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-28px),transparent)] md:mx-0 md:px-0"
      >
        <div className="flex w-max items-center pr-10">
          {FILTERS.map((f, i) => {
            const selected = f.id === active;
            return (
              // Plain text in capitals, split by thin slashes (no pills). The chosen one is white and
              // medium weight; the rest are 50% white. The button is an invisible 44px-tall tap area.
              <button
                key={f.id}
                type="button"
                aria-pressed={selected}
                aria-disabled={f.placeholder || undefined}
                title={f.placeholder ? "Coming soon" : undefined}
                onClick={() => onSelect(f.id)}
                // With a slash: 14px from the label before it to the slash, and 14px from the slash to its label.
                className={`group flex h-11 shrink-0 items-center pr-2 outline-none ${i > 0 ? "gap-3.5 pl-1.5" : "pl-2"} ${f.placeholder ? "cursor-default" : ""}`}
              >
                {i > 0 && <Slash />}
                <span
                  className={`whitespace-nowrap text-[10px] uppercase md:text-xs tracking-[0.08em] transition-colors group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-[#F7F7F7] ${
                    selected ? "font-medium text-white" : "text-white/50 group-hover:text-white/80"
                  }`}
                >
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* A squiggly line under the filters, 16px in from each side of the screen (the screen's own padding),
          the same wave as the edit panel's edge. */}
      <span aria-hidden className="relative block h-[7px]">
        <span className="wave-line" style={{ top: 0 }} />
      </span>
    </section>
  );
}
