const translations = {
  en: {
    title: 'Suno Style Generator',
    subtitle: 'Select from 5 categories to generate your prompt',
    genres: 'Genres',
    vocals: 'Vocals',
    instruments: 'Instruments',
    chords: 'Chords',
    structures: 'Structures',
    bpm: 'BPM (Tempo)',
    preview: 'Preview',
    previewPlaceholder: 'Preview will appear here',
    stage: 'Stage',
    stageHint: 'Hover a dot for its name',
    stageEmpty: 'Pick a vocal or an instrument',
    stageUnplaced: 'no position set',
    stageLeft: 'L',
    stageRight: 'R',
    chars: 'chars',
    random: '🎲 Random Generate',
    randomGenres: 'Random genre',
    randomVocals: 'Random vocal',
    randomInstruments: 'Random instruments',
    randomChords: 'Random chords',
    randomStructures: 'Random structures',
    copy: 'Copy to Clipboard',
    save: 'Save to File',
    clearAll: 'Clear All',
    logCleared: 'All selections cleared',
    log: 'Log',
    clearLog: 'Clear',
    closeLog: 'Close log',
    openLog: 'Open log',
    resizeLog: 'Drag to resize the log',
    logDataLoaded: 'Data loaded successfully',
    logRandomGenerated: 'Random generation executed',
    logRandomCategory: 'Random generated: ',
    logRandomNoTarget: 'Tick at least one category to randomize',
    logCopied: 'Copied to clipboard',
    logFileSaved: 'File saved: ',
    logErrorCopy: 'Error: Nothing to copy',
    logErrorSave: 'Error: Nothing to save',
    projects: 'Projects',
    settings: 'Settings',
    saveProject: '💾 Save Project',
    projectNamePlaceholder: 'Project name...',
    browse: 'Browse',
    saveFolder: 'Save Folder',
    logProjectSaved: 'Project saved: ',
    logProjectLoaded: 'Project loaded: ',
    logProjectDeleted: 'Project deleted',
    logProjectsError: 'Could not read the projects folder: ',
    logProjectsSkipped: 'Skipped {n} unreadable file(s) in the projects folder',
    logFolderChanged: 'Projects folder: ',
    instrumentOnly: 'instrument name only',
    position: 'Position',
    panNone: 'Pan: —',
    depthNone: 'Distance: —',
    bpmTab: 'BPM',
    showRandomTargets: 'Show per-category random options',
    hideRandomTargets: 'Hide per-category random options',
    reorderTabs: 'Drag a tab (or Ctrl + ← / →) to change the order the style is written in — BPM included',
    logTabOrder: 'Style order: '
  },
  ja: {
    title: 'Suno スタイルジェネレーター',
    subtitle: '5つのカテゴリから選択してプロンプトを生成',
    genres: 'ジャンル',
    vocals: 'ボーカル',
    instruments: '楽器',
    chords: 'コード',
    structures: '構造',
    bpm: 'BPM (テンポ)',
    preview: 'プレビュー',
    previewPlaceholder: 'ここにプレビューが表示されます',
    stage: '定位図',
    stageHint: 'ドットにカーソルを合わせると名前を表示',
    stageEmpty: 'ボーカルか楽器を選んでください',
    stageUnplaced: '定位未設定',
    stageLeft: 'L',
    stageRight: 'R',
    chars: '文字',
    random: '🎲 ランダム生成',
    randomGenres: 'ジャンルをランダム生成',
    randomVocals: 'ボーカルをランダム生成',
    randomInstruments: '楽器をランダム生成',
    randomChords: 'コードをランダム生成',
    randomStructures: '構造をランダム生成',
    copy: 'クリップボードにコピー',
    save: 'ファイルに保存',
    clearAll: 'すべてクリア',
    logCleared: 'すべての選択をクリアしました',
    log: 'ログ',
    clearLog: 'クリア',
    closeLog: 'ログを閉じる',
    openLog: 'ログを開く',
    resizeLog: 'ドラッグでログの高さを調節',
    logDataLoaded: 'データの読み込み完了',
    logRandomGenerated: 'ランダム生成を実行しました',
    logRandomCategory: 'ランダム生成: ',
    logRandomNoTarget: 'ランダム生成するカテゴリを 1 つ以上選んでください',
    logCopied: 'クリップボードにコピーしました',
    logFileSaved: 'ファイルに保存しました: ',
    logErrorCopy: 'エラー: コピーするプロンプトがありません',
    logErrorSave: 'エラー: 保存するプロンプトがありません',
    projects: 'プロジェクト',
    settings: '設定',
    saveProject: '💾 プロジェクト保存',
    projectNamePlaceholder: 'プロジェクト名...',
    browse: '参照',
    saveFolder: '保存フォルダ',
    logProjectSaved: 'プロジェクトを保存しました: ',
    logProjectLoaded: 'プロジェクトをロードしました: ',
    logProjectDeleted: 'プロジェクトを削除しました',
    logProjectsError: 'プロジェクトフォルダを読み込めませんでした: ',
    logProjectsSkipped: '読み込めないファイル {n} 件をスキップしました',
    logFolderChanged: 'プロジェクトフォルダ: ',
    instrumentOnly: '楽器名のみ',
    position: '定位',
    panNone: '左右: —',
    depthNone: '距離: —',
    bpmTab: 'BPM',
    showRandomTargets: 'カテゴリ別のランダム設定を開く',
    hideRandomTargets: 'カテゴリ別のランダム設定を閉じる',
    reorderTabs: 'タブをドラッグ（または Ctrl + ← / →）でスタイルの記述順を変更。BPM も含みます',
    logTabOrder: 'スタイルの順序: '
  }
};

