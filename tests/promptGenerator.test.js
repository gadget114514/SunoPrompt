const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Load ChordTheory and PromptGenerator in VM or require
const chordTheoryCode = fs.readFileSync(path.join(__dirname, '../src/utils/chordTheory.js'), 'utf8');
const promptGeneratorCode = fs.readFileSync(path.join(__dirname, '../src/utils/promptGenerator.js'), 'utf8');

vm.runInThisContext(chordTheoryCode);
vm.runInThisContext(promptGeneratorCode);

// Load real JSON data files for comprehensive testing
const rootDir = path.join(__dirname, '..');
const realData = {
  genre: JSON.parse(fs.readFileSync(path.join(rootDir, 'genre.json'), 'utf8')),
  vocal: JSON.parse(fs.readFileSync(path.join(rootDir, 'suno_style_vocal_spec.json'), 'utf8')),
  instruments: JSON.parse(fs.readFileSync(path.join(rootDir, 'suno_instrument_techniques.json'), 'utf8')),
  chord: JSON.parse(fs.readFileSync(path.join(rootDir, 'suno_chord_phrases.json'), 'utf8')),
  mood: JSON.parse(fs.readFileSync(path.join(rootDir, 'suno_mood_phrases.json'), 'utf8')),
  structure: JSON.parse(fs.readFileSync(path.join(rootDir, 'suno_style_structure_phrases.json'), 'utf8'))
};

test('PromptGenerator.categoryOrder handles custom tab ordering', () => {
  const customOrder = ['structures', 'bpm', 'genres', 'instruments'];
  const resultOrder = PromptGenerator.categoryOrder(customOrder);

  // All ORDER_ITEMS must be present in resultOrder
  assert.equal(resultOrder.length, PromptGenerator.ORDER_ITEMS.length);
  PromptGenerator.ORDER_ITEMS.forEach(item => {
    assert.ok(resultOrder.includes(item));
  });

  // The relative order of the provided items should be preserved
  const structuresIdx = resultOrder.indexOf('structures');
  const bpmIdx = resultOrder.indexOf('bpm');
  const genresIdx = resultOrder.indexOf('genres');
  const instrumentsIdx = resultOrder.indexOf('instruments');

  assert.ok(structuresIdx < bpmIdx, 'structures should come before bpm in custom order');
  assert.ok(bpmIdx < genresIdx, 'bpm should come before genres in custom order');
  assert.ok(genresIdx < instrumentsIdx, 'genres should come before instruments in custom order');
});

test('PromptGenerator.splitTopLevel correctly splits outside parentheses', () => {
  const input = 'Grand Piano (legato, panned left), Synth-Pop, female vocal (soft, wide stereo)';
  const parts = PromptGenerator.splitTopLevel(input, ',');
  assert.equal(parts.length, 3);
  assert.equal(parts[0].trim(), 'Grand Piano (legato, panned left)');
  assert.equal(parts[1].trim(), 'Synth-Pop');
  assert.equal(parts[2].trim(), 'female vocal (soft, wide stereo)');
});

test('PromptGenerator.matchKey normalizes spaces, case, and hyphens', () => {
  assert.equal(PromptGenerator.matchKey('Synth-Pop'), 'synthpop');
  assert.equal(PromptGenerator.matchKey('synth pop'), 'synthpop');
  assert.equal(PromptGenerator.matchKey('  SYNTH - POP  '), 'synthpop');
});

test('PromptGenerator.generatePrompt generates correct prompt string', () => {
  const generator = new PromptGenerator(realData);
  const selections = {
    bpm: 120,
    genres: ['1980s', 'Synth-Pop'],
    vocals: ['female vocal'],
    instruments: ['Grand Piano'],
    instrumentTones: { 'Grand Piano': ['warm'] },
    positions: { 'instruments:Grand Piano': { pan: 'panned left', depth: 'upfront' } },
    chords: ['I-V-vi-IV progression'],
    moods: ['upbeat'],
    structures: ['intro'],
    customs: { genres: 'synthwave' },
    excludes: { moods: ['dark'] },
    categoryOrder: PromptGenerator.ORDER_ITEMS
  };

  const prompt = generator.generatePrompt(selections);
  assert.ok(prompt.includes('120 bpm'));
  assert.ok(prompt.includes('1980s, Synth-Pop'));
  assert.ok(prompt.includes('synthwave'));
  assert.ok(prompt.includes('female vocal'));
  assert.ok(prompt.includes('warm Grand Piano (panned left, upfront)'));
  assert.ok(prompt.includes('[EXCLUDE: dark]'));
});

test('PromptGenerator.parsePrompt parses raw style prompt back into selections', () => {
  const generator = new PromptGenerator(realData);
  const rawText = '128 bpm, Synth-Pop, female vocal, warm Grand Piano (legato, panned left), [EXCLUDE: dark]';
  const { selections, ambiguous } = generator.parsePrompt(rawText);

  assert.equal(selections.bpm, 128);
  assert.ok(selections.genres.includes('Synth-Pop'));
  assert.ok(selections.vocals.includes('female vocal'));
  assert.ok(selections.instruments.includes('Grand Piano'));
  assert.ok(selections.instrumentTones['Grand Piano']?.includes('warm'));
  assert.equal(selections.positions['instruments:Grand Piano']?.pan, 'panned left');
  assert.ok(selections.excludes.moods.includes('dark'));
});

test('PromptGenerator.generateLyrics generates metatags and lyrics', () => {
  const generator = new PromptGenerator(realData);
  const selections = {
    lyricTags: {
      verse1: { vocals: ['whisper vocals'] },
      chorus: { moods: ['upbeat'] }
    },
    lyrics: {
      verse1: 'Softly in the dark...',
      chorus: 'Singing out loud!'
    }
  };

  const lyricsText = generator.generateLyrics(selections);
  assert.ok(lyricsText.includes('[Verse 1, whisper vocals]\nSoftly in the dark...'));
  assert.ok(lyricsText.includes('[Chorus, upbeat]\nSinging out loud!'));
});

test('PromptGenerator.getStagePlacements returns placement list for stage diagram', () => {
  const generator = new PromptGenerator(realData);
  const selections = {
    instruments: ['Grand Piano'],
    vocals: ['female vocal'],
    positions: {
      'instruments:Grand Piano': { pan: 'panned left', depth: 'upfront' },
      'vocals:female': { pan: 'centered', depth: 'upfront' }
    }
  };

  const placements = generator.getStagePlacements(selections);
  assert.ok(Array.isArray(placements));
  const piano = placements.find(p => p.key === 'Grand Piano');
  assert.ok(piano);
  assert.equal(piano.pan, 'panned left');
  assert.equal(piano.depth, 'upfront');
  assert.equal(piano.placed, true);
});

test('PromptGenerator.flattenAllItems returns structured item lists', () => {
  const generator = new PromptGenerator(realData);
  const items = generator.flattenAllItems();

  assert.ok(items.genres.allGenres.length > 0);
  assert.ok(items.vocals.allPhrases.length > 0);
  assert.ok(items.instruments.allTechniques.length > 0);
  assert.ok(items.chords.allPhrases.length > 0);
  assert.ok(items.moods.allPhrases.length > 0);
  assert.ok(items.structures.allPhrases.length > 0);
});
