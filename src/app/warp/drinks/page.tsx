"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { WarpCarousel, type WarpCard } from "@/components/ui/warp-carousel";
import { DRINKS } from "@/data/drinks";
import { paintDrink } from "./paintDrink";

// An experiment, not part of the app: your drinks on the Warp Carousel's cards (open /warp/drinks).
// The cards are still pictures: no dragging layers, no slosh.
const IDS = ["negroni", "martini", "old-fashioned", "margarita", "mojito", "aperol-spritz", "espresso-martini", "manhattan"];
const PAGE = "#1A1612";
const never = () => () => {};

export default function Page() {
  // The canvas needs the app's real font name, which only the browser knows.
  const ready = useSyncExternalStore(never, () => true, () => false);
  const [index, setIndex] = useState(0);
  const [lens, setLens] = useState(1);
  const drinks = useMemo(() => IDS.flatMap((id) => DRINKS.filter((d) => d.id === id)), []);
  const font = ready ? getComputedStyle(document.body).fontFamily : "";
  const cards = useMemo<WarpCard[]>(
    () => (font ? drinks.map((d) => ({ title: d.name, value: "", paint: paintDrink(d, font) })) : []),
    [drinks, font],
  );
  if (!ready) return <main className="fixed inset-0" style={{ background: PAGE }} />;

  return (
    <main className="fixed inset-0 flex flex-col text-[#F7F7F7] select-none" style={{ background: PAGE }}>
      <h1 className="px-4 pt-4 font-serif text-[40px] leading-[52px]">{drinks[index]?.name}</h1>
      <div className="min-h-0 flex-1">
        <WarpCarousel
          cards={cards}
          font={font}
          index={index}
          onIndexChange={setIndex}
          autoplay={false}
          step={1}
          background={PAGE}
          // The component's colored glow bands, turned off by painting them the page color.
          glow={PAGE}
          warp={lens}
          ariaLabel="Drinks"
          style={{ aspectRatio: "auto", height: "100%" }}
        />
      </div>
      <label className="flex items-center justify-center gap-3 pb-5 text-[10px] uppercase tracking-[1px] text-white/60">
        Lens strength
        <input type="range" min={0} max={1} step={0.05} value={lens} onChange={(e) => setLens(Number(e.target.value))} />
        <span className="w-8 tabular-nums">{lens.toFixed(2)}</span>
      </label>
    </main>
  );
}
