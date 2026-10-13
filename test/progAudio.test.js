const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Load ChordTheory and ProgAudio into the global scope as in browser script tag environment
const chordTheoryCode = fs.readFileSync(path.join(__dirname, '../src/utils/chordTheory.js'), 'utf8');
const progAudioCode = fs.readFileSync(path.join(__dirname, '../src/utils/progAudio.js'), 'utf8');

vm.runInThisContext(chordTheoryCode);
vm.runInThisContext(progAudioCode);

test('ProgAudio.midiFreq returns correct frequency', () => {
  assert.equal(ProgAudio.midiFreq(69), 440);
  assert.ok(Math.abs(ProgAudio.midiFreq(60) - 261.6255653) < 0.001);
});

test('ProgAudio.hasTheory detects ChordTheory', () => {
  assert.equal(ProgAudio.hasTheory(), true);
});

test('ProgAudio.beatsPerBar returns beats according to meter', () => {
  assert.equal(ProgAudio.beatsPerBar({ meter: '4/4' }), 4);
  assert.equal(ProgAudio.beatsPerBar({ meter: '3/4' }), 3);
  assert.equal(ProgAudio.beatsPerBar({ meter: '6/8' }), 6);
});

test('ProgAudio.chordMidis returns correct MIDI note numbers for C maj', () => {
  const midis = ProgAudio.chordMidis({ root: 'C', quality: 'maj' });
  assert.deepEqual(midis, [48, 52, 55]);
});

test('ProgAudio.encodeWav generates valid WAV header and Uint8Array', () => {
  const stubBuffer = {
    numberOfChannels: 1,
    sampleRate: 44100,
    length: 100,
    getChannelData: () => new Float32Array(100)
  };
  const bytes = ProgAudio.encodeWav(stubBuffer);
  assert.ok(bytes instanceof Uint8Array);
  assert.equal(bytes.length, 44 + 100 * 1 * 2);

  const headerStr = String.fromCharCode(...bytes.subarray(0, 4)) + String.fromCharCode(...bytes.subarray(8, 12));
  assert.equal(headerStr, 'RIFFWAVE');
});

test('ProgAudio.toBase64 converts byte array to base64', () => {
  const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
  assert.equal(ProgAudio.toBase64(bytes), 'SGVsbG8=');
});

test('ProgAudio.encodeMp3 throws error when lamejs is not loaded', () => {
  const stubBuffer = {
    numberOfChannels: 1,
    sampleRate: 44100,
    length: 100,
    getChannelData: () => new Float32Array(100)
  };
  assert.throws(() => {
    ProgAudio.encodeMp3(stubBuffer);
  }, {
    name: 'Error',
    message: 'MP3 encoder (lamejs) is not loaded'
  });
});
