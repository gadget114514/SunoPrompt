let currentLang = localStorage.getItem('suno-lang') || 'en';
let generator = null;
// Reported by the About dialog; both arrive with the JSON payload
let appVersion = null;
let dataFiles = null;

// The tab order, which is also the order the style parts are written in
const CATEGORY_ORDER_KEY = 'suno-category-order';

const readStoredCategoryOrder = () => {
  try {
    return PromptGenerator.categoryOrder(JSON.parse(localStorage.getItem(CATEGORY_ORDER_KEY)));
  } catch (error) {
    return PromptGenerator.categoryOrder(null);
  }
};

const emptyExcludes = () => ({ genres: [], vocals: [], instruments: [], chords: [], moods: [], structures: [] });

// The Lyrics pane's sections and the categories that can carry a metatag
const LYRIC_SECTIONS = PromptGenerator.LYRIC_SECTIONS;
const LYRIC_CATEGORIES = PromptGenerator.LYRIC_CATEGORIES;
// i18n key for each section's label, keyed by its section key
const LYRIC_SECTION_LABEL_KEYS = {
  intro: 'lyricIntro',
  verse1: 'lyricVerse1',
  verse2: 'lyricVerse2',
  preChorus: 'lyricPreChorus',
  chorus: 'lyricChorus',
  outro: 'lyricOutro'
};

// Sample control metatags, so a new project's Lyrics pane is not empty
const SAMPLE_LYRICS = {
  intro: '[Instrumental]\n[Soft Piano]',
  verse1: '[Mood: Calm]\n[Vocal: Breathy]',
  verse2: '[Energy: Medium]',
  preChorus: '[Build-Up]',
  chorus: '[Energy: High]\n[Harmonies]',
  outro: '[Fade Out]\n[End]'
};

// Per section, per category, the items assigned as that section's metatags
const emptyLyricTags = () => {
  const tags = {};
  LYRIC_SECTIONS.forEach(({ key }) => {
    tags[key] = {};
    LYRIC_CATEGORIES.forEach(category => { tags[key][category] = []; });
  });
  return tags;
};

const defaultLyrics = () => ({ ...SAMPLE_LYRICS });

let selections = {
  genres: [],
  vocals: [],
  instruments: [],
  chords: [],
  moods: [],
  structures: [],
  excludes: emptyExcludes(),
  others: '',
  positions: {},
  // Per instrument: tone words ("warm", "icy") and a free-text note
  instrumentTones: {},
  instrumentNotes: {},
  // Per vocal mode: tone words ("warm", "solo")
  vocalTones: {},
  // Per tab: free text for anything the lists do not have
  customs: {},
  categoryOrder: readStoredCategoryOrder(),
  bpm: 120,
  // Lyrics pane: the items written into each section's metatag, and the text
  lyricTags: emptyLyricTags(),
  lyrics: defaultLyrics()
};

const CATEGORIES = PromptGenerator.CATEGORIES;

// Bring older saved projects up to the current data format
const normalizeSelections = (sel) => {
  const normalized = { ...sel };
  CATEGORIES.forEach(category => {
    if (!Array.isArray(normalized[category])) normalized[category] = [];
  });
  if (!normalized.excludes || typeof normalized.excludes !== 'object') normalized.excludes = emptyExcludes();
  CATEGORIES.forEach(category => {
    if (!Array.isArray(normalized.excludes[category])) normalized.excludes[category] = [];
  });
  if (!normalized.positions || typeof normalized.positions !== 'object') normalized.positions = {};
  if (typeof normalized.others !== 'string') normalized.others = '';
  ['instrumentTones', 'instrumentNotes', 'vocalTones', 'customs'].forEach(key => {
    if (!normalized[key] || typeof normalized[key] !== 'object') normalized[key] = {};
  });
  // Projects saved before the Lyrics pane have no tags and get the samples
  if (!normalized.lyricTags || typeof normalized.lyricTags !== 'object') normalized.lyricTags = {};
  LYRIC_SECTIONS.forEach(({ key }) => {
    if (!normalized.lyricTags[key] || typeof normalized.lyricTags[key] !== 'object') normalized.lyricTags[key] = {};
    LYRIC_CATEGORIES.forEach(category => {
      if (!Array.isArray(normalized.lyricTags[key][category])) normalized.lyricTags[key][category] = [];
    });
  });
  if (!normalized.lyrics || typeof normalized.lyrics !== 'object') normalized.lyrics = {};
  LYRIC_SECTIONS.forEach(({ key }) => {
    if (typeof normalized.lyrics[key] !== 'string') normalized.lyrics[key] = SAMPLE_LYRICS[key] || '';
  });
  // Projects saved before tabs could be reordered keep the order in use
  normalized.categoryOrder = PromptGenerator.categoryOrder(normalized.categoryOrder || selections.categoryOrder);
  if (generator) normalized.vocals = generator.normalizeVocals(normalized.vocals);
  // Genres such as "Synthwave / Retrowave" were split into separate items
  normalized.genres = [...new Set(normalized.genres.flatMap(g => g.split(' / ').map(x => x.trim())))];
  normalized.progression = normalizeProgression(normalized.progression);
  return normalized;
};

const t = (key) => translations[currentLang][key] || translations.en[key] || key;

// Keyword display translation (display only; selections and prompts stay English).
// Shows "English (訳)" when the UI language has a translation, English only otherwise.
const keywordTrans = (phrase) => {
  if (currentLang === 'en' || phrase == null) return null;
  try {
    if (typeof keywordTranslations === 'undefined') return null;
    return keywordTranslations[currentLang]?.[phrase] || null;
  } catch (error) {
    return null;
  }
};
const keywordLabel = (phrase) => {
  const tr = keywordTrans(phrase);
  return tr && tr !== phrase ? `${phrase} (${tr})` : phrase;
};

// Locale used for timestamps in the log and the project list
const LOCALES = { en: 'en-US', ja: 'ja-JP', es: 'es-ES' };
const localeFor = () => LOCALES[currentLang] || 'en-US';

const updateLanguage = (lang) => {
  currentLang = lang;
  localStorage.setItem('suno-lang', lang);

  // Update all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Icon buttons and inputs carry their label in an attribute instead
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const text = t(el.getAttribute('data-i18n-title'));
    el.title = text;
    el.setAttribute('aria-label', text);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    if ('placeholder' in el) el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });

  // Update preview placeholder
  const preview = document.getElementById('preview');
  if (Object.values(translations).some(tr => tr.previewPlaceholder === preview.textContent)) {
    preview.textContent = t('previewPlaceholder');
  }
  updateCharCount(generator ? generator.generatePrompt(selections).length : 0);
  updateStageDiagram();
  renderHelp();
  renderAbout();

  // Keyword lists show "English (訳)" in ja/es; rebuild them on language switch.
  // Data and selections stay English, so only the labels change.
  if (generator) {
    renderKeywordLists();
    syncPositionControls();
    syncToneControls();
    updateAllCheckboxes();
    updateFolderHighlights();
    updatePreview();
    if (typeof updateLyricsPreview === 'function') updateLyricsPreview();
  }

  // Update lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`.lang-btn[data-lang="${lang}"]`).classList.add('active');

  addLog(t('logLangSwitched'), 'info');
};

const addLog = (message, type = 'info') => {
  const logWindow = document.getElementById('log-window');
  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const time = new Date().toLocaleTimeString(localeFor());
  const timeEl = document.createElement('span');
  timeEl.className = 'log-time';
  timeEl.textContent = time;

  const msgEl = document.createElement('span');
  msgEl.className = `log-message log-${type}`;
  msgEl.textContent = message;

  entry.appendChild(timeEl);
  entry.appendChild(msgEl);
  logWindow.appendChild(entry);
  logWindow.scrollTop = logWindow.scrollHeight;
};

// The log can be folded away to its header; the button toggles it back open
const LOG_COLLAPSED_KEY = 'suno-log-collapsed';
// ...and the bar above it drags to set how tall the log is
const LOG_HEIGHT_KEY = 'suno-log-height';
const LOG_MIN_HEIGHT = 60;

let logHeight = 100;

// Leave the log a usable minimum and never more than half the window
const clampLogHeight = (height) => {
  const max = Math.max(LOG_MIN_HEIGHT, Math.round(window.innerHeight * 0.5));
  return Math.min(Math.max(Math.round(height), LOG_MIN_HEIGHT), max);
};

// A folded log is only its header, so it sizes itself
const applyLogHeight = () => {
  const container = document.querySelector('.log-container');
  if (!container) return;
  container.style.height = container.classList.contains('collapsed') ? '' : `${logHeight}px`;
};

const setLogHeight = (height) => {
  logHeight = clampLogHeight(height);
  applyLogHeight();
};

const storeLogHeight = () => localStorage.setItem(LOG_HEIGHT_KEY, String(logHeight));

const setLogCollapsed = (collapsed) => {
  const container = document.querySelector('.log-container');
  const button = document.getElementById('toggle-log-btn');
  if (!container || !button) return;

  container.classList.toggle('collapsed', collapsed);
  document.getElementById('log-resizer')?.classList.toggle('log-resizer-off', collapsed);
  applyLogHeight();
  button.textContent = collapsed ? '▼' : '✕';
  const key = collapsed ? 'openLog' : 'closeLog';
  button.setAttribute('data-i18n-title', key);
  button.title = t(key);
  button.setAttribute('aria-label', t(key));
  button.setAttribute('aria-expanded', String(!collapsed));
};

// Suno's Style field accepts up to 1000 characters
const STYLE_CHAR_LIMIT = 1000;

const updateCharCount = (count) => {
  const el = document.getElementById('char-count');
  el.textContent = `${count} / ${STYLE_CHAR_LIMIT} ${t('chars')}`;
  el.classList.toggle('over-limit', count > STYLE_CHAR_LIMIT);
};

const updatePreview = () => {
  if (!generator) return;
  const prompt = generator.generatePrompt(selections);
  const previewEl = document.getElementById('preview');

  // Add animation effect
  previewEl.classList.remove('updated');

  // Always update, even if empty
  if (prompt && prompt.length > 0) {
    previewEl.textContent = prompt;
    previewEl.style.color = '#333';
    previewEl.style.fontStyle = 'normal';
  } else {
    previewEl.textContent = t('previewPlaceholder');
    previewEl.style.color = '#999';
    previewEl.style.fontStyle = 'italic';
  }
  updateCharCount(prompt ? prompt.length : 0);

  updateFolderHighlights();
  updateStageDiagram();
  if (typeof renderProgInfo === 'function') renderProgInfo();
  if (typeof updateLyricsPreview === 'function') updateLyricsPreview();

  // Trigger animation
  setTimeout(() => {
    previewEl.classList.add('updated');
  }, 10);

  // Remove animation class after a short delay
  setTimeout(() => {
    previewEl.classList.remove('updated');
  }, 300);
};

// Fan-shaped stage seen from the listener, who sits at the bottom centre.
// Pan sets the angle, distance sets the radius.
const SVG_NS = 'http://www.w3.org/2000/svg';
const STAGE = { cx: 108, cy: 112, spread: 76, maxR: 106 };
const STAGE_PAN_ANGLE = {
  'panned hard left': -70,
  'panned left': -38,
  'centered': 0,
  'wide stereo': 0,
  'auto-panned': 0,
  'panned right': 38,
  'panned hard right': 70
};
// How far an auto-panned part swings either side of centre
const STAGE_SWEEP_SPAN = 60;
// One icon per instrument family, keyed by the category in the instrument data
const STAGE_ICONS = {
  keyboard: '🎹',
  free_reed: '🪗',
  guitar_plucked: '🎸',
  bass: '🔊',
  bowed_strings: '🎻',
  brass: '🎺',
  woodwind: '🎷',
  percussion: '🥁',
  traditional_world: '🪕',
  electronic: '🎛️',
  ensemble: '🎼',
  vocals: '🎤',
  other: '🎵'
};
// Rings from nearest to farthest; anything without a distance sits in between
const STAGE_DEPTH_RADIUS = {
  'close-miked': 32,
  'upfront': 53,
  'in the background': 77,
  'distant': 97
};
const STAGE_DEFAULT_RADIUS = 65;

