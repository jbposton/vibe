"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * A wide-lens flare over the side drinks (JP, 2026-11-25). It uses the technique tried with the Warp Carousel
 * experiment (/warp), written for this app: toward each side of the page a drink stretches sideways, flares
 * taller, splits into faint colored fringes and smears. The middle drink is the real, live one, untouched.
 *
 * How: the real cards stay where they are (clicks and the carousel work as before) but the part of the row
 * beside the middle drink is hidden. Every frame this reads exactly what those cards look like right now
 * (position, tilt, fade, layers, wave, labels), paints a copy onto an off-screen picture, and a small WebGL
 * program draws that picture through the lens. Where the lens meets the middle drink it does nothing at all, so
 * there is no seam. It only repaints when something has changed. Works wherever WebGL2 does (including Safari).
 */
const LENS = {
  strength: 1, // everything below, scaled (0 = no lens)
  start: 0.18, // how far out from the middle drink the lens begins, as a share of the side's width (0 = at its edge)
  stretch: 0.31, // how much of the side's width is stretched out toward the page edge (keep under 0.33)
  flare: 0.62, // how much taller the picture grows at the page edge
  fringe: 0.1, // how far red and blue separate at the page edge
  smear: 30, // how far the picture is smeared sideways at the page edge (px)
  fade: 1, // the app's own side gradient, laid over the lens (1 = all of it, as before the lens; JP, 2026-11-25)
  onset: 0.3, // the side gradient eases in over this much of its length, so it has no hard start
  dissolve: 0.9, // how far the very edge melts into the page, so the lens has no hard end (0 to 1)
};

const PAGE = "#1A1612";
const CARD_RADIUS = 38;

const never = () => () => {};
let supported: boolean | null = null;
const detect = () => (supported ??= !!document.createElement("canvas").getContext("webgl2"));
/** Whether this browser can draw the lens (false while rendering on the server). */
export const useLensSupport = () => useSyncExternalStore(never, detect, () => false);

const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D tex;
uniform vec2 size;    // the row, in CSS px
uniform float ratio;  // device px per CSS px
uniform float edge;   // from the middle of the row to the edge of the middle drink
uniform float fadeLen;
uniform vec3 page;
uniform float strength, stretch, flare, fringe, smear, fadeKeep, dissolve, start, onset;
out vec4 color;

