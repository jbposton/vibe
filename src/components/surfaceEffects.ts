/**
 * Static surface effects layered over the drink. They're all still images or
 * CSS gradients, drawn once, so they cost nothing while you drag.
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

/**
 * Cylinder: shading that makes the flat panel read as a round glass. The drink
 * darkens as the glass turns away at the left and right edges, with a very
 * soft, broad light a little left of center where the glass faces the light.
 */
export const GLASS_CYLINDER_STYLE: CSSProperties = {
  borderRadius: "inherit",
  backgroundImage: [
    "linear-gradient(90deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.14) 9%, rgba(0,0,0,0.03) 22%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 64%, rgba(0,0,0,0.05) 76%, rgba(0,0,0,0.18) 91%, rgba(0,0,0,0.38) 100%)",
    "linear-gradient(90deg, rgba(255,255,255,0) 16%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0) 46%)",
  ].join(", "),
};
