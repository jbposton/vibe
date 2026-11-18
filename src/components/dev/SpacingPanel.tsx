"use client";

import { useEffect, useState } from "react";
import { resetTuning, setTuning, TUNING_DEFAULTS, useTuning, type Tuning } from "@/lib/tuning";

/**
 * DEV ONLY: a small floating panel with sliders for the wide-screen spacing (JP, 2026-11-18). It only
 * appears when the app runs on your own computer (`npm run dev`), never on the live site. Drag a
 * slider to see the layout change, then "Copy values" and paste them to Claude to make them permanent.
 * Changes here are not saved: a refresh goes back to the values in lib/tuning.ts.
 */

type Row = { key: keyof Tuning; label: string; min: number; max: number; step: number; unit: string };

const ROWS: Row[] = [
  { key: "filtersTop", label: "Above the filters", min: 16, max: 80, step: 1, unit: "px" },
  { key: "filtersToLine", label: "Filters to squiggly line", min: 8, max: 60, step: 1, unit: "px" },
  { key: "lineToName", label: "Squiggly line to name", min: 16, max: 80, step: 1, unit: "px" },
  { key: "labelToPanel", label: "Label to edit panel", min: 16, max: 60, step: 1, unit: "px" },
  { key: "cardToServings", label: "Card to serving buttons", min: 0, max: 48, step: 1, unit: "px" },
  { key: "cardToArrows", label: "Card to ‹ › buttons", min: 0, max: 60, step: 1, unit: "px" },
  { key: "sideFade", label: "Side drinks fade", min: 40, max: 400, step: 5, unit: "px" },
  { key: "cardScale", label: "Card size", min: 0.5, max: 1, step: 0.01, unit: "×" },
  { key: "maxHeight", label: "Page height cap", min: 600, max: 1200, step: 10, unit: "px" },
  { key: "totalSize", label: "Total amount text", min: 10, max: 32, step: 1, unit: "px" },
  { key: "subSize", label: "Text under the total", min: 8, max: 20, step: 1, unit: "px" },
  { key: "servingsSize", label: '"Servings" text', min: 8, max: 20, step: 1, unit: "px" },
];

const OPEN_KEY = "vibe-spacing-panel-open";

export function SpacingPanel() {
  if (process.env.NODE_ENV !== "development") return null;
  return <Panel />;
}

function Panel() {
  const tune = useTuning();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Remember whether the panel was open (this browser only; fine if it can't).
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after mount, to avoid a hydration mismatch
      setOpen(localStorage.getItem(OPEN_KEY) === "1");
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

  const changed = ROWS.filter((r) => tune[r.key] !== TUNING_DEFAULTS[r.key]);
  const copy = async () => {
    const text = ROWS.map((r) => `${r.label}: ${tune[r.key]}${r.unit === "×" ? "" : r.unit}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy these values:", text);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] select-text text-[11px] text-white">
      {open ? (
        <div className="max-h-[calc(100vh-2rem)] w-72 overflow-y-auto rounded-2xl border border-white/10 bg-black/85 p-4 shadow-2xl backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium uppercase tracking-[0.08em]">Spacing and type (desktop)</p>
            <button type="button" onClick={toggle} aria-label="Close the spacing panel" className="rounded-full px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white">
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {ROWS.map((r) => {
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
          <div className="mt-4 flex gap-2">
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
          <p className="mt-3 text-white/45">Only on your computer. Refresh to undo; paste the copied values to Claude to keep them.</p>
        </div>
      ) : (
        <button type="button" onClick={toggle} className="rounded-full border border-white/15 bg-black/80 px-4 py-2 font-medium uppercase tracking-[0.08em] shadow-xl backdrop-blur-md hover:bg-black">
          Spacing
        </button>
      )}
    </div>
  );
}
