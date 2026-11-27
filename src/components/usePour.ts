"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** How a new ingredient pours in (JP, 2026-11-27). Times are shares of the whole, from 0 to 1. Tune here. */
export const POUR = {
  ms: 1500,
  /** The new liquid starts to rise, just after the others begin making room. */
  starts: 0.08,
  /** The layers already in the glass have sunk to their new sizes, making room. */
  settled: 0.6,
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2);
const easeOut = (v: number) => 1 - (1 - v) ** 2.4;

type Running = {
  /** The layer pouring in, by its role. */
  id: string;
  /** Every layer's height when the pour began. */
  from: Record<string, number>;
  /** How far through, 0 to 1. */
  p: number;
  /** Counts pours, so each one runs its own clock. */
  run: number;
  /** How long it waits before starting (ms). */
  delay: number;
};

export type Pouring = {
  /** Which layer (its place from the bottom) is pouring in. */
  index: number;
  p: number;
  /** How much of the new layer is in, 0 to 1. */
  fill: number;
};

/**
 * When a layer is added, the layers already there sink to make room while the new one flows in and rises to
 * fill what's left. `ids` name the layers bottom to top and `target` is where each ends up (px). Returns the
 * heights to draw now, and what's pouring (null when nothing is). The first layer pours into an empty glass.
 * With "reduce motion", or when switched off, layers simply appear.
 */
export function usePour(enabled: boolean, ids: string[], target: number[], delay = 0): { heights: number[]; pouring: Pouring | null } {
  const [running, setRunning] = useState<Running | null>(null);
  // What was last drawn at rest (or null before the glass has a size).
  const last = useRef<Record<string, number> | null>(null);
  const runs = useRef(0);

  // Before the screen is painted, so a new layer never shows at full size first.
  useLayoutEffect(() => {
    if (!enabled || !target.some((h) => h > 0)) return;
    const before = last.current;
    last.current = Object.fromEntries(ids.map((id, i) => [id, target[i]]));
    const added = before ? ids.filter((id) => !(id in before)) : ids.length === 1 ? ids : [];
    if (added.length !== 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    runs.current += 1;
    setRunning({ id: added[0], from: before ?? {}, p: 0, run: runs.current, delay });
    // (ids and target are new on every render, so this looks after each one; it only starts a pour when a layer is new.)
  }, [enabled, ids, target, delay]);

  const run = running?.run;
  const wait = running?.delay ?? 0;
  useEffect(() => {
    if (run === undefined) return;
    let frame = 0;
    const start = performance.now() + wait;
    const tick = (now: number) => {
      const p = clamp01((now - start) / POUR.ms);
      setRunning((r) => (r && r.run === run ? (p >= 1 ? null : { ...r, p }) : r));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, wait]);

  const index = running ? ids.indexOf(running.id) : -1;
  if (!running || index < 0) return { heights: target, pouring: null };

  const sink = easeInOut(clamp01(running.p / POUR.settled));
  const fill = easeOut(clamp01((running.p - POUR.starts) / (1 - POUR.starts)));
  const heights = target.map((to, i) => {
    if (i === index) return to * fill;
    const from = running.from[ids[i]] ?? to;
    return from + (to - from) * sink;
  });
  return { heights, pouring: { index, p: running.p, fill } };
}
