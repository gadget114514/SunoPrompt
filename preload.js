const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onJsonData: (callback) => ipcRenderer.on('json-data', (event, data) => callback(data)),
  getProjectsDir: () => ipcRenderer.invoke('get-projects-dir'),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  saveToFile: (text) => ipcRenderer.invoke('save-to-file', text),
  saveProject: (projectData) => ipcRenderer.invoke('save-project', projectData),
  loadProjects: () => ipcRenderer.invoke('load-projects'),
  loadProject: (fileName) => ipcRenderer.invoke('load-project', fileName),
  deleteProject: (fileName) => ipcRenderer.invoke('delete-project', fileName),
  selectFolder: () => ipcRenderer.invoke('select-folder')
});
