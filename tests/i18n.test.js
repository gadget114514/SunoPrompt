const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Load i18n and i18n_keywords into global scope via vm
const i18nCode = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf8');
const i18nKeywordsCode = fs.readFileSync(path.join(__dirname, '../src/i18n_keywords.js'), 'utf8');

vm.runInThisContext(i18nCode);
vm.runInThisContext(i18nKeywordsCode);

test('translations object contains expected languages (en, ja, es)', () => {
  assert.ok(typeof translations !== 'undefined', 'translations object should be defined');
  assert.ok(translations.en, 'translations should have English');
  assert.ok(translations.ja, 'translations should have Japanese');
  assert.ok(translations.es, 'translations should have Spanish');
});

test('translations contains essential UI keys across all supported languages', () => {
  const essentialKeys = [
    'title', 'subtitle', 'genres', 'vocals', 'instruments', 'chords',
    'moods', 'structures', 'others', 'bpm', 'preview', 'stage',
    'random', 'copy', 'save', 'clearAll', 'log', 'projects', 'settings',
    'lyrics', 'help', 'about'
  ];

  ['en', 'ja', 'es'].forEach(lang => {
    essentialKeys.forEach(key => {
      assert.ok(
        translations[lang][key] !== undefined,
        `Language '${lang}' missing key '${key}'`
      );
    });
  });
});

test('translations key symmetry between en and other languages', () => {
  const enKeys = Object.keys(translations.en);

  ['ja', 'es'].forEach(lang => {
    const langKeys = new Set(Object.keys(translations[lang]));
    enKeys.forEach(key => {
      assert.ok(
        langKeys.has(key),
        `Language '${lang}' should have translation key '${key}' from English`
      );
    });
  });
});

test('keywordTranslations object contains ja and es keyword maps', () => {
  assert.ok(typeof keywordTranslations !== 'undefined', 'keywordTranslations should be defined');
  assert.ok(keywordTranslations.ja, 'keywordTranslations should have Japanese');
  assert.ok(keywordTranslations.es, 'keywordTranslations should have Spanish');

  // Verify common musical keywords are translated
  ['Rock', 'Pop', 'Jazz', 'Grand Piano', 'Violin'].forEach(term => {
    assert.ok(keywordTranslations.ja[term], `Japanese keyword translation for '${term}' missing`);
    assert.ok(keywordTranslations.es[term], `Spanish keyword translation for '${term}' missing`);
  });
});
