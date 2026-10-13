const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadProgAudio() {
  const code = fs.readFileSync(path.join(__dirname, '../src/utils/progAudio.js'), 'utf8');
  const sandbox = {
    Math,
    console,
    globalThis: {}
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(code + '; globalThis.ProgAudio = ProgAudio;', context);
  return sandbox.globalThis.ProgAudio;
}

describe('ProgAudio.midiFreq', () => {
  const ProgAudio = loadProgAudio();

  test('converts standard concert pitch A4 (MIDI 69) to 440 Hz', () => {
    const freq = ProgAudio.midiFreq(69);
    assert.strictEqual(freq, 440);
  });

  test('converts octave above A5 (MIDI 81) to 880 Hz', () => {
    const freq = ProgAudio.midiFreq(81);
    assert.strictEqual(freq, 880);
  });

  test('converts octave below A3 (MIDI 57) to 220 Hz', () => {
    const freq = ProgAudio.midiFreq(57);
    assert.strictEqual(freq, 220);
  });

  test('converts middle C4 (MIDI 60) accurately to ~261.6256 Hz', () => {
    const freq = ProgAudio.midiFreq(60);
    assert.ok(Math.abs(freq - 261.6255653005986) < 1e-6);
  });

  test('handles lower bound MIDI 0 (C-1)', () => {
    const freq = ProgAudio.midiFreq(0);
    // 440 * 2^((0 - 69)/12) = 440 * 2^(-5.75) ≈ 8.1757989156
    assert.ok(Math.abs(freq - 8.1757989156) < 1e-4);
  });

  test('handles upper bound MIDI 127 (G9)', () => {
    const freq = ProgAudio.midiFreq(127);
    // 440 * 2^((127 - 69)/12) = 440 * 2^(58/12) ≈ 12543.8539514
    assert.ok(Math.abs(freq - 12543.8539514) < 1e-4);
  });

  test('handles fractional microtonal MIDI notes (quarter tones)', () => {
    const freq = ProgAudio.midiFreq(69.5);
    // 440 * 2^(0.5 / 12) ≈ 452.8929841
    assert.ok(Math.abs(freq - 452.8929841) < 1e-4);
  });
});
