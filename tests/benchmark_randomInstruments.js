const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');

const chordTheoryCode = fs.readFileSync(path.join(__dirname, '../src/utils/chordTheory.js'), 'utf8');
const promptGeneratorCode = fs.readFileSync(path.join(__dirname, '../src/utils/promptGenerator.js'), 'utf8');

vm.runInThisContext(chordTheoryCode);
vm.runInThisContext(promptGeneratorCode);

const rootDir = path.join(__dirname, '..');
const realData = {
  genre: JSON.parse(fs.readFileSync(path.join(rootDir, 'genre.json'), 'utf8')),
  vocal: JSON.parse(fs.readFileSync(path.join(rootDir, 'suno_style_vocal_spec.json'), 'utf8')),
  instruments: JSON.parse(fs.readFileSync(path.join(rootDir, 'suno_instrument_techniques.json'), 'utf8')),
  chord: JSON.parse(fs.readFileSync(path.join(rootDir, 'suno_chord_phrases.json'), 'utf8')),
  mood: JSON.parse(fs.readFileSync(path.join(rootDir, 'suno_mood_phrases.json'), 'utf8')),
  structure: JSON.parse(fs.readFileSync(path.join(rootDir, 'suno_style_structure_phrases.json'), 'utf8'))
};

function runBenchmark(iterations = 100000) {
  const generator = new PromptGenerator(realData);

  // Warm up
  for (let i = 0; i < 1000; i++) {
    generator.randomInstruments();
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    generator.randomInstruments();
  }
  const end = performance.now();

  const totalTimeMs = end - start;
  const opsPerSec = Math.round((iterations / totalTimeMs) * 1000);

  console.log(`Iterations: ${iterations.toLocaleString()}`);
  console.log(`Total time: ${totalTimeMs.toFixed(2)} ms`);
  console.log(`Ops/sec: ${opsPerSec.toLocaleString()} ops/sec`);
  return { totalTimeMs, opsPerSec };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
