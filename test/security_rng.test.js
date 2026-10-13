const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load ChordTheory and PromptGenerator in global context
const chordTheoryCode = fs.readFileSync(path.join(__dirname, '../src/utils/chordTheory.js'), 'utf-8');
const promptGeneratorCode = fs.readFileSync(path.join(__dirname, '../src/utils/promptGenerator.js'), 'utf-8');

vm.runInThisContext(chordTheoryCode);
vm.runInThisContext(promptGeneratorCode);

console.log('--- Running Security RNG Tests ---');

// Test 1: getRandomFloat returns valid floats in [0, 1)
for (let i = 0; i < 1000; i++) {
  const val = getRandomFloat();
  assert(typeof val === 'number', 'getRandomFloat should return a number');
  assert(!isNaN(val), 'getRandomFloat should not return NaN');
  assert(val >= 0 && val < 1, `getRandomFloat returned ${val}, which is outside [0, 1)`);
}
console.log('✓ getRandomFloat range and type check passed (1000 iterations)');

// Test 2: Verify crypto.getRandomValues is actually used
if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
  let called = false;
  const originalFn = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
  globalThis.crypto.getRandomValues = function (arr) {
    called = true;
    return originalFn(arr);
  };
  getRandomFloat();
  assert.strictEqual(called, true, 'getRandomFloat must call globalThis.crypto.getRandomValues');
  globalThis.crypto.getRandomValues = originalFn;
  console.log('✓ globalThis.crypto.getRandomValues invocation verified');
}

// Test 3: PromptGenerator tests with sample data
const sampleData = {
  genre: {
    Era: ['1980s', '1990s'],
    Rock: ['Alternative Rock', 'Hard Rock'],
    Pop: ['Synth-Pop', 'Dance-Pop']
  },
  vocal: {
    vocal_modes: {
      female: { style_phrases: ['female vocal', 'warm female vocal'], style_modifiers: ['whispering'] }
    },
    vocal_descriptors: {
      resonance: { phrases: ['airy', 'chesty'] }
    }
  },
  instruments: {
    tone_descriptors: ['warm', 'bright'],
    instruments: {
      'Grand Piano': { aliases: ['Piano'], category: 'keyboard', techniques: ['arpeggiated', 'staccato'] }
    }
  },
  chord: {
    categories: {
      Progressions: { phrases: ['pop progression'] }
    }
  },
  mood: {
    categories: {
      Energy: { phrases: ['energetic'] }
    }
  },
  structure: {
    categories: {
      Arrangement: { phrases: ['intro'] }
    }
  }
};

const generator = new PromptGenerator(sampleData);

for (let i = 0; i < 50; i++) {
  const sel = generator.getRandomSelection();
  assert(Array.isArray(sel.genres), 'genres should be array');
  assert(Array.isArray(sel.vocals), 'vocals should be array');
  assert(Array.isArray(sel.instruments), 'instruments should be array');
  assert(Array.isArray(sel.chords), 'chords should be array');
  assert(Array.isArray(sel.moods), 'moods should be array');
  assert(Array.isArray(sel.structures), 'structures should be array');
  assert(typeof sel.bpm === 'number' && sel.bpm >= 40 && sel.bpm <= 200, `BPM out of range: ${sel.bpm}`);
}
console.log('✓ PromptGenerator random selection tests passed (50 iterations)');

// Test 4: ChordTheory random progression & melody tests
for (let i = 0; i < 50; i++) {
  const prog = ChordTheory.randomProgression('C', 'major', '4/4', 4);
  assert(Array.isArray(prog) && prog.length === 4, 'progression should have 4 chords');
  const melody = ChordTheory.randomMelody('C', 'major', prog);
  assert(Array.isArray(melody), 'melody should be array');
}
console.log('✓ ChordTheory random progression and melody tests passed (50 iterations)');

console.log('All security RNG tests completed successfully!');
