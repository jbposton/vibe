"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { GUIDE_STEPS, MOODS, optionsFor } from "@/data/builder";
import { FLAVORS } from "@/data/flavor";
import { INGREDIENTS, type IngredientId } from "@/data/ingredients";
import type { Role } from "@/data/roles";

/** Where the conversation is: the mood, and what was said at each step. Kept by the flow, so it survives leaving the screen. */
export type Chat = {
  moodId: string | null;
  /** One entry per answered step: the ingredient chosen, or null for "skip". */
  answers: (IngredientId | null)[];
};
export const EMPTY_CHAT: Chat = { moodId: null, answers: [] };

type Props = {
  chat: Chat;
  /** The guide's answer for the next step: sets (or, with null, clears) the ingredient in that role. */
  onAnswer: (role: Role, ingredient: IngredientId | null) => void;
  onMood: (moodId: string) => void;
  /** Start over: clears the drink and the conversation. */
  onRestart: () => void;
};

const bubble = "max-w-[88%] rounded-[20px] px-4 py-3 text-[13px] leading-[19px]";
const chip =
  "flex h-11 items-center gap-2 rounded-full border border-transparent bg-[#1A1612] py-1 pl-1 pr-3.5 text-[10px] uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#26221E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]";

/** A line about what an ingredient brings, from its strongest curated flavor note. */
function remark(id: IngredientId): string {
  const note = [...FLAVORS[id].notes].sort((a, b) => b[1] - a[1])[0]?.[0];
  return note ? `${INGREDIENTS[id].name}: that brings something ${note}.` : `${INGREDIENTS[id].name}, nice.`;
}

/**
 * The guide (v2 flow, build my own): a chat that talks you through a drink one decision at a time,
 * starting with how you feel and then going role by role. Each answer fills the roles panel on the
 * other side and the empty glass updates. The questions and choices are scripted for now.
 * OPEN: free-form chat. The text box is a placeholder until a language model is connected (that needs an
 * API key kept on the server, so it is a separate step).
 */
export function BuilderChat({ chat, onAnswer, onMood, onRestart }: Props) {
  const mood = MOODS.find((m) => m.id === chat.moodId) ?? null;
  const stepIndex = chat.answers.length;
  const step = mood && stepIndex < GUIDE_STEPS.length ? GUIDE_STEPS[stepIndex] : null;
  const finished = !!mood && !step;

  // Keep the newest message in view.
  // (Only after something is answered: on arrival the first question stays at the top.)
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !chat.moodId) return;
    // Bring the newest question to the top of the panel, so it and its choices are in view together.
    const latest = el.querySelector<HTMLElement>("[data-latest]");
    el.scrollTo({ top: latest ? latest.offsetTop - 4 : el.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [chat]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain pb-3 pr-1">
        <div className={`${bubble} bg-[#1A1612]`}>Let&rsquo;s build you a drink. First, what are you in the mood for?</div>

        {!mood && (
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onMood(m.id)}
                className="rounded-[18px] border border-white/15 px-4 py-2.5 text-left transition-colors hover:border-white/50 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]"
              >
                <span className="block text-[13px]">{m.label}</span>
                <span className="block text-[11px] text-[#F7F7F7]/50">{m.hint}</span>
              </button>
            ))}
          </div>
        )}

        {mood && <div className={`${bubble} self-end bg-white/10`}>{mood.label}</div>}

        {GUIDE_STEPS.slice(0, stepIndex + (step ? 1 : 0)).map((s, i) => {
          const answered = i < stepIndex;
          const picked = chat.answers[i];
          return (
            <div key={s.role} data-latest={i === stepIndex ? "" : undefined} className="flex flex-col gap-3">
              <div className={`${bubble} bg-[#1A1612]`}>
                {i > 0 && chat.answers[i - 1] && <span className="mb-1 block text-[#F7F7F7]/55">{remark(chat.answers[i - 1]!)}</span>}
                {s.ask}
              </div>
              {answered ? (
                <div className={`${bubble} self-end bg-white/10`}>{picked ? INGREDIENTS[picked].name : "Skip this one"}</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {optionsFor(s.role, mood).map((o) => (
                    <button key={o.id} type="button" onClick={() => onAnswer(s.role, o.id)} className={`${chip} ${o.suggested ? "border-white/40" : ""}`}>
                      <Image src={`/icons/ingredients/${o.id}.png`} alt="" width={32} height={32} unoptimized draggable={false} className="size-8 shrink-0" />
                      <span className="flex flex-col items-start leading-[13px]">
                        {INGREDIENTS[o.id].name}
                        {o.suggested && <span className="mt-0.5 text-[8px] tracking-[0.08em] text-[#F7F7F7]/50">Suggested</span>}
                      </span>
                    </button>
                  ))}
                  {s.skippable && (
                    <button type="button" onClick={() => onAnswer(s.role, null)} className="h-11 rounded-full border border-white/20 px-4 text-[10px] uppercase tracking-[0.08em] text-[#F7F7F7]/70 transition-colors hover:border-white/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]">
                      Skip
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {finished && (
          <div data-latest className={`${bubble} bg-[#1A1612]`}>
            {chat.answers[chat.answers.length - 1] && <span className="mb-1 block text-[#F7F7F7]/55">{remark(chat.answers[chat.answers.length - 1]!)}</span>}
            That&rsquo;s your drink. Drag a layer, or use the roles panel, to tune the amounts. When it looks right, serve it.
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-white/10 pt-3">
        <input
          disabled
          aria-label="Ask the guide anything (coming soon)"
          placeholder="Ask anything: coming soon"
          className="h-11 min-w-0 flex-1 rounded-full bg-[#1A1612] px-4 text-[13px] text-white placeholder:text-[#F7F7F7]/35"
        />
        {mood && (
          <button type="button" onClick={onRestart} className="h-11 shrink-0 rounded-full border border-white/20 px-4 text-[10px] uppercase tracking-[0.08em] text-[#F7F7F7]/70 transition-colors hover:border-white/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]">
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
