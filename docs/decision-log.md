# Decision log

Design and build judgments, newest first. **Placeholder** means a stand-in for an open decision (CLAUDE.md §7). It's marked `// OPEN:` in the code and waits for JP to decide.

## 2026-11-14: Dragging a line trades between neighbors (JP's choice)
- **Problem:** a line "belonged" to the layer below it while the stack always fills the panel. The line under a garnish could never move (the garnish keeps 60px), so dragging it shot the amount below up to the 12 oz cap. JP saw this as the drag "getting stuck" and acting weird near the top.
- **Options shown to JP:**
  1. The drink grows and shrinks (fixed px per oz).
  2. Trade between neighbors.
- **JP chose trade between neighbors.** Dragging a line moves volume from one of its two layers into the other. Their combined volume stays the same, so the line follows the finger and the rest of the drink stays put.
- **Consequences:**
  - A line next to a garnish can't trade, since a garnish has no volume. It's locked and drawn fainter (15% opacity instead of 40%).
  - A drag always changes two ingredients at once. Changing one ingredient alone (which changes the drink's total) is keyboard-only for now (↑/↓ on a focused layer).
  - Pushing a line well past where a layer reaches its 60px minimum (12px overshoot) empties that layer to 0.
  - Trading between oz and dashes converts at 0.1 oz per dash (Old fashioned: ¼ oz syrup ↔ 2–3 dashes).
- **Known rough edge:** two tiny neighbors (both held at the 60px minimum, like syrup and bitters in an Old fashioned) leave the line very little room to move, so their trades feel jumpy.

## 2026-11-14: Smoother dragging (build choices)
- **Continuous amounts:** while dragging, amounts aren't snapped. They snap to ¼ oz or whole dashes on release. Labels always show the rounded value.
- **Cheap band motion:** during a drag, each blurred band keeps the blur it was drawn with and is stretched vertically (`scaleY`). That means the vertical softness scales with the band for a moment, which is close to the v4 recipe since blur grows with height anyway. The true v4 blur comes back 0.4s after the last change.

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
| Gesture map | Drag the line between two layers to trade volume between them (JP's choice). Lines next to a garnish are locked. ↑/↓ on a focused layer changes that layer alone by ¼ oz (Page Up/Down by 1 oz). | `useLayerDrag.ts` |
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