// The pan values a drag can land on, mapped to their angles. "wide stereo"
// and "auto-panned" sit at the same angle as "centered" but are drawn
// differently, so dragging one of those turns it into a plain pan.
const DRAG_PAN_ANGLES = [
  ['panned hard left', -70],
  ['panned left', -38],
  ['centered', 0],
  ['panned right', 38],
  ['panned hard right', 70]
];
// The depth values a drag can land on, mapped to their radii. The '' entry is
// the default ring and means "no distance set".
const DRAG_DEPTH_RADII = [
  ['close-miked', 32],
  ['upfront', 53],
  ['', STAGE_DEFAULT_RADIUS],
  ['in the background', 77],
  ['distant', 97]
];

const stagePoint = (angle, radius) => {
  const rad = (angle * Math.PI) / 180;
  return [STAGE.cx + radius * Math.sin(rad), STAGE.cy - radius * Math.cos(rad)];
};

const svgEl = (name, attrs) => {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
};

// A pointer position in screen pixels, turned into viewBox coordinates
const stageClientPoint = (svg, clientX, clientY) => {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const p = point.matrixTransform(ctm.inverse());
  return [p.x, p.y];
};

const snapNearest = (value, entries) => {
  let best = entries[0];
  let bestDistance = Infinity;
  entries.forEach(entry => {
    const distance = Math.abs(value - entry[1]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  });
  return best[0];
};

// Turn a drop point on the stage into the closest pan / depth choices
const snapStagePosition = (x, y) => {
  const dx = x - STAGE.cx;
  const dy = STAGE.cy - y;
  const angle = (Math.atan2(dx, dy) * 180) / Math.PI;
  const radius = Math.hypot(dx, dy);
  return {
    pan: snapNearest(angle, DRAG_PAN_ANGLES),
    depth: snapNearest(radius, DRAG_DEPTH_RADII)
  };
};

// The fan outline, the distance rings and the L/R markers
const drawStageBackground = (svg) => {
  const [leftX, leftY] = stagePoint(-STAGE.spread, STAGE.maxR);
  const [rightX, rightY] = stagePoint(STAGE.spread, STAGE.maxR);
  svg.appendChild(svgEl('path', {
    class: 'stage-field',
    d: `M ${STAGE.cx} ${STAGE.cy} L ${leftX} ${leftY} A ${STAGE.maxR} ${STAGE.maxR} 0 0 1 ${rightX} ${rightY} Z`
  }));

  Object.values(STAGE_DEPTH_RADIUS).forEach(radius => {
    const [x1, y1] = stagePoint(-STAGE.spread, radius);
    const [x2, y2] = stagePoint(STAGE.spread, radius);
    svg.appendChild(svgEl('path', {
      class: 'stage-ring',
      d: `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`
    }));
  });

  const [centreX, centreY] = stagePoint(0, STAGE.maxR);
  svg.appendChild(svgEl('line', { class: 'stage-axis', x1: STAGE.cx, y1: STAGE.cy, x2: centreX, y2: centreY }));
  svg.appendChild(svgEl('circle', { class: 'stage-listener', cx: STAGE.cx, cy: STAGE.cy, r: 4 }));

  [[-STAGE.spread, 'stageLeft'], [STAGE.spread, 'stageRight']].forEach(([angle, key]) => {
    const [x, y] = stagePoint(angle, STAGE.maxR - 10);
    const label = svgEl('text', { class: 'stage-side', x, y: y + 4 });
    label.textContent = t(key);
    svg.appendChild(label);
  });
};

// A part on the stage: a tinted disc with its family icon on it
const stagePin = (placement, x, y) => {
  const pin = svgEl('g', { class: 'stage-pin', transform: `translate(${x} ${y})` });
  pin.appendChild(svgEl('circle', { class: 'stage-pin-disc', r: 9 }));
  const icon = svgEl('text', { class: 'stage-pin-icon' });
  icon.textContent = STAGE_ICONS[placement.kind] || STAGE_ICONS.other;
  pin.appendChild(icon);
  return pin;
};

// The arc an auto-panned part sweeps along, at its own distance from the listener
const sweepPath = (radius) => {
  const [x1, y1] = stagePoint(-STAGE_SWEEP_SPAN, radius);
  const [x2, y2] = stagePoint(STAGE_SWEEP_SPAN, radius);
  return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
};

// A marker that runs the sweep back and forth, so the motion is visible
const sweepRider = (placement, radius) => {
  const rider = svgEl('g', { class: 'stage-rider' });
  rider.appendChild(stagePin(placement, 0, 0));
  rider.appendChild(svgEl('animateMotion', {
    dur: '5s',
    repeatCount: 'indefinite',
    calcMode: 'linear',
    keyPoints: '0;1;0',
    keyTimes: '0;0.5;1',
    path: sweepPath(radius)
  }));
  return rider;
};

// Dots sharing a pan/distance cell are fanned out so none of them hide
const spreadOverlaps = (placements) => {
  const cells = new Map();
  placements.forEach(placement => {
    const key = `${placement.pan}|${placement.depth}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(placement);
  });

  const spread = [];
  cells.forEach(group => {
    const step = Math.min(17, 60 / group.length);
    group.forEach((placement, index) => {
      const offset = index - (group.length - 1) / 2;
      const sweeps = placement.pan === 'auto-panned';
      spread.push({
        ...placement,
        angle: (STAGE_PAN_ANGLE[placement.pan] ?? 0) + (sweeps ? 0 : offset * step),
        radius: (STAGE_DEPTH_RADIUS[placement.depth] ?? STAGE_DEFAULT_RADIUS) + (sweeps ? offset * 7 : 0)
      });
    });
  });
  return spread;
};

// A pin being dragged: which entry it belongs to, and the pointer that moves it
let stageDrag = null;

const startStageDrag = (svg, placement, event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  stageDrag = {
    svg,
    positionKey: PromptGenerator.positionKey(placement.category, placement.key),
    pointerId: event.pointerId
  };
  svg.setPointerCapture?.(event.pointerId);
  document.body.classList.add('stage-dragging');

  const onMove = (move) => {
    if (!stageDrag || move.pointerId !== stageDrag.pointerId) return;
    const point = stageClientPoint(svg, move.clientX, move.clientY);
    if (!point) return;
    const { pan, depth } = snapStagePosition(point[0], point[1]);
    const position = { pan, depth: depth || '' };
    if (position.pan || position.depth) {
      selections.positions[stageDrag.positionKey] = position;
    } else {
      delete selections.positions[stageDrag.positionKey];
    }
    syncPositionControls();
    updatePreview();
  };

  const onUp = () => {
    document.body.classList.remove('stage-dragging');
    svg.removeEventListener('pointermove', onMove);
    svg.removeEventListener('pointerup', onUp);
    svg.removeEventListener('pointercancel', onUp);
    stageDrag = null;
  };

  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', onUp);
  svg.addEventListener('pointercancel', onUp);
};

const updateStageDiagram = () => {
  const svg = document.getElementById('stage-diagram');
  const caption = document.getElementById('stage-caption');
  if (!svg || !generator) return;
  svg.textContent = '';
  drawStageBackground(svg);

  const placements = generator.getStagePlacements(selections);
  caption.textContent = t(placements.length === 0 ? 'stageEmpty' : 'stageHint');

  spreadOverlaps(placements).forEach(placement => {
    const [x, y] = stagePoint(placement.angle, placement.radius);
    const dot = svgEl('g', {
      class: `stage-dot stage-dot-${placement.category}${placement.placed ? '' : ' stage-dot-unplaced'}`
    });

    // Neither "wide stereo" nor "auto-panned" sits at a single point: the
    // first spreads along a bar, the second rides the arc it travels
    if (placement.pan === 'auto-panned') {
      dot.appendChild(svgEl('path', { class: 'stage-sweep', d: sweepPath(placement.radius) }));
      dot.appendChild(sweepRider(placement, placement.radius));
    } else {
      if (placement.pan === 'wide stereo') {
        dot.appendChild(svgEl('rect', { class: 'stage-spread', x: x - 21, y: y - 2, width: 42, height: 4, rx: 2 }));
      }
      dot.appendChild(stagePin(placement, x, y));
    }

    const detail = [placement.pan, placement.depth].filter(Boolean).map(p => keywordLabel(p)).join(', ') || t('stageUnplaced');
    const text = `${keywordLabel(placement.label)} — ${detail}`;
    const title = svgEl('title', {});
    title.textContent = text;
    dot.appendChild(title);

    dot.addEventListener('mouseenter', () => { caption.textContent = text; });
    dot.addEventListener('mouseleave', () => { caption.textContent = t('stageHint'); });
    dot.addEventListener('pointerdown', (event) => startStageDrag(svg, placement, event));
    svg.appendChild(dot);
  });
};

// ---- Chord progression timeline editor (Chords tab) ----
// Model lives in selections.progression:
// { key, mode, meter, bars, templateId, chords: [{id, root, quality, start, dur}], selectedId }
let progBeatPx = 40;
let progCursorBeat = 0;
let progPlayRAF = null;
let progPlayFrom = 0;
let progPlayStamp = 0;
let progGenToken = 0;

const progHasTheory = () => typeof ChordTheory !== 'undefined';

const progDefaults = () => ({
  key: 'C',
  mode: 'major',
  meter: '4/4',
  bars: 4,
  templateId: 'p-iv-vi-iv',
  chords: progHasTheory() ? ChordTheory.buildFromTemplate('p-iv-vi-iv', 'C', 'major', '4/4', 4) : [],
  selectedId: null,
  melody: [],
  melodySelectedId: null
});

// Melody lane geometry (MIDI C4..C6 mapped onto a fixed-height lane).
const MEL_LOW = 60;
const MEL_HIGH = 84;
const MEL_LANE_H = 88;
const melY = (midi) => 2 + ((MEL_HIGH - midi) / (MEL_HIGH - MEL_LOW)) * (MEL_LANE_H - 12);
const yToMel = (y) => Math.max(MEL_LOW, Math.min(MEL_HIGH,
  Math.round(MEL_HIGH - ((y - 2) / (MEL_LANE_H - 12)) * (MEL_HIGH - MEL_LOW))));

const normalizeProgression = (p) => {
  const d = progDefaults();
  if (!p || typeof p !== 'object') return d;
  const prog = {
    key: typeof p.key === 'string' ? p.key : d.key,
    mode: p.mode === 'minor' ? 'minor' : 'major',
    meter: p.meter && progHasTheory() && ChordTheory.METERS[p.meter] ? p.meter : '4/4',
    bars: Number.isFinite(+p.bars) ? Math.min(16, Math.max(1, Math.round(+p.bars))) : 4,
    templateId: typeof p.templateId === 'string' ? p.templateId : d.templateId,
    chords: Array.isArray(p.chords) ? p.chords.filter(c =>
      c && typeof c.root === 'string' && typeof c.quality === 'string' &&
      Number.isFinite(+c.start) && Number.isFinite(+c.dur) && +c.dur > 0) : [],
    selectedId: typeof p.selectedId === 'string' ? p.selectedId : null,
    melody: Array.isArray(p.melody) ? p.melody.filter(n =>
      n && Number.isFinite(+n.start) && Number.isFinite(+n.dur) && +n.dur > 0 &&
      Number.isFinite(+n.midi)) : [],
    melodySelectedId: typeof p.melodySelectedId === 'string' ? p.melodySelectedId : null
  };
  prog.chords = prog.chords.map((c, i) => ({
    id: typeof c.id === 'string' ? c.id : `c${i}`,
    root: c.root,
    quality: (progHasTheory() && ChordTheory.QUALITIES.includes(c.quality)) ? c.quality : 'maj',
    start: Math.max(0, Math.round(+c.start)),
    dur: Math.max(1, Math.round(+c.dur))
  }));
  const total = progTotalBeats(prog);
  prog.chords.forEach(c => { if (c.start >= total) c.start = Math.max(0, total - 1); });
  prog.melody = prog.melody.map((n, i) => ({
    id: typeof n.id === 'string' ? n.id : `m${i}`,
    start: Math.max(0, +n.start),
    dur: Math.max(0.25, +n.dur),
    midi: Math.max(0, Math.min(127, Math.round(+n.midi)))
  })).filter(n => n.start < total);
  return prog;
};

const getProg = () => {
  if (!selections.progression) selections.progression = progDefaults();
  return selections.progression;
};

const progTotalBeats = (prog = getProg()) =>
  (progHasTheory() ? ChordTheory.beatsPerBar(prog.meter) : 4) * prog.bars;

const progTemplateLabel = (tpl) => {
  if (!progHasTheory()) return tpl.id;
  if (tpl.id === 'p-blues12') return '12-bar blues';
  return tpl.degrees.map(d => ChordTheory.ROMAN_MAJOR[d]).join('-');
};

const progCheck = (root, quality, prog = getProg()) =>
  progHasTheory() ? ChordTheory.validate(prog.key, prog.mode, root, quality) : { diatonic: true, reason: '' };

// True when [start, start+dur) hits another chord (optionally ignoring one id).
const progOverlaps = (start, dur, ignoreId = null, prog = getProg()) =>
  prog.chords.some(c => c.id !== ignoreId && start < c.start + c.dur && start + dur > c.start);

const progSelected = (prog = getProg()) => prog.chords.find(c => c.id === prog.selectedId) || null;

const beatToX = (beat) => beat * progBeatPx;
const xToBeat = (x) => Math.max(0, Math.round(x / progBeatPx));

const setupProgressionEditor = () => {
  if (!progHasTheory()) return;
  const $ = (id) => document.getElementById(id);
  const tpl = $('prog-template'), key = $('prog-key'), mode = $('prog-mode'),
    meter = $('prog-meter'), bars = $('prog-bars'), zoom = $('prog-zoom'),
    root = $('prog-root'), quality = $('prog-quality');
  if (!tpl || !key || !root) return;

  tpl.innerHTML = '';
  ChordTheory.TEMPLATES.forEach(t => {
    const o = document.createElement('option');
    o.value = t.id;
    o.textContent = progTemplateLabel(t);
    tpl.appendChild(o);
  });
  const customOpt = document.createElement('option');
  customOpt.value = 'custom';
  tpl.appendChild(customOpt);
  key.innerHTML = '';
  ChordTheory.KEYS.forEach(k => {
    const o = document.createElement('option');
    o.value = k;
    o.textContent = k;
    key.appendChild(o);
  });
  meter.innerHTML = '';
  Object.keys(ChordTheory.METERS).forEach(m => {
    const o = document.createElement('option');
    o.value = m;
    o.textContent = m;
    meter.appendChild(o);
  });
  bars.innerHTML = '';
  for (let b = 1; b <= 16; b++) {
    const o = document.createElement('option');
    o.value = String(b);
    o.textContent = `${b} ${t('progBar')}`;
    bars.appendChild(o);
  }
  root.innerHTML = '';
  ChordTheory.SHARP_NAMES.forEach(r => {
    const o = document.createElement('option');
    o.value = r;
    o.textContent = r;
    root.appendChild(o);
  });
  quality.innerHTML = '';
  ChordTheory.QUALITIES.forEach(q => {
    const o = document.createElement('option');
    o.value = q;
    o.textContent = q;
    quality.appendChild(o);
  });
  if (!root.value) root.value = 'C';
  if (!quality.value) quality.value = 'maj';

  tpl.addEventListener('change', () => {
    const prog = getProg();
    prog.templateId = tpl.value;
    prog.chords = ChordTheory.buildFromTemplate(prog.templateId, prog.key, prog.mode, prog.meter, prog.bars);
    prog.melody = ChordTheory.randomMelody(prog.key, prog.mode, prog.chords);
    prog.selectedId = null;
    prog.melodySelectedId = null;
    progCursorBeat = 0;
    renderProgressionEditor();
    updatePreview();
    addLog(t('logProgTemplate') + progTemplateLabel(ChordTheory.TEMPLATES.find(x => x.id === prog.templateId)), 'info');
  });
  key.addEventListener('change', () => {
    const prog = getProg();
    const delta = (ChordTheory.pcOf(key.value) - ChordTheory.pcOf(prog.key) + 12) % 12;
    prog.key = key.value;
    // Keep the progression shape: transpose every chord with the key.
    prog.chords.forEach(c => { c.root = ChordTheory.nameOfPc(ChordTheory.pcOf(c.root) + delta); });
    prog.melody.forEach(n => { n.midi = Math.max(24, Math.min(96, n.midi + delta)); });
    renderProgressionEditor();
    updatePreview();
  });
  mode.addEventListener('change', () => {
    getProg().mode = mode.value;
    renderProgressionEditor();
    updatePreview();
  });
  meter.addEventListener('change', () => {
    const prog = getProg();
    prog.meter = meter.value;
    const total = progTotalBeats();
    prog.chords = prog.chords.filter(c => c.start < total);
    prog.melody = prog.melody.filter(n => n.start < total);
    progCursorBeat = Math.min(progCursorBeat, Math.max(0, total - 1));
    renderProgressionEditor();
    updatePreview();
  });
  bars.addEventListener('change', () => {
    const prog = getProg();
    prog.bars = parseInt(bars.value, 10);
    const total = progTotalBeats();
    prog.chords = prog.chords.filter(c => c.start < total);
    prog.melody = prog.melody.filter(n => n.start < total);
    progCursorBeat = Math.min(progCursorBeat, Math.max(0, total - 1));
    renderProgressionEditor();
    updatePreview();
  });
  zoom.addEventListener('input', () => {
    progBeatPx = parseInt(zoom.value, 10);
    renderProgTimeline();
  });
  root.addEventListener('change', renderProgPalette);
  quality.addEventListener('change', renderProgPalette);

  $('prog-add').addEventListener('click', progAddAtCursor);
  $('prog-replace').addEventListener('click', progReplaceSelected);
  $('prog-delete').addEventListener('click', () => {
    const prog = getProg();
    if (progSelected(prog)) {
      prog.chords = prog.chords.filter(c => c.id !== prog.selectedId);
      prog.selectedId = null;
      renderProgressionEditor();
      updatePreview();
      addLog(t('logProgDeleted'), 'info');
      return;
    }
    const note = prog.melody.find(n => n.id === prog.melodySelectedId);
    if (!note) { addLog(t('logProgNoSelection'), 'error'); return; }
    prog.melody = prog.melody.filter(n => n.id !== note.id);
    prog.melodySelectedId = null;
    renderProgressionEditor();
    updatePreview();
    addLog(t('logProgDeleted'), 'info');
  });
  $('prog-play').addEventListener('click', progPlay);
  $('prog-stop').addEventListener('click', progStop);
  $('prog-export').addEventListener('click', progExportAudio);
  const genMode = $('prog-gen-mode');
  if (genMode && genMode.options.length === 0) {
    ['random', 'specified'].forEach(v => {
      const o = document.createElement('option');
      o.value = v;
      genMode.appendChild(o);
    });
  }
  $('prog-generate').addEventListener('click', progGenerate);
  $('prog-ruler').addEventListener('pointerdown', (e) => {
    const ruler = e.currentTarget;
    const box = ruler.getBoundingClientRect();
    progCursorBeat = Math.min(progTotalBeats() - 1, xToBeat(e.clientX - box.left));
    progStop();
    renderProgTimeline();
  });

  setupProgLaneDrag();
  renderProgressionEditor();
};

// First free slot of `dur` beats at/after `from` (else -1).
const progFreeSlot = (dur, from = 0, prog = getProg()) => {
  const total = progTotalBeats(prog);
  for (let s = from; s + dur <= total; s++) {
    if (!progOverlaps(s, dur, null, prog)) return s;
  }
  return -1;
};

// "Add": append the palette chord at the cursor (or nearest free slot).
const progAddAtCursor = () => {
  const prog = getProg();
  const root = document.getElementById('prog-root').value;
  const quality = document.getElementById('prog-quality').value;
  const bpb = progHasTheory() ? ChordTheory.beatsPerBar(prog.meter) : 4;
  let dur = bpb;
  let start = -1;
  for (const d of [bpb, 2, 1]) {
    start = progFreeSlot(d, Math.min(progCursorBeat, progTotalBeats() - 1), prog);
    if (start !== -1) { dur = d; break; }
  }
  if (start === -1) start = progFreeSlot(1, 0, prog);
  if (start === -1) { addLog(t('logProgNoSpace'), 'error'); return; }
  const chord = { id: `c${Date.now()}`, root, quality, start, dur };
  prog.chords.push(chord);
  prog.selectedId = chord.id;
  progCursorBeat = start;
  renderProgressionEditor();
  updatePreview();
  const v = progCheck(root, quality, prog);
  addLog(t('logProgAdded') + ChordTheory.chordSymbol(root, quality) + (v.diatonic ? '' : ` ⚠ ${v.reason}`), v.diatonic ? 'success' : 'info');
};

// "Generate": fill the bar count (1-16) bar by bar — randomly, or from the
// chosen template — revealing each chord one after another.
const progGenerate = () => {
  const prog = getProg();
  const mode = document.getElementById('prog-gen-mode')?.value || 'random';
  let templateId = prog.templateId;
  if (mode === 'specified') {
    if (templateId === 'custom' || !ChordTheory.TEMPLATES.some(x => x.id === templateId)) {
      templateId = 'p-iv-vi-iv';
    }
    prog.templateId = templateId;
  } else {
    prog.templateId = 'custom';
  }
  const list = mode === 'specified'
    ? ChordTheory.buildFromTemplate(templateId, prog.key, prog.mode, prog.meter, prog.bars)
    : ChordTheory.randomProgression(prog.key, prog.mode, prog.meter, prog.bars);
  const fullMelody = ChordTheory.randomMelody(prog.key, prog.mode, list);
  progStop();
  prog.selectedId = null;
  prog.melodySelectedId = null;
  progCursorBeat = 0;
  prog.chords = [];
  prog.melody = [];
  renderProgressionEditor();
  // Reveal bar by bar so the progression visibly builds itself.
  const my = ++progGenToken;
  list.forEach((chord, i) => {
    setTimeout(() => {
      if (my !== progGenToken) return;
      prog.chords.push(chord);
      const end = chord.start + chord.dur;
      fullMelody.filter(n => n.start < end && !prog.melody.includes(n))
        .forEach(n => prog.melody.push(n));
      progCursorBeat = chord.start;
      renderProgTimeline();
      if (i === list.length - 1) {
        updatePreview();
        addLog(t('logProgGenerated') +
          list.map(c => ChordTheory.chordSymbol(c.root, c.quality)).join(' - ') +
          ` · melody ${prog.melody.length} notes`, 'success');
      }
    }, 140 * (i + 1));
  });
};

// "Replace": swap the selected chord's pitch/type, keeping its timing.
const progReplaceSelected = () => {
  const prog = getProg();
  const sel = progSelected(prog);
  if (!sel) { addLog(t('logProgNoSelection'), 'error'); return; }
  sel.root = document.getElementById('prog-root').value;
  sel.quality = document.getElementById('prog-quality').value;
  renderProgressionEditor();
  updatePreview();
  const v = progCheck(sel.root, sel.quality, prog);
  addLog(t('logProgReplaced') + ChordTheory.chordSymbol(sel.root, sel.quality) + (v.diatonic ? '' : ` ⚠ ${v.reason}`), v.diatonic ? 'success' : 'info');
};

// Drag on the lane: empty area creates (length = drag distance), edges resize, body moves.
const setupProgLaneDrag = () => {
  const lane = document.getElementById('prog-lane');
  if (!lane || lane.dataset.progDrag) return;
  lane.dataset.progDrag = '1';

  lane.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    progGenToken++; // a hand edit cancels any still-revealing generation
    const prog = getProg();
    const box = lane.getBoundingClientRect();
    const beat = xToBeat(e.clientX - box.left);
    const block = e.target.closest('.prog-chord');
    // Pointer capture is taken lazily on the first move (not here), so a
    // plain click still targets the chord block and selects it.
    const grab = (m) => { try { lane.setPointerCapture?.(m.pointerId); } catch (_) {} };

    // Resize via the right-edge handle.
    if (block && e.target.classList.contains('prog-chord-resize')) {
      e.preventDefault();
      const chord = prog.chords.find(c => c.id === block.dataset.chordId);
      if (!chord) return;
      const orig = chord.dur;
      const move = (m) => {
        grab(m);
        const b = lane.getBoundingClientRect();
        chord.dur = Math.max(1, xToBeat(m.clientX - b.left) - chord.start);
        if (chord.start + chord.dur > progTotalBeats()) chord.dur = progTotalBeats() - chord.start;
        renderProgTimeline();
      };
      const up = () => {
        lane.removeEventListener('pointermove', move);
        lane.removeEventListener('pointerup', up);
        lane.removeEventListener('pointercancel', up);
        if (progOverlaps(chord.start, chord.dur, chord.id)) {
          chord.dur = orig;
          addLog(t('logProgOverlap'), 'error');
        }
        renderProgressionEditor();
        updatePreview();
      };
      lane.addEventListener('pointermove', move);
      lane.addEventListener('pointerup', up);
      lane.addEventListener('pointercancel', up);
      return;
    }

    // Move an existing chord.
    if (block) {
      e.preventDefault();
      const chord = prog.chords.find(c => c.id === block.dataset.chordId);
      if (!chord) return;
      prog.selectedId = chord.id;
      progCursorBeat = chord.start;
      renderProgTimeline();
      const origStart = chord.start;
      const grabOffset = beat - chord.start;
      const move = (m) => {
        grab(m);
        const b = lane.getBoundingClientRect();
        let s = xToBeat(m.clientX - b.left) - grabOffset;
        s = Math.max(0, Math.min(progTotalBeats() - chord.dur, s));
        chord.start = s;
        renderProgTimeline();
      };
      const up = () => {
        lane.removeEventListener('pointermove', move);
        lane.removeEventListener('pointerup', up);
        lane.removeEventListener('pointercancel', up);
        if (progOverlaps(chord.start, chord.dur, chord.id)) {
          chord.start = origStart;
          addLog(t('logProgOverlap'), 'error');
        } else {
          progCursorBeat = chord.start;
        }
        renderProgressionEditor();
        updatePreview();
      };
      lane.addEventListener('pointermove', move);
      lane.addEventListener('pointerup', up);
      lane.addEventListener('pointercancel', up);
      return;
    }

    // Empty lane: drag out the new chord's length.
    e.preventDefault();
    const anchor = Math.min(beat, progTotalBeats() - 1);
    let end = anchor;
    const move = (m) => {
      grab(m);
      const b = lane.getBoundingClientRect();
      end = Math.max(0, Math.min(progTotalBeats(), xToBeat(m.clientX - b.left)));
      renderProgTimeline(anchor, end);
    };
    const up = () => {
      lane.removeEventListener('pointermove', move);
      lane.removeEventListener('pointerup', up);
      lane.removeEventListener('pointercancel', up);
      const start = Math.min(anchor, end);
      const dur = Math.max(1, Math.abs(end - anchor));
      if (progOverlaps(start, dur)) {
        addLog(t('logProgOverlap'), 'error');
        renderProgTimeline();
        return;
      }
      const chord = {
        id: `c${Date.now()}`,
        root: document.getElementById('prog-root').value,
        quality: document.getElementById('prog-quality').value,
        start, dur
      };
      prog.chords.push(chord);
      prog.selectedId = chord.id;
      progCursorBeat = start;
      renderProgressionEditor();
      updatePreview();
      const v = progCheck(chord.root, chord.quality, prog);
      addLog(t('logProgAdded') + ChordTheory.chordSymbol(chord.root, chord.quality) + (v.diatonic ? '' : ` ⚠ ${v.reason}`), v.diatonic ? 'success' : 'info');
    };
    lane.addEventListener('pointermove', move);
    lane.addEventListener('pointerup', up);
    lane.addEventListener('pointercancel', up);
  });
};

// Full editor refresh: controls + palette + timeline.
const renderProgressionEditor = () => {
  if (!progHasTheory() || !document.getElementById('prog-template')) return;
  const prog = getProg();
  const tplSel = document.getElementById('prog-template');
  let customOpt = tplSel.querySelector('option[value="custom"]');
  if (!customOpt) {
    customOpt = document.createElement('option');
    customOpt.value = 'custom';
    tplSel.appendChild(customOpt);
  }
  customOpt.textContent = t('progCustom');
  tplSel.value = prog.templateId;
  document.getElementById('prog-key').value = prog.key;
  const modeSel = document.getElementById('prog-mode');
  if (modeSel.options.length === 0) {
    [['major', t('progMajor')], ['minor', t('progMinor')]].forEach(([v, label]) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = label;
      modeSel.appendChild(o);
    });
  } else {
    modeSel.options[0].textContent = t('progMajor');
    modeSel.options[1].textContent = t('progMinor');
  }
  modeSel.value = prog.mode;
  document.getElementById('prog-meter').value = prog.meter;
  const barsSel = document.getElementById('prog-bars');
  [...barsSel.options].forEach(o => { o.textContent = `${o.value} ${t('progBar')}`; });
  barsSel.value = String(prog.bars);
  document.getElementById('prog-zoom').value = String(progBeatPx);
  renderProgPalette();
  renderProgTimeline();
  renderProgInfo();
};

// Palette preview: the "make chord" readout turns orange when non-diatonic,
// with the reason on hover — still clickable, just a warning.
const renderProgPalette = () => {
  const preview = document.getElementById('prog-preview');
  if (!preview) return;
  const prog = getProg();
  const root = document.getElementById('prog-root').value;
  const quality = document.getElementById('prog-quality').value;
  const v = progCheck(root, quality, prog);
  preview.textContent = progHasTheory() ? ChordTheory.chordSymbol(root, quality) : `${root} ${quality}`;
  preview.classList.toggle('is-warning', !v.diatonic);
  preview.title = v.diatonic ? '' : v.reason;
  ['prog-add', 'prog-replace'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.classList.toggle('is-warning', !v.diatonic);
      btn.title = v.diatonic ? '' : v.reason;
    }
  });
};

const renderProgInfo = () => {
  const info = document.getElementById('prog-info');
  if (!info) return;
  const prog = getProg();
  const bpm = selections.bpm || 120;
  const total = progTotalBeats();
  info.textContent = `${prog.key} ${t(prog.mode === 'minor' ? 'progMinor' : 'progMajor')} · ${prog.meter} · ${prog.bars}${t('progBar')} · ${total}beats · ${bpm}bpm`;
  const pos = document.getElementById('prog-pos');
  if (pos) {
    const bpb = progHasTheory() ? ChordTheory.beatsPerBar(prog.meter) : 4;
    pos.textContent = `${Math.floor(progCursorBeat / bpb) + 1}.${(progCursorBeat % bpb) + 1}`;
  }
};

// Timeline redraw. ghostStart/ghostEnd draws the in-progress drag length.
const renderProgTimeline = (ghostStart = null, ghostEnd = null) => {
  const lane = document.getElementById('prog-lane');
  const ruler = document.getElementById('prog-ruler');
  if (!lane || !ruler) return;
  const prog = getProg();
  const total = progTotalBeats();
  const bpb = progHasTheory() ? ChordTheory.beatsPerBar(prog.meter) : 4;
  const width = total * progBeatPx;
  lane.style.width = `${width}px`;
  ruler.style.width = `${width}px`;
  lane.style.setProperty('--beat-px', `${progBeatPx}px`);

  ruler.textContent = '';
  for (let b = 0; b < total; b++) {
    const tick = document.createElement('span');
    tick.className = `prog-ruler-tick${b % bpb === 0 ? ' bar' : ''}`;
    tick.style.left = `${beatToX(b)}px`;
    tick.textContent = b % bpb === 0 ? `${Math.floor(b / bpb) + 1}` : `${(b % bpb) + 1}`;
    ruler.appendChild(tick);
  }

  lane.querySelectorAll('.prog-chord, .prog-beat-line').forEach(el => el.remove());
  for (let b = 1; b < total; b++) {
    const line = document.createElement('div');
    line.className = `prog-beat-line${b % bpb === 0 ? ' bar' : ''}`;
    line.style.left = `${beatToX(b)}px`;
    lane.appendChild(line);
  }

  const playingId = progPlayingChordId();
  [...prog.chords].sort((a, b) => a.start - b.start).forEach(c => {
    const el = document.createElement('div');
    const v = progCheck(c.root, c.quality, prog);
    el.className = `prog-chord${v.diatonic ? '' : ' prog-chord-nondiatonic'}` +
      `${c.id === prog.selectedId ? ' selected' : ''}${c.id === playingId ? ' playing' : ''}`;
    el.dataset.chordId = c.id;
    el.style.left = `${beatToX(c.start) + 1}px`;
    el.style.width = `${Math.max(14, beatToX(c.dur) - 2)}px`;
    el.textContent = progHasTheory() ? ChordTheory.chordSymbol(c.root, c.quality) : c.root;
    el.title = v.diatonic ? el.textContent : `${el.textContent} — ${v.reason}`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      prog.selectedId = c.id;
      progCursorBeat = c.start;
      document.getElementById('prog-root').value = c.root;
      document.getElementById('prog-quality').value = c.quality;
      renderProgressionEditor();
    });
    const grip = document.createElement('span');
    grip.className = 'prog-chord-resize';
    el.appendChild(grip);
    lane.appendChild(el);
  });

  if (ghostStart !== null && ghostEnd !== null) {
    const ghost = document.createElement('div');
    ghost.className = 'prog-chord selected';
    ghost.style.left = `${beatToX(Math.min(ghostStart, ghostEnd))}px`;
    ghost.style.width = `${Math.max(14, Math.abs(beatToX(ghostEnd) - beatToX(ghostStart)))}px`;
    ghost.style.opacity = '0.6';
    lane.appendChild(ghost);
  }

  const cursor = document.getElementById('prog-cursor');
  if (cursor) {
    cursor.hidden = false;
    cursor.style.left = `${beatToX(Math.min(progCursorBeat, total))}px`;
  }
  renderProgInfo();
};

// Playback: the cursor follows the progression at the current BPM, looping.
const progPlayingChordId = () => {
  if (progPlayRAF === null) return null;
  const prog = getProg();
  return prog.chords.find(c => progCursorBeat >= c.start && progCursorBeat < c.start + c.dur)?.id || null;
};

const progPlay = () => {
  if (progPlayRAF !== null || !progHasTheory()) return;
  progPlayFrom = progCursorBeat;
  if (progPlayFrom >= progTotalBeats()) progPlayFrom = 0;
  progPlayStamp = performance.now();
  const tick = (now) => {
    const bpm = selections.bpm || 120;
    progCursorBeat = (progPlayFrom + ((now - progPlayStamp) / 1000) * (bpm / 60)) % progTotalBeats();
    renderProgTimeline();
    progPlayRAF = requestAnimationFrame(tick);
  };
  progPlayRAF = requestAnimationFrame(tick);
};

const progStop = () => {
  if (progPlayRAF !== null) {
    cancelAnimationFrame(progPlayRAF);
    progPlayRAF = null;
    renderProgTimeline();
  }
};

// "Export": offline-render the chords + melody, encode WAV/MP3, save to disk.
const progExportAudio = async () => {
  const prog = getProg();
  if (prog.chords.length === 0) { addLog(t('logProgExportEmpty'), 'error'); return; }
  if (typeof ProgAudio === 'undefined') { addLog('Error: ProgAudio is not loaded', 'error'); return; }
  const btn = document.getElementById('prog-export');
  const format = document.getElementById('prog-export-format')?.value === 'mp3' ? 'mp3' : 'wav';
  btn.disabled = true;
  addLog(t('logProgExporting'), 'info');
  try {
    const buffer = await ProgAudio.render(prog, selections.bpm || 120);
    const bytes = format === 'mp3' ? ProgAudio.encodeMp3(buffer) : ProgAudio.encodeWav(buffer);
    const fileName = `progression-${String(prog.key).replace('#', 's')}-${prog.mode}-${prog.bars}bars.${format}`;
    const result = await window.electronAPI.saveBinaryFile({
      fileName,
      base64: ProgAudio.toBase64(bytes),
      mime: format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
      filters: format === 'mp3'
        ? [{ name: 'MP3 Audio', extensions: ['mp3'] }]
        : [{ name: 'WAV Audio', extensions: ['wav'] }]
    });
    if (result?.success) {
      addLog(t('logProgExported') + (result.filePath || fileName), 'success');
    } else if (result && result.error !== 'Save canceled') {
      addLog(`Error: ${result.error}`, 'error');
    }
  } catch (error) {
    addLog(`Error: ${error.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
};

// Color folders that contain a checked item or a position setting, and show
// how many items are included vs. excluded — separate counts, since a
// checkbox in the excluded (indeterminate) state is not ":checked"
const updateFolderHighlights = () => {
  document.querySelectorAll('.folder-item').forEach(folder => {
    const checked = folder.querySelectorAll('input.item-check:checked').length;
    const excluded = folder.querySelectorAll('input.item-check:indeterminate').length;
    const hasPosition = [...folder.querySelectorAll('.position-select')].some(select => select.value);
    const hasTone = !!folder.querySelector('.tone-chip.active') ||
      [...folder.querySelectorAll('.note-input')].some(input => input.value.trim());
    folder.classList.toggle('has-selection', checked > 0 || hasPosition || hasTone);
    folder.classList.toggle('has-exclusion', excluded > 0);
    const count = folder.querySelector('.selection-count');
    if (count) count.textContent = checked > 0 ? checked : '';
    const excludeCount = folder.querySelector('.exclude-count');
    if (excludeCount) excludeCount.textContent = excluded > 0 ? `✕${excluded}` : '';
    // Items assigned to at least one lyric section, counted once each
    const lyricAssigned = [...folder.querySelectorAll('.checkbox-item')]
      .filter(item => item.querySelector('.dest-section:checked')).length;
    const lyricCount = folder.querySelector('.lyric-count');
    if (lyricCount) lyricCount.textContent = lyricAssigned > 0 ? `♪${lyricAssigned}` : '';
  });
};

// Per-tab search. Matching an item shows it; matching a folder name shows the
// whole folder. Folders are opened to reveal their hits and snap back to the
// state the user left them in once the box is emptied.
const setFolderOpen = (folder, open) => {
  const content = folder.querySelector('.folder-content');
  const toggle = folder.querySelector('.folder-toggle');
  if (!content) return;
  content.classList.toggle('hidden', !open);
  if (toggle) toggle.textContent = open ? '▼ ' : '▶ ';
};

const filterList = (list, query) => {
  if (!list) return;
  const q = query.trim().toLowerCase();
  const hit = (text) => text.toLowerCase().includes(q);
  let visible = 0;

  list.querySelectorAll('.folder-item').forEach(folder => {
    const name = folder.querySelector('.folder-name');
    const folderHit = !!name && hit(name.textContent);
    let childHits = 0;

    folder.querySelectorAll('.checkbox-item').forEach(item => {
      const label = item.querySelector('label');
      const shown = !q || folderHit || (!!label && hit(label.textContent));
      item.classList.toggle('search-hidden', !shown);
      if (shown) childHits += 1;
    });

    const show = !q || folderHit || childHits > 0;
    folder.classList.toggle('search-hidden', !show);
    if (show) visible += 1;

    if (q) {
      // Remember how it was left, the first time a search hides the arrow's meaning
      if (folder.dataset.collapsedBeforeSearch === undefined) {
        folder.dataset.collapsedBeforeSearch =
          folder.querySelector('.folder-content')?.classList.contains('hidden') ? '1' : '0';
      }
      if (show) setFolderOpen(folder, true);
    } else if (folder.dataset.collapsedBeforeSearch !== undefined) {
      setFolderOpen(folder, folder.dataset.collapsedBeforeSearch === '0');
      delete folder.dataset.collapsedBeforeSearch;
    }
  });

  // Flat lists have their checkboxes straight in the container
  [...list.children].filter(el => el.classList.contains('checkbox-item')).forEach(item => {
    const label = item.querySelector('label');
    const shown = !q || (!!label && hit(label.textContent));
    item.classList.toggle('search-hidden', !shown);
    if (shown) visible += 1;
  });

  const box = list.parentElement?.querySelector('.list-search');
  const empty = box?.querySelector('.list-search-empty');
  if (empty) empty.hidden = !q || visible > 0;
  const clear = box?.querySelector('.list-search-clear');
  if (clear) clear.hidden = !q;
};

// Re-run every box, e.g. after the lists have been rebuilt
const applySearchFilters = () => {
  document.querySelectorAll('.list-search-input').forEach(input => {
    if (input.value) filterList(document.getElementById(input.dataset.searchList), input.value);
  });
};

const setupSearch = () => {
  document.querySelectorAll('.list-search-input').forEach(input => {
    const list = document.getElementById(input.dataset.searchList);
    const clear = input.parentElement.querySelector('.list-search-clear');

    input.addEventListener('input', () => filterList(list, input.value));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && input.value) {
        event.stopPropagation();
        input.value = '';
        filterList(list, '');
      }
    });
    if (clear) {
      clear.addEventListener('click', () => {
        input.value = '';
        filterList(list, '');
        input.focus();
      });
    }
  });
};

// An item's tri-state, derived from data rather than stored on the DOM:
// 'included' (in selections[category]), 'excluded' (in
// selections.excludes[category]), or 'none' (in neither).
const itemState = (category, value) => {
  if (selections[category].includes(value)) return 'included';
  if (selections.excludes[category]?.includes(value)) return 'excluded';
  return 'none';
};

// Reflect a tri-state onto a checkbox: checked for included, the native
// indeterminate dash for excluded (distinct from both checked and empty),
// plus a CSS hook for the crossed-out excluded styling. The item's
// destination row (Advanced mode) follows the same state.
const applyItemState = (wrapper, checkbox, state) => {
  checkbox.checked = state === 'included';
  checkbox.indeterminate = state === 'excluded';
  wrapper.classList.toggle('state-excluded', state === 'excluded');
  syncDestRow(wrapper);
};

// Set an item's tri-state in one place, so the main checkbox, the tri-state
// cycle and the S / ✕ destination boxes all stay in step.
const setItemState = (category, value, state, wrapper = null) => {
  selections[category] = selections[category].filter(x => x !== value);
  selections.excludes[category] = selections.excludes[category].filter(x => x !== value);
  if (state === 'included') selections[category].push(value);
  else if (state === 'excluded') selections.excludes[category].push(value);
  // Deferred: a canceled checkbox click resets checked/indeterminate back to
  // their pre-click values right after the handler returns, so the real DOM
  // update has to happen after that native reset, not during it.
  setTimeout(() => {
    // Prefer the element that was clicked: the same value can appear in more
    // than one folder, so a lookup by id could refresh the wrong one.
    const item = wrapper || document.getElementById(`${category}-${value}`)?.closest('.checkbox-item');
    if (item) applyItemState(item, item.querySelector('input.item-check'), itemState(category, value));
    updatePreview();
  }, 0);
};

// Add or remove a category item from one lyric section's metatags
const toggleLyricTag = (section, category, value, on) => {
  const list = selections.lyricTags[section][category];
  selections.lyricTags[section][category] = on
    ? [...new Set([...list, value])]
    : list.filter(x => x !== value);
  updatePreview();
};

// The per-item destination boxes, shown only in Advanced mode. S and ✕ mirror
// the item's tri-state; the rest are the six lyric sections.
const DESTINATIONS = [
  { key: 'style', label: 'S', titleKey: 'destStyle', className: 'dest-style' },
  { key: 'exclude', label: '✕', titleKey: 'destExclude', className: 'dest-exclude' },
  ...LYRIC_SECTIONS.map(({ key, short }) => ({
    key, label: short, titleKey: LYRIC_SECTION_LABEL_KEYS[key], className: 'dest-section'
  }))
];

const createDestRow = (category, value) => {
  const row = document.createElement('div');
  row.className = 'dest-row';
  DESTINATIONS.forEach(dest => {
    const box = document.createElement('label');
    box.className = 'dest-box';
    box.title = t(dest.titleKey);
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = `dest-check ${dest.className}`;
    input.dataset.dest = dest.key;
    input.dataset.category = category;
    input.dataset.value = value;
    const span = document.createElement('span');
    span.textContent = dest.label;
    box.append(input, span);
    input.addEventListener('change', () => {
      const wrapper = input.closest('.checkbox-item');
      if (dest.key === 'style') setItemState(category, value, input.checked ? 'included' : 'none', wrapper);
      else if (dest.key === 'exclude') setItemState(category, value, input.checked ? 'excluded' : 'none', wrapper);
      else toggleLyricTag(dest.key, category, value, input.checked);
    });
    row.appendChild(box);
  });
  return row;
};

// Mirror the current selections onto an item's destination row
const syncDestRow = (wrapper) => {
  const row = wrapper?.querySelector('.dest-row');
  if (!row) return;
  const first = row.querySelector('.dest-check');
  const state = itemState(first.dataset.category, first.dataset.value);
  row.querySelectorAll('.dest-check').forEach(box => {
    const dest = box.dataset.dest;
    if (dest === 'style') box.checked = state === 'included';
    else if (dest === 'exclude') box.checked = state === 'excluded';
    else box.checked = (selections.lyricTags?.[dest]?.[box.dataset.category] || []).includes(box.dataset.value);
  });
};

// A checkbox-item wired to cycle none -> included -> excluded -> none on
// click (rather than the native 2-state toggle), shared by the flat and
// hierarchical renderers below.
const createSelectableItem = (category, value, text, extraClass = '') => {
  const itemId = `${category}-${value}`;
  const wrapper = document.createElement('div');
  wrapper.className = `checkbox-item ${extraClass}`.trim();

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = itemId;
  checkbox.value = value;
  checkbox.className = 'item-check';
  checkbox.dataset.category = category;
  checkbox.dataset.value = value;
  applyItemState(wrapper, checkbox, itemState(category, value));

  checkbox.addEventListener('click', (e) => {
    e.preventDefault();
    const current = itemState(category, value);
    setItemState(category, value, current === 'included' ? 'excluded' : current === 'excluded' ? 'none' : 'included', wrapper);
  });

  const label = document.createElement('label');
  label.htmlFor = itemId;
  label.textContent = keywordLabel(text);
  label.title = text;

  wrapper.appendChild(checkbox);
  wrapper.appendChild(label);
  // Only categories that can be lyric metatags get the destination row
  if (LYRIC_CATEGORIES.includes(category)) {
    wrapper.appendChild(createDestRow(category, value));
    syncDestRow(wrapper);
  }
  return { wrapper, checkbox, label };
};

const renderCheckboxList = (containerId, items, category) => {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  // Handle hierarchical structures
  if (category === 'instruments' && items.byInstrument) {
    renderHierarchicalList(container, items.byInstrument, category, 'instrument');
  } else if (category === 'vocals' && items.byMode) {
    renderHierarchicalList(container, items.byMode, category, 'mode');
    if (items.byDescriptor) renderHierarchicalList(container, items.byDescriptor, category, 'descriptor');
  } else if (items.byCategory) {
    renderHierarchicalList(container, items.byCategory, category, 'category');
  } else {
    // Simple flat list
    items.forEach(item => {
      const { wrapper } = createSelectableItem(category, item, item);
      container.appendChild(wrapper);
    });
  }
};

const renderHierarchicalList = (container, hierarchyObj, category, folderType) => {
  for (const [parentName, children] of Object.entries(hierarchyObj)) {
    // Create folder wrapper
    const folder = document.createElement('div');
    folder.className = 'folder-item';

    // Folder header
    const header = document.createElement('div');
    header.className = 'folder-header';
    header.style.cursor = 'pointer';

    const toggle = document.createElement('span');
    toggle.className = 'folder-toggle';
    toggle.textContent = '▶ ';

    const folderLabel = document.createElement('span');
    folderLabel.className = 'folder-name';
    const folderDisplay = category === 'instruments' ? generator.getInstrumentName(parentName) : parentName;
    folderLabel.textContent = keywordLabel(folderDisplay);
    folderLabel.title = folderDisplay;

    const selectionCount = document.createElement('span');
    selectionCount.className = 'selection-count';

    const excludeCount = document.createElement('span');
    excludeCount.className = 'exclude-count';

    const lyricCount = document.createElement('span');
    lyricCount.className = 'lyric-count';

    header.appendChild(toggle);
    header.appendChild(folderLabel);
    header.appendChild(selectionCount);
    header.appendChild(excludeCount);
    header.appendChild(lyricCount);

    // Folder content
    const content = document.createElement('div');
    content.className = 'folder-content hidden';

    const addChild = (value, text, extraClass = '') => {
      const { wrapper, label } = createSelectableItem(category, value, text, `folder-item-child ${extraClass}`.trim());
      content.appendChild(wrapper);
      return label;
    };

    // Instruments: a name-only checkbox, and techniques tied to their instrument
    if (category === 'instruments') {
      const label = addChild(parentName, generator.getInstrumentName(parentName), 'instrument-name-item');
      const note = document.createElement('span');
      note.className = 'instrument-only-note';
      note.setAttribute('data-i18n', 'instrumentOnly');
      note.textContent = t('instrumentOnly');
      label.append(' ', note);
    }

    // Vocal modes and instruments can be placed in the stereo field; voice
    // quality, resonance and delivery describe a singer rather than one
    if (category === 'instruments' || (category === 'vocals' && folderType === 'mode')) {
      const positionKey = PromptGenerator.positionKey(category, parentName);
      const badge = document.createElement('span');
      badge.className = 'position-badge';
      badge.dataset.positionKey = positionKey;
      header.appendChild(badge);
      content.appendChild(createPositionRow(positionKey));
    }

    // Instruments and vocal modes also take tone words; instruments get a
    // free-text note of their own too
    if (category === 'instruments' || (category === 'vocals' && folderType === 'mode')) {
      const toneBadge = document.createElement('span');
      toneBadge.className = 'tone-badge';
      toneBadge.dataset.scope = category === 'vocals' ? 'vocals' : 'instruments';
      toneBadge.dataset.key = parentName;
      header.appendChild(toneBadge);
      content.appendChild(createToneRow(toneBadge.dataset.scope, parentName));
      if (category === 'instruments') content.appendChild(createNoteRow(parentName));
    }

    // Add children checkboxes
    if (Array.isArray(children)) {
      children.forEach(child => {
        const value = category === 'instruments' ? PromptGenerator.techniqueValue(parentName, child) : child;
        addChild(value, child);
      });
    }

    // Toggle folder open/close
    header.addEventListener('click', () => {
      const isHidden = content.classList.contains('hidden');
      content.classList.toggle('hidden');
      toggle.textContent = isHidden ? '▼ ' : '▶ ';
    });

    folder.appendChild(header);
    folder.appendChild(content);
    container.appendChild(folder);
  }
};

const createPositionRow = (positionKey) => {
  const row = document.createElement('div');
  row.className = 'position-row';

  const label = document.createElement('span');
  label.className = 'position-label';
  label.setAttribute('data-i18n', 'position');
  label.textContent = t('position');
  row.appendChild(label);

  [['pan', 'panNone'], ['depth', 'depthNone']].forEach(([axis, noneKey]) => {
    const select = document.createElement('select');
    select.className = 'position-select';
    select.dataset.positionKey = positionKey;
    select.dataset.axis = axis;

    const none = document.createElement('option');
    none.value = '';
    none.setAttribute('data-i18n', noneKey);
    none.textContent = t(noneKey);
    select.appendChild(none);

    PromptGenerator.POSITIONS[axis].forEach(phrase => {
      const option = document.createElement('option');
      option.value = phrase;
      option.textContent = keywordLabel(phrase);
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      const position = { ...selections.positions[positionKey], [axis]: select.value };
      if (!position.pan && !position.depth) {
        delete selections.positions[positionKey];
      } else {
        selections.positions[positionKey] = position;
      }
      syncPositionControls();
      updatePreview();
    });
    row.appendChild(select);
  });

  return row;
};

// The tone map a scope writes into: instrument names or vocal modes
const toneMapFor = (scope) => (scope === 'vocals' ? selections.vocalTones : selections.instrumentTones);

// Emotional tone words for one instrument or vocal mode, toggled as chips
const createToneRow = (scope, key) => {
  const row = document.createElement('div');
  row.className = 'position-row tone-row';

  const label = document.createElement('span');
  label.className = 'position-label';
  label.setAttribute('data-i18n', 'tone');
  label.textContent = t('tone');
  row.appendChild(label);

  generator.toneDescriptors().forEach(tone => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'tone-chip';
    chip.dataset.scope = scope;
    chip.dataset.key = key;
    chip.dataset.tone = tone;
    chip.textContent = keywordLabel(tone);
    chip.title = tone;
    chip.addEventListener('click', () => {
      const map = toneMapFor(scope);
      const current = map[key] || [];
      const next = current.includes(tone) ? current.filter(x => x !== tone) : [...current, tone];
      if (next.length > 0) map[key] = next;
      else delete map[key];
      syncToneControls();
      updatePreview();
    });
    row.appendChild(chip);
  });
  return row;
};

