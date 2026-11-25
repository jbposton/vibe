"use client";

import { useEffect, useMemo, useState } from "react";
import { INGREDIENTS } from "@/data/ingredients";
import type { Drink, RecipeLine } from "@/data/drinks";
import { newLine } from "@/data/builder";
import type { IngredientId } from "@/data/ingredients";
import type { Role } from "@/data/roles";
import { abvLabel, flavorProfile, tasteSummary } from "@/lib/flavor";
import { DEFAULT_UNIT, formatTotal, stepAmount, totalParts, volumeParts } from "@/lib/stack";
import { swapIngredient } from "@/lib/swap";
import { DrinkCard } from "../DrinkCard";
import { ExplodedDrink } from "../ExplodedDrink";
import { FlavorLadders } from "../FlavorLadders";
import { IngredientDrawer } from "../IngredientDrawer";
import { PrepTags } from "../PrepIcons";
import { ServingsRow } from "../ServingsRow";
import { BuilderChat, type Chat } from "./BuilderChat";
import { RolesPanel } from "./RolesPanel";
import { useBox, useIsDesktop } from "./useBox";

/** The drink card's shape (width / height), as on the mixer. */
const CARD_ASPECT = 0.9;

export type DrinkView = "card" | "glass" | "block";

type Props = {
  /** "drink": a premade drink (ingredients panel + roles panel). "build": build my own (guide + roles panel). */
  mode: "drink" | "build";
  drink: Drink;
  lines: RecipeLine[];
  onLines: (update: (prev: RecipeLine[]) => RecipeLine[]) => void;
  servings: number;
  onServings: (n: number) => void;
  /** True once the premade drink has been changed from its classic recipe. */
  modified: boolean;
  onReset: () => void;
  onBack: () => void;
  /** Set when the screen is on its way out (plays the reverse of the zoom). */
  closing: boolean;
  // Build my own only:
  /** The classic cocktails across the top: tap one to fill the glass with it. */
  classics?: { drinks: Drink[]; activeId: string | null; onPick: (drink: Drink) => void };
  chat: Chat;
  onMood: (moodId: string) => void;
  onAnswer: (role: Role, ingredient: IngredientId | null) => void;
  onRestart: () => void;
  /** How the glass is drawn: the flat card, Concept C's spaced 3D slabs, or Concept D's solid block. */
  view: DrinkView;
  onView: (view: DrinkView) => void;
};

const panelClass = "min-h-0 overflow-y-auto overscroll-contain [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin]";

/**
 * Steps 3 and 4 of the flow: zoomed in on one drink, flat, with two panels around it. For a premade drink
 * the panels are every ingredient (the drink's own outlined) and the drink's ingredients grouped by role.
 * For build-my-own they are the guide (a chat) and the roles panel, and the glass starts empty. On wide
 * screens the panels sit either side of the drink; on a phone they share a sheet under it, with tabs.
 */
