"use client";

import { FILTERS, type Filter } from "@/data/finder";

/** A small four-point sparkle, for "Build my own". */
function Sparkle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="-ml-1 mr-2 shrink-0">
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

const ROWS: { label: string; match: (f: Filter) => boolean }[] = [
  { label: "Taste", match: (f) => f.group === "start" || f.group === "flavor" },
  { label: "Occasion", match: (f) => f.group === "occasion" },
];

/**
 * Quick filters across the top: two rows (taste, then occasion) that each
 * scroll sideways on their own. Picking one swaps the carousel to that curated list.
 */
export function FilterBar({ active, onSelect }: Props) {
  return (
    <section aria-label="Find a drink" className="flex flex-col gap-2 md:col-span-2 md:row-start-1">
      <p className="text-xs text-[#F7F7F7]/55">What are you having?</p>
      {/* Each row scrolls sideways on its own, edge to edge on a phone; the right edge fades out. */}
      <div className="flex flex-col gap-2">
        {ROWS.map((row) => (
          <div
            key={row.label}
            role="group"
            aria-label={row.label}
            className="-mx-4 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] md:mx-0 md:px-0"
          >
            <div className="flex w-max gap-2 pr-10">
              {FILTERS.filter(row.match).map((f) => {
                const selected = f.id === active;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={selected}
                    aria-disabled={f.placeholder || undefined}
                    title={f.placeholder ? "Coming soon" : undefined}
                    onClick={() => onSelect(f.id)}
                    className={`flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
                      selected
                        ? "border-[#F7F7F7] bg-[#F7F7F7] font-semibold text-[#1A1612]"
                        : "border-[#F7F7F7]/70 text-[#F7F7F7] hover:bg-[#F7F7F7]/10"
                    } ${f.placeholder ? "cursor-default" : ""}`}
                  >
                    {f.id === "build-my-own" && <Sparkle />}
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
