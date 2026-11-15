# Iteration log

Visible before-and-after changes, newest first.

## 2026-11-15: Drag changes only the ingredient you touch (prototype, beside the old drag)
- **Before:** dragging a layer traded volume with a neighbor, so adding lime also cut whatever sat next to it, and the drink's total never changed.
- **After:**
  - New default "Add" drag: only the layer you drag changes. The other ingredients keep their amounts, and the stack re-shares its fixed height, so they shrink in proportion. Dragging down adds, up takes out; the base layer is still the exception (down shrinks it).
  - A "Total" line under the ingredient list shows the drink's size in oz.
  - A "Drag: Add / Trade" button at the top switches between the new drag and the old trade drag, so the two can be compared. The hint text follows the mode.
  - Still snaps to ¼ on release; arrow keys step only the focused layer in both modes.
- **Tested:** in the Martini, dragging Dry vermouth down went ½ → 1 oz with Gin unchanged (total 3 → 3½), dragging it back up returned it; dragging Gin (base) down shrank it (2½ → 1¼ oz).
- **Open:** keep Add as the only drag and remove Trade, then update brief §6 (JP to decide).

## 2026-11-15: Parts are the base amount, shown in oz (prototype)
- **Before:** drinks stored amounts in oz and the labels read "2 oz", "¾ oz".
- **After:**
  - Every amount is stored in parts. The labels show the same oz as before, worked out from parts (1 part = 1 oz for now). The screen looks the same.
  - Adding ml or cup later means adding one line to `UNITS` in `src/lib/stack.ts`; labels follow. oz is the only choice for the MVP (JP's call).
  - Quarter part is the smallest step. Dashes and garnishes stay outside the ratio.
- **Open:** a simplified ratio (e.g. 1:1:1) beside the standard one-drink recipe, since the Arnold Palmer's 1:1 isn't a 1 oz + 1 oz drink. Marked `// OPEN: parts model` in `formatAmount`.

## 2026-11-15: Every card mixes (no more waiting for the middle)
- **Before:** only the drink in the middle mixed. The cards at the sides sat still and only started once they reached the middle (and went still again when they left).
- **After:**
  - Every card mixes, including the ones peeking at the sides. Each drink starts unmixed when it first appears, eases into mixing over 4 seconds, and then keeps going, whether or not it's in the middle.
  - Cards that are completely off-screen skip drawing, which nobody can see and saves battery. They're already mixing by the time they slide in, because their clock keeps running.
  - "Reduce motion" still keeps everything still.
- **Tested:** both peeking cards and the middle card changed visibly over 2.5 seconds; the two off-screen cards did not redraw.
- **Cost to watch on a real phone:** three shaders now animate at once instead of one (they were idle before). If it gets warm, lowering the frame rate on the side cards is the easy fix.

## 2026-11-15: Fix: description text highlighting during drags
- **Problem:** sometimes dragging highlighted the text in the description (the caption and hint above or beside the drink).
- **Cause:** only the drink panel had text selection turned off. The description text was still selectable, so a drag or press that strayed onto it (or a browser starting a selection near it) highlighted it.
- **Fix:** text selection is now off for the whole screen (the callout menu on long-press too). The drink name, family, caption and hint can no longer be selected or copied.
- **Tested:** dragging across the caption selected the caption and hint text before the fix; it selects nothing now. Layer dragging and the buttons still work.
- **Note:** I couldn't trigger the highlight from the layers themselves in this browser (a likely trigger is a touch or browser-specific behavior), so the fix removes the possibility rather than a single cause. If you want the drink name to be copyable, that's a one-line change.

## 2026-11-15: Dragged layer shows its flat color
- **Before:** the layer you were dragging got a solid 5% black tint.
- **After:** while you drag, the layer eases (220ms) to its ingredient's flat color: hard edges, no blur, no gradient and no film grain. When you let go it eases back (380ms) to the soft blurred look. The other layers are unchanged, and the labels stay on top.
- I read "blue" in the request as "blur". Easy to change if you meant something else.

## 2026-11-15: Fix: layers couldn't be dragged after a small swipe back
- **Problem:** start a swipe on a layer, move a little sideways, and come back to the same drink: after that, dragging that drink's layers did nothing.
- **Cause:** when a touch on a layer turned into a sideways swipe, the layer handed the gesture to the carousel but kept its own "a drag is in progress" flag. The carousel then paused the card, so the layer never saw the finger lift and the flag stayed set. Every later drag on that card was ignored as a second finger.
- **Fix:**
  - The layer clears its flag the moment it hands the gesture over.
  - Both the layer and the carousel now treat a new first finger as replacing any touch whose lift was never seen, so a missed lift can't leave things stuck.
- **Tested:** on the old code, a vertical drag worked before any swipe but did nothing after a small swipe back. On the fixed code it works after one and after three swipe-backs.

## 2026-11-15: Dimmed side cards
- **Before:** the previous and next drinks peeked in at full color.
- **After:** the cards at the sides are covered by a black overlay at **60%**. The overlay follows the card's distance from the middle: it's 0% when the card is in the middle and fades up to 60% as it moves aside, so a card brightens smoothly as it swipes in and dims as it leaves.
- **Why 60%:** 80% (the first suggestion) would leave the peeking slivers nearly black, so you couldn't tell what's next. 60% still shows each drink's colors, and the middle card clearly leads.
- Wide screens show one card, so they have no dimming. It's one number (`SIDE_DIM` in `DrinkPanel.tsx`) if you want it darker or lighter.

## 2026-11-15: Auto-scroll with a pause on each drink (phones)
- **Before:** the carousel only moved when you swiped.
- **After:**
  - Each drink stays in the middle for 6 seconds, then the row glides to the next one (0.9s, eased in and out). The timer starts over whenever the middle drink changes, including after you swipe.
  - **Touch:** it waits while a finger is on the screen.
  - **Editing:** it stops while the drink in the middle has been edited, and starts again after Reset.
  - **Pause / Play:** a small button next to the counter.
  - It's off for "reduce motion" (the button is hidden too), when the tab is hidden, and on wide screens.
- **Tried and removed (JP):** a continuous, never-stopping drift of about one drink every 6 seconds.
- **Hardening:** a quick tap that ends before the browser can capture the pointer no longer throws an error.
- **Brief:** CLAUDE.md §6 now describes the drag rule, direction-decides gestures, the carousel and the auto-scroll.

## 2026-11-14: Swipe carousel on phones
- **Before:** ‹ › buttons switched drinks.
- **After (phones):**
  - The drink panel is slightly narrower. The previous and next drinks peek in from the left and right at 86% size.
  - Swiping sideways slides the row: the next card grows into the middle while the old one shrinks and moves aside. Tapping a peeking card also brings it in.
  - A sideways move on a layer is a swipe; a vertical move still changes the amount.
  - Only the middle card mixes; the others sit still and idle.
  - Each drink now keeps its edits when you swipe away and back.
  - The arrow buttons stay on wide screens (and for screen readers on phones).
- **Checked in the preview:**
  - Swiping left moved Negroni → Martini, with the new card growing to the middle at full size.
  - A vertical drag on a layer still changes amounts (Martini Gin 2½ → 2¼ oz).
  - Tapping a peeking card brings it in.
  - Edits are kept after swiping away and back.
  - At 1280px wide there's one card, the ‹ › buttons work, and only one shader runs.
- **Not checked:** how it feels on a real touch screen (flick speed, thumb swipes).
- **Brief note:** CLAUDE.md §6 says a swipe should start on the tray or handle, never on the drink. JP chose swiping the card instead, with direction deciding the gesture.

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
