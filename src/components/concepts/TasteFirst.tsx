"use client";

// Concept D, "Taste first": a live taste readout stays at the top, and every choice says what it will
// do to the drink before you pick it. Hovering or focusing a choice previews the change on the bars.
// The numbers come from the app's own flavor math (lib/flavor.ts).
import { useState } from "react";
import { GUIDE_STEPS, MOODS, newLine, optionsFor } from "@/data/builder";
import { FLAVORS } from "@/data/flavor";
import { INGREDIENTS, type IngredientId } from "@/data/ingredients";
import type { RecipeLine } from "@/data/drinks";
import { barFraction, flavorProfile, SCALE } from "@/lib/flavor";
import { volumeParts } from "@/lib/stack";
import { focusRing, Footer, Icon, type Guide } from "./shared";

const AXES = [
  { id: "sweetness", name: "Sweet", color: "#F6A852", more: "sweeter", less: "less sweet" },
  { id: "bitterness", name: "Bitter", color: "#9A77BB", more: "more bitter", less: "less bitter" },
  { id: "strength", name: "Strong", color: "#DB587A", more: "stronger", less: "lighter" },
] as const satisfies readonly { id: keyof typeof SCALE; name: string; color: string; more: string; less: string }[];

const bars = (lines: RecipeLine[]) => {
  const p = flavorProfile(lines);
  return AXES.map((a) => barFraction(a.id, p[a.id]));
};

/** What adding an ingredient does, in a few words: the biggest taste changes, plus what it smells or tastes of. */
function effect(lines: RecipeLine[], added: RecipeLine): string {
  const note = [...FLAVORS[added.ingredient].notes].sort((a, b) => b[1] - a[1])[0]?.[0];
  const hasLiquid = lines.some((l) => volumeParts(l.amount) > 0);
  const changes = hasLiquid
    ? bars([...lines, added])
        .map((after, i) => ({ diff: after - bars(lines)[i], axis: AXES[i] }))
        .filter((c) => Math.abs(c.diff) >= 0.07)
        .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
        .slice(0, 2)
        .map((c) => (c.diff > 0 ? c.axis.more : c.axis.less))
    : [];
  const text = [...changes, note ? `${note} notes` : hasLiquid ? "" : "a clean, neutral start"].filter(Boolean).join(", ") || "little change in taste";
  return text[0].toUpperCase() + text.slice(1);
}

export function TasteFirst({ guide }: { guide: Guide }) {
  const { mood, lines, next, picks } = guide;
  const step = mood && next >= 0 ? GUIDE_STEPS[next] : null;
  const [peek, setPeek] = useState<IngredientId | null>(null);
  const now = bars(lines);
  const then = step && peek ? bars([...lines, newLine(step.role, peek)]) : now;
  const row = `flex min-h-14 w-full shrink-0 items-center gap-3 rounded-2xl px-2 text-left transition-colors hover:bg-white/[.07] ${focusRing}`;

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/10 bg-[#26221E] px-5 pb-4 pt-4">
        {AXES.map((a, i) => (
          <div key={a.id} className="flex items-center gap-3 py-1">
            <span className="w-12 text-[12px] text-white/65">{a.name}</span>
            <div role="meter" aria-label={a.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(now[i] * 100)} className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              {/* The striped part is what the highlighted choice would add or take away. */}
              <span className="absolute inset-y-0 left-0 transition-[width] duration-300" style={{ width: `${Math.max(now[i], then[i]) * 100}%`, background: `repeating-linear-gradient(135deg, ${a.color} 0 3px, transparent 3px 6px)` }} />
              <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300" style={{ width: `${Math.min(now[i], then[i]) * 100}%`, background: a.color }} />
            </div>
          </div>
        ))}
      </div>

      <div key={`${mood?.id}-${next}`} className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 pt-4">
        <h3 className="mb-1 px-2 font-serif text-[24px] leading-[27px]">{!mood ? "What are you in the mood for?" : step ? step.ask : "That's your drink."}</h3>
        {mood && (
          <p className="mb-2 px-2 text-[12px] text-white/50">
            {step ? `${mood.label}, question ${next + 1} of ${GUIDE_STEPS.length}` : "Drag a layer to tune it and watch the taste move."}
          </p>
        )}
        {picks.some((p) => p !== undefined) && (
          <button type="button" onClick={guide.back} className={`mb-1 ml-2 text-[12px] text-white/60 underline underline-offset-4 hover:text-white ${focusRing}`}>
            Undo last answer
          </button>
        )}

        {!mood &&
          MOODS.map((m) => (
            <button key={m.id} type="button" onClick={() => guide.chooseMood(m.id)} className={`${row} !min-h-12 border-b border-white/5`}>
              <span className="flex-1 text-[14px]">{m.label}</span>
              <span className="text-[12px] text-white/50">{m.hint}</span>
            </button>
          ))}

        {step &&
          optionsFor(step.role, mood).map((o) => (
            <button key={o.id} type="button" onClick={() => { setPeek(null); guide.pick(next, o.id); }} onPointerEnter={() => setPeek(o.id)} onPointerLeave={() => setPeek(null)} onFocus={() => setPeek(o.id)} onBlur={() => setPeek(null)} className={row}>
              <Icon id={o.id} size={40} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[14px]">
                  <span aria-hidden className="size-2.5 shrink-0 rounded-full ring-1 ring-white/30" style={{ background: INGREDIENTS[o.id].color }} />
                  {INGREDIENTS[o.id].name}
                </span>
                <span className="block text-[12px] leading-[16px] text-white/55">{effect(lines, newLine(step.role, o.id))}</span>
              </span>
              {o.suggested && <span className="text-[11px] text-white/45">Suggested</span>}
            </button>
          ))}
        {step?.skippable && (
          <button type="button" onClick={() => guide.pick(next, null)} className={`${row} justify-center text-[13px] text-white/65`}>
            Skip this one
          </button>
        )}
      </div>
      <Footer guide={guide} />
    </div>
  );
}
