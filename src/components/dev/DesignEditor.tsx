"use client";

import { useEffect, useRef, useState } from "react";
import { resetTuning, setTuning, TUNING_DEFAULTS, useTuning, type Tuning } from "@/lib/tuning";

/**
 * DEV ONLY: the design editor (JP, 2026-11-18), a small floating panel with sliders for the
 * wide-screen spacing and text sizes. It only appears when the app runs on your own computer
 * (`npm run dev`), never on the live site. Drag its header to move it. Drag a slider to see the
 * layout change, then "Copy values" and paste them to Claude to make them permanent. Changes here are
 * not saved: a refresh goes back to the values in lib/tuning.ts.
 */

type Row = { key: keyof Tuning; label: string; min: number; max: number; step: number; unit: string };

const SECTIONS: { title: string; rows: Row[] }[] = [
  {
    title: "Spacing",
    rows: [
      { key: "filtersTop", label: "Above the filters", min: 16, max: 80, step: 1, unit: "px" },
      { key: "filtersToLine", label: "Filters to squiggly line", min: 8, max: 60, step: 1, unit: "px" },
      { key: "lineToName", label: "Squiggly line to name", min: 16, max: 80, step: 1, unit: "px" },
      { key: "labelToPanel", label: "Label to edit panel", min: 16, max: 60, step: 1, unit: "px" },
      { key: "cardToServings", label: "Card to serving buttons", min: 0, max: 48, step: 1, unit: "px" },
      { key: "cardToArrows", label: "Card to ‹ › buttons", min: 0, max: 60, step: 1, unit: "px" },
    ],
  },
  {
    title: "Layout",
    rows: [
      { key: "sideFade", label: "Side drinks fade", min: 40, max: 400, step: 5, unit: "px" },
      { key: "cardScale", label: "Card size", min: 0.5, max: 1, step: 0.01, unit: "×" },
      { key: "prepIconSize", label: "Stirred / Rocks icons", min: 20, max: 64, step: 1, unit: "px" },
      { key: "maxHeight", label: "Page height cap", min: 600, max: 1200, step: 10, unit: "px" },
    ],
  },
  {
    title: "Text",
    rows: [
      { key: "filterSize", label: "Browse filters", min: 8, max: 20, step: 1, unit: "px" },
      { key: "nameSize", label: "Drink name", min: 24, max: 80, step: 1, unit: "px" },
      { key: "labelSize", label: "Label under the name", min: 8, max: 24, step: 1, unit: "px" },
      { key: "prepSize", label: "Stirred / Rocks", min: 8, max: 24, step: 1, unit: "px" },
      { key: "layerNameSize", label: "Card: ingredient names", min: 8, max: 20, step: 1, unit: "px" },
      { key: "layerAmountSize", label: "Card: amounts", min: 10, max: 28, step: 1, unit: "px" },
      { key: "layerUnitSize", label: "Card: oz / Garnish", min: 8, max: 24, step: 1, unit: "px" },
      { key: "servingNumSize", label: "Serving buttons (1, 2, 4)", min: 8, max: 20, step: 1, unit: "px" },
      { key: "servingsSize", label: '"Servings"', min: 8, max: 20, step: 1, unit: "px" },
      { key: "totalSize", label: "Total amount", min: 10, max: 32, step: 1, unit: "px" },
      { key: "subSize", label: "Text under the total", min: 8, max: 20, step: 1, unit: "px" },
      { key: "pillSize", label: "Edit pills (More sweet…)", min: 8, max: 18, step: 1, unit: "px" },
      { key: "categorySize", label: "Ingredient categories", min: 8, max: 18, step: 1, unit: "px" },
      { key: "chipSize", label: "Ingredient names", min: 8, max: 18, step: 1, unit: "px" },
    ],
  },
];
const ROWS = SECTIONS.flatMap((s) => s.rows);

const OPEN_KEY = "vibe-design-editor-open";
const POS_KEY = "vibe-design-editor-pos";
const WIDTH = 288;

export function DesignEditor() {
  if (process.env.NODE_ENV !== "development") return null;
  return <Panel />;
}

