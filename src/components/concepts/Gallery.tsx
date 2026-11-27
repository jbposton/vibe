"use client";

import { useState, type ComponentType } from "react";
import { BuildTheStack } from "./BuildTheStack";
import { OneAtATime } from "./OneAtATime";
import { SaySentence } from "./SaySentence";
import { TasteFirst } from "./TasteFirst";
import { focusRing, MiniGlass, useGuide, type Guide } from "./shared";

type Concept = { id: string; name: string; idea: string; Panel: ComponentType<{ guide: Guide }> };

const CONCEPTS: Concept[] = [
  { id: "a", name: "A. One question at a time", idea: "Calm and visual: one big question with color tiles. You can't see earlier answers by name.", Panel: OneAtATime },
  { id: "b", name: "B. Build the stack", idea: "Mirrors the glass and teaches the roles. Any row can be changed. The busiest of the four.", Panel: BuildTheStack },
  { id: "c", name: "C. Say it in a sentence", idea: "Your drink reads as one sentence you can edit. The most personality, the least scannable.", Panel: SaySentence },
  { id: "d", name: "D. Taste first", idea: "Each choice says how it will change the taste. Teaches the most, with more to read.", Panel: TasteFirst },
];

function ConceptCard({ concept, withGlass }: { concept: Concept; withGlass: boolean }) {
  const guide = useGuide();
  const { Panel } = concept;
  return (
    <section className="flex shrink-0 flex-col gap-3">
      <div className="w-[390px]">
        <h2 className="text-[15px]">{concept.name}</h2>
        <p className="mt-1 min-h-10 text-[12px] leading-[18px] text-white/55">{concept.idea}</p>
      </div>
      <div className="flex items-stretch gap-8">
        <div className="h-[620px] w-[390px] overflow-hidden rounded-[24px] bg-[#21201E]">
          <Panel guide={guide} />
        </div>
        {withGlass && (
          <div className="h-[620px] w-[300px]">
            <MiniGlass lines={guide.lines} />
          </div>
        )}
      </div>
    </section>
  );
}

export function Gallery() {
  const [view, setView] = useState("all");
  const tabs = [{ id: "all", label: "All four" }, ...CONCEPTS.map((c) => ({ id: c.id, label: c.name }))];
  return (
    <main className="h-full select-none overflow-auto p-6">
      <h1 className="font-serif text-[34px] leading-[36px]">Build my own: guide concepts</h1>
      <nav className="mb-6 mt-4 flex flex-wrap gap-2" aria-label="Concepts">
        {tabs.map((t) => (
          <button key={t.id} type="button" aria-pressed={view === t.id} onClick={() => setView(t.id)} className={`h-9 rounded-full border px-4 text-[12px] ${view === t.id ? "border-[#F7F7F7] bg-[#F7F7F7] text-[#1A1612]" : "border-white/20 text-white/75 hover:border-white/55"} ${focusRing}`}>
            {t.label}
          </button>
        ))}
      </nav>
      {/* All stay mounted, so each concept keeps its answers while you switch views. */}
      <div className="flex w-max gap-6">
        {CONCEPTS.map((c) => (
          <div key={c.id} className={view === "all" || view === c.id ? undefined : "hidden"}>
            <ConceptCard concept={c} withGlass={view === c.id} />
          </div>
        ))}
      </div>
    </main>
  );
}
