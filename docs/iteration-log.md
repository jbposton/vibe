# Iteration log

Visible before-and-after changes, newest first.

## 2026-11-14: Mixing starts right away
- **Before:** a new drink held unmixed for 1 second.
- **After:** there's no hold. A new drink still appears unmixed, but the mixing starts easing in immediately and reaches full strength over 4 seconds.

## 2026-11-14: Shorter unmixed hold
- **Before:** a new drink stayed unmixed for 3 seconds.
- **After:** it stays unmixed for **1 second**, then the mixing eases in over 4 seconds as before.

## 2026-11-14: Drinks start unmixed
- **Before:** a drink was already mixing the moment it appeared.
- **After:**
  - Each newly shown drink (on load, or when switching with ‹ ›) starts **unmixed**: still, straight blends, the plain v4 look.
  - After **3 seconds** on screen, the mixing eases in smoothly over **4 seconds** to full strength.
  - The time only counts while the page is visible. Reset doesn't restart it.
- **Measured** on the Negroni: no movement at 0.5s and 2.5s, starting by 4.5s, full by about 6.5s.

## 2026-11-14: Gentler waves, still garnishes
- **Before:** the boundaries drifted ±40px, and the garnish bands drifted like the liquids.
- **After:**
  - **Gentler drift:** ±28px, about 30% smaller crests, at the same slow speed.
  - **Still garnishes:** garnish bands (Orange peel, Lime wedge, Cherry…) keep a still gradient with straight edges. Only the liquid layers move.

## 2026-11-14: Liquid shader
- **Before:** the drink was drawn as CSS-blurred strips with still boundaries.
- **After:** a WebGL shader draws the whole drink on the graphics chip (`src/components/LiquidCanvas.tsx`).
  - **Same still look:** each layer is the same Gaussian-blurred band as the v4 recipe.
  - **Motion:** the boundaries are pushed by slowly drifting, self-warping noise (±40px), so the colors continuously blend into each other like liquids mixing at a slow pace.
  - **Dragging** just updates a few numbers, and amount changes glide over about 0.2s.
  - **Fallbacks:** reduced motion freezes the movement, the animation pauses when the tab is hidden, and devices without WebGL fall back to the CSS strips.
- **Tuning during the build:** a ±12px drift was too subtle to notice, so it's now ±40px at 1.6× speed. The first noise showed blocky square patches; smoother, rotated noise layers fixed that.
- **Measured:** 61 frames per second in the preview.

## 2026-11-14: White lines removed
- **Before:** a white line showed the boundary being moved while you dragged (and on hover with a mouse).
- **After:** no lines at all. The layer you're dragging is shown only by its 5% darker tint and by the color boundary moving.

## 2026-11-14: Lighter solid highlight; bottom layer follows the finger
- **Before:**
  - The layer being dragged darkened by 25% with soft (gradient) edges.
  - Dragging the bottom layer down expanded it while its top line moved up, opposite to the finger.
- **After:**
  - **Highlight:** the dragged layer gets a solid black tint at 5%, eased in and out the same way.
  - **Bottom layer (JP's choice):** the line always follows the finger. Dragging the bottom layer down moves its top line down, so it shrinks and the layer above grows. Every other layer still expands when dragged down.

## 2026-11-14: Straight lines again; selected layer darkens
- **Before:**
  - The divider lines and color blends were curved like a round glass.
  - Dragging a layer gave no feedback on the layer itself.
- **After:**
  - **Straight again:** the lines and the color bands' edges are straight. The 10px curve and the curved band bottoms are removed.
  - **Darkening:** pressing a layer to drag it eases it darker (a soft-edged black veil to 25%, 220ms ease-in). It stays darker while you adjust, then eases back to its own color when you let go (380ms ease-out). Only the veil's opacity animates, so dragging stays smooth.

## 2026-11-14: Drag down to expand, up to shrink
- **Before:** dragging a section up gave more of it, and it traded with the layer above.
- **After:**
  - Dragging a section **down expands it** and **up shrinks it**.
  - It trades with the layer **below**, so the section's bottom line follows the finger, like pulling its bottom edge.
  - The base layer has nothing below it, so it trades with the layer above. Dragging it down still expands it, and its top line rises.
  - The hint now reads "Drag a layer down to expand it, up to shrink it."

## 2026-11-14: Whole sections are the drag target; side shading removed
- **Before:**
  - You had to grab the thin line between two layers (a 40px target).
  - The panel had darker round-glass sides.
- **After:**
  - **Drag anywhere on a section:** up gives more of that ingredient, down gives less. Volume is traded with the layer above if it holds volume, otherwise with the layer below (e.g. Campari under the Orange peel garnish trades with the Sweet vermouth below it). The shared line follows the finger, and the rest of the drink stays put.
  - **Lines are visual only:** while you drag, or hover a section with a mouse, the line that section will move fades in.
  - **Garnish sections** can't be dragged.
  - **Side shading:** the darker round-glass sides (and their faint light) are removed. The curved levels and curved bands stay.
  - **Hint:** now reads "Drag a layer up for more of it, down for less."
- **Fixed during the build:** the snap on release could read slightly old amounts. It now uses the latest ones.

## 2026-11-14: Lines hidden until hover or drag
- **Before:** the divider lines were always visible (40% white, or 15% when locked next to a garnish).
- **After:**
  - The lines are hidden by default.
  - A line fades in (70%) when you hover over its drag area, and shows at 80% while you drag it.
  - Locked lines next to a garnish never show.
- **Note:** on touch screens there's no hover, so a line only appears once you start dragging. The hint text is the only cue for where to drag.

## 2026-11-14: Inner shadow and edge lens removed
- **Before:** a soft inner glow ran along the edges, and the edge lens (a backdrop blur and saturation) brightened the drink near the sides.
- **After:** both are removed, which leaves only gradients:
  - the blurred color bands
  - the film grain
  - the round-glass side shading
  - the curved levels, with the rounded corners kept
- **Side benefit:** with the live backdrop blur gone, dragging no longer has to recompute it every frame.

## 2026-11-14: Glass border removed
- **Before:** the liquid glass had a gradient rim around the panel at 50%, plus thin bright edge lines at the top left and bottom right.
- **After:** both are removed, so there's no border at all. The panel's edge is defined only by the drink, the rounded corners, the edge lens and a soft inner glow.

## 2026-11-14: Color bands follow the curved levels
- **Before:** only the divider lines curved. The blurred color bands were flat strips, so the blends ran straight across while the lines dipped.
- **After:**
  - Each band's bottom edge (where it blends into the layer below) is a wide, shallow elliptical curve.
  - It's sized from the panel's width so it dips the same 10px across the visible panel as the lines, and shifted down 5px so the curve is centered like the lines.
  - The blur, the v4 overlap and dragging cost are unchanged.
- **Note:** as before, the blend sits slightly below each line, because the v4 recipe extends each band past its boundary before blurring. It now follows the line's curve.

## 2026-11-14: Wrapped around a glass
- **Before:** a flat panel with straight divider lines.
- **After:** two cues make it read as a round glass:
  - **Curved levels:** each divider line is a shallow curve that dips 10px in the middle, like a liquid's surface seen slightly from above in a round glass. The 40px drag target is unchanged.
  - **Cylinder shading:** the drink darkens toward the left and right edges as the glass turns away, with a very faint, broad light a little left of center (6% white).

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
