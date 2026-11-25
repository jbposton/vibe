"use client";

import { useId, useMemo, useSyncExternalStore } from "react";

/**
 * Curved glass over a side of the carousel (JP, 2026-11-25). The middle drink is left perfectly clear; the glass
 * starts at its edge doing nothing at all and warps more and more toward the side of the page, so a drink moving
 * outward bends gradually: it stretches outward, its top sweeps upward and its bottom downward, and it softens.
 * Nothing is drawn on the glass itself (no outline, highlight or tint).
 *
 * How: a "displacement map" is painted for the pane's exact shape (each pixel's color says how far to borrow the
 * picture from behind it: red for sideways, green for up and down), and the browser applies it to whatever is
 * behind the pane (backdrop-filter with an SVG filter). Only Chromium browsers (Chrome, Edge, Arc, Brave) can
 * do that. Safari and Firefox get only the gradual softening. Tune it in GLASS.
 */
const GLASS = {
  stretch: 32, // the furthest the picture is stretched sideways, at the page edge (px). Keep it under 0.65 x the pane's width.
  lift: 68, // how far the top is swept upward, and the bottom downward, at the page edge (px)
  rimEnds: 150, // how far down from the top (and up from the bottom) the sweep reaches. Keep lift under half of this:
  // more than that folds the picture back on itself and leaves dark blotches.
  blur: 2.5, // the softening at the page edge (px); it fades to none toward the middle drink
};

/** 0 to 1 with a soft start and a soft finish, so there is no line where the warp begins. */
const smooth = (v: number) => v * v * (3 - 2 * v);

/** How far the filter reaches each way (px) for a pane this wide. */
const sideways = (w: number) => Math.min(GLASS.stretch, w * 0.65);
const fullRange = (w: number) => Math.max(sideways(w), GLASS.lift);

/** The displacement map for a w x h pane, as a picture the SVG filter can read. */
function lensMap(w: number, h: number, side: "left" | "right"): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const image = ctx.createImageData(w, h);
  const rimEnds = Math.min(GLASS.rimEnds, h / 2);
  const reach = sideways(w);
  const scale = fullRange(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const py = y + 0.5 - h / 2;
      // 0 at the side next to the middle drink (no effect at all), 1 at the side of the page.
      const outward = side === "left" ? 1 - (x + 0.5) / w : (x + 0.5) / w;
      const amount = smooth(outward);
      // How much we are in the top or bottom stretch: an evenly growing (square) pull never folds back.
      const end = Math.min(1, Math.max(0, 1 - (h / 2 - Math.abs(py)) / rimEnds));
      // Sideways: borrow from nearer the middle drink, which stretches the picture outward.
      const dx = ((side === "left" ? 1 : -1) * reach * amount) / scale;
      // Up and down: borrow from nearer the middle, which lifts the top upward and drops the bottom downward.
      const dy = (-Math.sign(py) * GLASS.lift * end * end * amount) / scale;
      const i = (y * w + x) * 4;
      image.data[i] = Math.round(127.5 + dx * 127.5);
      image.data[i + 1] = Math.round(127.5 + dy * 127.5);
      image.data[i + 2] = 128;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

const never = () => () => {};
/** Only Chromium can bend what is behind an element. (Others accept the style but draw nothing.) */
const canBend = () => "userAgentData" in navigator;

type Props = {
  side: "left" | "right";
  width: number;
  height: number;
  /** Where it sits (top and left / right). */
  style: React.CSSProperties;
  shown: boolean;
};

export function SideGlass({ side, width, height, style, shown }: Props) {
  const id = `glass-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const w = Math.round(width);
  const h = Math.round(height);
  const bends = useSyncExternalStore(never, canBend, () => false);
  const map = useMemo(() => (bends && w > 0 && h > 0 ? lensMap(w, h, side) : ""), [bends, w, h, side]);
  // The softening is its own layer, let in gradually: nothing at the middle drink, all of it at the page edge.
  const softMask = `linear-gradient(to ${side === "left" ? "left" : "right"}, transparent 15%, rgba(0,0,0,0.35) 50%, black)`;
  const box: React.CSSProperties = { ...style, width: w, height: h, opacity: shown ? 1 : 0 };
  const pane = "pointer-events-none absolute z-10 transition-opacity duration-500 motion-reduce:transition-none";

  // Each layer is ONE element on purpose: a parent with a mask or see-through opacity would cut the glass
  // off from what is behind it, and nothing would bend.
  return (
    <>
      {map && (
        <>
          <svg width="0" height="0" aria-hidden className="absolute">
            <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feImage href={map} x="0" y="0" width={w} height={h} preserveAspectRatio="none" result="map" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale={fullRange(w) * 2} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
          <div aria-hidden data-side-glass className={pane} style={{ ...box, backdropFilter: `url(#${id})`, WebkitBackdropFilter: `url(#${id})` }} />
        </>
      )}
      <div
        aria-hidden
        data-side-glass
        className={pane}
        style={{
          ...box,
          backdropFilter: `blur(${GLASS.blur}px)`,
          WebkitBackdropFilter: `blur(${GLASS.blur}px)`,
          maskImage: softMask,
          WebkitMaskImage: softMask,
        }}
      />
    </>
  );
}