// Free text for one instrument, written inside its parentheses
const createNoteRow = (instrument) => {
  const row = document.createElement('div');
  row.className = 'position-row note-row';

  const label = document.createElement('span');
  label.className = 'position-label';
  label.setAttribute('data-i18n', 'instrumentNote');
  label.textContent = t('instrumentNote');
  row.appendChild(label);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'note-input';
  input.dataset.instrument = instrument;
  input.setAttribute('data-i18n-placeholder', 'instrumentNotePlaceholder');
  input.placeholder = t('instrumentNotePlaceholder');
  input.addEventListener('input', () => {
    if (input.value.trim()) selections.instrumentNotes[instrument] = input.value;
    else delete selections.instrumentNotes[instrument];
    syncToneControls();
    updatePreview();
  });
  row.appendChild(input);
  return row;
};

// Reflect selections.instrumentTones / vocalTones / instrumentNotes in the
// chips, the note boxes and the folder badges
const syncToneControls = () => {
  document.querySelectorAll('.tone-chip').forEach(chip => {
    const active = (toneMapFor(chip.dataset.scope)[chip.dataset.key] || []).includes(chip.dataset.tone);
    chip.classList.toggle('active', active);
    chip.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('.note-input').forEach(input => {
    const note = selections.instrumentNotes[input.dataset.instrument] || '';
    // Leave the box being typed in alone, so its caret does not jump
    if (input !== document.activeElement && input.value !== note) input.value = note;
  });
  document.querySelectorAll('.tone-badge').forEach(badge => {
    const tones = toneMapFor(badge.dataset.scope)[badge.dataset.key] || [];
    const note = badge.dataset.scope === 'instruments'
      ? selections.instrumentNotes[badge.dataset.key]?.trim()
      : '';
    const toneText = tones.length ? `🎨 ${tones.map(tone => keywordLabel(tone)).join(' ')}` : '';
    badge.textContent = [toneText, note ? `✎ ${note}` : ''].filter(Boolean).join('  ');
  });
};

// Each tab gets a free-text box for words its list does not have yet
const setupCustomInputs = () => {
  CATEGORIES.forEach(category => {
    const search = document.querySelector(`#${category}-tab .list-search`);
    if (!search || search.parentElement.querySelector('.custom-entry')) return;

    const row = document.createElement('div');
    row.className = 'custom-entry';
    const label = document.createElement('span');
    label.className = 'custom-entry-label';
    label.setAttribute('data-i18n', 'customEntry');
    label.textContent = t('customEntry');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'custom-entry-input';
    input.dataset.customCategory = category;
    input.setAttribute('data-i18n-placeholder', 'customEntryPlaceholder');
    input.placeholder = t('customEntryPlaceholder');
    input.addEventListener('input', () => {
      if (input.value.trim()) selections.customs[category] = input.value;
      else delete selections.customs[category];
      updatePreview();
    });
    row.append(label, input);
    search.after(row);
  });
};

const syncCustomInputs = () => {
  document.querySelectorAll('.custom-entry-input').forEach(input => {
    const value = selections.customs[input.dataset.customCategory] || '';
    if (input !== document.activeElement && input.value !== value) input.value = value;
  });
};

// Reflect selections.positions in the dropdowns and folder badges
const syncPositionControls = () => {
  document.querySelectorAll('.position-select').forEach(select => {
    select.value = selections.positions[select.dataset.positionKey]?.[select.dataset.axis] || '';
  });
  document.querySelectorAll('.position-badge').forEach(badge => {
    const position = selections.positions[badge.dataset.positionKey];
    badge.textContent = position ? `📍 ${[position.pan, position.depth].filter(Boolean).map(p => keywordLabel(p)).join(', ')}` : '';
  });
};

// Reflect selections.others in the free-text box
const syncOthersInput = () => {
  const input = document.getElementById('others-input');
  if (input) input.value = selections.others || '';
};

const renderKeywordLists = () => {
  if (!generator) return;
  const items = generator.flattenAllItems();

  renderCheckboxList('genres-list', items.genres, 'genres');
  renderCheckboxList('vocals-list', items.vocals, 'vocals');
  renderCheckboxList('instruments-list', items.instruments, 'instruments');
  renderCheckboxList('chords-list', items.chords, 'chords');
  renderCheckboxList('moods-list', items.moods, 'moods');
  renderCheckboxList('structures-list', items.structures, 'structures');

  // The lists were just rebuilt; a search that is still typed in must survive that
  applySearchFilters();
};

const populateTabs = () => {
  if (!generator) return;
  renderKeywordLists();

  addLog(t('logDataLoaded'), 'success');
};

// Put the tabs, and the Random rows that mirror them, in the chosen order
const applyCategoryOrder = () => {
  const tabs = document.querySelector('.tabs');
  const targets = document.querySelector('.random-targets');
  selections.categoryOrder.forEach(category => {
    const button = tabs?.querySelector(`.tab-button[data-tab="${category}"]`);
    if (button) tabs.appendChild(button);
    const row = targets?.querySelector(`.random-target[data-category="${category}"]`);
    if (row) targets.appendChild(row);
  });
};

// Take the order from where the tabs now sit and rebuild the style around it
const commitCategoryOrder = () => {
  const order = PromptGenerator.categoryOrder(
    [...document.querySelectorAll('.tabs .tab-button')].map(button => button.dataset.tab)
  );
  if (order.join() === selections.categoryOrder.join()) return;

  selections.categoryOrder = order;
  localStorage.setItem(CATEGORY_ORDER_KEY, JSON.stringify(order));
  applyCategoryOrder();
  updatePreview();
  addLog(t('logTabOrder') + order.map(category => t(category === 'bpm' ? 'bpmTab' : category)).join(' → '), 'info');
};

// The tab the dragged one should be dropped in front of, from the pointer
const tabBeforePoint = (tabs, x) =>
  [...tabs.querySelectorAll('.tab-button:not(.dragging)')].find(button => {
    const box = button.getBoundingClientRect();
    return x < box.left + box.width / 2;
  }) || null;

// Tabs can be dragged into any order, and that order is the order the style
// text is written in, so a drop rewrites the preview too.
const setupTabReorder = () => {
  const tabs = document.querySelector('.tabs');
  if (!tabs) return;
  let dragged = null;

  tabs.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('dragstart', (event) => {
      dragged = button;
      button.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      // Firefox only starts a drag once the transfer carries something
      event.dataTransfer.setData('text/plain', button.dataset.tab);
    });

    button.addEventListener('dragend', () => {
      button.classList.remove('dragging');
      dragged = null;
      commitCategoryOrder();
    });

    // Same move without a mouse
    button.addEventListener('keydown', (event) => {
      if (!event.ctrlKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      const sibling = event.key === 'ArrowLeft' ? button.previousElementSibling : button.nextElementSibling;
      if (!sibling) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft') tabs.insertBefore(button, sibling);
      else tabs.insertBefore(sibling, button);
      commitCategoryOrder();
      button.focus();
    });
  });

  tabs.addEventListener('dragover', (event) => {
    if (!dragged) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const before = tabBeforePoint(tabs, event.clientX);
    if (before !== dragged) tabs.insertBefore(dragged, before);
  });

  tabs.addEventListener('drop', (event) => event.preventDefault());
};

const setupTabs = () => {
  const buttons = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      const content = document.getElementById(`${tabId}-tab`);
      // The BPM tab has nothing to show, so clicking it leaves the open tab alone
      if (!content) return;

      buttons.forEach(b => b.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      button.classList.add('active');
      content.classList.add('active');
    });
  });

  // Panel tabs for left sidebar
  const panelButtons = document.querySelectorAll('.panel-tab-button');
  const panelContents = document.querySelectorAll('.panel-tab-content');

  panelButtons.forEach(button => {
    button.addEventListener('click', () => {
      panelButtons.forEach(b => b.classList.remove('active'));
      panelContents.forEach(c => c.classList.remove('active'));

      button.classList.add('active');
      const panelTabId = button.getAttribute('data-panel-tab');
      document.getElementById(`${panelTabId}-panel-tab`).classList.add('active');
    });
  });

  applyCategoryOrder();
  setupTabReorder();
};

