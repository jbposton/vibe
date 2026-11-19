# Cocktail builder: brief for Claude Code

Condensed from the Hackathon project docs (2026-11-14). The design lives in Figma, file "Hack" (key `HOLCAU58T8B5X6lCg8P3IB`). Where this brief and the Figma file disagree, ask JP.

## 1. What we're building

A phone-first web app (Next.js) that helps a curious home drink-maker understand why a drink tastes the way it does, well enough to change it on purpose and to find other drinks by flavor. It is a vibe-coding hackathon entry and a portfolio case study, so craft, information architecture and interaction matter more than feature count.

- **Problem:** people can follow a recipe but can't reason about one. Recipes are instructions, not explanations, and drinks are organized by name while people choose by taste.
- **Success for a visitor:** after a couple of minutes they can predict what adding more of something will do, and they find a drink they wouldn't have known to search for.
- **Not:** a recipe database, a bar inventory tracker, or a social or rating app.
- **Spotify parallel:** you know what you like but not what it's called.

### Scope (three features)
1. **Mixer (the core):** a drink visualization and a flavor profile that respond together as you change amounts.
2. **Finder ("build your glass"):** pick a feeling and vibe, get a starting drink, then adjust it in the mixer.
3. **Library:** a plain list of drinks and ingredients. Lowest priority.

No outside data dependency: hand-curate about 30 drinks and 40 ingredients, including non-alcoholic drinks. Start with classic cocktails plus five to eight teas as ingredients (tea is an ingredient family, not a separate mode).

### Flow
1. Visitor arrives and sees a drink that responds when touched.
2. They can build a glass by choosing a feeling and vibe.
3. The app turns that into a starting drink.
4. They adjust it in the mixer and watch the flavor shift.

## 2. Visual direction

- Ethereal and atmospheric. Light background (`#F7F7F7`), dark text (`#141414`).
- No literal glass or liquid. The drink is a data visualization: soft, blurred, overlapping bands of color, one per ingredient. Glass shape should still be represented somehow (undecided).
- The drink panel dominates the screen. Controls and information are secondary and revealed progressively around it.
- Colors are chosen to pair, so each finished drink looks almost like a piece of art.
- Type: Inter. Drink name Semi Bold 22; family label Regular 12 at about 55% opacity; small body text Regular 11 to 12.

## 3. Taxonomy

A drink is built from four linked parts: **Ingredient, Recipe line, Drink, Flavor profile.**

- **Ingredient** (what it is): has a fixed **category**, plus strength, sugar, acidity, curated flavor notes and pairings.
  Categories (10): Spirit, Liqueur, Aperitif or fortified wine, Sparkling, Juice, Syrup, Bitters, Mixer, Tea or coffee, Herb or garnish.
- **Recipe line** (what it does in this drink): an amount and a **role**.
  Roles (7), in fixed stack order **bottom to top**: base, modifier, sweet, sour, bitter, lengthener, aromatic.
- **Drink:** the recipe lines plus name, family, method (shaken, stirred, built), glass and ice, garnish.
- **Flavor profile:** calculated values (strength, sweetness, acidity, dilution) kept visibly separate from curated ones (aroma, body, bitterness, finish), plus feeling and vibe tags.

Category belongs to the ingredient, role belongs to the recipe line. Lime juice is a juice everywhere, the sour in a Gimlet, and only a garnish in a Gin and tonic. Category is shown only where you pick ingredients; inside a drink only role matters.

**Families:** Sour (base, sour, sweet), Long sour (sour, lengthener), Spirit-forward (base, modifier, bitter), Highball (base, lengthener), Spritz, Hot, Non-alcoholic, Unplaced (Espresso martini).

### Ingredient categories and colors (final, from the Figma `Ingredients` variables)

Colors are hand-tuned per ingredient, not from a ramp. Treat them as design tokens, one per ingredient.

