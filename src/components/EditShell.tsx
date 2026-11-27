"use client";

import type { ReactNode } from "react";
import type { RecipeLine } from "@/data/drinks";
import { canAdjust, type TraitEdit } from "@/lib/edits";
import { TEXT_BUTTON } from "@/components/buttonStyles";

export type EditTab = { id: string; label: string };

type Props = {
  tabs: EditTab[];
  tab: string;
  onTab: (id: string) => void;
  /** The guide fills the panel's height and scrolls itself; the other tabs let the whole panel scroll. */
  fill?: boolean;
  children: ReactNode;
  /** What sits along the bottom (Done, Save as a new drink). */
  footer: ReactNode;
};

/**
 * The wide-screen Edit Panel's frame (Figma 256:1456): a row of tabs along the top, each with a line
 * under it (white for the one you are on), the tab's content, and a footer. The tab row and the
 * footer stay put while the content scrolls.
 */
export function EditShell({ tabs, tab, onTab, fill = false, children, footer }: Props) {
  return (
    <div className={`flex flex-col ${fill ? "h-full" : "min-h-full"}`}>
      {tabs.length > 1 && (
      <div role="tablist" aria-label="Edit panel" className="sticky top-0 z-10 flex shrink-0 bg-[#21201E]">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => onTab(t.id)}
            className={`h-[52px] flex-1 border-b text-[10px] uppercase tracking-[1px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#F7F7F7] ${
              tab === t.id ? "border-white text-white" : "border-white/20 text-[#F7F7F7]/50 hover:text-white/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      )}
      <div role="tabpanel" className={`min-h-0 flex-1 px-5 ${tabs.length > 1 ? "pt-6" : "pt-[17px]"} ${fill ? "pb-4" : "pb-6"}`}>
        {children}
      </div>
      {footer}
    </div>
  );
}

const CHIP =
  `${TEXT_BUTTON} flex flex-1 items-center justify-center gap-[5px] rounded-full bg-[#1A1612] text-white transition-colors hover:bg-[#26221E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] disabled:pointer-events-none disabled:opacity-35`;

/** The short labels in the Structure tab (Figma 256:1672): a plus or minus icon, then the taste. */
const CHIP_LABEL: Partial<Record<TraitEdit["id"], string>> = {
  "more-sweet": "Sweet",
  "less-sweet": "Sweet",
  "more-bitter": "Bitter",
  "less-bitter": "Bitter",
  "more-strong": "Strong",
  "less-strong": "Strong",
};

/** The plus and minus, drawn like the − / + beside each ingredient (RolesPanel) rather than as text (JP, 2026-11-27). */
function SignIcon({ more }: { more: boolean }) {
  return (
    <svg width="7" height="7" viewBox="0 0 8 8" fill="none" aria-hidden className="shrink-0">
      <path d={more ? "M4 0.5V7.5M0.5 4H7.5" : "M0.5 4H7.5"} stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

/** The quick taste buttons at the top of the Structure tab: only the ones that fit the drink. */
export function TraitChips({ edits, lines, onAdjust }: { edits: TraitEdit[]; lines: RecipeLine[]; onAdjust: (key: number, direction: 1 | -1) => void }) {
  // Sweet and bitter only: strength has its own control on the base.
  const shown = edits.filter((e) => e.id !== "more-strong" && e.id !== "less-strong");
  if (shown.length === 0) return null;
  return (
    <div role="group" aria-label="Quick edits" className="mb-6 flex gap-[7px]">
      {shown.map((edit) => (
        <button
          key={edit.id}
          type="button"
          aria-label={edit.label}
          className={CHIP}
          disabled={!canAdjust(lines, edit.key, edit.direction)}
          onClick={() => onAdjust(edit.key, edit.direction)}
        >
          <SignIcon more={edit.direction === 1} />
          {CHIP_LABEL[edit.id]}
        </button>
      ))}
    </div>
  );
}

/**
 * The pill used for Done (and Save as a new drink) at the foot of the Edit Panel: the same solid dark color as
 * the panel's other buttons, and a
 * little lighter on hover like them (JP, 2026-11-25: no blur or see-through).
 */
export const FOOT_PILL = "bg-[#1A1612] hover:bg-[#26221E]";
