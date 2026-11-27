"use client";

import Image from "next/image";
import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { GUIDE_STEPS, MOODS, optionsFor, ZERO_PROOF_BASE_ASK } from "@/data/builder";
import { FLAVORS } from "@/data/flavor";
import { TEXT_BUTTON } from "@/components/buttonStyles";
import { CheersToast } from "@/components/flow/CheersToast";
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
  /** A different choice on an earlier ingredient question: it changes that layer and keeps the other answers. */
  onChange?: (step: number, role: Role, ingredient: IngredientId | null) => void;
  /** Start over: clears the drink and the conversation. */
  onRestart: () => void;
  /** Wide screens: "Save as a new drink" sits along the bottom in place of the (placeholder) text box. */
  save?: { onSave: () => void; canSave: boolean };
  /** The name the guide gave the finished drink (shown in its last message). */
  name?: string;
};

/** The guide's questions: serif text on its own, with no bubble (JP, 2026-11-26). */
const question = "mb-2 text-balance px-1 font-serif text-[26px] leading-[30px]";
/** How far down the panel a new question lands, as a share of its height: the rest of the last one shows above. */
const NEXT_AT = 0.4;
/** How soft the top of the panel is, in px: at rest (room for the smoke), and at its deepest once scrolled. */
const TOP_FADE = { rest: 20, deepest: 180 };
/** An earlier question's choices that you didn't pick: dimmed, still there to change to. */
const unpicked = "opacity-40 hover:opacity-100 focus-visible:opacity-100";
const chip =
  "flex h-11 items-center gap-2 rounded-full border border-transparent bg-[#1A1612] py-1 pl-1 pr-3.5 text-[10px] uppercase tracking-[1px] text-white transition-colors hover:bg-[#26221E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]";

/**
 * Each mood's illustration (public/icons/moods), drawn like the app's other illustration icons: a simple
 * shape with a gradient, a soft glow, fine grain and a faint white top edge. To tweak one, edit its SVG file.
 */
function MoodIcon({ id }: { id: string }) {
  return (
    <Image
      src={`/icons/moods/${id}.svg`}
      alt=""
      width={40}
      height={40}
      unoptimized
      draggable={false}
      className="size-8 shrink-0 md:size-10"
    />
  );
}

/**
 * The smoke reveal's timing, in milliseconds: when the first letter starts (the first question waits for the
 * panel to slide up), the step
 * from one letter to the next, the pause between the two lines, and how long after the last letter starts
 * the choices come in. How long each letter takes to clear is in globals.css ("smoke-in").
 */
const SMOKE = {
  welcome: 350,
  start: 200,
  letter: 18,
  beforeChoices: 420,
  /** The line before a question: from its last letter starting until it is clear and has been held to read. */
  hold: 950,
  /** The step from one letter to the next as that line drifts off, and how soon after the question follows. */
  leave: 8,
  afterLeave: 280,
};

/**
 * A line that comes out of smoke, left to right (JP, 2026-11-26): each letter drifts in blurred and hazy and
 * clears into focus, many at once, so it reads as one soft front passing over the line. Letters are grouped
 * by word so lines still break between words. Screen readers get the whole line at once.
 */
