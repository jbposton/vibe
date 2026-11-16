import { barFraction, SCALE, type Profile } from "@/lib/flavor";

/** Each stat is shown as a stack of this many bars, filled from the bottom (Figma 110:731). */
const LEVELS = 5;

/** How many bars are filled for a value on a stat's scale (0 to 5). */
const filledBars = (axis: keyof typeof SCALE, value: number) =>
  Math.min(LEVELS, Math.max(0, Math.round(barFraction(axis, value) * LEVELS)));

/** Plain words for the bars, for people who don't think in grams: 0 to 1 Low, 2 to 3 Medium, 4 to 5 High. */
const word = (filled: number) => (filled <= 1 ? "Low" : filled <= 3 ? "Medium" : "High");

type StatProps = {
  label: string;
  axis: keyof typeof SCALE;
  value: number;
  /** Text shown after the label; defaults to Low / Medium / High. */
  valueText?: string;
};

/** A label ("Sweet · High") over a stack of five short bars. */
function Stat({ label, axis, value, valueText }: StatProps) {
  const filled = filledBars(axis, value);
  const text = valueText ?? word(filled);
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={LEVELS}
      aria-valuenow={filled}
      aria-valuetext={text}
      className="flex flex-col items-center gap-4"
    >
      {/* The value sits in a slot of fixed width, so the label keeps one size
          (and nothing around it moves) when the words or numbers change. */}
      <p className="flex items-center gap-[3px] whitespace-nowrap text-[10px] leading-3">
        <span className="text-[#F7F7F7]/45">{label}</span>
        <span aria-hidden className="size-px rounded-full bg-[#7f7f7f]" />
        <span className="inline-block w-11 text-left text-[#F7F7F7]">{text}</span>
      </p>
      <div aria-hidden className="flex flex-col gap-[3px]">
        {Array.from({ length: LEVELS }, (_, i) => (
          // i = 0 is the top bar; the bottom `filled` bars are lit.
          <span
            key={i}
            className={`h-0.5 w-4 rounded-full transition-colors duration-150 ${i >= LEVELS - filled ? "bg-white" : "bg-white/20"}`}
          />
        ))}
      </div>
    </div>
  );
}

type Props = {
  profile: Profile;
};

/**
 * The flavor profile (Figma 110:731): Strength, Sweet and Bitter, each a label
 * over a stack of five bars filled from the bottom. The three columns are
 * equal, so the bars stay put while the labels change.
 * OPEN: the brief (§3) wants calculated and hand-set values kept visibly
 * apart; for now they share one row.
 * OPEN: where this sits on the screen (brief §7).
 */
export function FlavorReadout({ profile }: Props) {
  return (
    <div aria-label="Flavor profile" role="group" className="grid grid-cols-3 items-start justify-items-center px-2">
      <Stat
        label="Strength"
        axis="strength"
        value={profile.strength}
        valueText={`${Math.round(profile.strength)}% ABV`}
      />
      <Stat label="Sweet" axis="sweetness" value={profile.sweetness} />
      <Stat label="Bitter" axis="bitterness" value={profile.bitterness} />
    </div>
  );
}
