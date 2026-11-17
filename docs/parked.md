# Parked work

Things JP cut from the app but wants to keep for later. Nothing here is used by the app right now. Newest first.

## The Sweet-to-Bitter slider (parked 2026-11-16)

Sweet and Bitter shown as one continuum: a thin glowing track (Bitter purple on the left, Sweet gold on the right), a marker where the drink leans, and a line of words above it ("Balanced · Intense"). The marker gets wider and brighter the stronger the flavors are, so a Negroni (strongly both) and a Martini (barely either) look different. It slid smoothly as you tapped Add Sweet / Add Bitter or dragged layers.

- **The component:** `src/components/parked/TasteSlider.tsx` (exports `TasteSlider({ profile })`). It still type-checks and lints; it is just not imported anywhere.
- **The math:** `tasteBalance`, `balanceWord` and `intensityWord` in `src/lib/flavor.ts` (still there). `BITTER_GAIN` (1) stretches the bitter half of the track: real drinks only reach about -0.3 on that side, but at 1.5 a Negroni stops reading as balanced.
- **How it looked:** the whole width of the edit panel, a 13px line of words, 14px gap, then a 27px-tall track row; the Add Sweet / Add Bitter / Less Strong / More Strong buttons 24px under it. The closed panel was 152px tall.

### To bring it back
1. In `src/components/EditPanel.tsx`, import `TasteSlider` from `./parked/TasteSlider`, and give `EditPanel` a `profile: Profile` prop again (pass `profile={profile}` from `DrinkPanel.tsx`; `profile` is already computed there for the ABV).
2. Render `<TasteSlider profile={profile} />` above `<MakeEdits />` with a 24px gap (`<div className="mt-[24px]">` around the buttons).
3. Set `PANEL_CLOSED_HEIGHT` back to 152 in `EditPanel.tsx`.

## Earlier versions of the flavor graphs (all in git history)

The graphs under Strength, Sweet and Bitter went through several looks today. To see one, `git show <commit>:src/components/FlavorReadout.tsx`:

- Five short bars per stat: before `75c5967` (for example `981ca3d`).
- Glowing orbs with a white line that grows around them (Figma 171:38): `75c5967`.
- "Glow ladder" of five glowing steps per stat (Figma 180:39), 3px thick, 3px apart: `9ef2a15`.
- Ladder for Strength plus one wide Sweet/Bitter slider: `4637df3` (this is also where the slider above lives in full).
