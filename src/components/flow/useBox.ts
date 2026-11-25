"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

/** The size of an element, kept current as it changes. Use `ref` on the element. */
export function useBox() {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const ref = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    setBox({ w: el.clientWidth, h: el.clientHeight });
    const observer = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { box, ref };
}

const DESKTOP = "(min-width: 768px)";
function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True on wide screens (768px and up), as everywhere else in the app. */
export function useIsDesktop() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP).matches, () => false);
}