| Category | Ingredient: color |
|---|---|
| Spirit | Gin `#E8F5FA`, White rum `#EDEEF0`, Vodka `#E7ECEA`, Tequila `#9AEEAF`, Bourbon `#A85A14`, Rye `#F7B538`, Whiskey `#3B1607` |
| Liqueur | Orange liqueur `#FFC6AC`, Coffee liqueur `#FFCEAA` |
| Aperitif or fortified wine | Campari `#F4577A`, Aperol `#E53B0C`, Sweet vermouth `#5C1224`, Dry vermouth `#EAF268` |
| Sparkling | Prosecco `#F2F7CD` |
| Juice | Lime juice `#DDE633`, Lemon juice `#EFE822`, Cranberry juice `#E63378` |
| Syrup | Simple syrup `#F7F7EF`, Honey `#FFB508`, Grenadine `#A3142F` |
| Bitters | Angostura bitters `#E45F00` |
| Mixer | Soda water `#F4F5FE`, Tonic water `#001B34`, Ginger beer `#F5E4B9`, Ginger ale `#F2F7CD`, Lemonade `#EAF268`, Hot water `#562025` |
| Tea or coffee | Iced tea `#F7B538`, Espresso `#34140C` |
| Herb or garnish | Mint `#10D68E`, Lime wheel `#94FF8E`, Lime wedge `#94FF8E`, Orange peel `#FF6303`, Orange slice `#FF8349`, Lemon twist `#A9B52A`, Lemon wheel `#FBEC11`, Cherry `#E32A3C`, Cinnamon stick `#A1051B`, Coffee beans `#4D1B07`, Salt rim `#F5F5F5` |

Known color issues (JP is still tuning): 14 of 101 same-drink pairs are hard to tell apart (perceptual distance under 8), mostly the pale cluster of Gin, Vodka, White rum, Soda water and Simple syrup. Several ingredients share a color on purpose (Rye/Iced tea, Ginger ale/Prosecco, Dry vermouth/Lemonade, Lime wheel/Lime wedge). Because colors repeat, color alone cannot identify an ingredient: pair it with a label.

## 4. Drink panel rules

- **Color + label = ingredient.**
- **Layer height = amount.** Heights are proportional to ounces across the stack's total height. Ingredients with no volume (garnishes, rim) and tiny amounts (a dash of bitters, about 0.1 oz) get the **60px minimum**; everyone else shares the remaining height in proportion.
- **Order in the stack = role,** bottom to top: base, modifier, sweet, sour, bitter, lengthener, aromatic (so the base is at the bottom and garnishes on top). If two layers share a role, pick one to go on top (the tie-break must be stable so dragging never swaps layers mid-gesture).
- Shaken drinks follow the same order; a "shaken" distinction may be added (undecided).
- Texture or motion effects are optional and only for unique roles (undecided).

### Blurred-layer recipe (Figma "v4", the chosen look)

