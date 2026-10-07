// Render the progression timeline (chords + melody) to audio and encode it.
// Loaded via a plain script tag; needs ChordTheory for pitch mapping only.
const ProgAudio = (() => {
  const midiFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const hasTheory = () => typeof ChordTheory !== 'undefined';

  const beatsPerBar = (prog) => {
    if (hasTheory()) return ChordTheory.beatsPerBar(prog.meter);
    return parseInt(prog.meter, 10) || 4;
  };

  // Pad register: root around C3 plus the quality's intervals.
  const chordMidis = (chord) => {
    const pc = hasTheory() ? ChordTheory.pcOf(chord.root) : 0;
    const iv = (hasTheory() && ChordTheory.QUALITY_INTERVALS[chord.quality]) || [0, 4, 7];
    return iv.map(s => 48 + pc + s);
  };

  // Click-free envelope: attack up, hold, release down.
  const adsr = (param, t0, dur, peak, attack, release) => {
    const a = Math.min(attack, dur * 0.4);
    const r = Math.min(release, dur * 0.4);
    param.setValueAtTime(0.0001, t0);
    param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + Math.max(a, 0.01));
    param.setValueAtTime(Math.max(peak, 0.0002), Math.max(t0 + a, t0 + dur - r));
    param.exponentialRampToValueAtTime(0.0001, t0 + dur);
  };

  // Offline mix: triangle pads through a lowpass, sine lead with vibrato,
  // glued by a compressor. Returns an AudioBuffer (mono, 44.1kHz).
  const render = async (prog, bpm) => {
    const rate = 44100;
    const tempo = Math.max(30, Math.min(240, bpm || 120));
    const beat = 60 / tempo;
    const totalBeats = beatsPerBar(prog) * prog.bars;
    const ctx = new OfflineAudioContext(1, Math.ceil((totalBeats * beat + 1.5) * rate), rate);

    const master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    lp.connect(master);

    [...(prog.chords || [])].sort((a, b) => a.start - b.start).forEach(ch => {
      const t0 = ch.start * beat;
      const dur = ch.dur * beat;
      const midis = chordMidis(ch);
      midis.forEach(m => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = midiFreq(m);
        const g = ctx.createGain();
        adsr(g.gain, t0, dur, 0.3 / midis.length, 0.3, 0.4);
        osc.connect(g);
        g.connect(lp);
        osc.start(t0);
        osc.stop(t0 + dur + 0.1);
      });
    });

    [...(prog.melody || [])].sort((a, b) => a.start - b.start).forEach(n => {
      const t0 = n.start * beat;
      const dur = n.dur * beat;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = midiFreq(n.midi);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 5.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 2.0;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      const g = ctx.createGain();
      adsr(g.gain, t0, dur, 0.22, 0.02, 0.1);
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
      lfo.start(t0);
      lfo.stop(t0 + dur + 0.05);
    });

    return ctx.startRendering();
  };

  // 16-bit PCM WAV bytes for an AudioBuffer (duck-typed: sampleRate,
  // numberOfChannels, length/getChannelData work with a stub too).
  const encodeWav = (buffer) => {
    const channels = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }
    const frames = buffer.length;
    const bytes = new Uint8Array(44 + frames * channels.length * 2);
    const view = new DataView(bytes.buffer);
    const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + frames * channels.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels.length, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * channels.length * 2, true);
    view.setUint16(32, channels.length * 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, frames * channels.length * 2, true);
    let off = 44;
    for (let i = 0; i < frames; i++) {
      for (let c = 0; c < channels.length; c++) {
        const v = Math.max(-1, Math.min(1, channels[c][i]));
        view.setInt16(off, v < 0 ? v * 0x8000 : v * 0x7fff, true);
        off += 2;
      }
    }
    return bytes;
  };

  // CBR MP3 via the vendored lamejs (global `lamejs` from vendor/lame.min.js).
  const encodeMp3 = (buffer, kbps = 128) => {
    if (typeof lamejs === 'undefined' || !lamejs.Mp3Encoder) {
      throw new Error('MP3 encoder (lamejs) is not loaded');
    }
    const channels = Math.min(2, buffer.numberOfChannels);
    const enc = new lamejs.Mp3Encoder(channels, buffer.sampleRate, kbps);
    const to16 = (ch) => {
      const d = buffer.getChannelData(ch);
      const out = new Int16Array(d.length);
      for (let i = 0; i < d.length; i++) {
        const v = Math.max(-1, Math.min(1, d[i]));
        out[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
      }
      return out;
    };
    const left = to16(0);
    const right = channels > 1 ? to16(1) : left;
    const parts = [];
    const block = 1152;
    for (let i = 0; i < left.length; i += block) {
      const l = left.subarray(i, i + block);
      const r = channels > 1 ? right.subarray(i, i + block) : l;
      const data = channels > 1 ? enc.encodeBuffer(l, r) : enc.encodeBuffer(l);
      if (data.length > 0) parts.push(new Uint8Array(data));
    }
    const end = enc.flush();
    if (end.length > 0) parts.push(new Uint8Array(end));
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    parts.forEach(p => { out.set(p, off); off += p.length; });
    return out;
  };

  const toBase64 = (bytes) => {
    let s = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(s);
  };

  return { render, encodeWav, encodeMp3, toBase64, midiFreq };
})();
