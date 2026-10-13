const test = require('node:test');
const assert = require('node:assert/strict');
const ChordTheory = require('../src/utils/chordTheory.js');

test('ChordTheory.scalePcs - Major scales', (t) => {
  // C Major scale: C D E F G A B -> [0, 2, 4, 5, 7, 9, 11]
  assert.deepEqual(
    ChordTheory.scalePcs('C', 'major'),
    [0, 2, 4, 5, 7, 9, 11]
  );

  // G Major scale: G A B C D E F# -> [7, 9, 11, 0, 2, 4, 6]
  assert.deepEqual(
    ChordTheory.scalePcs('G', 'major'),
    [7, 9, 11, 0, 2, 4, 6]
  );

  // F Major scale: F G A Bb C D E -> [5, 7, 9, 10, 0, 2, 4]
  assert.deepEqual(
    ChordTheory.scalePcs('F', 'major'),
    [5, 7, 9, 10, 0, 2, 4]
  );

  // D Major scale: D E F# G A B C# -> [2, 4, 6, 7, 9, 11, 1]
  assert.deepEqual(
    ChordTheory.scalePcs('D', 'major'),
    [2, 4, 6, 7, 9, 11, 1]
  );
});

test('ChordTheory.scalePcs - Minor scales', (t) => {
  // A Natural Minor scale: A B C D E F G -> [9, 11, 0, 2, 4, 5, 7]
  assert.deepEqual(
    ChordTheory.scalePcs('A', 'minor'),
    [9, 11, 0, 2, 4, 5, 7]
  );

  // C Natural Minor scale: C D Eb F G Ab Bb -> [0, 2, 3, 5, 7, 8, 10]
  assert.deepEqual(
    ChordTheory.scalePcs('C', 'minor'),
    [0, 2, 3, 5, 7, 8, 10]
  );

  // E Natural Minor scale: E F# G A B C D -> [4, 6, 7, 9, 11, 0, 2]
  assert.deepEqual(
    ChordTheory.scalePcs('E', 'minor'),
    [4, 6, 7, 9, 11, 0, 2]
  );
});

test('ChordTheory.scalePcs - Sharp and Flat key signatures', (t) => {
  // F# Major: F# G# A# B C# D# E# -> [6, 8, 10, 11, 1, 3, 5]
  assert.deepEqual(
    ChordTheory.scalePcs('F#', 'major'),
    [6, 8, 10, 11, 1, 3, 5]
  );

  // Db Major: Db Eb F Gb Ab Bb C -> [1, 3, 5, 6, 8, 10, 0]
  assert.deepEqual(
    ChordTheory.scalePcs('Db', 'major'),
    [1, 3, 5, 6, 8, 10, 0]
  );

  // Eb Minor: Eb F Gb Ab Bb Cb Db -> [3, 5, 6, 8, 10, 11, 1]
  assert.deepEqual(
    ChordTheory.scalePcs('Eb', 'minor'),
    [3, 5, 6, 8, 10, 11, 1]
  );

  // C# Minor: C# D# E F# G# A B -> [1, 3, 4, 6, 8, 9, 11]
  assert.deepEqual(
    ChordTheory.scalePcs('C#', 'minor'),
    [1, 3, 4, 6, 8, 9, 11]
  );
});

test('ChordTheory.scalePcs - Default mode behavior', (t) => {
  // When mode is not 'minor', scalePcs uses major scale steps
  assert.deepEqual(
    ChordTheory.scalePcs('C'),
    ChordTheory.scalePcs('C', 'major')
  );

  assert.deepEqual(
    ChordTheory.scalePcs('G', 'unknown_mode'),
    ChordTheory.scalePcs('G', 'major')
  );

  // Verify scale length is 7 notes
  assert.equal(ChordTheory.scalePcs('Bb', 'major').length, 7);
  assert.equal(ChordTheory.scalePcs('Bb', 'minor').length, 7);
});