let currentLang = localStorage.getItem('suno-lang') || 'en';
let generator = null;

// The tab order, which is also the order the style parts are written in
const CATEGORY_ORDER_KEY = 'suno-category-order';

const readStoredCategoryOrder = () => {
  try {
    return PromptGenerator.categoryOrder(JSON.parse(localStorage.getItem(CATEGORY_ORDER_KEY)));
  } catch (error) {
    return PromptGenerator.categoryOrder(null);
  }
};

let selections = {
  genres: [],
  vocals: [],
  instruments: [],
  chords: [],
  structures: [],
  positions: {},
  categoryOrder: readStoredCategoryOrder(),
  bpm: 120
};

const CATEGORIES = PromptGenerator.CATEGORIES;

// Bring older saved projects up to the current data format
const normalizeSelections = (sel) => {
  const normalized = { ...sel };
  CATEGORIES.forEach(category => {
    if (!Array.isArray(normalized[category])) normalized[category] = [];
  });
  if (!normalized.positions || typeof normalized.positions !== 'object') normalized.positions = {};
  // Projects saved before tabs could be reordered keep the order in use
  normalized.categoryOrder = PromptGenerator.categoryOrder(normalized.categoryOrder || selections.categoryOrder);
  if (generator) normalized.vocals = generator.normalizeVocals(normalized.vocals);
  // Genres such as "Synthwave / Retrowave" were split into separate items
  normalized.genres = [...new Set(normalized.genres.flatMap(g => g.split(' / ').map(x => x.trim())))];
  return normalized;
};

const t = (key) => translations[currentLang][key] || translations.en[key] || key;

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
  if (preview.textContent === 'Preview will appear here' || preview.textContent === 'ここにプレビューが表示されます') {
    preview.textContent = t('previewPlaceholder');
  }
  updateCharCount(generator ? generator.generatePrompt(selections).length : 0);
  updateStageDiagram();

  // Update lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`.lang-btn[data-lang="${lang}"]`).classList.add('active');

  addLog(currentLang === 'ja' ? '言語を日本語に切り替えました' : 'Switched to English', 'info');
};

const addLog = (message, type = 'info') => {
  const logWindow = document.getElementById('log-window');
  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const time = new Date().toLocaleTimeString(currentLang === 'ja' ? 'ja-JP' : 'en-US');
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

const stagePoint = (angle, radius) => {
  const rad = (angle * Math.PI) / 180;
  return [STAGE.cx + radius * Math.sin(rad), STAGE.cy - radius * Math.cos(rad)];
};

const svgEl = (name, attrs) => {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
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

    const detail = [placement.pan, placement.depth].filter(Boolean).join(', ') || t('stageUnplaced');
    const text = `${placement.label} — ${detail}`;
    const title = svgEl('title', {});
    title.textContent = text;
    dot.appendChild(title);

    dot.addEventListener('mouseenter', () => { caption.textContent = text; });
    dot.addEventListener('mouseleave', () => { caption.textContent = t('stageHint'); });
    svg.appendChild(dot);
  });
};

// Color folders that contain a checked item or a position setting
const updateFolderHighlights = () => {
  document.querySelectorAll('.folder-item').forEach(folder => {
    const checked = folder.querySelectorAll('input[type="checkbox"]:checked').length;
    const hasPosition = [...folder.querySelectorAll('.position-select')].some(select => select.value);
    folder.classList.toggle('has-selection', checked > 0 || hasPosition);
    const count = folder.querySelector('.selection-count');
    if (count) count.textContent = checked > 0 ? checked : '';
  });
};

