"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { DRINKS, type RecipeLine } from "@/data/drinks";
import { flavorProfile } from "@/lib/flavor";
import { useTuning } from "@/lib/tuning";
import { SpacingPanel } from "./dev/SpacingPanel";
import { DrinkCard } from "./DrinkCard";
import { CLASSICS_ID, FILTERS, filterList } from "@/data/finder";
import { FilterBar } from "./FilterBar";
import { PrepTags } from "./PrepIcons";
import { DRAWER_TOP, EditPanel, PANEL_CLOSED_HEIGHT } from "./EditPanel";
import { ServingsRow } from "./ServingsRow";
import { useSheet } from "./useSheet";
import { adjustLine, traitEdits } from "@/lib/edits";
import { swapIngredient } from "@/lib/swap";
import { DEFAULT_UNIT, formatTotal, totalParts } from "@/lib/stack";
import { FlavorLadders } from "./FlavorLadders";
import { tasteSummary } from "@/lib/flavor";

// OPEN: which drink a visitor sees first (brief §1 flow). Placeholder: Negroni.
const START_DRINK = Math.max(0, DRINKS.findIndex((d) => d.id === "negroni"));

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The drink card's fixed shape: width divided by height. 0.9 is the Figma panel
 * (370 x 410), which leaves room for the edit panel under it: 343 x 381 on a
 * 375 x 812 phone with the 16px margin (CARD_MARGIN, now 25px, so the card is narrower).
 * OPEN: the exact proportion (JP, 2026-11-16: "fixed proportion, scales down a bit").
 */
const CARD_ASPECT = 0.9;
/** Wide screens: the edit panel's scrollbar, as a share of the length the browser would give it. */
const THUMB_SCALE = 0.8;

/**
 * The swipe-up drawer (Figma 187:43). At --p = 1 the edit panel has gone all the way up to just under
 * the header (DRAWER_TOP), covering the drink; the browse filters have moved back and gone, the
 * header is up and a little smaller but at full strength, and a picture of the drink shows to its
 * right. These are how far each part moves.
 */
const SHEET = {
  filtersBack: 260, // px the filters move back (z) before they fade out
  headerUp: 55, // px the header moves up (into the space the filters leave): the name's top lands where the browse filters' top is when the drawer is closed (JP, 2026-11-17)
  titleScale: 0.7, // the drink name shrinks from 40px to 28px
  titleGap: 16, // px the label under the name follows the shrinking name up (closer to the name, JP 2026-11-17)
};

/** Phone layout: the middle card with its neighbors peeking in at the sides. */
const SIDE_SCALE = 0.86; // size of the cards beside the middle one
const CARD_MARGIN = 25; // px between the middle card and each side of the screen (Figma 187:43: 352px on a 402px screen)
const GAP = 8; // px between the middle card and a side card (more space = a smaller sliver of the side card shows)
const DESKTOP_GAP = 32; // the same on wide screens

/**
 * The mask that fades the side drinks on wide screens: full strength across the middle card, then
 * an eased fall-off on each side over `fade` px (fast near the card, a long gentle tail),
 * drawn with many small steps so it reads as one soft gradient rather than a hard line.
 */
/** Wide screens: the fade at the bottom of the edit panel, from clear to the panel's color on an eased curve. */
const BOTTOM_SCRIM = `linear-gradient(to bottom, ${Array.from({ length: 13 }, (_, k) => {
  const t = k / 12;
  return `rgba(33,32,30,${(1 - Math.pow(1 - t, 2.5)).toFixed(3)}) ${(t * 100).toFixed(1)}%`;
}).join(", ")})`;

function sideFadeMask(cardWidth: number, fade: number): string {
  const steps = 20;
  const half = cardWidth / 2;
  const stop = (k: number, side: -1 | 1) => {
    const t = k / steps; // 0 at the card's edge, 1 where the fade ends
    // Drops quickly near the card (in the gap, where nothing shows) and then trails off very gently,
    // so the side drinks are mostly hidden but there is no visible edge.
    const a = Math.pow(1 - t, 2.5);
    return `rgba(0,0,0,${a.toFixed(3)}) calc(50% ${side < 0 ? "-" : "+"} ${(half + fade * t).toFixed(1)}px)`;
  };
  const left = Array.from({ length: steps + 1 }, (_, k) => stop(steps - k, -1));
  const right = Array.from({ length: steps + 1 }, (_, k) => stop(k, 1));
  return `linear-gradient(to right, ${[...left, ...right].join(", ")})`;
}
const SIDE_DIM = 0.6; // how dark a card at the side gets (black overlay opacity)
/** How far a finger moves (px) before it counts as a swipe rather than a tap. */
const SLOP = 6;
/** A swipe this fast (px/ms) flips to the next drink even if it was short. */
const FLICK = 0.4;

