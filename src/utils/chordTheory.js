// Chord progression theory helpers (key/scale/diatonic/templates).
// Loaded before promptGenerator.js / renderer.js via a plain script tag.

function getRandomFloat() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] / 4294967296;
  }
  if (typeof require !== 'undefined') {
    try {
      const crypto = require('crypto');
      if (typeof crypto.getRandomValues === 'function') {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] / 4294967296;
      }
      if (typeof crypto.randomBytes === 'function') {
        return crypto.randomBytes(4).readUInt32BE(0) / 4294967296;
      }
    } catch (e) {}
  }
  return Math.random();
}

class ChordTheory {
  // One chord the palette / timeline deals with.
  // quality values: maj, min, 7, maj7, m7, m7b5, dim, aug, sus4, add9
  static QUALITIES = ['maj', 'min', '7', 'maj7', 'm7', 'm7b5', 'dim', 'aug', 'sus4', 'add9'];

  static KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  static MODES = ['major', 'minor'];

  static METERS = {
    '4/4': { beatsPerBar: 4, label: '4/4' },
    '3/4': { beatsPerBar: 3, label: '3/4' },
    '2/4': { beatsPerBar: 2, label: '2/4' },
    '6/8': { beatsPerBar: 6, label: '6/8' }
  };

  static ROMAN_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  static ROMAN_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

