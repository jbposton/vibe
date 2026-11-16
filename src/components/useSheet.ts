"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The edit panel's swipe-up sheet, built to the apple-design skill (Emil
 * Kowalski): drag tracks the finger 1:1, the release hands its velocity to a
 * spring, a flick is projected forward to decide where it lands, going past
 * either end rubber-bands, and the motion can be grabbed at any moment.
 *
 * It owns one number, `--p` on the root element: 0 = closed, 1 = open. The
 * screen reads `--p` in CSS (transform and opacity only), so nothing re-renders
 * while it moves.
 */

/** Finger travel (px) before a touch counts as a drag. */
const SLOP = 10;
/** Momentum projection: how fast a flick runs out (closer to 1 = longer glide). */
const DECELERATION = 0.998;
/** Spring settings. Response is in seconds; damping 1 = no overshoot, below 1 = a little. */
const RESPONSE = 0.35;
const DAMPING_CALM = 1;
const DAMPING_FLICK = 0.8;
/** Rubber-band stiffness (Apple's 0.55). */
const RUBBER = 0.55;

type Options = {
  /** How far the panel travels between closed and open, in px (finger travel for p: 0 to 1). */
  distance: number;
  /** The element whose `--p` is driven. */
  rootRef: React.RefObject<HTMLElement | null>;
  /** False on wide screens: the sheet stays closed and nothing is bound. */
  enabled: boolean;
};

export function useSheet({ distance, rootRef, enabled }: Options) {
  const [open, setOpen] = useState(false);
  const st = useRef({
    p: 0,
    v: 0, // p per second
    raf: 0,
    target: 0,
    drag: null as null | { id: number; startY: number; startX: number; startP: number; moves: { t: number; y: number }[]; active: boolean },
  });

  const write = useCallback(
    (p: number) => {
      st.current.p = p;
      rootRef.current?.style.setProperty("--p", p.toFixed(4));
    },
    [rootRef],
  );

  /** Spring from where we are now (and how fast we're going) to `target`. Safe to call mid-motion. */
  const animateTo = useCallback(
    (target: 0 | 1, velocity = 0, damping = DAMPING_CALM) => {
      const s = st.current;
      cancelAnimationFrame(s.raf);
      s.target = target;
      setOpen(target === 1);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        s.v = 0;
        write(target); // reduced motion: no spring, just arrive
        return;
      }
      s.v = velocity;
      const omega = (2 * Math.PI) / RESPONSE;
      let last = performance.now();
      const tick = (now: number) => {
        // Fixed small steps keep the spring stable if a frame is late.
        let dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        while (dt > 0) {
          const h = Math.min(dt, 1 / 240);
          const accel = -omega * omega * (s.p - target) - 2 * damping * omega * s.v;
          s.v += accel * h;
          s.p += s.v * h;
          dt -= h;
        }
        write(s.p);
        if (Math.abs(s.p - target) < 0.0008 && Math.abs(s.v) < 0.01) {
          s.v = 0;
          write(target);
          return;
        }
        s.raf = requestAnimationFrame(tick);
      };
      s.raf = requestAnimationFrame(tick);
    },
    [write],
  );

  const openSheet = useCallback(() => animateTo(1, st.current.v), [animateTo]);
  const closeSheet = useCallback(() => animateTo(0, st.current.v), [animateTo]);
  const toggle = useCallback(() => animateTo(st.current.target === 1 ? 0 : 1, st.current.v), [animateTo]);

  // A wide screen has no sheet: close it when the screen becomes wide.
  const [wasEnabled, setWasEnabled] = useState(enabled);
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    if (!enabled) setOpen(false);
  }
  useEffect(() => {
    if (!enabled) {
      cancelAnimationFrame(st.current.raf);
      st.current.target = 0;
      write(0);
    }
  }, [enabled, write]);
  useEffect(() => () => cancelAnimationFrame(st.current.raf), []);

  /** Past either end the panel gives, but less and less (Apple's rubber band). */
  const rubber = (raw: number) => {
    if (raw >= 0 && raw <= 1) return raw;
    const over = (raw < 0 ? raw : raw - 1) * distance; // px past the end
    const resisted = (over * distance * RUBBER) / (distance + RUBBER * Math.abs(over));
    return (raw < 0 ? 0 : 1) + resisted / distance;
  };

  const bind = enabled
    ? {
        onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
          const s = st.current;
          if (s.drag) return;
          // Grab the motion right where it is: stop the spring, keep p.
          cancelAnimationFrame(s.raf);
          s.drag = { id: e.pointerId, startY: e.clientY, startX: e.clientX, startP: s.p, moves: [{ t: performance.now(), y: e.clientY }], active: false };
        },
        onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
          const s = st.current;
          const d = s.drag;
          if (!d || d.id !== e.pointerId) return;
          const dy = e.clientY - d.startY;
          const dx = e.clientX - d.startX;
          if (!d.active) {
            if (dy * dy + dx * dx < SLOP * SLOP) return;
            if (Math.abs(dx) > Math.abs(dy)) {
              s.drag = null; // a sideways touch isn't ours
              // The sheet was grabbed mid-motion: carry on to where it was headed.
              animateTo(s.target as 0 | 1, s.v);
              return;
            }
            d.active = true;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // The pointer already ended: nothing to capture.
            }
          }
          const now = performance.now();
          d.moves.push({ t: now, y: e.clientY });
          while (d.moves.length > 2 && now - d.moves[0].t > 100) d.moves.shift();
          write(rubber(d.startP + (d.startY - e.clientY) / distance));
        },
        onPointerUp: (e: React.PointerEvent<HTMLElement>) => finish(e, false),
        onPointerCancel: (e: React.PointerEvent<HTMLElement>) => finish(e, true),
      }
    : {};

  function finish(e: React.PointerEvent<HTMLElement>, cancelled: boolean) {
    const s = st.current;
    const d = s.drag;
    if (!d || d.id !== e.pointerId) return;
    s.drag = null;
    if (!d.active) {
      // A tap or a sideways touch: if we had grabbed a moving panel, let it finish.
      if (s.target !== s.p) animateTo(s.target as 0 | 1, s.v);
      return;
    }
    const first = d.moves[0];
    const last = d.moves[d.moves.length - 1];
    const span = last.t - first.t;
    // Finger speed in px/s (0 if it rested before lifting), then in p per second.
    const pxPerSec = !cancelled && span > 8 && performance.now() - last.t < 80 ? ((last.y - first.y) / span) * 1000 : 0;
    const v = -pxPerSec / distance;
    // Where it would coast to: current + (v / 1000) * d / (1 - d), in px.
    const coast = ((-pxPerSec / 1000) * DECELERATION) / (1 - DECELERATION) / distance;
    const landing = s.p + coast;
    const target: 0 | 1 = landing > 0.5 ? 1 : 0;
    animateTo(target, v, Math.abs(pxPerSec) > 600 ? DAMPING_FLICK : DAMPING_CALM);
  }

  return { open, bind, toggle, openSheet, closeSheet };
}
