const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const keywordTranslations = require('../src/i18n_keywords.js');
global.keywordTranslations = keywordTranslations;

const { keywordTrans, keywordLabel, getCurrentLang, setCurrentLang } = require('../src/renderer.js');

describe('keywordTrans and keywordLabel tests', () => {
  beforeEach(() => {
    global.keywordTranslations = keywordTranslations;
    setCurrentLang('en');
  });

  describe('keywordTrans', () => {
    test('returns null when currentLang is "en"', () => {
      setCurrentLang('en');
      assert.equal(keywordTrans('Rock'), null);
      assert.equal(keywordTrans('Pop'), null);
    });

    test('returns correct translation when currentLang is "ja"', () => {
      setCurrentLang('ja');
      assert.equal(keywordTrans('Rock'), 'ロック');
      assert.equal(keywordTrans('Era'), '時代別');
      assert.equal(keywordTrans('Synthwave'), 'シンセウェーブ');
    });

    test('returns correct translation when currentLang is "es"', () => {
      setCurrentLang('es');
      assert.equal(keywordTrans('Rock'), 'Rock');
      assert.equal(keywordTrans('Alternative Rock'), 'Rock alternativo');
      assert.equal(keywordTrans('Classical'), 'Clásica');
    });

    test('returns null when phrase is null or undefined', () => {
      setCurrentLang('ja');
      assert.equal(keywordTrans(null), null);
      assert.equal(keywordTrans(undefined), null);
    });

    test('returns null for unknown keyword', () => {
      setCurrentLang('ja');
      assert.equal(keywordTrans('NonExistentKeywordXYZ'), null);
    });

    test('returns null for unsupported language', () => {
      setCurrentLang('fr');
      assert.equal(keywordTrans('Rock'), null);
    });

    test('returns null when keywordTranslations is undefined', () => {
      setCurrentLang('ja');
      const backup = global.keywordTranslations;
      delete global.keywordTranslations;
      try {
        assert.equal(keywordTrans('Rock'), null);
      } finally {
        global.keywordTranslations = backup;
      }
    });
  });

  describe('keywordLabel', () => {
    test('returns "English" when currentLang is "en"', () => {
      setCurrentLang('en');
      assert.equal(keywordLabel('Rock'), 'Rock');
    });

    test('returns "English (Translated)" when currentLang is "ja" and translation differs', () => {
      setCurrentLang('ja');
      assert.equal(keywordLabel('Rock'), 'Rock (ロック)');
      assert.equal(keywordLabel('Era'), 'Era (時代別)');
    });

    test('returns "English" without parentheses when translation is identical to phrase', () => {
      setCurrentLang('es');
      assert.equal(keywordLabel('Rock'), 'Rock');
    });

    test('returns "English (Translated)" when translation in Spanish differs', () => {
      setCurrentLang('es');
      assert.equal(keywordLabel('Alternative Rock'), 'Alternative Rock (Rock alternativo)');
    });

    test('returns original input when phrase has no translation', () => {
      setCurrentLang('ja');
      assert.equal(keywordLabel('UnknownKeyword'), 'UnknownKeyword');
    });
  });
});
