**▶ Try it online: [https://gadget114514.github.io/SunoPrompt/](https://gadget114514.github.io/SunoPrompt/)**

# 🎵 Suno Style Generator

English | [日本語](README.ja.md)

A desktop app for building [Suno AI](https://suno.com/) style prompts by simply ticking checkboxes.

![Suno Style Generator](snapshot/application-main.jpg)

## Features

- **Pick from 5 categories** — combine genres, vocals, instruments, chords and structures into a prompt
- **BPM control** — set the tempo in the top bar with a slider or by typing a number
- **Live preview** — the prompt updates instantly as you select
- **Stage diagram** — a fan-shaped view of where each vocal and instrument sits, marked with its instrument-family icon; hover one for its name and placement
- **Random generate** — create a random combination with one click, limited to the categories you tick
- **Per-category reroll** — the 🎲 next to each category rerolls only that one and leaves the rest untouched
- **Reorderable tabs** — drag a category tab to move it; the tab order is the order its parts are written in the prompt, and the BPM chip rides along so the tempo can sit anywhere
- **Clear all** — reset all selections and the preview at once
- **Copy / Save** — copy to the clipboard or save as a text file
- **Projects** — save, load and delete named sets of selections
- **English / 日本語** — switch the UI language

## Web version

Use it right in your browser — nothing to install: **[https://gadget114514.github.io/SunoPrompt/](https://gadget114514.github.io/SunoPrompt/)**

Project save/load is available only in the Windows app.

## Download (Windows app)

Download `SunoPromptGenerator.exe` from [Releases](https://github.com/gadget114514/SunoPrompt/releases) and run it.
No installation needed, and no Node.js or npm required (Windows x64).

> The executable is unsigned, so Windows SmartScreen may show a warning on first launch.
> If it does, click "More info" → "Run anyway".

## Usage

1. Tick items in the center tabs (Genres / Vocals / Instruments / Chords / Structures)
2. Adjust the BPM with the slider in the top bar
3. Click 📋 next to the Preview title to copy the prompt (💾 saves it to a file, 🗑️ clears everything)
4. Paste it into Suno's Style of Music field

Use **🎲 Random Generate** to reroll every ticked category at once, or the 🎲 on a single row
to reroll just that category. All categories are ticked by default.

Drag a category tab sideways (or focus one and press Ctrl + ← / →) to change where its part lands
in the prompt. The **BPM** chip sits in the same row and moves the same way, so the tempo can lead,
trail or sit in the middle — it is still set from the slider in the top bar, and clicking the chip
does not open a tab of its own. The order is remembered between runs and is saved with each project.

The **▾** button beside 🎲 Random Generate opens the per-category options; it starts closed.

The **Stage** panel draws the listener at the bottom and the fan of the soundstage above: the angle
of a marker is its pan, the distance from the listener is its depth. Each marker carries the icon of
its instrument family — keyboard, guitar, bass, bowed strings, brass, woodwind, percussion, world,
electronic, ensemble — so you can read the arrangement at a glance. Give an instrument or a vocal
mode a position inside its folder and its marker moves; anything without one stays hollow in the
middle.
A part with no single spot is drawn as what it is: `wide stereo` becomes a bar, `auto-panned` becomes
the arc it travels along, with a marker riding it.

Save combinations you like with **Save Project** in the left panel.

## Development

```bash
git clone https://github.com/gadget114514/SunoPrompt.git
cd SunoPrompt
npm install
npm start
```

### Web version (GitHub Pages)

Every push to `main` deploys the site via `.github/workflows/pages.yml`, which bundles `src/` with the JSON data files.
To preview locally, serve the repository root and open `/src/index.html`:

```bash
npx http-server . -c-1
```

### Build the exe

```bash
npm run dist
```

This produces `dist/SunoPromptGenerator.exe` (portable build).

## Data files

Prompt options are loaded from the following JSON files. Edit them to customize the choices.

| File | Contents |
|---|---|
| `genre.json` | Genres |
| `suno_style_vocal_spec.json` | Vocal modes and expressions |
| `suno_instrument_techniques.json` | Instruments and playing techniques |
| `suno_chord_phrases.json` | Chord progressions, harmony and keys |
| `suno_style_structure_phrases.json` | Song structure phrases |

## License

[MIT](LICENSE)
