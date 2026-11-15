"use client";

import { memo, useCallback, useRef, useState } from "react";
import type { Drink, RecipeLine } from "@/data/drinks";
import { INGREDIENTS } from "@/data/ingredients";
import {
  DEFAULT_UNIT,
  MAX_DASHES,
  formatAmount,
  layerBottoms,
  layerGeometry,
  layerHeights,
  orderLines,
  shareForEdge,
  snapAmount,
  snapShare,
  stepAmount,
  stepShare,
  volumeParts,
} from "@/lib/stack";
import { LiquidCanvas, type LiquidLayer } from "./LiquidCanvas";
import { GRAIN_STYLE } from "./surfaceEffects";
import { useLayerDrag } from "./useLayerDrag";

/** The reset button: a black disc at 80% opacity (the arrow stays solid) with a soft drop shadow. */
const RESET_STYLE: React.CSSProperties = {
  background: "rgba(0,0,0,0.8)",
  boxShadow: "0 8px 20px rgba(0,0,0,0.28)",
};

/** The page's warm black, also shown by the shader above and below the drink. */
const PAGE_BACKGROUND = "#1A1612";

/** Finger travel (px) that adds or removes one dash. */
const DASH_DRAG_PX = 16;

/** How far each fallback color band runs past the card's sides (the card clips it). */
const BAND_BLEED = 128;

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

type Props = {
  drink: Drink;
  /** Position of this drink in the list, so edits can be filed under it. */
  drinkIndex: number;
  /** The recipe as currently edited. */
  lines: RecipeLine[];
  /** Replace this drink's recipe with `update(previous)`. */
  onEdit: (drinkIndex: number, update: (prev: RecipeLine[]) => RecipeLine[]) => void;
  /** True for the card in the middle, while nothing is swiping or settling. */
  interactive: boolean;
  /** A drag on a section turned out to be a sideways swipe. */
  onHorizontal: (clientX: number, pointerId: number) => void;
  /** How many drinks the recipe makes: scales the oz labels, never the ratio. */
  servings: number;
  /** True once this drink's amounts or servings have been changed. */
  modified: boolean;
  /** Put this drink back to its classic recipe and one serving. */
  onReset: (drinkIndex: number) => void;
};

/**
 * One drink: the shader-drawn colors, the labels, and (for the card in the
 * middle) dragging a layer to change how much of it there is. It fills the
 * box it's placed in; the carousel positions and scales that box.
 */
