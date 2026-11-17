"use client";

import { memo, useCallback, useRef, useState } from "react";
import type { Drink, RecipeLine } from "@/data/drinks";
import { INGREDIENTS } from "@/data/ingredients";
import {
  DEFAULT_UNIT,
  dragEdge,
  MAX_DASHES,
  formatAmount,
  layerBottoms,
  layerGeometry,
  layerHeights,
  MIN_LAYER,
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

/**
 * The amount button on each layer (Figma 93:378): a faint dark (on light
 * layers) or light (on dark layers) fill with a touch of background blur. Its
 * only outline is the 0.5px highlight along the top edge (see GlassTopEdge).
 */
function amountButtonStyle(lightLayer: boolean, shown = true): React.CSSProperties {
  const fill = lightLayer ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)";
  const blur = shown ? "blur(4px)" : "blur(0px)";
  return {
    background: shown ? fill : "rgba(0,0,0,0)",
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
    transition: "background-color 180ms ease-out, backdrop-filter 180ms ease-out, -webkit-backdrop-filter 180ms ease-out",
  };
}

/**
 * The glass highlight: a 0.5px line along the top edge that is bright at the
 * left and fades to 20% about halfway across, following the rounded corners.
 * It sits inside its (relatively positioned) parent and takes the parent's radius.
 */
function GlassTopEdge({ shown = true }: { shown?: boolean }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200"
      style={{
        opacity: shown ? 1 : 0,
        padding: "0.5px 0 0 0",
        background: "linear-gradient(105deg, #fff 0%, rgba(255,255,255,0.2) 46%)",
        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        maskComposite: "exclude",
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
      }}
    />
  );
}

/**
 * How the drink is drawn. false (current, JP 2026-11-16): each layer is a flat
 * block of its ingredient's color. true: the blurred, slowly mixing liquid
 * shader (LiquidCanvas.tsx, with its CSS fallback bands and film grain), which
 * is kept so we can go back by flipping this one switch.
 */
const USE_SHADER = false;

/** The page's warm black, also shown by the shader above and below the drink. */
const PAGE_BACKGROUND = "#1A1612";

/** The tallest the base ingredient's wave can rise (px) above its top line. */
const WAVE_AMPLITUDE = 26;
/** Room (px) kept free at the top of the layer above for its label (14px down + 32px row + a margin). */
const WAVE_TEXT_ROOM = 52;

/**
 * The base ingredient's wave: smooth, round humps with no sharp points, as a sine curve with a
 * random phase and 1.5 to 2.25 humps across the card. The same seed always gives the same curve.
 * Returns the outline of the base color in a strip `amp + 1` tall (drawn in a 100-wide box that
 * stretches to the card), rising up to `amp` above the strip's bottom line.
 */
function wavePath(seed: string, amp: number): { d: string; h: number } {
  let a = 0;
  for (let i = 0; i < seed.length; i++) a = (Math.imul(a, 31) + seed.charCodeAt(i)) | 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const h = amp + 1;
  const humps = 1.5 + rand() * 0.75;
  const phase = rand() * Math.PI * 2;
  const N = 80;
  let d = `M0 ${h}`;
  for (let k = 0; k <= N; k++) {
    const x = (k * 100) / N;
    const rise = amp * (0.5 + 0.5 * Math.sin((x / 100) * humps * Math.PI * 2 + phase));
    d += ` L${x.toFixed(2)} ${(amp - rise).toFixed(2)}`;
  }
  return { d: `${d} L100 ${h} Z`, h };
}

/** Distance from the top of a layer to its label row (the 32px-tall row centered in a 60px layer). */
const LABEL_TOP = 14;
/** A top layer at least this tall (px) gets 15px more above its label, to clear the card's rounded corners. OPEN: the threshold is a first guess. */
const TALL_TOP_LAYER = 90;

/** Finger travel (px) that adds or removes one dash. */
const DASH_DRAG_PX = 16;

/** How far each fallback color band runs past the card's sides (the card clips it). */
const BAND_BLEED = 128;

