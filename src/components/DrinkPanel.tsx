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
import { INGREDIENTS } from "@/data/ingredients";
import { DEFAULT_UNIT, formatTotal, orderLines, totalParts } from "@/lib/stack";
import { flavorProfile } from "@/lib/flavor";
import { DrinkCard } from "./DrinkCard";
import { CLASSICS_ID, FILTERS, filterList } from "@/data/finder";
import { FilterBar } from "./FilterBar";
import { FlavorReadout } from "./FlavorReadout";

/** Servings buttons (the "+" for a custom amount comes later). */
const SERVING_CHOICES = [1, 2, 4];

// OPEN: which drink a visitor sees first (brief §1 flow). Placeholder: Negroni.
const START_DRINK = Math.max(0, DRINKS.findIndex((d) => d.id === "negroni"));

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Phone layout: the middle card with its neighbors peeking in at the sides. */
const SIDE_SCALE = 0.86; // size of the cards beside the middle one
const PEEK = 24; // px of each side card showing at the screen edge
const GAP = 10; // px between the middle card and a side card
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
  const [trackWidth, setTrackWidth] = useState(0);
  // How many drinks each recipe makes (default 1). Scales the oz, never the parts.
  const [servings, setServings] = useState<Record<number, number>>({});

  const trackRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setTrackWidth(el.clientWidth); // measure now; the observer keeps it current
    const observer = new ResizeObserver(([entry]) => setTrackWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Card sizes: the middle card leaves room for a sliver of its neighbors.
  const cardWidth = isDesktop ? trackWidth : Math.max(0, trackWidth - 2 * (PEEK + GAP));
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
      const target = e.target as HTMLElement | null;
      if (target?.getAttribute("role") === "slider") return;
      if (e.key === "ArrowLeft") goBy(-1);
      if (e.key === "ArrowRight") goBy(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBy]);

  // ── Pointer handling on the row ──────────────────────────────────────────
  // A drag that starts on a layer is decided by the layer itself (vertical =
  // change the amount, sideways = hand over to us via `swipe.begin`). A touch
  // anywhere else on the row, such as a peeking card, is ours from the start.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const c = ctl.current;
    if (c.desktop || (e.pointerType === "mouse" && e.button !== 0)) return;
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
  const infoServings = servings[infoD] ?? 1;
  const modified = infoD in edits || infoServings !== 1;
  const reset = () => {
    setEdits((all) => {
      const next = { ...all };
      delete next[infoD];
      return next;
    });
    setServings((all) => {
      const next = { ...all };
      delete next[infoD];
      return next;
    });
  };

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

  const profile = useMemo(() => flavorProfile(infoLines), [infoLines]);
  const baseline = useMemo(() => flavorProfile(infoDrink.lines), [infoDrink]);

  const caption = orderLines(infoLines)
    .slice()
    .reverse()
    .map((l) => INGREDIENTS[l.ingredient].name)
    .join(" · ");

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
  return (
    <main className="fixed inset-0 flex flex-col gap-4 bg-[#1A1612] p-4 text-[#F7F7F7] select-none [-webkit-touch-callout:none] md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:grid-rows-[auto_auto_minmax(0,1fr)] md:gap-x-8 md:gap-y-4">
      <FilterBar active={filterId} onSelect={selectFilter} />

      {/* ── Controls ──────────────────────────────────────────────── */}
      <header className="flex flex-col md:col-start-1 md:row-start-2">
        {/* On a phone you swipe; these stay for screen readers and wide screens. */}
        <div className="flex justify-end md:-mr-3">
          <button type="button" onClick={() => goBy(-1)} aria-label="Previous drink" className={navButton}>
            ‹
          </button>
          <button type="button" onClick={() => goBy(1)} aria-label="Next drink" className={navButton}>
            ›
          </button>
        </div>

        <h1 className="text-[22px] font-semibold leading-7">{infoDrink.name}</h1>
        <p className="mt-1 text-xs opacity-55">{infoDrink.family}</p>
        <p className="mt-3 text-[11px] leading-4 text-[#F7F7F7]/45">{caption}</p>
        {/* Servings scale the oz only; the parts (the ratio) never change. */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div role="group" aria-label="Servings" className="flex items-center gap-2">
            <span className="mr-1 text-xs text-[#F7F7F7]/55">Servings:</span>
            {SERVING_CHOICES.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={infoServings === n}
                onClick={() => setServings((all) => ({ ...all, [infoD]: n }))}
                className={`h-9 w-9 rounded-full border text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
                  infoServings === n
                    ? "border-[#F7F7F7] bg-[#F7F7F7] font-semibold text-[#1A1612]"
                    : "border-[#F7F7F7]/25 text-[#F7F7F7]/55 hover:text-[#F7F7F7]"
                }`}
              >
                {n}
              </button>
            ))}
            {/* OPEN: custom amount (later): type a number and everything scales. */}
            <button
              type="button"
              disabled
              aria-label="Custom number of servings (coming later)"
              title="Custom amount: coming later"
              className="h-9 w-9 rounded-full border border-[#F7F7F7]/25 text-sm text-[#F7F7F7]/35"
            >
              +
            </button>
          </div>
          <p className="flex items-baseline gap-1.5 whitespace-nowrap tabular-nums">
            <span className="text-xs text-[#F7F7F7]/55">Total</span>
            <span className="text-base font-semibold leading-6">
              {formatTotal(totalParts(infoLines), DEFAULT_UNIT, infoServings)}
            </span>
          </p>
        </div>
      </header>

      {/* ── The row of drinks ─────────────────────────────────────── */}
      <div
        ref={trackRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Drinks"
        className="relative -mx-4 min-h-0 flex-1 touch-none overflow-hidden select-none md:col-start-2 md:row-span-2 md:row-start-2 md:mx-0 md:h-full"
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
              className="absolute inset-y-0 left-1/2 will-change-transform"
              style={{ width: cardWidth }}
            >
              <DrinkCard
                drink={DRINKS[d]}
                drinkIndex={d}
                lines={edits[d] ?? DRINKS[d].lines}
                onEdit={onEdit}
                interactive={j === infoIndex && !busy}
                onHorizontal={onHorizontal}
                servings={servings[d] ?? 1}
              />
              {/* Dims the card when it's at the side; its opacity is set as the row moves. */}
              <div aria-hidden data-dim className="pointer-events-none absolute inset-0 rounded-[28px] bg-black opacity-0" />
            </div>
          );
        })}
      </div>

      {/* ── Flavor profile, under the drink ────────────────────────── */}
      <section
        aria-label="Flavor details"
        className="flex shrink-0 flex-col md:col-start-1 md:row-start-3 md:min-h-0 md:overflow-y-auto"
      >
        <div>
          <FlavorReadout profile={profile} baseline={baseline} />
        </div>

        {/* OPEN: gesture hints (brief §6). Placeholder: one line of text until the first change. */}
        <div className="mt-3 flex items-end justify-between gap-3">
          <p
            className={`text-[11px] text-[#F7F7F7]/45 ${modified ? "invisible" : ""}`}
            aria-hidden={modified}
          >
            Drag a layer down to give it a bigger share, up to give it less. The others adjust so the glass stays full.
            <span className="md:hidden"> Swipe sideways for other drinks.</span>
          </p>
          {/* Reset is always there; it's dimmed until something has changed. */}
          <button
            type="button"
            onClick={reset}
            disabled={!modified}
            className="h-7 shrink-0 rounded-full border border-[#F7F7F7]/25 px-3 text-[11px] text-[#F7F7F7]/80 transition-opacity hover:border-[#F7F7F7]/60 hover:text-[#F7F7F7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] disabled:pointer-events-none disabled:opacity-35"
          >
            Reset
          </button>
        </div>
      </section>
    </main>
  );
}
