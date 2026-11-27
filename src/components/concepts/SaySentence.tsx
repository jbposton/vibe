"use client";

// Concept C, "Say it in a sentence": the whole drink is one sentence with blanks. Filled blanks take
// the ingredient's color as an underline. Choices sit in a tray at the bottom, and any blank can be
// tapped to change it.
import { useEffect, useRef, useState } from "react";
import { GUIDE_STEPS, MOODS, optionsFor } from "@/data/builder";
import { INGREDIENTS } from "@/data/ingredients";
import type { Role } from "@/data/roles";
import { focusRing, Footer, Icon, type Guide } from "./shared";

/** The words before each blank, and what the blank says while empty or when skipped. */
const CLAUSE: Record<Role, { lead: string; empty: string; none: string }> = {
  base: { lead: "Start it with", empty: "a base", none: "nothing" },
  modifier: { lead: "round it out with", empty: "something", none: "nothing extra" },
  sweet: { lead: "sweeten it with", empty: "something sweet", none: "no sweetener" },
  sour: { lead: "sharpen it with", empty: "something sharp", none: "no citrus" },
  bitter: { lead: "deepen it with", empty: "something bitter", none: "nothing bitter" },
  lengthener: { lead: "top it up with", empty: "a mixer", none: "no mixer" },
  aromatic: { lead: "and finish with", empty: "a garnish", none: "no garnish" },
};
const MOOD_BLANK = -1;

export function SaySentence({ guide }: { guide: Guide }) {
  const { mood, picks, next } = guide;
  const [chosen, setChosen] = useState<number | null>(null);
  const active: number | null = !mood ? MOOD_BLANK : (chosen ?? (next >= 0 ? next : null));
  // The sentence grows one clause at a time.
  const shown = !mood ? 0 : next < 0 ? GUIDE_STEPS.length : next + 1;
  const step = active !== null && active >= 0 ? GUIDE_STEPS[active] : null;

  // Keep the end of the sentence in view as it grows. Only the sentence's own box scrolls.
  const sentence = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentence.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  const blank = (index: number, text: string, color?: string) => (
    <button type="button" onClick={() => setChosen(index === MOOD_BLANK ? MOOD_BLANK : index)} className={`inline rounded-sm border-b-[3px] text-left leading-[30px] ${active === index ? "bg-white/10" : "hover:bg-white/5"} ${color || active === index ? "text-white" : "text-white/55"} ${focusRing}`} style={{ borderColor: color ?? (active === index ? "#F7F7F7" : "rgba(247,247,247,.3)") }}>
      {text}
    </button>
  );
  const trayMood = active === MOOD_BLANK || chosen === MOOD_BLANK;
  const row = `flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#1A1612] pr-4 text-[13px] hover:bg-[#2F2B26] ${focusRing}`;

  return (
    <div className="flex h-full flex-col">
      <div ref={sentence} className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 pt-6">
        <p className="font-serif text-[25px] leading-[38px] text-white/80">
          I&rsquo;m in the mood for something {blank(MOOD_BLANK, mood ? mood.label.toLowerCase() : "…", mood ? "#F7F7F7" : undefined)}.
          {GUIDE_STEPS.slice(0, shown).map((s, i) => {
            const p = picks[i];
            const c = CLAUSE[s.role];
            return (
              <span key={s.role} className="panel-fade">
                {" "}{c.lead}{" "}
                {blank(i, p ? INGREDIENTS[p].name.toLowerCase() : p === null ? c.none : c.empty, p ? INGREDIENTS[p].color : undefined)}
                {i === GUIDE_STEPS.length - 1 ? "." : ","}
              </span>
            );
          })}
        </p>
      </div>

      {(trayMood || step) && (
        <div className="mx-3 flex max-h-[46%] shrink-0 flex-col rounded-[20px] bg-[#2A2622] p-3">
          <p className="mb-2 text-[12px] text-white/65">{trayMood ? "Pick a mood" : step!.ask}</p>
          <div className="flex min-h-0 flex-wrap gap-1.5 overflow-y-auto p-0.5">
            {trayMood
              ? MOODS.map((m) => (
                  <button key={m.id} type="button" onClick={() => { guide.chooseMood(m.id); setChosen(null); }} className={`${row} pl-4`}>
                    {m.label}
                  </button>
                ))
              : optionsFor(step!.role, mood).map((o) => (
                  <button key={o.id} type="button" onClick={() => { guide.pick(active!, o.id); setChosen(null); }} className={`${row} border pl-1.5 ${o.suggested ? "border-white/40" : "border-transparent"}`}>
                    <Icon id={o.id} />
                    {INGREDIENTS[o.id].name}
                  </button>
                ))}
            {!trayMood && step!.skippable && (
              <button type="button" onClick={() => { guide.pick(active!, null); setChosen(null); }} className={`${row} border border-dashed border-white/30 pl-4 text-white/65`}>
                Skip
              </button>
            )}
          </div>
        </div>
      )}
      <Footer guide={{ ...guide, restart: () => { guide.restart(); setChosen(null); } }} />
    </div>
  );
}
