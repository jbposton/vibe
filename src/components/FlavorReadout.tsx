import { barFraction, SCALE, type Profile } from "@/lib/flavor";
import { LAYER_GRAIN_STYLE } from "./surfaceEffects";

/** The words (Low / Medium / High) still go by five steps, as the old five bars did. */
const LEVELS = 5;

/** How many bars are filled for a value on a stat's scale (0 to 5). */
const filledBars = (axis: keyof typeof SCALE, value: number) =>
  Math.min(LEVELS, Math.max(0, Math.round(barFraction(axis, value) * LEVELS)));

/** Plain words for the steps, for people who don't think in grams: 0 to 1 Low, 2 to 3 Medium, 4 to 5 High. */
const word = (filled: number) => (filled <= 1 ? "Low" : filled <= 3 ? "Medium" : "High");

/**
 * Each stat's five steps, lowest first (Figma 180:39 "Glow ladder"): the lit steps shift hue as
 * they climb. Steps 4 and 5 are not drawn in the design for every stat, so they continue its
 * pattern (the fifth reaches the old orb's edge color).
 */
const STEPS: Record<keyof typeof SCALE, string[]> = {
  strength: ["#F65E61", "#E85B6E", "#DB597B", "#CD5688", "#BF5395"],
  sweetness: ["#EAC459", "#EEBB57", "#F2B155", "#F6A852", "#FA9F50"],
  bitterness: ["#7E51A9", "#8B62B2", "#9874BA", "#A585C3", "#B296CC"],
};

/** One step of the ladder: 24 x 3, a soft glow behind it and a little grain on it when lit. */
function Step({ color, lit }: { color: string; lit: boolean }) {
  return (
    <span aria-hidden className="relative block h-[3px] w-6">
      <span
        className="absolute inset-0 rounded-full blur-[4px] transition-opacity duration-150 motion-reduce:transition-none"
        style={{ background: color, opacity: lit ? 0.6 : 0 }}
      />
      <span
        className="absolute inset-0 isolate overflow-hidden rounded-full transition-colors duration-150 motion-reduce:transition-none"
        style={{ background: lit ? color : "rgba(255,255,255,0.12)" }}
      >
        <span
          className="absolute inset-0 transition-opacity duration-150 motion-reduce:transition-none"
          style={{ ...LAYER_GRAIN_STYLE, opacity: lit ? 0.3 : 0 }}
        />
      </span>
    </span>
  );
}

/** Five steps, filled from the bottom, each lit step a little further along the color ramp. */
function Ladder({ colors, filled }: { colors: string[]; filled: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-[3px]">
      {/* The top step is listed first; step i counts from the bottom. */}
      {[...colors].reverse().map((color, row) => {
        const i = colors.length - 1 - row;
        return <Step key={i} color={color} lit={i < filled} />;
      })}
    </div>
  );
}

type StatProps = {
  label: string;
  axis: keyof typeof SCALE;
  value: number;
  /** Text shown after the label; defaults to Low / Medium / High. */
  valueText?: string;
};

/** A label ("Sweet · High") over a ladder of five glowing steps. */
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
      className="flex flex-col items-center gap-[14px]"
    >
      {/* The label is as wide as its words and centered over the ladder, so it lines up with
          it exactly. The ladders never move; only the words recenter when the value changes. */}
      <p className="flex items-center gap-[3px] whitespace-nowrap text-[11px] leading-[13px]">
        <span className="text-[#F7F7F7]/45">{label}</span>
        <span aria-hidden className="size-0.5 rounded-full bg-[#7f7f7f]" />
        <span className="text-[#F7F7F7]">{text}</span>
      </p>
      <Ladder colors={STEPS[axis]} filled={filled} />
    </div>
  );
}

type Props = {
  profile: Profile;
};

/**
 * The flavor profile (Figma 180:39, "Glow ladder"): Strength, Sweet and Bitter, each a label
 * over a ladder of five steps filled from the bottom, the lit ones glowing in a color ramp.
 * The three columns are equal, so the ladders stay put while the labels change.
 * OPEN: the brief (§3) wants calculated and hand-set values kept visibly
 * apart; for now they share one row.
 * OPEN: where this sits on the screen (brief §7).
 */
export function FlavorReadout({ profile }: Props) {
  return (
    <div aria-label="Flavor profile" role="group" className="grid grid-cols-3 items-start justify-items-center">
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
