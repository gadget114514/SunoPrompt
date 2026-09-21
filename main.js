const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Settings that outlive the session: where projects are kept, and the window
// size and position. The renderer's own preferences stay in its localStorage.
const settingsFile = path.join(app.getPath('userData'), 'settings.json');

// Shape of a saved project file. Bump this when the shape changes in a way a
// reader has to handle; saves written before this existed carry no version.
const PROJECT_FORMAT_VERSION = '1.0.0';

// The only external site the app links to. shell.openExternal must never be
// handed an arbitrary URL, so the scheme and host are checked first.
const EXTERNAL_HOSTS = new Set(['suno.com', 'www.suno.com']);

const isAllowedExternal = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && EXTERNAL_HOSTS.has(parsed.hostname);
  } catch (error) {
    return false;
  }
};

const readSettings = () => {
  try {
    return JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
  } catch (error) {
    return {};
  }
};

const writeSettings = (changes) => {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify({ ...readSettings(), ...changes }, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

const defaultProjectsDir = path.join(app.getPath('userData'), 'projects');

// Where projects are read and written. The Settings tab can point this
// somewhere else; if that folder has since gone away — an unplugged drive,
// say — fall back rather than losing the project list with it.
const getProjectsDir = () => {
  const chosen = readSettings().projectsDir;
  const dir = typeof chosen === 'string' && chosen ? chosen : defaultProjectsDir;
  try {
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  } catch (error) {
    console.error('Error opening projects folder:', error);
    fs.mkdirSync(defaultProjectsDir, { recursive: true });
    return defaultProjectsDir;
  }
};

// A project file sits directly in the projects folder; a name that climbs out
// of it is not ours to read or delete.
const projectPath = (fileName) => {
  // A name carrying a separator is not a file in this folder whatever it
  // normalizes to, and a renderer that sends something other than a string
  // must not take the endsWith call down with it.
  if (typeof fileName !== 'string' || path.basename(fileName) !== fileName) return null;
  const dir = getProjectsDir();
  const filePath = path.join(dir, fileName);
  return path.dirname(filePath) === dir && fileName.endsWith('.json') ? filePath : null;
};

let mainWindow;

const loadJSONFiles = () => {
  const jsonDir = __dirname;
  const files = {
    genre: 'genre.json',
    vocal: 'suno_style_vocal_spec.json',
    instruments: 'suno_instrument_techniques.json',
    chord: 'suno_chord_phrases.json',
    mood: 'suno_mood_phrases.json',
    structure: 'suno_style_structure_phrases.json'
  };

  const data = {};
  for (const [key, filename] of Object.entries(files)) {
    try {
      const filePath = path.join(jsonDir, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      data[key] = JSON.parse(content);
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      data[key] = null;
    }
  }
  // The About dialog reports the app version and, via this map, which file each
  // data set came from. PromptGenerator reads only the keys it knows by name,
  // so these two extras ride along untouched.
  return { ...data, appVersion: app.getVersion(), dataFiles: files };
};

const DEFAULT_BOUNDS = { width: 1200, height: 800 };

// Reopen where the window was left, unless that spot is no longer on a screen
// (a monitor unplugged since last time).
const startingBounds = () => {
  const bounds = readSettings().windowBounds;
  if (!bounds || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) return DEFAULT_BOUNDS;
  if (!Number.isFinite(bounds.x) || !Number.isFinite(bounds.y)) {
    return { width: bounds.width, height: bounds.height };
  }

  const { screen } = require('electron');
  const onAScreen = screen.getAllDisplays().some(({ workArea }) =>
    bounds.x < workArea.x + workArea.width && bounds.x + bounds.width > workArea.x &&
    bounds.y < workArea.y + workArea.height && bounds.y + bounds.height > workArea.y);
  return onAScreen ? bounds : { width: bounds.width, height: bounds.height };
};

const createWindow = () => {
  const settings = readSettings();
  mainWindow = new BrowserWindow({
    ...startingBounds(),
    icon: path.join(__dirname, 'images', 'application.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  if (settings.windowMaximized) mainWindow.maximize();

  // getNormalBounds is the un-maximized size, which is what we want to reopen at
  mainWindow.on('close', () => {
    if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isMinimized()) return;
    writeSettings({ windowBounds: mainWindow.getNormalBounds(), windowMaximized: mainWindow.isMaximized() });
  });

  // target="_blank" would otherwise open a second Electron window inheriting
  // this one's preload, handing window.electronAPI to the remote page.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternal(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // A link without target="_blank" would replace the app with the website, and
  // there is no way back from there.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) return;
    event.preventDefault();
    if (isAllowedExternal(url)) shell.openExternal(url);
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  if (!app.isPackaged) mainWindow.webContents.openDevTools();
};

app.on('ready', () => {
  createWindow();

  // JSON データをロードして送信
  const jsonData = loadJSONFiles();
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('json-data', jsonData);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('copy-to-clipboard', async (event, text) => {
  try {
    require('electron').clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-to-file', async (event, text) => {
  const { dialog } = require('electron');
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: path.join(app.getPath('documents'), 'suno-prompt.txt'),
      filters: [{ name: 'Text Files', extensions: ['txt'] }]
    });

    if (!result.canceled) {
      fs.writeFileSync(result.filePath, text, 'utf-8');
      return { success: true, filePath: result.filePath };
    }
    return { success: false, error: 'Save canceled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Which folder projects are coming from. Asked for rather than pushed, so it
// cannot arrive before the renderer is listening.
ipcMain.handle('get-projects-dir', async () => getProjectsDir());

// Save project
ipcMain.handle('save-project', async (event, projectData) => {
  try {
    // \w is ASCII-only, so the old sanitizer turned a Japanese name into a row
    // of underscores. Strip what the filesystem actually refuses, and no more.
    const sanitized = (projectData.name || 'Untitled')
      .trim()
      .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
      .replace(/\s+/g, ' ')
      .slice(0, 64)
      .trim() || 'Untitled';
    const fileName = `${sanitized}_${Date.now()}.json`;
    const filePath = path.join(getProjectsDir(), fileName);

    const project = {
      // Stamped so a later build can recognise and migrate saves from an older shape
      version: PROJECT_FORMAT_VERSION,
      name: projectData.name,
      timestamp: new Date().toISOString(),
      selections: projectData.selections
    };

    fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf-8');
    return { success: true, filePath, fileName };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Load project list
ipcMain.handle('load-projects', async (event) => {
  try {
    const dir = getProjectsDir();
    const projects = [];
    let skipped = 0;

    for (const fileName of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
      // One unreadable file must not hide every other project
      try {
        const project = JSON.parse(fs.readFileSync(path.join(dir, fileName), 'utf-8'));
        projects.push({ ...project, fileName });
      } catch (error) {
        console.error(`Skipping ${fileName}:`, error.message);
        skipped += 1;
      }
    }

    projects.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return { success: true, projects, skipped };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Load single project
ipcMain.handle('load-project', async (event, fileName) => {
  try {
    const filePath = projectPath(fileName);
    if (!filePath) return { success: false, error: `Not a project file: ${fileName}` };
    const content = fs.readFileSync(filePath, 'utf-8');
    const project = JSON.parse(content);
    return { success: true, project };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Delete project
ipcMain.handle('delete-project', async (event, fileName) => {
  try {
    const filePath = projectPath(fileName);
    if (!filePath) return { success: false, error: `Not a project file: ${fileName}` };
    fs.unlinkSync(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Select folder for saving projects
ipcMain.handle('select-folder', async (event) => {
  const { dialog } = require('electron');
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      // Create projects subfolder in selected path
      const projectsPath = path.join(selectedPath, 'suno-projects');
      fs.mkdirSync(projectsPath, { recursive: true });
      // Remember it, so saving and loading actually use the folder that was picked
      writeSettings({ projectsDir: projectsPath });
      return { success: true, path: projectsPath };
    }
    return { success: false, error: 'Folder selection canceled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
