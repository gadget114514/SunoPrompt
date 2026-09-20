class PromptGenerator {
  constructor(jsonData) {
    this.data = jsonData;
  }

  // BPM and the five categories are written in the order of the tabs,
  // which the user can rearrange by dragging them.
  generatePrompt(selections) {
    const parts = [];

    PromptGenerator.categoryOrder(selections.categoryOrder).forEach(category => {
      parts.push(...this.categoryParts(category, selections));
    });

    return parts.join(', ');
  }

  categoryParts(category, selections) {
    switch (category) {
      case 'bpm': return selections.bpm ? [`${selections.bpm} bpm`] : [];
      case 'genres': return this.genreParts(selections);
      case 'vocals': return this.vocalParts(selections);
      case 'instruments': return this.instrumentParts(selections);
      case 'chords': return this.chordParts(selections);
      case 'structures': return this.structureParts(selections);
      case 'others': return selections.others?.trim() ? [selections.others.trim()] : [];
      default: return [];
    }
  }

  // Genre, with any era (e.g. "1980s") placed first
  genreParts(selections) {
    if (!selections.genres || selections.genres.length === 0) return [];
    const eras = this.data.genre?.[PromptGenerator.ERA_GROUP] || [];
    const genres = [
      ...selections.genres.filter(g => eras.includes(g)),
      ...selections.genres.filter(g => !eras.includes(g))
    ];
    return [genres.join(', ')];
  }

  // Vocal (can be mode names or phrases/modifiers). A mode's position is
  // attached to its first selected phrase, e.g. "female vocal (panned left)"
  vocalParts(selections) {
    const vocalModes = this.data.vocal?.vocal_modes || {};
    const vocalParts = (selections.vocals || []).map(item => {
      if (vocalModes[item]) {
        // Use the first style phrase for this mode
        return { mode: item, text: vocalModes[item].style_phrases?.[0] };
      }
      // It's a phrase or modifier
      return { mode: this.findVocalMode(item), text: item };
    }).filter(part => part.text);
    for (const [modeName, modeData] of Object.entries(vocalModes)) {
      const position = this.getPositionPhrases(selections, 'vocals', modeName);
      if (position.length === 0) continue;
      const target = vocalParts.find(part => part.mode === modeName);
      if (target) {
        target.text = `${target.text} (${position.join(', ')})`;
      } else if (modeData.style_phrases?.[0]) {
        vocalParts.push({ mode: modeName, text: `${modeData.style_phrases[0]} (${position.join(', ')})` });
      }
    }
    return vocalParts.map(part => part.text);
  }

  // Instruments: techniques and position are always attached to their
  // instrument name, e.g. "Grand Piano (legato arpeggios, panned left)"
  instrumentParts(selections) {
    const parts = [];
    const groups = new Map();
    if (selections.instruments && selections.instruments.length > 0) {
      selections.instruments.forEach(item => {
        const { instrument, technique } = this.parseInstrumentItem(item);
        if (!instrument) {
          parts.push(technique);
          return;
        }
        if (!groups.has(instrument)) groups.set(instrument, []);
        if (technique) groups.get(instrument).push(technique);
      });
    }
    // Setting a position is enough to include the instrument
    Object.keys(selections.positions || {}).forEach(key => {
      const [category, instrument] = PromptGenerator.splitPositionKey(key);
      if (category === 'instruments' && !groups.has(instrument)) groups.set(instrument, []);
    });
    groups.forEach((techniques, instrument) => {
      const name = this.getInstrumentName(instrument);
      const details = [...techniques, ...this.getPositionPhrases(selections, 'instruments', instrument)];
      parts.push(details.length > 0 ? `${name} (${details.join(', ')})` : name);
    });
    return parts;
  }

  // Chord / harmony phrases
  chordParts(selections) {
    return [...(selections.chords || [])];
  }

  // Structure phrases
  structureParts(selections) {
    return (selections.structures || []).map(s => {
      if (this.data.structure?.categories?.[s]?.phrases) {
        return this.data.structure.categories[s].phrases[0];
      }
      return s;
    });
  }

  // Display name used in prompts: first alias, e.g. "Grand Piano / Piano" -> "Grand Piano"
  getInstrumentName(instrumentKey) {
    const instrumentData = this.data.instruments?.instruments?.[instrumentKey];
    return instrumentData?.aliases?.[0] || instrumentKey;
  }

  // Older data combined instruments as "Grand Piano / Piano"; map such keys
  // to the first instrument they were split into.
  resolveInstrumentKey(instrumentKey) {
    const instruments = this.data.instruments?.instruments || {};
    if (instruments[instrumentKey]) return instrumentKey;
    const first = instrumentKey.replace(/\s*—.*$/, '').split(' / ')[0].trim();
    return instruments[first] ? first : instrumentKey;
  }

  // Instrument selection values are either an instrument key (name only)
  // or "<instrument key>::<technique>". Bare techniques from older projects
  // are matched to the first instrument that has them.
  parseInstrumentItem(item) {
    const instruments = this.data.instruments?.instruments || {};
    const sep = item.indexOf(PromptGenerator.TECHNIQUE_SEPARATOR);
    if (sep >= 0) {
      return {
        instrument: this.resolveInstrumentKey(item.slice(0, sep)),
        technique: item.slice(sep + PromptGenerator.TECHNIQUE_SEPARATOR.length)
      };
    }
    const instrumentKey = this.resolveInstrumentKey(item);
    if (instruments[instrumentKey]) {
      return { instrument: instrumentKey, technique: null };
    }
    const owner = Object.keys(instruments).find(key => instruments[key].techniques?.includes(item));
    return { instrument: owner || null, technique: item };
  }

  // Older random selections stored bare mode names ("female"); turn them into
  // the mode's main phrase so they have a checkbox, and drop duplicates.
  normalizeVocals(vocals) {
    const vocalModes = this.data.vocal?.vocal_modes || {};
    return [...new Set(vocals.map(item => vocalModes[item]?.style_phrases?.[0] || item))];
  }

  findVocalMode(phrase) {
    const vocalModes = this.data.vocal?.vocal_modes || {};
    return Object.keys(vocalModes).find(mode =>
      vocalModes[mode].style_phrases?.includes(phrase) || vocalModes[mode].style_modifiers?.includes(phrase)
    ) || null;
  }

  // Stereo / depth placement chosen for a vocal mode or instrument
  getPositionPhrases(selections, category, name) {
    const position = selections.positions?.[PromptGenerator.positionKey(category, name)];
    return position ? [position.pan, position.depth].filter(Boolean) : [];
  }

  // Everything that ends up on the stage diagram: the vocal modes and
  // instruments that reach the prompt, each with its chosen placement.
  // Same inclusion rules as generatePrompt, so the diagram matches the text.
  getStagePlacements(selections) {
    const positions = selections.positions || {};
    const named = (category) => Object.keys(positions)
      .map(key => PromptGenerator.splitPositionKey(key))
      .filter(([keyCategory]) => keyCategory === category)
      .map(([, name]) => name);

    const vocalModes = this.data.vocal?.vocal_modes || {};
    const modes = new Set();
    (selections.vocals || []).forEach(item => {
      const mode = vocalModes[item] ? item : this.findVocalMode(item);
      if (mode) modes.add(mode);
    });
    named('vocals').forEach(name => {
      if (vocalModes[name]) modes.add(name);
    });

    const instruments = new Set();
    (selections.instruments || []).forEach(item => {
      const { instrument } = this.parseInstrumentItem(item);
      if (instrument) instruments.add(instrument);
    });
    named('instruments').forEach(name => instruments.add(name));

    return [
      ...[...modes].map(mode => this.stagePlacement(selections, 'vocals', mode, mode)),
      ...[...instruments].map(key => this.stagePlacement(selections, 'instruments', key, this.getInstrumentName(key)))
    ];
  }

  stagePlacement(selections, category, key, label) {
    const position = selections.positions?.[PromptGenerator.positionKey(category, key)] || {};
    return {
      category,
      // The raw name/mode used to build the position key, so a dragged pin
      // knows which entry in selections.positions it is moving.
      key,
      // Instrument family ("keyboard", "brass", ...), which picks the icon
      kind: category === 'instruments'
        ? (this.data.instruments?.instruments?.[key]?.category || 'other')
        : category,
      label,
      pan: position.pan || '',
      depth: position.depth || '',
      // Without a position the dot falls back to the middle of the stage
      placed: Boolean(position.pan || position.depth)
    };
  }

  // A usable order out of whatever was stored: known items only, no repeats.
  // Anything the stored order never mentioned — BPM, in an order saved before
  // it joined the tabs — goes back where it sits by default, so a prompt that
  // used to lead with the tempo still does.
  static categoryOrder(order) {
    const known = [...new Set((order || []).filter(c => PromptGenerator.ORDER_ITEMS.includes(c)))];
    PromptGenerator.ORDER_ITEMS.forEach((item, index) => {
      if (!known.includes(item)) known.splice(Math.min(index, known.length), 0, item);
    });
    return known;
  }

  static positionKey(category, name) {
    return `${category}:${name}`;
  }

  static splitPositionKey(key) {
    const sep = key.indexOf(':');
    return [key.slice(0, sep), key.slice(sep + 1)];
  }

  static techniqueValue(instrumentKey, technique) {
    return `${instrumentKey}${PromptGenerator.TECHNIQUE_SEPARATOR}${technique}`;
  }

  // Random pick for a single category, used by the per-category 🎲 buttons
  randomCategory(category) {
    switch (category) {
      case 'genres': return this.randomGenres();
      case 'vocals': return this.randomVocals();
      case 'instruments': return this.randomInstruments();
      case 'chords': return this.randomChords();
      case 'structures': return this.randomStructures();
      default: return [];
    }
  }

  // Random genres (1-2), plus an era some of the time
  randomGenres() {
    if (!this.data.genre) return [];

    const genres = [];
    const allGenres = [];
    for (const [groupName, genreList] of Object.entries(this.data.genre)) {
      if (Array.isArray(genreList) && groupName !== PromptGenerator.ERA_GROUP) {
        allGenres.push(...genreList);
      }
    }

    const eras = this.data.genre[PromptGenerator.ERA_GROUP];
    if (Array.isArray(eras) && eras.length > 0 && Math.random() < 0.3) {
      genres.push(eras[Math.floor(Math.random() * eras.length)]);
    }

    const count = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < count && allGenres.length > 0; i++) {
      const idx = Math.floor(Math.random() * allGenres.length);
      genres.push(allGenres[idx]);
      allGenres.splice(idx, 1);
    }
    return genres;
  }

  // Random vocal: one main phrase from a mode, sometimes plus one more.
  // Only phrases are picked (never the bare mode name), so every pick has
  // its own checkbox and nothing is output twice.
  randomVocals() {
    const vocalModes = Object.values(this.data.vocal?.vocal_modes || {})
      .filter(m => m.style_phrases?.length > 0);
    if (vocalModes.length === 0) return [];

    const modeData = vocalModes[Math.floor(Math.random() * vocalModes.length)];
    const main = modeData.style_phrases[Math.floor(Math.random() * modeData.style_phrases.length)];
    const vocals = [main];

    const extras = [...modeData.style_phrases, ...(modeData.style_modifiers || [])].filter(p => p !== main);
    if (extras.length > 0 && Math.random() > 0.6) {
      vocals.push(extras[Math.floor(Math.random() * extras.length)]);
    }
    return vocals;
  }

  // Random instruments (2-4 with more techniques each)
  randomInstruments() {
    const instruments = Object.entries(this.data.instruments?.instruments || {});
    if (instruments.length === 0) return [];

    // Weighted selection: more instruments used
    const weights = [2, 2, 3, 4];
    const instrumentCount = weights[Math.floor(Math.random() * weights.length)];
    const selected = [];

    for (let i = 0; i < instrumentCount && instruments.length > 0; i++) {
      const idx = Math.floor(Math.random() * instruments.length);
      const [instName, instData] = instruments[idx];

      // Add instrument
      selected.push(instName);

      // Add 2-3 techniques from this instrument
      if (instData.techniques && instData.techniques.length > 0) {
        const techniques = [...instData.techniques];
        const techCount = Math.min(Math.floor(Math.random() * 2) + 2, techniques.length);
        for (let j = 0; j < techCount; j++) {
          const tidx = Math.floor(Math.random() * techniques.length);
          selected.push(PromptGenerator.techniqueValue(instName, techniques[tidx]));
          techniques.splice(tidx, 1);
        }
      }

      instruments.splice(idx, 1);
    }
    return selected;
  }

  // Random chords: sometimes one progression, sometimes one chord color
  randomChords() {
    if (!this.data.chord?.categories) return [];

    const chords = [];
    for (const categoryName of ['Progressions', 'Chord Colors']) {
      const phrases = this.data.chord.categories[categoryName]?.phrases;
      if (phrases && phrases.length > 0 && Math.random() < 0.5) {
        chords.push(phrases[Math.floor(Math.random() * phrases.length)]);
      }
    }
    return chords;
  }

  // Random structures (2-3 phrases)
  randomStructures() {
    const allStructures = [];
    for (const categoryData of Object.values(this.data.structure?.categories || {})) {
      if (categoryData.phrases) {
        allStructures.push(...categoryData.phrases);
      }
    }
    if (allStructures.length === 0) return [];

    const structures = [];
    const count = Math.min(Math.floor(Math.random() * 3) + 2, allStructures.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * allStructures.length);
      structures.push(allStructures[idx]);
      allStructures.splice(idx, 1);
    }
    return structures;
  }

  // Random selection for the given categories; the others come back empty
  getRandomSelection(categories = PromptGenerator.CATEGORIES) {
    const selection = {
      genres: [],
      vocals: [],
      instruments: [],
      chords: [],
      structures: [],
      bpm: this.getRandomBPM()
    };

    categories.forEach(category => {
      selection[category] = this.randomCategory(category);
    });

    return selection;
  }


  getRandomBPM() {
    // Weighted random BPM distribution
    const weights = [
      { range: [60, 90], weight: 0.2 },    // Slow (20%)
      { range: [90, 140], weight: 0.5 },   // Medium (50%)
      { range: [140, 200], weight: 0.3 }   // Fast (30%)
    ];

    const rand = Math.random();
    let accumulated = 0;

    for (const { range, weight } of weights) {
      accumulated += weight;
      if (rand < accumulated) {
        return Math.floor(Math.random() * (range[1] - range[0]) + range[0]);
      }
    }

    return 120; // Default
  }

  // Split a Style text on a separator, but leave anything inside parentheses
  // (instrument/vocal details) in one piece.
  static splitTopLevel(text, sep) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === sep && depth === 0) {
        parts.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    parts.push(current);
    return parts;
  }

  // The key a phrase is looked up by. Both modes ignore letter case; precise
  // mode also drops hyphens and spaces, so "Synth-Pop", "synth pop" and
  // "synthpop" all meet the same entry.
  static matchKey(value, precise) {
    const lower = value.toLowerCase();
    return precise ? lower.replace(/[\s\-–—−]+/g, '') : lower;
  }

  // Lowercase (or, in precise mode, normalized) lookups, built once each.
  genreIndex(precise) {
    const cache = precise ? '_genreIndexPrecise' : '_genreIndex';
    if (!this[cache]) {
      const map = new Map();
      Object.values(this.data.genre || {}).forEach(list => {
        if (!Array.isArray(list)) return;
        list.forEach(name => {
          const key = PromptGenerator.matchKey(name, precise);
          if (!map.has(key)) map.set(key, name);
        });
      });
      this[cache] = map;
    }
    return this[cache];
  }

  vocalIndex(precise) {
    const cache = precise ? '_vocalIndexPrecise' : '_vocalIndex';
    if (!this[cache]) {
      const map = new Map();
      Object.entries(this.data.vocal?.vocal_modes || {}).forEach(([mode, data]) => {
        [...(data.style_phrases || []), ...(data.style_modifiers || [])].forEach(phrase => {
          const key = PromptGenerator.matchKey(phrase, precise);
          if (!map.has(key)) map.set(key, { phrase, mode });
        });
      });
      this[cache] = map;
    }
    return this[cache];
  }

  chordIndex(precise) {
    const cache = precise ? '_chordIndexPrecise' : '_chordIndex';
    if (!this[cache]) {
      const map = new Map();
      Object.values(this.data.chord?.categories || {}).forEach(cat => {
        (cat.phrases || []).forEach(p => {
          const key = PromptGenerator.matchKey(p, precise);
          if (!map.has(key)) map.set(key, p);
        });
      });
      this[cache] = map;
    }
    return this[cache];
  }

  structureIndex(precise) {
    const cache = precise ? '_structureIndexPrecise' : '_structureIndex';
    if (!this[cache]) {
      const map = new Map();
      Object.values(this.data.structure?.categories || {}).forEach(cat => {
        (cat.phrases || []).forEach(p => {
          const key = PromptGenerator.matchKey(p, precise);
          if (!map.has(key)) map.set(key, p);
        });
      });
      this[cache] = map;
    }
    return this[cache];
  }

  instrumentIndex(precise) {
    const cache = precise ? '_instrumentIndexPrecise' : '_instrumentIndex';
    if (!this[cache]) {
      const map = new Map();
      Object.entries(this.data.instruments?.instruments || {}).forEach(([key, data]) => {
        map.set(PromptGenerator.matchKey(key, precise), key);
        (data.aliases || []).forEach(alias => {
          const aliasKey = PromptGenerator.matchKey(alias, precise);
          if (!map.has(aliasKey)) map.set(aliasKey, key);
        });
      });
      this[cache] = map;
    }
    return this[cache];
  }

  // "Grand Piano" or "Grand Piano (legato arpeggios, panned left)" -> the
  // instrument key plus whatever sits inside the parentheses.
  matchInstrument(value, precise) {
    let name = value;
    let details = '';
    const paren = value.indexOf('(');
    if (paren >= 0 && value.endsWith(')')) {
      name = value.slice(0, paren).trim();
      details = value.slice(paren + 1, -1).trim();
    }
    const key = this.instrumentIndex(precise).get(PromptGenerator.matchKey(name, precise));
    return key ? { key, details } : null;
  }

  // A vocal phrase, optionally carrying a position in parentheses
  matchVocal(value, precise) {
    let phrase = value;
    let details = '';
    const paren = value.indexOf('(');
    if (paren >= 0 && value.endsWith(')')) {
      phrase = value.slice(0, paren).trim();
      details = value.slice(paren + 1, -1).trim();
    }
    const entry = this.vocalIndex(precise).get(PromptGenerator.matchKey(phrase, precise));
    return entry ? { ...entry, details } : null;
  }

  // Tick the instrument, its techniques and its position; return anything
  // inside the parentheses that matched nothing, to become free text.
  applyInstrumentParse(sel, { key, details }, precise) {
    const leftovers = [];
    if (!sel.instruments.includes(key)) sel.instruments.push(key);

    const instrument = this.data.instruments?.instruments?.[key] || {};
    const mk = (s) => PromptGenerator.matchKey(s, precise);
    const techniques = new Map((instrument.techniques || []).map(t => [mk(t), t]));
    const panMap = new Map(PromptGenerator.POSITIONS.pan.map(p => [mk(p), p]));
    const depthMap = new Map(PromptGenerator.POSITIONS.depth.map(p => [mk(p), p]));

    let position = {};
    PromptGenerator.splitTopLevel(details, ',').forEach(part => {
      const p = part.trim();
      if (!p) return;
      const keyPart = mk(p);
      if (panMap.has(keyPart)) { position.pan = panMap.get(keyPart); return; }
      if (depthMap.has(keyPart)) { position.depth = depthMap.get(keyPart); return; }
      const tech = techniques.get(keyPart);
      if (tech) {
        const value = PromptGenerator.techniqueValue(key, tech);
        if (!sel.instruments.includes(value)) sel.instruments.push(value);
        return;
      }
      leftovers.push(p);
    });
    if (position.pan || position.depth) {
      sel.positions[PromptGenerator.positionKey('instruments', key)] = position;
    }
    return leftovers;
  }

  applyVocalParse(sel, { phrase, mode, details }, precise) {
    const leftovers = [];
    if (!sel.vocals.includes(phrase)) sel.vocals.push(phrase);

    const mk = (s) => PromptGenerator.matchKey(s, precise);
    const panMap = new Map(PromptGenerator.POSITIONS.pan.map(p => [mk(p), p]));
    const depthMap = new Map(PromptGenerator.POSITIONS.depth.map(p => [mk(p), p]));

    let position = {};
    PromptGenerator.splitTopLevel(details, ',').forEach(part => {
      const p = part.trim();
      if (!p) return;
      const keyPart = mk(p);
      if (panMap.has(keyPart)) { position.pan = panMap.get(keyPart); return; }
      if (depthMap.has(keyPart)) { position.depth = depthMap.get(keyPart); return; }
      leftovers.push(p);
    });
    if (position.pan || position.depth) {
      sel.positions[PromptGenerator.positionKey('vocals', mode)] = position;
    }
    return leftovers;
  }

  // A token can match several flat categories at once — "lo-fi" is both a
  // genre and a production phrase. Collect every match so the caller can
  // resolve the clash rather than silently picking one.
  collectFlatMatches(value, precise) {
    const key = PromptGenerator.matchKey(value, precise);
    const matches = [];
    if (this.genreIndex(precise).has(key)) matches.push({ category: 'genres', value: this.genreIndex(precise).get(key) });
    if (this.chordIndex(precise).has(key)) matches.push({ category: 'chords', value: this.chordIndex(precise).get(key) });
    if (this.structureIndex(precise).has(key)) matches.push({ category: 'structures', value: this.structureIndex(precise).get(key) });
    return matches;
  }

  // Which category wins when a token matches more than one. The tab order
  // decides: the category whose tab sits earliest wins, because that is where
  // the phrase would have been written in the prompt. Categories the order
  // never mentions go last.
  resolveFlatMatch(matches, categoryOrder) {
    const order = categoryOrder || [];
    const rank = (category) => {
      const index = order.indexOf(category);
      return index === -1 ? order.length + 1 : index;
    };
    return matches.slice().sort((a, b) => rank(a.category) - rank(b.category))[0];
  }

  // Turn a flat Style text back into selections: tick every phrase the text
  // can be matched to, set BPM, and put whatever is left into "others".
  // Returns { selections, ambiguous } — ambiguous lists tokens that matched
  // more than one category, so the caller can show which reading won.
  // options.precise leaves ambiguous tokens untouched (they become free text).
  // options.categoryOrder is the tab order used to break ties.
  parsePrompt(text, { precise = false, categoryOrder = [] } = {}) {
    const sel = {
      genres: [], vocals: [], instruments: [], chords: [], structures: [],
      others: '', positions: {}, bpm: null
    };
    const ambiguous = [];
    if (!text) return { selections: sel, ambiguous };

    const leftovers = [];
    PromptGenerator.splitTopLevel(text, ',').forEach(token => {
      const value = token.trim();
      if (!value) return;

      const bpm = value.match(/\b(\d{2,3})\s*bpm\b/i);
      if (bpm) { sel.bpm = parseInt(bpm[1], 10); return; }

      const instrument = this.matchInstrument(value, precise);
      if (instrument) {
        leftovers.push(...this.applyInstrumentParse(sel, instrument, precise));
        return;
      }

      const vocal = this.matchVocal(value, precise);
      if (vocal) {
        leftovers.push(...this.applyVocalParse(sel, vocal, precise));
        return;
      }

      const flat = this.collectFlatMatches(value, precise);
      if (flat.length === 0) {
        leftovers.push(value);
        return;
      }
      if (flat.length > 1 && precise) {
        // Strict mode: never guess, leave the token for the user to resolve.
        leftovers.push(value);
        ambiguous.push({ text: value, chosen: null, alternatives: flat });
        return;
      }
      const chosen = this.resolveFlatMatch(flat, categoryOrder);
      sel[chosen.category].push(chosen.value);
      if (flat.length > 1) {
        ambiguous.push({
          text: value,
          chosen,
          alternatives: flat.filter(match => match !== chosen)
        });
      }
    });

    sel.others = leftovers.join(', ');
    return { selections: sel, ambiguous };
  }

  flattenAllItems() {
    const items = {
      genres: { byCategory: {}, allGenres: [] },
      vocals: [],
      instruments: { byInstrument: {}, allTechniques: [] },
      chords: { byCategory: {}, allPhrases: [] },
      structures: { byCategory: {}, allPhrases: [] }
    };

    // Genres grouped by major genre
    if (this.data.genre) {
      for (const [groupName, genres] of Object.entries(this.data.genre)) {
        if (Array.isArray(genres)) {
          items.genres.byCategory[groupName] = genres;
          items.genres.allGenres.push(...genres);
        }
      }
    }

    // Structure vocals by mode with phrases and modifiers
    items.vocals = { byMode: {}, allPhrases: [] };
    if (this.data.vocal?.vocal_modes) {
      for (const [modeName, modeData] of Object.entries(this.data.vocal.vocal_modes)) {
        items.vocals.byMode[modeName] = [];

        if (modeData.style_phrases) {
          items.vocals.byMode[modeName].push(...modeData.style_phrases);
          items.vocals.allPhrases.push(...modeData.style_phrases);
        }
        if (modeData.style_modifiers) {
          items.vocals.byMode[modeName].push(...modeData.style_modifiers);
          items.vocals.allPhrases.push(...modeData.style_modifiers);
        }
      }
    }

    // Structure instruments by instrument with techniques
    if (this.data.instruments?.instruments) {
      for (const [instrumentName, instrumentData] of Object.entries(this.data.instruments.instruments)) {
        if (instrumentData.techniques) {
          items.instruments.byInstrument[instrumentName] = instrumentData.techniques;
          items.instruments.allTechniques.push(...instrumentData.techniques);
        }
      }
    }

    // Chords by category with phrases
    if (this.data.chord?.categories) {
      for (const [categoryName, categoryData] of Object.entries(this.data.chord.categories)) {
        if (categoryData.phrases) {
          items.chords.byCategory[categoryName] = categoryData.phrases;
          items.chords.allPhrases.push(...categoryData.phrases);
        }
      }
    }

    // Structure by category with phrases
    if (this.data.structure?.categories) {
      for (const [categoryName, categoryData] of Object.entries(this.data.structure.categories)) {
        if (categoryData.phrases) {
          items.structures.byCategory[categoryName] = categoryData.phrases;
          items.structures.allPhrases.push(...categoryData.phrases);
        }
      }
    }

    return items;
  }
}

PromptGenerator.TECHNIQUE_SEPARATOR = '::';
PromptGenerator.ERA_GROUP = 'Era';
PromptGenerator.POSITIONS = {
  pan: ['centered', 'panned left', 'panned right', 'panned hard left', 'panned hard right', 'wide stereo', 'auto-panned'],
  depth: ['upfront', 'close-miked', 'in the background', 'distant']
};
// Selection categories, in the order they appear in the UI
PromptGenerator.CATEGORIES = ['genres', 'vocals', 'instruments', 'chords', 'structures'];
// Everything that has a place in the prompt, in its default order. BPM sits
// among them but holds no selections of its own — its tab only marks where the
// tempo is written, while the control for it stays in the top bar.
PromptGenerator.ORDER_ITEMS = ['bpm', ...PromptGenerator.CATEGORIES, 'others'];