const DESKTOP = "(min-width: 768px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const getDesktop = () => window.matchMedia(DESKTOP).matches;

type Pointer = { id: number; x: number; y: number; owned: boolean; moved: boolean };

export function DrinkPanel() {
  // On a wide screen there's one big card and ‹ › buttons, as before. On a
  // phone the cards sit in a row and you swipe through them.
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktop, () => false);
  // Wide-screen spacing and sizes (lib/tuning.ts); the dev-only spacing panel can change them live.
  const tune = useTuning();
  // Room under the card for the serving row: the gap, the 36px buttons, 8px, and the "Servings" line.
  const SERVING_ROOM = tune.cardToServings + 36 + 8 + Math.round(tune.servingsSize * 1.33);

  // The swipe-up edit sheet. It drives `--p` (0 closed, 1 open) on <main>; the CSS
  // below reads it, so nothing re-renders while it moves.
  const mainRef = useRef<HTMLElement | null>(null);
  // The drawer goes from its closed height up to just under the header, so how far it travels
  // depends on the screen's height.
  const [mainHeight, setMainHeight] = useState(812);
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setMainHeight(entry.contentRect.height + 32));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const travel = Math.max(240, mainHeight - DRAWER_TOP - PANEL_CLOSED_HEIGHT);

  // Wide screens: the edit panel's scrollbar is our own (the browser's is hidden): a fully rounded bar
  // that is THUMB_SCALE of the length the browser would give it, running the panel's full height (24px
  // clear of each rounded corner). It is moved straight from the scroll position, so it glides with it.
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const scrollEl = useRef<HTMLDivElement | null>(null);
  const thumbGeom = useRef({ len: 0, travel: 0 });
  const placeThumb = useCallback(() => {
    const el = scrollEl.current;
    const thumb = thumbRef.current;
    if (!el || !thumb) return;
    const track = Math.max(0, el.clientHeight - 48);
    const room = el.scrollHeight - el.clientHeight;
    if (room <= 1) {
      thumb.style.display = "none";
      return;
    }
    thumb.style.display = "";
    const len = Math.max(48, (track * el.clientHeight * THUMB_SCALE) / el.scrollHeight);
    const travel = Math.max(0, track - len);
    thumbGeom.current = { len, travel };
    thumb.style.height = `${len}px`;
    thumb.style.transform = `translateY(${(24 + (travel * el.scrollTop) / room).toFixed(2)}px)`;
  }, []);
  const panelScrollRef = useCallback(
    (el: HTMLDivElement | null) => {
      scrollEl.current = el;
      if (!el) return;
      placeThumb();
      const observer = new ResizeObserver(placeThumb);
      observer.observe(el);
      if (el.firstElementChild) observer.observe(el.firstElementChild);
      el.addEventListener("scroll", placeThumb, { passive: true });
      return () => {
        observer.disconnect();
        el.removeEventListener("scroll", placeThumb);
      };
    },
    [placeThumb],
  );
  useLayoutEffect(placeThumb); // the bar appears on desktop after the first render
  // Dragging the bar scrolls the list.
  const thumbDrag = useRef<{ id: number; y: number; top: number } | null>(null);
  const onThumbDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollEl.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    thumbDrag.current = { id: e.pointerId, y: e.clientY, top: el.scrollTop };
  };
  const onThumbMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = thumbDrag.current;
    const el = scrollEl.current;
    if (!d || !el || d.id !== e.pointerId) return;
    const { travel } = thumbGeom.current;
    const room = el.scrollHeight - el.clientHeight;
    if (travel > 0) el.scrollTop = d.top + ((e.clientY - d.y) * room) / travel;
  };
  const onThumbUp = () => {
    thumbDrag.current = null;
  };
  const sheet = useSheet({ distance: travel, rootRef: mainRef, enabled: !isDesktop });

  // Which quick filter is picked, and so which drinks are in the row. `list`
  // holds positions in DRINKS. `index` and `infoIndex` below are places in
  // this list; edits and servings stay filed under the drink's own position in
  // DRINKS, so they survive changing filters.
  const [filterId, setFilterId] = useState(CLASSICS_ID);
  const list = useMemo(() => filterList(filterId), [filterId]);
  const N = list.length;

  const [index, setIndex] = useState(START_DRINK); // the drink in the middle
  const [infoIndex, setInfoIndex] = useState(START_DRINK); // the drink nearest the middle (while swiping)
  const [busy, setBusy] = useState(false); // swiping, or settling after a swipe
  // Edited recipes, by drink. A drink you haven't touched isn't in here. Each
  // card keeps its edits when you swipe away and back.
  const [edits, setEdits] = useState<Record<number, RecipeLine[]>>({});
  const [trackSize, setTrackSize] = useState({ width: 0, height: 0 });
  // How many drinks each recipe makes (default 1). Scales the oz, never the parts.
  const [servings, setServings] = useState<Record<number, number>>({});

  const trackRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setTrackSize({ width: el.clientWidth, height: el.clientHeight }); // measure now; the observer keeps it current
    const observer = new ResizeObserver(([entry]) =>
      setTrackSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Card sizes: the middle card leaves room for a sliver of its neighbors.
  // On a wide screen the card keeps one fixed shape (CARD_ASPECT) and shrinks to fit when there
  // isn't room, instead of stretching to fill whatever height is left.
  // Wide screens leave room beside the card for the round ‹ › buttons (44px plus a 16px gap, each side).
  const maxCardWidth = isDesktop ? Math.max(0, trackSize.width - 2 * (44 + 16)) : Math.max(0, trackSize.width - 2 * CARD_MARGIN);
  // On a phone the card is always as wide as the edit panel (the screen less the 16px margins) and
  // gets shorter, not narrower, when the screen is short (JP, 2026-11-16). Wide screens keep the shape.
  // Wide screens: the card is 80% of the size it could be (JP, 2026-11-18), centered in its panel.
  const cardWidth = isDesktop
    ? Math.max(0, Math.min(maxCardWidth, (trackSize.height - SERVING_ROOM) * CARD_ASPECT)) * tune.cardScale
    : maxCardWidth;
  const cardHeight = isDesktop ? cardWidth / CARD_ASPECT : Math.min(cardWidth / CARD_ASPECT, trackSize.height);
  // Wide screens: the card and the serving row under it, as one group, sit centered top to bottom in the
  // right column. That column spans the same height as everything on the left (the drink name down to
  // the bottom of the edit panel), so the two sides share a middle line at any window size (JP, 2026-11-18).
  const cardTop = Math.max(0, (trackSize.height - SERVING_ROOM - cardHeight) / 2);
  const step = cardWidth / 2 + (cardWidth * SIDE_SCALE) / 2 + (isDesktop ? DESKTOP_GAP : GAP);

  // ── Carousel motion ─────────────────────────────────────────────────────
  // Positions are written straight to the card elements (no React render per
  // frame). `p` is how far the row has moved, in cards: +1 means the previous
  // drink has come all the way to the middle, -1 the next one.
  const ctl = useRef({
    n: DRINKS.length, // how many drinks are in the row
    index: START_DRINK,
    info: START_DRINK,
    p: 0,
    raf: 0,
    swiping: false,
    animating: false,
    startX: 0,
    baseP: 0,
    moves: [] as { t: number; x: number }[],
    desktop: false,
    cardWidth: 0,
    step: 0,
    pointer: null as Pointer | null,
  });
  const cardEls = useRef(new Map<number, HTMLElement>());

  const applyTransforms = useCallback(() => {
    const c = ctl.current;
    cardEls.current.forEach((el, j) => {
      const h = Math.floor((c.n - 1) / 2);
      const r = mod(j - c.index + h, c.n) - h; // card's place relative to the middle one
      const t = r + c.p; // 0 = in the middle, ±1 = one card over
      // Wide screens show the side drinks too (JP, 2026-11-18), so both layouts move the same way.
      const scale = 1 - (1 - SIDE_SCALE) * Math.min(Math.abs(t), 1);
      const x = t * c.step;
      el.style.transform = `translate3d(${(x - c.cardWidth / 2).toFixed(2)}px,0,0) scale(${scale.toFixed(4)})`;
      // The cards beside the middle one fade out as the edit sheet comes up (--p), so only
      // the drink in view stays.
      el.style.opacity = Math.abs(t) < 0.5 ? "1" : "calc(1 - var(--p, 0) * 3)";
      // Cards fade to dark the further they are from the middle, and back up as they arrive.
      const dim = el.querySelector<HTMLElement>("[data-dim]");
      if (dim) dim.style.opacity = String((SIDE_DIM * Math.min(Math.abs(t), 1)).toFixed(3));
      el.style.zIndex = String(10 - Math.round(Math.abs(t) * 3));
      el.style.visibility = Math.abs(t) > 2.2 ? "hidden" : "visible";
    });
  }, []);

  // Keep every card's position in step with the latest layout and drink order.
  useLayoutEffect(() => {
    const c = ctl.current;
    c.n = N;
    c.desktop = isDesktop;
    c.cardWidth = cardWidth;
    c.step = step;
    applyTransforms();
  });

  const setP = useCallback(
    (p: number) => {
      const c = ctl.current;
      c.p = p;
      applyTransforms();
      // The info (name, counter) follows whichever drink is nearest the middle.
      const near = mod(c.index - Math.round(p), c.n);
      if (near !== c.info) {
        c.info = near;
        setInfoIndex(near);
      }
    },
    [applyTransforms],
  );

  /** Glide the row to `target` (-1 next, 0 stay, +1 previous), then commit. */
  const settleTo = useCallback(
    (target: number) => {
      const c = ctl.current;
      cancelAnimationFrame(c.raf);
      c.animating = true;
      setBusy(true);
      const from = c.p;
      const distance = Math.abs(target - from);
      const duration = window.matchMedia(REDUCED_MOTION).matches || distance === 0 ? 0 : 240 + 160 * distance;
      const t0 = performance.now();

      const finish = () => {
        if (target !== 0) {
          c.index = mod(c.index - target, c.n);
          setIndex(c.index);
        }
        // The cards stay exactly where they are: positions are now measured
        // from the new middle card, so nothing visibly jumps.
        c.p = 0;
        applyTransforms();
        if (c.info !== c.index) {
          c.info = c.index;
          setInfoIndex(c.index);
        }
        c.animating = false;
        setBusy(false);
      };
      const tick = (now: number) => {
        const k = duration === 0 ? 1 : Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - k, 3); // quick swipes ease out
        setP(from + (target - from) * eased);
        if (k < 1) c.raf = requestAnimationFrame(tick);
        else finish();
      };
      c.raf = requestAnimationFrame(tick);
    },
    [applyTransforms, setP],
  );

  /** Swiping: the row follows the finger, then settles on a drink when it lifts. */
  const swipe = useMemo(
    () => ({
      begin(x: number) {
        const c = ctl.current;
        cancelAnimationFrame(c.raf); // catch a row that's still settling
        c.animating = false;
        c.swiping = true;
        c.baseP = c.p;
        c.startX = x;
        c.moves = [{ t: performance.now(), x }];
        setBusy(true);
      },
      move(x: number) {
        const c = ctl.current;
        if (!c.swiping || c.step <= 0) return;
        const t = performance.now();
        c.moves.push({ t, x });
        while (c.moves.length > 2 && t - c.moves[0].t > 100) c.moves.shift();
        setP(clamp(c.baseP + (x - c.startX) / c.step, -1, 1));
      },
      end() {
        const c = ctl.current;
        if (!c.swiping) return;
        c.swiping = false;
        // Speed of the last ~100ms, in px per ms (0 if the finger rested before lifting).
        const first = c.moves[0];
        const last = c.moves[c.moves.length - 1];
        const span = last.t - first.t;
        const v = span > 10 && performance.now() - last.t < 80 ? (last.x - first.x) / span : 0;
        let target = 0;
        if (Math.abs(v) > FLICK) {
          const dir = v > 0 ? 1 : -1;
          target = c.p !== 0 && Math.sign(c.p) !== dir ? 0 : dir; // a flick against the drag cancels it
        } else if (Math.abs(c.p) > 0.3) {
          target = c.p > 0 ? 1 : -1;
        }
        settleTo(target);
      },
    }),
    [setP, settleTo],
  );

  /** Go to the next (+1) or previous (-1) drink. */
  const goBy = useCallback(
    (delta: number) => {
      const c = ctl.current;
      if (c.n < 2) return;
      if (c.swiping || c.animating) return;
      settleTo(delta > 0 ? -1 : 1);
    },
    [settleTo],
  );

  // ← / → switch drinks.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.getAttribute("role") === "slider") return;
      if (e.key === "Escape") sheet.closeSheet();
      if (sheet.open) return; // arrows don't switch drinks with the edit panel up
      if (e.key === "ArrowLeft") goBy(-1);
      if (e.key === "ArrowRight") goBy(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBy, sheet]);

  // ── Pointer handling on the row ──────────────────────────────────────────
  // A drag that starts on a layer is decided by the layer itself (vertical =
  // change the amount, sideways = hand over to us via `swipe.begin`). A touch
  // anywhere else on the row, such as a peeking card, is ours from the start.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const c = ctl.current;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (sheet.open) return; // with the edit panel up, only the one drink is in focus
    // The reset button handles its own taps.
    if ((e.target as Element).closest("[data-no-swipe]")) return;
    // One finger at a time. A new first finger replaces a touch whose lift was never seen.
    if (c.pointer && c.pointer.id !== e.pointerId && !e.isPrimary) return;
    const owned = !!(e.target as Element).closest("[data-layer-drag]");
    c.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, owned, moved: false };
    if (!owned) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // The pointer already ended (a very quick tap): nothing to capture.
      }
    }
    if (c.animating) swipe.begin(e.clientX); // grab the row while it's still settling
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const c = ctl.current;
    const ptr = c.pointer;
    if (!ptr || ptr.id !== e.pointerId) return;
    if (c.swiping) {
      swipe.move(e.clientX);
      return;
    }
    if (ptr.owned || ptr.moved) return;
    const dx = e.clientX - ptr.x;
    const dy = e.clientY - ptr.y;
    if (dx * dx + dy * dy < SLOP * SLOP) return;
    ptr.moved = true;
    if (Math.abs(dx) > Math.abs(dy)) swipe.begin(e.clientX);
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const c = ctl.current;
    const ptr = c.pointer;
    if (!ptr || ptr.id !== e.pointerId) return;
    c.pointer = null;
    if (c.swiping) {
      swipe.end();
      return;
    }
    if (e.type === "pointerup" && !ptr.owned && !ptr.moved) {
      // A tap on a card peeking at the side brings it to the middle.
      const rect = e.currentTarget.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      if (e.clientX < mid - c.cardWidth / 2) goBy(-1);
      else if (e.clientX > mid + c.cardWidth / 2) goBy(1);
    }
  };

  // A layer drag on a card became a sideways swipe.
  const onHorizontal = useCallback((x: number) => swipe.begin(x), [swipe]);

  const onEdit = useCallback(
    (drinkIndex: number, update: (prev: RecipeLine[]) => RecipeLine[]) =>
      setEdits((all) => ({ ...all, [drinkIndex]: update(all[drinkIndex] ?? DRINKS[drinkIndex].lines) })),
    [],
  );

  // ── Info for the drink nearest the middle ────────────────────────────────
  const infoD = list[infoIndex] ?? list[0]; // the info drink's place in DRINKS
  const infoDrink = DRINKS[infoD];
  const infoLines = edits[infoD] ?? infoDrink.lines;
  // Put a drink back to its classic recipe and one serving.
  const resetDrink = useCallback((d: number) => {
    setEdits((all) => {
      const next = { ...all };
      delete next[d];
      return next;
    });
    setServings((all) => {
      const next = { ...all };
      delete next[d];
      return next;
    });
  }, []);

  // Picking a quick filter swaps the row to that curated list. If the drink in
  // the middle is also in the new list we stay on it, otherwise we start at the top.
  const selectFilter = (id: string) => {
    const filter = FILTERS.find((f) => f.id === id);
    if (!filter || filter.placeholder || id === filterId) return;
    const next = filterList(id);
    const c = ctl.current;
    const pos = Math.max(0, next.indexOf(list[c.index]));
    cancelAnimationFrame(c.raf);
    c.animating = false;
    c.swiping = false;
    c.n = next.length;
    c.index = pos;
    c.info = pos;
    c.p = 0;
    setFilterId(id);
    setIndex(pos);
    setInfoIndex(pos);
    setBusy(false);
  };

  // The edit buttons this drink offers (sweeter, more bitter, stronger...), from its classic recipe so they stay put while you edit.
  const editsForDrink = useMemo(() => traitEdits(infoDrink.lines), [infoDrink]);
  const profile = useMemo(() => flavorProfile(infoLines), [infoLines]);
  const infoServings = servings[infoD] ?? 1;
  const setInfoServings = (n: number) => setServings((all) => ({ ...all, [infoD]: n }));

  const navButton =
    "grid size-11 place-items-center rounded-full text-lg text-[#F7F7F7]/60 hover:text-[#F7F7F7] focus-visible:outline-2 focus-visible:outline-[#F7F7F7] max-md:sr-only";

  // The cards in the row: two either side of the middle one, so the next
  // card is already in place while you swipe.
  // With a short list (a filter with few drinks) fewer cards are shown, so the
  // same drink never appears twice.
  const spread = Math.floor((N - 1) / 2);
  const offsets =
    N >= 5
      ? [-2, -1, 0, 1, 2]
      : Array.from({ length: N }, (_, k) => k - spread);

  // Nothing on this screen is meant to be copied, and a drag that strays onto
  // the text would otherwise highlight it, so text selection is off everywhere.
  // Parts of the screen that move with the sheet (phones only): CSS reads --p, which
  // the sheet drives. Only transform and opacity change, so it stays smooth.
  const phone = !isDesktop;
  const zFilters: React.CSSProperties | undefined = phone
    ? {
        transform: `translate3d(0, calc(var(--p, 0) * -14px), calc(var(--p, 0) * -${SHEET.filtersBack}px))`,
        transformOrigin: "50% 0",
        opacity: "calc(1 - var(--p, 0) * 1.6)",
      }
    : undefined;
  // The header stays at full strength (no fading) as it moves up.
  const zHeader: React.CSSProperties | undefined = phone
    ? { transform: `translateY(calc(var(--p, 0) * -${SHEET.headerUp}px))` }
    : undefined;
  const zTitle: React.CSSProperties | undefined = phone
    ? { transform: `scale(calc(1 - var(--p, 0) * ${1 - SHEET.titleScale}))`, transformOrigin: "0 0" }
    : undefined;
  const zFamily: React.CSSProperties | undefined = phone
    ? { transform: `translateY(calc(var(--p, 0) * -${SHEET.titleGap}px))` }
    : undefined;
  // The side drinks and the prep icons fade out first, in the opening third of the swipe.
  const zPrep: React.CSSProperties | undefined = phone ? { opacity: "calc(1 - var(--p, 0) * 3)" } : undefined;
  // The drink (and the serving row) stay put and fade as the drawer rises over them (JP, 2026-11-17).
  const zDrink: React.CSSProperties | undefined = phone ? { opacity: "calc(1 - var(--p, 0) * 1.5)" } : undefined;

  // Nothing on this screen is meant to be copied, and a drag that strays onto
  // the text would otherwise highlight it, so text selection is off everywhere.
  return (
    <main
      ref={mainRef}
      className="fixed inset-0 mx-auto flex max-w-[1440px] flex-col gap-4 overflow-hidden bg-[#1A1612] p-4 text-[#F7F7F7] select-none [-webkit-touch-callout:none] md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:grid-rows-[auto_auto_minmax(0,1fr)] md:gap-x-8 md:gap-y-4"
      style={
        phone
          ? { perspective: 1000, perspectiveOrigin: "50% 30%" }
          : ({
              maxHeight: tune.maxHeight,
              "--filters-gap": `${tune.filtersToLine - 8}px`,
              "--total-size": `${tune.totalSize}px`,
              "--sub-size": `${tune.subSize}px`,
              "--servings-size": `${tune.servingsSize}px`,
            } as React.CSSProperties)
      }
    >
      {/* The browse filters: they move back (z) and disappear when the edit panel comes up. */}
      <div
        className="md:col-span-2 md:row-start-1"
        // Wide screens: the gap above the filters (16px page padding + 8px of their tap area, plus this) and the gap from the squiggly line to the name.
        style={phone ? zFilters : { paddingTop: tune.filtersTop - 24, marginBottom: tune.lineToName - 16 }}
        inert={phone && sheet.open}
      >
        <FilterBar active={filterId} onSelect={selectFilter} />
      </div>

      {/* ── Controls ──────────────────────────────────────────────── */}
      <header className="flex flex-col md:col-start-1 md:row-start-2" style={phone ? zHeader : { marginBottom: tune.labelToPanel - 16 }}>
        {/* On a phone you swipe; these stay for screen readers. Wide screens have round buttons beside the card. */}
        <div className="flex justify-end md:hidden">
          <button type="button" onClick={() => goBy(-1)} aria-label="Previous drink" className={navButton}>
            ‹
          </button>
          <button type="button" onClick={() => goBy(1)} aria-label="Next drink" className={navButton}>
            ›
          </button>
        </div>

        {/* The name and family on the left; how it's made and what it's served in, bottom right, level with the family label (Figma 135:107). */}
        <div className="relative flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-serif text-[40px] leading-[52px] md:text-[50px] md:leading-[64px]" style={zTitle}>
              {infoDrink.name}
            </h1>
            {/* The taste summary, a dot, then the drink's alcohol (both follow your edits). */}
            <p className="mt-1 flex items-center gap-[5px] text-xs opacity-55 md:text-sm" style={zFamily}>
              <span>{tasteSummary(profile)}</span>
              <span aria-hidden className="size-0.5 shrink-0 rounded-full bg-[#7f7f7f]" />
              <span>{Math.round(profile.strength)}% ABV</span>
            </p>
          </div>
          <div className="relative -mr-1" style={zPrep}>
            <PrepTags method={infoDrink.method} glass={infoDrink.glass} />
          </div>
          {/* Once the drawer is up, the Sweet and Bitter ladders take the prep icons' place, their names level with
              the label under the title. */}
          {phone && (
            <div
              aria-hidden={!sheet.open}
              className="pointer-events-none absolute bottom-0 right-0"
              style={{ opacity: "clamp(0, calc((var(--p, 0) - 0.5) * 2), 1)", transform: `translateY(calc(var(--p, 0) * -${SHEET.titleGap}px))` }}
            >
              <FlavorLadders profile={profile} />
            </div>
          )}
        </div>
      </header>

      {/* ── The row of drinks (it moves back and shrinks when the edit panel is up) ── */}
      <div
        className="relative flex min-h-0 flex-1 flex-col md:col-start-2 md:row-span-2 md:row-start-2 md:h-full"
        style={zDrink}
      >
      <div
        ref={trackRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Drinks"
        className="relative -mx-4 min-h-0 flex-1 touch-none overflow-hidden select-none md:mx-0"
        // Wide screens: the side drinks fade out within tune.sideFade px of the card; the middle card stays at full strength.
        style={
          isDesktop
            ? {
                maskImage: sideFadeMask(cardWidth, tune.sideFade),
                WebkitMaskImage: sideFadeMask(cardWidth, tune.sideFade),
              }
            : undefined
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {offsets.map((r) => {
          const j = mod(index + r, N); // place in the list
          const d = list[j]; // place in DRINKS
          return (
            <div
              key={j}
              ref={(el) => {
                if (el) cardEls.current.set(j, el);
                else cardEls.current.delete(j);
              }}
              inert={j !== infoIndex}
              className="absolute left-1/2 top-1/2 will-change-transform"
              // Wide screens: the card sits just above the serving row, which ends at the bottom of the page.
              style={{ width: cardWidth, height: cardHeight, marginTop: isDesktop ? 0 : -cardHeight / 2, ...(isDesktop ? { top: cardTop } : {}) }}
            >
              <DrinkCard
                drink={DRINKS[d]}
                drinkIndex={d}
                lines={edits[d] ?? DRINKS[d].lines}
                onEdit={onEdit}
                interactive={j === infoIndex && !busy && !sheet.open}
                inView={j === infoIndex}
                onHorizontal={onHorizontal}
                servings={servings[d] ?? 1}
                modified={d in edits || (servings[d] ?? 1) !== 1}
                onReset={resetDrink}
              />
              {/* Dims the card when it's at the side; its opacity is set as the row moves. */}
              <div aria-hidden data-dim className="pointer-events-none absolute inset-0 rounded-[38px] bg-black opacity-0" />
            </div>
          );
        })}

      </div>

      {/* Wide screens: a round button on each side of the card, over the faded side drinks (outside the
          row, so the fade doesn't reach them). */}
      {isDesktop &&
        N > 1 &&
        ([
          [-1, "Previous drink", "M10 3L5 8L10 13"],
          [1, "Next drink", "M6 3L11 8L6 13"],
        ] as const).map(([delta, label, d]) => (
          <button
            key={delta}
            type="button"
            onClick={() => goBy(delta)}
            aria-label={label}
            className="absolute z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-[#21201E]/50 text-white backdrop-blur-md transition-colors hover:bg-[#2C2A27]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]"
            style={{ top: cardTop + cardHeight / 2, ...(delta < 0 ? { right: `calc(50% + ${cardWidth / 2 + tune.cardToArrows}px)` } : { left: `calc(50% + ${cardWidth / 2 + tune.cardToArrows}px)` }) }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}

      {/* Serving size and the total under the drink (Figma 187:43). Wide screens: exactly as wide as the
          card and 16px under it (JP, 2026-11-18). */}
      <div
        className="mt-[23px] shrink-0 px-[9px] md:mx-0 md:px-0"
        style={
          isDesktop
            ? { position: "absolute", marginTop: 0, left: `calc(50% - ${cardWidth / 2}px)`, width: cardWidth, top: cardTop + cardHeight + tune.cardToServings }
            : undefined
        }
      >
        <ServingsRow
          servings={infoServings}
          total={formatTotal(totalParts(infoLines), DEFAULT_UNIT, infoServings)}
          perServing={formatTotal(totalParts(infoLines), DEFAULT_UNIT, 1)}
          onChange={setInfoServings}
        />
      </div>

      </div>

      {/* On a phone the edit panel floats over the bottom of the screen; this keeps the drink above it. The height
          leaves the same 23px between the serving buttons and the panel as between the drink and the serving
          buttons (the screen's 16px padding and 16px gap are counted in: height = panel height - 24, found by measuring on a 402x749 screen). */}
      <div aria-hidden className="shrink-0 md:hidden" style={{ height: PANEL_CLOSED_HEIGHT - 24 }} />

      {/* While the drawer is up, a tap on the header above it closes it. */}
      {phone && sheet.open && (
        <button
          type="button"
          aria-label="Close the edit panel"
          tabIndex={-1}
          className="absolute inset-0 z-10 cursor-default"
          onClick={sheet.closeSheet}
        />
      )}

      {/* ── The edit panel: the buttons, and the ingredients when it is open ── */}
      <div className="md:relative md:col-start-1 md:row-start-3 md:min-h-0">
      <div
        ref={panelScrollRef}
        className="panel-scroll md:h-full md:overflow-y-auto md:rounded-[30px] md:bg-[#21201E]"
      >
        <EditPanel
          edits={editsForDrink}
          lines={infoLines}
          onAdjust={(key, direction) => onEdit(infoD, (prev) => adjustLine(prev, key, direction))}
          onSubstitute={sheet.openSheet}
          onPick={(ingredient) => onEdit(infoD, (prev) => swapIngredient(prev, ingredient))}
          floating={phone}
          open={sheet.open}
          onToggle={sheet.toggle}
          modified={infoD in edits}
          onMix={sheet.closeSheet}
          travel={travel}
          bind={sheet.bind}
        />
        {/* Wide screens: a soft fade at the bottom of the panel (in its own color) that hints there is
            more to scroll. It stays put while the list scrolls under it. */}
        {isDesktop && (
          <div aria-hidden className="pointer-events-none sticky bottom-0 -mt-20 h-20 rounded-b-[30px]" style={{ background: BOTTOM_SCRIM }} />
        )}
      </div>
      {/* Wide screens: our own scrollbar (the browser's is hidden): a fully rounded bar in faint white inside
          the panel's right edge. It follows the scroll exactly and can be dragged. */}
      {isDesktop && (
        <div
          ref={thumbRef}
          aria-hidden
          className="group absolute right-1 top-0 z-10 w-3 cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={onThumbDown}
          onPointerMove={onThumbMove}
          onPointerUp={onThumbUp}
          onPointerCancel={onThumbUp}
        >
          <span className="mx-auto block h-full w-1 rounded-full bg-white/20 transition-colors group-hover:bg-white/35" />
        </div>
      )}
      </div>
      {/* Dev only: sliders for the wide-screen spacing (never on the live site). */}
      <SpacingPanel />
    </main>
  );
}
