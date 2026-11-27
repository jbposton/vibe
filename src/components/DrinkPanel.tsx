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
import { DRINKS, type Drink, type RecipeLine } from "@/data/drinks";
import { GUIDE_STEPS, MOODS, newLine } from "@/data/builder";
import { addSaved, madeUpName, removeSaved, renameSaved, servingFor, useSavedDrinks } from "@/lib/saved";
import { NameField, SavedName } from "./NameField";
import { GlassSilhouette } from "./flow/CheersToast";
import { flavorProfile } from "@/lib/flavor";
import { useTuning } from "@/lib/tuning";
import { DesignEditor } from "./dev/DesignEditor";
import { DrinkCard } from "./DrinkCard";
import { BUILD_ID, CLASSICS_ID, FILTERS, MY_DRINKS_ID, filterList, type Filter } from "@/data/finder";
import { FilterBar } from "./FilterBar";
import { PrepTags } from "./PrepIcons";
import { DRAWER_TOP, EditPanel, PANEL_CLOSED_HEIGHT } from "./EditPanel";
import { ServingsRow } from "./ServingsRow";
import { SideGlass } from "./SideGlass";
import { SideLens, useLensSupport } from "./SideLens";
import { useSheet } from "./useSheet";
import { adjustLine, traitEdits } from "@/lib/edits";
import { DEFAULT_UNIT, formatTotal, stepAmount, totalParts } from "@/lib/stack";
import { FlavorLadders } from "./FlavorLadders";
import { abvLabel, tasteSummary } from "@/lib/flavor";
import { BrowsePanel } from "./BrowsePanel";
import { EditShell, FOOT_PILL, TraitChips } from "./EditShell";
import { BuilderChat, EMPTY_CHAT, type Chat } from "./flow/BuilderChat";
import { RolesPanel } from "./flow/RolesPanel";
import { TEXT_BUTTON } from "@/components/buttonStyles";

// OPEN: which drink a visitor sees first (brief §1 flow). Placeholder: Negroni.
const START_DRINK = Math.max(0, DRINKS.findIndex((d) => d.id === "negroni"));

const mod = (a: number, n: number) => ((a % n) + n) % n;
/** Building on a phone: where the guide's top edge sits when it's all the way up (px; the top bar is away then),
    and how long the first pour waits while the guide comes down (ms). */
const PHONE_DRAWER_FULL_TOP = 16;
const PHONE_REVEAL_MS = 350;
/** Building on a phone: how long the top bar takes to move back and fade out (and to come back). */
const BAR_MS = 500;

/** The fewest places a row needs to slide smoothly: the middle card and two waiting on each side. */
const RING_MIN = 5;
/**
 * A short list goes round more than once, so there is a drink on both sides and the next one is already in
 * place as the row slides (JP, 2026-11-27): two drinks become A B A B A B. The copies are the same drink, so
 * edits show on all of them. One drink stays on its own.
 */
const asRing = <T,>(items: T[]): T[] =>
  items.length < 2 || items.length >= RING_MIN ? items : Array.from({ length: Math.ceil(RING_MIN / items.length) }, () => items).flat();
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
 * The cards' physical feel while the row moves (JP, 2026-11-25): they tilt to the side, the top trailing behind
 * the movement, and rock gently as they land. Tune it here.
 */
const SWING = {
  tilt: 2, // degrees of sideways tilt at full speed (flat, like a card leaning: no tipping back or turning)
  fullSpeed: 3.2, // the speed (cards per second) that gives the full tilt
  stiffness: 170, // the spring that follows the speed: higher is snappier
  damping: 15, // lower rocks more when it lands
  overshoot: 0.9, // how far it slides past its spot before coming back (0 = none, 1.7 = about a tenth of a card)
};

/**
 * The mask that fades the side drinks on wide screens: full strength across the middle card, then
 * an eased fall-off on each side over `fade` px (fast near the card, a long gentle tail),
 * drawn with many small steps so it reads as one soft gradient rather than a hard line.
 */
function sideFadeMask(cardWidth: number): string {
  const steps = 20;
  const half = cardWidth / 2;
  const stop = (k: number, side: -1 | 1) => {
    const t = k / steps; // 0 at the card's edge, 1 where the fade ends
    // Drops quickly near the card (in the gap, where nothing shows) and then trails off very gently,
    // so the side drinks are mostly hidden but there is no visible edge.
    const a = Math.pow(1 - t, 2.5);
    return `rgba(0,0,0,${a.toFixed(3)}) calc(50% ${side < 0 ? "-" : "+"} (${half.toFixed(1)}px + var(--side-fade) * ${t.toFixed(4)}))`;
  };
  const left = Array.from({ length: steps + 1 }, (_, k) => stop(steps - k, -1));
  const right = Array.from({ length: steps + 1 }, (_, k) => stop(k, 1));
  return `linear-gradient(to right, ${[...left, ...right].join(", ")})`;
}
/**
 * What sits over the side drinks on wide screens: "lens" (the flare in SideLens.tsx), "glass" (the earlier curved
 * glass, SideGlass.tsx, tagged side-glass-v1 in git) or "none" (just the fade). Without WebGL2, "lens" falls
 * back to "none".
 */
const SIDE_EFFECT = "lens" as "lens" | "glass" | "none";
/** The side glass is this share of the middle card's height: taller than the side drinks (0.86), so their tops and bottoms sit inside its curved ends and bend too. */
const GLASS_HEIGHT = 1;
const SIDE_DIM = 0.6; // how dark a card at the side gets (black overlay opacity)
/** How far a finger moves (px) before it counts as a swipe rather than a tap. */
const SLOP = 6;
/** A swipe this fast (px/ms) flips to the next drink even if it was short. */
const FLICK = 0.4;

