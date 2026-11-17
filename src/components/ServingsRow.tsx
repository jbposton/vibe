"use client";

import { useState } from "react";

const PRESETS = [1, 2, 4];
const MAX = 99;

type Props = {
  /** How many drinks the recipe makes now. */
  servings: number;
  /** The total amount for all of them, e.g. "6 oz". */
  total: string;
  onChange: (servings: number) => void;
};

const circle =
  "grid size-9 shrink-0 place-items-center rounded-full border text-xs tracking-[0.08em] text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]";
const off = "border-white/20 hover:border-white/40";
const on = "border-white bg-[#2F2B27]";

/**
 * Serving size under the drink (Figma 187:43): 1, 2 and 4 drinks, and "+" for any other number,
 * with the total on the right ("3 oz", "Single drink"). The number of drinks only scales the oz;
 * the ratios never change. The oz on the layers follow it too.
 * OPEN: "+" opens a small number box (1 to 99).
 */
export function ServingsRow({ servings, total, onChange }: Props) {
  const [typing, setTyping] = useState(false);
  const custom = !PRESETS.includes(servings);

  const commit = (raw: string) => {
    setTyping(false);
    const n = Math.round(Number(raw));
    if (Number.isFinite(n) && n >= 1) onChange(Math.min(MAX, n));
  };

  return (
    <div className="flex items-center justify-between">
      <div role="group" aria-label="Servings" className="flex items-center gap-1.5">
        {PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={servings === n}
            aria-label={n === 1 ? "1 drink" : `${n} drinks`}
            onClick={() => onChange(n)}
            className={`${circle} ${servings === n ? on : off}`}
          >
            {n}
          </button>
        ))}
        {typing ? (
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX}
            aria-label="Number of drinks"
            defaultValue={custom ? servings : ""}
            placeholder="#"
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => commit(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit(e.currentTarget.value);
              if (e.key === "Escape") setTyping(false);
            }}
            className="h-9 w-14 rounded-full border border-white/60 bg-transparent text-center text-xs text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        ) : (
          <button
            type="button"
            aria-pressed={custom}
            aria-label={custom ? `${servings} drinks: change` : "Another number of drinks"}
            onClick={() => setTyping(true)}
            className={`${circle} ${custom ? on : off}`}
          >
            {custom ? (
              servings
            ) : (
              <svg width="10" height="10" viewBox="0 0 8 8" fill="none" aria-hidden>
                <path d="M4 0.5V7.5M0.5 4H7.5" stroke="currentColor" strokeLinecap="round" />
              </svg>
            )}
          </button>
        )}
      </div>
      <p className="text-right">
        <span className="block text-sm leading-[18px] text-[#F7F7F7]">{total}</span>
        <span className="block text-[10px] leading-3 text-[#F7F7F7]/50">
          {servings === 1 ? "Single drink" : `${servings} drinks`}
        </span>
      </p>
    </div>
  );
}
