"use client";

import { useRef, useState } from "react";

/** The drink name's type, shared by the field and the unseen copy that sizes it. */
const TYPE = "border-b font-serif text-[40px] leading-[52px] md:text-[length:var(--name-size,50px)] md:leading-[1.28]";

type Props = {
  value: string;
  onChange: (name: string) => void;
  onBlur?: () => void;
  placeholder?: string;
};

/**
 * A drink name you can change: Build my own's drink, and the drinks you saved. It looks like the title.
 * Once there is a name, a faded pencil beside it says it can be edited, and brightens when pointed at.
 */
export function NameField({ value, onChange, onBlur, placeholder }: Props) {
  const input = useRef<HTMLInputElement | null>(null);
  // Whether to show the pencil: only once the drink has a name. It stays while you are retyping it.
  const named = value.trim() !== "";
  return (
    <div className="group/name flex items-center gap-4">
      {/* The field is only as wide as its words, so the pencil sits beside them: an unseen copy of the text sets
          the width, and the field lies over it. */}
      <div className="grid min-w-0 grid-cols-[minmax(0,max-content)]">
        <span aria-hidden className={`invisible col-start-1 row-start-1 overflow-hidden whitespace-pre ${TYPE}`}>
          {value || placeholder || " "}
        </span>
        <input
          ref={input}
          size={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
          }}
          placeholder={placeholder}
          aria-label="Drink name"
          maxLength={28}
          className={`col-start-1 row-start-1 w-full min-w-0 text-ellipsis border-transparent bg-transparent outline-none transition-colors placeholder:text-[#F7F7F7] hover:border-white/20 focus:border-white/40 ${TYPE}`}
        />
      </div>
      <button
        type="button"
        aria-label="Edit the drink name"
        title="Edit name"
        onClick={() => {
          input.current?.focus();
          input.current?.select();
        }}
        className={`grid size-9 shrink-0 place-items-center rounded-full bg-[#2C2A27] text-white opacity-50 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F7] ${
          named ? "" : "invisible group-focus-within/name:visible"
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M10.8 2.4a1.7 1.7 0 0 1 2.4 2.4L5.4 12.6 2.2 13.8l1.2-3.2z" />
          <path d="M9.6 3.8l2.4 2.4" />
        </svg>
      </button>
    </div>
  );
}

/**
 * A saved drink's name. Each change is saved as you type; if you leave the field empty, the name it had
 * comes back.
 */
export function SavedName({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  // What's in the field while you type (null: not editing, show the saved name).
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <NameField
      value={draft ?? name}
      onChange={(next) => {
        setDraft(next);
        if (next.trim()) onRename(next.trim());
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
