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

test('ChordTheory.pcOf maps note names to pitch classes 0-11', () => {
  assert.equal(ChordTheory.pcOf('C'), 0);
  assert.equal(ChordTheory.pcOf('C#'), 1);
  assert.equal(ChordTheory.pcOf('Db'), 1);
  assert.equal(ChordTheory.pcOf('D'), 2);
  assert.equal(ChordTheory.pcOf('F#'), 6);
  assert.equal(ChordTheory.pcOf('Bb'), 10);
  assert.equal(ChordTheory.pcOf('B'), 11);
});

test('ChordTheory.nameOfPc maps pitch class to sharp note name', () => {
  assert.equal(ChordTheory.nameOfPc(0), 'C');
  assert.equal(ChordTheory.nameOfPc(1), 'C#');
  assert.equal(ChordTheory.nameOfPc(6), 'F#');
  assert.equal(ChordTheory.nameOfPc(10), 'A#');
  assert.equal(ChordTheory.nameOfPc(12), 'C'); // wrapping around 12
});

test('ChordTheory.romanOf returns correct Roman numerals', () => {
  assert.equal(ChordTheory.romanOf(0, 'major'), 'I');
  assert.equal(ChordTheory.romanOf(5, 'major'), 'vi');
  assert.equal(ChordTheory.romanOf(0, 'minor'), 'i');
  assert.equal(ChordTheory.romanOf(1, 'minor'), 'ii°');
});

test('ChordTheory.rootOf calculates scale degree root note', () => {
  assert.equal(ChordTheory.rootOf('C', 'major', 0), 'C');
  assert.equal(ChordTheory.rootOf('C', 'major', 3), 'F');
  assert.equal(ChordTheory.rootOf('C', 'major', 4), 'G');
  assert.equal(ChordTheory.rootOf('A', 'minor', 0), 'A');
});

test('ChordTheory.validate checks diatonic validity', () => {
  // C maj7 in C major is diatonic
  const v1 = ChordTheory.validate('C', 'major', 'C', 'maj7');
  assert.equal(v1.diatonic, true);

  // C maj in C major is accepted
  const v2 = ChordTheory.validate('C', 'major', 'C', 'maj');
  assert.equal(v2.diatonic, true);

  // F# in C major is non-diatonic root
  const v3 = ChordTheory.validate('C', 'major', 'F#', 'maj');
  assert.equal(v3.diatonic, false);

  // Csus4 is a chromatic color warning
  const v4 = ChordTheory.validate('C', 'major', 'C', 'sus4');
  assert.equal(v4.diatonic, false);
});

test('ChordTheory.chordSymbol formats chord symbols', () => {
  assert.equal(ChordTheory.chordSymbol('C', 'maj'), 'C');
  assert.equal(ChordTheory.chordSymbol('A', 'min'), 'Am');
  assert.equal(ChordTheory.chordSymbol('G', '7'), 'G7');
  assert.equal(ChordTheory.chordSymbol('F', 'maj7'), 'Fmaj7');
  assert.equal(ChordTheory.chordSymbol('B', 'm7b5'), 'Bm7b5');
});

test('ChordTheory.beatsPerBar returns correct beats per meter', () => {
  assert.equal(ChordTheory.beatsPerBar('4/4'), 4);
  assert.equal(ChordTheory.beatsPerBar('3/4'), 3);
  assert.equal(ChordTheory.beatsPerBar('2/4'), 2);
  assert.equal(ChordTheory.beatsPerBar('6/8'), 6);
  assert.equal(ChordTheory.beatsPerBar('unknown'), 4);
});

test('ChordTheory.buildFromTemplate builds chord progression timeline', () => {
  const chords = ChordTheory.buildFromTemplate('p-iv-vi-iv', 'C', 'major', '4/4', 4);
  assert.equal(chords.length, 4);
  assert.equal(chords[0].root, 'C');
  assert.equal(chords[1].root, 'G');
  assert.equal(chords[2].root, 'A');
  assert.equal(chords[3].root, 'F');
});

test('ChordTheory.noteKind classifies melody notes', () => {
  const chord = { root: 'C', quality: 'maj' }; // C, E, G (MIDI pitch classes 0, 4, 7)
  // MIDI 60 is C4 (pitch class 0) -> chord tone
  assert.equal(ChordTheory.noteKind('C', 'major', chord, 60), 'chord');
  // MIDI 62 is D4 (pitch class 2) -> scale tone
  assert.equal(ChordTheory.noteKind('C', 'major', chord, 62), 'scale');
  // MIDI 61 is C#4 (pitch class 1) -> chromatic
  assert.equal(ChordTheory.noteKind('C', 'major', chord, 61), 'chromatic');
});
