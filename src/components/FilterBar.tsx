"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FILTERS, type Filter } from "@/data/finder";

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
  /** Which filters to show (default: all of them). */
  filters?: Filter[];
};

/** A small round chevron button at one end of the filter row (wide screens only). */
function Chevron({ dir, shown, onClick }: { dir: -1 | 1; shown: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir < 0 ? "Scroll the filters left" : "Scroll the filters right"}
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      className={`absolute top-1/2 z-10 hidden size-7 -translate-y-1/2 place-items-center rounded-full bg-[#21201E]/70 text-white backdrop-blur-md transition-[opacity,background-color] duration-200 hover:bg-[#2C2A27] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] md:grid ${
        dir < 0 ? "left-0" : "right-0"
      } ${shown ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d={dir < 0 ? "M10 3L5 8L10 13" : "M6 3L11 8L6 13"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/**
 * Quick filters across the top: one row that scrolls sideways, as capitals split by thin
 * slashes (Figma 132:35). Start filters (Classics, Build my own) and taste come first, then
 * the occasion filters. Picking one swaps the carousel to that curated list.
 */
export function FilterBar({ active, onSelect, filters = FILTERS }: Props) {
  // Wide screens: a mouse can't swipe sideways, so there are chevron buttons at the ends (each shows only
  // when there is more in that direction), and the mouse wheel scrolls the row too (JP, 2026-11-18).
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [more, setMore] = useState({ left: false, right: false });
  const check = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;
    setMore((m) => (m.left === left && m.right === right ? m : { left, right }));
  }, []);
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [check]);
  const edgeFade = `linear-gradient(to right, ${more.left ? "transparent" : "black"}, black 28px, black calc(100% - 28px), ${
    more.right ? "transparent" : "black"
  })`;
    const scrollByPage = (dir: -1 | 1) => {
    const el = rowRef.current;
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: smooth ? "smooth" : "auto" });
  };

  return (
    <section aria-label="Find a drink" className="flex flex-col gap-2 md:col-span-2 md:row-start-1 md:gap-[var(--filters-gap,16px)]">
      {/* One row that scrolls sideways, edge to edge on a phone; an edge fades out only when there is more past it. */}
      <div className="relative">
      <Chevron dir={-1} shown={more.left} onClick={() => scrollByPage(-1)} />
      <Chevron dir={1} shown={more.right} onClick={() => scrollByPage(1)} />
      <div
        ref={rowRef}
        onScroll={check}
        onWheel={(e) => {
          // A plain mouse wheel (up / down) moves the row sideways.
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY;
        }}
        role="group"
        aria-label="Filters"
        className="-mx-4 -my-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0"
        // Each edge fades out only when there are more filters past it, so "Classics" isn't faded before
        // you scroll (JP, 2026-11-18).
        style={{ maskImage: edgeFade, WebkitMaskImage: edgeFade }}
      >
        <div className="flex w-max items-center pr-10">
          {filters.map((f, i) => {
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
                  className={`whitespace-nowrap text-[10px] uppercase md:text-[length:var(--filter-size,12px)] tracking-[0.08em] transition-colors group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-[#F7F7F7] ${
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
      </div>

      {/* A squiggly line under the filters, 16px in from each side of the screen (the screen's own padding),
          the same wave as the edit panel's edge. */}
      <span aria-hidden className="relative block h-[7px]">
        <span className="wave-line" style={{ top: 0 }} />
      </span>
    </section>
  );
}
