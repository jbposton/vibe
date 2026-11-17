/**
 * The prep icons: small illustrations of how a drink is made and what it's served in
 * (Figma "Illustrations / Variation A: Night glow @36", 152:426; they replaced the line
 * icons from 135:34 on 2026-11-16). Each is a 36 x 36 picture in public/icons.
 */
import Image from "next/image";
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

/**
 * The picture for each icon: the 42 x 42 "Night glow" illustrations (Figma 152:426), saved at 4x in
 * public/icons. In Figma each sits on a near-black rounded tile; that tile has been turned into
 * transparency in the saved pictures (so only the glowing glass shows on the page), and the
 * originals with the tile are not in the app.
 */
export function PrepIcon({ id }: { id: Method | GlassId }) {
  return <Image src={`/icons/${id}.png`} alt="" width={42} height={42} unoptimized draggable={false} className="size-[42px]" />;
}

function Tag({ icon, label }: { icon: Method | GlassId; label: string }) {
  return (
    <div className="flex w-14 flex-col items-center gap-1.5 text-[#F7F7F7]">
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