function Smoke({ text, delay, animate, leaveAt, className = "" }: { text: string; delay: number; animate: boolean; leaveAt?: number; className?: string }) {
  const words = text.split(" ");
  // Where each word starts in the line, which sets when its letters begin.
  const starts = words.map((_, w) => words.slice(0, w).reduce((sum, word) => sum + word.length + 1, 0));
  return (
    <p className={`${question} ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, w) => (
          <Fragment key={w}>
            {w > 0 && " "}
            <span className="inline-block whitespace-nowrap">
              {[...word].map((letter, l) => {
                const at = starts[w] + l;
                return (
                  <span
                    key={l}
                    className={animate ? `smoke-letter ${leaveAt === undefined ? "" : "smoke-leaving"}` : undefined}
                    style={
                      animate
                        ? ({
                            // A little unevenness in timing and path, the same every time.
                            // When it comes in and, for a line that leaves, when it goes.
                            animationDelay: [delay + at * SMOKE.letter, ...(leaveAt === undefined ? [] : [leaveAt + at * SMOKE.leave])].map((ms) => `${ms + ((at * 37) % 11) * 8}ms`).join(", "),
                            "--smoke-x": `${-6 - ((at * 53) % 9)}px`,
                            "--smoke-y": `${Math.round(Math.sin(at * 1.7) * 8)}px`,
                          } as CSSProperties)
                        : undefined
                    }
                  >
                    {letter}
                  </span>
                );
              })}
            </span>
          </Fragment>
        ))}
      </span>
    </p>
  );
}

/**
 * How every question arrives (JP, 2026-11-26): it comes out of smoke, and only then do its choices (the
 * children) rise and fade in. Most have a line before them, in the same serif: the guide's reply to your
 * mood, or a remark on your base. It drifts off in smoke once read, and the question takes its place. OPEN: those lines are scripted.
 */
function Opening({ before, ask, start = SMOKE.start, playing, onDone, children }: { before?: string; ask: string; start?: number; playing: boolean; onDone: () => void; children: ReactNode }) {
  // Decided once, as it arrives: a guide you come back to is already clear.
  const [animate] = useState(playing);
  // The line before drifts off once it has been read, and the question forms where it was.
  const leaveAt = before ? start + before.length * SMOKE.letter + SMOKE.hold : start;
  const askAt = before ? leaveAt + before.length * SMOKE.leave + SMOKE.afterLeave : start;
  const doneAt = askAt + ask.length * SMOKE.letter + SMOKE.beforeChoices;
  useEffect(() => {
    if (!playing) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onDone, still ? 0 : doneAt);
    return () => window.clearTimeout(timer);
  }, [playing, doneAt, onDone]);
  return (
    <>
      <div className="relative">
        {/* It lies over the question's place, so nothing moves when it goes. With "reduce motion" it isn't shown. */}
        {before && playing && <Smoke text={before} delay={start} leaveAt={leaveAt} animate={animate} className="absolute inset-x-0 top-0 motion-reduce:hidden" />}
        <Smoke text={ask} delay={askAt} animate={animate} />
      </div>
      <div className={`transition-[opacity,visibility,translate] duration-700 ease-out motion-reduce:transition-none ${playing ? "invisible translate-y-3 opacity-0" : "translate-y-0 opacity-100"}`}>{children}</div>
    </>
  );
}

/** Capitalizes every word: "Crisp & bright" becomes "Crisp & Bright". */
const titleCase = (words: string) => words.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

/** Start over, drawn as the drink panel's reset button: the same icon (Figma 204:48) in the same 36px circle. */
function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Start over"
      title="Start over"
      className="grid size-9 shrink-0 place-items-center rounded-full bg-[#1A1612] transition-colors hover:bg-[#26221E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]"
    >
      <span aria-hidden className="relative block size-5">
        <span className="absolute inset-[10.83%_14.58%_14.58%_15.79%]">
          <span className="absolute inset-[-4.19%_-4.49%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/icons/reset.svg" className="block size-full max-w-none" />
          </span>
        </span>
      </span>
    </button>
  );
}

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
export function BuilderChat({ chat, onAnswer, onMood, onChange, onRestart, save, name }: Props) {
  const mood = MOODS.find((m) => m.id === chat.moodId) ?? null;
  const stepIndex = chat.answers.length;
  const step = mood && stepIndex < GUIDE_STEPS.length ? GUIDE_STEPS[stepIndex] : null;
  const finished = !!mood && !step;
  // The latest question that has finished arriving, named by mood and step. A guide you come back to is
  // already shown.
  const latestKey = `${chat.moodId}-${stepIndex}`;
  const [arrivedKey, setArrivedKey] = useState<string | null>(chat.moodId ? latestKey : null);
  const doneArriving = useCallback(() => setArrivedKey(latestKey), [latestKey]);
  // The first question arrives the same way: each time the guide opens at the start, and after Start over.
  // `round` makes a fresh copy of it, so the smoke plays again.
  const [welcomed, setWelcomed] = useState(!!chat.moodId);
  const [round, setRound] = useState(0);
  const doneWelcome = useCallback(() => setWelcomed(true), []);
  const restart = () => {
    setWelcomed(false);
    setRound((n) => n + 1);
    setArrivedKey(null);
    onRestart();
  };

  // Each new question: the last one slides up with your choice selected, and the new one fades in below
  // it (JP, 2026-11-26). It runs only when the guide moves on, not when you change an earlier ingredient.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  // Once scrolled, earlier questions fade away toward the top (JP, 2026-11-27). The fade deepens with the
  // scroll but always stops short of the latest question, so that one stays clear. Set straight on the element.
  const fadeTop = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const latest = el.querySelector<HTMLElement>("[data-latest]");
    const clear = latest ? latest.offsetTop - el.scrollTop - 4 : TOP_FADE.deepest;
    el.style.setProperty("--top-fade", `${Math.max(TOP_FADE.rest, Math.min(TOP_FADE.deepest, el.scrollTop, clear))}px`);
  }, []);
  useEffect(fadeTop);
  const moodId = chat.moodId;
  const placeLatest = useCallback(() => {
    const el = scrollRef.current;
    const spacer = spacerRef.current;
    if (!el || !spacer) return;
    spacer.style.height = "0px";
    const latest = el.querySelector<HTMLElement>("[data-latest]");
    if (!moodId || !latest) return;
    // The new question lands 40% of the way down, or higher if its choices need the room.
    const from = Math.max(12, Math.min(el.clientHeight * NEXT_AT, el.clientHeight - latest.offsetHeight - 12));
    const fits = latest.offsetTop + latest.offsetHeight + 12 - el.clientHeight;
    // But never past its own top: in a short panel (a phone's) with many choices, the question stays in view
    // and the rest of the choices are a scroll away.
    const top = Math.max(0, Math.min(latest.offsetTop - 12, Math.max(fits, latest.offsetTop - from)));
    // Room under the last question, so the panel can scroll that far.
    spacer.style.height = `${Math.max(0, top - (el.scrollHeight - el.clientHeight))}px`;
    el.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [moodId]);
  useEffect(placeLatest, [placeLatest, chat.answers.length]);
  // The panel can change height (on a phone it comes down to show the drink). Once it has settled, put the
  // newest question back in its place.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let height = el.clientHeight;
    let timer = 0;
    const observer = new ResizeObserver(() => {
      if (el.clientHeight === height) return;
      height = el.clientHeight;
      window.clearTimeout(timer);
      timer = window.setTimeout(placeLatest, 120);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [placeLatest]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* A scrolling box cuts off whatever spills past its edges, which would slice the smoke's haze in a hard line.
          So it reaches out to the panel's sides and top, with the same room inside, and the last 20px there fade
          away. The panel's frame has 17px above this (taken back by the negative margin), leaving 24px in all. */}
      <div ref={scrollRef} onScroll={fadeTop} className="relative -mx-5 -mt-[17px] flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto overflow-x-hidden overscroll-contain pb-3 pl-5 pr-6 pt-6 [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_20px,#000_calc(100%_-_20px),transparent),linear-gradient(to_bottom,transparent,#000_var(--top-fade,20px))]">
        <div key={round} className="flex shrink-0 flex-col gap-3">
          <Opening ask="What are you in the mood for?" start={SMOKE.welcome} playing={!welcomed} onDone={doneWelcome}>
            {/* Phones: one full-width mood per row. Wide screens: as many columns as fit. */}
            <div className="grid shrink-0 auto-rows-fr grid-cols-1 gap-2 md:grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
              {MOODS.map((m) => {
                const selected = chat.moodId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={selected}
                    // A different mood starts the guide over; the one already picked does nothing.
                    onClick={() => {
                      if (selected) return;
                      setArrivedKey(null);
                      onMood(m.id);
                    }}
                    className={`flex items-center gap-2 rounded-[18px] border py-2.5 pl-2.5 pr-2 text-left transition-[color,background-color,border-color,opacity] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
                      selected ? "border-white bg-[#3A352F]" : `border-transparent bg-[#1A1612] hover:bg-[#26221E] ${mood ? unpicked : ""}`
                    }`}
                  >
                    <MoodIcon id={m.id} />
                    <span>
                      <span className="block text-[10px] uppercase leading-[16px] tracking-[1px]">{m.label}</span>
                      <span className="block text-[11px] text-[#F7F7F7]/50">{m.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Opening>
        </div>

        {GUIDE_STEPS.slice(0, stepIndex + (step ? 1 : 0)).map((s, i) => {
          const answered = i < stepIndex;
          const picked = chat.answers[i];
          const choose = (ingredient: IngredientId | null) => {
            if (!answered) onAnswer(s.role, ingredient);
            else if (ingredient !== picked) onChange?.(i, s.role, ingredient);
          };
          const skipped = answered && picked === null;
          const choices = (
            <div className="flex flex-wrap gap-2">
              {optionsFor(s.role, mood).map((o) => {
                const selected = answered && picked === o.id;
                const look = selected ? "!border-white !bg-[#3A352F]" : answered ? unpicked : "";
                // While the question is open, a suggestion is outlined in the Build my own glow's colors (JP, 2026-11-26).
                const outlined = o.suggested && !answered;
                return (
                  <button key={o.id} type="button" aria-pressed={answered ? selected : undefined} onClick={() => choose(o.id)} className={`${chip} ${outlined ? "gradient-stroke" : ""} ${look}`}>
                    <Image src={`/icons/ingredients/${o.id}.png`} alt="" width={32} height={32} unoptimized draggable={false} className="size-8 shrink-0" />
                    <span className="flex flex-col items-start leading-[13px]">
                      {INGREDIENTS[o.id].name}
                      {o.suggested && <span className="mt-0.5 text-[8px] tracking-[1px] text-[#F7F7F7]/50">Suggested</span>}
                    </span>
                  </button>
                );
              })}
              {/* A row of its own, so Skip always starts a new line. */}
              {s.skippable && (
                <div className="flex w-full">
                  <button
                    type="button"
                    aria-pressed={answered ? skipped : undefined}
                    onClick={() => choose(null)}
                    className={`${TEXT_BUTTON} !h-11 rounded-full border px-4 transition-[color,background-color,border-color,opacity] hover:border-white/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
                      skipped ? "border-white bg-[#3A352F] text-white" : `border-white/20 text-[#F7F7F7]/70 ${answered ? unpicked : ""}`
                    }`}
                  >
                    Skip
                  </button>
                </div>
              )}
            </div>
          );
          return (
            // Keyed by the mood too, so starting over fades the first question in again.
            <div key={`${chat.moodId}-${s.role}`} data-latest={i === stepIndex ? "" : undefined} className="guide-in flex shrink-0 flex-col gap-3">
              <Opening
                // Only the guide's second and third questions have a line before them (JP, 2026-11-26): a reply to your
                // mood, then what your base brings.
                before={i === 0 ? (mood ? `${titleCase(mood.label)}! Great.` : undefined) : i === 1 && chat.answers[0] ? remark(chat.answers[0]) : undefined}
                ask={i === 0 && mood?.zeroProof ? ZERO_PROOF_BASE_ASK : s.ask}
                playing={i === stepIndex && arrivedKey !== latestKey}
                onDone={doneArriving}
              >
                {choices}
              </Opening>
            </div>
          );
        })}

        {finished && (
          <div data-latest className="guide-in shrink-0 px-1">
            <p className="font-serif text-[26px] leading-[30px]">Cheers!</p>
            <p className="mt-2 text-[13px] leading-[19px] text-[#F7F7F7]/70">
              {save && !name
                ? <>Give it a name above if you like. Drag any layer to tune the amounts. When it looks right, save as a new drink.</>
                : save
                ? <>I&rsquo;ve called it <span className="text-white">{name}</span>! Change the name above if you like. Drag any layer to tune the amounts. When it looks right, save as a new drink.</>
                : <>Drag a layer, or use the roles panel, to tune the amounts. When it looks right, serve it.</>}
            </p>
            <div className="mt-6">
              <CheersToast />
            </div>
          </div>
        )}

        <div ref={spacerRef} aria-hidden className="-mt-10 shrink-0" />
      </div>

      {save ? (
        <div className="flex shrink-0 gap-2 pt-3">
          <button
            type="button"
            disabled={!save.canSave}
            onClick={save.onSave}
            className={`${TEXT_BUTTON} min-w-0 flex-1 rounded-full bg-[#1A1612] text-white transition-colors hover:bg-[#26221E] disabled:bg-[#2C2A27] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Save as a new drink
          </button>
          {mood && (
            <ResetButton onClick={restart} />
          )}
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-2 border-t border-white/10 pt-3">
        <input
          disabled
          aria-label="Ask the guide anything (coming soon)"
          placeholder="Ask anything: coming soon"
          className="h-11 min-w-0 flex-1 rounded-full bg-[#1A1612] px-4 text-[13px] text-white placeholder:text-[#F7F7F7]/35"
        />
        {mood && (
          <ResetButton onClick={restart} />
        )}
      </div>
      )}
    </div>
  );
}