// Categories ticked in the Random panel; the 🎲 Random button rerolls only those
const RANDOM_TARGETS_KEY = 'suno-random-targets';

const getRandomTargets = () =>
  [...document.querySelectorAll('.random-target-check:checked')].map(cb => cb.dataset.randomCategory);

const saveRandomTargets = () => {
  localStorage.setItem(RANDOM_TARGETS_KEY, JSON.stringify(getRandomTargets()));
};

// Restore the ticks from a previous session; everything is on by default
const restoreRandomTargets = () => {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(RANDOM_TARGETS_KEY));
  } catch (error) {
    saved = null;
  }
  if (!Array.isArray(saved)) return;
  document.querySelectorAll('.random-target-check').forEach(cb => {
    cb.checked = saved.includes(cb.dataset.randomCategory);
  });
};

// The tempo lives in selections, so the top-bar controls have to follow it
// whenever something other than the user sets it — a reroll, or a loaded
// project. Without this the controls keep a stale number and overwrite the
// real one the moment they are touched.
const syncBpmControls = () => {
  const slider = document.getElementById('bpm-slider');
  const input = document.getElementById('bpm-input');
  if (!slider || !input || !selections.bpm) return;
  slider.value = selections.bpm;
  input.value = selections.bpm;
  if (typeof renderProgInfo === 'function') renderProgInfo();
};

