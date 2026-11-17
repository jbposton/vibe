# Iteration log

Visible before-and-after changes, newest first.

## 2026-11-16: Edit panel: no glass look, the app's own background color with a blur

- The edit panel's lighter translucent gray and the extra color saturation behind it are gone. It is now the app's background color (#1A1612) at 80% opacity with a 20px background blur, so it reads as the same dark as the page while still softening what passes behind it. The white 0.5px border and the soft shadow stay. The fallback (no blur support, or "reduce transparency") is solid #1A1612.
- OPEN: the 80% opacity is a first guess; lower it to show more blur, raise it for a flatter panel.

## 2026-11-16: The edit panel's border is 50% opacity

- The edit panel's 1px white border is now at 50% opacity (JP wrote ".5"; read as 0.5, not 0.5 percent, which would be invisible).

## 2026-11-16: More space between the labels and the ladders

- The gap between each label ("Strength · 27% ABV") and its ladder went from 10px to 14px (JP; 18px was tried and was too much). The ladders moved down 4px; the buttons did not move (the space under the ladders is 24px).

## 2026-11-16: Ladder steps are 3px thick

- The ladder steps went from 5px to 3px thick (JP tried 2px first; still 24px wide and rounded). The gap between steps is 3px (JP; it was 4px), so the ladder is 27px tall (was 41px) and starts at the same place; the buttons did not move (the space under the ladder grew to 28px). The glow behind each lit step is blurred 4px instead of 5px so a thinner line still glows.

## 2026-11-16: Flavor profile as a "glow ladder" (Figma 180:39)

- The orbs under Strength, Sweet and Bitter are replaced by ladders of five steps (24 x 5, 4px apart) filled from the bottom. Each lit step glows (a blurred copy behind it at 60%) and has a little grain; the colors shift as they climb: pink-red for Strength, gold for Sweet, purple for Bitter. Unlit steps are white at 12%. It goes by the same five steps as the Low / Medium / High words, so it no longer grows continuously like the orb's line did.
- Figma draws only 3 or 4 lit steps per stat, so steps 4 and 5 continue each color ramp (the fifth reaches the old orb's edge color). OPEN: JP to check those colors. The buttons stay where they were (the gap under the ladders is 14px).

## 2026-11-16: New prep icon set (Night glow, warm palette)

- The 13 method and glass icons were replaced with the "Night glow @ 36x36, warm palette" set (Figma 176:38). Same names, sizes (42 x 42 on the page) and labels; the pictures in `public/icons/` were re-exported at 4x and the dark tile behind each was made transparent again, as before. Nothing in the code changed.

## 2026-11-16: No jump at the end of the wave

- The wave's drawing box had a 180ms CSS height transition (copied from the layers) on top of the frame-by-frame size animation, so its box lagged behind the shape inside it, stretching the wave, and then snapped when the wave was removed at the end. The transition is gone from the wave; it still follows the layer's position smoothly as you drag.

## 2026-11-16: The base wave plays for 3 seconds when a drink comes into view

- When a drink comes into view (on load, after a swipe, after switching filters) the wave on the base ingredient starts at full size, slides along its length about one and a half times (slowing as it goes), and eases down to a flat line at 3s: the first version swelled up from nothing, which JP cut. The end eases out gently (a cosine curve) with no pop. After that the base edge stays straight. With "reduce motion" on it doesn't play at all. `WAVE_PLAY_MS`, `WAVE_SLIDES` and `WAVE_AMPLITUDE` in `DrinkCard.tsx` tune it. The wavy edit-panel borders are not animated.
- Each play redraws the wave about 60 times a second for 3 seconds, on one card only.

## 2026-11-16: The edit panel is solid, with no shadow

- The edit panel's fill is now solid #1A1612 (the app's background color): not see-through, no blur. The soft drop shadow around it is gone too. The wavy edges and white lines are unchanged. The glass fallbacks (no blur, "reduce transparency") were removed since nothing blurs any more.

## 2026-11-16: The edit panel is the app's background color again

- The edit panel's fill went from pure black to the app's own background color (#1A1612), still at 80% with the 20px blur (solid #1A1612 where blur isn't available). The wavy edges and lines are unchanged.

## 2026-11-16: Edit panel: wavy top and bottom edges (Figma 169:107)

- On a phone the edit panel's top and bottom edges are gentle waves (22px long, 5px tall) with a thin white line (1px, 80%) along each, and nothing along the sides; the corners are square. The dark fill, its blur and its soft shadow are cut to the same wave. Before: a 1px white border all round with 30px corners. The wide-screen layout keeps its rounded panel.
- The panel is now built from a few layers in `EditPanel.tsx` (shadow, fill, two wave lines) styled in `globals.css` (`.wavy-sheet`, `.wavy-shadow`, `.wave-line`, and the three `--wave-*` shapes). The fill and shadow use CSS masks.

## 2026-11-16: Flavor profile orbs (Figma 171:38)

- The five-bar stacks under Strength, Sweet and Bitter are now glowing orbs (pink, gold and blue, 44px, with a blurred glow behind, a little grain and a sparkle at the top right). A thin white line grows clockwise around each orb, from 9 o'clock over the top, as the value rises: nothing at 0, a full circle at the top of the scale (50% ABV, 15 sugar, 4 bitter). It grows smoothly when you edit. Figma shows the line as a short fixed arc; here its length is the measure (JP's change).
- The words (Low / Medium / High) still go by five steps. The buttons stay where they were; the gap under the orbs is 10px instead of 27px (`EditPanel.tsx`).
- OPEN: the arc's start (9 o'clock), the 18px ring size and the colors are first guesses for JP to tune.

## 2026-11-16: Grainy texture on the layers

- The ingredient layers (and the base wave) have a film grain over them: grey noise laid on with "overlay" at 60%, under the text. It is tuned so the ingredient colors stay true (the first try made them lighter; the fix was to blend the noise in sRGB). It is one still tiled image, so it costs nothing while you drag. `LAYER_GRAIN` in `DrinkCard.tsx` sets the strength (0 for none); the pattern is `LAYER_GRAIN_STYLE` in `surfaceEffects.ts`. It only shows with the flat colors (the shader has its own grain).

## 2026-11-16: A round wave on the base ingredient

