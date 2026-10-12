# Plan: tone words for vocals (not only instruments)

Instruments already take tone words ("warm", "icy", ...) via chips; the chosen
words lead the instrument name in the prompt ("warm dreamy Grand Piano (...)").
Add the same feature for **vocal modes** (the folders under the Vocals tab that
come from `suno_style_vocal_spec.json` → `vocal_modes`, e.g. `female`, `male`,
`unspecified`). Voice-quality / resonance / delivery descriptor folders
(`folderType === 'descriptor'`) do NOT get tones — same rule as positions.

Match the existing code style (short comments, arrow functions in renderer,
no new dependencies). Do not touch unrelated code. The working tree has
uncommitted changes from the user — keep them; do not reset/stash/commit.

## Data

- Reuse `instruments.tone_descriptors` from `suno_instrument_techniques.json`
  as the tone word list. Add a small helper in `PromptGenerator`,
  e.g. `toneDescriptors()` returning `this.data.instruments?.tone_descriptors || []`,
  and use it everywhere tone words are read (instrument code too).
- Add the tone word `"solo"` to `tone_descriptors` in
  `suno_instrument_techniques.json` (so every instrument and every vocal mode
  gets a "solo" chip, e.g. "solo Violin", "solo female vocal"). If
  `src/i18n_keywords.js` has translations for tone words, add "solo" there
  for every language too (ja: ソロ, es: solo).
- Watch out: some vocal phrases already start with "solo" (e.g. "solo vocal").
  Tone peeling in `matchVocal` must try the full phrase first, so
  "solo vocal" stays a phrase and is not split into tone "solo" + "vocal".
  Also avoid emitting duplicated words like "solo solo vocal" — if the
  phrase already starts with a tone word, skip prepending that word.

## State (src/renderer.js)

- Add `vocalTones: {}` to the initial `selections` next to `instrumentTones`,
  keyed by vocal mode name → array of tone words.
- Add `'vocalTones'` to the list in `normalizeSelections` that defaults
  objects (`['instrumentTones', 'instrumentNotes', 'customs']`).
- In `parsePrompt`'s initial `sel` (promptGenerator.js ~line 942) add
  `vocalTones: {}`.
- Wherever selections are cleared/reset or saved/loaded, make sure
  `vocalTones` behaves like `instrumentTones` (grep for `instrumentTones`
  and mirror each usage that makes sense).

## Prompt output (src/utils/promptGenerator.js `vocalParts`)

- Add `getVocalTones(selections, mode)` mirroring `getInstrumentTones`
  (filter tone list by chosen, preserving data order).
- In `vocalParts`, for each mode with tones: prepend the tones to the text of
  the first part belonging to that mode (the same `target` used for position).
  If no part of that mode is selected, push the mode's first style phrase with
  the tones (and position if any), just like positions do today.
  Result example: `warm breathy female vocal (panned left)`.
  Order: tones first, then the phrase, then ` (position)`.
- Make sure the stage diagram / `impliedInstruments`-style logic still works:
  a mode that only has tones (nothing ticked) should still appear in the
  prompt (same as a mode that only has a position). Check `stageItems`
  (~line 293–321) and include modes that have tones in `modes` there.

## Parsing (`matchVocal` / `applyVocalParse`)

- In `matchVocal`, if the phrase is not found, peel leading tone words off the
  front (like `matchInstrument` does) until a vocal phrase matches; return
  `{ ...entry, details, tones }`.
- In `applyVocalParse`, if `tones.length` and `mode`, merge them into
  `sel.vocalTones[mode]` (dedup). If no mode (descriptor phrase), put the
  tones back in front of the phrase as leftovers / keep them as free text —
  do not lose them.
- Round trip must hold: generate prompt → parse → same `vocalTones`.

## Randomize

- Add `randomVocalTones(vocals)` in PromptGenerator (mirror
  `randomInstrumentTones`): for the modes of the random vocals, sometimes pick
  1–2 tone words. In renderer `randomizeCategories`, when
  `category === 'vocals'`, set `next.vocalTones = generator.randomVocalTones(next.vocals)`.

## UI (src/renderer.js)

- In `renderHierarchicalList`, for `category === 'vocals' && folderType === 'mode'`
  add a tone badge to the header and a tone row to the content (no note row).
- Generalize `createToneRow(instrument)` into
  `createToneRow(scope, key)` where scope is `'instruments'` or `'vocals'`,
  storing into `selections.instrumentTones` or `selections.vocalTones`.
  Chips get `data-scope` and `data-key` (instead of only `data-instrument`);
  tone badges likewise. Update `syncToneControls` to read the right map per
  scope. Keep the note input logic for instruments unchanged.
- Folder "has-selection" highlighting (~line 1253) already checks
  `.tone-chip.active` — make sure it works for vocal folders too.
- Existing CSS classes `.tone-row`, `.tone-chip`, `.tone-badge` should be
  reused as is; only add CSS if something actually looks wrong.

## Lyrics pane / other consumers

- grep for `instrumentTones` across `src/` and decide for each spot whether
  vocals need the same treatment (e.g. lyric metatags, `[Vocal: ...]`
  rendering, clear/reset buttons, i18n). Mirror where sensible.

## i18n

- The existing `tone` label key is reused; no new strings expected. If you
  add any, add them for every language in `src/i18n.js`.

## Docs

- README.md and README.ja.md: where instrument tone words are described, add
  that vocal modes take tone words too (one short sentence each).

## Verification

- `node -e` quick check: load PromptGenerator with the JSON data (see how
  `src/webApi.js` / `main.js` load data) and assert:
  - selections `{ vocals: ['female vocal'], vocalTones: { female: ['warm','airy'] } }`
    (use real mode/phrase names from the JSON) produce a vocal part starting
    with `warm airy`.
  - parsing that prompt yields the same `vocalTones`.
  - instrument tones still work unchanged.
- `node --check` every edited JS file.
- Report what was changed, file by file.
