# Iteration log

Visible before-and-after changes, newest first.

## 2026-11-26: Placeholder illustrations on the guide's mood buttons

- **Before:** each mood button had only its title and short line.
- **After:** each has a 40px round placeholder (dashed outline, picture symbol) to the left of the text, standing in for an illustration to come.

## 2026-11-26: Build my own loses its header, and the guide's questions are plain serif

- **Before:** a "Your Drink" heading (a name you could edit, with a line under it) sat above the guide panel. The guide's questions were in dark rounded bubbles, and the first began "Let's build you a drink."
- **After:** on wide screens the heading is gone and the guide panel starts at the top of the column. Each question is serif text on its own; the first reads "What are you in the mood for?" Your answers keep their bubbles.
- **Also gone with the heading:** renaming the new drink (the guide still names it), and the taste line and Sweet/Bitter ladders in Build my own.

## 2026-11-26: Four concepts for the Build my own guide (exploration, not part of the app yet)

- **Before:** one guide design, a scripted chat (`BuilderChat.tsx`). It is unchanged.
- **After:** a separate page, `/guide-concepts`, with four working alternatives that use the same questions and ingredients: **A** one question at a time with color tiles, **B** the panel laid out like the glass, **C** the drink as a sentence with blanks, **D** each choice says how it will change the taste. Code is in `src/components/concepts/`. Saving isn't wired up.

## 2026-11-25: v2 becomes `main`

- **Before:** `main` was the flat-card mixer with a floating 3D toggle.
- **After:** `main` is the v2 design (Browse and Build modes, the new Edit Panel, Build my own, drink motion, the side lens). The 3D toggle is gone. The old version is bookmarked as the `main-before-v2` tag.

## 2026-11-25: A bigger slosh as the drink arrives (branch `v2`)

