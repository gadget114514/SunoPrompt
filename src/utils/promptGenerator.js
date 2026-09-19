class PromptGenerator {
  constructor(jsonData) {
    this.data = jsonData;
  }

  generatePrompt(selections) {
    const parts = [];

    // BPM (if specified)
    if (selections.bpm) {
      parts.push(`${selections.bpm} bpm`);
    }

    // Genre, with any era (e.g. "1980s") placed first
    if (selections.genres && selections.genres.length > 0) {
      const eras = this.data.genre?.[PromptGenerator.ERA_GROUP] || [];
      const genres = [
        ...selections.genres.filter(g => eras.includes(g)),
        ...selections.genres.filter(g => !eras.includes(g))
      ];
      parts.push(genres.join(', '));
    }

    // Vocal (can be mode names or phrases/modifiers). A mode's position is
    // attached to its first selected phrase, e.g. "female vocal (panned left)"
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
    parts.push(...vocalParts.map(part => part.text));

    // Instruments: techniques and position are always attached to their
    // instrument name, e.g. "Grand Piano (legato arpeggios, panned left)"
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

    // Chord / harmony phrases
    if (selections.chords && selections.chords.length > 0) {
      parts.push(...selections.chords);
    }

    // Structure phrases
    if (selections.structures && selections.structures.length > 0) {
      const structurePhrases = selections.structures.map(s => {
        if (this.data.structure?.categories?.[s]?.phrases) {
          return this.data.structure.categories[s].phrases[0];
        }
        return s;
      });
      parts.push(...structurePhrases);
    }

    return parts.join(', ');
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

  getRandomSelection() {
    const selection = {
      genres: [],
      vocals: [],
      instruments: [],
      chords: [],
      structures: [],
      bpm: this.getRandomBPM()
    };

    // Random genres (1-2), plus an era some of the time
    if (this.data.genre) {
      const allGenres = [];
      for (const [groupName, genreList] of Object.entries(this.data.genre)) {
        if (Array.isArray(genreList) && groupName !== PromptGenerator.ERA_GROUP) {
          allGenres.push(...genreList);
        }
      }
      const eras = this.data.genre[PromptGenerator.ERA_GROUP];
      if (Array.isArray(eras) && eras.length > 0 && Math.random() < 0.3) {
        selection.genres.push(eras[Math.floor(Math.random() * eras.length)]);
      }
      if (allGenres.length > 0) {
        const count = Math.random() > 0.5 ? 2 : 1;
        for (let i = 0; i < count && allGenres.length > 0; i++) {
          const idx = Math.floor(Math.random() * allGenres.length);
          selection.genres.push(allGenres[idx]);
          allGenres.splice(idx, 1);
        }
      }
    }

    // Random vocal (mode + 1-2 phrases)
    if (this.data.vocal?.vocal_modes) {
      const vocalModes = Object.entries(this.data.vocal.vocal_modes);
      if (vocalModes.length > 0) {
        const [modeName, modeData] = vocalModes[Math.floor(Math.random() * vocalModes.length)];

        // Add vocal mode
        selection.vocals.push(modeName);

        // Add 1-2 style phrases from this mode
        const phrases = [];
        if (modeData.style_phrases) phrases.push(...modeData.style_phrases);
        if (modeData.style_modifiers) phrases.push(...modeData.style_modifiers);

        if (phrases.length > 0) {
          const phraseCount = Math.min(Math.random() > 0.6 ? 2 : 1, phrases.length);
          for (let i = 0; i < phraseCount; i++) {
            const idx = Math.floor(Math.random() * phrases.length);
            selection.vocals.push(phrases[idx]);
            phrases.splice(idx, 1);
          }
        }
      }
    }

    // Random instruments (2-4 with more techniques each)
    if (this.data.instruments?.instruments) {
      const instruments = Object.entries(this.data.instruments.instruments);
      if (instruments.length > 0) {
        // Weighted selection: more instruments used
        const weights = [2, 2, 3, 4];
        const instrumentCount = weights[Math.floor(Math.random() * weights.length)];
        const selectedInstruments = [];

        for (let i = 0; i < instrumentCount && instruments.length > 0; i++) {
          const idx = Math.floor(Math.random() * instruments.length);
          const [instName, instData] = instruments[idx];

          // Add instrument
          selectedInstruments.push(instName);

          // Add 2-3 techniques from this instrument
          if (instData.techniques && instData.techniques.length > 0) {
            const techniques = [...instData.techniques];
            const techCount = Math.min(Math.floor(Math.random() * 2) + 2, techniques.length);
            for (let j = 0; j < techCount; j++) {
              const tidx = Math.floor(Math.random() * techniques.length);
              selectedInstruments.push(PromptGenerator.techniqueValue(instName, techniques[tidx]));
              techniques.splice(tidx, 1);
            }
          }

          instruments.splice(idx, 1);
        }
        selection.instruments = selectedInstruments;
      }
    }

    // Random chords: sometimes one progression, sometimes one chord color
    if (this.data.chord?.categories) {
      for (const categoryName of ['Progressions', 'Chord Colors']) {
        const phrases = this.data.chord.categories[categoryName]?.phrases;
        if (phrases && phrases.length > 0 && Math.random() < 0.5) {
          selection.chords.push(phrases[Math.floor(Math.random() * phrases.length)]);
        }
      }
    }

    // Random structures (2-3 phrases)
    if (this.data.structure?.categories) {
      const allStructures = [];
      for (const categoryData of Object.values(this.data.structure.categories)) {
        if (categoryData.phrases) {
          allStructures.push(...categoryData.phrases);
        }
      }
      if (allStructures.length > 0) {
        const count = Math.min(Math.floor(Math.random() * 3) + 2, allStructures.length);
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * allStructures.length);
          selection.structures.push(allStructures[idx]);
          allStructures.splice(idx, 1);
        }
      }
    }

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
  pan: ['centered', 'panned left', 'panned right', 'panned hard left', 'panned hard right', 'wide stereo'],
  depth: ['upfront', 'close-miked', 'in the background', 'distant']
};
