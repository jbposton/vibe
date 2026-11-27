"use client";

// Concept A, "One question at a time": no chat history. One large question fills the panel, answers are
// big color tiles, and the strip along the top fills with each ingredient's color.
import { GUIDE_STEPS, MOODS, optionsFor } from "@/data/builder";
import { INGREDIENTS } from "@/data/ingredients";
import { focusRing, Footer, Icon, moodColors, type Guide } from "./shared";

export function OneAtATime({ guide }: { guide: Guide }) {
  const { mood, picks, next } = guide;
  const step = mood && next >= 0 ? GUIDE_STEPS[next] : null;
  const tile = `group flex flex-col overflow-hidden rounded-2xl bg-[#2A2622] text-left transition-colors hover:bg-[#353029] ${focusRing}`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 gap-1 px-5 pt-5" role="img" aria-label={`${picks.filter((p) => p !== undefined).length} of ${GUIDE_STEPS.length} questions answered`}>
        {picks.map((p, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${p === null ? "bg-white/35" : "bg-white/10"} ${i === next && mood ? "ring-1 ring-white/60" : ""}`} style={p ? { background: INGREDIENTS[p].color, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.25)" } : undefined} />
        ))}
      </div>
      <div className="flex h-9 shrink-0 items-center px-5 pt-2">
        {mood && (
          <button type="button" onClick={guide.back} className={`text-[12px] text-white/55 hover:text-white ${focusRing}`}>
            Back
          </button>
        )}
      </div>

      <div key={`${mood?.id}-${next}`} className="panel-fade min-h-0 flex-1 overflow-y-auto px-5 pb-2">
        <h3 className="mb-5 text-balance font-serif text-[32px] leading-[34px]">
          {!mood ? "What are you in the mood for?" : step ? step.ask : "That's your drink."}
        </h3>

        {!mood && (
          <div className="grid grid-cols-2 gap-2">
            {MOODS.map((m) => (
              <button key={m.id} type="button" onClick={() => guide.chooseMood(m.id)} className={`${tile} ${m.zeroProof ? "col-span-2" : ""}`}>
                <span aria-hidden className="flex h-9 w-full">
                  {moodColors(m).map((c, i) => (
                    <span key={i} className="flex-1 transition-[flex-grow] group-hover:first:grow-[2]" style={{ background: c }} />
                  ))}
                </span>
                <span className="px-3 pb-3 pt-2">
                  <span className="block text-[14px]">{m.label}</span>
                  <span className="block text-[11px] leading-[15px] text-white/50">{m.hint}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {step && (
          <div className="grid grid-cols-2 gap-2">
            {optionsFor(step.role, mood).map((o) => (
              <button key={o.id} type="button" onClick={() => guide.pick(next, o.id)} className={tile}>
                <span aria-hidden className="h-2 w-full" style={{ background: INGREDIENTS[o.id].color }} />
                <span className="flex min-h-[60px] items-center gap-2 p-2">
                  <Icon id={o.id} size={36} />
                  <span>
                    <span className="block text-[13px] leading-[16px]">{INGREDIENTS[o.id].name}</span>
                    {o.suggested && <span className="block text-[11px] text-white/50">Suggested</span>}
                  </span>
                </span>
              </button>
            ))}
            {step.skippable && (
              <button type="button" onClick={() => guide.pick(next, null)} className={`col-span-2 h-11 rounded-2xl border border-dashed border-white/25 text-[13px] text-white/65 hover:border-white/55 hover:text-white ${focusRing}`}>
                Skip this one
              </button>
            )}
          </div>
        )}

        {mood && !step && <p className="text-[13px] leading-[20px] text-white/60">Drag a layer to tune the amounts, or go back to change an answer.</p>}
      </div>
      <Footer guide={guide} />
    </div>
  );
}
