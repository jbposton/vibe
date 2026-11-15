"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DRINKS, type RecipeLine } from "@/data/drinks";
import { INGREDIENTS } from "@/data/ingredients";
import type { Amount } from "@/data/drinks";
import {
  formatAmount,
  layerBottoms,
  layerGeometry,
  layerHeights,
  orderLines,
  snapTrade,
  stepAmount,
  tradeForEdge,
  volumeOz,
} from "@/lib/stack";
import { useLayerDrag } from "./useLayerDrag";

// OPEN: which drink a visitor sees first (brief §1 flow). Placeholder: Negroni.
const START_DRINK = Math.max(0, DRINKS.findIndex((d) => d.id === "negroni"));

/**
 * Film grain over the drink: a tiled, grey fractal-noise texture blended into
 * the colors underneath. It's a static image, so it costs nothing while dragging.
 */
const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/>" +
  "<feColorMatrix type='saturate' values='0'/></filter>" +
  "<rect width='100%' height='100%' filter='url(#n)'/></svg>";
const GRAIN_STYLE: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`,
  backgroundSize: "180px 180px",
  mixBlendMode: "overlay",
  opacity: 0.45,
};

/** Half the height of a divider's touch target: 20px above and 20px below the line. */
const HANDLE_HALF = 20;

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
  // `baseLines` is the recipe the blurred bands were last drawn at. While the
  // amounts change, the bands are only stretched and moved (cheap for the
  // graphics chip) instead of being re-blurred every frame. Shortly after
  // things settle, the bands are redrawn at their true size (`baseVersion`).
  const [state, setState] = useState(() => ({
    index: START_DRINK,
    lines: DRINKS[START_DRINK].lines,
    baseLines: DRINKS[START_DRINK].lines,
    baseVersion: 0,
  }));
  const drink = DRINKS[state.index];
  const modified = state.lines !== drink.lines;

  // Measure the panel: the stack fills its full inner height.
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

  const ordered = orderLines(state.lines);
  const heights = layerHeights(ordered, panelHeight);
  const bottoms = layerBottoms(heights);

  // Geometry the bands were drawn at (same layers, same order).
  const baseHeights = layerHeights(orderLines(state.baseLines), panelHeight);
  const baseBottoms = layerBottoms(baseHeights);

  const setLine = (key: number, update: (line: RecipeLine) => RecipeLine) =>
    setState((s) => ({
      ...s,
      lines: s.lines.map((l, i) => (i === key ? update(l) : l)),
    }));

  const goTo = (delta: number) =>
    setState((s) => {
      const index = (s.index + delta + DRINKS.length) % DRINKS.length;
      const lines = DRINKS[index].lines;
      return { index, lines, baseLines: lines, baseVersion: s.baseVersion + 1 };
    });

  const reset = () => setState((s) => ({ ...s, lines: DRINKS[s.index].lines }));

  // Dragging a divider trades volume between the two layers it separates, so
  // the line follows the finger and the rest of the drink stays put. Amounts
  // follow the finger smoothly and snap to ¼ oz (or whole dashes) on release.
  // A drag is identified by the key of the layer BELOW the line.
  const updatePair = (
    lowerKey: number,
    compute: (lines: RecipeLine[], upperKey: number) => [Amount, Amount],
  ) =>
    setState((s) => {
      const ordered = orderLines(s.lines);
      const upperKey = ordered[ordered.findIndex((l) => l.key === lowerKey) + 1]?.key;
      if (upperKey === undefined) return s;
      const [a, b] = compute(s.lines, upperKey);
      return {
        ...s,
        lines: s.lines.map((l, i) =>
          i === lowerKey ? { ...l, amount: a } : i === upperKey ? { ...l, amount: b } : l,
        ),
      };
    });

  const { handlers, draggingKey } = useLayerDrag({
    onMove: (lowerKey, clientY) => {
      const el = panelEl.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const innerBottom = rect.bottom - el.clientTop; // skip the border
      const edge = Math.min(panelHeight, Math.max(0, innerBottom - clientY));
      updatePair(lowerKey, (lines, upperKey) => tradeForEdge(lines, lowerKey, upperKey, edge, panelHeight));
    },
    onEnd: (lowerKey) =>
      updatePair(lowerKey, (lines, upperKey) => snapTrade(lines[lowerKey].amount, lines[upperKey].amount)),
  });

  // Once nothing has moved for a moment, redraw the bands at their true size.
  useEffect(() => {
    if (draggingKey !== null || state.baseLines === state.lines) return;
    const timer = setTimeout(
      () =>
        setState((s) =>
          s.baseLines === s.lines ? s : { ...s, baseLines: s.lines, baseVersion: s.baseVersion + 1 },
        ),
      400,
    );
    return () => clearTimeout(timer);
  }, [draggingKey, state.lines, state.baseLines]);

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

  const animate = draggingKey === null ? undefined : "none";
  const navButton =
    "grid size-11 place-items-center rounded-full text-lg text-[#F7F7F7]/60 hover:text-[#F7F7F7] focus-visible:outline-2 focus-visible:outline-[#F7F7F7]";

  return (
    <main className="fixed inset-0 flex flex-col gap-4 bg-[#141414] p-4 text-[#F7F7F7] md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-8">
      {/* ── Information ───────────────────────────────────────────── */}
      <section aria-label="Drink information" className="flex flex-col">
        {/* Drink switcher (placeholder until the Finder exists) */}
        <div className="-mr-3 flex items-center gap-1">
          {/* Reset is always shown (phone and web); it's dimmed until something has changed. */}
          <button
            type="button"
            onClick={reset}
            disabled={!modified}
            className="h-8 rounded-full border border-[#F7F7F7]/25 px-3 text-xs text-[#F7F7F7]/80 transition-opacity hover:border-[#F7F7F7]/60 hover:text-[#F7F7F7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] disabled:pointer-events-none disabled:opacity-35"
          >
            Reset
          </button>
          <span className="ml-auto text-xs tabular-nums text-[#F7F7F7]/45" aria-live="polite">
            {state.index + 1} / {DRINKS.length}
          </span>
          <button type="button" onClick={() => goTo(-1)} aria-label="Previous drink" className={navButton}>
            ‹
          </button>
          <button type="button" onClick={() => goTo(1)} aria-label="Next drink" className={navButton}>
            ›
          </button>
        </div>

        <h1 className="mt-2 text-[22px] font-semibold leading-7">{drink.name}</h1>
        <p className="mt-1 text-xs opacity-55">{drink.family}</p>
        <p className="mt-3 text-[11px] leading-4 text-[#F7F7F7]/45">{caption}</p>

        {/* OPEN: gesture hints (brief §6). Placeholder: one line of text until the first change. */}
        <p
          className={`mt-3 text-[11px] text-[#F7F7F7]/45 ${modified ? "invisible" : ""}`}
          aria-hidden={modified}
        >
          Drag a line to move volume between the two layers it separates.
        </p>
      </section>

      {/* ── Drink panel ───────────────────────────────────────────── */}
      <section
        ref={panelRef}
        aria-label={`${drink.name} layers`}
        className="relative min-h-0 flex-1 touch-manipulation overflow-hidden border border-white select-none [-webkit-touch-callout:none] md:h-full"
      >
        {panelHeight > 0 && (
          <>
            {/* The blurred color bands (Figma v4 recipe). Later layers paint on top.
                Bands run past the sides; the panel's border clips the extra blur. */}
            {ordered.map((line, i) => {
              // Drawn (and blurred) once at the base size, then stretched and
              // moved to the current size with a transform.
              const base = layerGeometry(baseHeights[i]);
              const now = layerGeometry(heights[i]);
              const baseBottom = baseBottoms[i] - base.overlap;
              const nowBottom = bottoms[i] - now.overlap;
              const stretch = now.totalHeight / base.totalHeight;
              return (
                <div
                  key={`band-${drink.id}-${state.baseVersion}-${line.key}`}
                  aria-hidden
                  className="band absolute -inset-x-32"
                  style={{
                    bottom: baseBottom,
                    height: base.totalHeight,
                    background: INGREDIENTS[line.ingredient].color,
                    filter: `blur(${base.blur}px)`,
                    transformOrigin: "bottom",
                    transform: `translateY(${baseBottom - nowBottom}px) scaleY(${stretch})`,
                    transition: draggingKey === null ? "transform 180ms ease-out" : "none",
                    willChange: "transform",
                  }}
                />
              );
            })}

            {/* Film grain over the whole drink, under the labels and lines. */}
            <div aria-hidden className="pointer-events-none absolute inset-0" style={GRAIN_STYLE} />

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
                  className="layer-anim absolute inset-x-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                  style={box}
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

            {/* Divider lines between layers. Dragging one trades volume between
                the two layers it separates, with a 40px touch target (20px
                above and 20px below the line). A line next to a garnish can't
                trade (a garnish has no volume), so it's locked and drawn fainter. */}
            {ordered.slice(0, -1).map((below, i) => {
              const y = bottoms[i + 1];
              const above = ordered[i + 1];
              const draggable = below.amount.kind !== "garnish" && above.amount.kind !== "garnish";
              const active = draggingKey === below.key;
              return (
                <div
                  key={`divider-${drink.id}-${below.key}`}
                  aria-hidden
                  className={`layer-anim group absolute inset-x-0 ${
                    draggable ? (active ? "cursor-grabbing" : "cursor-row-resize") : "pointer-events-none"
                  } touch-none select-none`}
                  style={{ bottom: y - HANDLE_HALF, height: HANDLE_HALF * 2, transition: animate }}
                  {...(draggable ? handlers(below.key) : {})}
                >
                  <div
                    className={`absolute inset-x-0 top-1/2 -translate-y-1/2 bg-white transition-[height,opacity] ${
                      active
                        ? "h-0.5 opacity-80"
                        : draggable
                          ? "h-px opacity-40 group-hover:h-0.5 group-hover:opacity-70"
                          : "h-px opacity-15"
                    }`}
                  />
                </div>
              );
            })}
          </>
        )}
      </section>
    </main>
  );
}
