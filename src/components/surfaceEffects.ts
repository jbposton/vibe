/**
 * Static surface effects layered over the drink. They're still images, drawn
 * once, so they cost nothing while you drag.
 */
import type { CSSProperties } from "react";

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Film grain: a tiled, grey fractal-noise texture blended into the colors. */
const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/>" +
  "<feColorMatrix type='saturate' values='0'/></filter>" +
  "<rect width='100%' height='100%' filter='url(#n)'/></svg>";

export const GRAIN_STYLE: CSSProperties = {
  backgroundImage: svgUrl(GRAIN_SVG),
  backgroundSize: "180px 180px",
  mixBlendMode: "overlay",
  opacity: 0.45,
};