// Reroll the given categories, keeping every other selection as it is
const randomizeCategories = (categories, { bpm = false } = {}) => {
  if (!generator) return;

  const next = { ...selections, positions: { ...selections.positions }, excludes: { ...selections.excludes } };
  categories.forEach(category => {
    next[category] = generator.randomCategory(category);
    // The rerolled items are gone, so drop the positions that went with them
    Object.keys(next.positions).forEach(key => {
      if (PromptGenerator.splitPositionKey(key)[0] === category) delete next.positions[key];
    });
    if (category === 'instruments') {
      next.instrumentTones = generator.randomInstrumentTones(next.instruments);
      next.instrumentNotes = {};
    }
    if (category === 'vocals') {
      next.vocalTones = generator.randomVocalTones(next.vocals);
    }
    // Seed a few fresh exclusions alongside the new selection, instead of
    // always leaving the category's excludes empty
    next.excludes[category] = generator.randomExcludes(category, next[category]);
  });

  if (bpm) next.bpm = generator.getRandomBPM();

  selections = normalizeSelections(next);
  syncBpmControls();
  updateAllCheckboxes();
  updatePreview();
};

// The per-category rows sit behind a toggle so the Random panel stays compact;
// they start folded away and reopen where the last session left them.
const RANDOM_TARGETS_OPEN_KEY = 'suno-random-targets-open';