- Only the base ingredient (the bottom layer) has a wave now: its color rises into the layer above in smooth, round humps, up to 26px, with no sharp points (a sine curve with a random phase and 1.5 to 2.25 humps across the card, fixed for each drink). It follows the layer as you drag. The wave is lower when the layer above is short, so it never runs under that layer's label, and it is not drawn when the layer above is a garnish. `WAVE_AMPLITUDE` and `WAVE_TEXT_ROOM` in `DrinkCard.tsx` set the size.
- History today: a 16px gradient blend (reverted), a 5px wave on every non-garnish boundary, a 12px wave with 7 bends, then this.

## 2026-11-16: The edit panel is pure black

- Only the edit panel's fill is pure black (#000000, at 80% with the 20px blur); the page background stays warm black (#1A1612). The solid fallback (no blur, or "reduce transparency") is #000000.

## 2026-11-16: Edit panel back to its inset size, rounded, with a border all round

- JP asked to undo the full-width, square, top-border-only panel. The edit panel is again 16px in from the sides and bottom (152px tall closed, 12px of padding at the sides and under the buttons), with 30px corners, and now has the 1px white border on all four sides. It keeps the app's dark background color with the blur. The full-width version was only live for one push (`b920dac`).

## 2026-11-16: Browse filters restyled as text with slashes (Figma 132:35)

- The filter chips lost their pill backgrounds: they are now 10px capitals split by thin slashes. The chosen filter is white and medium weight, the rest are 50% white. The sparkle on "Build my own" and the thin divider between taste and occasion are gone (the slashes replace it). Still one row that scrolls sideways with each tap area 44px tall, and the right edge still fades out; the left edge now fades too once you scroll.
- The filter labels have slightly wider letter spacing (0.08em).
- The slash is centered between two labels (14px each side); Figma's own spacing is 16px before it and 12px after.
- OPEN: Figma says "Build Your Own"; the app keeps "Build my own" (data label) for now.

## 2026-11-16: New icon illustrations (Night glow) replace the line icons

- The method and glass icons are now the 36 x 36 "Night glow" illustrations from Figma (152:426): dark tiles with a glowing, colored glass. They are saved at 4x (144px) in `public/icons/` and drawn at 42 x 42 in `src/components/PrepIcons.tsx`, with the same labels under them. The dark tile behind each illustration was turned into transparency in the saved pictures (so only the glowing glass shows on the page, not a black square); the originals with the tile are in the Figma file. The old line icons (135:34) were removed from the code (they are still in the Figma file).

## 2026-11-16: The drink shrinks only a little when the drawer opens

- When the edit panel swipes up, the drink now shrinks by 16px on each side (about 91% on a phone) instead of to 78%, like an Apple sheet pushing the page back a little. The apple-design skill gives no numbers for this, only "push the background back"; the 16px matches the screen margin. The drink still moves up 78px, so more of its lower part sits behind the glass drawer than before. OPEN: JP to say if it should move up more or less.

## 2026-11-16: The drink card is as wide as the edit panel

- On a phone the card is now always the full width between the 16px margins, the same as the edit panel. On a shorter screen it gets shorter (down from the 0.9 width-to-height shape) instead of narrower. Wide screens keep the fixed shape.

## 2026-11-16: Garnish text is now truly centered in its layer

- The "Garnish" label row was 16px tall while the rows with an oz button were 32px, and the centering assumed 32px, so a garnish's text sat 8px too high (it looked off-center and the layer looked taller than the 1/4 oz layers next to it, though all are 60px). Every label row is now 32px tall, so garnish and ingredient text line up at the same spots.

## 2026-11-16: Top layer: garnish centered, anything else top-aligned

