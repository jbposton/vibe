# Iteration log

Visible before-and-after changes, newest first.

## 2026-11-14: Dimmer glass rim
- **Before:** the liquid-glass rim was a bright outline.
- **After:** the rim is at 50% opacity, so it reads as a hint of light along the edge. The lens and inner glow are unchanged.

## 2026-11-14: Liquid glass overlay
- **Before:** a subtle glass edge, made of a thin rim and soft inner shading.
- **After:** a liquid-glass treatment that keeps the middle of the drink clear and puts the effect at the edges:
  - **Lens:** within about 22px of the edge, the drink behind is softened (5px blur), more saturated and slightly brighter, like light bending through a curved glass rim.
  - **Specular rim:** a 1.5px gradient outline, brightest at the top left and catching light again at the bottom right.
  - **Inner glow:** light caught along the inside of the edges, with a faint darker band for thickness.
- **Fixed during the build:** the rim's mask was being ignored, so its gradient washed across the whole drink. It now uses the `mask` shorthand so only the outline shows.
- **To watch:** the lens uses a backdrop blur, which the browser recomputes while you drag. Check smoothness on a phone.

## 2026-11-14: Rounded glass panel
- **Before:** the drink panel was a sharp-cornered rectangle with no edge treatment.
- **After:**
  - The panel has 28px rounded corners, and the drink is clipped to them.
  - A subtle glass edge: a bright 1px rim at the top, a faint hairline all around, soft light along the left and right edges, and a little shading at the bottom.
- **Tried and removed (JP):** a wet look with condensation drops (first as noise blobs that read as scratches, then as drawn water beads), and a glass sheen (a diagonal shine plus a vertical reflection streak).

## 2026-11-14: Warm black, no panel border
- **Before:**
  - The dark page was a neutral black (`#141414`).
  - The drink panel had a white border.
- **After:**
  - The page is a warm black (`#1A1612`).
  - The drink panel has no border, but the drink is still clipped to its rectangle, so the blur doesn't spill onto the page.
  - The white divider lines are unchanged.

## 2026-11-14: Dark mode trial
- **Before:** light page (`#F7F7F7`) with dark text (`#141414`), and a dark panel border and lines.
- **After:**
  - The page is inverted to a dark background (`#141414`) with light text (`#F7F7F7`), including the Reset button and the drink switcher.
  - The drink panel's colors, blur and grain are unchanged. The panel border is white, and the divider lines and keyboard focus ring are white too, with the lines at the same opacities as before.

## 2026-11-14: Reset always visible, film grain
- **Before:**
  - Reset was faint grey text that appeared only after a change, so it was easy to miss, especially on phones.
  - The drink's colors were perfectly smooth.
- **After:**
  - Reset is a small outlined pill at the top left on phone and web, lined up with the 16px margin. It's dimmed until something has changed.
  - A static film grain sits over the whole drink, under the labels and lines: grey fractal noise blended with "overlay" at 45% opacity. It's subtle on very pale layers like Gin and Soda water.

## 2026-11-14: Layer labels split, text not selectable
- **Before:** each label read "Gin · 1 oz", right-aligned, and the text in the panel could be selected or highlighted while dragging.
- **After:**
  - The ingredient name sits on the left edge of each layer and the amount on the right edge, both 16px in from the panel border.
  - The drink panel's text can't be selected, highlighted or long-pressed.

## 2026-11-14: Lines trade between neighbors
- **Before:** dragging a line changed only the layer below it. The line under the garnish couldn't move, so dragging it near the top made amounts jump to 12 oz and the drag felt stuck.
- **After:**
  - Dragging a line moves volume between the two layers it separates. The line follows the finger, the rest of the drink stays still, and the pair's total is unchanged.
  - Lines next to a garnish are fainter and can't be dragged.
  - The hint now reads "Drag a line to move volume between the two layers it separates."

## 2026-11-14: Smoother dragging
- **Before:** the line jumped in ¼ oz steps while you dragged, and every movement re-blurred all the color bands, which is slow on phones.
- **After:**
  - The line follows the finger continuously and snaps to the nearest ¼ oz (or whole dash) only when you let go, gliding the last few pixels.
  - During a drag the bands are stretched and moved with GPU transforms instead of being re-blurred, then redrawn at full quality about 0.4s after things settle.
  - Pointer moves are applied once per screen frame.

## 2026-11-14: Mixer v1 → Layout v2
- **Before:** a fixed phone-shaped artboard scaled to fit the screen, with open blur bleeding to the screen edges. You dragged anywhere on a layer, and the layer's edge moved less than your finger.
- **After:**
  - Two sections: info on the left and panel on the right on web, stacked on phones with info on top. The page is full width with 16px margins.
  - The drink sits in a rectangle with a dark stroke that cuts off the blur at its edges.
  - Thin divider lines separate the ingredients, and dragging a line (40px touch target) changes the layer below it. The line follows the finger.
  - Labels are right-aligned to the panel.

## 2026-11-14: Starter page → Mixer v1
- **Before:** "Hello world" on a white page.
- **After:** a full-screen, phone-sized drink panel on `#F7F7F7`, starting on the Negroni. It shows the name, family and an ingredient caption, then the blurred stack of color bands, one per ingredient, each with a label.
  - Drag a layer up or down, or focus it and use ↑/↓, to change its amount. The stack rebalances live.
  - ‹ › at the top step through the 18 test drinks.
  - Reset appears after a change.
- **Font:** Inter replaces Geist.
- Not yet: the flavor profile, the ingredient tray, the Finder and the Library.
