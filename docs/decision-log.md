# Decision log

Design and build judgments, newest first. **Placeholder** means a stand-in for an open decision (CLAUDE.md §7). It's marked `// OPEN:` in the code and waits for JP to decide.

## 2026-11-14: Layout v2 (JP's direction)

### Decided by JP
- The page has two sections: information and the drink panel. On web, the info is on the left and the panel on the right (1 : 2 widths from 768px wide). On phones they stack, with the info on top. The page is full width with 16px margins.
- The drink panel is a rectangle with a dark 1px stroke (`#141414`) that clips the extra blur at its edges. It replaces the fixed 402×874 Figma artboard, so the stack now fills whatever height the panel has.
- There's a divider line between each pair of ingredients, and the drag action lives on the line, with a 40px touch target (20px above and 20px below).
- Ingredient labels are right-aligned to the panel, 16px from its edge.

### Build choices
- **What the line drags:** a divider belongs to the layer **below** it. Dragging it changes that layer's amount, and the line follows the pointer (the amount is chosen so the layer's top edge lands where the pointer is, snapped to ¼ oz or one dash).
  - The **top layer has no line above it**, so it can only be changed with the keyboard. In most drinks the top layer is a garnish anyway.
  - Lines whose lower layer is a garnish can't be dragged.
- **Divider style:** 1px `#141414` at 40% opacity, growing to 2px on hover and while dragging.
- **Blur clipping:** the blurred bands run 128px past each side of the panel, so their soft side edges are clipped away and only the vertical blending shows.

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
| Gesture map | Drag the line between two layers; it changes the layer below. ↑/↓ on a focused layer steps ¼ oz (Page Up/Down step 1 oz). *(Updated in Layout v2.)* | `useLayerDrag.ts` |
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
- ~~When you drag a layer, its edge moves less than your finger.~~ Fixed in Layout v2: the line now follows the finger.
- In the Old fashioned, the Angostura bitters (`#E45F00`) and the Orange peel (`#FF6303`) blur together. The labels keep them distinguishable.