const setRandomTargetsOpen = (open) => {
  const targets = document.getElementById('random-targets');
  const button = document.getElementById('toggle-random-targets-btn');
  if (!targets || !button) return;

  targets.classList.toggle('collapsed', !open);
  button.textContent = open ? '▴' : '▾';
  const key = open ? 'hideRandomTargets' : 'showRandomTargets';
  button.setAttribute('data-i18n-title', key);
  button.title = t(key);
  button.setAttribute('aria-label', t(key));
  button.setAttribute('aria-expanded', String(open));
};

const setupRandomButtons = () => {
  restoreRandomTargets();

  // Closed unless the last session left it open
  setRandomTargetsOpen(localStorage.getItem(RANDOM_TARGETS_OPEN_KEY) === 'true');
  document.getElementById('toggle-random-targets-btn').addEventListener('click', () => {
    const open = document.getElementById('random-targets').classList.contains('collapsed');
    setRandomTargetsOpen(open);
    localStorage.setItem(RANDOM_TARGETS_OPEN_KEY, String(open));
  });

  // Random generation for every ticked category
  document.getElementById('random-btn').addEventListener('click', () => {
    const targets = getRandomTargets();
    if (targets.length === 0) {
      addLog(t('logRandomNoTarget'), 'error');
      return;
    }
    randomizeCategories(targets, { bpm: true });
    addLog(t('logRandomGenerated'), 'info');
  });

  // Reroll a single category — one button per row, so keep to those
  document.querySelectorAll('.random-target .random-one-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.randomCategory;
      randomizeCategories([category]);
      addLog(t('logRandomCategory') + t(category), 'info');
    });
  });

  document.querySelectorAll('.random-target-check').forEach(cb => {
    cb.addEventListener('change', saveRandomTargets);
  });
};

