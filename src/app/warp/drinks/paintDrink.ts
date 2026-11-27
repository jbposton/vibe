import type { Drink } from "@/data/drinks";
import { INGREDIENTS } from "@/data/ingredients";
import { DEFAULT_UNIT, formatAmount, layerBottoms, layerHeights, orderLines } from "@/lib/stack";

/** The drawing is laid out as if the card were this wide (the app's desktop card), then scaled to fit. */
const WIDTH = 584;

/** Dark text on light colors, light text on dark ones (as on the app's cards). */
function ink(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.18 ? "#F7F7F7" : "#000000";
}

/** A still picture of a drink card: flat layers, the base's wave, and the labels. */
export function paintDrink(drink: Drink, font: string) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const scale = w / WIDTH;
    const height = h / scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const ordered = orderLines(drink.lines);
    const heights = layerHeights(ordered, height);
    const bottoms = layerBottoms(heights);

    ordered.forEach((line, i) => {
      ctx.fillStyle = INGREDIENTS[line.ingredient].color;
      // One extra pixel so no seam shows between layers.
      ctx.fillRect(0, height - bottoms[i] - heights[i], WIDTH, heights[i] + 1);
    });

    const [base, above] = ordered;
    if (base && above && above.amount.kind !== "garnish") {
      const top = height - heights[0];
      ctx.fillStyle = INGREDIENTS[base.ingredient].color;
      ctx.beginPath();
      ctx.moveTo(0, top + 1);
      for (let x = 0; x <= WIDTH; x += 4) ctx.lineTo(x, top - 13 * (1 + Math.sin((x / WIDTH) * Math.PI * 3.6 + drink.name.length)));
      ctx.lineTo(WIDTH, top + 1);
      ctx.fill();
    }

    ordered.forEach((line, i) => {
      const ingredient = INGREDIENTS[line.ingredient];
      const y = height - bottoms[i] - heights[i] + (i === ordered.length - 1 ? 36 : 22);
      ctx.fillStyle = ink(ingredient.color);
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.65;
      ctx.font = `500 11px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(ingredient.name.toUpperCase(), 24, y);
      ctx.globalAlpha = 1;
      ctx.font = `400 14px ${font}`;
      ctx.textAlign = "right";
      ctx.fillText(line.amount.kind === "garnish" ? "Garnish" : formatAmount(line.amount, DEFAULT_UNIT, 1), WIDTH - 24, y);
    });
    ctx.textAlign = "left";
  };
}
