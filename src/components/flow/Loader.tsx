"use client";

import { useEffect, useRef } from "react";

/**
 * The loader (v2 flow, step 1): a dark screen with a cocktail glass silhouette, in a slightly lighter
 * dark, that melts from one common glass shape into the next for a few moments. Then it calls onDone,
 * and the flow dissolves into the next screen.
 *
 * Every glass is described the same way: its half-width (0 to 0.5, as a share of the drawing's width)
 * at ROWS evenly spaced heights from the rim down to the foot. Because every shape has the same
 * rows, morphing one into another is just blending the numbers.
 */
const ROWS = 64;
const VIEW_W = 200;
const VIEW_H = 260;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** A glass from its parts: a bowl (top part), a stem and a foot. Heights are 0 (rim) to 1 (foot). */
function stemmed(bowlEnd: number, bowlHalf: number, bowlCurve: (u: number) => number, stemHalf: number, footHalf: number, footStart = 0.93) {
  return (y: number) => {
    if (y < bowlEnd) return bowlHalf * bowlCurve(y / bowlEnd);
    if (y < footStart) return stemHalf;
    return stemHalf + (footHalf - stemHalf) * smooth(footStart, 1, y);
  };
}

const GLASSES: { name: string; half: (y: number) => number }[] = [
  // Martini: a wide V.
  { name: "martini", half: stemmed(0.42, 0.5, (u) => 1 - u, 0.012, 0.24) },
  // Coupe: a shallow round bowl.
  { name: "coupe", half: stemmed(0.34, 0.46, (u) => Math.sqrt(Math.max(0, 1 - u * u)), 0.012, 0.22) },
  // Wine: a tall round bowl.
  { name: "wine", half: stemmed(0.5, 0.3, (u) => Math.sqrt(Math.max(0, 1 - u ** 2.2)), 0.012, 0.2) },
  // Flute: slim and tall, narrowing a little toward the stem.
  { name: "flute", half: stemmed(0.62, 0.13, (u) => 1 - 0.55 * u ** 2, 0.011, 0.19) },
  // Highball: a straight tall glass.
  { name: "highball", half: (y) => (y < 0.04 ? 0 : 0.2 - 0.02 * y) },
  // Rocks: short and wide (starts lower down).
  { name: "rocks", half: (y) => (y < 0.4 ? 0 : 0.34 - 0.03 * smooth(0.4, 1, y)) },
];

/** Half-widths for each glass, sampled once. */
const PROFILES: number[][] = GLASSES.map((g) =>
  Array.from({ length: ROWS }, (_, i) => Math.max(0, g.half(i / (ROWS - 1)))),
);

const HOLD_MS = 650; // each glass rests this long
const MORPH_MS = 700; // then melts into the next over this long
const SHAPES_SHOWN = 4; // how many glasses we go through
export const LOADER_MS = SHAPES_SHOWN * HOLD_MS + (SHAPES_SHOWN - 1) * MORPH_MS + 350;

/** The outline for the blend of glass `a` into glass `b` (t from 0 to 1). */
function outline(a: number[], b: number[], t: number): string {
  const cx = VIEW_W / 2;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i < ROWS; i++) {
    const half = (a[i] + (b[i] - a[i]) * t) * VIEW_W;
    const y = ((i / (ROWS - 1)) * VIEW_H).toFixed(1);
    left.push(`${(cx - half).toFixed(1)} ${y}`);
    right.push(`${(cx + half).toFixed(1)} ${y}`);
  }
  return `M${left.join(" L")} L${right.reverse().join(" L")} Z`;
}

const order = [0, 1, 2, 4, 3, 5]; // martini, coupe, wine, highball, flute, rocks

export function Loader({ onDone }: { onDone: () => void }) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shapes = order.slice(0, SHAPES_SHOWN).map((i) => PROFILES[i]);
    if (reduced) {
      // No morphing: one still glass, then on.
      path.setAttribute("d", outline(shapes[0], shapes[0], 0));
      const timer = window.setTimeout(() => done.current(), 900);
      return () => window.clearTimeout(timer);
    }
    const t0 = performance.now();
    let frame = 0;
    let finished = false;
    const tick = (now: number) => {
      const elapsed = Math.max(0, now - t0); // the first frame's timestamp can land just before t0
      const slot = HOLD_MS + MORPH_MS;
      const n = Math.min(shapes.length - 1, Math.floor(elapsed / slot));
      const within = elapsed - n * slot;
      const last = n >= shapes.length - 1;
      const k = last ? 0 : smooth(HOLD_MS, slot, within);
      const eased = k * k * (3 - 2 * k);
      path.setAttribute("d", outline(shapes[n], shapes[Math.min(n + 1, shapes.length - 1)], eased));
      if (elapsed >= LOADER_MS && !finished) {
        finished = true;
        done.current();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div role="status" aria-label="Loading" className="absolute inset-0 grid place-items-center bg-[#1A1612]">
      <svg width={VIEW_W} height={VIEW_H} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden className="max-h-[40vh] w-auto overflow-visible">
        <defs>
          <linearGradient id="loader-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3A352E" />
            <stop offset="1" stopColor="#26221E" />
          </linearGradient>
          <filter id="loader-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>
        <path ref={pathRef} d="" fill="url(#loader-glass)" filter="url(#loader-soft)" />
      </svg>
    </div>
  );
}