export function DrinkScreen({ mode, drink, lines, onLines, servings, onServings, modified, onReset, onBack, closing, classics, chat, onMood, onAnswer, onRestart, view, onView }: Props) {
  const isDesktop = useIsDesktop();
  const build = mode === "build";
  const { box, ref: areaRef } = useBox();
  const cardW = Math.max(0, Math.min(box.w, box.h * CARD_ASPECT));
  const cardH = cardW / CARD_ASPECT;

  const profile = useMemo(() => flavorProfile(lines), [lines]);
  const liquids = lines.filter((l) => volumeParts(l.amount) > 0).length;
  const canServe = !build || liquids >= 2;

  // Which panel shows on a phone (0 = ingredients or guide, 1 = roles).
  const [tab, setTab] = useState(0);
  // Serve is a placeholder for now.
  const [note, setNote] = useState(false);
  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(false), 2600);
    return () => window.clearTimeout(timer);
  }, [note]);

  const roleToAsk = build ? (chat.moodId ? (["base", "modifier", "sweet", "sour", "bitter", "lengthener", "aromatic"] as const)[chat.answers.length] ?? null : null) : null;

  const rolesPanel = (
    <RolesPanel
      lines={lines}
      servings={servings}
      asking={roleToAsk}
      onStep={(key, steps) => onLines((prev) => prev.map((l, i) => (i === key ? { ...l, amount: stepAmount(l.amount, steps) } : l)))}
      onRemove={(key) => onLines((prev) => prev.filter((_, i) => i !== key))}
      onAdd={(role, ingredient) => onLines((prev) => [...prev, newLine(role, ingredient)])}
    />
  );
  const leftPanel = build ? (
    <BuilderChat chat={chat} onMood={onMood} onAnswer={onAnswer} onRestart={onRestart} />
  ) : (
    <IngredientDrawer lines={lines} onPick={(ingredient) => onLines((prev) => swapIngredient(prev, ingredient))} />
  );
  const leftTitle = build ? "Guide" : "Ingredients";

  return (
    <div className={`absolute inset-0 flex flex-col ${closing ? "flow-screen-out" : ""}`}>
      {classics && (
        <nav aria-label="Classic cocktails" className="flow-fade-slow shrink-0 px-4 pt-4 md:px-8 md:pt-6">
          <p className="mb-2 text-[10px] uppercase tracking-[1px] text-[#F7F7F7]/50">Start from a classic, or let the guide build one</p>
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:-mx-8 md:px-8 [&::-webkit-scrollbar]:hidden">
            {classics.drinks.map((d) => {
              const active = classics.activeId === d.id;
              return (
                <li key={d.id} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => classics.onPick(d)}
                    className={`flex h-11 items-center gap-2.5 rounded-full border py-1 pl-3 pr-4 text-[10px] uppercase tracking-[1px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
                      active ? "border-white bg-white/10 text-white" : "border-white/15 text-[#F7F7F7]/75 hover:border-white/40 hover:text-white"
                    }`}
                  >
                    <span aria-hidden className="flex -space-x-1">
                      {d.lines
                        .filter((l) => l.amount.kind !== "garnish")
                        .slice(0, 4)
                        .map((l, i) => (
                          <span key={i} className="size-3 rounded-full ring-1 ring-[#1A1612]" style={{ background: INGREDIENTS[l.ingredient].color }} />
                        ))}
                    </span>
                    {d.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    <div
      className={`relative min-h-0 flex-1 flex flex-col gap-3 p-4 md:grid md:grid-cols-[minmax(300px,1fr)_minmax(0,1.25fr)_minmax(300px,1fr)] md:grid-rows-[minmax(0,1fr)] md:gap-6 md:p-8`}
    >
      {/* Wide screens: the left panel. */}
      {isDesktop && (
        <aside aria-label={leftTitle} className="flow-panel-left order-1 flex min-h-0 flex-col rounded-[30px] bg-[#21201E] p-5">
          <h2 className="mb-4 shrink-0 text-[10px] uppercase tracking-[1px] text-[#F7F7F7]/50">{leftTitle}</h2>
          <div className={`${panelClass} flex-1`}>{leftPanel}</div>
        </aside>
      )}

      {/* The drink. */}
      <div className="order-2 flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flow-fade-slow flex shrink-0 items-center justify-between">
          {build ? (
            <div role="group" aria-label="Drink view" className="flex h-8 items-center rounded-full bg-white/[0.06] p-0.5">
              {([["card", "Card"], ["glass", "Glass"], ["block", "Block"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={view === id}
                  onClick={() => onView(id)}
                  className={`h-7 rounded-full px-3 text-[10px] uppercase tracking-[1px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
                    view === id ? "bg-[#F7F7F7] text-[#1A1612]" : "text-[#F7F7F7]/60 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : <button
            type="button"
            onClick={onBack}
            className="-ml-2 flex h-11 items-center gap-1.5 rounded-full px-3 text-[10px] uppercase tracking-[1px] text-[#F7F7F7]/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All drinks
          </button>}
          <button
            type="button"
            disabled={!canServe}
            onClick={() => setNote(true)}
            className="h-11 rounded-full bg-[#F7F7F7] px-7 text-[10px] font-medium uppercase tracking-[1px] text-[#1A1612] transition-opacity hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] disabled:cursor-not-allowed disabled:opacity-30"
          >
            Serve
          </button>
        </div>

        {/* Name, taste, how it's made. */}
        <div className="flow-fade-slow mt-1 flex shrink-0 items-end justify-between gap-2 md:mt-3">
          <div className="min-w-0">
            <h1 className="truncate font-serif text-[30px] leading-[38px] md:text-[44px] md:leading-[52px]">{drink.name}</h1>
            <p className="mt-0.5 flex items-center gap-[5px] text-xs opacity-55 md:text-sm">
              {lines.length === 0 ? (
                <span>Pick a classic above, or answer the guide</span>
              ) : (
                <>
                  <span>{tasteSummary(profile)}</span>
                  <span aria-hidden className="size-0.5 shrink-0 rounded-full bg-[#7f7f7f]" />
                  <span>{abvLabel(profile)}</span>
                </>
              )}
            </p>
          </div>
          <div className="hidden shrink-0 md:block">{lines.length > 0 && <FlavorLadders profile={profile} />}</div>
          {drink.id !== "custom" && (
            <div className="hidden shrink-0 sm:block">
              <PrepTags method={drink.method} glass={drink.glass} />
            </div>
          )}
        </div>

        {/* The flat card. It takes over from the card you chose. */}
        <div ref={areaRef} className="relative my-3 min-h-0 flex-1">
          {box.h > 0 && (
            <div
              className="flow-card-in absolute left-1/2 top-1/2"
              // The 3D views use the whole area (the slabs are tall); the card keeps its own shape.
              style={{ width: view !== "card" ? box.w : cardW, height: view !== "card" ? box.h : cardH, transform: "translate(-50%,-50%)" }}
            >
              {lines.length === 0 && (
                <div className="absolute inset-0 grid place-items-center rounded-[38px] border border-dashed border-white/20 bg-white/[0.03] p-6 text-center">
                  <p className="text-sm text-[#F7F7F7]/50">
                    Your glass is empty.
                    <span className="mt-1 block text-xs text-[#F7F7F7]/35">Pick a classic, or answer the guide: each one adds a layer.</span>
                  </p>
                </div>
              )}
              {(() => {
                const Card = view === "card" ? DrinkCard : ExplodedDrink;
                return (
                  <Card
                    drink={drink}
                    drinkIndex={0}
                    lines={lines}
                    onEdit={(_, update) => onLines(update)}
                    interactive
                    inView
                    onHorizontal={() => {}}
                    servings={servings}
                    modified={!build && modified}
                    onReset={onReset}
                    {...(view === "card" ? {} : { stackStyle: view })}
                  />
                );
              })()}
            </div>
          )}
        </div>

        <div className="flow-fade-slow shrink-0 px-1">
          <ServingsRow
            servings={servings}
            total={formatTotal(totalParts(lines), DEFAULT_UNIT, servings)}
            perServing={formatTotal(totalParts(lines), DEFAULT_UNIT, 1)}
            onChange={onServings}
          />
        </div>
      </div>

      {/* Wide screens: the right panel (roles). */}
      {isDesktop && (
        <aside aria-label="Roles" className="flow-panel-right order-3 flex min-h-0 flex-col rounded-[30px] bg-[#21201E] p-5">
          <h2 className="mb-4 shrink-0 text-[10px] uppercase tracking-[1px] text-[#F7F7F7]/50">Roles</h2>
          <div className={`${panelClass} flex-1`}>{rolesPanel}</div>
        </aside>
      )}

      {/* Phones: both panels share a sheet under the drink, with tabs. */}
      {!isDesktop && (
        <section aria-label="Panels" className="flow-sheet-in order-3 -mx-4 -mb-4 flex h-[40dvh] shrink-0 flex-col rounded-t-[30px] bg-[#21201E] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div role="tablist" aria-label="Panels" className="mb-3 flex shrink-0 gap-6">
            {[leftTitle, "Roles"].map((label, i) => (
              <button
                key={label}
                role="tab"
                type="button"
                aria-selected={tab === i}
                onClick={() => setTab(i)}
                className={`h-10 border-b text-[10px] uppercase tracking-[1px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
                  tab === i ? "border-white text-white" : "border-transparent text-[#F7F7F7]/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={`${panelClass} flex-1`} role="tabpanel">
            {tab === 0 ? leftPanel : rolesPanel}
          </div>
        </section>
      )}

      {/* Serve is a placeholder: it will be designed next. */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-full bg-[#21201E] px-5 py-2.5 text-xs text-[#F7F7F7]/80 shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-opacity duration-200 ${note ? "opacity-100" : "opacity-0"}`}
      >
        {note ? "Serving is coming soon" : ""}
      </div>
    </div>
    </div>
  );
}
