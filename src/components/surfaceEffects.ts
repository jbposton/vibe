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

/*
 * Liquid glass: the panel reads as a thick slab of clear glass over the drink.
 * The middle stays clear; the effect lives at the edges, like light bending
 * through a rounded glass rim.
 */

/** How far in from the edge the glass "thickness" (the lens) reaches. */
const LENS = 22;

/**
 * Lens: near the edges, the drink behind the glass is softened, brightened and
 * made more saturated, as if seen through the curved rim. A mask fades it out
 * toward the middle.
 */
const edgeMask = [
  `linear-gradient(to right, #000, transparent ${LENS}px, transparent calc(100% - ${LENS}px), #000)`,
  `linear-gradient(to bottom, #000, transparent ${LENS}px, transparent calc(100% - ${LENS}px), #000)`,
].join(", ");

export const GLASS_LENS_STYLE: CSSProperties = {
  borderRadius: "inherit",
  backdropFilter: "blur(5px) saturate(1.7) brightness(1.12)",
  WebkitBackdropFilter: "blur(5px) saturate(1.7) brightness(1.12)",
  maskImage: edgeMask,
  WebkitMaskImage: edgeMask,
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

/**
 * Specular rim: a thin gradient outline that catches light brightest at the
 * top left and again, more softly, at the bottom right.
 */
const ringMask = "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)";

export const GLASS_RIM_STYLE: CSSProperties = {
  borderRadius: "inherit",
  padding: 1.5,
  opacity: 0.5, // dimmed so the rim is a hint of light, not an outline
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 18%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0.45) 85%, rgba(255,255,255,0.8) 100%)",
  // The `mask` shorthand (not `mask-image`) is needed for `content-box`, and
  // the composite must come after it, since the shorthand resets it.
  WebkitMask: ringMask,
  WebkitMaskComposite: "xor",
  mask: ringMask,
  maskComposite: "exclude",
};

/**
 * Inner glow: light caught inside the glass along its edges (stronger at the
 * top left), plus a faint darker band just inside the rim for thickness.
 */
export const GLASS_GLOW_STYLE: CSSProperties = {
  borderRadius: "inherit",
  boxShadow: [
    "inset 2px 2px 1px -1px rgba(255,255,255,0.55)",
    "inset -2px -2px 1px -1px rgba(255,255,255,0.30)",
    "inset 0 0 18px rgba(255,255,255,0.16)",
    "inset 10px 10px 24px -14px rgba(255,255,255,0.35)",
    "inset 0 0 0 5px rgba(0,0,0,0.04)",
  ].join(", "),
};
