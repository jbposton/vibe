# Iteration log

Visible before-and-after changes, newest first.

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
