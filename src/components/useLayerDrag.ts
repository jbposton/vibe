"use client";

import { useRef, useState } from "react";

type DragCallbacks = {
  /** Called when the finger goes down, with where it went down. */
  onStart: (key: number, clientY: number) => void;
  /** Called at most once per screen frame with the pointer's latest position. */
  onMove: (key: number, clientY: number) => void;
  /** Called when the finger lifts (or the drag is cancelled). */
  onEnd: (key: number) => void;
};

/**
 * Vertical drag on a drink section. Works the same for touch, pen and mouse.
 * The section must have `touch-action: none` so the browser doesn't scroll or
 * pull-to-refresh during the drag.
 *
 * Pointer events can arrive faster than the screen redraws, so moves are
 * collected and applied once per animation frame.
 *
 * OPEN: gesture map (brief §7). Placeholder (JP's choices): drag anywhere on a
 * section; down expands it, up shrinks it. Volume is traded with a neighbor
 * (the one below if it can trade, else the one above), so the shared line
 * moves and the rest of the drink stays put.
 */
export function useLayerDrag({ onStart, onMove, onEnd }: DragCallbacks) {
  const active = useRef<{ key: number; pointerId: number; y: number; frame: number } | null>(null);
  const [draggingKey, setDraggingKey] = useState<number | null>(null);

  const end = (e: React.PointerEvent) => {
    const a = active.current;
    if (!a || a.pointerId !== e.pointerId) return;
    cancelAnimationFrame(a.frame);
    onMove(a.key, a.y); // apply the very last position before snapping
    active.current = null;
    setDraggingKey(null);
    onEnd(a.key);
  };

  const handlers = (key: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (active.current) return; // one finger at a time
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      active.current = { key, pointerId: e.pointerId, y: e.clientY, frame: 0 };
      setDraggingKey(key);
      onStart(key, e.clientY);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const a = active.current;
      if (!a || a.pointerId !== e.pointerId) return;
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