/** Dark text on light colors, light text on dark ones, so labels stay readable. */
function labelColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.18 ? "#F7F7F7" : "#000";
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
    const g = layerGeometry(heights[i], line.amount.kind === "garnish");
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
      const amount = ordered[i].amount;
      if (amount.kind === "parts") {
        // The edge is measured in the steady layout the drag follows (see dragEdge),
        // so the finger and the amount stay in step even when layers are squeezed.
        const startEdge = dragEdge(lines, key, edgeOf, panelHeight);
        shareDrag.current = { key, edgeOf, startY: clientY, startEdge, scale, base: lines };
      } else if (amount.kind === "dash") {
        // Down adds dashes (up for the base layer, matching the other layers).
        dashDrag.current = { key, down: i === 0 ? -1 : 1, startY: clientY, startCount: amount.count, scale };
      }
    },
    // Once it is clearly a vertical drag, measure from the finger's position now, so the
    // layer doesn't jump by the few pixels the gesture needed to be recognized.
    onEngage: (_key, clientY) => {
      if (shareDrag.current) shareDrag.current.startY = clientY;
      if (dashDrag.current) dashDrag.current.startY = clientY;
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

  // Which layers are at their smallest height on screen (the 60px minimum); outside a drag
  // their text is centered (the top layer is the exception: see where the label is drawn).
  const smallNow: Record<number, boolean> = {};
  ordered.forEach((l, i) => {
    smallNow[l.key] = heights[i] <= MIN_LAYER + 0.5;
  });

  return (
    <section
      ref={panelRef}
      aria-label={`${drink.name} layers`}
      className="absolute inset-0 isolate touch-manipulation overflow-hidden rounded-[38px] [clip-path:inset(0_round_38px)] select-none [-webkit-touch-callout:none]"
    >
      {panelHeight > 0 && (
        <>
          {/* USE_SHADER only: the drink, drawn by the liquid shader: v4 blurred bands
              whose boundaries drift slowly, like liquids mixing. */}
          {USE_SHADER && (
            <LiquidCanvas
              layers={liquidLayers}
              resetKey={`${drink.id}-${ordered.length}`}
              dragging={draggingKey !== null}
              background={PAGE_BACKGROUND}
              onReady={setShaderReady}
            />
          )}

          {/* Fallback (and first paint): the blurred color bands as CSS (Figma
              v4 recipe), used only until the shader draws or when the device
              can't run it. Later layers paint on top. Bands run past the
              sides; the card clips the extra blur. */}
          {USE_SHADER &&
            shaderReady !== true &&
            ordered.map((line, i) => {
              const g = layerGeometry(heights[i], line.amount.kind === "garnish");
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

          {/* USE_SHADER only: film grain over the whole drink, under the labels. */}
          {USE_SHADER && <div aria-hidden className="pointer-events-none absolute inset-0" style={GRAIN_STYLE} />}

          {/* The flat colors: one block per layer in its ingredient's color (hard
              edges, no blur, no gradient, no grain). Always shown now; with
              USE_SHADER they only show while you drag, and fade back to the soft
              look when you let go (only the opacity animates, which is cheap). */}
          {ordered.map((line, i) => {
            const selected = !USE_SHADER || draggingKey !== null;
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
                  transition: !USE_SHADER
                    ? animate ?? "bottom 180ms ease-out, height 180ms ease-out"
                    : selected
                      ? "opacity 220ms ease-in"
                      : "opacity 380ms ease-out, bottom 180ms ease-out, height 180ms ease-out",
                }}
              />
            );
          })}

          {/* A wave along the top of the base ingredient: its color rises into the layer above in
              smooth round humps (JP, 2026-11-16). The shape is random but fixed for each drink, and
              it follows the layer as you drag. It is shorter when the layer above is short, so it
              never runs under that layer's label. Not drawn when the layer above is a garnish. */}
          {(() => {
            const base = ordered[0];
            const above = ordered[1];
            if (!base || !above || above.amount.kind === "garnish") return null;
            const amp = Math.max(0, Math.min(WAVE_AMPLITUDE, heights[1] - WAVE_TEXT_ROOM));
            if (amp < 2) return null;
            const { d, h } = wavePath(`${drink.id}-${base.key}`, amp);
            return (
              <svg
                key={`wave-${drink.id}-${base.key}`}
                aria-hidden
                className="layer-anim pointer-events-none absolute inset-x-0"
                width="100%"
                height={h}
                viewBox={`0 0 100 ${h}`}
                preserveAspectRatio="none"
                style={{
                  bottom: bottoms[0] + heights[0] - 1,
                  transition: animate ?? "bottom 180ms ease-out, height 180ms ease-out",
                }}
              >
                <rect width="100" height={h} fill={INGREDIENTS[above.ingredient].color} />
                <path d={d} fill={INGREDIENTS[base.ingredient].color} />
              </svg>
            );
          })()}

          {/* One region per layer: label (name left, amount right) and keyboard control. */}
          {ordered.map((line, i) => {
            const ingredient = INGREDIENTS[line.ingredient];
            // Only the oz is shown for now (JP, 2026-11-15). Parts are still what the
            // drink is stored and calculated in; formatParts brings the label back.
            const amountText = formatAmount(line.amount, DEFAULT_UNIT, servings);
            const isGarnish = line.amount.kind === "garnish";
            const box = { bottom: bottoms[i], height: heights[i], transition: animate };
            // Ingredient name on the left edge; on the right, the amount in a
            // small button (it will be clickable one day) or "Garnish".
            // The button around the amount only shows while you press or drag (JP, 2026-11-16).
            const pressing = draggingKey !== null;
            const ink = labelColor(ingredient.color);
            const lightLayer = ink === "#000";
            const [amountNumber, ...amountUnit] = amountText.split(" ");
            // The label sits near the top of its layer, 14px down: the same distance as when it is
            // centered in a minimum-height (60px) layer, so it doesn't move when the alignment
            // changes. The top layer's label is 15px lower, clear of the card's rounded
            // corners, but only when that layer is tall enough for the corners to matter. (The lines and edge ticks that were tried here are gone: JP, 2026-11-16.)
            const lineTop = LABEL_TOP + (i === ordered.length - 1 && heights[i] >= TALL_TOP_LAYER ? 15 : 0);
            // A layer at its minimum height has its text centered in it instead (held during a drag).
            // The top layer: centered if it is a garnish, top-aligned if not (always, drag or not).
            // Every other layer: top-aligned during a drag, and centered only at the minimum height.
            const isTop = i === ordered.length - 1;
            const small = isTop ? isGarnish : draggingKey === null && smallNow[line.key];
            const label = (
              <span
                className="label-anim pointer-events-none absolute left-[22px] right-[22px] flex h-8 items-center justify-between gap-3 text-xs leading-4"
                style={{ color: ink, top: small ? "calc(50% - 16px)" : lineTop }}
              >
                <span>{ingredient.name}</span>
                {isGarnish ? (
                  <span className="opacity-60">Garnish</span>
                ) : (
                  <span
                    // -mr-2 cancels the button's right padding, so the "oz" text ends exactly where
                    // "Garnish" does (the button's chrome, shown while you drag, reaches 8px past it).
                    className="relative -mr-2 flex h-8 items-center gap-1 rounded-full px-2 text-xs tabular-nums"
                    style={amountButtonStyle(lightLayer, pressing)}
                  >
                    <GlassTopEdge shown={pressing} />
                    <span className="text-[13px]">{amountNumber}</span>
                    <span className="opacity-60">{amountUnit.join(" ")}</span>
                  </span>
                )}
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

          {/* Reset: a small glass circle (same look as the amount buttons) at the bottom center. It's only there
              once the drink has been changed. data-no-swipe keeps the carousel
              from grabbing the tap. */}
          <button
            type="button"
            data-no-swipe
            onClick={() => onReset(drinkIndex)}
            aria-label={`Reset ${drink.name}`}
            tabIndex={modified && interactive ? 0 : -1}
            aria-hidden={!modified}
            className={`absolute bottom-4 left-1/2 z-20 grid size-[45px] -translate-x-1/2 place-items-center rounded-full text-[#F7F7F7] transition-[opacity,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
              modified ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"
            }`}
            style={amountButtonStyle(true)}
          >
            <GlassTopEdge />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </section>
  );
});
