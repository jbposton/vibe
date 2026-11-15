"use client";

import { useRef, useState } from "react";

/** How far a finger moves (px) before we decide which way the gesture goes. */
const SLOP = 6;

type DragCallbacks = {
  /** Called when the finger goes down, with where it went down. */
  onStart: (key: number, clientY: number) => void;
  /** Called at most once per screen frame with the pointer's latest position. */
  onMove: (key: number, clientY: number) => void;
  /** Called when a vertical drag ends (the finger lifts or the drag is cancelled). */
  onEnd: (key: number) => void;
  /**
   * Called once if the finger turns out to be moving sideways: this isn't a
   * layer drag but a swipe to another drink. The carousel takes over from here.
   */
  onHorizontal: (clientX: number, pointerId: number) => void;
};

/**
 * Vertical drag on a drink section. Works the same for touch, pen and mouse.
 * The section must have `touch-action: none` so the browser doesn't scroll or
 * pull-to-refresh during the drag.
 *
 * The first few pixels of movement decide the gesture: mostly sideways is a
 * swipe (handed to the carousel), anything else is a layer drag. Nothing
 * changes in the drink until that decision is made.
 *
 * Pointer events can arrive faster than the screen redraws, so moves are
 * collected and applied once per animation frame.
 *
 * OPEN: gesture map (brief §7). Placeholder (JP's choices): drag anywhere on a
 * section and the line it shares with a neighbor follows the finger (the
 * neighbor below if it can trade, else the one above). So down expands a
 * section, except the base layer, whose top line moves down and shrinks it.
 */
export function useLayerDrag({ onStart, onMove, onEnd, onHorizontal }: DragCallbacks) {
  const active = useRef<{
    key: number;
    pointerId: number;
    startX: number;
    startY: number;
    y: number;
    frame: number;
    /** null until the finger has moved far enough to tell; "v" once it's a layer drag. */
    axis: "v" | null;
  } | null>(null);
  const [draggingKey, setDraggingKey] = useState<number | null>(null);

  const end = (e: React.PointerEvent) => {
    const a = active.current;
    if (!a || a.pointerId !== e.pointerId) return;
    cancelAnimationFrame(a.frame);
    active.current = null;
    setDraggingKey(null);
    // Only a real vertical drag changes (and snaps) amounts; a tap or a
    // swipe leaves the drink exactly as it was.
    if (a.axis === "v") {
      onMove(a.key, a.y); // apply the very last position before snapping
      onEnd(a.key);
    }
  };

  const handlers = (key: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      // One finger at a time. A new first finger replaces a drag whose lift
      // was never seen (so a missed lift can't leave this card stuck).
      if (active.current && !e.isPrimary) return;
      if (active.current) cancelAnimationFrame(active.current.frame);
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // The pointer already ended (a very quick tap): nothing to capture.
      }
      active.current = {
        key,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        y: e.clientY,
        frame: 0,
        axis: null,
      };
      setDraggingKey(key);
      onStart(key, e.clientY);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const a = active.current;
      if (!a || a.pointerId !== e.pointerId) return;
      if (a.axis === null) {
        const dx = e.clientX - a.startX;
        const dy = e.clientY - a.startY;
        if (dx * dx + dy * dy < SLOP * SLOP) return;
        if (Math.abs(dx) > Math.abs(dy) * 1.2) {
          // A sideways swipe: let go of the layer and hand over to the
          // carousel. The carousel owns the rest of this gesture, including
          // the finger lifting, and this card may stop taking touches while it
          // moves, so clear our state now rather than waiting for the lift.
          // (Leaving it set made later drags on this card be ignored.)
          active.current = null;
          setDraggingKey(null);
          onHorizontal(e.clientX, e.pointerId);
          return;
        }
        a.axis = "v";
      }
      a.y = e.clientY;
      if (a.frame) return; // an update is already scheduled for this frame
      a.frame = requestAnimationFrame(() => {
        a.frame = 0;
        if (active.current === a) onMove(a.key, a.y);
      });
    },
    onPointerUp: end,
    onPointerCancel: end,
    onLostPointerCapture: end,
  });

  return { handlers, draggingKey };
}
