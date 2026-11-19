"use client";

import { memo, useCallback, useRef, useState } from "react";
import type { Drink, RecipeLine } from "@/data/drinks";
import { INGREDIENTS } from "@/data/ingredients";
import {
  DEFAULT_UNIT,
  MAX_DASHES,
  formatAmount,
  orderLines,
  shareLines,
  snapAmount,
  snapShare,
  stepAmount,
  stepShare,
  volumeParts,
} from "@/lib/stack";
import { LAYER_GRAIN_STYLE } from "./surfaceEffects";
import { useLayerDrag } from "./useLayerDrag";

/**
 * The drink as a stack of 3D square slabs, one per ingredient, base at the bottom, turning slowly
 * (prototyped 2026-11-18, building on Concept B). Each slab's thickness is its amount. Same props as
 * DrinkCard so the carousel can show either (see EXPLODED in DrinkPanel). Two styles:
 *  - "glass" (Concept C): the slabs are spaced apart and each one's width follows the drink's glass
 *    at that height (a coupe flares toward the top, a highball is a narrow even column).
 *  - "block" (Concept D): today's flat card given depth: equal-width layers touching each other,
 *    like a solid block of layered liquid.
 */
export type StackStyle = "glass" | "block";
export const STACK_STYLE = "glass" as StackStyle;

/** How far above the stack we look (degrees): nearly straight on (JP, 2026-11-18). */
const CAMERA_DEG = 14;
const TILT_DEG = 90 - CAMERA_DEG;
const TILT_SIN = Math.sin((TILT_DEG * Math.PI) / 180);
/** Width of a full-size slab's diamond on screen (px), and its height at this camera angle. */
const DIAMOND_W = STACK_STYLE === "block" ? 170 : 160;
const DIAMOND_H = DIAMOND_W * Math.cos((TILT_DEG * Math.PI) / 180);
/** A garnish is a smaller, thin slab in "glass"; in "block" it is a thin full-width layer on top. */
const GARNISH_SIZE = STACK_STYLE === "block" ? 1 : 0.55;
const GARNISH_THICK = STACK_STYLE === "block" ? 12 : 3;
/** Thickness on screen per part, and the thinnest a liquid slab gets. "block" scales to BLOCK_HEIGHT instead. */
const PX_PER_PART = 14;
const MIN_THICK = 3;
const BLOCK_HEIGHT = 250;
/** Space between one slab's bottom and the next slab's top face ("block": 0, the layers touch). */
const STACK_GAP = STACK_STYLE === "block" ? 0 : 26;

/** "glass": how wide a slab is (share of full width) at height f (0 = bottom of the drink, 1 = top). */
function glassWidth(glass: string, f: number): number {
  if (glass === "coupe") return 0.32 + 0.62 * Math.pow(f, 0.85);
  if (glass === "martini") return 0.18 + 0.82 * f;
  if (glass.startsWith("highball")) return 0.6;
  if (glass.startsWith("wine")) return 0.4 + 0.55 * Math.sin(f * Math.PI * 0.8);
  if (glass.startsWith("mug")) return 0.74;
  return 0.82 + 0.06 * f; // rocks
}
/** Room kept free under the stack for the carousel dots (drawn by the carousel). */
const DOTS_ROOM = 36;
/** Finger travel (px) for one part, and for one dash. */
const DRAG_PX_PER_PART = 40;
const DASH_DRAG_PX = 16;
/** Seconds for one full turn of the stack. */
const SPIN_SECONDS = 40;

const hexRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
/** The color mixed toward white (k > 0) or scaled toward black (k < 1). */
const tint = (hex: string, white: number) => {
  const [r, g, b] = hexRgb(hex);
  return `rgb(${[r, g, b].map((c) => Math.round(c + (255 - c) * white)).join(",")})`;
};
const shade = (hex: string, k: number, a = 1) => {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${[r, g, b].map((c) => Math.round(c * k)).join(",")},${a})`;
};
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

type Props = {
  drink: Drink;
  drinkIndex: number;
  lines: RecipeLine[];
  onEdit: (drinkIndex: number, update: (prev: RecipeLine[]) => RecipeLine[]) => void;
  interactive: boolean;
  inView: boolean;
  onHorizontal: (clientX: number, pointerId: number) => void;
  servings: number;
  modified: boolean;
  onReset: (drinkIndex: number) => void;
};

/**
 * One slab: a top face (the ingredient's color as a light-to-dark gradient, with grain, an edge
 * highlight and a soft glow) and four sides (the color darkening downward). Built from flat faces
 * in CSS 3D, so it can turn. `size` is the side of the square top face (before the tilt).
 */
function Slab({ color, size, depth, dots, spinning, glow }: { color: string; size: number; depth: number; dots: boolean; spinning: boolean; glow: boolean }) {
  // Light (70% of the color) next to the top face, dark (30%) at the bottom; `dir` points from light to dark on the face.
  const side = (dir: string) => `linear-gradient(${dir}, ${shade(color, 0.7)}, ${shade(color, 0.3)})`;
  const faceBase: React.CSSProperties = { position: "absolute", backfaceVisibility: "visible" };
  // Sides: each is hinged on one edge of the bottom square and stands up to the top face.
  // Their gradients run from light at the top (next to the top face) to dark at the bottom.
  const sideFaces: React.CSSProperties[] = [
    { left: 0, top: size, width: size, height: depth, transformOrigin: "top", transform: "rotateX(90deg)", background: side("to top") },
    { left: 0, top: -depth, width: size, height: depth, transformOrigin: "bottom", transform: "rotateX(-90deg)", background: side("to bottom") },
    { left: size, top: 0, width: depth, height: size, transformOrigin: "left", transform: "rotateY(-90deg)", background: side("to left") },
    { left: -depth, top: 0, width: depth, height: size, transformOrigin: "right", transform: "rotateY(90deg)", background: side("to right") },
  ];
  const radius = Math.max(2, size * 0.05);
  return (
    <div
      aria-hidden
      className="slab-spin absolute inset-0"
      style={{
        transformStyle: "preserve-3d",
        transform: `rotateX(${TILT_DEG}deg) rotateZ(45deg)`,
        ["--slab-tilt" as string]: `${TILT_DEG}deg`,
        animationDuration: `${SPIN_SECONDS}s`,
        animationPlayState: spinning ? "running" : "paused",
      }}
    >
      {sideFaces.map((s, i) => (
        <span key={i} style={{ ...faceBase, ...s, boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.12)" }} />
      ))}
      {/* The glow: a blurred copy of the top face, a little under it. */}
      {glow && <span
        style={{
          ...faceBase,
          inset: -size * 0.06,
          borderRadius: radius,
          background: color,
          opacity: 0.5,
          filter: `blur(${Math.max(6, size * 0.1)}px)`,
          transform: `translateZ(${depth - 0.5}px)`,
        }}
      />}
      {/* The top face. */}
      <span
        className="isolate overflow-hidden"
        style={{
          ...faceBase,
          inset: 0,
          borderRadius: radius,
          transform: `translateZ(${depth}px)`,
          background: `linear-gradient(135deg, ${tint(color, 0.3)} 0%, ${color} 55%, ${shade(color, 0.75)} 100%)`,
          opacity: 0.95,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.45)",
        }}
      >
        <span className="absolute inset-0" style={{ ...LAYER_GRAIN_STYLE, opacity: 0.55 }} />
        {/* OPEN: the dot grid is on the base and modifier layers only, as in the Negroni design; the rule is a guess. */}
        {dots && (
          <span
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 0.8px, transparent 1.1px)",
              backgroundSize: `${size / 5}px ${size / 5}px`,
              backgroundPosition: `${size / 10}px ${size / 10}px`,
            }}
          />
        )}
      </span>
    </div>
  );
}

export const ExplodedDrink = memo(function ExplodedDrink({
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
  const [box, setBox] = useState({ w: 0, h: 0 });
  const boxRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    setBox({ w: el.clientWidth, h: el.clientHeight });
    const observer = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const ordered = orderLines(lines); // base first
  const top = [...ordered].reverse(); // drawn from the top of the screen down

  // Natural sizes (at full scale), then one scale so the whole stack fits the space.
  // "glass": each layer's width follows the glass at the middle of that layer's share of the drink.
  const liquidTotal = ordered.reduce((s, l) => s + (l.amount.kind === "garnish" ? 0 : volumeParts(l.amount)), 0) || 1;
  const midHeight = new Map<number, number>();
  ordered.reduce((acc, l) => {
    const v = l.amount.kind === "garnish" ? 0 : volumeParts(l.amount);
    midHeight.set(l.key, Math.min(1, (acc + v / 2) / liquidTotal));
    return acc + v;
  }, 0);
  const perPart = STACK_STYLE === "block" ? BLOCK_HEIGHT / liquidTotal : PX_PER_PART;
  const rows = top.map((line) => {
    const garnish = line.amount.kind === "garnish";
    const width = STACK_STYLE === "block" ? 1 : glassWidth(drink.glass, garnish ? 1 : midHeight.get(line.key) ?? 0.5);
    const size = garnish ? GARNISH_SIZE * width : width;
    const thick = garnish ? GARNISH_THICK : Math.max(MIN_THICK, volumeParts(line.amount) * perPart);
    return { line, garnish, size, thick, planeH: DIAMOND_H * size };
  });
  // "glass": each slab takes its top face plus its thickness plus the gap. "block": the layers touch, so
  // only the top layer's face shows and each layer below just adds its thickness.
  const block = STACK_STYLE === "block";
  const natural = block
    ? (rows[0]?.planeH ?? 0) + rows.reduce((s, r) => s + r.thick, 0)
    : rows.reduce((s, r) => s + r.planeH + r.thick, 0) + STACK_GAP * Math.max(0, rows.length - 1);
  const room = Math.max(0, box.h - DOTS_ROOM);
  const scale = natural > 0 ? Math.max(0.45, Math.min(1, (room - 8) / natural)) : 1;
  let cursor = Math.max(0, (room - natural * scale) / 2);
  const placed = rows.map((r) => {
    const planeTop = cursor;
    const center = planeTop + (r.planeH * scale) / 2; // the top face's center on screen
    cursor += block ? r.thick * scale : (r.planeH + r.thick + STACK_GAP) * scale;
    // Where its name and amount sit: level with the middle of the slab's side.
    return { ...r, center, mid: center + (r.thick * scale) / 2 };
  });

  const setLine = (key: number, update: (line: RecipeLine) => RecipeLine) =>
    onEdit(drinkIndex, (prev) => prev.map((l, i) => (i === key ? update(l) : l)));

  // Drag: down makes the layer thicker, up thinner. A liquid trades with the others exactly as
  // on the flat card (shareLines: the others rescale so the total stays the same); dashes just
  // count up or down. Amounts follow the finger and snap on release.
  const partsDrag = useRef<{ key: number; startY: number; startParts: number; base: RecipeLine[] } | null>(null);
  const dashDrag = useRef<{ key: number; startY: number; startCount: number } | null>(null);
  const { handlers, draggingKey } = useLayerDrag({
    onStart: (key, clientY) => {
      const amount = lines[key]?.amount;
      if (!amount) return;
      if (amount.kind === "parts") partsDrag.current = { key, startY: clientY, startParts: amount.parts, base: lines };
      else if (amount.kind === "dash") dashDrag.current = { key, startY: clientY, startCount: amount.count };
    },
    onEngage: (_key, clientY) => {
      if (partsDrag.current) partsDrag.current.startY = clientY;
      if (dashDrag.current) dashDrag.current.startY = clientY;
    },
    onMove: (_key, clientY) => {
      const p = partsDrag.current;
      if (p) {
        const parts = p.startParts + (clientY - p.startY) / DRAG_PX_PER_PART;
        onEdit(drinkIndex, () => shareLines(p.base, p.key, parts));
        return;
      }
      const d = dashDrag.current;
      if (d) {
        const count = d.startCount + (clientY - d.startY) / DASH_DRAG_PX;
        setLine(d.key, (l) => ({ ...l, amount: { kind: "dash", count: Math.min(MAX_DASHES, Math.max(0, count)) } }));
      }
    },
    onEnd: () => {
      if (partsDrag.current) {
        partsDrag.current = null;
        onEdit(drinkIndex, (prev) => snapShare(prev));
        return;
      }
      const d = dashDrag.current;
      dashDrag.current = null;
      if (d) setLine(d.key, (l) => ({ ...l, amount: snapAmount(l.amount) }));
    },
    onHorizontal,
  });

  const dragging = draggingKey !== null;
  // Turns slowly, except while you drag, off screen, or with "reduce motion" (see globals.css).
  const spinning = inView && !dragging;
  const cx = box.w / 2 + 5; // the Figma stack sits a few px right of center

  return (
    <section
      ref={boxRef}
      aria-label={`${drink.name} layers`}
      className="absolute inset-0 touch-manipulation select-none [-webkit-touch-callout:none]"
    >
      {box.h > 0 &&
        // Drawn from the base up, so each slab paints over the one below it (it is nearer the camera).
        placed
          .map((r, i) => ({ r, i }))
          .reverse()
          .map(({ r, i }) => {
          const { line } = r;
          const ingredient = INGREDIENTS[line.ingredient];
          const selected = draggingKey === line.key;
          const dim = dragging && !selected;
          const sizePx = (DIAMOND_W / Math.SQRT2) * r.size * scale; // the square's side, before the tilt
          const depth = (r.thick * scale) / TILT_SIN; // so the side shows `thick` px on screen
          // The touch area: the whole band of the screen from halfway to the slab above to halfway to the one below.
          const bandTop = i === 0 ? 0 : (placed[i - 1].mid + r.mid) / 2;
          const bandBottom = i === placed.length - 1 ? box.h - DOTS_ROOM : (r.mid + placed[i + 1].mid) / 2;
          const amountText = formatAmount(line.amount, DEFAULT_UNIT, servings);
          const canDrag = interactive && !r.garnish;
          const fade = "transition-opacity duration-200 motion-reduce:transition-none";
          return (
            <div key={`row-${drink.id}-${line.key}`}>
              {/* The slab. Its square's center sits `thick` below the top face's center. */}
              <div
                className={`pointer-events-none absolute ${fade}`}
                style={{
                  left: cx - sizePx / 2,
                  top: r.center + r.thick * scale - sizePx / 2,
                  width: sizePx,
                  height: sizePx,
                  opacity: dim ? 0.3 : 1,
                }}
              >
                <Slab
                  color={ingredient.color}
                  size={sizePx}
                  depth={depth}
                  dots={!block && (line.role === "base" || line.role === "modifier")}
                  spinning={spinning}
                  glow={!block}
                />
              </div>

              {/* The name, left, level with the top face. */}
              <span
                className={`pointer-events-none absolute left-4 text-xs leading-4 text-[#F7F7F7] ${fade}`}
                style={{ top: r.mid - 8, opacity: dim ? 0.3 : 1 }}
              >
                {titleCase(ingredient.name)}
              </span>

              {/* The amount, right, in a pill (outlined while it's the one being dragged). */}
              {!r.garnish && (
                <span
                  className={`pointer-events-none absolute right-[28px] flex h-[38px] items-center rounded-full border px-3 text-[13px] leading-[18px] tabular-nums text-[#F7F7F7] ${fade} ${
                    selected ? "border-white bg-black/[0.04]" : "border-transparent bg-white/[0.04]"
                  }`}
                  style={{ top: r.mid - 19 }}
                >
                  {amountText}
                </span>
              )}
              {/* While dragging: the up / down arrows beside the amount (Figma 227:492). */}
              {selected && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute"
                  style={{ top: r.mid - 38.5, right: 28 + 54 + 16, width: 7.36, height: 77 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt=""
                    src="/icons/drag-arrows.svg"
                    width={78}
                    height={7.36}
                    className="absolute left-1/2 top-1/2 block max-w-none"
                    style={{ width: 78, height: 7.36, transform: "translate(-50%, -50%) rotate(90deg)" }}
                  />
                </span>
              )}

              {/* The touch area and keyboard control for the layer (invisible, full width). */}
              {r.garnish ? null : (
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label={`${ingredient.name}, ${line.role}`}
                  aria-valuemin={0}
                  aria-valuemax={12}
                  aria-valuenow={Math.round(volumeParts(line.amount) * 100) / 100}
                  aria-valuetext={amountText}
                  aria-orientation="vertical"
                  data-layer-drag={canDrag ? "" : undefined}
                  className={`absolute inset-x-0 touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60 ${
                    canDrag ? (selected ? "cursor-grabbing" : "cursor-grab") : ""
                  }`}
                  style={{ top: bandTop, height: Math.max(0, bandBottom - bandTop) }}
                  {...(canDrag ? handlers(line.key) : {})}
                  onKeyDown={(e) => {
                    const steps =
                      e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : e.key === "PageUp" ? 4 : e.key === "PageDown" ? -4 : 0;
                    if (!steps) return;
                    e.preventDefault();
                    if (line.amount.kind === "parts") onEdit(drinkIndex, (prev) => stepShare(prev, line.key, steps));
                    else setLine(line.key, (l) => ({ ...l, amount: stepAmount(l.amount, steps) }));
                  }}
                />
              )}
            </div>
          );
        })}

      {/* Reset: only once the drink has been changed, bottom right, level with the carousel dots. */}
      <button
        type="button"
        data-no-swipe
        onClick={() => onReset(drinkIndex)}
        aria-label={`Reset ${drink.name}`}
        tabIndex={modified && interactive ? 0 : -1}
        aria-hidden={!modified}
        className={`absolute bottom-0 right-[28px] z-20 grid size-9 place-items-center rounded-full bg-white/[0.06] transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
          modified ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span aria-hidden className="relative block size-5">
          <span className="absolute inset-[10.83%_14.58%_14.58%_15.79%]">
            <span className="absolute inset-[-4.19%_-4.49%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src="/icons/reset.svg" className="block size-full max-w-none" />
            </span>
          </span>
        </span>
      </button>
    </section>
  );
});
