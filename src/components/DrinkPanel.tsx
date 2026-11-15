"use client";

import { useEffect, useRef, useState } from "react";
import { DRINKS, type RecipeLine } from "@/data/drinks";
import { INGREDIENTS } from "@/data/ingredients";
import {
  ARTBOARD,
  STACK,
  amountFromOz,
  formatAmount,
  layerGeometry,
  layerHeights,
  orderLines,
  pxPerOz,
  stepAmount,
  volumeOz,
} from "@/lib/stack";
import { useArtboardScale } from "./useArtboardScale";
import { useLayerDrag } from "./useLayerDrag";

// OPEN: which drink a visitor sees first (brief §1 flow). Placeholder: Negroni.
const START_DRINK = Math.max(0, DRINKS.findIndex((d) => d.id === "negroni"));

/** Dark text on light colors, white text on dark ones, so labels stay readable. */
function labelColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.18 ? "rgba(255,255,255,0.9)" : "rgba(20,20,20,0.75)";
}

export function DrinkPanel() {
  const scale = useArtboardScale();
  const [state, setState] = useState(() => ({
    index: START_DRINK,
    lines: DRINKS[START_DRINK].lines,
  }));
  const drink = DRINKS[state.index];
  const modified = state.lines !== drink.lines;

  const ordered = orderLines(state.lines);
  const heights = layerHeights(ordered);

  // Bottom edge of each layer, measured up from the bottom of the stack.
  const bottoms: number[] = [];
  heights.reduce((acc, h, i) => {
    bottoms[i] = acc;
    return acc + h;
  }, 0);

  const setLine = (key: number, update: (line: RecipeLine) => RecipeLine) =>
    setState((s) => ({
      ...s,
      lines: s.lines.map((l, i) => (i === key ? update(l) : l)),
    }));

  const goTo = (delta: number) =>
    setState((s) => {
      const index = (s.index + delta + DRINKS.length) % DRINKS.length;
      return { index, lines: DRINKS[index].lines };
    });

  const reset = () => setState((s) => ({ ...s, lines: DRINKS[s.index].lines }));

  // Drag: remember the amount and the px-per-oz rate when the drag starts, so
  // the amount follows the finger at a steady rate for the whole gesture.
  const dragStart = useRef({ oz: 0, rate: 1 });
  const { handlers, draggingKey } = useLayerDrag({
    scale: scale || 1,
    onStart: (key) => {
      const line = state.lines[key];
      const totalOz = state.lines.reduce((s, l) => s + volumeOz(l.amount), 0);
      dragStart.current = {
        oz: volumeOz(line.amount),
        rate: pxPerOz(ordered, heights) || STACK.height / Math.max(totalOz, 1),
      };
    },
    onMove: (key, dy) => {
      const { oz, rate } = dragStart.current;
      setLine(key, (l) => ({ ...l, amount: amountFromOz(l.amount, oz + dy / rate) }));
    },
  });

  // ← / → switch drinks (placeholder until the Finder exists).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.getAttribute("role") === "slider") return;
      if (e.key === "ArrowLeft") goTo(-1);
      if (e.key === "ArrowRight") goTo(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const caption = ordered
    .slice()
    .reverse()
    .map((l) => INGREDIENTS[l.ingredient].name)
    .join(" · ");

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#F7F7F7] text-[#141414]">
      <div
        className="absolute bottom-0 left-1/2"
        style={{
          width: ARTBOARD.width,
          height: ARTBOARD.height,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "bottom center",
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {/* Drink switcher (placeholder until the Finder exists) */}
        <div className="absolute flex items-center gap-1" style={{ left: 62, right: 63, top: 28 }}>
          {modified && (
            <button
              type="button"
              onClick={reset}
              className="h-11 rounded-full px-3 text-xs text-[#141414]/60 hover:text-[#141414] focus-visible:outline-2 focus-visible:outline-[#141414]"
            >
              Reset
            </button>
          )}
          <span className="ml-auto text-xs tabular-nums text-[#141414]/45" aria-live="polite">
            {state.index + 1} / {DRINKS.length}
          </span>
          <button
            type="button"
            onClick={() => goTo(-1)}
            aria-label="Previous drink"
            className="grid size-11 place-items-center rounded-full text-lg text-[#141414]/60 hover:text-[#141414] focus-visible:outline-2 focus-visible:outline-[#141414]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Next drink"
            className="grid size-11 place-items-center rounded-full text-lg text-[#141414]/60 hover:text-[#141414] focus-visible:outline-2 focus-visible:outline-[#141414]"
          >
            ›
          </button>
        </div>

        <h1 className="absolute text-[22px] font-semibold leading-7" style={{ left: 62, top: 96 }}>
          {drink.name}
        </h1>
        <p className="absolute text-xs opacity-55" style={{ left: 62, top: 130 }}>
          {drink.family}
        </p>
        <p
          className="absolute text-[11px] leading-4 text-[#141414]/45"
          style={{ left: 62, top: 160, width: STACK.width }}
        >
          {caption}
        </p>

        {/* OPEN: gesture hints (brief §6). Placeholder: one line of text until the first change. */}
        {!modified && (
          <p
            className="absolute text-[11px] text-[#141414]/45"
            style={{ left: 62, top: 216 }}
          >
            Drag a layer up or down to change how much is in it.
          </p>
        )}

        <div
          className="absolute"
          style={{ left: STACK.x, top: STACK.y, width: STACK.width, height: STACK.height }}
        >
          {/* The blurred color bands (Figma v4 recipe). Later layers paint on top. */}
          {ordered.map((line, i) => {
            const g = layerGeometry(heights[i]);
            return (
              <div
                key={`${drink.id}-${line.key}`}
                aria-hidden
                className="layer-anim absolute"
                style={{
                  left: g.x,
                  width: g.width,
                  bottom: bottoms[i] - g.overlap,
                  height: g.totalHeight,
                  background: INGREDIENTS[line.ingredient].color,
                  filter: `blur(${g.blur}px)`,
                  transition: draggingKey === null ? undefined : "none",
                }}
              />
            );
          })}

          {/* Touch targets and labels, one per layer, at the layer's exact bounds. */}
          {ordered.map((line, i) => {
            const ingredient = INGREDIENTS[line.ingredient];
            const isGarnish = line.amount.kind === "garnish";
            const amountText = formatAmount(line.amount);
            const label = (
              <span
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-right text-[11px] leading-4"
                style={{ color: labelColor(ingredient.color) }}
              >
                {ingredient.name}
                <span className="opacity-70"> · {amountText}</span>
              </span>
            );
            const box = {
              bottom: bottoms[i],
              height: heights[i],
              transition: draggingKey === null ? undefined : "none",
            };

            // OPEN: garnishes as non-volume marks (brief §7). Placeholder: a
            // fixed-size layer that can't be resized.
            if (isGarnish) {
              return (
                <div key={`${drink.id}-${line.key}`} className="layer-anim absolute inset-x-0" style={box}>
                  {label}
                </div>
              );
            }

            return (
              <div
                key={`${drink.id}-${line.key}`}
                role="slider"
                tabIndex={0}
                aria-label={`${ingredient.name}, ${line.role}`}
                aria-valuemin={0}
                aria-valuemax={12}
                aria-valuenow={Math.round(volumeOz(line.amount) * 100) / 100}
                aria-valuetext={amountText}
                aria-orientation="vertical"
                className={`layer-anim absolute inset-x-0 touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-[#141414] focus-visible:ring-inset ${
                  draggingKey === line.key ? "cursor-grabbing" : "cursor-grab"
                }`}
                style={box}
                {...handlers(line.key)}
                onKeyDown={(e) => {
                  const steps =
                    e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : e.key === "PageUp" ? 4 : e.key === "PageDown" ? -4 : 0;
                  if (!steps) return;
                  e.preventDefault();
                  setLine(line.key, (l) => ({ ...l, amount: stepAmount(l.amount, steps) }));
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
