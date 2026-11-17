/**
 * The prep icons (Figma "Prep icons (method + glass)", 135:34): thin line icons
 * for how a drink is made and what it's served in. Each is a 24 x 24 outline
 * (0.9 stroke); the line color comes from the text color around it.
 */
import type { Method } from "@/data/drinks";

export type GlassId =
  | "rocks"
  | "rocks-ice"
  | "highball"
  | "highball-ice"
  | "coupe"
  | "martini"
  | "wine"
  | "wine-ice"
  | "mug-ice"
  | "mug-hot";

/** The drawing of each icon (an SVG path in a 24 x 24 box). */
const PATHS: Record<Method | GlassId, string> = {
  shaken:
    "M9 7.5L10 4.5H14L15 7.5M4.6 10.5C3.8 11.8333 3.8 13.1667 4.6 14.5M19.4 10.5C20.2 11.8333 20.2 13.1667 19.4 14.5M8 7.5H16L14.7 20.5H9.3L8 7.5Z",
  stirred:
    "M17.5 3L12.6 16M6.5 8.5H17.5L16.3 20.5H7.7L6.5 8.5ZM11.7 17C11.6706 17.1622 11.6818 17.3292 11.7326 17.4861C11.7834 17.6429 11.8722 17.7848 11.9911 17.8991C12.1099 18.0133 12.2552 18.0964 12.414 18.1409C12.5727 18.1854 12.74 18.19 12.9009 18.1543C13.0619 18.1185 13.2115 18.0435 13.3365 17.9359C13.4614 17.8284 13.5578 17.6916 13.6171 17.5377C13.6764 17.3839 13.6967 17.2178 13.6763 17.0542C13.6559 16.8905 13.5953 16.7345 13.5 16.6C13.5294 16.4378 13.5181 16.2708 13.4674 16.1139C13.4166 15.9571 13.3278 15.8152 13.2089 15.7009C13.0901 15.5867 12.9448 15.5036 12.786 15.4591C12.6273 15.4146 12.46 15.41 12.2991 15.4457C12.1381 15.4815 11.9885 15.5565 11.8635 15.6641C11.7386 15.7716 11.6422 15.9084 11.5829 16.0623C11.5236 16.2161 11.5033 16.3822 11.5237 16.5458C11.5441 16.7095 11.6047 16.8655 11.7 17Z",
  built: "M12 2.7998V7.1998M10 5.2998L12 7.39981L14 5.2998M7 9.9998H17L16 20.4998H8L7 9.9998Z",
  rocks: "M7.3 17.6H16.7M6.3 10.4H17.7M6 7H18L16.8 20H7.2L6 7Z",
  "rocks-ice": "M7.3 17.6H16.7M6 7H18L16.8 20H7.2L6 7ZM10 9.52L15.08 10.6L14 15.68L8.92 14.6L10 9.52Z",
  highball: "M8.2 7.5H15.8M8 3.5H16L15.5 21H8.5L8 3.5Z",
  "highball-ice":
    "M8 3.5H16L15.5 21H8.5L8 3.5ZM8.79 7.04L11.96 6.59L12.41 9.76L9.24 10.21L8.79 7.04ZM12 10.35L15.15 10.9L14.6 14.05L11.45 13.5L12 10.35ZM9.07 14.75L12.25 14.47L12.53 17.65L9.35 17.93L9.07 14.75Z",
  coupe: "M12 13.5C8 13.1667 5.83333 11 5.5 7H18.5C18.1667 11 16 13.1667 12 13.5ZM12 13.5V20M8.5 20.5H15.5M6 9.2H18",
  martini: "M12 13.5L19.5 5.5H4.5L12 13.5ZM12 13.5V20M8.5 20.5H15.5M6.9 8H17.1",
  wine: "M12 12.5C15.3333 11.8333 16.8333 9.16667 16.5 4.5H7.5C7.16667 9.16667 8.66667 11.8333 12 12.5ZM12 12.5V20M8.5 20.5H15.5M7.6 7.6H16.4",
  "wine-ice":
    "M12 12.5C15.3333 11.8333 16.8333 9.16667 16.5 4.5H7.5C7.16667 9.16667 8.66667 11.8333 12 12.5ZM12 12.5V20M8.5 20.5H15.5M8.92 6.82L11.78 6.32L12.28 9.18L9.42 9.68L8.92 6.82ZM12.48 6.88L15.32 7.48L14.72 10.32L11.88 9.72L12.48 6.88Z",
  "mug-ice":
    "M16 9H18C19.3333 9 20 9.83333 20 11.5V13.5C20 15.1667 19.3333 16 18 16H16M6 6.5H16V19C16 20 15.5 20.5 14.5 20.5H7.5C6.5 20.5 6 20 6 19V6.5ZM7.48 8.55L10.85 8.08L11.32 11.45L7.95 11.92L7.48 8.55ZM11.42 11.43L14.77 12.02L14.18 15.37L10.83 14.78L11.42 11.43Z",
  "mug-hot":
    "M16 9.00039H18C19.3333 9.00039 20 9.83372 20 11.5004V13.5004C20 15.1671 19.3333 16.0004 18 16.0004H16M8.5 4.60039C7.96667 3.86706 7.96667 3.13372 8.5 2.40039M11.5 4.60039C10.9667 3.86706 10.9667 3.13372 11.5 2.40039M14.5 4.60039C13.9667 3.86706 13.9667 3.13372 14.5 2.40039M6 6.50039H16V19.0004C16 20.0004 15.5 20.5004 14.5 20.5004H7.5C6.5 20.5004 6 20.0004 6 19.0004V6.50039Z",
};

/** The word shown under each icon (the glass name; the ice variants share their glass's name). */
export const GLASS_LABEL: Record<GlassId, string> = {
  rocks: "Rocks",
  "rocks-ice": "Rocks",
  highball: "Highball",
  "highball-ice": "Highball",
  coupe: "Coupe",
  martini: "Martini",
  wine: "Wine",
  "wine-ice": "Wine",
  "mug-ice": "Mug",
  "mug-hot": "Mug",
};

export const METHOD_LABEL: Record<Method, string> = {
  shaken: "Shaken",
  stirred: "Stirred",
  built: "Built",
};

export function PrepIcon({ id }: { id: Method | GlassId }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={PATHS[id]} stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Tag({ icon, label }: { icon: Method | GlassId; label: string }) {
  return (
    <div className="flex w-14 flex-col items-center gap-2 text-[#F7F7F7]">
      <PrepIcon id={icon} />
      <span className="text-[10px] leading-3 opacity-50">{label}</span>
    </div>
  );
}

/** How the drink is made and what it's served in, as two small icons with their words (Figma 135:107). */
export function PrepTags({ method, glass }: { method: Method; glass: GlassId }) {
  return (
    <div aria-label={`${METHOD_LABEL[method]}, served in a ${GLASS_LABEL[glass].toLowerCase()} glass`} role="group" className="flex shrink-0">
      <Tag icon={method} label={METHOD_LABEL[method]} />
      <Tag icon={glass} label={GLASS_LABEL[glass]} />
    </div>
  );
}
