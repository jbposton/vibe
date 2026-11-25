"use client";

import Image from "next/image";
import { useState } from "react";
import type { RecipeLine } from "@/data/drinks";
import { INGREDIENTS, type IngredientId } from "@/data/ingredients";
import { optionsFor, ROLE_BLURB } from "@/data/builder";
import { ROLES, type Role } from "@/data/roles";
import { DEFAULT_UNIT, formatAmount } from "@/lib/stack";

type Props = {
  lines: RecipeLine[];
  servings: number;
  /** One notch more or less of a line (by its place in `lines`). */
  onStep: (key: number, steps: number) => void;
  onRemove: (key: number) => void;
  /** Add an ingredient in a role. */
  onAdd: (role: Role, ingredient: IngredientId) => void;
  /** The role the guide is asking about right now (build mode): it is marked. */
  asking?: Role | null;
  /** Wide-screen edit panel (Figma 256:1456): a color dot for each ingredient instead of its picture. */
  swatch?: boolean;
};

const plus = (
  <svg width="9" height="9" viewBox="0 0 8 8" fill="none" aria-hidden>
    <path d="M4 0.5V7.5M0.5 4H7.5" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

const roundBtn =
  "grid size-8 shrink-0 place-items-center rounded-full border border-transparent bg-[#1A1612] text-white transition-colors hover:bg-[#26221E] disabled:opacity-30 disabled:hover:bg-[#1A1612] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]";

/**
 * The roles panel (v2 flow): the ingredients of the drink grouped by what each one does in it. The
 * roles are listed in stack order, base first (the order the guide asks about them). Each ingredient has − and + buttons (a non-drag way to
 * change its amount) and a remove button; an empty role offers a short list to fill it with.
 */
export function RolesPanel({ lines, servings, onStep, onRemove, onAdd, asking = null, swatch = false }: Props) {
  const [adding, setAdding] = useState<Role | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {/* Roles that have something in them come first, then the empty ones; each group keeps the stack order. */}
      {[...ROLES].sort((a, b) => Number(lines.some((l) => l.role === b)) - Number(lines.some((l) => l.role === a))).map((role) => {
        const mine = lines.map((l, key) => ({ l, key })).filter(({ l }) => l.role === role);
        const used = new Set(lines.map((l) => l.ingredient));
        const options = optionsFor(role, null).filter((o) => !used.has(o.id));
        const isAsking = asking === role;
        return (
          <section key={role} aria-label={role}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h3 className={`text-[10px] uppercase leading-[17px] tracking-[1px] ${isAsking ? "text-white" : "text-[#F7F7F7]/50"}`}>
                {role}
                {isAsking && <span className="ml-2 text-[#F7F7F7]/50">asking about this now</span>}
              </h3>
              <span className="text-[11px] text-[#F7F7F7]/35">{ROLE_BLURB[role]}</span>
            </div>

            {mine.map(({ l, key }) => {
              const ingredient = INGREDIENTS[l.ingredient];
              const garnish = l.amount.kind === "garnish";
              return (
                <div key={key} className="mb-2 flex items-center gap-2 py-1">
                  {swatch ? (
                    <span aria-hidden className="ml-px size-7 shrink-0 rounded-full" style={{ background: ingredient.color }} />
                  ) : (
                    <Image src={`/icons/ingredients/${ingredient.id}.png`} alt="" width={38} height={38} unoptimized draggable={false} className="size-[38px] shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-[1px]">{ingredient.name}</span>
                  {!garnish && (
                    <>
                      <button type="button" className={roundBtn} aria-label={`Less ${ingredient.name}`} onClick={() => onStep(key, -1)}>
                        <svg width="10" height="10" viewBox="0 0 8 8" fill="none" aria-hidden>
                          <path d="M0.5 4H7.5" stroke="currentColor" strokeLinecap="round" />
                        </svg>
                      </button>
                      <span className="w-14 text-center text-[13px] tabular-nums">{formatAmount(l.amount, DEFAULT_UNIT, servings)}</span>
                      <button type="button" className={roundBtn} aria-label={`More ${ingredient.name}`} onClick={() => onStep(key, 1)}>
                        <svg width="10" height="10" viewBox="0 0 8 8" fill="none" aria-hidden>
                          <path d="M4 0.5V7.5M0.5 4H7.5" stroke="currentColor" strokeLinecap="round" />
                        </svg>
                      </button>
                    </>
                  )}
                  {garnish && <span className="pr-1 text-xs text-[#F7F7F7]/50">Garnish</span>}
                  <button type="button" className={roundBtn} aria-label={`Remove ${ingredient.name}`} onClick={() => onRemove(key)}>
                    <svg width="10" height="10" viewBox="0 0 8 8" fill="none" aria-hidden>
                      <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {/* An empty role: a dashed button that opens a short list. (A role can hold more than one ingredient: the "+ Add" stays.) */}
            {options.length > 0 && (
              <>
                {mine.length === 0 ? (
                  <button
                    type="button"
                    aria-expanded={adding === role}
                    onClick={() => setAdding(adding === role ? null : role)}
                    className={`flex h-9 w-full items-center justify-center gap-2 rounded-full border border-dashed text-[10px] uppercase tracking-[1px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
                      isAsking ? "border-white/60 text-white" : "border-white/20 text-[#F7F7F7]/55 hover:border-white/40 hover:text-white"
                    }`}
                  >
                    {plus}
                    {`Add a ${role}`}
                  </button>
                ) : (
                  // The role already has something: just a plus, with a line running to each side of the panel. It is
                  // slim on purpose, to save height (24px, the smallest comfortable target).
                  <button
                    type="button"
                    aria-label={`Add another ${role}`}
                    aria-expanded={adding === role}
                    onClick={() => setAdding(adding === role ? null : role)}
                    className={`group -mt-1 flex h-6 w-full items-center gap-3 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
                      isAsking || adding === role ? "text-white" : "text-[#F7F7F7]/55 hover:text-white"
                    }`}
                  >
                    <span aria-hidden className="h-px flex-1 bg-white/20 transition-colors group-hover:bg-white/40" />
                    {plus}
                    <span aria-hidden className="h-px flex-1 bg-white/20 transition-colors group-hover:bg-white/40" />
                  </button>
                )}
                {adding === role && (
                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-2">
                    {options.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          onAdd(role, o.id);
                          setAdding(null);
                        }}
                        className="flex h-11 items-center gap-2 rounded-full bg-[#1A1612] py-1 pl-1 pr-3 text-[10px] uppercase tracking-[1px] transition-colors hover:bg-[#26221E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7]"
                      >
                        <Image src={`/icons/ingredients/${o.id}.png`} alt="" width={32} height={32} unoptimized draggable={false} className="size-8" />
                        {INGREDIENTS[o.id].name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
