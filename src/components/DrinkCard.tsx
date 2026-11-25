"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
/** How fast the wave slides along at full size (radians per second: about one hump every 5.5 seconds). */
const WAVE_SPEED = 1.15;
/** How long the wave takes to settle to a still, flat line when you start dragging, and to come back after. */
const WAVE_DOWN_MS = 1200;
const WAVE_UP_MS = 2400;
/** Room (px) kept free at the top of the layer above for its label (14px down + 32px row + a margin). */
const WAVE_TEXT_ROOM = 52;

/**
 * The slosh (JP, 2026-11-25): when the card tilts, the liquid tries to stay level with the ground, runs past
 * level, and rocks back and forth until it calms. Two damped springs: `side` is one edge up and the other
 * down (the main slosh), `middle` is the center rising and falling (the smaller, quicker wave on top). Tune here.
 */
const SLOSH = {
  sideSpeed: 6.4, // how fast it rocks (radians per second: 6.4 is about one rock every second)
  sideDamping: 0.14, // how quickly it calms (0 never, 1 no rocking at all)
  middleSpeed: 10.4,
  middleDamping: 0.16,
  middleSize: 0.34, // the middle wave's size against the main one
  lively: 2, // how much faster the little humps travel while the liquid is stirred up
  limit: 55, // the most an edge rises or falls (px)
  leaving: 14, // how fast a drink that leaves the main position goes flat (higher is quicker)
};

/**
 * The base ingredient's wave: smooth, round humps with no sharp points, as a sine curve with a
 * random phase and 1.5 to 2.25 humps across the card. The same seed always gives the same curve.
 * On top of that the slosh moves the surface: `side` px up at one edge and down at the other, and `middle`
 * px up in the center and down at the edges.
 * Returns the outline of the base color in a strip (drawn in a 100-wide box that stretches to the card).
 * `dip` is how far the strip reaches below the layer's top line, for where the surface falls under it.
 */
