"use client";

import { memo, useCallback, useRef, useState } from "react";
import type { Drink, RecipeLine } from "@/data/drinks";
import { INGREDIENTS } from "@/data/ingredients";
import {
  formatAmount,
  layerBottoms,
  layerGeometry,
  layerHeights,
  orderLines,
  snapTrade,
  type StackLine,
  stepAmount,
  tradeForEdge,
  volumeOz,
} from "@/lib/stack";
import { LiquidCanvas, type LiquidLayer } from "./LiquidCanvas";
import { GRAIN_STYLE } from "./surfaceEffects";
import { useLayerDrag } from "./useLayerDrag";

/** The two layers a section drag trades between. */
type Pair = { lowerKey: number; upperKey: number };

/**
 * Which neighbor a section trades with when dragged: the layer below if it
 * holds volume (so the section's bottom line follows the finger), otherwise
 * the layer above (the base layer has nothing below it). Garnishes (no volume)
 * can't trade.
 */
function tradePartner(ordered: StackLine[], key: number): Pair | null {
  const i = ordered.findIndex((l) => l.key === key);
  const liquid = (l: StackLine | undefined) => !!l && l.amount.kind !== "garnish";
  if (i < 0 || !liquid(ordered[i])) return null;
  if (liquid(ordered[i - 1])) return { lowerKey: ordered[i - 1].key, upperKey: key };
  if (liquid(ordered[i + 1])) return { lowerKey: key, upperKey: ordered[i + 1].key };
  return null;
}

/** The page's warm black, also shown by the shader above and below the drink. */
const PAGE_BACKGROUND = "#1A1612";

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
  /** True for the drink in view: its colors mix. Other cards sit still. */
  active: boolean;
  /** A drag on a section turned out to be a sideways swipe. */
  onHorizontal: (clientX: number, pointerId: number) => void;
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
  active,
  onHorizontal,
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

  // Dragging a section trades volume with a neighbor: down expands it (more
  // of this ingredient), up shrinks it (less). The line shared with that
  // neighbor follows the finger and the rest of the drink stays put. Amounts
  // follow the finger smoothly and snap to ¼ oz (or whole dashes) on release.
  const drag = useRef<{ pair: Pair; startY: number; startEdge: number; scale: number } | null>(null);

  const setPair = (lowerKey: number, upperKey: number, pick: (prev: RecipeLine[]) => [RecipeLine["amount"], RecipeLine["amount"]]) =>
    onEdit(drinkIndex, (prev) => {
      const [a, b] = pick(prev);
      return prev.map((l, i) => (i === lowerKey ? { ...l, amount: a } : i === upperKey ? { ...l, amount: b } : l));
    });

  const { handlers, draggingKey } = useLayerDrag({
    onStart: (key, clientY) => {
      const pair = tradePartner(ordered, key);
      if (!pair) return;
      // Where the shared line is now, in px above the stack bottom.
      const idx = ordered.findIndex((l) => l.key === pair.lowerKey);
      const el = panelEl.current;
      // On screen the card may be scaled (carousel); drags are in screen px.
      const scale = el && el.offsetHeight > 0 ? el.getBoundingClientRect().height / el.offsetHeight : 1;
      drag.current = { pair, startY: clientY, startEdge: bottoms[idx] + heights[idx], scale };
    },
    onMove: (_key, clientY) => {
      const d = drag.current;
      if (!d) return;
      const down = (clientY - d.startY) / d.scale; // px moved down
      // The shared line always follows the finger. Usually it's the section's
      // bottom line, so down expands the section. For the base layer it's the
      // top line (JP's choice), so down shrinks the base instead.
      const edge = Math.min(panelHeight, Math.max(0, d.startEdge - down));
      const { lowerKey, upperKey } = d.pair;
      setPair(lowerKey, upperKey, (prev) => tradeForEdge(prev, lowerKey, upperKey, edge, panelHeight));
    },
    onEnd: () => {
      const d = drag.current;
      drag.current = null;
      if (!d) return;
      const { lowerKey, upperKey } = d.pair;
      setPair(lowerKey, upperKey, (prev) => snapTrade(prev[lowerKey].amount, prev[upperKey].amount));
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
            active={active}
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
            const amountText = formatAmount(line.amount);
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
            const canDrag = interactive && tradePartner(ordered, line.key) !== null;

            return (
              <div
                key={`layer-${drink.id}-${line.key}`}
                role="slider"
                tabIndex={0}
                aria-label={`${ingredient.name}, ${line.role}`}
                aria-valuemin={0}
                aria-valuemax={12}
                aria-valuenow={Math.round(volumeOz(line.amount) * 100) / 100}
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
                  setLine(line.key, (l) => ({ ...l, amount: stepAmount(l.amount, steps) }));
                }}
              >
                {label}
              </div>
            );
          })}
        </>
      )}
    </section>
  );
});
