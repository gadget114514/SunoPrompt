const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Create projects folder in userData
const projectsDir = path.join(app.getPath('userData'), 'projects');
if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

let mainWindow;

const loadJSONFiles = () => {
  const jsonDir = __dirname;
  const files = {
    genre: 'genre.json',
    vocal: 'suno_style_vocal_spec.json',
    instruments: 'suno_instrument_techniques.json',
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
  return data;
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'images', 'application.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  if (!app.isPackaged) mainWindow.webContents.openDevTools();

  // Send default folder path
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('default-folder-path', projectsDir);
  });
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

// Save project
ipcMain.handle('save-project', async (event, projectData) => {
  try {
    const fileName = `${projectData.name.replace(/[^\w\s]/g, '_')}_${Date.now()}.json`;
    const filePath = path.join(projectsDir, fileName);

    const project = {
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
    const files = fs.readdirSync(projectsDir);
    const projects = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const content = fs.readFileSync(path.join(projectsDir, f), 'utf-8');
        const project = JSON.parse(content);
        return { ...project, fileName: f };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return { success: true, projects };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Load single project
ipcMain.handle('load-project', async (event, fileName) => {
  try {
    const filePath = path.join(projectsDir, fileName);
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
    const filePath = path.join(projectsDir, fileName);
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
      if (!fs.existsSync(projectsPath)) {
        fs.mkdirSync(projectsPath, { recursive: true });
      }
      return { success: true, path: projectsPath };
    }
    return { success: false, error: 'Folder selection canceled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