- Artboard 402 x 874, background `#F7F7F7`. The stack is 277 wide x 528 tall at x 62, y 346 (so empty space shows above and the stack's bottom meets the artboard bottom). Drink name at (62, 96), family at (62, 130), a small gray ingredient caption at (62, 160).
- Each layer is a flat-color rectangle, extended and blurred: width 489 centered on the stack (x = -106 relative to it), vertical overlap on each side of `0.2 * height + 12` px, so its total height is `height + 2 * overlap`. Apply a layer blur of `min(84, round(totalHeight * 0.3))` px. Clip each layer to its own bounds before blurring, then let the stack overflow its frame.
- A tighter overlap (v5, about 10 percent) was tried and rejected: layers stood out but lost the atmosphere.

## 5. Test drinks (amounts in oz; "garnish" has no volume; layers listed base first)

| Drink (family) | Lines (ingredient, role, amount) |
|---|---|
| Gimlet (Sour) | Gin base 2; Lime juice sour 0.75; Simple syrup sweet 0.75; Lime wheel aromatic |
| Daiquiri (Sour) | White rum base 2; Lime juice sour 1; Simple syrup sweet 0.75 |
| Whiskey sour (Sour) | Bourbon base 2; Lemon juice sour 0.75; Simple syrup sweet 0.75; Cherry aromatic |
| Margarita (Sour) | Tequila base 2; Orange liqueur modifier 0.75; Lime juice sour 1; Salt rim aromatic |
| Cosmopolitan (Sour) | Vodka base 1.5; Orange liqueur modifier 1; Cranberry juice modifier 1; Lime juice sour 0.5 |
| Tom Collins (Long sour) | Gin base 2; Simple syrup sweet 0.5; Lemon juice sour 1; Soda water lengthener 2 |
| Mojito (Long sour) | White rum base 2; Simple syrup sweet 0.75; Lime juice sour 1; Soda water lengthener 2; Mint aromatic |
| Old fashioned (Spirit-forward) | Bourbon base 2; Simple syrup sweet 0.25; Angostura bitters bitter 2 dashes; Orange peel aromatic |
| Manhattan (Spirit-forward) | Rye base 2; Sweet vermouth modifier 1; Angostura bitters bitter 2 dashes; Cherry aromatic |
| Negroni (Spirit-forward) | Gin base 1; Sweet vermouth modifier 1; Campari bitter 1; Orange peel aromatic |
| Martini (Spirit-forward) | Gin base 2.5; Dry vermouth modifier 0.5; Lemon twist aromatic |
| Gin and tonic (Highball) | Gin base 2; Tonic water lengthener 4; Lime wedge aromatic |
| Moscow mule (Highball) | Vodka base 2; Lime juice sour 0.5; Ginger beer lengthener 4; Lime wedge aromatic |
| Aperol spritz (Spritz) | Prosecco base 3; Aperol bitter 2; Soda water lengthener 1; Orange slice aromatic |
| Hot toddy (Hot) | Whiskey base 2; Honey sweet 0.5; Lemon juice sour 0.5; Hot water lengthener 4; Cinnamon stick aromatic |
| Arnold Palmer (Non-alcoholic) | Iced tea base 4; Lemonade modifier 4; Lemon wheel aromatic |
| Shirley Temple (Non-alcoholic) | Ginger ale base 6; Grenadine sweet 0.5; Cherry aromatic |
| Espresso martini (Unplaced) | Vodka base 2; Coffee liqueur modifier 1; Espresso bitter 1; Coffee beans aromatic |

Several role assignments are guesses to confirm with JP: Cranberry juice and Lemonade as modifier, Aperol and Espresso as bitter, Ginger ale and Prosecco as base. Mojito's soda water amount (2 oz) is assumed.

## 6. Interaction (designed for a phone, must also work with mouse and keyboard)

- **Drag** a layer (anywhere on its section) to change quantities. The boundary it shares with a neighbor follows the finger and the two trade volume, so the rest of the drink stays put. Down expands the layer; the base layer is the exception (its top boundary follows the finger, so down shrinks it). Garnishes can't be dragged.
- **Swipe** through ingredients that pair well with the current drink (a tray).
- **Tap** to add an ingredient. **Swipe to reveal** ingredient panels or drink details.
- Each gesture means one thing in one place. *(Updated 2026-11-15 at JP's direction.)* Direction decides: on the drink, a vertical drag changes amounts and a sideways swipe switches drinks. The first few pixels of movement settle which it is. A swipe that reveals options (the tray) still starts on the tray or handle.
- **Drink carousel (phones):** the drink card is slightly narrower, with the previous and next drinks peeking in at the sides at a smaller size. Swiping slides the row (the card coming to the middle grows, the one leaving shrinks); tapping a peeking card, or ← / →, does the same. Each drink keeps its edits while you browse. Wide screens show one card with ‹ › buttons.
- **Auto-scroll (phones):** each drink stays in the middle for about 6 seconds, then the carousel glides to the next one by itself (a slow glide of under a second). It waits while you touch the screen and stops when the drink in the middle has been edited, when the tab is hidden, when "reduce motion" is on, and via a Pause / Play button.
- Keep gestures away from screen edges (browser back and forward). Provide hints for gestures. Keep touch targets large enough even for tiny amounts. Every swipe needs a click or keyboard equivalent, and there must be a non-drag way (tap or keyboard) to change quantities.
- The mixer sits on a fixed, full-height screen so vertical drags don't scroll the page or trigger pull-to-refresh.
- Respect reduced motion and plan a simplified or still version for slow devices; check shader and blur performance on a mid-range phone early. Don't rely on vibration.

## 7. Open decisions (don't invent answers; flag them)

Name of the app; flavor dimensions and drink families; what "feeling and vibe" covers and what build-your-glass looks like; how glass shape is shown; the gesture map; the ingredient shader/motion effect; stable tie-break for same-role layers; where default roles come from and how a drink overrides them; garnishes as non-volume marks; shaken marker; glass and ice effect on the stack; the color-repeat rule inside one glass; label accessibility when colors repeat; where the flavor profile sits (likely a readout zone below the panel); merging modifier and bitter; what a missing role looks like; where Espresso martini belongs.

## 8. Working agreements

- Never overwrite a design JP made; add the new version beside the old one.
- Log meaningful design judgments in the Decision Log (Project docs) and visible before-and-after changes in the Iteration Log.
- Update this file when the plan changes.

## 9. Working setup (for Claude)

@AGENTS.md

- JP is new to code and the terminal: explain steps in plain language, and say what a command does before asking JP to run it. Never handle JP's passwords, tokens or login codes.
- The GitHub repo is **public** (https://github.com/jbposton/vibe), so never commit secrets. API keys go in `.env.local` (gitignored) and in Vercel → Project → Settings → Environment Variables.
- Live site: https://vibe-delta-orpin.vercel.app. Every push to `main` deploys automatically, so push only after JP has seen a change in the preview.
- Commands: `npm run dev` (preview at http://localhost:3000), `npm run build` and `npm run lint` before pushing.
- Placeholders for open decisions (§7) are marked `// OPEN:` in the code. JP asked on 2026-11-14 to stop writing in `docs/decision-log.md` (it stays as a record up to that date). Visible changes still go in `docs/iteration-log.md`.
- Code map: data in `src/data/` (ingredients, drinks, roles), stack math in `src/lib/stack.ts`, the mixer in `src/components/DrinkPanel.tsx`, desktop tuning values in `src/lib/tuning.ts`.
- Since 2026-11-17 (Figma 187:43): serving buttons under the drink (`ServingsRow.tsx`), a full-width edit panel that swipes all the way up to an ingredient drawer (`EditPanel.tsx`, `IngredientDrawer.tsx`), and swapping ingredients by category (`src/lib/swap.ts`). The Sweet-to-Bitter slider is parked (`docs/parked.md`).
- Drawing: since 2026-11-16 each layer is a **flat block** of its ingredient color. The blurred "v4" liquid shader (`src/components/LiquidCanvas.tsx`) is kept but off: flip `USE_SHADER` in `src/components/DrinkCard.tsx` to bring it back.

### Branches and concepts (as of 2026-11-19)

Every branch gets its own Vercel preview link; only `main` deploys to the live site.

- `main`: the flat card (live). Tagged `mixer-v1` at 2026-11-18 before the concept work.
- `concept-b`: "exploded" 3D slabs seen from above, turning (Figma 230:495). `src/components/ExplodedDrink.tsx`.
- `concept-c`: square slabs spaced apart whose widths follow the drink's glass, low camera (14 degrees), turning. Same file, `STACK_STYLE = "glass"`.
- `concept-d`: today's card as one solid turning block. Same file, `STACK_STYLE = "block"`.
- In the concept branches `EXPLODED` in `DrinkPanel.tsx` switches between the 3D stack and the flat card. Concept branches don't get `main`'s later changes automatically: merge `main` into them when JP asks (concept-b was merged on 2026-11-18).
- Each concept is logged in `docs/iteration-log.md` on its own branch.

### Desktop layout and the design editor

- Wide screens (768px and up) have their own layout: side drinks with an eased fade, frosted ‹ › buttons, the card centered against the left column, a rounded edit panel with a drawn scrollbar, and a page capped at 1440 x 1000px.
- Desktop spacing and text sizes live in `src/lib/tuning.ts` (`TUNING_DEFAULTS`). JP tunes them in the **design editor** (`src/components/dev/DesignEditor.tsx`): a draggable slider panel that only appears in `npm run dev` (button "DESIGN", bottom right). JP pastes the copied values back; set them as the new defaults in `tuning.ts`. Phones keep their own fixed sizes.

### Dev server gotcha

- The dev server often keeps serving an old stylesheet after `globals.css` changes or new Tailwind classes. If a style change doesn't show up, stop the preview, delete the `.next` folder, and start it again. A freshly compiled page sometimes needs one reload before the drink card has its size.