// ---- Lyrics pane ----
// Suno's Lyrics field accepts up to 5000 characters
const LYRICS_CHAR_LIMIT = 5000;
const LYRICS_COLLAPSED_KEY = 'suno-lyrics-collapsed';

// Six blocks, one per section: a label, its computed tag line (read-only) and
// the text that follows it in the Lyrics field.
const renderLyricsPanel = () => {
  const body = document.getElementById('lyrics-body');
  if (!body) return;
  body.textContent = '';

  LYRIC_SECTIONS.forEach(({ key }) => {
    const section = document.createElement('div');
    section.className = 'lyrics-section';

    const label = document.createElement('label');
    label.className = 'lyrics-label';
    label.htmlFor = `lyrics-${key}`;
    label.dataset.i18n = LYRIC_SECTION_LABEL_KEYS[key];
    label.textContent = t(LYRIC_SECTION_LABEL_KEYS[key]);
    section.appendChild(label);

    const tagLine = document.createElement('div');
    tagLine.className = 'lyrics-tag-line';
    tagLine.id = `lyrics-tag-${key}`;
    section.appendChild(tagLine);

    const textarea = document.createElement('textarea');
    textarea.className = 'lyrics-textarea';
    textarea.id = `lyrics-${key}`;
    textarea.dataset.section = key;
    textarea.value = selections.lyrics[key] || '';
    textarea.addEventListener('input', () => {
      selections.lyrics[key] = textarea.value;
      updateLyricsPreview();
    });
    section.appendChild(textarea);

    body.appendChild(section);
  });

  updateLyricsPreview();
};

// Recompute each section's tag line and the character count
const updateLyricsPreview = () => {
  if (!generator) return;
  LYRIC_SECTIONS.forEach(({ key }) => {
    const tag = document.getElementById(`lyrics-tag-${key}`);
    if (tag) tag.textContent = generator.lyricSectionTag(key, selections);
    const textarea = document.getElementById(`lyrics-${key}`);
    // Leave the box being typed in alone, so its caret does not jump
    if (textarea && textarea !== document.activeElement && textarea.value !== (selections.lyrics[key] || '')) {
      textarea.value = selections.lyrics[key] || '';
    }
  });
  const el = document.getElementById('lyrics-char-count');
  if (!el) return;
  const count = generator.generateLyrics(selections).length;
  el.textContent = `${count} / ${LYRICS_CHAR_LIMIT} ${t('chars')}`;
  el.classList.toggle('over-limit', count > LYRICS_CHAR_LIMIT);
};

// Fill any empty section with its sample control metatags
const resetLyricSamples = () => {
  LYRIC_SECTIONS.forEach(({ key }) => {
    if (!(selections.lyrics[key] || '').trim()) selections.lyrics[key] = SAMPLE_LYRICS[key] || '';
  });
  updateLyricsPreview();
};

const setupLyricsPanel = () => {
  const panel = document.getElementById('lyrics-panel');
  if (!panel) return;
  renderLyricsPanel();

  const collapseBtn = document.getElementById('lyrics-collapse-btn');
  const setCollapsed = (collapsed) => {
    panel.classList.toggle('collapsed', collapsed);
    collapseBtn.textContent = collapsed ? '◂' : '▸';
    const key = collapsed ? 'expandLyrics' : 'collapseLyrics';
    collapseBtn.setAttribute('data-i18n-title', key);
    collapseBtn.title = t(key);
    collapseBtn.setAttribute('aria-label', t(key));
    collapseBtn.setAttribute('aria-expanded', String(!collapsed));
  };
  setCollapsed(localStorage.getItem(LYRICS_COLLAPSED_KEY) === 'true');
  collapseBtn.addEventListener('click', () => {
    const collapsed = !panel.classList.contains('collapsed');
    setCollapsed(collapsed);
    localStorage.setItem(LYRICS_COLLAPSED_KEY, String(collapsed));
  });

  document.getElementById('lyrics-copy-btn').addEventListener('click', async () => {
    const text = generator ? generator.generateLyrics(selections) : '';
    if (!text) {
      addLog(t('logErrorCopy'), 'error');
      return;
    }
    try {
      const result = await window.electronAPI.copyToClipboard(text);
      if (result && result.success === false) {
        addLog(`Error: ${result.error}`, 'error');
      } else {
        addLog(t('logLyricsCopied'), 'success');
      }
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    }
  });

  document.getElementById('lyrics-sample-btn').addEventListener('click', () => {
    resetLyricSamples();
    addLog(t('logLyricsSamples'), 'info');
  });
};

// The help text is structured rather than one string per element, so it is
// built here instead of through data-i18n, and rebuilt on every language switch.
const renderHelp = () => {
  const body = document.getElementById('help-body');
  if (!body) return;

  body.textContent = '';
  const intro = document.createElement('p');
  intro.className = 'help-intro';
  intro.textContent = t('helpIntro');
  body.appendChild(intro);

  const sections = t('helpSections');
  if (!Array.isArray(sections)) return;
  sections.forEach(section => {
    const heading = document.createElement('h4');
    heading.textContent = section.heading;
    body.appendChild(heading);

    const list = document.createElement('ul');
    section.items.forEach(item => {
      const entry = document.createElement('li');
      entry.textContent = item;
      list.appendChild(entry);
    });
    body.appendChild(list);
  });
};

// In-app feature reference, opened from the top bar
const setupHelp = () => {
  const modal = document.getElementById('help-modal');
  const body = document.getElementById('help-body');
  const openBtn = document.getElementById('help-btn');
  const closeBtn = document.getElementById('help-close-btn');
  const okBtn = document.getElementById('help-ok-btn');
  if (!modal || !body || !openBtn || !closeBtn || !okBtn) return;

  const open = () => {
    modal.classList.remove('hidden');
    body.scrollTop = 0;
    body.focus();
  };

  const close = () => modal.classList.add('hidden');

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  okBtn.addEventListener('click', close);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) close();
  });
};

// App and data-file versions. The data arrives after the first paint, so this
// is drawn again once it lands, and on every language switch.
const renderAbout = () => {
  const body = document.getElementById('about-body');
  if (!body) return;
  body.textContent = '';

  const appHeading = document.createElement('h4');
  appHeading.textContent = t('aboutApp');
  body.appendChild(appHeading);

  const appLine = document.createElement('p');
  appLine.className = 'about-app';
  const appName = document.createElement('span');
  appName.textContent = t('title');
  const appVer = document.createElement('span');
  appVer.className = 'about-version';
  appVer.textContent = appVersion || t('aboutUnknown');
  appLine.append(appName, ' ', appVer);
  body.appendChild(appLine);

  const filesHeading = document.createElement('h4');
  filesHeading.textContent = t('aboutDataFiles');
  body.appendChild(filesHeading);

  // Until the JSON lands there is nothing to report but the app version
  if (!generator || !dataFiles) {
    const pending = document.createElement('p');
    pending.className = 'about-pending';
    pending.textContent = t('aboutPending');
    body.appendChild(pending);
    return;
  }

  const table = document.createElement('table');
  table.className = 'about-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  [t('aboutFileCol'), t('aboutVersionCol'), t('aboutUpdatedCol')].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  Object.entries(dataFiles).forEach(([key, fileName]) => {
    const meta = (generator.data[key] && generator.data[key].meta) || {};
    const row = document.createElement('tr');
    const cells = [
      { text: fileName, className: 'about-file' },
      { text: meta.version || t('aboutUnknown') },
      { text: meta.updated || t('aboutUnknown') }
    ];
    cells.forEach(({ text, className }) => {
      const cell = document.createElement('td');
      cell.textContent = text;
      if (className) cell.className = className;
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  body.appendChild(table);
};

// Version dialog, opened from the top bar
const setupAbout = () => {
  const modal = document.getElementById('about-modal');
  const body = document.getElementById('about-body');
  const openBtn = document.getElementById('about-btn');
  const closeBtn = document.getElementById('about-close-btn');
  const okBtn = document.getElementById('about-ok-btn');
  if (!modal || !body || !openBtn || !closeBtn || !okBtn) return;

  const open = () => {
    renderAbout();
    modal.classList.remove('hidden');
    body.scrollTop = 0;
    body.focus();
  };

  const close = () => modal.classList.add('hidden');

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  okBtn.addEventListener('click', close);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) close();
  });
};

