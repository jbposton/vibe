import { barFraction, SCALE, type Profile } from "@/lib/flavor";
import { LAYER_GRAIN_STYLE } from "./surfaceEffects";

/** Five steps per stat. */
const LEVELS = 5;

/** How many steps are lit for a value on a stat's scale (0 to 5). */
const filledSteps = (axis: keyof typeof SCALE, value: number) =>
  Math.min(LEVELS, Math.max(0, Math.round(barFraction(axis, value) * LEVELS)));

/** Plain words for the steps: 0 to 1 Low, 2 to 3 Medium, 4 to 5 High (for screen readers). */
const word = (filled: number) => (filled <= 1 ? "Low" : filled <= 3 ? "Medium" : "High");

/** Each stat's five steps, lowest first (Figma 180:39 "Glow ladder"): the lit steps shift hue as they climb. */
const STEPS = {
  sweetness: ["#EAC459", "#EEBB57", "#F2B155", "#F6A852", "#FA9F50"],
  bitterness: ["#7E51A9", "#8B62B2", "#9874BA", "#A585C3", "#B296CC"],
};

/** One step: 24 x 3, a soft glow behind it and a little grain on it when lit. */
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

/** A ladder of five steps, filled from the bottom, the name under it. */
function Stat({ label, axis, value }: { label: string; axis: keyof typeof STEPS; value: number }) {
  const filled = filledSteps(axis, value);
  const colors = STEPS[axis];
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={LEVELS}
      aria-valuenow={filled}
      aria-valuetext={word(filled)}
      className="flex flex-col items-center gap-[9px]"
    >
      <div aria-hidden className="flex flex-col gap-[3px]">
        {[...colors].reverse().map((color, row) => {
          const i = colors.length - 1 - row;
          return <Step key={i} color={color} lit={i < filled} />;
        })}
      </div>
      <span className="text-xs leading-4 text-[#F7F7F7]/55">{label}</span>
    </div>
  );
}

/**
 * Sweet and Bitter as two separate glow ladders (the 2026-11-16 look, brought back by JP on
 * 2026-11-17): five stacked steps each, lit from the bottom in a color ramp, the name under each.
 */
export function FlavorLadders({ profile }: { profile: Profile }) {
  return (
    <div role="group" aria-label="Sweet and bitter" className="flex items-end gap-5">
      <Stat label="Sweet" axis="sweetness" value={profile.sweetness} />
      <Stat label="Bitter" axis="bitterness" value={profile.bitterness} />
    </div>
  );
}