- The top layer's text is centered when the top layer is a garnish, and top-aligned (14px from the top, plus 15px for the rounded corners only when the layer is at least 90px tall) when it is not, whether or not you are dragging. Other layers: top-aligned during a drag; otherwise centered only at the 60px minimum.
- A short non-garnish top layer (Cosmopolitan's lime juice, 60px) stays at 14px. OPEN: the 90px threshold is a first guess.

## 2026-11-16: While dragging, every layer but the top one is top-aligned

- When a drag starts, all the layers except the top one have their text top-aligned and keep it that way until you let go, so a layer shrinking to the minimum doesn't switch to centered mid-drag. When you let go each settles to the right alignment (glide). The top layer holds the alignment it had when you touched down.

## 2026-11-16: Same label distance from the top whether centered or top-aligned

- Layer labels (name and amount) with top alignment now sit 14px from the top of the layer, the same as when centered in a 60px layer (before: 8px, and 23px on the top layer). The text no longer shifts when a layer crosses the minimum height. The top layer alone gets 15px more when it is top-aligned (so 29px), to clear the card's rounded corners; a top layer at the minimum height stays centered.

## 2026-11-16: Text is centered in short layers

- A layer with less than 1 oz (a part) now has its name and amount centered vertically in the layer; layers of 1 oz or more keep the text near the top. While you drag anything, every centered layer's text glides to the top; when you let go each settles to the middle or the top depending on its size (0.32s glide, no jump). Garnish layers (no volume) keep the text near the top for now. OPEN: JP to say whether garnishes should be centered too.

## 2026-11-16: Less movement when a drag starts

- While you drag, every layer's text stays exactly where it was (centered stays centered, top stays top); it only glides to its new place after you let go. Before, the centered text glided up to the top as the drag began, which was a lot of movement.
- When the drag begins, the layer now follows the finger from where it is at that moment, so it no longer jumps by the few pixels used to recognize the drag (it jumped about 8px on the Gimlet's Gin layer).

## 2026-11-16: Small controls are fully rounded

- The filter pills, the edit buttons (Add Sweet, Less Strong...) and the amount buttons on the layers are now completely rounded (pill shaped). The edit panel (30px) and the drink card (38px) keep their corner radii.

## 2026-11-16: Closed edit drawer: bottom padding matches the sides

- The space under the buttons in the closed drawer went from 26px to 12px, the same as the left and right padding. The drawer is 14px shorter (`PANEL_CLOSED_HEIGHT` 166 to 152) and the drink card has 14px more room.

## 2026-11-16: Blurred drink-color background (and Safari top bar color) tried, then removed

- The app background was the current drink's colors, blurred and darkened, with a matching Safari top bar color. JP asked to go back to the plain warm-black background, so `DrinkBackdrop.tsx`, its fade keyframes and the theme-color code were removed.

## 2026-11-16: Side drinks and prep icons fade first when the drawer opens

- They now reach zero by about a third of the swipe (before: the side drinks faded evenly across the whole swipe, the icons stayed). The header text and the middle drink fade more slowly as before.

## 2026-11-16: Prep icons (method + glass) at the top right of the screen

- Added the 13 line icons from Figma (node 135:34) in `src/components/PrepIcons.tsx`: Shaken, Stirred, Built, and ten glasses (Rocks, Highball, Coupe, Martini, Wine, Mug, some with ice).
- Each drink now has a `glass` (`src/data/drinks.ts`). The header shows its method icon and glass icon with small labels, right of the drink name (Figma 135:107).
- OPEN: my drink-to-glass mapping and the glass names are first-pass guesses for JP to confirm. A long name (Espresso martini) wraps to two lines on a phone because the icons take room.

## 2026-11-16: New design pass (from JP's Figma "Hack", frame 91:5)
- **Before:** Inter type, pill buttons, plain "1 oz" text on each layer, no handles, three flavor bars, and no way to fix a drink with a button.
- **After:**
  - **Fonts:** Instrument Serif (drink name, 40px) and Instrument Sans (everything else), loaded with `next/font/google`.
  - **Buttons:** rounded rectangles with a 9px radius (not pills): the filter chips (selected is white with dark text, the rest a faint white fill) and the new edit buttons. The drink card's corners are rounder (38px).
  - **Amounts:** each liquid layer has its amount in a small button at the right: a 14px number and a 12px "oz" at 60%, a faint fill, a 0.5px highlight along the top edge only (bright at the left, fading out about halfway across) and a little background blur. The button is as wide as its content (Figma 93:378), then made a bit smaller at JP's request: 32px tall with an 8px radius, a 13px number and an 11px "oz" (the design has 37.5px, 14px and 12px). It isn't clickable yet. Garnishes read "Garnish".
  - **Handles:** a small light bar on each line between layers that can be moved, as a hint only (you can still drag anywhere on a layer). None sit next to a garnish; they are 2px thick and 25% white (first drawn 4px and 40%).
  - **Flavor rings:** ABV, Sweet and Bitter as three thin rings that fill clockwise, with "ABV · 27%" / "Sweet · High" labels above. A small dot appears on a ring once an edit moves it away from where it started.
  - **Make edits:** a divider with three buttons under the rings. Less Sour adds a little of the sweetest non-sour ingredient already in the recipe; Less Sweet adds the sour ingredient (or the base spirit if there isn't one). Each tap adds ¼ oz and the drink grows (the Add model); dragging layers still uses Share. A button is dimmed when the drink has nothing for it (for example Less Sour on a Negroni). Substitution is a dimmed placeholder.
  - **Reset icon:** restyled to match the design: a 45px glass circle with the same top-edge highlight and blur as the amount buttons.
  - Servings cups and the oz Total stay, above the rings.
- **Open for JP:** the Ice / Long / Stirred row in the mock isn't built (it needs data and icons); Substitution needs a curated swap list; the edit rules and ¼ oz step are a first pass (see `src/lib/edits.ts`); the mock's stats used DM Sans and I used Instrument Sans; "Subsitution" in the mock is spelled "Substitution" here; filter chips stay 32px tall (the mock shows 36px).
- **Tested:** Daiquiri: Less Sour added syrup (¾ to 1 oz, total 3¾ to 4 oz), Less Sweet added lime; Gin and tonic and Negroni show the right buttons dimmed; a drag that starts on an amount button still moves the layer; wide screen layout checked.

## 2026-11-16: Frosted-glass edges tried, then removed
- **Tried:** making the cards at the sides look like frosted glass (blur up to 7px, then reduced to 3px, a faint white tint, a bright rim) after the "glassmorphism" skill.
- **Result:** JP asked to remove it. The side cards are back to how they were: a black dimming layer that grows to 60% as a card moves away from the middle, with no blur. The wider ring perspective and card spacing from before are unchanged.

## 2026-11-16: Main card 16px from the screen edge
- **Before:** the middle card was 24px from each side of the screen (327 x 425 on a 375 x 812 phone), with about 15px between it and the side cards.
- **After:** exactly 16px from each side, so 343 x 445 on the same phone (the shape is unchanged). To keep a sliver of each side card showing, the extra space between cards (`GAP`) went from 17 to 10, which leaves about 8px between the middle card and the side cards. `CARD_MARGIN` is 16 and `GAP` is 10, both at the top of `src/components/DrinkPanel.tsx`.

## 2026-11-16: More space between the main card and the side cards
- **Before:** about 7px of empty space between the middle card and each side card, and about 17px of each side card showing.
- **After:** about 15px of space, and about 9px of each side card showing. The middle card is still exactly 24px from each side of the screen (that is now its own setting, `CARD_MARGIN`, separate from `GAP`, the extra space between cards; both at the top of `src/components/DrinkPanel.tsx`).
- **Tested:** measured on a 375 x 812 phone: middle card 24 to 351, left card ending at 8.8, right card starting at 366.2.

## 2026-11-17: Edit panel in a frame, and swipe up to focus on editing (Figma 117:975 and 118:1044)
- **Before:** the flavor profile and the edit buttons sat loose under the drink, with a "Make edits" divider.
- **After:**
  - **Frame:** the flavor profile and the four edit buttons sit in a rounded dark frame (30px corners, `#2b2b2b`) at the bottom of the screen, as in the design. The "Make edits" divider is gone (the design has none). The flavor labels are 11px with a 2px dot (the design's new sizes). To make room for the frame under the drink, the drink card's shape is now 0.9 (the Figma panel, 370 x 410), so it is 343 x 381 on a 375 x 812 phone.
  - **Swipe up (phones):** swiping the edit panel up moves everything on the z-axis: the browse filters move back and disappear, the drink name moves up and shrinks (40px to 24px), the drink moves back and shrinks to 78% with the cards beside it fading away, and the edit panel rises until it fills the bottom of the screen, partly over the drink, like your diagram. Swiping down on the panel puts it all back. While it is up, the drink's layers can't be dragged and the carousel doesn't swipe, so you only focus on that drink; the edit buttons work and the drink updates behind the panel.
  - **How it moves (the apple-design skill):** the panel follows the finger 1:1; on release the finger's speed is handed to a spring (about 0.35s, no overshoot for a slow release and a little for a flick), a flick is projected forward to decide whether it lands open or closed, going past either end rubber-bands, and it can be grabbed or reversed at any moment without a jump. Only transform and opacity animate. With "reduce motion" on it just switches with no spring.
  - **Without swiping:** a small grip at the top of the panel opens and closes it (it is a real button), Escape closes it, and tapping the shrunken drink above the panel closes it.
  - **Wide screens:** no swipe; the framed panel just sits in the left column.
- **Tested** on a 375 x 812 phone preview with scripted touches: a slow drag held at half way showed everything half moved (finger 122px of 244px gave exactly 50%); releasing past half settled open from a rubber-banded 1.06 without wobble; a quick flick down closed in about 0.2s and a flick up opened; the edit buttons worked while open (Add Sweet took the vermouth to 1¼ oz); the grip, Escape and tap-away all closed it; reversing 120ms into an opening carried on smoothly from where it was; and the carousel swipes again after closing.
- **Open for JP:** the five gray bars in your diagram's open panel are placeholders, so the lower part of the open panel is empty for now; the Ice, Long and Stirred icons beside the header (in the diagram) aren't built; I added the grip, since the design has none and a gesture needs a non-swipe way in; the distances (`SHEET` in `src/components/DrinkPanel.tsx`) are set for a phone about 375 x 812; the drink moves back with a scale rather than true depth (the filters use real depth).

## 2026-11-17: Flavor labels centered over their bars
- **Before:** each label had a fixed-width slot for its value, so a short value like "High" left blank space after it and the "Sweet · High" label sat a little left of the center of its bars.
- **After:** each label is exactly as wide as its words and centered on the same line as its bars, so "Strength · 27% ABV", "Sweet · High" and "Bitter · High" all line up with their bars. The bars never move; when a value changes (for example "High" to "Medium") only the label's words re-center around the same point, a few pixels at most.
- **Tested:** the label center and bar center matched to the pixel for all three stats on the Negroni (81.2, 187.5, 293.8) and on the Arnold Palmer ("0% ABV", "Medium", "Low"), and the bars stayed at the same x positions when the drink changed.
- **Trade-off:** this replaces the fixed-width slot that stopped label words from shifting, so the words now recenter slightly when a value changes.

## 2026-11-17: Closed drawer has no extra space at the bottom
- **Before:** the closed edit drawer was 226px tall, with about 86px of empty space under the buttons.
- **After:** it is 166px tall: 26px of padding under the buttons, the same as the 26px above the flavor stats. The open drawer is unchanged (470px), so it now travels 304px instead of 244px, and the drink card has more room above the drawer (the card is still 343 x 381, centered). The drink's move up when the drawer opens was re-tuned from 55px to 78px so it still ends in the same place (title at 16px, card top at about 99px).
- **Tested:** measured on a 375 x 812 phone: closed drawer 630 to 796 (166px) with exactly 26px under the buttons; open card top 99 and title top 16; closing returns to the same positions.

## 2026-11-17: The background fades when the edit drawer is open
- **Before:** the header and the drink only moved and shrank behind the drawer.
- **After:** they also fade, to 55% opacity when the drawer is fully up (growing and easing back with the swipe, like everything else). This is the one place I'm departing from the apple-design skill, which says not to dim behind a non-blocking panel; it's JP's call. The drawer itself is untouched.
- **Tuning:** `SHEET.dim` (0.45) in `src/components/DrinkPanel.tsx`; 0 turns it off.

## 2026-11-17: The edit drawer is a glass material with a top shadow (replaces the faint blur)
- **Before:** I had blurred the header and the drink (1px) while the edit panel was up. The apple-design skill says to animate only transform and opacity (blurring a moving element is re-done every frame) and to get this look from the *material* of the panel on top, not by blurring what's under it.
- **After:** the blur on the header and the drink is gone. Instead the drawer itself is frosted glass: a dark, see-through fill (`#2b2b2b` at 72%) with `backdrop-filter: blur(20px) saturate(180%)`, so whatever is behind it (the lower part of the drink when it's open) is blurred through it, a thin light edge, and a soft shadow (`0 -10px 40px` at 50% black) that shows around its top and sides. The skill's rule for non-blocking panels is not to dim the background, so nothing else dims.
- **Fallbacks:** with "reduce transparency" on, or where backdrop blur isn't supported, the drawer is a solid `#2b2b2b` with no blur (the shadow stays).
- **How it grows now:** to keep the shadow and blur on one element, the drawer's height changes (226px to 470px, anchored at the bottom) instead of clipping a taller panel. It is a small absolutely positioned box, so it stays cheap. The finger and the spring work exactly as before.
- **Where:** `.glass-sheet` in `src/app/globals.css`; `src/components/EditPanel.tsx`.
- **Tested:** the page's styles and the computed backdrop blur, fill and shadow on the panel; open and closed screenshots on a phone-size preview (the pale gin layer glows softly through the top of the open drawer, and the shadow darkens the drink just above it); the panel is 226px tall closed and 470px open.
- **Heads up:** a dev server restart was needed to pick up the new stylesheet while testing (a caching quirk of the dev server only).

## 2026-11-16: Cards 8px apart
- **Before:** 10px between the middle card and the side cards (about 6px of each side card showing).
- **After:** exactly 8px between the middle card and each side card, so about 8px of each side card shows next to the 16px margin. `GAP` is 8 at the top of `src/components/DrinkPanel.tsx`.

## 2026-11-16: Ring perspective tried, then removed
- **Tried:** arranging the carousel cards like they were around a circle seen from outside: each card away from the middle turned 30 degrees and sat back in depth, with perspective.
- **Result:** JP asked to remove it. The cards are back to the flat layout: the cards beside the middle one are 86% of its size and slide sideways with no turning or depth. The card margin (16px) and the spacing between cards are unchanged.

## 2026-11-16: More space between the main card and the side cards
- **Before:** about 7px of empty space between the middle card and each side card, and about 17px of each side card showing.
- **After:** about 15px of space, and about 9px of each side card showing. The middle card is still exactly 24px from each side of the screen (that is now its own setting, `CARD_MARGIN`, separate from `GAP`, the extra space between cards; both at the top of `src/components/DrinkPanel.tsx`).
- **Tested:** measured on a 375 x 812 phone: middle card 24 to 351, left card ending at 8.8, right card starting at 366.2.

## 2026-11-16: Cards sit on a ring (perspective)
- **Before:** the cards beside the middle one were just smaller and dimmed, sliding flat from side to side.
- **After:** on a phone the cards are arranged like they're around a circle seen from outside. Each step away from the middle turns a card 30 degrees around a vertical axis and sets it back in depth, with perspective, so the cards at the sides are foreshortened, and during a swipe the card coming in tilts into place while the one leaving turns away. The dimming is unchanged. On wide screens (one card) nothing changes.
- **Tuning:** `RING_DEGREES` (30) is the turn per card and `PERSPECTIVE` (1000px, smaller is stronger) is the viewing distance, both at the top of `src/components/DrinkPanel.tsx`.
- **Tested:** a held mid-swipe screenshot on a 375 x 812 phone shows the tilted, shrinking cards; a short drag settles back; tapping the left card goes to the previous drink; the card in the middle still sits exactly 24px from each side.
- **Open for JP:** at rest only a 16px sliver of each side card shows, so the ring is most visible while swiping; a bigger angle or a smaller perspective distance would make the slivers lean more.

## 2026-11-16: Right-hand text sizes and alignment
- **Before:** the amount number was 13px but "oz" was 11px, and the amount's text stopped 8px short of where "Garnish" ended (the amount's button padding pushed it in).
- **After:** the amount number is 13px; "oz" (and "dashes") and "Garnish" are 12px. The right edge of every right-hand label now lines up exactly, "oz" with "Garnish". The button that shows while you press or drag extends 8px beyond that edge, around the text.
- **Tested:** Negroni: the "oz" on all three liquids and "Garnish" end at the same x (329px on a 375px phone), sizes read 13px / 12px / 12px.

## 2026-11-16: Flat colors instead of the shader; side ticks removed
- **Before:** each layer was a blurred band drawn by the liquid shader (slowly mixing boundaries, film grain), with short ticks on the card's edges beside each label.
- **After:** the ticks are gone, and each layer is a flat block of its ingredient's color with hard edges (no blur, no gradient, no grain, no movement). The labels, amount buttons and dragging are unchanged; the blocks resize smoothly when you change an amount and follow your finger during a drag.
- **Shader kept:** nothing was deleted. The shader and its helpers are still in `src/components/LiquidCanvas.tsx` and `src/components/surfaceEffects.ts`, and `src/components/DrinkCard.tsx` has one switch, `USE_SHADER` (now `false`). Setting it to `true` brings back the blurred, mixing look exactly as it was (including the "every layer goes flat while you drag" effect), and the unused shader doesn't run while it's off.
- **Open for JP:** the `layerGeometry` blur settings in `src/lib/stack.ts` (including the tighter garnish blur) are also kept for when the shader returns.
- **Tested:** Negroni on a phone-size preview: no canvas or blurred bands on the page, four flat blocks that fill the card, a drag still moves Campari from 1 to 1½ oz, and the page shows no ticks.

## 2026-11-16: Edge ticks instead of a line above each ingredient (Figma 110:659)
- **Before:** a thin line ran across the card along the top of each layer.
- **After:** the lines are gone. In their place, each layer below the top one has two short ticks (13px long, 1px thick) on the card's left and right edges, level with the middle of its label, so they point at the name on one side and the amount on the other. They are light gray (#d9d9d9) on dark layers and a dark 45% tick on light layers (the design only shows the light gray, which would vanish on pale layers like gin). The top layer has none, as in the design, and the ticks fade out while you press or drag.
- **Open for JP:** the dark tick color for light layers is my addition; the card's reset icon already matches the design's glass circle.

## 2026-11-16: Narrower flavor bars
- **Before:** each bar in the three flavor stacks was 39px wide (Figma 110:731).
- **After:** 16px wide and then 2px high (was 3px), with the 3px gaps unchanged. The labels above them are unchanged and the bars stay centered under them.

## 2026-11-16: Card sits 24px from each side of the screen
- **Before:** the card was 22px from each screen edge (331 x 430 on a 375 x 812 phone).
- **After:** exactly 24px from each side, so it is 327 x 425 on the same phone. The cards peeking in at the sides now show 16px, with an 8px gap to the middle card (16 + 8 = 24). The shape is unchanged (`CARD_ASPECT = 0.77`).

## 2026-11-16: Wider, slightly shorter card
- **Before:** the card was 307 x 451 on a 375 x 812 phone, with 34px between its edge and the screen edge.
- **After:** 331 x 430 on the same phone: 24px wider and 21px shorter. The cards peeking in at the sides show 14px (was 24) with an 8px gap (was 10), which gives the middle card its extra width; the shape is now `CARD_ASPECT = 0.77` (was 0.68). Swiping to the next drink works as before.

## 2026-11-16: Lines instead of handles, labels under the line
- **Before:** a small bar (handle) sat on each boundary between layers and each label was centered in its layer.
- **After:** the handles are gone. Each layer has a thin line along its top (20% of the label color, so dark on light layers and light on dark ones), inset 22px from the card's sides, and the ingredient name and amount sit just below the line, near the top of their layer. The top layer has no line (its label sits 15px down to clear the rounded corners), and the lines were then made lighter, from 20% to 10% of the label color. JP also tried lines in the ingredient's own flat color (too strong) and in the color above nudged lighter or darker, then chose a dark or light see-through line: the label's color at 10%, dark on light layers and light on dark ones. The lines fade out while you press or drag a layer and come back when you let go.

## 2026-11-16: Card a bit bigger; family label back under the name
- **Before:** the card was 3 to 4 (307 x 409 on an iPhone-size screen) and the ingredient list sat under the drink name.
- **After:** the card is a bit taller at the same width: `CARD_ASPECT = 0.68` (307 x 451 on a 375 x 812 phone, about 10% shorter than the original full-height card). The ingredient list is gone from the top and the family label (for example "Spirit-forward") is back in its place, in the same 12px, 55% white style.

## 2026-11-16: Drink card keeps one shape and scales down
- **Before:** the drink card stretched to fill all the height the screen had left, so its shape changed from phone to phone (about 307 x 514 on an iPhone-size screen).
- **After:** the card has a fixed shape, 3 to 4 (width to height, `CARD_ASPECT = 0.75` in `src/components/DrinkPanel.tsx`), and shrinks to fit. On a 375 x 812 phone it is 307 x 409, about a fifth shorter, centered in its space with 40px above and below. On a short phone (375 x 667) it scales down to 258 x 344 and keeps the same shape. On a wide screen it is a centered card of the same shape instead of a tall slab. The cards peeking in at the sides use the same shape, and swiping works as before.
- **Open for JP:** the exact proportion (the Figma frame's panel is nearly square at 370 x 418; 0.75 is my pick); the leftover space around the card is just empty for now.
- **Tested:** measured card sizes on 812px, 667px and wide screens, and swiped to the next drink on the short phone.

## 2026-11-16: Amount buttons only show while you press or drag
- **Before:** the button around each "1 oz" (faint fill, top-edge highlight and blur) was always visible.
- **After:** at rest each amount is just text ("1 oz") in the same place. The button appears around every amount as soon as you press a layer, stays while you drag, and fades away when you let go (about 0.2s). Garnishes and the reset icon are unchanged.

## 2026-11-16: Make edits is about taste (Figma 110:581); family label removed
- **Before:** each drink had up to three flavor-note controls (Herbal, Botanical, Citrus...) with a "−" and a "+". Under the drink name there was an ingredient list, then a family label.
- **After:**
  - **Make edits** uses four plain buttons, shown only when they fit the drink: **Add Sweet** (if it has a sweet ingredient), **Add Bitter** (if it has a bitter one), and **Less Strong** and **More Strong** (if it has alcohol). One button fills the whole row. Examples: Negroni has all four; Shirley Temple has just Add Sweet; Martini has just the two strength buttons; Arnold Palmer has Add Sweet and Add Bitter.
  - **How an ingredient gets mapped:** no new data. Every ingredient already carries sugar, bitterness and ABV (the three numbers the flavor bars use). For each button the drink's best ingredient is chosen from the classic recipe: the sweetest ingredient, counting bitterness against it (so a Negroni sweetens with vermouth, not Campari); the most bitter ingredient, counting sugar against it (Campari, or the bitters in an Old fashioned); the highest-ABV ingredient (the spirit).
  - **What a tap does:** Add Sweet, Add Bitter and More Strong put ¼ oz more of that ingredient in (one more dash for bitters); Less Strong takes ¼ oz out of the strongest ingredient. A line never drops below ¼ oz, and a button dims when it can't go further.
  - **Top of the screen:** the ingredient list now has the family label's style (12px, 55% white) and the family label is gone.
  - The flavor-note controls are replaced (the note data is still in `src/data/flavor.ts`).
- **Tested:** Negroni: Add Sweet took the vermouth to 1¼ oz, Add Bitter took Campari to 1¼ oz, More Strong twice took gin to 1½ oz, and fourteen taps of Less Strong stopped at ¼ oz of gin with the button dimmed; Shirley Temple shows one full-width Add Sweet. All 18 drinks were listed with their buttons.
- **Open for JP:** the cut-offs for "sweet" (8 g sugar), "bitter" (1.5) and "alcohol" (11% ABV) and the ¼ oz step are first-pass numbers in `src/lib/edits.ts`; Gin and tonic and Aperol spritz can end up with Add Sweet and Add Bitter changing the same ingredient (tonic water, Aperol); Less Strong takes the spirit out rather than adding something non-alcoholic.

## 2026-11-16: Total removed for now
- **Before:** a "Total 3 oz" line sat under the drink panel, flush right.
- **After:** gone. The drink's total is still worked out (`totalParts` / `formatTotal` in `src/lib/stack.ts`), so it can come back; Servings is still hidden too.

## 2026-11-16: Flavor profile as stacks of bars (Figma 110:731)
- **Before:** three thin rings with the label above each.
- **After:** three stats, each a 10px label over a stack of five short bars (39px wide, 3px high, 3px apart) that fill from the bottom up: lit bars are white and unlit ones are white at 20%. The labels read "Strength · 27% ABV", "Sweet · High" and "Bitter · High", with a gray name at 45%, a tiny gray dot and a white value, 16px above the bars.
- **How the bars are worked out:** Strength lights one bar per 10% ABV (0 to 50%), so 20% ABV lights 2 bars as in the design. Sweet and Bitter use the same fixed scales as before, rounded to the nearest of five bars. The words follow the bars: 0 to 1 bars Low, 2 to 3 Medium, 4 to 5 High.
- **No jumping:** the three columns are equal and the value has a fixed-width slot, so the bars and labels don't move when the numbers change (checked across seven drinks and several edits).
- **Open for JP:** with the fixed value slot, short words like "High" leave a little empty space after them, so the label looks a few pixels left of center over its bars; Strength used to be a real-percentage ring (full at 100%), and is now 0 to 50% across five bars.

## 2026-11-16: Flavor rings: nothing jumps, and ABV shows the real percentage
- **Before:** when a label changed ("Low" to "Medium", "9%" to "27%") its width changed, and the three rings were spread by their contents, so rings slid sideways. The ABV ring was scaled to 40%, so 21% filled more than half the circle.
- **After:** the three rings sit in three equal columns and each label keeps one fixed size (the value has a fixed-width slot), so the rings and labels stay exactly where they are while the words and numbers change. The ABV ring is the real percentage: a full circle is 100% ABV, so 21% fills about a fifth and 27% a bit over a quarter. A 0% drink shows an empty ring (no dot). Sweet and Bitter are unchanged (Low / Medium / High on a fixed scale).
- **Tested:** across Negroni, Daiquiri (edited with several big drags) and Arnold Palmer, the ring positions (56.5, 165.5, 274.5) and label widths never moved, and the ABV arc matched the percentage (21% gave 0.21 of the circle, 0% none).
- **Open for JP:** with the real scale most drinks fill under half of the ABV ring (a straight spirit is about 40%); a different scale (for example full at 50%) is one number in `src/lib/flavor.ts`.

## 2026-11-16: Make edits follows each drink's flavor notes
- **Before:** three fixed buttons (Less Sweet, Less Sour, Substitution). Many drinks had Less Sour dimmed because they have no sour ingredient.
- **After:** the buttons depend on the drink. Each drink shows up to three of its own flavor notes (for example Herbal, Botanical, Citrus for a Negroni; Oaky, Spiced, Herbal for an Old fashioned), each with a "−" on the left and a "+" on the right for a little less or more of that note. "More herbal" adds ¼ oz of the ingredient that carries most of the herbal note (sweet vermouth); "less citrus" takes ¼ oz out of the one behind the citrus (Campari). Bitters change one dash at a time. A line never drops below ¼ oz, and the matching button dims when it can't go further. The notes and ingredients are worked out from the classic recipe, so the buttons don't change while you edit. Garnishes can't be changed, so a note that only comes from a garnish gets no buttons.
- **Also:** removed the "honeyed" note from white rum and bourbon (it only belongs to honey). The Substitution button is gone from the row for now.
- **Tested:** Negroni: More herbal took the vermouth from 1 to 1¼ oz, Less citrus took Campari from 1 to ¾ oz, and four taps of Less botanical stopped at ¼ oz of gin with the button dimmed; Old fashioned: More spiced took the bitters from 2 to 4 dashes and Less spiced to 3. Labels fit on a phone-size screen.
- **Open for JP:** the notes (and which ingredient carries each) are my first-pass numbers in `src/data/flavor.ts`; one ingredient can carry two notes (bitters carry spiced and herbal), so those buttons move the same ingredient; a drink with one note shows one control (Espresso martini); the step is ¼ oz, and "less" removes the ingredient instead of adding something opposite (this reverses the earlier "adds on top" idea for these buttons).

## 2026-11-16: Tighter garnishes, no Servings, Total under the panel, flat colors while dragging
- **Before:** garnish layers had the same wide blur as the drinks (a 60px garnish blurred out over about 108px), there was a Servings row, the Total sat above the rings, the family tag was under the name with the ingredient list below it, the rings had a small dark dot marking their start, and only the layer you dragged turned to its flat color.
- **After:**
  - **Garnish blur:** every garnish now blurs over a much smaller area (8px of overlap and a 12px blur, instead of about 24px and 32px), so they take up less of the drink.
  - **Servings removed for now:** the cups and the "+" are gone from the screen. The Servings code is still in place (default 1, and the cups are in `src/components/ServingCups.tsx`) so it can come back.
  - **Total:** both "Total" and "3 oz" are 12px and the line sits flush with the right edge of the drink panel, 16px below it (on a phone that's 34px in from the screen edge, lined up with the card).
  - **Under the name:** the ingredient list now comes first, then the family tag (Spirit-forward).
  - **Rings:** the dot is gone.
  - **Dragging:** the moment you start dragging any ingredient, every layer, garnishes included, eases to its flat color, and they all ease back when you let go.
- **Tested:** Negroni on a phone-size and a wide preview. The Total's text lines up with the card's right edge and sits 16px below it, both texts are 12px, and all four layers go flat during a drag and return after.

## 2026-11-15: Fix: layers no longer jump when dragged in busy drinks
- **Before:** in drinks with four or more ingredients (Tom Collins, Mojito, Hot toddy and others), dragging one layer, usually the third from the bottom, made its amount jump by several parts in one small movement (for example 0.25 to 5 parts).
- **Why:** the drag followed the layer's edge on screen. Once the layers below were squeezed down to the 60px minimum height, that edge stopped moving even though the amount could still change, so the math jumped across the gap.
- **After:** the drag now follows the edge in a steady layout without those minimum heights, so a given finger movement always changes the amount by a small, even amount. Layers are still drawn with their minimum heights.
- **Tested:** drags up and down on every ingredient of Tom Collins, Mojito, Cosmopolitan, Hot toddy, Margarita, Moscow mule and Aperol spritz. The biggest change per 6px of finger movement fell from about 5 parts to under 0.2, except at the very end of a drag (the layer almost filling the glass), where one step can still change an amount by up to about half a part.

## 2026-11-15: Smaller filter chips
- **Before:** filter chips were 36px tall with 14px text.
- **After:** 32px tall with 12px text and tighter padding and gaps, a smaller sparkle on "Build my own", and a shorter divider line. More chips show at once before you scroll. Each chip has an invisible 44px-tall tap area around the 32px pill (and a little room left and right), so they stay easy to hit.

## 2026-11-15: Servings shown as cups (try-out)
- **Before:** Servings were three circled number buttons (1, 2, 4) and a circled "+".
- **After:** small line-drawn cup icons: one cup for 1, two cups for 2, four cups (2 x 2) for 4. The picked one is bright and the others are dimmed to 40%. Each has a 44 x 44px touch target, with no outline. The "+" is a plain plus with no outline (still off until custom amounts are built). Screen readers hear "1 serving", "2 servings", "4 servings". The cups live in `src/components/ServingCups.tsx`.
- **Tested:** each cup sets the right total (3, 6, 12 oz for the Negroni), only one is picked at a time, and the row with the Total stays on one line on a phone-size screen.
- **Then:** the cups were made a little smaller (22px wide instead of 28px), and the whole row, the cups with the oz Total, moved from under the ingredient list to just above the flavor bars, under the drink card.
- **Open:** whether the dimmed-versus-bright state is clear enough to read as "picked" without a ring or fill.

## 2026-11-15: Reset icon smaller, black instead of glass
- **Before:** a 44px liquid-glass circle (see-through, blurred, light rim).
- **After:** a 36px black circle at 80% opacity (the drink shows faintly through it) with the same soft drop shadow, and a slightly smaller arrow icon (16px). Everything else is the same: bottom center of each card, only shown once the drink has changed.

## 2026-11-15: Reset becomes a glass icon on each drink
- **Before:** a small text "Reset" button at the bottom of the screen, dimmed until something changed.
- **After:** the text button is gone. Each drink card gets a small round reset icon (a circular arrow) at its bottom center. It only appears once that drink has been changed (an amount or the servings), and tapping it puts the drink back to its classic recipe and one serving. The circle uses a liquid-glass look: see-through, blurred and brightened, with a light rim and a soft highlight, so the drink's colors show through it.
- **Tested:** the icon appears after a drag and after changing Servings, belongs to its own card (swiping to another drink leaves it behind), resets on tap and then hides, and doesn't start a swipe. Checked on phone-size and wide previews.
- **Open:** the 44px circle is slightly larger than "small" so it's easy to hit; the glass look depends on the browser supporting background blur.

## 2026-11-15: Helper text removed
- **Before:** a line under the flavor bars read "Drag a layer down to give it a bigger share... Swipe sideways for other drinks." until the first edit.
- **After:** no helper text; only the small Reset button is left at the bottom, on the right.
- **Open:** the brief (§6) still asks for gesture hints; with the text gone, nothing tells a new visitor that layers can be dragged or the row swiped.

## 2026-11-15: Flavor note tags hidden
- **Before:** up to three note tags (citrus, herbal, botanical...) sat under the flavor bars.
- **After:** only the three bars (Strength, Sweetness, Bitterness) show. The notes are still worked out in `src/lib/flavor.ts` and `src/data/flavor.ts`, so they can come back or feed the Finder later.

## 2026-11-15: Filters in one row
- **Before:** two rows of filter chips (taste, then occasion), each scrolling on its own.
- **After:** one row that scrolls sideways: Classics, Build my own and the taste chips, then a thin light line, then the occasion chips. The "What are you having?" line above it is gone too. Together that saves about 70px, so the drink card is taller.

## 2026-11-15: Parts labels hidden again
- **Before:** each layer read "2 parts" in bold with the oz beside it ("4 oz").
- **After:** layers show only the oz ("4 oz"). Parts are still how drinks are stored and calculated, and `formatParts` in `src/lib/stack.ts` is still there to bring the label back.

## 2026-11-15: Finder filters; counter, Pause and auto-scroll removed
- **Before:** one list of 18 drinks. A "10 / 18" counter, a Pause button and a Reset button sat in a row at the top, and the row scrolled to the next drink by itself every six seconds on phones.
- **After:**
  - **Quick filters** across the top under "What are you having?": two rows of chips that each scroll sideways on their own (the right edge fades). Top row, taste: Classics, Build my own, Bright, Fresh & Herbal, Fruity, Bitter, Boozy, Warm, Rich & Roasted. Bottom row, occasion: Happy Hour, Daytime, Night Out, Nightcap, Cozy, Zero-proof, After Dinner.
  - Picking a chip swaps the drink row to a curated list for it (the old list is Classics, the default). If the drink in the middle is also in the new list we stay on it, otherwise we start at the top. Edits and servings are kept per drink across filters. Short lists work (Zero-proof has two drinks and swipes back and forth).
  - **Build my own** is a placeholder: it shows a sparkle, does nothing, and says "Coming soon" on hover.
  - Removed the counter, the Pause/Play button and the auto-scroll. The ‹ › buttons stay for wide screens and screen readers.
  - **Reset** moved to the bottom, smaller, beside the hint.
- **Open for JP:** every list is my first-pass curation (data in `src/data/finder.ts`); Zero-proof has only two drinks; the mock's heading read "What are having?" and I wrote "What are you having?".
- **Tested:** chips on phone-size and wide previews; Bright, Zero-proof, Nightcap and Warm swapped the row; Next walked each list and wrapped around; Classics restored the full list; Build my own changed nothing.

## 2026-11-15: Simpler flavor profile (three bars and tags)
- **Before:** five lines: Strength, Sweetness, Acidity, a Dilution line and Bitterness, in two groups headed "Calculated from the amounts" and "Chosen by hand".
- **After:** three bars (Strength, Sweetness, Bitterness) in one list with the note tags below. Acidity and Dilution are gone, and so are the two group headings (users don't need to know which numbers are hand-set).
- **What changed in the numbers:** with dilution gone, the values are the drink as poured, not after ice melts, so strength reads a bit higher (Daiquiri 21% instead of 17%; Old fashioned 40%). The bar scales were re-set to match (Strength full at 40%, Bitterness full at 4).
- **Open:** the brief (§3) wants calculated and hand-set values kept visibly apart; this drops that on purpose. `method` stays on each drink but nothing uses it now.

## 2026-11-15: Flavor profile under the drink
- **Before:** there was no flavor profile.
- **After:**
  - On phones the name, family label, ingredient list, Servings and Total stay above the drink card (as before), and the flavor profile and the hint sit below it. (JP first asked for everything below the card, then moved the name and info back up.) On wide screens the left column holds the same things in the same order.
  - **Flavor profile**, in two groups kept visibly apart. *Calculated from the amounts:* Strength (% ABV), Sweetness, Acidity, plus a line for dilution (about 25% water for shaken, 20% stirred, 10% built). *Chosen by hand:* Bitterness and up to three notes (citrus, herbal, oaky and so on).
  - It follows the Share drag live. Servings never change it. A small tick on each bar marks where it started, so you can see what an edit moved (more lime: Acidity slides right, Strength and Sweetness slide left).
  - New data: `src/data/flavor.ts` (ABV, sugar, acid, bitterness and notes for all 40 ingredients, first-pass bartending approximations) and a `method` and placeholder `tags` on each drink. Calculation in `src/lib/flavor.ts`; display in `src/components/FlavorReadout.tsx`.
- **Open for JP:** review the ingredient numbers and note words; the dilution numbers; the feeling and vibe tags (placeholders, not shown yet); body and finish (not built); on a short phone (667px tall) the drink card gets small.
- **Tested:** printed all 18 drinks (Daiquiri about 17% ABV, Negroni most bitter, Old fashioned and Martini strongest, non-alcoholic drinks 0%). In the preview, dragging lime up in the Daiquiri moved Acidity from medium to high and Strength from 17% to 15%; Servings 4 changed nothing; Reset put the bars back on their ticks.

## 2026-11-15: Dragging bitters changes one dash at a time
- **Before:** dragging the bitters layer a little (about 60px) jumped it from 2 dashes to 12, because its layer is held at the minimum height and the drag math read that as a huge change.
- **After:** bitters change by one dash for every 16px you drag (down adds, up removes), between 0 and 12 dashes, and snap to whole dashes when you let go.

## 2026-11-15: Share is the only drag (Add, Trade and the tabs removed)
- **Before:** three drag versions (Share, Add, Trade) with tabs at the top to switch between them.
- **After:** only Share is left, and the tabs are gone. Dragging a layer changes its share of the glass and all the other ingredients rescale in proportion; the total stays fixed and each liquid keeps at least ¼ part. Dashes (bitters) still just change their own count, since they sit outside the ratio.
- **Why:** JP chose Share after comparing. The old code is still in git history (commit d3f593f) if the Add or Trade behavior is ever wanted again.

## 2026-11-15: Servings and a "Share" drag (prototype, from JP's Figma "Interaction Design and Structure")
- **Before:** the drink's total changed as you dragged (Add), or traded with one neighbor (Trade). No way to scale a drink.
- **After:**
  - New **Servings** buttons (1, 2, 4) under the ingredient list. They scale only the oz labels; the parts (the ratio) and the picture never change. The "+" for a custom number is there but off until that feature is built.
  - The Total (e.g. 6 oz, 12 oz at 2 servings) now stays fixed while you edit.
  - New default **Share** drag: change one ingredient and all the others rescale in proportion, so their ratios to each other stay the same. Every liquid keeps at least ¼ part. Amounts round to ¼ part with the sum kept exact. Dashes and garnishes sit outside the ratio and aren't touched.
  - Labels read "2 parts" in bold with the oz beside it ("4 oz"). 1 part = 1 oz in a standard serving.
  - "Drag:" now cycles Share, Add, Trade so all three can be compared. Reset also clears servings.
  - Arrow keys step the focused layer by ¼ part in Share mode.
- **Tested:** Gin and tonic: tonic 4 → 3 parts moved gin 2 → 3 (total 6 oz) and dragging back returned 2 / 4. Servings 2 gave 4 oz gin, 8 oz tonic, total 12 oz with parts unchanged. Cosmopolitan: raising lime kept the total at 4 oz and the other three scaled together; an extreme drag left every other liquid at ¼ part, not 0.
- **Open:** the simplified ratio (1 : 2) as a separate readout; a cap and a custom amount for Servings; what a layer at the floor should look like; whether to remove Add and Trade once Share is chosen.

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