// Paste a full prompt into a dialog and let the parser tick what it knows
const setupParsePrompt = () => {
  const modal = document.getElementById('parse-modal');
  const input = document.getElementById('parse-input');
  const openBtn = document.getElementById('parse-prompt-btn');
  const closeBtn = document.getElementById('parse-close-btn');
  const cancelBtn = document.getElementById('parse-cancel-btn');
  const runBtn = document.getElementById('parse-run-btn');
  if (!modal || !input || !openBtn || !closeBtn || !cancelBtn || !runBtn) return;

  const open = () => {
    modal.classList.remove('hidden');
    input.value = '';
    const ambiguousRadio = modal.querySelector('input[name="parse-mode"][value="ambiguous"]');
    if (ambiguousRadio) ambiguousRadio.checked = true;
    input.focus();
  };

  const close = () => modal.classList.add('hidden');

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) close();
  });

  const run = () => {
    const text = input.value.trim();
    if (!text) {
      addLog(t('logParseEmpty'), 'error');
      return;
    }
    if (!generator) return;

    const precise = modal.querySelector('input[name="parse-mode"][value="precise"]')?.checked === true;
    const parsed = generator.parsePrompt(text, {
      precise,
      categoryOrder: selections.categoryOrder
    });
    selections = normalizeSelections(parsed.selections);
    syncBpmControls();
    syncOthersInput();
    updateAllCheckboxes();
    updatePreview();
    parsed.ambiguous.forEach(a => {
      const alternatives = a.alternatives.map(m => t(m.category)).join(', ');
      if (a.chosen) {
        addLog(`${t('logParseAmbiguous')}: "${a.text}" → ${t(a.chosen.category)} (${t('logParseAlso')}: ${alternatives})`, 'info');
      } else {
        addLog(`${t('logParseAmbiguous')}: "${a.text}" (${alternatives}) → ${t('logParseLeftAsFree')}`, 'info');
      }
    });
    addLog(t('logParsed'), 'success');
    close();
  };

  runBtn.addEventListener('click', run);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
    if (event.key === 'Enter' && event.ctrlKey) run();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) close();
  });
};

// Advanced mode reveals the per-item destination rows (lyric sections / exclude)
const ADVANCED_KEY = 'suno-advanced';

const setAdvancedMode = (on) => {
  document.body.classList.toggle('advanced-mode', on);
  const checkbox = document.getElementById('advanced-toggle');
  if (checkbox) checkbox.checked = on;
};

const setupAdvancedToggle = () => {
  setAdvancedMode(localStorage.getItem(ADVANCED_KEY) === 'true');
  const checkbox = document.getElementById('advanced-toggle');
  if (!checkbox) return;
  checkbox.addEventListener('change', () => {
    setAdvancedMode(checkbox.checked);
    localStorage.setItem(ADVANCED_KEY, String(checkbox.checked));
    addLog(t(checkbox.checked ? 'logAdvancedOn' : 'logAdvancedOff'), 'info');
  });
};

const setupClearButton = () => {
  // Clear all selections and preview
  document.getElementById('clear-all-btn').addEventListener('click', () => {
    selections = normalizeSelections({ bpm: null });
    progCursorBeat = 0;

    // Resets the main boxes, the destination rows and the lyrics text through
    // applyItemState / updateLyricsPreview, which updatePreview pulls in
    syncBpmControls();
    syncOthersInput();
    updateAllCheckboxes();
    updatePreview();
    addLog(t('logCleared'), 'info');
  });
};

const setupOthersInput = () => {
  // Free text rides along as a single value, written wherever its tab sits
  const othersInput = document.getElementById('others-input');
  if (othersInput) {
    othersInput.addEventListener('input', () => {
      selections.others = othersInput.value;
      updatePreview();
    });
  }
};

const setupClipboardAndFileExport = () => {
  // Copy to clipboard
  document.getElementById('copy-btn').addEventListener('click', async () => {
    const prompt = document.getElementById('preview').textContent;
    if (!prompt || prompt === t('previewPlaceholder')) {
      addLog(t('logErrorCopy'), 'error');
      return;
    }

    try {
      const result = await window.electronAPI.copyToClipboard(prompt);
      if (result && result.success === false) {
        addLog(`Error: ${result.error}`, 'error');
      } else {
        addLog(t('logCopied'), 'success');
      }
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    }
  });

  // Save to file
  document.getElementById('save-btn').addEventListener('click', async () => {
    const prompt = document.getElementById('preview').textContent;
    if (!prompt || prompt === t('previewPlaceholder')) {
      addLog(t('logErrorSave'), 'error');
      return;
    }

    try {
      const result = await window.electronAPI.saveToFile(prompt);
      if (result.success) {
        addLog(t('logFileSaved') + result.filePath, 'success');
      } else {
        addLog(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    }
  });
};

const setupLogResizerAndControls = () => {
  // Drag the bar above the log to give it more or less room
  const resizer = document.getElementById('log-resizer');
  const savedHeight = parseInt(localStorage.getItem(LOG_HEIGHT_KEY), 10);
  if (Number.isFinite(savedHeight)) logHeight = clampLogHeight(savedHeight);

  resizer.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = document.querySelector('.log-container').getBoundingClientRect().height;
    document.body.classList.add('row-resizing');

    // Dragging up grows the log, so the delta is inverted. The listeners go on
    // the window because the pointer leaves the thin bar almost at once, and
    // relying on pointer capture alone loses the drag partway through.
    const onMove = (move) => setLogHeight(startHeight + startY - move.clientY);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.classList.remove('row-resizing');
      storeLogHeight();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });

  resizer.addEventListener('keydown', (event) => {
    const step = { ArrowUp: 20, ArrowDown: -20 }[event.key];
    if (!step) return;
    event.preventDefault();
    setLogHeight(logHeight + step);
    storeLogHeight();
  });

  // A smaller window may no longer have room for the height that was saved
  window.addEventListener('resize', () => setLogHeight(logHeight));

  // Close / open the log window
  const toggleLogBtn = document.getElementById('toggle-log-btn');
  setLogCollapsed(localStorage.getItem(LOG_COLLAPSED_KEY) === 'true');
  toggleLogBtn.addEventListener('click', () => {
    const collapsed = !document.querySelector('.log-container').classList.contains('collapsed');
    setLogCollapsed(collapsed);
    localStorage.setItem(LOG_COLLAPSED_KEY, String(collapsed));
  });

  // Clear log
  document.getElementById('clear-log-btn').addEventListener('click', () => {
    document.getElementById('log-window').innerHTML = '';
    addLog(t('logLogCleared'), 'info');
  });
};

const setupLanguageSwitcher = () => {
  // Language switcher
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      updateLanguage(lang);
    });
  });
};

const setupBpmControls = () => {
  // BPM slider and input sync
  const bpmSlider = document.getElementById('bpm-slider');
  const bpmInput = document.getElementById('bpm-input');

  if (bpmSlider && bpmInput) {
    // Slider change
    bpmSlider.addEventListener('input', (e) => {
      const value = e.target.value;
      selections.bpm = parseInt(value);
      bpmInput.value = value;
      updatePreview();
    });

    // Input change
    bpmInput.addEventListener('change', (e) => {
      let value = parseInt(e.target.value);
      // Clamp value to range
      if (value < 40) value = 40;
      if (value > 200) value = 200;
      selections.bpm = value;
      bpmSlider.value = value;
      bpmInput.value = value;
      updatePreview();
    });

    // Input on typing
    bpmInput.addEventListener('input', (e) => {
      let value = e.target.value;
      if (value >= 40 && value <= 200) {
        selections.bpm = parseInt(value);
        bpmSlider.value = value;
        updatePreview();
      }
    });
  }
};

const setupProjectManagement = () => {
  // Projects and save folder exist only in the desktop app
  if (window.electronAPI.isWeb) {
    document.body.classList.add('is-web');
    return;
  }

  // Project save
  const saveProjectBtn = document.getElementById('save-project-btn');
  const projectNameInput = document.getElementById('project-name');
  if (saveProjectBtn) {
    saveProjectBtn.addEventListener('click', async () => {
      const name = projectNameInput.value.trim();
      if (!name) {
        addLog(t('logProjectNameRequired'), 'error');
        return;
      }
      const result = await window.electronAPI.saveProject({ name, selections });
      if (result.success) {
        addLog(t('logProjectSaved') + name, 'success');
        projectNameInput.value = '';
        loadProjectsList();
      } else {
        addLog(`Error: ${result.error}`, 'error');
      }
    });
  }

  // Load projects list
  loadProjectsList();

  // Select folder
  const selectFolderBtn = document.getElementById('select-folder-btn');
  if (selectFolderBtn) {
    selectFolderBtn.addEventListener('click', async () => {
      const result = await window.electronAPI.selectFolder();
      if (result.success) {
        document.getElementById('current-folder').textContent = result.path;
        // Projects now come from somewhere else, so show what is in there
        loadProjectsList();
        addLog(t('logFolderChanged') + result.path, 'success');
      } else {
        addLog(`Error: ${result.error}`, 'error');
      }
    });
  }

  // The main process owns the folder; ask it which one is actually in use
  window.electronAPI.getProjectsDir().then(currentPath => {
    document.getElementById('current-folder').textContent = currentPath;
  });
};

const setupButtons = () => {
  setupRandomButtons();
  setupParsePrompt();
  setupAdvancedToggle();
  setupClearButton();
  setupOthersInput();
  setupClipboardAndFileExport();
  setupLogResizerAndControls();
  setupLanguageSwitcher();
  setupBpmControls();
  setupProjectManagement();
};

const loadProjectsList = async () => {
  const projectsList = document.getElementById('projects-list');
  if (!projectsList) return;

  const result = await window.electronAPI.loadProjects();
  if (!result.success) {
    // Say so rather than leaving an empty panel that looks like "no projects"
    addLog(t('logProjectsError') + result.error, 'error');
    return;
  }
  if (result.skipped) {
    addLog(t('logProjectsSkipped').replace('{n}', result.skipped), 'error');
  }
  projectsList.innerHTML = '';
  if (result.projects.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'projects-empty';
    empty.textContent = t('projectsEmpty');
    projectsList.appendChild(empty);
    return;
  }

  result.projects.forEach(project => {
    const item = document.createElement('div');
    item.className = 'project-item';

    const info = document.createElement('div');
    info.className = 'project-info';

    const title = document.createElement('div');
    title.className = 'project-title';
    title.textContent = project.name;

    const date = document.createElement('div');
    date.className = 'project-date';
    date.textContent = new Date(project.timestamp).toLocaleString(localeFor());

    info.appendChild(title);
    info.appendChild(date);

    const actions = document.createElement('div');
    actions.className = 'project-actions';

    const loadBtn = document.createElement('button');
    loadBtn.className = 'btn-small-action';
    loadBtn.textContent = '📂 Load';
    loadBtn.addEventListener('click', async () => {
      const loadResult = await window.electronAPI.loadProject(project.fileName);
      if (loadResult.success) {
        selections = normalizeSelections(loadResult.project.selections);
        // A project carries its own tab order
        localStorage.setItem(CATEGORY_ORDER_KEY, JSON.stringify(selections.categoryOrder));
        applyCategoryOrder();
        syncBpmControls();
        syncOthersInput();
        updateAllCheckboxes();
        updatePreview();
        addLog(t('logProjectLoaded') + project.name, 'success');
        // Switch to genres tab
        document.querySelector('[data-tab="genres"]').click();
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-small-action delete';
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.addEventListener('click', async () => {
      if (confirm(t('confirmDeleteProject'))) {
        const deleteResult = await window.electronAPI.deleteProject(project.fileName);
        if (deleteResult.success) {
          addLog(t('logProjectDeleted') + ' - ' + project.name, 'success');
          loadProjectsList();
        }
      }
    });

    actions.appendChild(loadBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(info);
    item.appendChild(actions);
    projectsList.appendChild(item);
  });
};

const updateAllCheckboxes = () => {
  // Update all checkboxes and position dropdowns to match current selections.
  // Scoped to .item-check, which only the item's own box carries, so the
  // destination boxes and each tab's search input are left alone.
  CATEGORIES.forEach(category => {
    const checkboxes = document.querySelectorAll(`input.item-check[data-category="${category}"]`);
    checkboxes.forEach(cb => {
      const wrapper = cb.closest('.checkbox-item');
      applyItemState(wrapper, cb, itemState(category, cb.value));
    });
  });
  syncPositionControls();
  syncToneControls();
  syncCustomInputs();
  if (typeof renderProgressionEditor === 'function') renderProgressionEditor();
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Set initial language
  updateLanguage(currentLang);
  // Help needs no data, so it is wired up before the JSON arrives — that is
  // exactly when someone is most likely to reach for it.
  setupHelp();
  setupAbout();
  setupCustomInputs();

  window.electronAPI.onJsonData((data) => {
    appVersion = data.appVersion || null;
    dataFiles = data.dataFiles || null;
    generator = new PromptGenerator(data);
    populateTabs();
    setupTabs();
    setupButtons();
    setupSearch();
    setupLyricsPanel();
    if (typeof setupProgressionEditor === 'function') setupProgressionEditor();
    updatePreview();
  });
});
