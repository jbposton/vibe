"use client";

// Concept B, "Build the stack": the panel is laid out like the glass, base at the bottom and garnish on
// top. All seven roles are visible from the start; the open one shows its choices, and an answered one
// fills with its ingredient's color. Tap any row to answer it or change it.
import { useState } from "react";
import { GUIDE_STEPS, MOODS, ROLE_BLURB, optionsFor } from "@/data/builder";
import { INGREDIENTS } from "@/data/ingredients";
import { focusRing, Footer, Icon, inkOn, type Guide } from "./shared";

const ROLE_NAME = { base: "Base", modifier: "Modifier", sweet: "Sweet", sour: "Sour", bitter: "Bitter", lengthener: "Lengthener", aromatic: "Finish" };

export function BuildTheStack({ guide }: { guide: Guide }) {
  const { mood, picks, next } = guide;
  // A row the visitor reopened; otherwise the next unanswered one is open.
  const [chosen, setChosen] = useState<number | null>(null);
  const active = mood ? (chosen ?? next) : -1;

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pt-4">
        {!mood && <p className="mb-2 font-serif text-[24px] leading-[26px]">What are you in the mood for?</p>}
        <div className={`flex gap-1.5 ${mood ? "overflow-x-auto pb-1 [scrollbar-width:none]" : "flex-wrap"}`}>
          {MOODS.map((m) => (
            <button key={m.id} type="button" aria-pressed={mood?.id === m.id} onClick={() => { guide.chooseMood(m.id); setChosen(null); }} className={`h-9 shrink-0 rounded-full border px-3 text-[12px] transition-colors ${mood?.id === m.id ? "border-[#F7F7F7] bg-[#F7F7F7] text-[#1A1612]" : "border-white/20 text-white/80 hover:border-white/55"} ${focusRing}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3">
        <ol className="mt-auto flex flex-col-reverse gap-1">
          {GUIDE_STEPS.map((s, i) => {
            const picked = picks[i];
            const isOpen = i === active;
            const color = picked ? INGREDIENTS[picked].color : undefined;
            return (
              <li key={s.role} className={`shrink-0 overflow-hidden rounded-xl ${isOpen ? "border border-white/45 bg-[#2A2622]" : picked ? "border border-white/15" : "border border-dashed border-white/15"}`}>
                <button type="button" disabled={!mood} aria-expanded={isOpen} onClick={() => setChosen(i)} className={`flex min-h-9 w-full items-center justify-between gap-3 px-3 text-left disabled:opacity-45 ${focusRing} focus-visible:-outline-offset-2`} style={color && !isOpen ? { background: color, color: inkOn(color) } : undefined}>
                  <span className="text-[13px]">
                    {picked ? INGREDIENTS[picked].name : ROLE_NAME[s.role]}
                  </span>
                  <span className="text-[11px] opacity-60">{picked ? ROLE_NAME[s.role] : picked === null ? "Skipped" : ROLE_BLURB[s.role].split(":")[0]}</span>
                </button>
                {isOpen && (
                  <div className="panel-fade px-3 pb-3">
                    <p className="mb-2 text-[12px] leading-[17px] text-white/65">{s.ask}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {optionsFor(s.role, mood).map((o) => (
                        <button key={o.id} type="button" aria-pressed={picked === o.id} onClick={() => { guide.pick(i, o.id); setChosen(null); }} className={`flex h-9 items-center gap-1.5 rounded-full border bg-[#1A1612] pl-1 pr-3 text-[12px] hover:border-white/60 ${picked === o.id ? "border-white" : o.suggested ? "border-white/35" : "border-transparent"} ${focusRing}`}>
                          <Icon id={o.id} size={26} />
                          {INGREDIENTS[o.id].name}
                        </button>
                      ))}
                      {s.skippable && (
                        <button type="button" onClick={() => { guide.pick(i, null); setChosen(null); }} className={`h-9 rounded-full border border-dashed border-white/30 px-3 text-[12px] text-white/65 hover:text-white ${focusRing}`}>
                          Leave it out
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      <Footer guide={{ ...guide, restart: () => { guide.restart(); setChosen(null); } }} />
    </div>
  );
}
