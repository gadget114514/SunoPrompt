const test = require('node:test');
const assert = require('node:assert');

function oldNormalizeGenres(genres) {
  return [...new Set(genres.flatMap(g => g.split(' / ').map(x => x.trim())))];
}

function newNormalizeGenres(genres) {
  const genreSet = new Set();
  for (let i = 0; i < genres.length; i++) {
    const parts = genres[i].split(' / ');
    for (let j = 0; j < parts.length; j++) {
      genreSet.add(parts[j].trim());
    }
  }
  return Array.from(genreSet);
}

const sampleGenreLists = [
  ["Synthwave / Retrowave", "Pop / Dance / Electro", " Rock / Hard Rock ", "Jazz"],
  ["Classical / Baroque", "Synthwave / Cyberpunk", "Hip Hop / Rap / Trap"],
  ["Pop / Dance / Electro", "Indie / Alternative / Rock", " Synthwave / Retrowave "]
];

test('genre normalization output equivalence', () => {
  for (const genres of sampleGenreLists) {
    const oldRes = oldNormalizeGenres(genres);
    const newRes = newNormalizeGenres(genres);
    assert.deepStrictEqual(newRes, oldRes);
  }
});

test('genre normalization performance benchmark', () => {
  const iterations = 500000;

  const genres = sampleGenreLists.flat();

  // Warmup
  for (let i = 0; i < 1000; i++) {
    oldNormalizeGenres(genres);
    newNormalizeGenres(genres);
  }

  const startOld = performance.now();
  for (let i = 0; i < iterations; i++) {
    oldNormalizeGenres(genres);
  }
  const durationOld = performance.now() - startOld;

  const startNew = performance.now();
  for (let i = 0; i < iterations; i++) {
    newNormalizeGenres(genres);
  }
  const durationNew = performance.now() - startNew;

  console.log(`\n--- Benchmark Results (${iterations} iterations) ---`);
  console.log(`Original chained flatMap/map: ${durationOld.toFixed(2)} ms`);
  console.log(`Optimized single-pass Set:    ${durationNew.toFixed(2)} ms`);
  const speedup = ((durationOld - durationNew) / durationOld) * 100;
  console.log(`Performance Improvement:      ${speedup.toFixed(2)}% faster`);

  assert.ok(durationNew <= durationOld, 'New implementation should be faster or equal');
});
