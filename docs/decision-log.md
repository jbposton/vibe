# Decision log

Design and build judgments, newest first. **Placeholder** means a stand-in for an open decision (CLAUDE.md §7). It's marked `// OPEN:` in the code and waits for JP to decide.

## 2026-11-14: Mixer v1 (milestone 1)

### Decided in the brief, built as specified
- The drink is a stack of blurred color bands using the Figma v4 recipe: overlap `0.2h + 12`, blur `min(84, round(total × 0.3))`, 489px wide at x −106, 402×874 artboard.
- Layer height is proportional to oz across the 528px stack. Garnishes and tiny amounts get a 60px minimum (`src/lib/stack.ts`).
- Stack order follows role, bottom to top: base → modifier → sweet → sour → bitter → lengthener → aromatic.
- Every layer has a text label (name · amount), because colors repeat.

### Build choices (not design decisions, easy to change)
- **Fitting the screen:** the panel is laid out in exact Figma pixels, then scaled to fit the screen. That keeps every Figma coordinate valid.
- **Dashes:** 1 dash counts as 0.1 oz toward the stack total. Dragging or arrow keys change dashes one at a time.
- **Steps:** amounts snap to ¼ oz, between 0 and 12 oz.
- **Label color:** labels are dark on light layers and white on dark layers (Tonic water, Sweet vermouth, Whiskey, Espresso), chosen by luminance.

### Placeholders waiting on JP
| Open decision | Placeholder in v1 | Where |
|---|---|---|
| Gesture map | Drag a layer up to add, down to take away. ↑/↓ keys step ¼ oz (Page Up/Down step 1 oz). Dragging the edge between two layers isn't built. | `useLayerDrag.ts` |
| Tie-break for same-role layers | Recipe order: the earlier line sits lower. It never depends on amount, so layers can't swap mid-drag. | `stack.ts` `orderLines` |
| Garnishes as non-volume marks | A fixed 60px layer with a label. It can't be dragged. | `DrinkPanel.tsx` |
| What a missing role looks like | A layer dragged to 0 oz stays at 60px with "0 oz", so it can be dragged back. | `stack.ts` `layerHeights` |
| Gesture hints | One line of text ("Drag a layer up or down…") until the first change. | `DrinkPanel.tsx` |
| First drink a visitor sees | Negroni | `DrinkPanel.tsx` |
| Drink switcher | ‹ › buttons and ←/→ keys, until the Finder exists. | `DrinkPanel.tsx` |
| App name | Page title "Cocktail builder" | `layout.tsx` |
| Label placement | Right-aligned inside each layer, 11px | `DrinkPanel.tsx` |
| Guessed roles | Cranberry juice and Lemonade as modifier; Aperol and Espresso as bitter; Ginger ale and Prosecco as base. Mojito soda water is 2 oz. | `drinks.ts` |
| Espresso martini family | "Unplaced" | `drinks.ts` |

### Noticed while building (for JP)
- When you drag a layer, its edge moves a bit less than your finger, because the stack stays 528px tall and the other layers shrink to make room. Worth feeling on a phone. Dragging the edge between two layers might feel more direct.
- In the Old fashioned, the Angostura bitters (`#E45F00`) and the Orange peel (`#FF6303`) blur together. The labels keep them distinguishable.
