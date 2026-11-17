/**
 * PARKED (JP, 2026-11-17; first parked 2026-11-16): the Sweet-to-Bitter slider. It lived in the drawer
 * header until JP brought the two separate ladders back (FlavorLadders.tsx). Not used anywhere right
 * now. See docs/parked.md. The math (tasteBalance, balanceWord, intensityWord) stays in src/lib/flavor.ts.
 *
 * Sweet and bitter as one continuum: a thin glowing track, bitter (purple) on the left and sweet
 * (gold) on the right, a marker where the drink leans, and a line of words above it
 * ("Balanced · Intense"). The marker gets wider and brighter the stronger the flavors are.
 * It was drawn across the whole panel (a 27px-tall row under a 13px line of words).
 */
import { balanceWord, intensityWord, tasteBalance, type Profile } from "@/lib/flavor";

/** The slider's colors from the bitter end (left) to the sweet end (right), through a soft neutral. */
const TRACK_STOPS: [number, string][] = [
  [0, "#7E51A9"],
  [0.25, "#A585C3"],
  [0.5, "#EFE9E1"],
  [0.75, "#EEBB57"],
  [1, "#F6A852"],
];

const hexToRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** The track's color at a spot along it (0 = bitter end, 1 = sweet end). */
function trackColor(t: number): string {
  const x = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < TRACK_STOPS.length - 2 && x > TRACK_STOPS[i + 1][0]) i++;
  const [a, ca] = TRACK_STOPS[i];
  const [b, cb] = TRACK_STOPS[i + 1];
  const k = (x - a) / (b - a);
  const [ra, ga, ba] = hexToRgb(ca);
  const [rb, gb, bb] = hexToRgb(cb);
  return `rgb(${Math.round(ra + (rb - ra) * k)}, ${Math.round(ga + (gb - ga) * k)}, ${Math.round(ba + (bb - ba) * k)})`;
}

const TRACK_GRADIENT = `linear-gradient(to right, ${TRACK_STOPS.map(([at, c]) => `${c} ${at * 100}%`).join(", ")})`;

/**
 * Sweet and bitter as one slider (JP, 2026-11-16): a thin glowing track, bitter (purple) on the
 * left and sweet (gold) on the right. The marker sits where the drink leans, and gets wider and
 * brighter the stronger the flavors are, so a Negroni (strongly both) and a Martini (barely
 * either), which are both near the middle, still look different. It slides as you edit.
 */
export function TasteSlider({ profile, showWords = true }: { profile: Profile; showWords?: boolean }) {
  const { position, intensity } = tasteBalance(profile);
  const at = (position + 1) / 2; // 0 to 1 along the track
  const words = [balanceWord(position), intensityWord(intensity)].filter(Boolean).join(" · ");
  const color = trackColor(at);
  const width = 8 + 14 * intensity; // px
  const glow = 0.45 + 0.5 * intensity;
  const slide = "transition-[left,width,opacity,background-color] duration-200 ease-out motion-reduce:transition-none";
  return (
    <div
      role="meter"
      aria-label="Taste balance, bitter to sweet"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={Math.round(position * 100) / 100}
      aria-valuetext={words}
      className="flex w-full flex-col items-center gap-1"
    >
      {showWords && <p className="whitespace-nowrap text-[11px] leading-[13px] text-[#F7F7F7]">{words}</p>}
      <div aria-hidden className="flex h-4 w-full items-center gap-3 text-xs leading-4 text-[#F7F7F7]/55">
        <span>Bitter</span>
        <span className="relative h-[3px] flex-1">
          {/* A blurred copy of the track behind it, as the ladders have. */}
          <span className="absolute inset-0 rounded-full opacity-60 blur-[4px]" style={{ background: TRACK_GRADIENT }} />
          <span className="absolute inset-0 rounded-full" style={{ background: TRACK_GRADIENT }} />
          {/* The marker's glow, then the marker. */}
          <span
            className={`absolute top-1/2 h-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[5px] ${slide}`}
            style={{ left: `${at * 100}%`, width: width + 6, background: color, opacity: glow }}
          />
          <span
            className={`absolute top-1/2 h-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full ${slide}`}
            style={{ left: `${at * 100}%`, width, background: color }}
          />
        </span>
        <span>Sweet</span>
      </div>
    </div>
  );
}
