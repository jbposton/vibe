import { barFraction, SCALE, type Profile } from "@/lib/flavor";

/** Plain words for how full a bar is, for people who don't think in grams. */
const level = (f: number) => (f < 0.34 ? "low" : f < 0.67 ? "medium" : "high");

type BarProps = {
  label: string;
  axis: keyof typeof SCALE;
  value: number;
  /** The same value for the recipe as it was before any edits. */
  baseline: number;
  /** Text shown at the right; defaults to low / medium / high. */
  valueText?: string;
};

function Bar({ label, axis, value, baseline, valueText }: BarProps) {
  const f = barFraction(axis, value);
  const base = barFraction(axis, baseline);
  const text = valueText ?? level(f);
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-[11px] leading-4">
      <span className="text-[#F7F7F7]/70">{label}</span>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={Math.round(f * 100) / 100}
        aria-valuetext={text}
        className="relative h-1 rounded-full bg-[#F7F7F7]/15"
      >
        <div className="h-full rounded-full bg-[#F7F7F7]/85 transition-[width] duration-150" style={{ width: `${f * 100}%` }} />
        {/* Where this bar started, so you can see what your edit moved. */}
        <div
          aria-hidden
          className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F7F7F7]/55"
          style={{ left: `${base * 100}%` }}
        />
      </div>
      <span className="text-right tabular-nums text-[#F7F7F7]/55">{text}</span>
    </div>
  );
}

type Props = {
  profile: Profile;
  /** The profile of the unedited recipe. */
  baseline: Profile;
};

/**
 * The flavor profile as a readout: three bars and a few note tags.
 * OPEN: the brief (§3) wants calculated and hand-set values kept visibly
 * apart; for now they share one list (JP asked to simplify).
 * OPEN: where this sits on the screen (brief §7).
 */
export function FlavorReadout({ profile, baseline }: Props) {
  return (
    <div aria-label="Flavor profile" role="group" className="flex flex-col gap-1.5">
      <Bar
        label="Strength"
        axis="strength"
        value={profile.strength}
        baseline={baseline.strength}
        valueText={`${Math.round(profile.strength)}% ABV`}
      />
      <Bar label="Sweetness" axis="sweetness" value={profile.sweetness} baseline={baseline.sweetness} />
      <Bar label="Bitterness" axis="bitterness" value={profile.bitterness} baseline={baseline.bitterness} />
      {profile.notes.length > 0 && (
        <ul aria-label="Flavor notes" className="mt-1 flex flex-wrap gap-1.5">
          {profile.notes.map((note) => (
            <li key={note} className="rounded-full border border-[#F7F7F7]/25 px-2.5 py-0.5 text-[11px] text-[#F7F7F7]/70">
              {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
