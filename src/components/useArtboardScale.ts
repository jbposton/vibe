"use client";

import { useSyncExternalStore } from "react";
import { ARTBOARD } from "@/lib/stack";

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function getScale() {
  return Math.min(window.innerWidth / ARTBOARD.width, window.innerHeight / ARTBOARD.height);
}

/**
 * How much to scale the 402×874 Figma artboard so it fits the screen.
 * Returns 0 during server rendering (the panel stays hidden until measured).
 */
export function useArtboardScale(): number {
  return useSyncExternalStore(subscribe, getScale, () => 0);
}