export const DrinkCard = memo(function DrinkCard({
  drink,
  drinkIndex,
  lines,
  onEdit,
  interactive,
  onHorizontal,
  servings,
  modified,
  onReset,
}: Props) {
  // Measure the card: the stack fills its full inner height.
  const panelEl = useRef<HTMLElement | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);
  const panelRef = useCallback((el: HTMLElement | null) => {
    panelEl.current = el;
    if (!el) return;
    setPanelHeight(el.clientHeight); // measure now; the observer keeps it current
    const observer = new ResizeObserver(([entry]) => setPanelHeight(entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const ordered = orderLines(lines);
  const heights = layerHeights(ordered, panelHeight);
  const bottoms = layerBottoms(heights);

  // The drink for the liquid shader: each layer's band (with the v4 overlap)
  // and blur, in px above the stack bottom.
  const liquidLayers: LiquidLayer[] = ordered.map((line, i) => {
    const g = layerGeometry(heights[i]);
    return {
      lo: bottoms[i] - g.overlap,
      hi: bottoms[i] + heights[i] + g.overlap,
      blur: g.blur,
      color: INGREDIENTS[line.ingredient].color,
      still: line.amount.kind === "garnish", // garnishes keep a still gradient
    };
  });
  // null until the shader has drawn (true) or failed (false). Until it's
  // drawing, the CSS bands below show the drink.
  const [shaderReady, setShaderReady] = useState<boolean | null>(null);

  const setLine = (key: number, update: (line: RecipeLine) => RecipeLine) =>
    onEdit(drinkIndex, (prev) => prev.map((l, i) => (i === key ? update(l) : l)));

  // Dragging a layer gives it a bigger or smaller share of the glass: down
  // gives more (its bottom line follows the finger), up gives less. The total
  // stays fixed and every other ingredient rescales in proportion (each keeps
  // at least ¼ part). The base layer has nothing below it, so its top line
  // follows the finger instead (down shrinks it). Amounts follow the finger
  // smoothly and snap to ¼ part on release.
  // OPEN: gesture map (brief §6, §7).
  const shareDrag = useRef<{ key: number; edgeOf: "bottom" | "top"; startY: number; startEdge: number; scale: number; base: RecipeLine[] } | null>(null);
  // Dashes sit outside the ratio, so a dashes layer just changes its own count:
  // one dash for every DASH_DRAG_PX of finger travel (its layer is held at the
  // minimum height, so the layer's edge can't tell us how much to change).
  const dashDrag = useRef<{ key: number; down: 1 | -1; startY: number; startCount: number; scale: number } | null>(null);

  const { handlers, draggingKey } = useLayerDrag({
    onStart: (key, clientY) => {
      const i = ordered.findIndex((l) => l.key === key);
      if (i < 0 || ordered[i].amount.kind === "garnish") return;
      const el = panelEl.current;
      // On screen the card may be scaled (carousel); drags are in screen px.
      const scale = el && el.offsetHeight > 0 ? el.getBoundingClientRect().height / el.offsetHeight : 1;
      const edgeOf = i === 0 ? "top" : "bottom";
      const startEdge = bottoms[i] + (edgeOf === "top" ? heights[i] : 0);
      const amount = ordered[i].amount;
      if (amount.kind === "parts") {
        shareDrag.current = { key, edgeOf, startY: clientY, startEdge, scale, base: lines };
      } else if (amount.kind === "dash") {
        // Down adds dashes (up for the base layer, matching the other layers).
        dashDrag.current = { key, down: i === 0 ? -1 : 1, startY: clientY, startCount: amount.count, scale };
      }
    },
    onMove: (_key, clientY) => {
      const sd = shareDrag.current;
      if (sd) {
        const edge = Math.min(panelHeight, Math.max(0, sd.startEdge - (clientY - sd.startY) / sd.scale));
        onEdit(drinkIndex, () => shareForEdge(sd.base, sd.key, edge, panelHeight, sd.edgeOf));
        return;
      }
      const a = dashDrag.current;
      if (a) {
        const count = a.startCount + (a.down * (clientY - a.startY)) / a.scale / DASH_DRAG_PX;
        setLine(a.key, (l) => ({ ...l, amount: { kind: "dash", count: Math.min(MAX_DASHES, Math.max(0, count)) } }));
      }
    },
    onEnd: () => {
      if (shareDrag.current) {
        shareDrag.current = null;
        onEdit(drinkIndex, (prev) => snapShare(prev));
        return;
      }
      const a = dashDrag.current;
      dashDrag.current = null;
      if (a) setLine(a.key, (l) => ({ ...l, amount: snapAmount(l.amount) }));
    },
    onHorizontal,
  });

  const animate = draggingKey === null ? undefined : "none";

  return (
    <section
      ref={panelRef}
      aria-label={`${drink.name} layers`}
      className="absolute inset-0 isolate touch-manipulation overflow-hidden rounded-[28px] [clip-path:inset(0_round_28px)] select-none [-webkit-touch-callout:none]"
    >
      {panelHeight > 0 && (
        <>
          {/* The drink, drawn by the liquid shader: v4 blurred bands whose
              boundaries drift slowly, like liquids mixing. */}
          <LiquidCanvas
            layers={liquidLayers}
            resetKey={`${drink.id}-${ordered.length}`}
            dragging={draggingKey !== null}
            background={PAGE_BACKGROUND}
            onReady={setShaderReady}
          />

          {/* Fallback (and first paint): the blurred color bands as CSS (Figma
              v4 recipe), used only until the shader draws or when the device
              can't run it. Later layers paint on top. Bands run past the
              sides; the card clips the extra blur. */}
          {shaderReady !== true &&
            ordered.map((line, i) => {
              const g = layerGeometry(heights[i]);
              return (
                <div
                  key={`band-${drink.id}-${line.key}`}
                  aria-hidden
                  className="absolute"
                  style={{
                    left: -BAND_BLEED,
                    right: -BAND_BLEED,
                    bottom: bottoms[i] - g.overlap,
                    height: g.totalHeight,
                    background: INGREDIENTS[line.ingredient].color,
                    filter: `blur(${g.blur}px)`,
                  }}
                />
              );
            })}

          {/* Film grain over the whole drink, under the labels. */}
          <div aria-hidden className="pointer-events-none absolute inset-0" style={GRAIN_STYLE} />

          {/* While you drag a layer it eases to its ingredient's flat color (hard
              edges, no blur, no gradient, no grain), then eases back to the
              soft look when you let go. Only the opacity animates, which is cheap. */}
          {ordered.map((line, i) => {
            if (line.amount.kind === "garnish") return null;
            const selected = draggingKey === line.key;
            return (
              <div
                key={`flat-${drink.id}-${line.key}`}
                aria-hidden
                className="layer-anim pointer-events-none absolute inset-x-0"
                style={{
                  bottom: bottoms[i],
                  height: heights[i],
                  background: INGREDIENTS[line.ingredient].color,
                  opacity: selected ? 1 : 0,
                  transition: selected
                    ? "opacity 220ms ease-in"
                    : "opacity 380ms ease-out, bottom 180ms ease-out, height 180ms ease-out",
                }}
              />
            );
          })}

          {/* One region per layer: label (name left, amount right) and keyboard control. */}
          {ordered.map((line, i) => {
            const ingredient = INGREDIENTS[line.ingredient];
            // Only the oz is shown for now (JP, 2026-11-15). Parts are still what the
            // drink is stored and calculated in; formatParts brings the label back.
            const amountText = formatAmount(line.amount, DEFAULT_UNIT, servings);
            const isGarnish = line.amount.kind === "garnish";
            const box = { bottom: bottoms[i], height: heights[i], transition: animate };
            // Ingredient name on the left edge, amount on the right edge.
            const label = (
              <span
                className="pointer-events-none absolute inset-x-4 top-1/2 flex -translate-y-1/2 items-baseline justify-between gap-3 text-[11px] leading-4"
                style={{ color: labelColor(ingredient.color) }}
              >
                <span>{ingredient.name}</span>
                <span className="text-right opacity-70 tabular-nums">{amountText}</span>
              </span>
            );

            // OPEN: garnishes as non-volume marks (brief §7). Placeholder: a
            // fixed-size layer that can't be resized.
            if (isGarnish) {
              return (
                <div key={`layer-${drink.id}-${line.key}`} className="layer-anim absolute inset-x-0" style={box}>
                  {label}
                </div>
              );
            }

            // The whole section is the touch target: drag down to expand it,
            // up to shrink it. Only the card in the middle takes drags.
            const canDrag = interactive && !isGarnish;

            return (
              <div
                key={`layer-${drink.id}-${line.key}`}
                role="slider"
                tabIndex={0}
                aria-label={`${ingredient.name}, ${line.role}`}
                aria-valuemin={0}
                aria-valuemax={12}
                aria-valuenow={Math.round(volumeParts(line.amount) * 100) / 100}
                aria-valuetext={amountText}
                aria-orientation="vertical"
                data-layer-drag={canDrag ? "" : undefined}
                className={`layer-anim absolute inset-x-0 touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${
                  canDrag ? (draggingKey === line.key ? "cursor-grabbing" : "cursor-grab") : ""
                }`}
                style={box}
                {...(canDrag ? handlers(line.key) : {})}
                onKeyDown={(e) => {
                  const steps =
                    e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : e.key === "PageUp" ? 4 : e.key === "PageDown" ? -4 : 0;
                  if (!steps) return;
                  e.preventDefault();
                  if (line.amount.kind === "parts") {
                    onEdit(drinkIndex, (prev) => stepShare(prev, line.key, steps));
                  } else {
                    setLine(line.key, (l) => ({ ...l, amount: stepAmount(l.amount, steps) }));
                  }
                }}
              >
                {label}
              </div>
            );
          })}

          {/* Reset: a small black circle at the bottom center. It's only there
              once the drink has been changed. data-no-swipe keeps the carousel
              from grabbing the tap. */}
          <button
            type="button"
            data-no-swipe
            onClick={() => onReset(drinkIndex)}
            aria-label={`Reset ${drink.name}`}
            tabIndex={modified && interactive ? 0 : -1}
            aria-hidden={!modified}
            className={`absolute bottom-4 left-1/2 z-20 grid size-9 -translate-x-1/2 place-items-center rounded-full text-[#F7F7F7] transition-[opacity,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
              modified ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"
            }`}
            style={RESET_STYLE}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </section>
  );
});
