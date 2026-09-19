const translations = {
  en: {
    title: 'Suno Prompt Generator',
    subtitle: 'Select from 5 categories to generate your prompt',
    genres: 'Genres',
    vocals: 'Vocals',
    instruments: 'Instruments',
    chords: 'Chords',
    structures: 'Structures',
    bpm: 'BPM (Tempo)',
    preview: 'Preview',
    previewPlaceholder: 'Preview will appear here',
    random: '🎲 Random Generate',
    copy: '📋 Copy to Clipboard',
    save: '💾 Save to File',
    clearAll: '🗑️ Clear All',
    logCleared: 'All selections cleared',
    log: 'Log',
    clearLog: 'Clear',
    logDataLoaded: 'Data loaded successfully',
    logRandomGenerated: 'Random generation executed',
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
    instrumentOnly: 'instrument name only'
  },
  ja: {
    title: 'Suno プロンプトジェネレーター',
    subtitle: '5つのカテゴリから選択してプロンプトを生成',
    genres: 'ジャンル',
    vocals: 'ボーカル',
    instruments: '楽器',
    chords: 'コード',
    structures: '構造',
    bpm: 'BPM (テンポ)',
    preview: 'プレビュー',
    previewPlaceholder: 'ここにプレビューが表示されます',
    random: '🎲 ランダム生成',
    copy: '📋 クリップボードにコピー',
    save: '💾 ファイルに保存',
    clearAll: '🗑️ すべてクリア',
    logCleared: 'すべての選択をクリアしました',
    log: 'ログ',
    clearLog: 'クリア',
    logDataLoaded: 'データの読み込み完了',
    logRandomGenerated: 'ランダム生成を実行しました',
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
    instrumentOnly: '楽器名のみ'
  }
};

let currentLang = localStorage.getItem('suno-lang') || 'en';
let generator = null;
let selections = {
  genres: [],
  vocals: [],
  instruments: [],
  chords: [],
  structures: [],
  bpm: 120
};

const CATEGORIES = ['genres', 'vocals', 'instruments', 'chords', 'structures'];

// Bring older saved projects up to the current data format
const normalizeSelections = (sel) => {
  const normalized = { ...sel };
  CATEGORIES.forEach(category => {
    if (!Array.isArray(normalized[category])) normalized[category] = [];
  });
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

  // Update preview placeholder
  const preview = document.getElementById('preview');
  if (preview.textContent === 'Preview will appear here' || preview.textContent === 'ここにプレビューが表示されます') {
    preview.textContent = t('previewPlaceholder');
  }

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

  // Trigger animation
  setTimeout(() => {
    previewEl.classList.add('updated');
  }, 10);

  // Remove animation class after a short delay
  setTimeout(() => {
    previewEl.classList.remove('updated');
  }, 300);
};

const renderCheckboxList = (containerId, items, category) => {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  // Handle hierarchical structures
  if (category === 'instruments' && items.byInstrument) {
    renderHierarchicalList(container, items.byInstrument, category, 'instrument');
  } else if (category === 'vocals' && items.byMode) {
    renderHierarchicalList(container, items.byMode, category, 'mode');
  } else if ((category === 'structures' || category === 'chords') && items.byCategory) {
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

    header.appendChild(toggle);
    header.appendChild(folderLabel);

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

const setupTabs = () => {
  const buttons = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
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
};

const setupButtons = () => {
  // Random generation
  document.getElementById('random-btn').addEventListener('click', () => {
    const randomSelection = generator.getRandomSelection();
    selections = randomSelection;

    // Update BPM
    const bpmSlider = document.getElementById('bpm-slider');
    const bpmInput = document.getElementById('bpm-input');
    if (bpmSlider && bpmInput) {
      bpmSlider.value = selections.bpm;
      bpmInput.value = selections.bpm;
    }

    // Update checkboxes
    const items = generator.flattenAllItems();
    CATEGORIES.forEach(category => {
      const checkboxes = document.querySelectorAll(`input[id^="${category}-"]`);
      checkboxes.forEach(cb => {
        cb.checked = selections[category].includes(cb.value);
      });
    });

    updatePreview();
    addLog(t('logRandomGenerated'), 'info');
  });

  // Clear all selections and preview
  document.getElementById('clear-all-btn').addEventListener('click', () => {
    selections = normalizeSelections({ bpm: null });

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });

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
        localStorage.setItem('suno-projects-folder', result.path);
        document.getElementById('current-folder').textContent = result.path;
        addLog('Save folder updated', 'success');
      } else {
        addLog(`Error: ${result.error}`, 'error');
      }
    });
  }

  // Load saved folder path or default
  const savedFolder = localStorage.getItem('suno-projects-folder');
  if (savedFolder) {
    document.getElementById('current-folder').textContent = savedFolder;
  } else {
    // Wait for default folder path from main process
    window.electronAPI.onDefaultFolderPath((defaultPath) => {
      document.getElementById('current-folder').textContent = defaultPath;
    });
  }
};

const loadProjectsList = async () => {
  const projectsList = document.getElementById('projects-list');
  if (!projectsList) return;

  const result = await window.electronAPI.loadProjects();
  if (result.success) {
    projectsList.innerHTML = '';
    if (result.projects.length === 0) {
      projectsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No projects saved yet</p>';
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
  }
};

const updateAllCheckboxes = () => {
  // Update all checkboxes to match current selections
  const items = generator.flattenAllItems();

  CATEGORIES.forEach(category => {
    const checkboxes = document.querySelectorAll(`input[id^="${category}-"]`);
    checkboxes.forEach(cb => {
      cb.checked = selections[category].includes(cb.value);
    });
  });
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
