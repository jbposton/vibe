"use client";

import { useRef, useState } from "react";

type DragCallbacks = {
  /** Screen pixels per artboard pixel (the panel is scaled to fit the screen). */
  scale: number;
  onStart: (key: number) => void;
  /** `dy` is in artboard pixels, positive when the pointer moved UP. */
  onMove: (key: number, dy: number) => void;
};

/**
 * Vertical drag on a layer. Works the same for touch, pen and mouse.
 * The element using these handlers must have `touch-action: none` so the
 * browser doesn't scroll or pull-to-refresh during the drag.
 *
 * OPEN: gesture map (brief §7). Placeholder: drag a layer up to add to it,
 * down to take away. Dragging the edge between two layers isn't built yet.
 */
export function useLayerDrag({ scale, onStart, onMove }: DragCallbacks) {
  const active = useRef<{ key: number; pointerId: number; startY: number } | null>(null);
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
      e.currentTarget.setPointerCapture(e.pointerId);
      active.current = { key, pointerId: e.pointerId, startY: e.clientY };
      setDraggingKey(key);
      onStart(key);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const a = active.current;
      if (!a || a.pointerId !== e.pointerId) return;
      onMove(a.key, (a.startY - e.clientY) / scale);
    },
    onPointerUp: end,
    onPointerCancel: end,
    onLostPointerCapture: end,
  });

  return { handlers, draggingKey };
}