- **Before:** when you switched drinks the liquid rocked about 35px each way on the first swing; on page load it only had its usual gentle wave.
- **After:** the slosh is about twice as big when a drink arrives (the card's tilt counts 1.8x for the liquid, the edges may travel up to 92px, and the middle wave shows more). The drink on screen when the page loads also gets one jolt as it fades in, so it arrives sloshing too. Same rocking speed and settle as before; thin layers still slosh less.

## 2026-11-25: Slower main drink on load, side drinks right behind it (wide screens, branch `v2`)

- **Before:** the main drink faded and grew in 0.45s, and the side drinks started only once it had landed (at 0.8s).
- **After:** the main drink takes 0.9s with a softer curve (from 0.35s to 1.25s). The side drinks now come in with it: same start (0.35s), same length and curve, landing together at 1.25s (a 0.1s delay was tried first). The whole load sequence is now about 1.3s, from about 1.5s. Closing the drawer keeps its own timing.

## 2026-11-25: The main drink no longer gets trimmed as it loads in (wide screens, branch `v2`)

- **Before:** since the side lens, the main drink looked cut off at first as it grew in. The browser animates that growth on its own, ahead of the code that moves the lens's window around the drink, so the window trailed the drink.
- **After:** the row of drinks and the lens grow as one piece, so neither can trail the other. The same kind of gap is also closed when Build mode zooms the drink in: the window opens to the final size straight away.

## 2026-11-25: A lens flare on the real side drinks (wide screens, branch `v2`)

- **Before:** curved glass over the side drinks (`side-glass-v1`): subtle, and warping only in Chromium browsers.
- **After:** toward each page edge a side drink stretches outward, flares taller, splits into faint colored fringes, smears and melts into the page. The middle drink is still the live card with no effect, and the lens starts from nothing at its edge, so drinks bend gradually as they move out. It mirrors the real cards (position, tilt, fades, wave, words), so the carousel's motion, clicks and Build mode work as before.
- **Then (JP):** the lens begins a little way out from the middle drink instead of at its edge (a third of the way at first, then 0.18, with the flare raised from 0.26 to 0.4, and the side gradient lengthened from 195px to 280px, with the far edge melted further into the page so it shows no line), and the app's original side gradient is back at full strength over the top of it.
- **How:** `src/components/SideLens.tsx`, written for this app using the technique tried with the Warp Carousel experiment; it doesn't use that component's code. It needs WebGL2 (without it, just the old fade). `SIDE_EFFECT` in `DrinkPanel.tsx` switches between "lens", "glass" and "none"; tune `LENS`.
- **Stronger (JP):** flare 0.4 to 0.62, sideways stretch 0.26 to 0.31, colored fringes 0.07 to 0.1, smear 22px to 30px.
- **Fix:** a hard line showed down a drink as it slid from the middle into the lens. The copy was painted a frame behind the real drink, the side gradient started at full steepness at the join, and the copy was a little less sharp. All three are fixed.
- **OPEN:** speed on a slower computer isn't measured (it repaints a copy of the side drinks on every moving frame); Safari not tested; phones have no lens.

## 2026-11-25: Experiment: the Warp Carousel component (branch `v2`, not part of the app yet)

- **Saved first:** the side-glass version is commit `15fe8cc`, tagged `side-glass-v1`.
- **Added:** the pasted "Warp Carousel by Louis Studios" component in `src/components/ui/warp-carousel.tsx` (one addition: a card can paint itself). `/warp` shows it as it comes; `/warp/drinks` shows your drinks on its cards, with a lens-strength slider.
- **Compared with the side glass:** its flare is far smoother and more dramatic, with colored fringes, and it is drawn with WebGL, which Safari supports. But its cards are still pictures (no dragging, no slosh), they turn in 3D so side labels read backwards, and its layout is its own.
- **OPEN:** whether to bring its lens into the real carousel; and the component's license, to check before it goes into the public repo.

## 2026-11-25: Curved glass over the side drinks (wide screens, branch `v2`)

- **Before:** the side drinks only faded toward the page edges.
- **After:** curved glass over each side. The middle drink stays perfectly clear; the glass starts at its edge doing nothing and warps more and more toward the side of the page: the side drink stretches outward, its top sweeps upward and its bottom downward, and it softens. Drinks bend gradually as they move out. Nothing is drawn on the glass. It goes away while the drink is zoomed in. Tune `GLASS` in `src/components/SideGlass.tsx`.
- **Tried on the way:** a gentler warp, arched ends that pinched the drink inward, a highlight along the glass edge, and a warp strongest next to the middle drink. JP asked for a stronger, upward warp with no outline, then for a gradual one that builds from the middle outward.
- **OPEN:** only Chromium browsers (Chrome, Edge, Arc, Brave) can bend what is behind the glass. Safari and Firefox get only the gradual softening. Phones have no glass. Smoothness on a slower computer isn't checked yet.

## 2026-11-25: A solid dark Done button (branch `v2`)

- **Before:** Done was a light frosted pill with a bright edge.
- **After:** it is the same solid dark color as the panel's other buttons, over the same fade as before. Save as a new drink beside it matches. (A see-through version with a soft blur was tried first; JP chose solid.) The dashed "Add a …" buttons also went from 40px to the standard 36px.

## 2026-11-25: Added ingredients sit straight on the panel (branch `v2`)

- **Before:** each ingredient in Structure sat in a dark pill.
- **After:** no pill. The color dot lines up with the role heading. The − / + / × buttons keep their dark round fill (JP). The empty roles' dashed buttons are now the only boxed rows.

## 2026-11-25: "Add another" is a plus on a line (branch `v2`)

- **Before:** a role with an ingredient in it had a dashed "+ Add another" button under it, the same weight as an empty role's button.
- **After:** it is just a plus with a thin line running to each side of the panel, which brightens on hover. To save height it is 24px tall instead of 40, sits closer to the ingredient above, and the space between roles went from 24px to 16px: each filled role is about 28px shorter. Empty roles keep the dashed "+ Add a …" button, so they stand out. Desktop and phone.

## 2026-11-25: Structure shows filled roles first (branch `v2`)

- **Before:** Structure listed the roles in stack order, so filled and empty roles were mixed.
- **After:** in the Structure tab, the roles with something in them come first, then the empty ones. Each group keeps the stack order. It updates as you edit: a role moves up when you add its first ingredient and down when you remove its last. Desktop and phone. All ingredients keeps its fixed category order (JP).

## 2026-11-25: Tried side drinks leaving before the Edit Panel opens, then reverted (branch `v2`)

- **Tried:** on opening, the side drinks slid out and faded first (0.34s), then the panel rose and the drink zoomed.
- **Decision:** JP reverted it. Opening is as before: the drink info fades, then the panel rises while the drink zooms and the side drinks fade in place.

## 2026-11-25: The title lands with the drink (branch `v2`)

- **Before:** the title (1.3s) looked settled about 0.15s before the drink card had stopped.
- **After:** the title takes 1.63s with the same soft curve, so both look still about 0.87s after the switch. Worked out from the motion's maths, to within about a pixel. JP then asked for it slightly faster: 1.35s, so the title now lands about 0.13s before the card.

## 2026-11-25: Slower waves (branch `v2`)

- **Before:** the usual wave passed a hump about every 3s, and the slosh rocked about every 0.65s.
- **After:** everything is slower: a hump about every 5.5s, the slosh about once a second, and the humps race less while stirred up. The slosh calms in about the same time as before.

## 2026-11-25: The liquid sloshes when the drink lands (branch `v2`)

- **Before:** the base layer's wave slid along at an even pace, whatever the card was doing.
- **After:** when the card tilts, the base liquid tries to stay level, runs past level and rocks from side to side: about 40px up at one edge and down at the other on the first swing, then 37, 30, 22, 16 and smaller, dying out after about 4s. A quicker, smaller wave rises and falls in the middle, and the little humps race while the liquid is stirred up, then calm to the usual wave. Thin layers slosh less. Only the drink in the main position sloshes: one that leaves goes flat in about a quarter second, and the side drinks stay still (JP, 2026-11-25). Off with "reduce motion".
- **How:** two damped springs (side to side, and middle) in `DrinkCard.tsx`, driven by the card's tilt. Tune `SLOSH` there.
- **OPEN:** only the base layer's surface moves; the lines between the other layers stay flat.

## 2026-11-25: The drink cards swing when you switch (branch `v2`)

- **Before:** the cards slid flat and eased to a stop.
- **After:** while the row moves, the cards tilt to the side (up to about 5 degrees), the top trailing behind the movement. On landing they slide about 3% of a card past their spot, come back, and rock slightly the other way before settling, about 1.3s in all. It also follows a finger swipe. At rest there is no rotation, so text stays sharp. Off with "reduce motion". (A first version tipped the cards back and turned them in 3D; JP asked for a side tilt instead.)
- **How:** an underdamped spring follows the row's speed. The amounts are in `SWING` at the top of `DrinkPanel.tsx`.

## 2026-11-25: The title fades in when you switch drinks (branch `v2`)

- **Before:** the name and taste line changed instantly.
- **After:** they fade in with a short slide from the right, whichever way you went (1.3s with a long, soft landing; 0.4s and 0.85s were tried first). No motion with "reduce motion".
- **Decision:** JP chose always from the right. A first version followed the carousel's direction.

## 2026-11-25: Softer drink description (wide screens, branch `v2`)

- **Before:** the paragraph under the drink name was full white. **After:** it is 80% opacity (70% was tried too), so the name stands out more.

## 2026-11-25: Tried Build my own pinned to the right, then reverted (branch `v2`, Figma 256:1948)

- **Tried:** on wide screens, Build my own pinned at the right end of the nav in full white with the glow always on, 14px slash spacing and fainter slashes.
- **Decision:** JP reverted it the same day. The nav is as before: Build my own first in the row, dim until selected, glow on hover.

## 2026-11-25: Remove a saved drink; new icon on Build my own (branch `v2`)

- **Before:** a saved drink couldn't be removed. Build my own had a white sparkle icon.
- **After:** on a drink you made, Browse mode (wide screens) shows **Remove drink** under Make edits and Substitutions, lined up with the serving buttons. The first click changes it to "Click again to remove" (it resets if you move away), because it can't be undone. Removing the last one brings Classics back and hides My Drinks. Build my own now has the colored AI sparkle (Figma 268:11), always at full strength (the label still dims until you are in Build my own).
- **OPEN:** phones have no Remove drink button yet.

## 2026-11-24: Capitals get 1px letter spacing (branch `v2`)

- **Before:** the small capitals (filters, buttons, panel tabs, section headings, ingredient chips) used 0.08em, which is 0.8px at 10px.
- **After:** 1px everywhere that style is used. The ingredient names on the drink card are a different style and are unchanged.

## 2026-11-24: More room around the filter slashes (branch `v2`)

- **Before:** 14px between each filter and its slash. The Build my own button has 14px of padding of its own, so the slash after it either looked twice as far away or touched the button's edge.
- **After:** 22px between every word and slash. The slash after Build my own sits 8px clear of the button. The row is a little longer, so fewer filters fit before you scroll.

## 2026-11-24: Build my own is a glowing button (branch `v2`, Figma 262:3043)

- **Before:** "Build my own" was plain text like the other filters.
- **After:** a 36px pill in the page's color with a sparkle icon and a still, soft drop shadow in a pink to orange to purple gradient. The shadow shows only on hover (or keyboard focus), easing in and out over 0.5s, so touch screens don't show it. It was then made a bit more vibrant than the Figma frame (a 13px strip with a 14px blur and 1.25x saturation, from 8px and 15px; 18px, 13px and 1.5x was tried first and was too strong). Its label and sparkle are half white like the other filters, and full white only while you are in Build my own. (A first version had a glow travelling clockwise around the button in four colors; JP chose the still one the same day, and the Figma frame was updated to it.)
- **OPEN:** on a phone the button still does nothing (the phone version of Build my own isn't designed).

## 2026-11-24: The page reveals itself after loading (wide screens, branch `v2`)

- **Before:** everything appeared at once.
- **After:** a quick sequence, about 1.5s in all. 1. The top squiggly line draws in from the left (0.1s). 2. Together: the browse filters fade in from the right and the drink info (name, ladders, story, buttons) fades in from the left (0.4s). 3. Together (at 0.35s): the servings buttons and total fade in from below, and the main drink fades in, growing from 92% size. 4. The side drinks slide in from their sides with the ‹ › buttons (starts at 0.8s, 0.65s). Skipped with "reduce motion". Phones don't play it.
- **OPEN:** JP asked for 0.01s on the line; that is shorter than one screen frame, so it is 0.1s.

## 2026-11-24: Closing the drawer, in order (wide screens, branch `v2`)

- **Before:** on Done, the drawer, the zoom, the side drinks and the ‹ › buttons all came back at once.
- **After:** two steps. 1. The drawer goes down and the main drink zooms back (0.6s), with the soft edge on the sides coming in as it does (0.3s). 2. Once the drawer is down, the side drinks slide into their places (the left one from the left, the right one from the right, 0.65s), the ‹ › buttons come back, and the drink info fades back in, all at the same moment.

## 2026-11-24: Drink info fades out before the Edit Panel comes up (wide screens, branch `v2`)

- **Before:** clicking Make edits or Substitutions started the slide, the zoom and the fades at the same moment, with the drink info still showing under the rising panel.
- **After:** two steps. First the drink info (story, Best prepared, the two buttons) fades out (0.12s). Then the panel slides up while the drink zooms in and the other drinks fade. Closing runs the other way: the panel slides down and the drink zooms back, then the drink info fades back in.

## 2026-11-24: Edit Panel slides, drink zooms (wide screens, branch `v2`)

- **Before:** Build mode swapped the panels instantly, and the other drinks and the ‹ › buttons vanished at once; the scrollbar ran the whole panel height; Done was a narrow pill.
- **After:** the Edit Panel slides up from the bottom of the page when Build mode opens and back down on Done or Esc (about 0.45s, with Browse's content underneath until it lands). At the same moment the drink zooms in, and the other drinks and the ‹ › buttons fade out (0.6s, same easing); closing reverses all of it. The scrollbar starts under the Structure / All ingredients tabs. Done spans the panel's width inside its 20px margins (with Save as a new drink it shares the row). "Reduce motion" turns the slide off.

## 2026-11-24: Servings buttons carry the word (branch `v2`, Figma 257:2802)

- **Before:** round 1 / 2 / 4 / + buttons with the chosen one outlined in white, "Servings" under them, and "1 serving · 3 oz per serving" under the total.
- **After:** the chosen button is a pill with the word ("1 Serving", "2 Servings"; also for a custom number), the others are plain round buttons with a dimmer number. Picking another one grows its pill and shrinks the old one smoothly (about 0.3s, the words cross-fade; instant with "reduce motion"). The total is bigger (24px) with just "3 oz per serving" under it. The "Servings" label under the buttons is gone.

## 2026-11-24: v2 on phones: the main branch's mixer with the new edit panel (branch `v2`)

- **Before:** phones got the earlier v2 flow (loader, empty glass, guide).
- **After:** phones get the same mixer as wide screens and `main` (carousel, flat card, serving row). The closed edit panel at the bottom holds only **Make edits** and **Substitutions**. Tapping either (or swiping the panel up, or tapping the grabber) opens the drawer as on `main`, now with **Structure** and **All ingredients** tabs, and **Done** closes it. Make edits opens Structure; Substitutions opens All ingredients. The old Mix button is replaced by Done.
- **OPEN:** Build my own and My Drinks are wide-screen only for now; the loader flow is no longer shown (still in `src/components/flow/`).

## 2026-11-24: v2 on wide screens: Browse mode, Build mode, Build my own (branch `v2`)

- **Before:** v2 was the loader, then one screen with an empty glass, the classics across the top and the guide plus a Roles panel underneath. Wide screens had no Browse view.
- **After** (from Figma "New Flows", 256:2801; wide screens only, phones keep the earlier flow; `src/components/Home.tsx` picks):
  - **Browse mode (starts here):** the main branch's carousel and filters. Under the name sit the drink's story, "Best prepared" (the prep icons), and two buttons, MAKE EDITS and SUBSTITUTIONS. The Sweet and Bitter ladders sit top right.
  - **Build mode:** either button opens the Edit Panel. The drink zooms in (x1.127) and the other drinks fade away. The panel has two tabs: **Structure** (+/− Sweet and Bitter, then every role with − / + / remove) and **All ingredients** (swap by category). Done goes back to Browse; Esc does too.
  - **Build my own** (first filter): an empty glass and the guide in the Edit Panel. Once the guide finishes, it gives the drink a made-up name, which you can change by clicking the name. **Save as a new drink** adds it under a new **My Drinks** filter (kept in this browser). Once you have started, the panel also gets Structure and All ingredients tabs.
  - **Save from Build mode:** after editing a classic, a second button saves it as "My <drink>".
- **Also:** the Browse card is 584 wide at 1440 x 1003 as in Figma (`cardScale` 0.785), and the left column is 475 wide.
- **OPEN:** the paragraphs under each name are first-pass copy (only the Negroni's is from the design); the loader doesn't show on wide screens; a saved drink can't be renamed or deleted yet; the phone version of Browse / Build isn't designed.

## 2026-11-24: Floating 3D toggle (Concept C on main)
- **Before:** `main` only had the flat card.
- **After:** a small "3D" pill floats at the right, under the browse filters and the prep icons. On, the drink becomes Concept C's turning glass-shaped slabs (`ExplodedDrink.tsx`, copied from `v2`) at full width, with three dots under it to move between drinks. Off (the default) is the flat card with the peeking neighbors. Edits are kept per drink in both views.
- **Wide screens, 3D:** the stack's box takes the full column height (up to 560px wide) and the slabs grow up to 1.5x their phone size to fill it (`MAX_3D_SCALE`, `MAX_3D_WIDTH` in `DrinkPanel.tsx`).

## 2026-11-23: v2, a flow (branch `v2`)

- **Before:** the app opened straight on the mixer: a carousel of flat drink cards with the edit panel under them.
- **After:** the app is a flow, built beside the mixer (`src/components/flow/`; the old mixer is untouched, and `src/app/page.tsx` decides which one shows):
  1. **Loader:** a dark screen with a glass silhouette in a slightly lighter dark that melts from a martini glass into a coupe, a wine glass and a highball, then dissolves into the next screen (about 3s; a still glass with "reduce motion").
  2. **"What are you having?":** the browse filters and a carousel of the original flat drink cards (the middle one at full size with its wave, the others smaller and dimmer). Under it: name, taste, ABV, the sweet / bitter ladders and the prep illustrations. No edit panel. "Not sure? Build my own" sits at the bottom.
  3. **Tap a drink:** the chosen card grows a little while the others fade, and the drink screen comes in with two panels: every ingredient (the drink's own outlined), and the drink's ingredients grouped by role (− / + for amounts, remove, add). A "Serve" button is there as a placeholder.
  4. **Build my own:** the same zoom to an empty glass with a guide (a scripted chat: mood first, then one role at a time, with suggestions) and the roles panel. Each answer adds a layer live. Serve turns on once there are two liquids.
- **Cubes tried and dropped (same day):** turning 3D cubes (plain, then rounded, then shader-drawn) were built and removed at JP's request. The choose screen uses the original flat cards again, so the 3D and spinning code is gone. Only the five nearest cards exist at a time.
- **Opening screen changed (later the same day):** the "What are you having?" carousel is gone. After the loader you land on the empty glass, with the classic cocktails across the top as pills (tap one to fill the glass) and the guide and roles panels underneath. Starting the guide clears the glass and asks about every role.
- Phones put both panels in one sheet with tabs; wide screens put them either side of the drink.
- Not yet: the guide is scripted (no AI; the text box is a placeholder), Serve does nothing.

## 2026-11-24: v2: Card / Glass / Block toggle (Concepts C and D in the flow)
- **Before:** the glass in v2 was always the flat card.
- **After:** the toggle has a third option, Block (Concept D: one solid turning block); `ExplodedDrink` now takes a `stackStyle` prop. Originally: a small Card | Glass toggle at the top left of the drink column. Glass shows Concept C's turning, glass-shaped 3D slabs (`ExplodedDrink.tsx`, copied from `concept-c`); dragging a slab, the arrow keys, servings and the roles panel all work the same. Card is the default.

## 2026-11-18: Wide screens: chevrons for the browse filters

- A mouse can't swipe the filter row sideways, so on wide screens there is now a small round frosted chevron button at each end (28px, the drawer's dark color at 70% with a blur). Each one only shows when there are more filters in its direction, and a click glides the row about two-thirds of its width. The mouse wheel also scrolls the row sideways. Phones are unchanged (you swipe).
- Each end of the filter row now fades out only when there are more filters past it. On wide screens the left fade had been cutting into "Classics" before you scrolled.

## 2026-11-18: Wide screens: smaller prep icons

- The Stirred / Rocks illustrations in the header are 36×36px on wide screens (were 42). Phones keep 42. The size is also a slider in the design editor (Layout: "Stirred / Rocks icons").

## 2026-11-18: Desktop values from the design editor (third pass)

- Spacing: card to serving buttons 16px (was 8), card to ‹ › buttons 12px (was 8); the rest unchanged (24 / 16 / 16 / 24). Layout unchanged (fade 165px, card 0.89, height cap 1000px).
- Text on wide screens: browse filters 10px (was 12), drink name 50px, label under the name 12px (was 14), Stirred / Rocks 12px (was 14), card ingredient names 10px (was 11), card amounts 14px (was 16), card oz / Garnish 12px (was 14), serving buttons 12px, "Servings" 12px, total 18px, line under it 12px, edit pills, categories and ingredient names 10px.

## 2026-11-18: The spacing panel is now the design editor

- Renamed to "Design editor" (the button reads DESIGN). Its sliders are grouped into Spacing, Layout and Text, and Text now covers every piece of type on wide screens: browse filters, drink name, the label under it, Stirred / Rocks, the card's ingredient names, amounts and oz / Garnish, the serving buttons, "Servings", the total and the line under it, the edit pills, ingredient categories and ingredient names. Drag its header to move it anywhere (it remembers where; double-click the header to put it back in the corner). "Copy values" copies every value, grouped. Still dev only.

## 2026-11-18: Desktop spacing, second tuning pass

- Wide screens: the MAKE A SUBSTITUTE pill is gone (the ingredients are always shown under the pills there, so it had nothing to open). Phones keep it.

- JP's new values from the spacing panel: 24px above the filters (was 30), 16px filters to the squiggly line (was 22), 16px line to the drink name (was 30), 24px label to the edit panel (was 30), 8px card to the serving buttons (was 24), 8px card to the ‹ › buttons (was 16), 165px side fade (was 240), card size 0.89 (was 0.8), height cap 1000px (same); text: total 18px (was 22), the line under it 12px (was 14), "Servings" 12px (was 14).

## 2026-11-18: Frosted ‹ › buttons; slightly bigger layer names

- Wide screens: the ‹ › buttons beside the card are now see-through (the drawer's dark color at 50%) with a background blur, so the side drinks show softly through them.
- On the drink card the ingredient names are 11px (were 10), on every screen size. The names in the drawer are unchanged.
- Wide screens: the pills at the top of the edit panel (MAKE A SUBSTITUTE, MORE SWEET...) wrap onto more lines instead of scrolling sideways (8px between lines). Phones keep the single scrolling row, so the closed drawer stays one row tall.

## 2026-11-18: The edit panel's scrollbar is drawn by the app

- JP wanted the bar longer, smoother and fully rounded. The browser's own scrollbar can't do that reliably (the earlier trick made it move unevenly), so it is hidden and the app draws its own: a 4px fully rounded bar in faint white (brighter on hover) inside the panel's right edge, 80% of the length the browser would give it, running the full height (24px clear of the rounded corners). It moves exactly with the scroll and can be dragged. Setting: `THUMB_SCALE` in DrinkPanel.tsx.

## 2026-11-18: Serving row text sizes; scrollbar runs the full height again

- From the spacing panel: on wide screens the total is 22px, the line under it 14px and "Servings" 14px.
- The edit panel's scrollbar runs the full height of the panel again. Before, its track had been shortened to the middle half to make the bar half as tall, so it never reached the top or bottom. Now the track is full height and only half of the bar is drawn: at the top of the list the bar sits at the very top, at the end it sits at the very bottom, so it is still half as tall but travels all the way.

## 2026-11-18: "Servings" under the serving buttons

- A small "Servings" label sits 8px under the 1 / 2 / 4 / + buttons, in the same style as the line under the total (10px on phones, 12px on wide screens, 50% white). The total now lines up with the bottom of the row, so its second line sits level with "Servings". The drink card is a little shorter to make room.
- The spacing panel (dev only) has three new sliders for wide screens: the total's text size (16px), the line under it (12px) and "Servings" (12px).

## 2026-11-18: The base wave runs all the time

- The wave along the top of the base ingredient no longer plays for 3 seconds and stops: it keeps sliding along at full size (about one hump every 3 seconds) on every screen size. When you start dragging a layer it eases down to a still, flat line over 1.2 seconds (smooth at both ends), and after you let go it slowly comes back over 2.4 seconds. Only the drink on screen moves; with "reduce motion" it stays flat. It is now drawn directly each frame instead of through React, so running continuously stays light.
- OPEN: the speed and the two timings are first guesses (WAVE_SPEED, WAVE_DOWN_MS, WAVE_UP_MS in DrinkCard.tsx); not yet checked for battery or smoothness on a real phone.

## 2026-11-18: Desktop spacing tuned with the spacing panel

- JP's values from the panel are now the defaults: 30px above the filters (was 36), 22px filters to the squiggly line (was 24), 30px line to the drink name (was 36), 30px label to the edit panel (was 24), 24px card to the serving buttons (was 16), 16px card to the ‹ › buttons (same), 240px side fade (was 200), card size 0.8 (same), page height cap 1000px (was 900).

## 2026-11-18: A spacing panel for tuning the desktop layout (dev only)

- When the app runs on JP's computer (`npm run dev`), a small SPACING button sits bottom right. It opens sliders for the wide-screen gaps (above the filters, filters to the squiggly line, line to the drink name, label to the edit panel, card to the serving buttons and to the ‹ › buttons), the side drinks' fade, the card size and the page height cap. The layout follows the sliders live; "Copy values" copies them to paste to Claude, and a refresh undoes everything. It never appears on the live site. The values live in `src/lib/tuning.ts`.

## 2026-11-18: Wide screens: more room around the header

- On wide screens the browse filters sit 36px below the top of the window (was 24) with 24px (was 16) between them and the squiggly line. There are 36px (was 16) between the squiggly line under the filters and the drink name, and 24px (was 16) between the label and the edit panel. The right side moves down with the header, so the two sides stay centered on each other. Phones are unchanged.

## 2026-11-18: Wide screens: bigger type in the header and filters

- On wide screens the drink name is 50px (was 40), the label under it and the prep labels (Stirred, Rocks) 14px (were 12), and the browse filters 12px (were 10). Phones are unchanged.

## 2026-11-18: Wide screens: the edit panel runs to the bottom again

- The edit panel no longer stops at the serving row's line: it runs to the bottom of the page (the page is at most 900px tall). The card and serving row, together, are centered top to bottom against the left side (from the drink name to the bottom of the edit panel), at any window size.

## 2026-11-18: Wide screens: one bottom line, and at most 900px tall

- On wide screens the drink card now starts at the top of the right column, level with the drink name, with the serving row 16px under it; the edit panel in the left column ends on the same line as the serving row, so both sides start and end together (this replaces the "40px shorter" panel from earlier today, and a first version where the card sat at the bottom of the page). The whole layout stops growing at 900px tall and stays at the top of taller windows, like the 1440px width cap.

## 2026-11-18: Wide screens: bigger amounts on the card

- On wide screens the amount on each layer is 16px (was 13) and its "oz", like "Garnish", 14px (was 12). The ingredient names stay 10px. Phones are unchanged.

## 2026-11-18: Wide screens: the serving buttons sit right under the card

- On wide screens the serving buttons (1, 2, 4, +) and the total line up with the card's left and right edges and sit 16px under it, instead of running along the bottom of the whole right column. On wide screens the total is 16px (was 14) and the line under it 12px (was 10).

## 2026-11-18: Wide screens: the edit panel is 40px shorter

- On wide screens the edit panel in the left column stops 40px higher than before (its scrolling area is 40px shorter, leaving room under it), and its bottom corners are rounded (30px, like the top) instead of cut off by the scrolling. An 80px fade in the panel's color sits at the bottom (eased, like the side drinks' fade) to show the list scrolls; the panel has 80px of room at the end so the last ingredients can scroll clear of it. A thin rounded scrollbar in faint white (18%, brighter on hover) runs inside the panel along its right edge (the scrolling area has the panel's color), along the middle half of the panel's height, so the bar is half as tall as before. Phones are unchanged.

## 2026-11-18: The page is at most 1440px wide

- On screens wider than 1440px the whole layout stops growing at 1440px and sits centered, with the same dark background on either side.

## 2026-11-18: Wide screens: the side drinks show, fading out

- On wide screens the drinks before and after now show beside the card, as on a phone: smaller (86%), darkened, and fading out toward the panel's edges (a fade that starts at the middle card's edges and is gone 200px past them, dropping quickly in the gap beside the card and then trailing off very gently, so only a soft strip of each side drink shows; JP asked for less of them after a first, wider fade, then for a smoother gradient than the first straight one). The ‹ › buttons sit on top of them. Switching drinks now slides the row (it used to jump), and a sideways mouse drag or a click on a side drink also works. 32px between the card and a side drink.

## 2026-11-18: Wide screens: the drink card is 80% of its size

- On wide screens the drink card is 80% as big as before (width and height, same shape), centered in the right panel; the ‹ › buttons follow it. (Half size was tried first and reverted.) Phones are unchanged. Setting: `DESKTOP_CARD_SCALE` in `DrinkPanel.tsx`.

## 2026-11-18: Wide screens: ‹ › buttons beside the drink card

- On wide screens the previous / next buttons moved from the top of the left column to the right panel: a 44px round button on each side of the drink card, vertically centered, 16px from it. They use the drawer's dark fill (#21201E, a little lighter on hover) with a thin chevron. The card leaves room for them. Phones are unchanged (you swipe; the old buttons stay for screen readers only).

## 2026-11-16: Edit panel: no glass look, the app's own background color with a blur

- The edit panel's lighter translucent gray and the extra color saturation behind it are gone. It is now the app's background color (#1A1612) at 80% opacity with a 20px background blur, so it reads as the same dark as the page while still softening what passes behind it. The white 0.5px border and the soft shadow stay. The fallback (no blur support, or "reduce transparency") is solid #1A1612.
- OPEN: the 80% opacity is a first guess; lower it to show more blur, raise it for a flatter panel.

## 2026-11-16: The edit panel's border is 50% opacity

- The edit panel's 1px white border is now at 50% opacity (JP wrote ".5"; read as 0.5, not 0.5 percent, which would be invisible).

## 2026-11-18: A floating MIX button in the drawer

- Once the drink has been changed (a MORE / LESS pill, or a swap in the drawer) and the drawer is up, a rounded glass button that says MIX floats at the bottom center (blurred, lightly white, a bright top edge; text in the buttons' style). Tapping it closes the drawer so you see the result. It fades in and out; it is not there before the first edit.
- JP confirmed: the button closes the drawer, sits at the bottom with 24px of margin below it. OPEN: whether it should also show on the closed screen; the glass look is a first try.

## 2026-11-17: No thin line under the wave

- JP saw a thin line of the upper layer's color along the bottom of the base layer's wave. The wave strip was drawn as two shapes that shared the same bottom edge, so that edge pixel blended both with what is underneath. The upper color now stops 1px above the strip's bottom edge, where the wave shape already covers everything, so nothing shows. (Instead of moving the wave down a pixel, which would only have moved the line.)
- OPEN: not yet checked on a real phone screen at 2x or 3x pixel density.

## 2026-11-17: Stronger and Lighter

- The strength pills now read STRONGER (was MORE STRENGTH) and LIGHTER (was LESS STRENGTH). The sweet and bitter pills keep More / Less. They do the same thing as before.

## 2026-11-17: A little more space above the drawer's buttons

- JP asked for a little more room at the top and only 16px at the bottom: 34px above the pills (was 28), 16px below (was 28). The closed panel is 86px tall (was 92), so the drink card gets 6px taller than before this change.

## 2026-11-17: Equal space above and below the drawer's buttons

- The row of pills (MAKE A SUBSTITUTE, MORE SWEET...) now has 28px above it (was 42) and 28px below it, where the ingredient list starts and scrolls away (it used to start 2px under the buttons, so chips peeked out beneath them). The closed panel is 17px shorter (92px, was 109), so the drink card gets 17px taller.

## 2026-11-17: 2px less between the title and the label in the drawer header

- With the drawer open, the label under the drink name (and the Sweet / Bitter ladders beside it) sit 2px closer to the name (the gap closes by 16px as the drawer rises, was 14).

## 2026-11-17: The open drawer's title lines up with the browse filters

- With the drawer open, the top of the drink name now sits at the same height as the top of the browse filter text when the drawer is closed (the header moves up 55px, was 40; first 59, then 4px lower at JP's request, so the title now sits 4px below the filters' top). The labels and the Sweet / Bitter ladders move up with it, so there is more room between them and the drawer's wavy edge.

## 2026-11-17: Ingredient names in the drink panel are 10px

- The ingredient names on the drink's layers (ORANGE PEEL, CAMPARI...) are 10px, the same size as the button text (were 12px). Weight, capitals and spacing are unchanged; the amounts (1 oz) stay 12px.
- OPEN: the buttons also use wider letter spacing (0.08em); the layer names keep their tight spacing unless JP asks.

## 2026-11-17: Drawer category names match the buttons

- The category names in the drawer (Spirit, Liqueur, and so on) are now 10px, uppercase, with the buttons' letter spacing (were 14px). Still 50% white.

## 2026-11-17: A Less button for sweet and bitter too

- The pills under the drink are now MAKE A SUBSTITUTE, MORE SWEET, LESS SWEET, MORE BITTER, LESS BITTER, MORE STRENGTH, LESS STRENGTH (the words, not + and - signs), each only when it applies to the drink (a drink with no sweet ingredient has no sweet pills, and so on). A pill is dimmed when it can't go any further. Less Strength is back (it had been hidden). Names are More / Less for screen readers. The row scrolls sideways.
- OPEN: the Less buttons take a quarter part out of the same ingredient the More button adds to (the one doing the job best in the classic recipe).

## 2026-11-17: A squiggly line under the browse filters

- A thin wavy line (the same wave as the edit panel's top edge, white at 60%) runs under the browse filters, 16px in from each side of the screen. It moves back and fades with the filters when the drawer opens.
- OPEN: the space it takes (about 15px) pushes the title down a little; its look is a first try.

## 2026-11-17: Sweet and Bitter are two ladders again

- The open drawer's header shows the two separate glow ladders again (the look from 2026-11-16, Figma 180:39) instead of the one Sweet-to-Bitter slider: five stacked steps each, lit from the bottom (gold for Sweet, purple for Bitter), the name under each in the label's style. Strength is not shown (ABV is in the label). Component: `FlavorLadders.tsx`; the slider is parked in `src/components/parked/TasteSlider.tsx`.
- OPEN: the ladders stack above the labels, so they reach higher than the old single row and sit beside the drink name.

## 2026-11-17: Equal space around the serving buttons

- The extra space between the serving buttons and the drawer is gone: the drink panel moved down (and is taller) so the gap between the serving buttons and the drawer's wavy edge (about 18px) is about the same as between the drink panel and the serving buttons (about 20px).

## 2026-11-17: New reset icon, on a dark see-through circle

- The reset button on a changed drink uses the icon from Figma 204:48 (`public/icons/reset.svg`) in place of the old arrow, and its glass background is now plain black at 30% opacity (no highlight edge). It is 36px, the same as the serving buttons (icon 20px), and sits at the bottom center. When tapped it just fades out; it no longer shrinks.
- OPEN: the 30% is a first guess.

## 2026-11-17: The closed drawer peeks at the ingredients (reverted the same day)

- JP took the peek out again: the closed panel is back to 109px with only the grabber and the buttons, and the ingredients fade in as it rises. The spacing under the serving buttons (next entry up) stays. The description below is what it was.

- The closed edit panel is 72px taller (181px, was 109). Under the buttons you now see the first ingredients (the Spirit title and its first row of chips), fading out into a scrim in the panel's own color. The scrim fades away as the panel rises, and a tap or swipe up on it opens the panel. The drink card above gets 72px shorter to make room.
- OPEN: how much to show (one row or two), and whether the card should shrink or the peek should overlap it.

## 2026-11-17: The Sweet-to-Bitter slider is back, in the drawer header

- The blob below was replaced (same day) by the Sweet-to-Bitter slider, top right of the open drawer, 140px wide next to the drink name: "Balanced · Intense" above a glowing purple-to-gold track with a marker. It follows the drink as you swap ingredients. The component moved back to `src/components/TasteSlider.tsx`; the blob is parked in `src/components/parked/DrinkBlob.tsx` (see `docs/parked.md`).
- Then (same day): the header sits 14px lower, the family label is 6px closer to the name, and the slider is wider (190px) with its Bitter and Sweet labels level with the family label (12px, 55%) and the words above the track. It now lives in the header row in place of the prep icons.
- Then: with the drawer up, the family label (and ABV) is replaced by the taste summary, for example "Balanced · Intense", in the same spot (a crossfade), in the family label's own look (12px, 55%), with the dot and ABV kept: "Balanced, Intense · 27% ABV". The graph keeps only its track and Bitter / Sweet labels. The family returns when the drawer closes.
- Then: the same label is now on the main page too: the family name is gone from under the title everywhere, replaced by "Balanced, Intense · 27% ABV" in the same look (so no crossfade any more). The family still drives the browse filters.
- Then: "Medium" is not shown. Light (under 0.2 of the scale) and Intense (0.5 and up) are kept; in between, the label says only the balance, for example "Sweet · 21% ABV". Helper: `tasteSummary` in `src/lib/flavor.ts`.
- Then: a strongly sweet drink reads "Very sweet" (was "Sweet"); strongly bitter still reads "Bitter" (JP only asked for sweet).
- OPEN: the slider only shows while the drawer is open; whether it should also show on the closed drink is undecided.

## 2026-11-17: The drink's picture in the drawer header is a blobby mesh gradient (replaced, see above)

- The gray circle at the top right of the open drawer is now a blob (an uneven, slowly drifting outline) filled with a mesh gradient of the colors of the ingredients in the drink right now: one soft spot of color per ingredient, bigger for more liquid, over the main ingredient's color. It has film grain on it and a soft blurred glow behind it, like the icon illustrations, and it changes as you swap ingredients or change amounts. Component: `DrinkBlob.tsx`. With "reduce motion" on the outline stays still.
- OPEN: it is a stand-in until there is a real picture of the drink.

## 2026-11-17: The four top buttons are 36px tall

- SUBSTITUTE, + SWEET, + BITTER and + STRENGTH are 36px tall (were 30), matching the serving buttons. The text is unchanged. The ingredient list below them starts 6px lower to make room; its first heading stays where it was. They also have more room inside (16px at the sides, was about 10): the four no longer fit across a phone, so the row scrolls sideways (the last button, STRENGTH, is partly off the edge at first). The drag strip now only blocks vertical scrolling (`touch-pan-x`) so the row can scroll while up and down still drags the sheet.

## 2026-11-17: No outline on buttons except the chosen ones

- The drawer pills, the ingredient chips and the serving buttons have no visible outline unless they are chosen (white outline, as before). The space for the outline is kept (a transparent 1px border) so nothing changes size. Hovering now lightens the button's fill a little (#26221E) instead of brightening an outline.

## 2026-11-17: Button borders use the drawer's gray

- The outline of every button that isn't chosen (the four drawer pills, the ingredient chips and the serving buttons) is now the drawer's own gray (#21201E) instead of 12% white. In the drawer that makes the dark buttons read as shapes without a visible edge; under the drink it gives the serving buttons a soft lighter ring. A chosen button still has the white outline, and hovering still brightens the outline to 40% white.

## 2026-11-17: The line under the total reads "2 servings · 3 oz per serving"

- Under the total ("6 oz") the small text is now the number of servings, a dot, and the oz in one serving: "1 serving · 3 oz per serving", "2 servings · 3 oz per serving", "6 servings · 3 oz per serving". (It was "Single drink" / "2 drinks".) The per-serving amount is the recipe's total at one serving, so it follows your edits to the recipe but not the number of servings.

## 2026-11-17: Serving buttons behave like the drawer buttons

- The serving buttons (1, 2, 4, +) are filled with the same dark color (#1A1612) and use the same states as the drawer's chips: a 1px outline at 12% white when not chosen (40% on hover) and a full white outline when chosen. The chosen one no longer has its own lighter fill. The number box that "+" opens has the same fill and a white outline.

## 2026-11-17: Drawer buttons are filled with the page's dark color

- The four buttons (SUBSTITUTE, + SWEET, + BITTER, + STRENGTH) and all the ingredient chips in the edit drawer are filled with the app's darker background color (#1A1612) instead of being see-through, so they read as dark pills on the lighter gray drawer. Their outlines are unchanged; the pills' hover now brightens the outline instead of the fill.

## 2026-11-17: Bigger serving buttons and total, bigger icon labels

- The serving buttons (1, 2, 4, +) are 36 x 36 (were 28; JP wrote "bigger" and "24x24", then chose bigger, 36) with 12px numbers; all of them have a 1px border (the chosen one used 0.5px). The total under the drink ("3 oz") is 14px (was 12). The labels under the two header icons (Stirred, Rocks...) are 12px like the family label (were 10).

## 2026-11-17: Ingredient icons in the drawer (Figma 196:38)

- The gray placeholder circles on the drawer's ingredient chips are now the 40 "Night glow" ingredient icons (38 x 38, one per ingredient). They were exported at 4x (152px) into `public/icons/ingredients/<ingredient id>.png`, and the near-black background of each was made transparent (as for the prep icons) so only the glowing object shows on the chip. The drink's own picture at the top right of the open drawer is still a gray placeholder circle.

## 2026-11-17: New design: serving size, full-width panel, ingredient drawer (Figma 187:43)

- **Under the drink:** serving buttons 1, 2, 4 and "+" and the total on the right ("3 oz" / "Single drink", "6 oz" / "2 drinks"). They scale the oz on the layers and the total; the ratios never change. "+" opens a small number box (1 to 99). The drink card is 25px in from the sides (352px on a 402px screen) and the layer names are capitals at 60%.
- **Edit panel:** full width again, solid #21201E (a lighter gray than the page) with a wavy top edge only (no bottom wave, no blur, no shadow). The buttons are outlined pills: SUBSTITUTE, + SWEET, + BITTER, + STRENGTH (Less Strong is gone). SUBSTITUTE opens the drawer; the others work as Add Sweet / Add Bitter / More Strong did.
- **Drawer:** swiping up (or tapping the grabber or SUBSTITUTE) takes the panel all the way up to 102px from the top, over the drink. The header stays above it at full strength: the name shrinks to 28px, the icons fade and a gray circle (the drink's picture, a placeholder) shows at the right. The drawer lists the ingredients in sections by category (`IngredientDrawer.tsx`), each chip with a gray circle placeholder for its picture; the ingredients in the drink have a white outline. Only the top strip (grabber and buttons) drags the sheet; the ingredients scroll.
- **Tapping an ingredient** swaps the drink's ingredient from the same category (Gin to Vodka), keeping its role and amount; if the drink has nothing from that category it is added as a new layer (`lib/swap.ts`). Tapping one already in the drink changes nothing.
- OPEN: the "+" number box, the roles and amounts for added ingredients, which line is replaced when a drink has two from one category (the one with the most liquid), the drink's picture and the ingredient pictures (placeholders), and the "New drink" in the design's open header (the app shows the drink's real name).

## 2026-11-17: Narrower drink card, more of the side cards show

- The middle drink card is 12px narrower on each side (its margin to the screen edge went from 16px to 28px), so it is smaller overall (on a 375px phone: 319px wide, was 343px) and the cards beside it show about 20px instead of 8px. The edit panel stays 16px in from the sides, so the card is now narrower than the panel. `CARD_MARGIN` in `DrinkPanel.tsx` sets it.

## 2026-11-17: The edit buttons use the browse filters' type

- The four buttons at the bottom (Add Sweet, Add Bitter, Less Strong, More Strong) are now set like the browse filters: 10px capitals with 0.08em letter spacing (they were 11px mixed case). Still white, regular weight, on the same pill. In capitals the four labels no longer fit on one line side by side, so a label wraps onto two lines (ADD / SWEET) inside the 36px pill instead of being cut off; with only two or three buttons they stay on one line.

## 2026-11-16: The taste slider is parked (cut from the panel, saved for later)

- The Sweet-to-Bitter slider is out of the edit panel. Its code moved to `src/components/parked/TasteSlider.tsx` (not used anywhere), the math stays in `lib/flavor.ts`, and `docs/parked.md` says how to bring it back and where the earlier graph versions (bars, orbs, ladders) are in git history. `FlavorReadout.tsx` is deleted.
- With nothing above the buttons, the closed edit panel shrank from 152px to 76px (buttons 26px from its top, 12px under). The drink card has more room above it. The open panel is still 470px tall (mostly empty). OPEN: JP may want the closed panel at another height or something new in that space.

## 2026-11-16: Only the taste slider in the panel; ABV moves up beside the family

- The Strength ladder is gone. The Sweet-to-Bitter slider now spans the whole panel, and its label is just the words ("Balanced · Intense"), with no "Taste". The strength now shows as "27% ABV" right after the family label under the drink's name, split by a small dot ("Spirit-forward · 27% ABV"); it follows your edits. The slider row and the buttons stayed where they were.
- OPEN: there is no Low / Medium / High reading of strength any more (only the number); the brief (§3) lists strength as a calculated value, so this keeps it, just in the header.

## 2026-11-16: Sweet and Bitter are one slider

- The two ladders for Sweet and Bitter became one wide glowing slider (Bitter on the left in purple, Sweet on the right in gold) across the right two columns. Strength keeps its ladder on the left. The marker sits where the drink leans (sweet minus bitter, from `tasteBalance` in `lib/flavor.ts`) and gets wider and brighter the stronger the flavors are, so a Negroni (Balanced, Intense) and a Martini (Balanced, Light) look different. The label reads like "Taste · Leans sweet · Medium". It slides smoothly as you tap Add Sweet / Add Bitter or drag layers.
- OPEN: real drinks only reach about -0.3 on the bitter side (the bitterness scale is 4), so the bitter half of the track is underused. `BITTER_GAIN` (now 1) can stretch it, but at 1.5 a Negroni lands on "Bitter". Word cut-offs (Balanced under 0.12, Leans under 0.4; Light under 0.2, Medium under 0.5) and the track colors are first guesses for JP.
- Note: More / Less Strong shifts the marker a little, because adding or removing spirit changes every other share of the drink.

## 2026-11-16: The drink card no longer scales when the drawer opens

- When the edit panel swipes up the drink card now only moves up (78px) and fades; it keeps its full size (it used to shrink by 16px on each side). Since the panel is solid, the lower part of the card (about a third on a 375 x 812 phone) is hidden behind it when it is open. OPEN: JP may want the card to move up more.

## 2026-11-16: Grain removed from the ingredient layers

- The film grain over the ingredient layers (and the base wave) is gone: the layers are flat colors again. The grain on the glowing ladder steps stays. (It was added earlier today; the pattern is still in `surfaceEffects.ts` as `LAYER_GRAIN_STYLE` for the ladders.)

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
