// Browser implementation of window.electronAPI, used when the app runs outside
// Electron (e.g. on GitHub Pages). Project management is desktop-only.
(() => {
  if (window.electronAPI) return;

  const DATA_FILES = {
    genre: 'genre.json',
    vocal: 'suno_style_vocal_spec.json',
    instruments: 'suno_instrument_techniques.json',
    structure: 'suno_style_structure_phrases.json'
  };
  // The deployed site keeps the JSON next to index.html; in the repo it is one level up.
  const DATA_BASES = ['./', '../'];

  const fetchJson = async (fileName) => {
    for (const base of DATA_BASES) {
      try {
        const res = await fetch(base + fileName, { cache: 'no-cache' });
        if (res.ok) return await res.json();
      } catch (error) {
        // try next location
      }
    }
    console.error(`Error loading ${fileName}`);
    return null;
  };

  const loadJsonData = async () => {
    const entries = await Promise.all(
      Object.entries(DATA_FILES).map(async ([key, fileName]) => [key, await fetchJson(fileName)])
    );
    return Object.fromEntries(entries);
  };

  const downloadText = (text, fileName) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyFallback = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    if (!ok) throw new Error('Clipboard is not available');
  };

  window.electronAPI = {
    isWeb: true,

    onJsonData: (callback) => {
      loadJsonData().then(callback);
    },

    copyToClipboard: async (text) => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          copyFallback(text);
        }
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    saveToFile: async (text) => {
      downloadText(text, 'suno-prompt.txt');
      return { success: true, filePath: 'suno-prompt.txt' };
    }
  };
})();
