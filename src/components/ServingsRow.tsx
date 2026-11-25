"use client";

import { TEXT_BUTTON } from "./buttonStyles";
import { useLayoutEffect, useRef, useState } from "react";

const PRESETS = [1, 2, 4];
const MAX = 99;

type Props = {
  /** How many drinks the recipe makes now. */
  servings: number;
  /** The total amount for all of them, e.g. "6 oz". */
  total: string;
  /** The amount in one serving, e.g. "3 oz". */
  perServing: string;
  onChange: (servings: number) => void;
};

/** Space inside the active pill, each side of its words. */
const PILL_PAD = 16;
/** The round buttons are this wide (and the pill is this tall). */
const ROUND = 36;

const base =
  `${TEXT_BUTTON} relative grid shrink-0 grid-cols-[minmax(0,1fr)] place-items-center overflow-hidden whitespace-nowrap rounded-full border bg-[#21201E] text-white transition-[width,border-color,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:text-[length:var(--serving-num-size,10px)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]`;
const off = "border-transparent hover:bg-[#2C2A27]";
const on = "border-white/20";

/** The two labels share one grid cell and cross-fade: the number when off, "2 Servings" when on. */
function Label({ short, long, active }: { short: React.ReactNode; long: string; active: boolean }) {
  return (
    <>
      <span aria-hidden={active} className={`col-start-1 row-start-1 text-[#F7F7F7]/60 transition-opacity duration-200 motion-reduce:transition-none ${active ? "opacity-0" : "opacity-100"}`}>
        {short}
      </span>
      <span data-long aria-hidden={!active} className={`col-start-1 row-start-1 transition-opacity duration-200 motion-reduce:transition-none ${active ? "opacity-100" : "opacity-0"}`}>
        {long}
      </span>
    </>
  );
}

const word = (n: number) => (n === 1 ? "1 Serving" : `${n} Servings`);

/**
 * Serving size under the drink (Figma 257:2802): 1, 2 and 4 drinks, and "+" for any other number. The chosen
 * one is a pill that carries the word ("2 Servings"); the others are plain round buttons. When you pick another
 * one the pills grow and shrink smoothly (the widths are set from the measured words, so they can animate).
 * The total is on the right ("6 oz" over "3 oz per serving"). The number of drinks only scales the oz;
 * the ratios never change.
 * OPEN: "+" opens a small number box (1 to 99).
 */
export function ServingsRow({ servings, total, perServing, onChange }: Props) {
  const [typing, setTyping] = useState(false);
  const custom = !PRESETS.includes(servings);
  const groupRef = useRef<HTMLDivElement | null>(null);

  // Set each button's width straight on the element: the active one to fit its words, the rest round.
  // (Not React state, so the CSS transition sees an ordinary width change.)
  useLayoutEffect(() => {
    groupRef.current?.querySelectorAll<HTMLElement>("[data-serving]").forEach((btn) => {
      const long = btn.querySelector<HTMLElement>("[data-long]");
      const active = btn.getAttribute("aria-pressed") === "true";
      btn.style.width = `${active && long ? Math.ceil(long.offsetWidth) + 2 * PILL_PAD : ROUND}px`;
    });
  });

  const commit = (raw: string) => {
    setTyping(false);
    const n = Math.round(Number(raw));
    if (Number.isFinite(n) && n >= 1) onChange(Math.min(MAX, n));
  };

  return (
    <div className="flex items-end justify-between">
      <div ref={groupRef} role="group" aria-label="Servings" className="flex items-center gap-1.5">
        {PRESETS.map((n) => (
          <button
            key={n}
            data-serving
            type="button"
            aria-pressed={servings === n}
            aria-label={n === 1 ? "1 drink" : `${n} drinks`}
            onClick={() => onChange(n)}
            className={`${base} ${servings === n ? on : off}`}
          >
            <Label short={n} long={word(n)} active={servings === n} />
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
            className="h-9 w-14 rounded-full border border-white/20 bg-[#21201E] text-center text-[10px] uppercase tracking-[1px] text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        ) : (
          <button
            data-serving
            type="button"
            aria-pressed={custom}
            aria-label={custom ? `${servings} drinks: change` : "Another number of drinks"}
            onClick={() => setTyping(true)}
            className={`${base} ${custom ? on : off}`}
          >
            <Label
              short={
                <svg width="10" height="10" viewBox="0 0 8 8" fill="none" aria-hidden>
                  <path d="M4 0.5V7.5M0.5 4H7.5" stroke="currentColor" strokeLinecap="round" />
                </svg>
              }
              long={word(servings)}
              active={custom}
            />
          </button>
        )}
      </div>
      <p className="text-right">
        <span className="block text-[18px] leading-[22px] text-[#F7F7F7] md:text-[length:var(--total-size,18px)] md:leading-[1.25]">{total}</span>
        <span className="block text-[12px] leading-4 text-[#F7F7F7]/50 md:text-[length:var(--sub-size,12px)]">{perServing} per serving</span>
      </p>
    </div>
  );
}
