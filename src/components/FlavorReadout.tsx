import { barFraction, SCALE, type Profile } from "@/lib/flavor";
import { LAYER_GRAIN_STYLE } from "./surfaceEffects";

/** The words (Low / Medium / High) still go by five steps, as the old five bars did. */
const LEVELS = 5;

/** How many bars are filled for a value on a stat's scale (0 to 5). */
const filledBars = (axis: keyof typeof SCALE, value: number) =>
  Math.min(LEVELS, Math.max(0, Math.round(barFraction(axis, value) * LEVELS)));

/** Plain words for the steps, for people who don't think in grams: 0 to 1 Low, 2 to 3 Medium, 4 to 5 High. */
const word = (filled: number) => (filled <= 1 ? "Low" : filled <= 3 ? "Medium" : "High");

/** Each stat's orb colors, from the lightest center out to the edge (Figma 171:38). */
const ORB: Record<keyof typeof SCALE, [string, string, string]> = {
  strength: ["#FAA6A8", "#F65E61", "#C05394"],
  sweetness: ["#F3DFA4", "#EAC459", "#FA9F50"],
  bitterness: ["#9FB8CD", "#507EA4", "#2A6290"],
};

/** The glowing ball: a radial color fade with a white sheen over it. */
const orbBackground = ([c1, c2, c3]: [string, string, string]) =>
  `radial-gradient(circle closest-side, rgba(255,255,255,0.55), rgba(255,255,255,0)), radial-gradient(circle closest-side, ${c1} 0%, ${c2} 50%, ${c3}b3 80%, ${c3}00 100%)`;

/** The white line follows a circle this far (px) in from the orb's edge, starting at 9 o'clock. */
const RING_RADIUS = 18;

/**
 * A glowing orb with a white line that grows clockwise around it, from 9 o'clock over the top, as
 * the value goes from 0 to a full circle (Figma 171:38 shows the line as a short arc; here its
 * length is the measure). `fraction` is 0 to 1.
 */
function Orb({ colors, fraction }: { colors: [string, string, string]; fraction: number }) {
  const length = Math.min(1, Math.max(0, fraction)) * 100;
  const ring = (width: number, extra: string, opacity: number) => (
    <svg aria-hidden viewBox="0 0 44 44" className={`absolute inset-0 size-11 ${extra}`} style={{ opacity }}>
      <circle
        cx="22"
        cy="22"
        r={RING_RADIUS}
        fill="none"
        stroke="#fff"
        strokeWidth={width}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${length} ${101 - length}`}
        transform="rotate(180 22 22)"
        className="transition-[stroke-dasharray] duration-300 ease-out motion-reduce:transition-none"
        style={{ opacity: length < 0.5 ? 0 : 1 }}
      />
    </svg>
  );
  return (
    <div aria-hidden className="relative size-11">
      {/* The soft glow behind the ball (61.6px, blurred, 75%). */}
      <span
        className="absolute -inset-[8.8px] rounded-full opacity-75 blur-[12px]"
        style={{ background: orbBackground(colors) }}
      />
      {/* The ball, with a little grain on it. */}
      <span className="absolute inset-0 isolate overflow-hidden rounded-full" style={{ background: orbBackground(colors) }}>
        <span className="absolute inset-0" style={{ ...LAYER_GRAIN_STYLE, opacity: 0.35 }} />
      </span>
      {/* The white line (a blurred copy under it makes it glow). */}
      {ring(2.4, "blur-[1.6px]", 0.8)}
      {ring(1, "", 0.8)}
      {/* The sparkle at the top right. */}
      <svg
        viewBox="0 0 7 7"
        className="absolute left-[33px] top-[2.7px] size-[7px]"
        style={{ filter: "drop-shadow(0 0 4.2px rgba(255,255,255,0.9))" }}
      >
        <path d="M3.5 0L4.3 2.7L7 3.5L4.3 4.3L3.5 7L2.7 4.3L0 3.5L2.7 2.7Z" fill="#fff" />
      </svg>
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

/** A label ("Sweet · High") over a glowing orb whose white line grows around it. */
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
      className="flex flex-col items-center gap-[11px]"
    >
      {/* The label is as wide as its words and centered over the orb, so it lines up with
          it exactly. The orbs never move; only the words recenter when the value changes. */}
      <p className="flex items-center gap-[3px] whitespace-nowrap text-[11px] leading-[13px]">
        <span className="text-[#F7F7F7]/45">{label}</span>
        <span aria-hidden className="size-0.5 rounded-full bg-[#7f7f7f]" />
        <span className="text-[#F7F7F7]">{text}</span>
      </p>
      <Orb colors={ORB[axis]} fraction={barFraction(axis, value)} />
    </div>
  );
}

type Props = {
  profile: Profile;
};

/**
 * The flavor profile (Figma 171:38): Strength, Sweet and Bitter, each a label
 * over a glowing orb with a white line that grows around it as the value rises.
 * The three columns are equal, so the orbs stay put while the labels change.
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
