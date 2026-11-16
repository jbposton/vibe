import { barFraction, SCALE, type Profile } from "@/lib/flavor";

/** Plain words for how full a ring is, for people who don't think in grams. */
const level = (f: number) => (f < 0.34 ? "Low" : f < 0.67 ? "Medium" : "High");

const SIZE = 44;
const STROKE = 1.8;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

type RingProps = {
  label: string;
  axis: keyof typeof SCALE;
  value: number;
  /** Text shown beside the label; defaults to Low / Medium / High. */
  valueText?: string;
};

/** A thin ring that fills clockwise from the top. */
function Ring({ label, axis, value, valueText }: RingProps) {
  const f = barFraction(axis, value);
  const text = valueText ?? level(f);
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={Math.round(f * 100) / 100}
      aria-valuetext={text}
      className="flex flex-col items-center gap-2.5"
    >
      {/* The value has a fixed width, so the label never changes size when the
          words change (Low / Medium / High, or 9% / 27%) and nothing around it moves. */}
      <p className="whitespace-nowrap text-[10px] leading-[13px] text-[#F7F7F7]/50">
        {label} · <span className="inline-block w-[38px] text-left text-white">{text}</span>
      </p>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} fill="none" aria-hidden>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="white" strokeOpacity="0.3" strokeWidth={STROKE} />
        {f > 0.005 && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke="white"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${f * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            className="transition-[stroke-dasharray] duration-150"
          />
        )}
      </svg>
    </div>
  );
}

type Props = {
  profile: Profile;
};

/**
 * The flavor profile as three rings: ABV, Sweet and Bitter (JP, 2026-11-16).
 * The three columns are equal and the labels keep one size, so the rings stay
 * put while the numbers change. The ABV ring is the real percentage (a full
 * circle is 100%); Sweet and Bitter are Low / Medium / High on a fixed scale.
 * OPEN: the brief (§3) wants calculated and hand-set values kept visibly
 * apart; for now they share one row.
 * OPEN: where this sits on the screen (brief §7).
 */
export function FlavorReadout({ profile }: Props) {
  return (
    <div aria-label="Flavor profile" role="group" className="grid grid-cols-3 items-start justify-items-center px-2">
      <Ring
        label="ABV"
        axis="strength"
        value={profile.strength}
        valueText={`${Math.round(profile.strength)}%`}
      />
      <Ring label="Sweet" axis="sweetness" value={profile.sweetness} />
      <Ring label="Bitter" axis="bitterness" value={profile.bitterness} />
    </div>
  );
}
