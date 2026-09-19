# 🎵 Suno Prompt Generator

English | [日本語](README.ja.md)

A desktop app for building [Suno AI](https://suno.com/) style prompts by simply ticking checkboxes.

![Suno Prompt Generator](snapshot/application-main.jpg)

## Features

- **Pick from 5 categories** — combine genres, vocals, instruments, chords and structures into a prompt
- **BPM control** — set the tempo with a slider or by typing a number
- **Live preview** — the prompt updates instantly as you select
- **Random generate** — create a random combination with one click
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
2. Adjust the BPM with the slider at the top right
3. Click **Copy to Clipboard** to copy the prompt shown in Preview
4. Paste it into Suno's Style of Music field

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