void main() {
  vec2 px = vec2(gl_FragCoord.x, size.y * ratio - gl_FragCoord.y) / ratio; // from the top left
  vec2 c = px - size * 0.5;
  float a = abs(c.x) - edge;
  // The lens reaches 1.5px over the real middle drink, covering the soft edge of its mask (no hairline).
  if (a < -1.5) { color = vec4(0.0); return; }
  float inside = min(a, 0.0); // over the middle drink: no lens, an exact copy
  a = max(a, 0.0);
  float whole = max(size.x * 0.5 - edge, 1.0);
  float gap = start * whole;               // a clear stretch beside the middle drink
  float side = max(whole - gap, 1.0);      // what is left for the lens
  float u = clamp((a - gap) / side, 0.0, 1.0);
  float side_sign = c.x < 0.0 ? -1.0 : 1.0;

  vec3 mixed;
  for (int ch = 0; ch < 3; ch++) {
    float k = float(ch) - 1.0; // red -1, green 0, blue 1
    // Sideways: borrow from nearer the middle, more and more, which stretches the picture outward.
    float from = inside + a - strength * stretch * side * u * u * u + k * strength * fringe * side * u * u * u;
    // Up and down: the picture grows taller toward the page edge; red a little more than blue.
    float grow = (1.0 + strength * flare * pow(u, 2.4)) * (1.0 - k * strength * fringe * u * u * u);
    vec2 at = vec2(size.x * 0.5 + side_sign * (edge + from), size.y * 0.5 + c.y / grow);
    // Smear by asking for a wider patch of the picture (smooth, with no stepped copies).
    float wide = 1.0 + strength * smear * pow(u, 2.5);
    vec4 s = textureGrad(tex, at / size, vec2(wide / size.x, 0.0), vec2(0.0, 1.0 / (size.y * ratio)));
    mixed[ch] = s[ch];
  }
  // Over it all, the side gradient, measured from the middle drink's edge.
  float t = clamp(a / max(fadeLen, 1.0), 0.0, 1.0);
  // It eases in. Starting at full steepness drew a crease down any drink sliding across the join.
  float keep = mix(1.0, pow(1.0 - t, 2.5), fadeKeep * smoothstep(0.0, onset, t));
  keep *= 1.0 - dissolve * smoothstep(0.55, 1.0, u);
  color = vec4(mix(page, mixed, keep), 1.0);
}`;

/** Where `el` sits inside `root`, from layout alone (so transforms don't count). */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

/** Paint a copy of a drink card as it looks right now, read from the real one. */
function paintCard(ctx: CanvasRenderingContext2D, card: HTMLElement) {
  const section = card.querySelector("section");
  if (!section) return;
  const W = section.clientWidth;
  const H = section.clientHeight;
  const cardAlpha = ctx.globalAlpha; // the whole card's own fade, which everything on it shares
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, CARD_RADIUS);
  ctx.clip();

  section.querySelectorAll<HTMLElement>("div.layer-anim[aria-hidden]").forEach((block) => {
    ctx.fillStyle = getComputedStyle(block).backgroundColor;
    ctx.fillRect(0, block.offsetTop, W, block.offsetHeight + 0.5);
  });

  // The wave on the bottom layer, with whatever shape it has at this moment.
  const wave = section.querySelector<SVGSVGElement>("svg[aria-hidden]:not([width='0'])");
  const path = wave?.querySelector("path");
  const strip = wave?.querySelector("rect");
  if (wave && path && wave.style.display !== "none" && path.getAttribute("d")) {
    const h = Number(wave.getAttribute("height")) || 0;
    const shift = Number(/translateY\(([-\d.]+)px\)/.exec(wave.style.transform)?.[1] ?? 0);
    const top = H - (parseFloat(wave.style.bottom) || 0) - h + shift;
    ctx.save();
    ctx.translate(0, top);
    ctx.scale(W / 100, 1);
    if (strip) {
      ctx.fillStyle = getComputedStyle(strip).fill;
      ctx.fillRect(0, 0, 100, Number(strip.getAttribute("height")) || 0);
    }
    ctx.fillStyle = getComputedStyle(path).fill;
    ctx.fill(new Path2D(path.getAttribute("d") ?? ""));
    ctx.restore();
  }

  // The words: every piece of text, in its own place and style.
  section.querySelectorAll<HTMLElement>("span.label-anim span").forEach((span) => {
    if (span.children.length > 0 || !span.textContent) return;
    const style = getComputedStyle(span);
    let alpha = 1;
    for (let n: HTMLElement | null = span; n && n !== section; n = n.parentElement) alpha *= Number(getComputedStyle(n).opacity);
    const { x, y } = offsetIn(span, section);
    ctx.globalAlpha = cardAlpha * alpha;
    ctx.fillStyle = style.color;
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
    ctx.textBaseline = "middle";
    ctx.fillText(style.textTransform === "uppercase" ? span.textContent.toUpperCase() : span.textContent, x, y + span.offsetHeight / 2);
    ctx.globalAlpha = cardAlpha;
  });
  ctx.restore();
}

/** Apply an element's current transform (mid-transition values included) around its transform origin. */
function applyTransform(ctx: CanvasRenderingContext2D, el: HTMLElement, style: CSSStyleDeclaration) {
  const [ox, oy] = style.transformOrigin.split(" ").map(parseFloat);
  const m = new DOMMatrix(style.transform === "none" ? undefined : style.transform);
  ctx.translate(el.offsetLeft + ox, el.offsetTop + oy);
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  ctx.translate(-el.offsetLeft - ox, -el.offsetTop - oy);
}

export function SideLens({ cardWidth, zoom: aim = 1 }: { cardWidth: number; /** The zoom the row is heading to. */ zoom?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const width = useRef(cardWidth);
  const aimed = useRef(aim);
  useEffect(() => {
    width.current = cardWidth;
    aimed.current = aim;
  }, [cardWidth, aim]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const track = canvas?.parentElement?.querySelector<HTMLElement>('[aria-roledescription="carousel"]');
    const gl = canvas?.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!canvas || !track || !gl) return;

    const shader = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(program, 0, "p");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 16);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const u = { size: uniform("size"), ratio: uniform("ratio"), edge: uniform("edge"), fadeLen: uniform("fadeLen"), page: uniform("page") };
    gl.uniform3f(u.page, 0x1a / 255, 0x16 / 255, 0x12 / 255);
    for (const key of ["strength", "stretch", "flare", "fringe", "smear", "start", "onset"] as const) gl.uniform1f(uniform(key), LENS[key]);
    gl.uniform1f(uniform("fadeKeep"), LENS.fade);
    gl.uniform1f(uniform("dissolve"), LENS.dissolve);

    const picture = document.createElement("canvas");
    const ctx = picture.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let drawn = "";
    let masked = -1;

    const paint = () => {
      const row = track.querySelector<HTMLElement>(".build-zoom");
      const W = track.clientWidth;
      const H = track.clientHeight;
      if (!row || W === 0 || H === 0 || width.current <= 0) return;
      // As sharp as the real drink, or the change in sharpness shows as a line too.
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rowStyle = getComputedStyle(row);
      const zoom = rowStyle.transform === "none" ? 1 : new DOMMatrix(rowStyle.transform).a;
      // While the drink is growing, open the window to the size it is heading for straight away: the browser
      // can be a step ahead of what is read here, and a window that trails it would trim the drink.
      const edge = (width.current * Math.max(zoom, aimed.current)) / 2;
      const fadeLen = parseFloat(getComputedStyle(track).getPropertyValue("--side-fade")) || 0;

      // Hide the real cards beside the middle drink (a mask, so they can still be clicked).
      if (Math.abs(edge - masked) > 0.1) {
        masked = edge;
        const at = (sign: string) => `calc(50% ${sign} ${edge.toFixed(1)}px)`;
        const mask = `linear-gradient(to right, transparent ${at("-")}, black ${at("-")}, black ${at("+")}, transparent ${at("+")})`;
        track.style.maskImage = mask;
        track.style.webkitMaskImage = mask;
      }

      const cards = [...row.children].map((el) => {
        const card = el as HTMLElement;
        const style = getComputedStyle(card);
        const dim = card.querySelector<HTMLElement>("[data-dim]");
        return { card, style, opacity: Number(style.opacity), dim: dim ? Number(getComputedStyle(dim).opacity) : 0, z: Number(style.zIndex) || 0 };
      });
      const trackOpacity = Number(getComputedStyle(track).opacity);
      // Everything that can change the picture. If it is all the same as last time, keep what is on screen.
      const state = [
        W, H, ratio, edge.toFixed(1), fadeLen.toFixed(0), rowStyle.transform, rowStyle.opacity, trackOpacity,
        ...cards.map((c) =>
          c.opacity < 0.01 || c.style.visibility === "hidden"
            ? "-"
            : `${c.style.transform}|${c.opacity}|${c.dim}|${c.card.querySelector("svg path")?.getAttribute("d")?.slice(0, 160)}|${c.card.textContent}|${[...c.card.querySelectorAll<HTMLElement>("div.layer-anim[aria-hidden]")].map((b) => `${b.offsetHeight}${b.style.background}`).join()}`,
        ),
      ].join("~");
      if (state === drawn) return;
      drawn = state;

      canvas.style.height = `${H}px`;
      const pw = Math.round(W * ratio);
      const ph = Math.round(H * ratio);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = picture.width = pw;
        canvas.height = picture.height = ph;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.fillStyle = PAGE;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      applyTransform(ctx, row, rowStyle);
      for (const c of [...cards].sort((a, b) => a.z - b.z)) {
        if (c.opacity < 0.01 || c.style.visibility === "hidden") continue;
        const section = c.card.querySelector("section");
        if (!section) continue;
        ctx.save();
        applyTransform(ctx, c.card, c.style);
        ctx.translate(c.card.offsetLeft, c.card.offsetTop);
        ctx.globalAlpha = c.opacity * Number(rowStyle.opacity) * trackOpacity;
        paintCard(ctx, c.card);
        if (c.dim > 0) {
          ctx.globalAlpha *= c.dim;
          ctx.fillStyle = "#000";
          ctx.beginPath();
          ctx.roundRect(0, 0, c.card.offsetWidth, c.card.offsetHeight, CARD_RADIUS);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();

      gl.viewport(0, 0, pw, ph);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, picture);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform2f(u.size, W, H);
      gl.uniform1f(u.ratio, ratio);
      gl.uniform1f(u.edge, edge);
      gl.uniform1f(u.fadeLen, fadeLen);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    // The copy has to be painted AFTER the carousel and the wave have moved things this frame, or it trails
    // them by a frame and the two halves of a sliding drink don't meet. A size observer is told about changes
    // after every animation-frame callback has run but before the screen is drawn, so each frame we nudge a
    // hidden element's size and paint when the observer hears of it.
    const nudge = document.createElement("div");
    nudge.setAttribute("aria-hidden", "true");
    nudge.style.cssText = "position:absolute;left:0;top:0;height:0;width:0;pointer-events:none";
    canvas.parentElement!.appendChild(nudge);
    const afterMotion = new ResizeObserver(paint);
    afterMotion.observe(nudge);
    let wide = false;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      wide = !wide;
      nudge.style.width = wide ? "1px" : "0px";
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      afterMotion.disconnect();
      nudge.remove();
      track.style.maskImage = "";
      track.style.webkitMaskImage = "";
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
    };
  }, []);

  // The canvas lies exactly over the row of cards; the real row is its sibling.
  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[9]" />;
}
