# Lyrics pane + per-item destinations (Style / Exclude / lyric sections)

## Context
Today every list item can only go to the Style field (checked) or `[EXCLUDE: ...]` (tri-state click: none → included → excluded). Suno also reads control metatags inside the Lyrics field, per section. The user wants:
- A collapsible **Lyrics pane** on the far right with text fields for Intro / Verse 1 / Verse 2 / Pre-Chorus / Chorus / Outro, pre-filled with sample control metatags.
- For items usable as metatags (every category except BPM and Genres), **checkboxes choosing where the item goes**: Style, Exclude, and any of the six lyric sections.
- Lyric/Exclude destination checkboxes appear only when **Advanced** is on. The current tri-state click stays as-is in both modes.
- Section tags are written as `[Tag name, phrase, phrase]`, e.g. `[Verse 1, whisper, soft piano]`.

## Data model (`src/renderer.js`)
- `LYRIC_SECTIONS = ['intro','verse1','verse2','preChorus','chorus','outro']` with tag names `Intro`, `Verse 1`, `Verse 2`, `Pre-Chorus`, `Chorus`, `Outro` (put on `PromptGenerator` so the generator can use it).
- `LYRIC_CATEGORIES = CATEGORIES minus 'genres'` → vocals, instruments, chords, moods, structures.
- New `selections` fields:
  - `lyricTags: { [section]: { [category]: [value...] } }` — independent of Style/Exclude.
  - `lyrics: { [section]: string }` — the text fields; defaults to the sample text.
- Extend `normalizeSelections()` to fill/repair both (old projects get empty tags + sample text). Projects already save the whole `selections`, so save/load works with no main.js change.
- Clear-all (`setupButtons` clear handler) resets both via `normalizeSelections`.

## Generator (`src/utils/promptGenerator.js`)
- Extract the per-item phrase logic from `excludeParts()` into `itemPhrase(category, value)` and reuse it in `excludeParts()`.
- Add `generateLyrics(selections)`: for each section in order, emit `[<Tag>, phrase, ...]` (just `[<Tag>]` if nothing assigned), then that section's text; sections joined by a blank line. Skip a section only when it has neither tags nor text.

## Left list: destination checkboxes (`createSelectableItem`)
- For categories in `LYRIC_CATEGORIES`, append a `.dest-row` to the item: small labelled checkboxes **S · ✕ · In · V1 · V2 · PC · Ch · Out** (full names in `title`, i18n).
  - **S** and **✕** mirror the existing tri-state: S ↔ `selections[category]`, ✕ ↔ `excludes[category]`; ticking one clears the other. Both route through a shared `setItemState(category, value, state)` so the main checkbox, the tri-state cycle and the columns stay in sync (`applyItemState` also refreshes the row).
  - Section boxes toggle `lyricTags[section][category]`.
- The row is hidden by CSS unless `body.advanced-mode`; the S column is redundant with the main checkbox but kept as the user asked for a full destination set.
- Folder headers: add a small `♪n` badge (like `.exclude-count`) counting items assigned to any lyric section, updated in `updateFolderHighlights()`.
- `updateAllCheckboxes()` also syncs the dest rows (on project load / parse / random).
- Random: leaves `lyricTags` untouched.

## Advanced toggle
- In the left panel **Settings** tab: checkbox “Advanced (lyrics sections / exclude)”, persisted in `localStorage` (`suno-advanced`), toggles `body.advanced-mode`. Follows the existing `LOG_COLLAPSED_KEY` / `RANDOM_TARGETS_OPEN_KEY` pattern.

## Lyrics pane (`src/index.html`, `src/styles.css`, renderer)
- New `<div class="lyrics-panel">` after `.right-panel` inside `.workspace`, same card styling as `.right-panel`, width ~320px.
- Header: title “Lyrics”, 📋 copy (copies `generateLyrics` output), sample-reset button (refills empty fields with samples), and collapse ▸/◂ button. Collapsed = narrow vertical strip with the toggle only; state persisted (`suno-lyrics-collapsed`).
- Body: six blocks, each with a label, the computed tag line shown read-only above (`[Verse 1, whisper, soft piano]`, updated in `updatePreview()`), and a `<textarea>` bound to `selections.lyrics[section]`.
- Footer: char count vs. Suno's lyrics limit (5000), reusing the `.char-count` / `over-limit` styling.
- Sample text per section (control metatags only, no lyric content), e.g.
  - Intro: `[Instrumental]` / `[Soft Piano]`
  - Verse 1: `[Mood: Calm]` / `[Vocal: Breathy]`
  - Verse 2: `[Energy: Medium]`
  - Pre-Chorus: `[Build-Up]`
  - Chorus: `[Energy: High]` / `[Harmonies]`
  - Outro: `[Fade Out]` / `[End]`
- `@media (max-width: 900px)`: pane stacks below like the other panels.

## i18n (`src/i18n.js`)
Add en/ja/es keys: lyrics title, section names/short labels, dest column titles (Style/Exclude), advanced toggle label, copy/sample/collapse titles, log messages, and a new Help section describing the lyrics pane and destinations.

## Files
- `src/index.html` — lyrics panel markup, Settings advanced checkbox
- `src/renderer.js` — state, normalize, dest rows, sync, lyrics pane setup/render, advanced toggle
- `src/utils/promptGenerator.js` — `itemPhrase`, `generateLyrics`, section constants
- `src/styles.css` — `.lyrics-panel`, collapsed state, `.dest-row`, `body.advanced-mode` rules, badge
- `src/i18n.js` — strings + help
- README.md / README.ja.md — short feature note

## Verification
1. `npm start`: Lyrics pane on the right, collapses/expands, state survives restart; sample text present.
2. Advanced OFF: no dest checkboxes; tri-state click unchanged. Advanced ON: columns appear on vocals/instruments/chords/moods/structures items, not genres.
3. Tick V1 on “whisper” and an instrument technique → lyrics tag line shows `[Verse 1, whisper, <technique>]`; copy output matches.
4. Tick ✕ → main checkbox goes indeterminate and Style preview gets `[EXCLUDE: ...]`; tick S → excluded cleared. Tri-state click updates the S/✕ columns.
5. Save project, clear all, load → tags and lyrics restored; old project files load without error.
6. Switch to ja/es: labels translated. Check web build (`webApi.js` path) loads the same.
