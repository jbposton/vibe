"use client";

import { useCallback, useMemo, useState } from "react";
import { newLine } from "@/data/builder";
import { DRINKS, type Drink, type RecipeLine } from "@/data/drinks";
import type { IngredientId } from "@/data/ingredients";
import type { Role } from "@/data/roles";
import { EMPTY_CHAT, type Chat } from "./BuilderChat";
import { DrinkScreen, type DrinkView } from "./DrinkScreen";
import { Loader } from "./Loader";

/** How long the dissolve out of the loader takes, in ms. */
const DISSOLVE_MS = 1000;

/** The drink you are building: it has no recipe of its own yet, only what you add. */
const CUSTOM: Omit<Drink, "lines"> = {
  id: "custom",
  name: "Your drink",
  family: "Unplaced",
  method: "shaken",
  glass: "coupe",
  tags: [],
};

/**
 * The v2 flow: the loader, then one screen: an empty glass with the classic cocktails across the top and
 * the guide and roles panels underneath. Pick a classic to fill the glass, or let the guide build one
 * question by question; either way the glass is editable. This component holds the glass, the servings
 * and the conversation.
 */
export function Flow() {
  const [loading, setLoading] = useState(true);
  const [loaderFading, setLoaderFading] = useState(false);

  const [classic, setClassic] = useState<Drink | null>(null); // the classic the glass started from, if any
  const [lines, setLines] = useState<RecipeLine[]>([]);
  const [servings, setServings] = useState(1);
  const [chat, setChat] = useState<Chat>(EMPTY_CHAT);
  const [view, setView] = useState<DrinkView>("card"); // the flat card, Concept C's 3D slabs, or Concept D's block

  const finishLoading = useCallback(() => {
    setLoading(false);
    setLoaderFading(true);
    window.setTimeout(() => setLoaderFading(false), DISSOLVE_MS);
  }, []);

  const pickClassic = (drink: Drink) => {
    setClassic(drink);
    setLines(drink.lines);
    setServings(1);
    setChat(EMPTY_CHAT);
  };
  const drink = useMemo<Drink>(() => ({ ...(classic ?? CUSTOM), lines }), [classic, lines]);

  // The guide's answer fills (or, with null, skips) one role.
  const answer = (role: Role, ingredient: IngredientId | null) => {
    if (ingredient) setLines((prev) => [...prev.filter((l) => l.role !== role), newLine(role, ingredient)]);
    setChat((c) => ({ ...c, answers: [...c.answers, ingredient] }));
  };
  // Starting the guide begins a new glass: it asks about every role in turn.
  const startGuide = (moodId: string) => {
    setClassic(null);
    setLines([]);
    setServings(1);
    setChat({ moodId, answers: [] });
  };
  const restart = () => {
    setClassic(null);
    setLines([]);
    setServings(1);
    setChat(EMPTY_CHAT);
  };

  return (
    <main className="fixed inset-0 mx-auto max-w-[1440px] overflow-hidden bg-[#1A1612] text-[#F7F7F7] select-none [-webkit-touch-callout:none]">
      {!loading && (
        <DrinkScreen
          mode="build"
          drink={drink}
          lines={lines}
          onLines={setLines}
          servings={servings}
          onServings={setServings}
          modified={false}
          onReset={() => {}}
          onBack={() => {}}
          closing={false}
          classics={{ drinks: DRINKS, activeId: classic?.id ?? null, onPick: pickClassic }}
          chat={chat}
          onMood={startGuide}
          onAnswer={answer}
          onRestart={restart}
          view={view}
          onView={setView}
        />
      )}

      {(loading || loaderFading) && (
        <div className={`absolute inset-0 z-50 ${loaderFading ? "flow-dissolve-out" : ""}`}>
          <Loader onDone={finishLoading} />
        </div>
      )}
    </main>
  );
}