function Panel() {
  const tune = useTuning();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // Where the open panel sits (its top-left corner, px). null = the default, bottom right.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Remember open/closed and where it was moved to (this browser only; fine if it can't).
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after mount, to avoid a hydration mismatch
      setOpen(localStorage.getItem(OPEN_KEY) === "1");
      const saved = localStorage.getItem(POS_KEY);
      if (saved) setPos(JSON.parse(saved));
    } catch {}
  }, []);
  const toggle = () => {
    setOpen((o) => {
      try {
        localStorage.setItem(OPEN_KEY, o ? "0" : "1");
      } catch {}
      return !o;
    });
  };

  // Moving: drag the header. The panel stays inside the window.
  const clampPos = (x: number, y: number) => {
    const h = panelRef.current?.offsetHeight ?? 200;
    return {
      x: Math.min(Math.max(8, x), window.innerWidth - WIDTH - 8),
      y: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - Math.min(h, 120))),
    };
  };
  const onGrab = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("button")) return;
    const r = panelRef.current?.getBoundingClientRect();
    if (!r) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // the pointer already ended
    }
    drag.current = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    setPos(clampPos(e.clientX - d.dx, e.clientY - d.dy));
  };
  const onDrop = () => {
    drag.current = null;
    try {
      if (pos) localStorage.setItem(POS_KEY, JSON.stringify(pos));
    } catch {}
  };
  const resetPosition = () => {
    setPos(null);
    try {
      localStorage.removeItem(POS_KEY);
    } catch {}
  };

  const changed = ROWS.filter((r) => tune[r.key] !== TUNING_DEFAULTS[r.key]);
  const copy = async () => {
    const text = SECTIONS.map(
      (s) => `${s.title}\n` + s.rows.map((r) => `${r.label}: ${tune[r.key]}${r.unit === "×" ? "" : r.unit}`).join("\n"),
    ).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy these values:", text);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-4 right-4 z-[100] rounded-full border border-white/15 bg-black/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white shadow-xl backdrop-blur-md hover:bg-black"
      >
        Design
      </button>
    );
  }

  // Moved panels keep their top where you put them and get shorter (and scroll) to fit the window.
  const place: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, maxHeight: `calc(100vh - ${pos.y + 16}px)` }
    : { right: 16, bottom: 16 };
  return (
    <div
      ref={panelRef}
      className="fixed z-[100] flex max-h-[calc(100vh-2rem)] flex-col rounded-2xl border border-white/10 bg-black/85 text-[11px] text-white shadow-2xl backdrop-blur-md"
      style={{ width: WIDTH, ...place }}
    >
      {/* The header: drag it to move the panel. */}
      <div
        className="flex cursor-grab touch-none select-none items-center justify-between rounded-t-2xl px-4 pb-2 pt-3 active:cursor-grabbing"
        onPointerDown={onGrab}
        onPointerMove={onMove}
        onPointerUp={onDrop}
        onPointerCancel={onDrop}
        onDoubleClick={resetPosition}
        title="Drag to move. Double-click to put it back in the corner."
      >
        <p className="flex items-center gap-2 font-medium uppercase tracking-[0.08em]">
          <span aria-hidden className="text-white/40">⠿</span>
          Design editor
        </p>
        <button type="button" onClick={toggle} aria-label="Close the design editor" className="rounded-full px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-1 select-text">
        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.08em] text-white/40">{section.title}</p>
            <div className="flex flex-col gap-3">
              {section.rows.map((r) => {
                const value = tune[r.key];
                const isChanged = value !== TUNING_DEFAULTS[r.key];
                return (
                  <label key={r.key} className="flex flex-col gap-1">
                    <span className="flex justify-between">
                      <span className={isChanged ? "text-white" : "text-white/60"}>{r.label}</span>
                      <span className="tabular-nums">
                        {value}
                        {r.unit}
                      </span>
                    </span>
                    <input
                      type="range"
                      min={r.min}
                      max={r.max}
                      step={r.step}
                      value={value}
                      onChange={(e) => setTuning({ [r.key]: Number(e.target.value) } as Partial<Tuning>)}
                      className="w-full accent-white"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-4 pb-4 pt-3">
        <div className="flex gap-2">
          <button type="button" onClick={copy} className="flex-1 rounded-full bg-white px-3 py-2 font-medium text-black hover:bg-white/90">
            {copied ? "Copied" : "Copy values"}
          </button>
          <button
            type="button"
            onClick={resetTuning}
            disabled={changed.length === 0}
            className="rounded-full border border-white/20 px-3 py-2 hover:bg-white/10 disabled:opacity-40"
          >
            Reset
          </button>
        </div>
        <p className="mt-2 text-white/45">Wide screens only. Drag the header to move it. Refresh to undo; paste the copied values to Claude to keep them.</p>
      </div>
    </div>
  );
}