  // Progression templates as scale-degree indexes (0-based) + optional quality override.
  // quality: null = diatonic default, otherwise force (e.g. blues dominant 7ths -> non-diatonic demo).
  static TEMPLATES = [
    { id: 'p-iv-vi-iv', degrees: [0, 4, 5, 3], qualities: [null, null, null, null] },
    { id: 'p-vi-iv-i-v', degrees: [5, 3, 0, 4], qualities: [null, null, null, null] },
    { id: 'p-i-vi-iv-v', degrees: [0, 5, 3, 4], qualities: [null, null, null, null] },
    { id: 'p-ii-v-i', degrees: [1, 4, 0], qualities: [null, null, null] },
    { id: 'p-canon', degrees: [0, 4, 5, 2, 3, 0, 3, 4], qualities: [null, null, null, null, null, null, null, null] },
    { id: 'p-royal', degrees: [3, 4, 2, 5], qualities: [null, null, null, null] },
    { id: 'p-blues12', degrees: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4], qualities: ['7', '7', '7', '7', '7', '7', '7', '7', '7', '7', '7', '7'] },
    { id: 'p-i-vi-iii-vii-min', degrees: [0, 5, 2, 6], qualities: [null, null, null, null] },
    { id: 'p-i-iv-v-min', degrees: [0, 3, 4], qualities: [null, null, null] }
  ];

  static pcOf(name) {
    const flat = { Cb: 11, Db: 1, Eb: 3, Fb: 4, Gb: 6, Ab: 8, Bb: 10 };
    const sharp = { 'C#': 1, 'D#': 3, 'F#': 6, 'G#': 8, 'A#': 10 };
    if (flat[name] !== undefined) return flat[name];
    if (sharp[name] !== undefined) return sharp[name];
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    return base[name[0]] ?? 0;
  }

  static SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  static nameOfPc(pc) {
    return ChordTheory.SHARP_NAMES[((pc % 12) + 12) % 12];
  }

  static scalePcs(key, mode) {
    const root = ChordTheory.pcOf(key);
    const steps = mode === 'minor' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    return steps.map(s => (root + s) % 12);
  }

  // Default (diatonic) quality per degree.
  static diatonicQuality(degree, mode) {
    if (mode === 'minor') return ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'][degree];
    return ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'][degree];
  }

  static romanOf(degree, mode) {
    return mode === 'minor' ? ChordTheory.ROMAN_MINOR[degree] : ChordTheory.ROMAN_MAJOR[degree];
  }

  static rootOf(key, mode, degree) {
    return ChordTheory.nameOfPc((ChordTheory.pcOf(key) + (mode === 'minor' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11])[degree]) % 12);
  }

  // Tonic / subdominant / dominant grouping (for future use + hover hints).
  static functionOf(degree, mode) {
    if (mode === 'minor') return ['tonic', 'subdominant', 'tonic', 'subdominant', 'dominant', 'tonic', 'dominant'][degree];
    return ['tonic', 'subdominant', 'tonic', 'subdominant', 'dominant', 'tonic', 'dominant'][degree];
  }

  // Accepted user qualities per diatonic default (triad + 7th equivalents).
  // A plain triad on a diatonic root counts as diatonic (e.g. G in C major).
  static acceptedQualities(diatonicQuality) {    switch (diatonicQuality) {
      case 'maj7': return ['maj', 'maj7', 'add9', '6'];
      case 'm7': return ['min', 'm', 'm7', 'm9'];
      case '7': return ['maj', '7', '9'];
      case 'm7b5': return ['m7b5', 'dim', 'dim7'];
      default: return [diatonicQuality];
    }
  }

  // Diatonic check. Returns { diatonic: bool, reason: string }.
  // reason is an English technical phrase; renderer maps it to i18n display.
  static validate(key, mode, root, quality) {
    const scale = ChordTheory.scalePcs(key, mode);
    const pc = ChordTheory.pcOf(root);
    const degree = scale.indexOf(pc);
    if (degree === -1) {
      return { diatonic: false, reason: `root ${root} is outside the ${key} ${mode} scale` };
    }
    const expected = ChordTheory.diatonicQuality(degree, mode);
    // sus4/aug color chords built on a scale tone: still chromatic color, warn.
    if (quality === 'sus4' || quality === 'aug') {
      return { diatonic: false, reason: `${root}${quality} is a chromatic color (diatonic here is ${ChordTheory.rootOf(key, mode, degree)}${expected})` };
    }
    const ok = ChordTheory.acceptedQualities(expected).includes(quality);
    if (!ok) {
      return { diatonic: false, reason: `quality ${quality} differs from diatonic ${ChordTheory.rootOf(key, mode, degree)}${expected} (${ChordTheory.romanOf(degree, mode)})` };
    }
    return { diatonic: true, reason: '' };
  }

  static chordSymbol(root, quality) {
    const suffix = { maj: '', min: 'm', 7: '7', maj7: 'maj7', m7: 'm7', m7b5: 'm7b5', dim: 'dim', aug: 'aug', sus4: 'sus4', add9: 'add9' }[quality] ?? quality;
    return `${root}${suffix}`;
  }

  static beatsPerBar(meter) {
    return ChordTheory.METERS[meter]?.beatsPerBar || 4;
  }

  // Build chord events for a template: 1 chord per bar by default (even split of total beats).
  static buildFromTemplate(templateId, key, mode, meter, bars) {
    const tpl = ChordTheory.TEMPLATES.find(t => t.id === templateId) || ChordTheory.TEMPLATES[0];
    const bpb = ChordTheory.beatsPerBar(meter);
    const total = bars * bpb;
    const n = tpl.degrees.length;
    const base = Math.floor(total / n);
    const extra = total % n;
    let start = 0;
    return tpl.degrees.map((degree, i) => {
      const dur = Math.max(1, base + (i < extra ? 1 : 0));
      const root = ChordTheory.rootOf(key, mode, degree);
      const quality = tpl.qualities[i] || ChordTheory.triQuality(degree, mode);
      const ev = {
        id: `c${Date.now()}_${i}`,
        root,
        quality,
        start,
        dur,
        roman: ChordTheory.romanOf(degree, mode)
      };
      start += dur;
      return ev;
    });
  }

  static triQuality(degree, mode) {
    if (mode === 'minor') return ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'][degree];
    return ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'][degree];
  }

  // Pleasant next-degree candidates (functional movement), shared by both modes.
  static NEXT_DEGREES = {
    0: [4, 5, 3, 2, 1],
    1: [4, 6, 5],
    2: [5, 3, 6, 4],
    3: [4, 0, 5, 1],
    4: [0, 5, 3, 6],
    5: [0, 3, 4, 2],
    6: [0, 5, 3]
  };

  // Random progression: one diatonic chord per bar (N bars), starting and
  // ending on the tonic, random-walking in between without direct repeats.
  static randomProgression(key, mode, meter, bars, rng = getRandomFloat) {
    const bpb = ChordTheory.beatsPerBar(meter);
    const chords = [];
    let degree = 0;
    for (let b = 0; b < bars; b++) {
      if (b === bars - 1 && bars > 1) {
        degree = 0; // resolve home on the last bar
      } else if (b > 0) {
        const next = (ChordTheory.NEXT_DEGREES[degree] || [0, 3, 4, 5])
          .filter(d => d !== degree);
        degree = next[Math.floor(rng() * next.length)];
      }
      chords.push({
        id: `c${Date.now()}_${b}`,
        root: ChordTheory.rootOf(key, mode, degree),
        quality: ChordTheory.triQuality(degree, mode),
        start: b * bpb,
        dur: bpb,
        roman: ChordTheory.romanOf(degree, mode)
      });
    }
    return chords;
  }

  // Semitone offsets of each palette quality above its root.
  static QUALITY_INTERVALS = {
    maj: [0, 4, 7], min: [0, 3, 7], m: [0, 3, 7],
    7: [0, 4, 7, 10], 9: [0, 4, 7, 10, 2],
    maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], m9: [0, 3, 7, 10, 2],
    m7b5: [0, 3, 6, 10], dim: [0, 3, 6], dim7: [0, 3, 6, 9],
    aug: [0, 4, 8], sus4: [0, 5, 7], add9: [0, 4, 7, 2], 6: [0, 4, 7, 9]
  };

  static midiName(midi) {
    return `${ChordTheory.nameOfPc(midi)}${Math.floor(midi / 12) - 1}`;
  }

  // What a melody pitch is against the key and the chord sounding below it:
  // 'chord' (a chord tone), 'scale' (diatonic passing tone) or 'chromatic'.
  static parseChord(str) {
    if (!str || str === '-') return null;
    const m = str.match(/^([A-G][b#]?)(.*?)(\/(.+))?$/);
    if (!m) return null;
    return { root: m[1], quality: m[2] || '', bass: m[4] };
  }

  static noteKind(key, mode, chord, midi) {
    const pc = ((midi % 12) + 12) % 12;
    if (chord) {
      const tones = (ChordTheory.QUALITY_INTERVALS[chord.quality] || [0, 4, 7])
        .map(s => (ChordTheory.pcOf(chord.root) + s) % 12);
      if (tones.includes(pc)) return 'chord';
    }
    return ChordTheory.scalePcs(key, mode).includes(pc) ? 'scale' : 'chromatic';
  }

  // Monophonic melody over the given chords: chord tone on each chord's
  // downbeat, then a stepwise-biased random walk on an 8th-note grid with
  // occasional rests. Range is C4..C6, note lengths 0.5 or 1 beat.
  static randomMelody(key, mode, chords, rng = getRandomFloat) {
    const total = [...chords].reduce((mx, c) => Math.max(mx, c.start + c.dur), 0);
    const inScale = (m) => ChordTheory.scalePcs(key, mode).includes(((m % 12) + 12) % 12);
    const ladder = [];
    for (let m = 60; m <= 84; m++) if (inScale(m)) ladder.push(m);
    const nearestIdx = (m) => {
      let best = 0, bd = Infinity;
      ladder.forEach((v, i) => { const d = Math.abs(v - m); if (d < bd) { bd = d; best = i; } });
      return best;
    };
    const chordToneCands = (ch) => {
      const tones = (ChordTheory.QUALITY_INTERVALS[ch.quality] || [0, 4, 7])
        .map(s => (ChordTheory.pcOf(ch.root) + s) % 12);
      const cands = [];
      for (let m = 60; m <= 84; m++) if (tones.includes(((m % 12) + 12) % 12)) cands.push(m);
      return cands.length > 0 ? cands : [67];
    };
    const notes = [];
    let li = nearestIdx(69);
    [...chords].sort((a, b) => a.start - b.start).forEach(ch => {
      const cands = chordToneCands(ch);
      let m = cands.reduce((best, v) => Math.abs(v - ladder[li]) < Math.abs(best - ladder[li]) ? v : best, cands[0]);
      const push = (start, dur, mm) => {
        if (start < total) {
          notes.push({ id: `m${Date.now()}_${notes.length}`, start: +start.toFixed(2), dur, midi: mm });
        }
      };
      push(ch.start, 0.5, m);
      li = nearestIdx(m);
      let t = ch.start + 0.5;
      while (t < ch.start + ch.dur - 1e-9) {
        if (rng() < 0.18) { t += 0.5; continue; } // rest
        const r = rng();
        if (r < 0.62) {
          li += [-2, -1, -1, 1, 1, 2][Math.floor(rng() * 6)];
        } else if (r < 0.85) {
          const cc = chordToneCands(ch);
          m = cc[Math.floor(rng() * cc.length)];
          li = nearestIdx(m);
        } else {
          li += rng() < 0.5 ? -3 : 3;
        }
        li = Math.max(0, Math.min(ladder.length - 1, li));
        const len = rng() < 0.6 ? 0.5 : 1;
        push(t, Math.min(len, ch.start + ch.dur - t), ladder[li]);
        t += len;
      }
    });
    return notes;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChordTheory;
}