const renderCheckboxList = (containerId, items, category) => {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  // Handle hierarchical structures
  if (category === 'instruments' && items.byInstrument) {
    renderHierarchicalList(container, items.byInstrument, category, 'instrument');
  } else if (category === 'vocals' && items.byMode) {
    renderHierarchicalList(container, items.byMode, category, 'mode');
  } else if (items.byCategory) {
    renderHierarchicalList(container, items.byCategory, category, 'category');
  } else {
    // Simple flat list
    items.forEach(item => {
      const wrapper = document.createElement('div');
      wrapper.className = 'checkbox-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${category}-${item}`;
      checkbox.value = item;
      checkbox.checked = selections[category].includes(item);
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!selections[category].includes(item)) {
            selections[category].push(item);
          }
        } else {
          selections[category] = selections[category].filter(x => x !== item);
        }
        // Force immediate preview update
        setTimeout(updatePreview, 0);
      });

      const label = document.createElement('label');
      label.htmlFor = `${category}-${item}`;
      label.textContent = item;

      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
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
    folderLabel.textContent = parentName;

    const selectionCount = document.createElement('span');
    selectionCount.className = 'selection-count';

    header.appendChild(toggle);
    header.appendChild(folderLabel);
    header.appendChild(selectionCount);

    // Folder content
    const content = document.createElement('div');
    content.className = 'folder-content hidden';

    const addChild = (value, text, extraClass = '') => {
      const itemId = `${category}-${value}`;
      const wrapper = document.createElement('div');
      wrapper.className = `checkbox-item folder-item-child ${extraClass}`.trim();

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = itemId;
      checkbox.value = value;
      checkbox.checked = selections[category].includes(value);
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!selections[category].includes(value)) {
            selections[category].push(value);
          }
        } else {
          selections[category] = selections[category].filter(x => x !== value);
        }
        // Force immediate preview update
        setTimeout(updatePreview, 0);
      });

      const label = document.createElement('label');
      label.htmlFor = itemId;
      label.textContent = text;

      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
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

    // Vocal modes and instruments can be placed in the stereo field
    if (category === 'instruments' || category === 'vocals') {
      const positionKey = PromptGenerator.positionKey(category, parentName);
      const badge = document.createElement('span');
      badge.className = 'position-badge';
      badge.dataset.positionKey = positionKey;
      header.appendChild(badge);
      content.appendChild(createPositionRow(positionKey));
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
      option.textContent = phrase;
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

// Reflect selections.positions in the dropdowns and folder badges
const syncPositionControls = () => {
  document.querySelectorAll('.position-select').forEach(select => {
    select.value = selections.positions[select.dataset.positionKey]?.[select.dataset.axis] || '';
  });
  document.querySelectorAll('.position-badge').forEach(badge => {
    const position = selections.positions[badge.dataset.positionKey];
    badge.textContent = position ? `📍 ${[position.pan, position.depth].filter(Boolean).join(', ')}` : '';
  });
};

const populateTabs = () => {
  if (!generator) return;
  const items = generator.flattenAllItems();

  renderCheckboxList('genres-list', items.genres, 'genres');
  renderCheckboxList('vocals-list', items.vocals, 'vocals');
  renderCheckboxList('instruments-list', items.instruments, 'instruments');
  renderCheckboxList('chords-list', items.chords, 'chords');
  renderCheckboxList('structures-list', items.structures, 'structures');

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
};

// Reroll the given categories, keeping every other selection as it is
const randomizeCategories = (categories, { bpm = false } = {}) => {
  if (!generator) return;

  const next = { ...selections, positions: { ...selections.positions } };
  categories.forEach(category => {
    next[category] = generator.randomCategory(category);
    // The rerolled items are gone, so drop the positions that went with them
    Object.keys(next.positions).forEach(key => {
      if (PromptGenerator.splitPositionKey(key)[0] === category) delete next.positions[key];
    });
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

const setupButtons = () => {
  setupRandomButtons();

  // Clear all selections and preview
  document.getElementById('clear-all-btn').addEventListener('click', () => {
    selections = normalizeSelections({ bpm: null });

    document.querySelectorAll('.selections-container input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });
    syncPositionControls();

    updatePreview();
    addLog(t('logCleared'), 'info');
  });

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
    addLog(currentLang === 'ja' ? 'ログをクリアしました' : 'Log cleared', 'info');
  });

  // Language switcher
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      updateLanguage(lang);
    });
  });

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
        addLog('Please enter a project name', 'error');
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
    empty.textContent = 'No projects saved yet';
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
    date.textContent = new Date(project.timestamp).toLocaleString(currentLang === 'ja' ? 'ja-JP' : 'en-US');

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
      if (confirm('Delete this project?')) {
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
  // Update all checkboxes and position dropdowns to match current selections
  CATEGORIES.forEach(category => {
    const checkboxes = document.querySelectorAll(`input[id^="${category}-"]`);
    checkboxes.forEach(cb => {
      cb.checked = selections[category].includes(cb.value);
    });
  });
  syncPositionControls();
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Set initial language
  updateLanguage(currentLang);

  window.electronAPI.onJsonData((data) => {
    generator = new PromptGenerator(data);
    populateTabs();
    setupTabs();
    setupButtons();
    updatePreview();
  });
});
