"use client";

import { Fragment } from "react";
import { FILTERS } from "@/data/finder";

/** A small four-point sparkle, for "Build my own". */
function Sparkle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="-ml-0.5 mr-1.5 shrink-0">
      <path
        d="M10 3l1.9 5.1L17 10l-5.1 1.9L10 17l-1.9-5.1L3 10l5.1-1.9L10 3zM18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9L18 14z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  active: string;
  onSelect: (id: string) => void;
};

/**
 * Quick filters across the top: one row that scrolls sideways. Start chips
 * (Classics, Build my own) and taste come first, then a thin line, then the
 * occasion chips. Picking one swaps the carousel to that curated list.
 */
export function FilterBar({ active, onSelect }: Props) {
  return (
    <section aria-label="Find a drink" className="flex flex-col gap-2 md:col-span-2 md:row-start-1">
      {/* One row that scrolls sideways, edge to edge on a phone; the right edge fades out. */}
      <div
        role="group"
        aria-label="Filters"
        className="-mx-4 -my-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] md:mx-0 md:px-0"
      >
        <div className="flex w-max items-center pr-10">
          {FILTERS.map((f, i) => {
            const selected = f.id === active;
            // A thin line where the taste chips end and the occasion chips begin.
            const divider = f.group === "occasion" && FILTERS[i - 1]?.group !== "occasion";
            return (
              <Fragment key={f.id}>
                {divider && <span role="separator" aria-orientation="vertical" className="mx-1 h-5 w-px shrink-0 bg-[#F7F7F7]/25" />}
                {/* The button is an invisible 44px-tall tap area (with a little room
                    left and right); the visible pill inside is 32px tall. */}
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-disabled={f.placeholder || undefined}
                  title={f.placeholder ? "Coming soon" : undefined}
                  onClick={() => onSelect(f.id)}
                  className={`group flex h-11 shrink-0 items-center px-[3px] outline-none ${f.placeholder ? "cursor-default" : ""}`}
                >
                  <span
                    className={`flex h-8 items-center whitespace-nowrap rounded-full px-3 text-xs transition-colors group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[#F7F7F7] ${
                      selected
                        ? "bg-white text-[#1A1612]"
                        : "bg-white/[0.09] text-[#F7F7F7] group-hover:bg-white/[0.16]"
                    }`}
                  >
                    {f.id === "build-my-own" && <Sparkle />}
                    {f.label}
                  </span>
                </button>
              </Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