function wavePath(seed: string, amp: number, phaseShift = 0, side = 0, middle = 0): { d: string; h: number; dip: number } {
  let a = 0;
  for (let i = 0; i < seed.length; i++) a = (Math.imul(a, 31) + seed.charCodeAt(i)) | 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const humps = 1.5 + rand() * 0.75;
  const phase = rand() * Math.PI * 2 + phaseShift;
  const N = 80;
  // How far the surface stands above the layer's top line at each point (below it when negative).
  const rises = Array.from({ length: N + 1 }, (_, k) => {
    const u = k / N - 0.5; // -0.5 at the left edge, 0.5 at the right
    return (
      amp * (0.5 + 0.5 * Math.sin((u + 0.5) * humps * Math.PI * 2 + phase)) +
      side * Math.sin(u * Math.PI) +
      middle * Math.cos(u * Math.PI * 2)
    );
  });
  const top = Math.max(amp, ...rises);
  const dip = Math.max(0, -Math.min(...rises));
  const h = top + dip + 1;
  let d = `M0 ${h}`;
  rises.forEach((rise, k) => {
    d += ` L${((k * 100) / N).toFixed(2)} ${(top - rise).toFixed(2)}`;
  });
  return { d: `${d} L100 ${h} Z`, h, dip };
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
  /** True for the drink the screen is showing (even with the edit drawer up). Starts its wave. */
  inView: boolean;
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
  inView,
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

  // The base wave runs all the time (JP, 2026-11-18): it slides along at full size, and while you
  // drag a layer it eases down to a still, flat line, then slowly comes back when you let go. It is
  // drawn straight onto the SVG every frame (no React render per frame). `k` is its size (0 to 1).
  const waveSvg = useRef<SVGSVGElement | null>(null);
  const waveRect = useRef<SVGRectElement | null>(null);
  const wavePathEl = useRef<SVGPathElement | null>(null);
  const waveState = useRef({ k: 1, phase: 0, from: 1, to: 1, t0: 0 });
  const waveGeom = useRef({ maxAmp: 0, seed: "", sloshRoom: 0 });
  const slosh = useRef({ side: 0, sideV: 0, middle: 0, middleV: 0 });
  const waveTarget = useRef(1);
  const drawWave = useCallback(() => {
    const svg = waveSvg.current;
    const rect = waveRect.current;
    const path = wavePathEl.current;
    if (!svg || !rect || !path) return;
    const { maxAmp, seed, sloshRoom } = waveGeom.current;
    const amp = maxAmp * waveState.current.k;
    // The slosh eases off toward its limit instead of stopping dead against it.
    const soft = (v: number) => (sloshRoom > 0 ? sloshRoom * Math.tanh(v / sloshRoom) : 0);
    const side = soft(slosh.current.side);
    const middle = soft(slosh.current.middle) * 0.6;
    // Hidden when it is too short to matter or has settled flat (not at 2px, which popped).
    if (!(maxAmp >= 2) || (!(amp >= 0.05) && Math.abs(side) < 0.3 && Math.abs(middle) < 0.3)) {
      svg.style.display = "none";
      return;
    }
    svg.style.display = "";
    const { d, h, dip } = wavePath(seed, amp, waveState.current.phase, side, middle);
    // The strip hangs below the layer's top line by as far as the surface dips under it.
    svg.style.transform = dip > 0 ? `translateY(${dip.toFixed(2)}px)` : "";
    svg.setAttribute("height", String(h));
    svg.setAttribute("viewBox", `0 0 100 ${h}`);
    rect.setAttribute("height", String(Math.max(0, h - 1)));
    path.setAttribute("d", d);
  }, []);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      waveState.current.k = 0; // with "reduce motion" the line stays flat
      drawWave();
      return;
    }
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const w = waveState.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (waveTarget.current !== w.to) {
        w.from = w.k;
        w.to = waveTarget.current;
        w.t0 = now;
      }
      const p = Math.min(1, (now - w.t0) / (w.to < w.from ? WAVE_DOWN_MS : WAVE_UP_MS));
      w.k = w.from + (w.to - w.from) * (0.5 - 0.5 * Math.cos(Math.PI * p)); // smooth at both ends
      // The slosh. The carousel writes the card's tilt (degrees) on the box around the card; to stay level
      // the liquid would have to stand this much higher at one edge. It chases that and overshoots.
      // Only the drink in the main position sloshes: the others don't react to the tilt at all.
      const card = panelEl.current;
      const tilt = inView ? Number(card?.parentElement?.dataset.tilt ?? 0) : 0;
      const level = card ? Math.tan((tilt * Math.PI) / 180) * (card.clientWidth / 2) : 0;
      const s = slosh.current;
      if (!inView) {
        // One that has just left eases flat in about a quarter of a second (snapping flat would show), then stops.
        const fade = Math.exp(-dt * SLOSH.leaving);
        s.side *= fade;
        s.middle *= fade;
        s.sideV = s.middleV = 0;
      }
      for (let step = 0; inView && step < 3; step++) {
        const h = dt / 3;
        s.sideV += (SLOSH.sideSpeed ** 2 * (level - s.side) - 2 * SLOSH.sideDamping * SLOSH.sideSpeed * s.sideV) * h;
        s.side += s.sideV * h;
        s.middleV += (SLOSH.middleSpeed ** 2 * (Math.abs(level) * SLOSH.middleSize - s.middle) - 2 * SLOSH.middleDamping * SLOSH.middleSpeed * s.middleV) * h;
        s.middle += s.middleV * h;
      }
      const calm = level === 0 && Math.abs(s.side) < 0.3 && Math.abs(s.sideV) < 3 && Math.abs(s.middle) < 0.3 && Math.abs(s.middleV) < 3;
      if (calm) s.side = s.sideV = s.middle = s.middleV = 0;
      const stirred = Math.min(1, (Math.abs(s.sideV) + Math.abs(s.middleV)) / 220);
      // The humps travel only on the drink in view; they slow as the wave shrinks, so it comes to a stop.
      if (inView) w.phase += dt * WAVE_SPEED * w.k * (1 + SLOSH.lively * stirred);
      drawWave();
      // A card that has left the middle keeps going only until its liquid is flat again.
      if (inView || !calm) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, drawWave]);

  const ordered = orderLines(lines);
  const heights = layerHeights(ordered, panelHeight);
  const bottoms = layerBottoms(heights);

  // Tell the wave how tall it may get (it stays clear of the label in the layer above) and redraw it
  // after every render, so it follows the layers as they change.
  const waveMax = ordered[1] ? Math.max(0, Math.min(WAVE_AMPLITUDE, heights[1] - WAVE_TEXT_ROOM)) : 0;
  const waveSeed = ordered[0] ? `${drink.id}-${ordered[0].key}` : "";
  // The slosh has less room when either layer beside the line is thin.
  const sloshRoom = ordered[1] ? Math.max(0, Math.min(SLOSH.limit, heights[1] - 30 - waveMax, heights[0] - 24)) : 0;
  useLayoutEffect(() => {
    waveGeom.current = { maxAmp: waveMax, seed: waveSeed, sloshRoom };
    drawWave();
  });

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

  // The wave settles while a layer is being dragged and comes back after.
  useEffect(() => {
    waveTarget.current = draggingKey === null ? 1 : 0;
  }, [draggingKey]);

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
              it follows the layer as you drag. It runs all the time and settles flat while you drag a layer. It is shorter when the layer above is short, so it
              never runs under that layer's label. Not drawn when the layer above is a garnish. */}
          {(() => {
            const base = ordered[0];
            const above = ordered[1];
            if (!base || !above || above.amount.kind === "garnish") return null;
            return (
              <svg
                key={`wave-${drink.id}-${base.key}`}
                ref={waveSvg}
                aria-hidden
                // Size, viewBox and shape are written by drawWave every frame, not by React.
                className="pointer-events-none absolute inset-x-0"
                width="100%"
                height={1}
                viewBox="0 0 100 1"
                preserveAspectRatio="none"
                style={{
                  display: "none",
                  bottom: bottoms[0] + heights[0] - 1,
                  transition: animate ?? "bottom 180ms ease-out",
                }}
              >
                {/* The layer-above color stops 1px short of the strip's bottom edge: the wave shape covers
                    that last pixel row completely, so no thin line of the upper color shows along the edge
                    (two shapes sharing an edge both blend with what is under them, leaving a faint line). */}
                <rect ref={waveRect} width="100" height={0} fill={INGREDIENTS[above.ingredient].color} />
                <path ref={wavePathEl} fill={INGREDIENTS[base.ingredient].color} />
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
                {/* The name in capitals, medium weight, at 60% (Figma 187:43). */}
                <span className="text-[11px] font-medium uppercase tracking-[0.008em] opacity-60 md:text-[length:var(--layer-name-size,11px)]">{ingredient.name}</span>
                {isGarnish ? (
                  <span className="opacity-60 md:text-[length:var(--layer-unit-size,14px)]">Garnish</span>
                ) : (
                  <span
                    // -mr-2 cancels the button's right padding, so the "oz" text ends exactly where
                    // "Garnish" does (the button's chrome, shown while you drag, reaches 8px past it).
                    className="relative -mr-2 flex h-8 items-center gap-1 rounded-full px-2 text-xs tabular-nums"
                    style={amountButtonStyle(lightLayer, pressing)}
                  >
                    <GlassTopEdge shown={pressing} />
                    <span className="text-[13px] md:text-[length:var(--layer-amount-size,16px)]">{amountNumber}</span>
                    <span className="opacity-60 md:text-[length:var(--layer-unit-size,14px)]">{amountUnit.join(" ")}</span>
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

          {/* Reset: a small circle on a dark see-through background, at the bottom center. It's only there
              once the drink has been changed. data-no-swipe keeps the carousel
              from grabbing the tap. */}
          <button
            type="button"
            data-no-swipe
            onClick={() => onReset(drinkIndex)}
            aria-label={`Reset ${drink.name}`}
            tabIndex={modified && interactive ? 0 : -1}
            aria-hidden={!modified}
            className={`absolute bottom-4 left-1/2 z-20 grid size-9 -translate-x-1/2 place-items-center rounded-full bg-black/30 text-[#F7F7F7] transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
              modified ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {/* The reset icon (Figma 204:48): a box with the drawn arrow inset inside it, 20px so it fits the 36px button. */}
            <span aria-hidden className="relative block size-5">
              <span className="absolute inset-[10.83%_14.58%_14.58%_15.79%]">
                <span className="absolute inset-[-4.19%_-4.49%]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src="/icons/reset.svg" className="block size-full max-w-none" />
                </span>
              </span>
            </span>
          </button>
        </>
      )}
    </section>
  );
});