/** Build mode zooms the drink in by this much (Figma 256:1456: 658 wide against Browse's 584). */
const BUILD_ZOOM = 1.127;
const noop = () => {};
/** How long the Edit Panel takes to slide open or closed (ms); the drink's zoom and fade use the same time. */
const SLIDE_MS = 450;
/** How long the drink info takes to fade out before the panel comes up (ms). */
const FADE_MS = 120;
/** Closing order: the drink comes down (ZOOM_MS), the edge gradient comes in (GRADIENT_MS), then the side drinks slide in (SIDE_MS) from SIDE_FROM px out. */
const ZOOM_MS = 600;
/** When the edge gradient starts after the drink begins coming down (0: together with the zoom), and how long it takes. */
const GRADIENT_AT = 0;
const GRADIENT_MS = 300;
const SIDE_MS = 650;
const SIDE_FROM = 180;
/**
 * Wide screens, after loading: when the side drinks start sliding in and how long they take (ms), with the main
 * drink's own curve. The main drink fades and grows from 350ms for 900ms (globals.css, "intro"); the sides use
 * the same start and length, so they all come in together (JP, 2026-11-25). Keep the two in step.
 */
const INTRO_SIDES_AT = 350;
const INTRO_SIDE_MS = 900;
const INTRO_EASE = "cubic-bezier(0.25, 0.6, 0.3, 1)";
/** After picking another group in the top bar: when its side drinks start sliding in (ms). They then take INTRO_SIDE_MS. */
const GROUP_SIDES_AT = 60;
const never = () => () => {};
type SideMode = "shown" | "hidden" | "staged" | "entering";
const ZOOM_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** The "My Drinks" filter, shown once a drink has been saved. */
const MY_FILTER: Filter = { id: MY_DRINKS_ID, label: "My Drinks", group: "start", drinks: null };
type Mode = "browse" | "build" | "own";

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
    // Build mode: the bar starts under the Structure / All ingredients tabs.
    const inset = el.querySelector<HTMLElement>('[role="tablist"]')?.offsetHeight ?? 0;
    const track = Math.max(0, el.clientHeight - 48 - inset);
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
    thumb.style.transform = `translateY(${(24 + inset + (travel * el.scrollTop) / room).toFixed(2)}px)`;
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
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // the pointer already ended
    }
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
  const saved = useSavedDrinks();
  const [filterId, setFilterId] = useState(CLASSICS_ID);
  const listFor = useCallback(
    (id: string) => asRing(id === MY_DRINKS_ID && saved.length > 0 ? saved.map((_, k) => DRINKS.length + k) : filterList(id === MY_DRINKS_ID || id === BUILD_ID ? CLASSICS_ID : id)),
    [saved],
  );
  const list = useMemo(() => listFor(filterId), [listFor, filterId]);
  const N = list.length;

  const [index, setIndex] = useState(START_DRINK); // the drink in the middle
  const [infoIndex, setInfoIndex] = useState(START_DRINK); // the drink nearest the middle (while swiping)
  const [busy, setBusy] = useState(false); // swiping, or settling after a swipe
  // The title fades in from the right whenever the drink changes, whichever way you went (JP, 2026-11-25).
  // False until the first change, so it doesn't play on top of the after-loading sequence.
  const [titleMoves, setTitleMoves] = useState(false);
  // Edited recipes, by drink. A drink you haven't touched isn't in here. Each
  // card keeps its edits when you swipe away and back.
  const [edits, setEdits] = useState<Record<number, RecipeLine[]>>({});
  const [trackSize, setTrackSize] = useState({ width: 0, height: 0 });
  // How many drinks each recipe makes (default 1). Scales the oz, never the parts.
  const [servings, setServings] = useState<Record<number, number>>({});

  // v2, wide screens: Browse mode (the carousel, the drink's story), Build mode (the Edit Panel is up and
  // the drink zooms in) and Build my own (the guide, an empty glass). The drinks you saved join DRINKS
  // after it, so a saved drink's position is DRINKS.length + its place in `saved`.
  const [mode, setMode] = useState<Mode>("browse");
  const [, setTab] = useState<"guide" | "structure" | "ingredients">("structure");
  const all = useMemo(() => [...DRINKS, ...saved], [saved]);
  const [ownLines, setOwnLines] = useState<RecipeLine[]>([]);
  const [ownName, setOwnName] = useState("");
  const [ownChat, setOwnChat] = useState<Chat>(EMPTY_CHAT);
  const [ownServings, setOwnServings] = useState(1);
  const build = isDesktop && mode === "build";
  const own = mode === "own";
  // On a phone, Build my own is the glass above and the guide in the bottom half of the screen (JP, 2026-11-27).
  const ownPhone = own && !isDesktop;
  // Building on a phone, the top bar moves back and fades out, as it does for the edit panel, and its room goes
  // to the drink (JP, 2026-11-27). The round X at the top of the guide leaves. `barMoving` eases the bar only while it goes or comes
  // back, so it still follows the edit panel's swipe exactly the rest of the time.
  const [barMoving, setBarMoving] = useState(false);
  const barTimer = useRef(0);
  const moveBar = () => {
    setBarMoving(true);
    window.clearTimeout(barTimer.current);
    barTimer.current = window.setTimeout(() => setBarMoving(false), BAR_MS + 50);
  };
  const [barHeight, setBarHeight] = useState(0);
  const barRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setBarHeight(el.offsetHeight);
    const observer = new ResizeObserver(() => setBarHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  // The Edit Panel slides up from the bottom when Build mode opens and back down when it closes. While it moves,
  // Browse's own content stays underneath, and the drink zooms (and the other drinks fade) in the same moment.
  const [closing, setClosing] = useState(false);
  const [settling, setSettling] = useState(false);
  // Opening happens in two steps: the drink's info fades out first, then the panel slides up (with the zoom).
  const [leavingBrowse, setLeavingBrowse] = useState(false);
  // The other drinks: shown, hidden (Build), waiting off to the side, or sliding in. They start off to the side:
  // sliding them in is the last step of the after-loading sequence.
  const [sideMode, setSideMode] = useState<SideMode>("staged");
  // Picking another group in the top bar slides the side drinks in again, the same way as after loading
  // (JP, 2026-11-27). `groupIn` gives them the load-in timing; the timers are dropped if Build mode opens meanwhile.
  const [groupIn, setGroupIn] = useState(false);
  const groupTimers = useRef<number[]>([]);
  const stopGroupIn = () => {
    groupTimers.current.forEach(window.clearTimeout);
    groupTimers.current = [];
    setGroupIn(false);
  };
  // After loading: the page reveals itself in order (see "intro" in globals.css). `ready` is false until the
  // browser has taken over, so nothing shows before the sequence starts.
  const ready = useSyncExternalStore(never, () => true, () => false);
  const [intro, setIntro] = useState(true);
  const introDone = useRef(false);
  const [hasOpened, setHasOpened] = useState(false); // the drink info only fades in again after it has been away
  useEffect(() => {
    if (!isDesktop || introDone.current) return;
    const start = window.matchMedia(REDUCED_MOTION).matches ? 0 : INTRO_SIDES_AT;
    const timers = [
      window.setTimeout(() => setSideMode("entering"), start),
      window.setTimeout(() => {
        introDone.current = true;
        setSideMode("shown");
        setIntro(false);
      }, start + INTRO_SIDE_MS + 50),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [isDesktop]);
  const [gradientOn, setGradientOn] = useState(true); // the soft edge on the side drinks
  const openBuild = (nextTab: "structure" | "ingredients" | "guide", nextMode: Mode) => {
    if (leavingBrowse) return;
    stopGroupIn();
    setLeavingBrowse(true);
    window.setTimeout(() => {
      setTab(nextTab);
      setMode(nextMode);
      setLeavingBrowse(false);
      setHasOpened(true);
      setSideMode("hidden");
      setGradientOn(false); // the soft edge is gone while the drink is zoomed in; it grows back when it closes
      setSettling(true);
      window.setTimeout(() => setSettling(false), SLIDE_MS);
    }, FADE_MS);
  };
  // Closing, in order: 1. the drawer goes down and the drink zooms back; 2. the soft edge comes in; 3. the side
  // drinks slide in from their own sides (the left one from the left, the right one from the right).
  const closeBuild = () => {
    setClosing(true);
    window.setTimeout(() => {
      setMode("browse");
      setClosing(false);
    }, SLIDE_MS);
    window.setTimeout(() => setGradientOn(true), GRADIENT_AT);
    // The side drinks slide in just as the drink info fades back in (that is when the drawer is down).
    window.setTimeout(() => setSideMode("staged"), SLIDE_MS - 60);
    window.setTimeout(() => setSideMode("entering"), SLIDE_MS);
    window.setTimeout(() => setSideMode("shown"), SLIDE_MS + SIDE_MS + 50);
  };
  const zoomed = (build && !closing) || own;

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
  const lensSupported = useLensSupport();
  const lens = isDesktop && SIDE_EFFECT === "lens" && lensSupported && N > 1;
  // The glass over each side runs from the edge of the row right up to the middle drink: it does nothing where
  // they meet, so there is no seam.
  const sidePane = Math.round(trackSize.width / 2 - cardWidth / 2);
  // Build mode zooms the drink in (and keeps it inside the room above the serving row).
  const zoomAmount = Math.max(1, Math.min(BUILD_ZOOM, 1 + (2 * cardTop) / Math.max(1, cardHeight)));
  const zoom = zoomed && isDesktop ? zoomAmount : 1;

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
    hideSides: false,
    sideOffset: 0,
    // The swing (see SWING): a spring for the sideways lean.
    lean: 0,
    leanSpeed: 0,
    speed: 0, // the row's speed, smoothed (cards per second, signed)
    lastP: 0,
    swingRaf: 0,
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
      // The side drinks wait just outside their place before they slide in (closing step 3).
      const x = t * c.step + (Math.abs(t) >= 0.5 ? Math.sign(t) * c.sideOffset : 0);
      // At rest there is no rotation at all, so the text stays crisp.
      const swing = Math.abs(c.lean) > 0.002 ? ` rotate(${(-c.lean * SWING.tilt).toFixed(2)}deg)` : "";
      el.style.transform = `translate3d(${(x - c.cardWidth / 2).toFixed(2)}px,0,0)${swing} scale(${scale.toFixed(4)})`;
      // The card's tilt, for the liquid in it to slosh against (DrinkCard reads this every frame).
      el.dataset.tilt = swing ? (-c.lean * SWING.tilt).toFixed(2) : "0";
      // The cards beside the middle one fade out as the edit sheet comes up (--p), so only
      // the drink in view stays.
      el.style.opacity = Math.abs(t) < 0.5 ? "1" : c.hideSides ? "0" : "calc(1 - var(--p, 0) * 3)";
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
    c.hideSides = isDesktop && (sideMode === "hidden" || sideMode === "staged"); // Build mode: the other drinks fade away
    c.sideOffset = isDesktop && sideMode === "staged" ? SIDE_FROM : 0;
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
        setTitleMoves(true);
        c.info = near;
        setInfoIndex(near);
      }
    },
    [applyTransforms],
  );

  /**
   * Runs the swing while the row moves and until it has stopped rocking. It only watches the row's speed; an
   * underdamped spring follows it, so when the row stops it carries on a little past upright and settles.
   */
  const startSwing = useCallback(() => {
    const c = ctl.current;
    if (c.swingRaf || window.matchMedia(REDUCED_MOTION).matches) return;
    c.lastP = c.p;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.001, (now - last) / 1000));
      last = now;
      c.speed += ((c.p - c.lastP) / dt - c.speed) * 0.5;
      c.lastP = c.p;
      const aim = clamp(c.speed / SWING.fullSpeed, -1, 1);
      c.leanSpeed += (SWING.stiffness * (aim - c.lean) - SWING.damping * c.leanSpeed) * dt;
      c.lean += c.leanSpeed * dt;
      const still = !c.swiping && !c.animating && [c.lean, c.leanSpeed / 10, c.speed / 10].every((v) => Math.abs(v) < 0.003);
      if (still) {
        c.lean = c.leanSpeed = c.speed = 0;
        c.swingRaf = 0;
      } else {
        c.swingRaf = requestAnimationFrame(frame);
      }
      applyTransforms();
    };
    c.swingRaf = requestAnimationFrame(frame);
  }, [applyTransforms]);

  /** Glide the row to `target` (-1 next, 0 stay, +1 previous), then commit. */
  const settleTo = useCallback(
    (target: number) => {
      const c = ctl.current;
      cancelAnimationFrame(c.raf);
      c.animating = true;
      setBusy(true);
      const from = c.p;
      const distance = Math.abs(target - from);
      const duration = window.matchMedia(REDUCED_MOTION).matches || distance === 0 ? 0 : 380 + 200 * distance;
      if (duration > 0) startSwing();
      const t0 = performance.now();

      const finish = () => {
        if (target !== 0) {
          c.index = mod(c.index - target, c.n);
          setIndex(c.index);
        }
        // The cards stay exactly where they are: positions are now measured
        // from the new middle card, so nothing visibly jumps.
        // The swing measures speed from how far the row moved, so move its marker along with the renumbering.
        c.lastP -= target;
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
        // Quick at first, then a little past its spot and back: the bounce as it lands.
        const eased = 1 + (SWING.overshoot + 1) * Math.pow(k - 1, 3) + SWING.overshoot * Math.pow(k - 1, 2);
        setP(from + (target - from) * eased);
        if (k < 1) c.raf = requestAnimationFrame(tick);
        else finish();
      };
      c.raf = requestAnimationFrame(tick);
    },
    [applyTransforms, setP, startSwing],
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
        startSwing();
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
    [setP, settleTo, startSwing],
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
      // Arrows and Escape belong to a slider or a text field while you are in one.
      if (target?.getAttribute("role") === "slider" || target instanceof HTMLInputElement) return;
      if (e.key === "Escape") {
        sheet.closeSheet();
        if (mode === "build" && !closing) closeBuild();
      }
      if (sheet.open || zoomed) return; // arrows don't switch drinks with the edit panel up
      if (e.key === "ArrowLeft") goBy(-1);
      if (e.key === "ArrowRight") goBy(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBy, sheet, mode, zoomed, closing]);

  // ── Pointer handling on the row ──────────────────────────────────────────
  // A drag that starts on a layer is decided by the layer itself (vertical =
  // change the amount, sideways = hand over to us via `swipe.begin`). A touch
  // anywhere else on the row, such as a peeking card, is ours from the start.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const c = ctl.current;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (sheet.open || zoomed) return; // with the edit panel up, only the one drink is in focus
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
      setEdits((prev) => ({ ...prev, [drinkIndex]: update(prev[drinkIndex] ?? all[drinkIndex].lines) })),
    [all],
  );

  // ── Info for the drink nearest the middle ────────────────────────────────
  const infoD = list[infoIndex] ?? list[0]; // the info drink's place in DRINKS
  const infoDrink = all[infoD];
  const infoLines = edits[infoD] ?? infoDrink.lines;
  // Whether the drink now differs from its recipe (an amount, an ingredient added, removed or swapped).
  // Undoing every change back to the recipe counts as unchanged.
  const infoChanged = useMemo(() => {
    const base = infoDrink.lines;
    if (infoLines.length !== base.length) return true;
    return infoLines.some((l, i) => l.ingredient !== base[i].ingredient || l.role !== base[i].role || JSON.stringify(l.amount) !== JSON.stringify(base[i].amount));
  }, [infoLines, infoDrink]);
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

  /** Back to Browse at once (not through Done): the side drinks, the arrows and the soft edge come back with it.
      Building hides them, so every way out of building has to restore them. */
  const showBrowse = () => {
    if (!isDesktop) moveBar();
    setMode("browse");
    setSideMode("shown");
    setGradientOn(true);
  };

  // Picking a quick filter swaps the row to that curated list. If the drink in
  // the middle is also in the new list we stay on it, otherwise we start at the top.
  const showList = (id: string, next: number[], pos: number) => {
    const c = ctl.current;
    cancelAnimationFrame(c.raf);
    c.animating = false;
    c.swiping = false;
    c.n = asRing(next).length; // the same length listFor will give
    c.index = pos;
    c.info = pos;
    c.p = 0;
    cancelAnimationFrame(c.swingRaf);
    c.swingRaf = 0;
    c.lean = c.leanSpeed = c.speed = c.lastP = 0;
    setTitleMoves(true);
    setFilterId(id);
    setIndex(pos);
    setInfoIndex(pos);
    setBusy(false);
  };
  const selectFilter = (id: string) => {
    if (id === BUILD_ID) {
      if (mode === "own") return;
      if (isDesktop) openBuild("guide", "own");
      else {
        // Phones have no drink info to fade out first.
        sheet.closeSheet();
        moveBar();
        setMode("own");
      }
      return;
    }
    const filter = id === MY_DRINKS_ID ? MY_FILTER : FILTERS.find((f) => f.id === id);
    if (!filter || filter.placeholder) return;
    const leaving = mode !== "browse";
    if (leaving) showBrowse();
    if (id === filterId && !leaving) return;
    if (id === filterId) return;
    const next = listFor(id);
    showList(id, next, Math.max(0, next.indexOf(list[ctl.current.index])));
    // Wide screens: the new group's side drinks wait off to the side, then slide in like after loading.
    if (isDesktop && !window.matchMedia(REDUCED_MOTION).matches) {
      stopGroupIn();
      setSideMode("staged");
      setGroupIn(true);
      groupTimers.current = [
        window.setTimeout(() => setSideMode("entering"), GROUP_SIDES_AT),
        window.setTimeout(() => {
          setSideMode("shown");
          setGroupIn(false);
        }, GROUP_SIDES_AT + INTRO_SIDE_MS + 50),
      ];
    }
  };

  // Which filters the bar shows: My Drinks appears once one is saved.
  const barFilters = useMemo(() => {
    const base = FILTERS;
    if (saved.length === 0) return base;
    // My Drinks comes just before Classics (JP, 2026-11-27).
    const at = base.findIndex((f) => f.id === CLASSICS_ID);
    return [...base.slice(0, at), MY_FILTER, ...base.slice(at)];
  }, [saved.length]);

  // ── Build my own (the guide) and saving ───────────────────────────────────
  const mood = MOODS.find((m) => m.id === ownChat.moodId) ?? null;
  // On a phone, until there's something in the glass, the guide covers the page under the filters; the first
  // ingredient brings it down to show the drink (JP, 2026-11-27). Emptying the glass sends it back up.
  const drawerFull = ownPhone && ownLines.length === 0;
  const ownAnswer = (role: RecipeLine["role"], ingredient: RecipeLine["ingredient"] | null) => {
    const next = ingredient ? [...ownLines.filter((l) => l.role !== role), newLine(role, ingredient)] : ownLines;
    const answers = [...ownChat.answers, ingredient];
    setOwnLines(next);
    setOwnChat({ ...ownChat, answers });
    // The guide is done: it gives the drink a made-up name, which can be changed above the panel.
    // A name you typed along the way is yours: it isn't replaced.
    if (answers.length === GUIDE_STEPS.length) setOwnName((typed) => (typed.trim() ? typed : madeUpName(mood, next)));
  };
  /** A different choice on an earlier question: swaps (or removes) that layer and keeps the other answers. */
  const ownChange = (step: number, role: RecipeLine["role"], ingredient: RecipeLine["ingredient"] | null) => {
    const others = ownLines.filter((l) => l.role !== role);
    setOwnLines(ingredient ? [...others, newLine(role, ingredient)] : others);
    setOwnChat({ ...ownChat, answers: ownChat.answers.map((a, i) => (i === step ? ingredient : a)) });
  };
  const ownMood = (moodId: string) => {
    setOwnLines([]);
    setOwnServings(1);
    setOwnName("");
    setOwnChat({ moodId, answers: [] });
  };
  const ownRestart = () => {
    setOwnLines([]);
    setOwnServings(1);
    setOwnName("");
    setOwnChat(EMPTY_CHAT);
  };
  /** Save a recipe as a new drink and show it under My Drinks. */
  const saveAsNew = (name: string, lines: RecipeLine[]) => {
    const drink: Drink = { id: `mine-${Date.now()}`, name: name.trim() || "New Drink", family: "Unplaced", tags: [], lines, ...servingFor(lines) };
    const next = [...saved, drink];
    addSaved(drink);
    showBrowse();
    ownRestart();
    showList(MY_DRINKS_ID, next.map((_, k) => DRINKS.length + k), next.length - 1);
  };

  /** Take the drink in the middle off My Drinks. */
  const removeDrink = () => {
    const at = infoD - DRINKS.length; // its place in `saved`
    if (at < 0 || !saved[at]) return;
    removeSaved(saved[at].id);
    // Edits and servings are filed by position, so the saved drinks after this one move up a place.
    const moveUp = <T,>(filed: Record<number, T>): Record<number, T> =>
      Object.fromEntries(
        Object.entries(filed).flatMap(([key, value]) => {
          const n = Number(key);
          return n === infoD ? [] : [[n > infoD ? n - 1 : n, value]];
        }),
      ) as Record<number, T>;
    setEdits(moveUp);
    setServings(moveUp);
    const left = saved.length - 1;
    // With none left, My Drinks goes away and Classics comes back.
    if (left === 0) showList(CLASSICS_ID, filterList(CLASSICS_ID), START_DRINK);
    else showList(MY_DRINKS_ID, Array.from({ length: left }, (_, k) => DRINKS.length + k), Math.min(at, left - 1));
  };

  // The edit buttons this drink offers (sweeter, more bitter, stronger...), from its classic recipe so they stay put while you edit.
  const editsForDrink = useMemo(() => traitEdits(infoDrink.lines), [infoDrink]);
  const infoServings = servings[infoD] ?? 1;
  const setInfoServings = (n: number) => setServings((prev) => ({ ...prev, [infoD]: n }));
  // What the header, the ladders and the serving row show: Build my own's glass, or the middle drink.
  const activeLines = own ? ownLines : infoLines;
  const activeServings = own ? ownServings : infoServings;
  const setActiveServings = own ? setOwnServings : setInfoServings;
  const setActiveLines = (update: (prev: RecipeLine[]) => RecipeLine[]) => (own ? setOwnLines(update) : onEdit(infoD, update));
  const profile = useMemo(() => flavorProfile(activeLines), [activeLines]);
  const ownDrink = useMemo<Drink>(() => ({ id: "custom", name: ownName || "New Drink", family: "Unplaced", tags: [], lines: ownLines, ...servingFor(ownLines) }), [ownName, ownLines]);
  const rolesPanel = (
    <RolesPanel
      swatch
      lines={activeLines}
      servings={activeServings}
      asking={own && ownChat.moodId ? GUIDE_STEPS[ownChat.answers.length]?.role ?? null : null}
      onStep={(key, steps) => setActiveLines((prev) => prev.map((l, i) => (i === key ? { ...l, amount: stepAmount(l.amount, steps) } : l)))}
      onRemove={(key) => setActiveLines((prev) => prev.filter((_, i) => i !== key))}
      onAdd={(role, ingredient) => setActiveLines((prev) => [...prev, newLine(role, ingredient)])}
    />
  );
  const editsFor = own ? traitEdits(ownLines) : editsForDrink;
  // Build my own is the guide alone, with no tabs (JP, 2026-11-26).
  // OPEN: with them went Structure and All ingredients while building your own drink.
  const guideHere = own;
  // One section only: All ingredients was taken out (JP, 2026-11-26), so there is no tab row.
  const tabs: { id: string; label: string }[] = [];
  const pill = `${TEXT_BUTTON} flex-1 rounded-full px-9 text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] disabled:pointer-events-none disabled:opacity-40`;
  const footer = guideHere ? null : (
    <div className="sticky bottom-0 z-20 flex shrink-0 justify-center gap-2 bg-gradient-to-t from-[#21201E] from-55% to-transparent px-5 pb-4 pt-10">
      <button type="button" onClick={() => (isDesktop ? closeBuild() : sheet.closeSheet())} className={`${pill} ${FOOT_PILL}`}>
        Done
      </button>
      {infoChanged && (
        <button type="button" onClick={() => saveAsNew(`My ${infoDrink.name}`, infoLines)} className={`${pill} ${FOOT_PILL}`}>
          Save as a new drink
        </button>
      )}
    </div>
  );
  const shownTab = own ? "guide" : "structure";
  const editPanel = (
    <EditShell tabs={tabs} tab={shownTab} onTab={(id) => setTab(id as "structure")} fill={guideHere} footer={footer}>
      {shownTab === "guide" ? (
        <BuilderChat
          chat={ownChat}
          onMood={ownMood}
          onAnswer={ownAnswer}
          onChange={ownChange}
          onRestart={ownRestart}
          save={{ onSave: () => saveAsNew(ownName, ownLines), canSave: ownLines.length > 0 }}
          onClose={isDesktop ? undefined : () => selectFilter(filterId)}
          name={ownName}
        />
      ) : (
        <>
          <TraitChips edits={editsFor} lines={activeLines} onAdjust={(key, direction) => setActiveLines((prev) => adjustLine(prev, key, direction))} />
          {rolesPanel}
        </>
      )}
    </EditShell>
  );

  const navButton =
    "grid size-11 place-items-center rounded-full text-lg text-[#F7F7F7]/60 hover:text-[#F7F7F7] focus-visible:outline-2 focus-visible:outline-[#F7F7F7] max-md:sr-only";

  // The cards in the row: two either side of the middle one, so the next
  // card is already in place while you swipe.
  // A short list has already been made to go round (see asRing), so only a
  // single drink has nothing beside it.
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
  // Building on a phone: the bar is all the way back and gone (the edit panel's end position), and the space it
  // took (plus the 16px gap under it) closes up, so the header and the drink move up into it.
  const barStyle: React.CSSProperties | undefined = phone
    ? {
        ...(ownPhone
          ? { transform: `translate3d(0, -14px, -${SHEET.filtersBack}px)`, transformOrigin: "50% 0", opacity: 0, marginBottom: -(barHeight + 16) }
          : { ...zFilters, marginBottom: 0 }),
        transition: barMoving
          ? `transform ${BAR_MS}ms ${ZOOM_EASE}, opacity ${BAR_MS}ms ${ZOOM_EASE}, margin-bottom ${BAR_MS}ms ${ZOOM_EASE}`
          : undefined,
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
      data-intro={ready && intro ? "" : undefined}
      className={`${ready ? "" : "invisible"} fixed inset-0 mx-auto flex max-w-[1440px] flex-col gap-4 overflow-hidden bg-[#1A1612] p-4 text-[#F7F7F7] select-none [-webkit-touch-callout:none] md:grid md:grid-cols-[clamp(300px,33vw,475px)_minmax(0,1fr)] md:grid-rows-[auto_auto_minmax(0,1fr)] md:gap-x-7 md:gap-y-4`}
      style={
        phone
          ? { perspective: 1000, perspectiveOrigin: "50% 30%" }
          : ({
              maxHeight: tune.maxHeight,
              "--filters-gap": `${tune.filtersToLine - 8}px`,
              "--total-size": `${tune.totalSize}px`,
              "--sub-size": `${tune.subSize}px`,
              "--servings-size": `${tune.servingsSize}px`,
              "--name-size": `${tune.nameSize}px`,
              "--label-size": `${tune.labelSize}px`,
              "--prep-size": `${tune.prepSize}px`,
              "--prep-icon-size": `${tune.prepIconSize}px`,
              "--filter-size": `${tune.filterSize}px`,
              "--layer-name-size": `${tune.layerNameSize}px`,
              "--layer-amount-size": `${tune.layerAmountSize}px`,
              "--layer-unit-size": `${tune.layerUnitSize}px`,
              "--serving-num-size": `${tune.servingNumSize}px`,
              "--pill-size": `${tune.pillSize}px`,
              "--category-size": `${tune.categorySize}px`,
              "--chip-size": `${tune.chipSize}px`,
            } as React.CSSProperties)
      }
    >
      {/* The browse filters: they move back (z) and disappear when the edit panel comes up. */}
      <div
        ref={barRef}
        className="md:col-span-2 md:row-start-1"
        // Wide screens: the gap above the filters (16px page padding + 8px of their tap area, plus this) and the gap from the squiggly line to the name.
        style={phone ? barStyle : { paddingTop: tune.filtersTop - 24, marginBottom: tune.lineToName - 16 }}
        inert={(phone && sheet.open) || ownPhone}
      >
        <FilterBar active={own ? BUILD_ID : filterId} onSelect={selectFilter} filters={barFilters} />
      </div>

      {/* ── Controls ──────────────────────────────────────────────── */}
      <header
        inert={drawerFull}
        // Out of sight while the phone's guide covers it, so it doesn't peek past the rounded corners.
        className={`intro-info flex flex-col transition-opacity duration-300 md:col-start-1 md:row-start-2 ${drawerFull ? "opacity-0" : ""}`} style={phone ? zHeader : { marginBottom: tune.labelToPanel - 16 }}>
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
          {/* A new drink's name and taste line fade in from the right (a new element for each drink,
              so the animation plays again). */}
          <div key={own ? "own" : infoDrink.id} className={`min-w-0 ${own || infoD >= DRINKS.length ? "flex-1" : ""} ${titleMoves && !own ? "title-in" : ""}`}>
            {own ? (
              // Build my own: the name is yours to change (the guide gives it a made-up one when it is done).
              <NameField value={ownName} onChange={setOwnName} placeholder="Build a drink" />
            ) : infoD >= DRINKS.length ? (
              // A drink you saved keeps the pencil (JP, 2026-11-27).
              <SavedName key={infoDrink.id} name={infoDrink.name} onRename={(name) => renameSaved(infoDrink.id, name)} />
            ) : (
              <h1 className="font-serif text-[40px] leading-[52px] md:text-[length:var(--name-size,50px)] md:leading-[1.28]" style={zTitle}>
                {infoDrink.name}
              </h1>
            )}
            {/* The taste summary, a dot, then the drink's alcohol (both follow your edits). */}
            <p className="mt-1 flex items-center gap-[5px] text-xs opacity-55 md:text-[length:var(--label-size,14px)]" style={zFamily}>
              {own && ownLines.length === 0 ? (
                <span>A few questions first</span>
              ) : (
                <>
                  <span>{tasteSummary(profile)}</span>
                  <span aria-hidden className="size-0.5 shrink-0 rounded-full bg-[#7f7f7f]" />
                  <span>{abvLabel(profile)}</span>
                </>
              )}
            </p>
          </div>
          {/* Phones keep the prep icons here; wide screens show the Sweet and Bitter ladders (Figma 256:832)
              and move the prep icons down to "Best prepared". */}
          {phone && !own ? (
            <div className="relative -mr-1" style={zPrep}>
              <PrepTags method={infoDrink.method} glass={infoDrink.glass} />
            </div>
          ) : (
            activeLines.length > 0 && (
              <div className="shrink-0">
                <FlavorLadders profile={profile} />
              </div>
            )
          )}
          {/* Once the drawer is up, the Sweet and Bitter ladders take the prep icons' place, their names level with
              the label under the title. */}
          {phone && !own && (
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
      {/* The row and the lens over it load in as ONE piece (intro-card). The browser animates a size change on its
          own, ahead of the code that moves the lens's window, so animating the row alone let the window trail the
          growing drink and trim its sides. */}
      <div
        className="intro-card relative flex min-h-0 flex-1 flex-col"
        style={isDesktop ? { transformOrigin: `50% ${cardTop + cardHeight / 2}px` } : undefined}
      >
      <div
        ref={trackRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Drinks"
        inert={own}
        className="relative -mx-4 min-h-0 flex-1 touch-none overflow-hidden select-none md:mx-0"
        // Wide screens: the side drinks fade out within tune.sideFade px of the card; the middle card stays at full strength.
        style={
          isDesktop
            ? {
                // The mask stays as wide as the zoomed drink until the side drinks are on their way back, so the
                // drink isn't clipped while it is still zooming out.
                // With the lens on, it sets this mask itself, every frame (and does the side fade in its picture).
                ...(lens
                  ? {}
                  : {
                      maskImage: sideFadeMask(cardWidth * (zoomed || sideMode === "hidden" ? zoomAmount : 1)),
                      WebkitMaskImage: sideFadeMask(cardWidth * (zoomed || sideMode === "hidden" ? zoomAmount : 1)),
                    }),
                // How far the fade reaches. It grows from 0 when the drawer closes (step 2 of the closing order).
                "--side-fade": `${gradientOn ? tune.sideFade : 0}px`,
                opacity: own ? 0 : 1,
                transition: `opacity 400ms, --side-fade ${GRADIENT_MS}ms ease-out`,
              } as React.CSSProperties
            : { opacity: own ? 0 : 1 }
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {/* Build mode: the row zooms in on the middle drink, the others fade away. */}
        <div className="build-zoom absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: `50% ${cardTop + cardHeight / 2}px` }}>
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
              style={{
                width: cardWidth,
                height: cardHeight,
                marginTop: isDesktop ? 0 : -cardHeight / 2,
                // Wide screens: the other drinks fade out as the drink zooms (phones drive opacity from the sheet instead).
                ...(isDesktop
                  ? { top: cardTop, transition: sideMode === "staged" ? "none" : sideMode === "entering" ? (intro || groupIn ? `opacity ${INTRO_SIDE_MS}ms ${INTRO_EASE}, transform ${INTRO_SIDE_MS}ms ${INTRO_EASE}` : `opacity ${SIDE_MS}ms ${ZOOM_EASE}, transform ${SIDE_MS}ms ${ZOOM_EASE}`) : `opacity ${ZOOM_MS}ms ${ZOOM_EASE}` }
                  : {}),
              }}
            >
              <DrinkCard
                drink={all[d]}
                drinkIndex={d}
                lines={edits[d] ?? all[d].lines}
                onEdit={onEdit}
                interactive={j === infoIndex && !busy && !sheet.open}
                inView={j === infoIndex}
                onHorizontal={zoomed ? noop : onHorizontal}
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

      </div>
      {lens && !own && <SideLens cardWidth={cardWidth} zoom={zoom} />}
      </div>

      {/* Build my own: its own glass, the same size as Build mode's zoomed drink. Empty until you add something. */}
      {own && (
        <div
          className="build-zoom absolute"
          style={{
            left: `calc(50% - ${cardWidth / 2}px)`,
            // A phone centers its cards in the row instead of using cardTop.
            top: isDesktop ? cardTop : Math.max(0, (trackSize.height - cardHeight) / 2),
            width: cardWidth,
            height: cardHeight,
            transform: `scale(${zoom})`,
          }}
        >
          {ownLines.length === 0 ? (
            // Just the words, with no outline of a glass around them (JP, 2026-11-27).
            <div className="absolute inset-0 grid place-items-center text-center md:p-6">
              <div>
                <GlassSilhouette />
                <p className="mt-3 text-sm text-[#F7F7F7]/50 md:mt-5">
                  Your glass is empty.
                  <span className="mt-1 block text-xs text-[#F7F7F7]/35">Pick a classic, or answer the guide: each one adds a layer.</span>
                </p>
              </div>
            </div>
          ) : (
            <DrinkCard
              drink={ownDrink}
              drinkIndex={-1}
              lines={ownLines}
              onEdit={(_, update) => setOwnLines(update)}
              interactive
              inView
              onHorizontal={noop}
              servings={ownServings}
              modified={false}
              onReset={noop}
              pours
              // On a phone the first pour waits for the guide to get most of the way down.
              pourDelay={ownPhone && ownLines.length === 1 ? PHONE_REVEAL_MS : 0}
            />
          )}
        </div>
      )}

      {/* Wide screens: the effect over the side drinks (see SIDE_EFFECT). Outside the row, under the arrows. */}
      {SIDE_EFFECT === "glass" &&
        isDesktop &&
        N > 1 &&
        sidePane >= 70 &&
        (["left", "right"] as const).map((side) => (
          <SideGlass
            key={side}
            side={side}
            width={sidePane}
            height={cardHeight * GLASS_HEIGHT}
            style={{ top: cardTop + (cardHeight * (1 - GLASS_HEIGHT)) / 2, ...(side === "left" ? { left: 0 } : { right: 0 }) }}
            shown={!zoomed && sideMode !== "hidden" && sideMode !== "staged"}
          />
        ))}

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
            tabIndex={zoomed ? -1 : 0}
            className={`absolute z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-[#21201E]/50 text-white backdrop-blur-md hover:bg-[#2C2A27]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${zoomed || sideMode === "hidden" || sideMode === "staged" ? "pointer-events-none opacity-0" : ""}`}
            style={{ top: cardTop + cardHeight / 2, transition: `opacity ${SLIDE_MS + 150}ms ${ZOOM_EASE}, background-color 150ms`, ...(delta < 0 ? { right: `calc(50% + ${cardWidth / 2 + tune.cardToArrows}px)` } : { left: `calc(50% + ${cardWidth / 2 + tune.cardToArrows}px)` }) }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}

      {/* Serving size and the total under the drink (Figma 187:43). Wide screens: exactly as wide as the
          card and 16px under it (JP, 2026-11-18). It sits above the side lens (z-9), which would shave its ends. */}
      <div
        // Building your own on a phone, the glass needs the room: no serving buttons there. OPEN: for JP to review.
        className={`intro-servings z-10 mt-[23px] shrink-0 px-[9px] md:mx-0 md:px-0 ${ownPhone ? "hidden" : ""}`}
        style={
          isDesktop
            ? { position: "absolute", marginTop: 0, left: `calc(50% - ${cardWidth / 2}px)`, width: cardWidth, bottom: 0 }
            : undefined
        }
      >
        <ServingsRow
          servings={activeServings}
          total={formatTotal(totalParts(activeLines), DEFAULT_UNIT, activeServings)}
          perServing={formatTotal(totalParts(activeLines), DEFAULT_UNIT, 1)}
          onChange={setActiveServings}
        />
      </div>

      </div>

      {/* On a phone the edit panel floats over the bottom of the screen; this keeps the drink above it. The height
          leaves the same 23px between the serving buttons and the panel as between the drink and the serving
          buttons (the screen's 16px padding and 16px gap are counted in: height = panel height - 24, found by measuring on a 402x749 screen). */}
      {!ownPhone && <div aria-hidden className="shrink-0 md:hidden" style={{ height: PANEL_CLOSED_HEIGHT - 24 }} />}

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
      {/* Building on a phone, the guide floats so it can move; this keeps its lowered half's room, so the glass
          is already in place behind it. */}
      {ownPhone && <div aria-hidden className="h-[calc(50dvh-16px)] shrink-0" />}
      <div
        className={`intro-info md:relative md:col-start-1 md:row-start-3 md:min-h-0 ${
          // Lowered, its top edge sits at the middle of the screen.
          ownPhone ? "panel-slide-up absolute inset-x-4 bottom-4 z-30 transition-[top] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" : ""
        }`}
        style={ownPhone ? { top: drawerFull ? PHONE_DRAWER_FULL_TOP : "50dvh" } : undefined}
      >
      {/* Browse mode (wide screens): the drink's story and the buttons that start Build mode. It stays underneath
          while the Edit Panel slides over it or away. */}
      {isDesktop && (mode === "browse" || settling || closing) && (
        <div
          key="browse"
          // Fades in after the panel has gone back down; fades out before it comes up; hidden while the panel covers it.
          className={`h-full min-h-0 ${leavingBrowse ? "panel-out pointer-events-none" : settling || closing ? "opacity-0" : hasOpened ? "panel-fade" : ""}`}
        >
          <BrowsePanel
            drink={infoDrink}
            onEdit={() => openBuild("structure", "build")}
            onRemove={infoD >= DRINKS.length ? removeDrink : undefined}
          />
        </div>
      )}
      {(!isDesktop || mode !== "browse") &&
        (() => {
          const sheetBody = (
            <>
              <div
                ref={panelScrollRef}
                className={`panel-scroll md:h-full md:rounded-[30px] md:bg-[#21201E] ${guideHere ? "md:overflow-hidden" : "md:overflow-y-auto"} ${
                  ownPhone ? "h-full overflow-hidden rounded-[30px] bg-[#21201E]" : ""
                }`}
              >
                {isDesktop || own ? (
                  editPanel
                ) : (
                  <EditPanel
                    onOpen={() => {
                      setTab("structure");
                      sheet.openSheet();
                    }}
                    open={sheet.open}
                    onToggle={sheet.toggle}
                    travel={travel}
                    bind={sheet.bind}
                    drawer={editPanel}
                  />
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
            </>
          );
          // Wide screens: the whole panel slides up from the bottom (and back down on Done).
          return isDesktop ? (
            // It stops at the page's 16px padding and is rounded on all four corners (JP, 2026-11-27).
            <div key={mode} className={`absolute inset-x-0 top-0 bottom-0 z-10 ${closing ? "panel-slide-down" : "panel-slide-up"}`}>
              {sheetBody}
            </div>
          ) : (
            sheetBody
          );
        })()}
      </div>
      {/* Dev only: the design editor, sliders for the wide-screen spacing and text sizes (never on the live site). */}
      <DesignEditor />
    </main>
  );
}
