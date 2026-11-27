"use client";

// Shared by the four guide concepts (/guide-concepts). The questions, moods and ingredient choices
// are the real guide's (data/builder.ts); only the layout and interaction differ between concepts.
import Image from "next/image";
import { useState } from "react";
import { GUIDE_STEPS, MOODS, newLine, optionsFor, type Mood } from "@/data/builder";
import { INGREDIENTS, type IngredientId } from "@/data/ingredients";
import type { RecipeLine } from "@/data/drinks";
import { volumeParts } from "@/lib/stack";

/** One slot per guide step: undefined = not asked yet, null = skipped. */
export type Pick = IngredientId | null | undefined;
const NONE: Pick[] = GUIDE_STEPS.map(() => undefined);

export function useGuide() {
  const [moodId, setMoodId] = useState<string | null>(null);
  const [picks, setPicks] = useState<Pick[]>(NONE);
  const mood = MOODS.find((m) => m.id === moodId) ?? null;
  const open = picks.findIndex((p) => p === undefined);
  const lines: RecipeLine[] = picks.flatMap((p, i) => (p ? [newLine(GUIDE_STEPS[i].role, p)] : []));
  return {
    mood,
    picks,
    lines,
    /** The first unanswered step, or -1 when every step is answered. */
    next: open,
    canSave: lines.filter((l) => volumeParts(l.amount) > 0).length >= 2,
    chooseMood(id: string) {
      const to = MOODS.find((m) => m.id === id) ?? null;
      setMoodId(id);
      // Keep earlier answers, except a base the new mood doesn't offer (alcohol or none).
      setPicks((prev) => (prev[0] && !optionsFor("base", to).some((o) => o.id === prev[0]) ? [undefined, ...prev.slice(1)] : prev));
    },
    pick(step: number, ingredient: IngredientId | null) {
      setPicks((prev) => prev.map((p, i) => (i === step ? ingredient : p)));
    },
    /** Step back: clears the latest answer, or the mood if nothing is answered. */
    back() {
      const last = picks.reduce<number>((at, p, i) => (p !== undefined ? i : at), -1);
      if (last < 0) setMoodId(null);
      else setPicks((prev) => prev.map((p, i) => (i === last ? undefined : p)));
    },
    restart() {
      setMoodId(null);
      setPicks(NONE);
    },
  };
}
export type Guide = ReturnType<typeof useGuide>;

export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]";

/** Dark or light text, whichever reads better on a hex color. */
export function inkOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.2 ? "#1A1612" : "#F7F7F7";
}

/** The colors a mood tends toward: its first suggestion for each role, base first. */
export function moodColors(mood: Mood): string[] {
  return GUIDE_STEPS.flatMap((s) => {
    const first = mood.suggest[s.role]?.[0];
    return first ? [INGREDIENTS[first].color] : [];
  });
}

export function Icon({ id, size = 32 }: { id: IngredientId; size?: number }) {
  return <Image src={`/icons/ingredients/${id}.png`} alt="" width={size} height={size} unoptimized draggable={false} className="shrink-0" style={{ width: size, height: size }} />;
}

/** The bottom bar every concept shares. Saving isn't wired up: these are concepts. */
export function Footer({ guide }: { guide: Guide }) {
  return (
    <div className="flex shrink-0 gap-2 px-4 pb-4 pt-3">
      <button type="button" disabled={!guide.canSave} className={`h-10 flex-1 rounded-full bg-[#34312D] text-[13px] transition-colors hover:bg-[#3E3A36] disabled:opacity-35 ${focusRing}`}>
        Save as a new drink
      </button>
      {guide.mood && (
        <button type="button" onClick={guide.restart} className={`h-10 rounded-full border border-white/20 px-4 text-[13px] text-white/70 hover:border-white/50 hover:text-white ${focusRing}`}>
          Start over
        </button>
      )}
    </div>
  );
}

/** A small flat-block drink, so each concept shows its answers adding layers. */
export function MiniGlass({ lines }: { lines: RecipeLine[] }) {
  return (
    <div className="flex h-full w-full flex-col-reverse overflow-hidden rounded-[28px] border border-white/10 bg-[#211D19]">
      {lines.length === 0 && <p className="m-auto px-6 text-center text-[13px] text-white/45">Your glass is empty.</p>}
      {lines.map((l) => {
        const i = INGREDIENTS[l.ingredient];
        const parts = volumeParts(l.amount);
        return (
          <div key={l.role} className="flex min-h-10 items-start px-4 py-3 text-[12px]" style={{ flex: `${parts} 1 ${parts ? 0 : 40}px`, background: i.color, color: inkOn(i.color) }}>
            {i.name}
          </div>
        );
      })}
    </div>
  );
}
