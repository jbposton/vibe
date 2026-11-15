"use client";

import { useEffect, useRef } from "react";

/**
 * The drink drawn by a WebGL shader: every layer is a band of color with the
 * same soft, blurred edges as the Figma v4 recipe (a Gaussian-blurred
 * rectangle), and the boundaries between bands drift slowly, like liquids
 * mixing. Changing amounts only updates a few numbers, so dragging is cheap.
 *
 * Falls back (via `onReady(false)`) when WebGL isn't available.
 */

export type LiquidLayer = {
  /** Band bottom and top, in CSS px above the stack bottom (overlap included). */
  lo: number;
  hi: number;
  /** Blur (Gaussian standard deviation), in CSS px. */
  blur: number;
  /** "#RRGGBB" */
  color: string;
  /** True to keep this band's edges still (garnishes don't drift). */
  still?: boolean;
};

type Props = {
  layers: LiquidLayer[];
  /** Changes when the drink changes, so the bands jump instead of easing. */
  resetKey: string;
  /** True while a finger is dragging: bands follow it with no easing. */
  dragging: boolean;
  /** Page color shown above and below the drink. */
  background: string;
  onReady: (ok: boolean) => void;
};

const MAX_LAYERS = 8;

/** How far the boundaries wander up and down, in CSS px. */
const WAVE_AMPLITUDE = 28;
/** Animation speed (1 = default). Lower is slower. */
const WAVE_SPEED = 1.6;
/**
 * A newly shown drink starts unmixed (still, straight boundaries). After it
 * has been on screen for MIX_DELAY seconds, the mixing eases in over MIX_RAMP
 * seconds. Time only counts while the page is visible.
 */
const MIX_DELAY = 3;
const MIX_RAMP = 4;

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;

uniform float uDpr;
uniform float uTime;
uniform float uAmp;
uniform int uCount;
uniform vec4 uBand[${MAX_LAYERS}];   // lo, hi, blur (px from the bottom), wave (0 = still, 1 = drifting)
uniform vec3 uColor[${MAX_LAYERS}];
uniform vec3 uBg;

// Smooth random values on a grid (no sine, so it's stable on phone GPUs).
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Value noise with quintic easing, which hides the grid much better than
// the usual cubic easing.
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Three layers of detail, each rotated so no grid lines up between them.
const mat2 ROT = mat2(0.8, -0.6, 0.6, 0.8);
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = ROT * p * 2.02 + vec2(17.1, 9.2);
    a *= 0.42;
  }
  return v / 0.8;
}

// Error function (accurate to ~1e-4), for the Gaussian-blurred band edges.
float erf_(float x) {
  float a = 0.147;
  float x2 = x * x;
  float e = 1.0 - exp(-x2 * (1.2732395 + a * x2) / (1.0 + a * x2));
  return sign(x) * sqrt(max(e, 0.0));
}

void main() {
  // CSS px, origin at the bottom left, like the layer geometry.
  vec2 px = gl_FragCoord.xy / uDpr;
  float t = uTime;

  // Domain-warped noise: noise that bends other noise, so the boundaries
  // swirl like liquids mixing instead of rolling like regular waves.
  vec2 p = px * vec2(0.0032, 0.0048);
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.05)),
                fbm(p + vec2(5.2, 1.3) - vec2(t * 0.04, 0.0)));
  float w = fbm(p + 1.8 * q + vec2(t * 0.03, -t * 0.02));
  float drift = uAmp * (w - 0.5) * 2.0;

  vec3 col = uBg;
  for (int i = 0; i < ${MAX_LAYERS}; i++) {
    if (i >= uCount) break;
    vec4 b = uBand[i];
    float y = px.y + drift * b.w;
    float s = max(b.z, 0.5) * 1.41421356;
    float cover = 0.5 * (erf_((y - b.x) / s) - erf_((y - b.y) / s));
    col = mix(col, uColor[i], clamp(cover, 0.0, 1.0));
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("Liquid shader:", gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

export function LiquidCanvas({ layers, resetKey, dragging, background, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Latest props, read by the animation loop without restarting it.
  const latest = useRef({ layers, resetKey, dragging, background });
  useEffect(() => {
    latest.current = { layers, resetKey, dragging, background };
  });

  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) {
      onReadyRef.current(false);
      return;
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      onReadyRef.current(false);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("Liquid shader:", gl.getProgramInfoLog(program));
      onReadyRef.current(false);
      return;
    }
    gl.useProgram(program);

    // One triangle pair covering the canvas.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      dpr: gl.getUniformLocation(program, "uDpr"),
      time: gl.getUniformLocation(program, "uTime"),
      amp: gl.getUniformLocation(program, "uAmp"),
      count: gl.getUniformLocation(program, "uCount"),
      band: gl.getUniformLocation(program, "uBand"),
      color: gl.getUniformLocation(program, "uColor"),
      bg: gl.getUniformLocation(program, "uBg"),
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Eased copy of the band geometry, so steps and snaps glide.
    let shown: number[] = [];
    let shownKey = "";
    let shownCount = -1;

    const bands = new Float32Array(MAX_LAYERS * 4);
    const colors = new Float32Array(MAX_LAYERS * 3);

    let frame = 0;
    let last = performance.now();
    let clock = 0;
    let mixClock = 0; // seconds the current drink has been on screen
    let ready = false;

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!reducedMotion.matches) clock += dt * WAVE_SPEED;

      // Match the canvas to its on-screen size (capped for performance).
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (w === 0 || h === 0) return;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }

      const { layers: target, resetKey: key, dragging: drag, background: bg } = latest.current;
      const count = Math.min(target.length, MAX_LAYERS);
      const flat = target.slice(0, count).flatMap((l) => [l.lo, l.hi, l.blur]);
      if (key !== shownKey) mixClock = 0; // a new drink starts unmixed
      mixClock += dt;
      if (key !== shownKey || count !== shownCount || drag || reducedMotion.matches) {
        shown = flat;
        shownKey = key;
        shownCount = count;
      } else {
        // Ease toward the target (about 90% of the way in 0.2s).
        const k = 1 - Math.exp(-dt / 0.08);
        shown = shown.map((v, i) => v + (flat[i] - v) * k);
      }

      for (let i = 0; i < count; i++) {
        bands.set([shown[i * 3], shown[i * 3 + 1], shown[i * 3 + 2], target[i].still ? 0 : 1], i * 4);
        colors.set(hexToRgb(target[i].color), i * 3);
      }

      gl.uniform1f(u.dpr, dpr);
      gl.uniform1f(u.time, clock);
      // 0 while unmixed, easing smoothly up to 1 once the delay has passed.
      const m = Math.min(1, Math.max(0, (mixClock - MIX_DELAY) / MIX_RAMP));
      const mix = m * m * (3 - 2 * m);
      gl.uniform1f(u.amp, WAVE_AMPLITUDE * mix);
      gl.uniform1i(u.count, count);
      gl.uniform4fv(u.band, bands);
      gl.uniform3fv(u.color, colors);
      gl.uniform3fv(u.bg, hexToRgb(bg));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!ready) {
        ready = true;
        onReadyRef.current(true);
      }
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
