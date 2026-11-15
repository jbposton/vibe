"use client";

import { useRef, useState } from "react";

/**
 * Vertical drag on a divider handle. Works the same for touch, pen and mouse.
 * The handle must have `touch-action: none` so the browser doesn't scroll or
 * pull-to-refresh during the drag.
 *
 * OPEN: gesture map (brief §7). Placeholder: drag the line between two layers;
 * the line belongs to the layer BELOW it, so moving it changes that layer's
 * amount and the line follows the finger.
 */
export function useLayerDrag(onMove: (key: number, clientY: number) => void) {
  const active = useRef<{ key: number; pointerId: number } | null>(null);
  const [draggingKey, setDraggingKey] = useState<number | null>(null);

  const end = (e: React.PointerEvent) => {
    if (active.current?.pointerId !== e.pointerId) return;
    active.current = null;
    setDraggingKey(null);
  };

  const handlers = (key: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (active.current) return; // one finger at a time
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      active.current = { key, pointerId: e.pointerId };
      setDraggingKey(key);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const a = active.current;
      if (!a || a.pointerId !== e.pointerId) return;
      onMove(a.key, e.clientY);
    },
    onPointerUp: end,
    onPointerCancel: end,
    onLostPointerCapture: end,
  });

  return { handlers, draggingKey };
}
