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
  const maxCardWidth = isDesktop ? trackSize.width : Math.max(0, trackSize.width - 2 * CARD_MARGIN);
  // On a phone the card is always as wide as the edit panel (the screen less the 16px margins) and
  // gets shorter, not narrower, when the screen is short (JP, 2026-11-16). Wide screens keep the shape.
  const cardWidth = isDesktop
    ? Math.max(0, Math.min(maxCardWidth, trackSize.height * CARD_ASPECT))
    : maxCardWidth;
  const cardHeight = isDesktop ? cardWidth / CARD_ASPECT : Math.min(cardWidth / CARD_ASPECT, trackSize.height);
  const step = isDesktop ? 0 : cardWidth / 2 + (cardWidth * SIDE_SCALE) / 2 + GAP;

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
      const scale = c.desktop ? 1 : 1 - (1 - SIDE_SCALE) * Math.min(Math.abs(t), 1);
      const x = c.desktop ? 0 : t * c.step;
      el.style.transform = `translate3d(${(x - c.cardWidth / 2).toFixed(2)}px,0,0) scale(${scale.toFixed(4)})`;
      // The cards beside the middle one fade out as the edit sheet comes up (--p), so only
      // the drink in view stays.
      el.style.opacity = c.desktop || Math.abs(t) < 0.5 ? "1" : "calc(1 - var(--p, 0) * 3)";
      // Cards fade to dark the further they are from the middle, and back up as they arrive.
      const dim = el.querySelector<HTMLElement>("[data-dim]");
      if (dim) dim.style.opacity = c.desktop ? "0" : String((SIDE_DIM * Math.min(Math.abs(t), 1)).toFixed(3));
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
        if (c.desktop) return;
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
      if (c.desktop) {
        c.index = mod(c.index + delta, c.n);
        c.info = c.index;
        setIndex(c.index);
        setInfoIndex(c.index);
        return;
      }
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
    if (c.desktop || (e.pointerType === "mouse" && e.button !== 0)) return;
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
  const offsets = isDesktop
    ? [0]
    : N >= 5
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
      className="fixed inset-0 flex flex-col gap-4 overflow-hidden bg-[#1A1612] p-4 text-[#F7F7F7] select-none [-webkit-touch-callout:none] md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:grid-rows-[auto_auto_minmax(0,1fr)] md:gap-x-8 md:gap-y-4"
      style={phone ? { perspective: 1000, perspectiveOrigin: "50% 30%" } : undefined}
    >
      {/* The browse filters: they move back (z) and disappear when the edit panel comes up. */}
      <div className="md:col-span-2 md:row-start-1" style={zFilters} inert={phone && sheet.open}>
        <FilterBar active={filterId} onSelect={selectFilter} />
      </div>

      {/* ── Controls ──────────────────────────────────────────────── */}
      <header className="flex flex-col md:col-start-1 md:row-start-2" style={zHeader}>
        {/* On a phone you swipe; these stay for screen readers and wide screens. */}
        <div className="flex justify-end md:-mr-3">
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
            <h1 className="font-serif text-[40px] leading-[52px]" style={zTitle}>
              {infoDrink.name}
            </h1>
            {/* The taste summary, a dot, then the drink's alcohol (both follow your edits). */}
            <p className="mt-1 flex items-center gap-[5px] text-xs opacity-55" style={zFamily}>
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
        className="flex min-h-0 flex-1 flex-col md:col-start-2 md:row-span-2 md:row-start-2 md:h-full"
        style={zDrink}
      >
      <div
        ref={trackRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Drinks"
        className="relative -mx-4 min-h-0 flex-1 touch-none overflow-hidden select-none md:mx-0"
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
              style={{ width: cardWidth, height: cardHeight, marginTop: -cardHeight / 2 }}
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

      {/* Serving size and the total under the drink (Figma 187:43). */}
      <div className="mt-[23px] shrink-0 px-[9px] md:mx-0 md:px-0">
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
      <div className="md:col-start-1 md:row-start-3 md:min-h-0 md:overflow-y-auto">
        <EditPanel
          edits={editsForDrink}
          lines={infoLines}
          onAdjust={(key, direction) => onEdit(infoD, (prev) => adjustLine(prev, key, direction))}
          onSubstitute={sheet.openSheet}
          onPick={(ingredient) => onEdit(infoD, (prev) => swapIngredient(prev, ingredient))}
          floating={phone}
          open={sheet.open}
          onToggle={sheet.toggle}
          travel={travel}
          bind={sheet.bind}
        />
      </div>
    </main>
  );
}
