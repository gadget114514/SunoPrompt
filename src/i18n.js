// UI strings for the Suno Style Generator. Kept apart from renderer.js
// so adding a language only touches this file.
const translations = {
  en: {
    title: 'Suno Style Generator',
    subtitle: 'Select from 6 categories to generate your prompt',
    genres: 'Genres',
    vocals: 'Vocals',
    instruments: 'Instruments',
    chords: 'Chords',
    moods: 'Mood & Emotion',
    structures: 'Structures',
    others: 'Others',
    othersPlaceholder: 'Free text...',
    bpm: 'BPM (Tempo)',
    preview: 'Preview',
    previewPlaceholder: 'Preview will appear here',
    stage: 'Stage',
    stageHint: 'Drag a dot to set its position; hover for its name',
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
    randomMoods: 'Random mood',
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
    searchPlaceholder: 'Search…',
    clearSearch: 'Clear search',
    searchNoMatch: 'Nothing matches that search',
    position: 'Position',
    panNone: 'Pan: —',
    depthNone: 'Distance: —',
    bpmTab: 'BPM',
    showRandomTargets: 'Show per-category random options',
    hideRandomTargets: 'Hide per-category random options',
    reorderTabs: 'Drag a tab (or Ctrl + ← / →) to change the order the style is written in — BPM included',
    logTabOrder: 'Style order: ',
    parsePrompt: '📥 Parse Style',
    parsePromptTitle: 'Parse Style',
    parsePlaceholder: 'Paste a Style prompt to parse...',
    parseRun: 'Parse',
    parseCancel: 'Cancel',
    logParsed: 'Prompt parsed',
    logParseEmpty: 'Nothing to parse',
    logParseAmbiguous: 'Ambiguous match',
    logParseAlso: 'also matched',
    logParseLeftAsFree: 'left as free text',
    parseModeAmbiguous: 'Ambiguous match',
    parseModePrecise: 'Precise match',
    parseModeCaseHint: 'Case is ignored when matching',
    logLangSwitched: 'Switched to English',
    logLogCleared: 'Log cleared',
    logProjectNameRequired: 'Please enter a project name',
    projectsEmpty: 'No projects saved yet',
    confirmDeleteProject: 'Delete this project?',
    // Help dialog. helpSections is read by renderHelp() in renderer.js, so it
    // must never be referenced from a data-i18n attribute.
    help: '❓ Help',
    helpTitle: 'Help',
    helpClose: 'Close',
    helpIntro: 'Tick what you want and the Style prompt is written for you. The first section is all you need to get going; the rest is there when you want it.',
    helpSections: [
      {
        heading: 'Getting started',
        items: [
          'Tick items in the centre tabs — every tick lands in the prompt straight away.',
          'Set the tempo with the BPM slider in the top bar.',
          'Click 📋 beside Preview to copy the prompt, then paste it into Suno’s "Style of Music" field.'
        ]
      },
      {
        heading: 'The category tabs',
        items: [
          'Six categories feed the prompt: Genres, Vocals, Instruments, Chords, Mood & Emotion and Structures.',
          'Vocals and Instruments are grouped into folders — click a folder to open it.',
          'The Others tab is free text: whatever you type there is added to the prompt as-is.',
          'Click a ticked item again to mark it excluded (shown crossed out); a third click clears it. Excluded items are collected into an [EXCLUDE: ...] block at the end of the prompt.'
        ]
      },
      {
        heading: 'Searching a tab',
        items: [
          'Every tab has a search box that filters its list as you type, opening matching folders for you.',
          'Emptying the box restores the full list. Searching never clears a tick you already made.'
        ]
      },
      {
        heading: 'BPM',
        items: [
          'Drag the slider or type a number between 40 and 200 in the top bar.',
          'Where the tempo appears in the prompt is set by the BPM chip in the tab row — see "Reordering the tabs".'
        ]
      },
      {
        heading: 'Preview, Copy and Save',
        items: [
          'The Preview panel rebuilds the prompt on every change.',
          'The counter under it tracks the 1000-character limit of Suno’s Style field.',
          '📋 copies the prompt, 💾 saves it as a text file, and 🗑️ clears every selection at once.'
        ]
      },
      {
        heading: 'The Stage diagram',
        items: [
          'The listener sits at the bottom and the soundstage fans out above: a marker’s angle is its pan, its distance from the listener is its depth.',
          'Each marker carries the icon of its instrument family — keyboard, guitar, bass, strings, brass, woodwind, percussion, world, electronic, ensemble — so you can read the arrangement at a glance.',
          'Drag a marker to place a part, or give it a position inside its folder. Parts with no position stay hollow in the middle.',
          'A part with no single spot is drawn as what it is: "wide stereo" becomes a bar, and "auto-panned" becomes the arc it travels, with a marker riding along it.',
          'Hover a marker to see its name and placement.'
        ]
      },
      {
        heading: 'Random generate and reroll',
        items: [
          '🎲 Random Generate rerolls every category ticked in its list — untick one to leave it alone.',
          'The 🎲 on a single row rerolls just that category and leaves the rest untouched.',
          'The ▾ beside Random Generate opens the per-category options. It starts closed.'
        ]
      },
      {
        heading: 'Reordering the tabs',
        items: [
          'The tab order is the order the parts are written in the prompt.',
          'Drag a tab sideways, or focus one and press Ctrl + ← / →, to move it.',
          'The BPM chip rides along in the same row, so the tempo can lead, trail or sit in the middle. Clicking the chip opens no tab.',
          'The order is remembered between runs and is saved with each project.'
        ]
      },
      {
        heading: 'Parse Prompt',
        items: [
          '📥 Parse Prompt takes a Style prompt you paste in and ticks everything it recognises.',
          'Ambiguous match accepts near misses; Precise match takes exact names only. Upper and lower case are ignored either way.',
          'Anything it cannot place is left in the Others tab as free text. Ctrl + Enter runs the parse.'
        ]
      },
      {
        heading: 'Projects (Windows app)',
        items: [
          'Save Project in the left panel stores the current selections, BPM and tab order under a name.',
          'Click a saved project to load it, or its ✕ to delete it.',
          'Projects need to write to disk, so they are available in the Windows app only, not in the web version.'
        ]
      },
      {
        heading: 'Save folder (Windows app)',
        items: [
          'The Settings tab in the left panel picks the folder that 💾 and Save Project write to.',
          'Windows app only.'
        ]
      },
      {
        heading: 'The log',
        items: [
          'The panel at the bottom reports what happened — what was copied, parsed, saved or rerolled.',
          'Drag its top edge to resize it, ✕ to collapse it, 🗑️ to clear it. Its height and collapsed state are remembered.'
        ]
      },
      {
        heading: 'Language',
        items: [
          'English, 日本語 and Español — pick one in the top bar, and the choice is remembered.',
          'Only the interface is translated. The prompt itself is always written in English, which is what Suno expects.'
        ]
      }
    ],
    about: 'ℹ️ About',
    aboutTitle: 'About',
    aboutApp: 'Application',
    aboutDataFiles: 'Data files',
    aboutFileCol: 'File',
    aboutVersionCol: 'Version',
    aboutUpdatedCol: 'Updated',
    aboutUnknown: 'unknown',
    aboutPending: 'Loading data…',
    openSuno: 'Open Suno in your browser'
  },
  ja: {
    title: 'Suno スタイルジェネレーター',
    subtitle: '6つのカテゴリから選択してプロンプトを生成',
    genres: 'ジャンル',
    vocals: 'ボーカル',
    instruments: '楽器',
    chords: 'コード',
    moods: 'ムード・感情',
    structures: '構造',
    others: 'その他',
    othersPlaceholder: '自由記述...',
    bpm: 'BPM (テンポ)',
    preview: 'プレビュー',
    previewPlaceholder: 'ここにプレビューが表示されます',
    stage: '定位図',
    stageHint: 'ドットをドラッグして定位を設定。ホバーで名前を表示',
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
    randomMoods: 'ムードをランダム生成',
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
    searchPlaceholder: '検索…',
    clearSearch: '検索をクリア',
    searchNoMatch: '一致する項目がありません',
    position: '定位',
    panNone: '左右: —',
    depthNone: '距離: —',
    bpmTab: 'BPM',
    showRandomTargets: 'カテゴリ別のランダム設定を開く',
    hideRandomTargets: 'カテゴリ別のランダム設定を閉じる',
    reorderTabs: 'タブをドラッグ（または Ctrl + ← / →）でスタイルの記述順を変更。BPM も含みます',
    logTabOrder: 'スタイルの順序: ',
    parsePrompt: '📥 スタイルを解析',
    parsePromptTitle: 'スタイルを解析',
    parsePlaceholder: '解析するスタイルプロンプトを貼り付け...',
    parseRun: '解析',
    parseCancel: 'キャンセル',
    logParsed: 'プロンプトを解析しました',
    logParseEmpty: '解析する内容がありません',
    logParseAmbiguous: '曖昧な一致',
    logParseAlso: '他に一致',
    logParseLeftAsFree: '自由記述へ',
    parseModeAmbiguous: '曖昧一致',
    parseModePrecise: '完全一致',
    parseModeCaseHint: '大文字・小文字は無視してマッチします',
    logLangSwitched: '言語を日本語に切り替えました',
    logLogCleared: 'ログをクリアしました',
    logProjectNameRequired: 'プロジェクト名を入力してください',
    projectsEmpty: '保存済みプロジェクトはありません',
    confirmDeleteProject: 'このプロジェクトを削除しますか？',
    help: '❓ ヘルプ',
    helpTitle: 'ヘルプ',
    helpClose: '閉じる',
    helpIntro: 'チェックを入れるだけでスタイルプロンプトができあがります。使い始めるのに必要なのは最初の項目だけ。あとは必要になったときに読んでください。',
    helpSections: [
      {
        heading: 'まずはこれだけ',
        items: [
          '中央のタブで項目にチェックを入れます。チェックはその場でプロンプトに反映されます。',
          'テンポは上部バーの BPM スライダーで設定します。',
          'プレビュー横の 📋 でプロンプトをコピーし、Suno の「Style of Music」欄に貼り付けます。'
        ]
      },
      {
        heading: 'カテゴリタブ',
        items: [
          'プロンプトは6つのカテゴリから組み立てます。ジャンル・ボーカル・楽器・コード・ムード感情・構造です。',
          'ボーカルと楽器はフォルダにまとまっています。フォルダをクリックすると開きます。',
          '「その他」タブは自由記述です。入力した内容はそのままプロンプトに追加されます。',
          'チェック済みの項目をもう一度クリックすると除外（打ち消し線で表示）になり、もう一度クリックすると解除されます。除外した項目はプロンプト末尾に [EXCLUDE: ...] としてまとめて出力されます。'
        ]
      },
      {
        heading: 'タブ内の検索',
        items: [
          '各タブの検索ボックスに入力すると一覧が絞り込まれ、該当するフォルダは自動で開きます。',
          '検索ボックスを空にすると一覧が元に戻ります。検索でチェックが外れることはありません。'
        ]
      },
      {
        heading: 'BPM',
        items: [
          '上部バーのスライダーをドラッグするか、40〜200 の数値を直接入力します。',
          'テンポがプロンプトのどこに書かれるかは、タブ列の BPM チップの位置で決まります。「タブの並べ替え」を参照してください。'
        ]
      },
      {
        heading: 'プレビュー・コピー・保存',
        items: [
          'プレビューパネルは変更のたびにプロンプトを組み直します。',
          'その下のカウンターは Suno のスタイル欄の上限1000文字を示しています。',
          '📋 でコピー、💾 でテキストファイルとして保存、🗑️ ですべての選択を一括クリアします。'
        ]
      },
      {
        heading: 'ステージ図',
        items: [
          '下にリスナー、その上に扇形の音場が広がります。マーカーの角度がパン、リスナーからの距離が奥行きです。',
          '各マーカーには楽器ファミリーのアイコン（鍵盤・ギター・ベース・弦・金管・木管・打楽器・民族楽器・電子・アンサンブル）が付くので、編成が一目で分かります。',
          'マーカーをドラッグして配置するか、フォルダ内で位置を指定します。位置のないパートは中央に白抜きのまま残ります。',
          '一点に定まらないパートはそのまま描かれます。「wide stereo」はバー、「auto-panned」は移動する弧とその上を動くマーカーになります。',
          'マーカーにカーソルを合わせると名前と配置が表示されます。'
        ]
      },
      {
        heading: 'ランダム生成と振り直し',
        items: [
          '🎲 ランダム生成は、一覧でチェックしたカテゴリすべてを振り直します。触りたくないカテゴリはチェックを外してください。',
          '各行の 🎲 はそのカテゴリだけを振り直し、ほかはそのまま残します。',
          'ランダム生成の隣の ▾ でカテゴリごとの選択パネルを開きます。初期状態は閉じています。'
        ]
      },
      {
        heading: 'タブの並べ替え',
        items: [
          'タブの並び順が、そのままプロンプト内でパートが書かれる順番になります。',
          'タブを左右にドラッグするか、フォーカスして Ctrl + ← / → で移動します。',
          'BPM チップも同じ列を一緒に動くので、テンポを先頭・末尾・中間のどこにでも置けます。チップをクリックしてもタブは開きません。',
          '並び順は次回起動時にも保たれ、プロジェクトごとに保存されます。'
        ]
      },
      {
        heading: 'プロンプト解析',
        items: [
          '📥 プロンプト解析は、貼り付けたスタイルプロンプトから認識できた項目にチェックを入れます。',
          '曖昧一致は近い表記も受け入れ、完全一致は正式名称だけを受け入れます。どちらも大文字・小文字は区別しません。',
          '判別できなかった語は「その他」タブに自由記述として残ります。Ctrl + Enter で解析を実行できます。'
        ]
      },
      {
        heading: 'プロジェクト（Windows アプリ）',
        items: [
          '左パネルの「プロジェクト保存」で、現在の選択・BPM・タブ順に名前を付けて保存します。',
          '保存済みプロジェクトをクリックすると読み込み、✕ で削除します。',
          'ディスクへの書き込みが必要なため、この機能は Windows アプリ専用です。Web 版では使えません。'
        ]
      },
      {
        heading: '保存フォルダ（Windows アプリ）',
        items: [
          '左パネルの設定タブで、💾 とプロジェクト保存の書き込み先フォルダを選びます。',
          'Windows アプリ専用です。'
        ]
      },
      {
        heading: 'ログ',
        items: [
          '下部のパネルに、コピー・解析・保存・振り直しなどの結果が記録されます。',
          '上端をドラッグして高さを変え、✕ で折りたたみ、🗑️ で消去します。高さと折りたたみ状態は記憶されます。'
        ]
      },
      {
        heading: '言語',
        items: [
          'English・日本語・Español を上部バーで切り替えられます。選択は記憶されます。',
          '翻訳されるのは画面表示だけです。プロンプト自体は Suno が想定する英語で常に生成されます。'
        ]
      }
    ],
    about: 'ℹ️ 情報',
    aboutTitle: 'バージョン情報',
    aboutApp: 'アプリケーション',
    aboutDataFiles: 'データファイル',
    aboutFileCol: 'ファイル',
    aboutVersionCol: 'バージョン',
    aboutUpdatedCol: '更新日',
    aboutUnknown: '不明',
    aboutPending: 'データを読み込んでいます…',
    openSuno: 'Suno をブラウザで開く'
  },
  es: {
    title: 'Generador de Estilos Suno',
    subtitle: 'Selecciona de 6 categorías para generar tu prompt',
    genres: 'Géneros',
    vocals: 'Voces',
    instruments: 'Instrumentos',
    chords: 'Acordes',
    moods: 'Ánimo y emoción',
    structures: 'Estructuras',
    others: 'Otros',
    othersPlaceholder: 'Texto libre...',
    bpm: 'BPM (Tempo)',
    preview: 'Vista previa',
    previewPlaceholder: 'La vista previa aparecerá aquí',
    stage: 'Escenario',
    stageHint: 'Arrastra un punto para fijar su posición; pasa el cursor para ver su nombre',
    stageEmpty: 'Elige una voz o un instrumento',
    stageUnplaced: 'sin posición',
    stageLeft: 'I',
    stageRight: 'D',
    chars: 'caracteres',
    random: '🎲 Generar aleatorio',
    randomGenres: 'Género aleatorio',
    randomVocals: 'Voz aleatoria',
    randomInstruments: 'Instrumentos aleatorios',
    randomChords: 'Acordes aleatorios',
    randomMoods: 'Ánimo aleatorio',
    randomStructures: 'Estructuras aleatorias',
    copy: 'Copiar al portapapeles',
    save: 'Guardar en archivo',
    clearAll: 'Borrar todo',
    logCleared: 'Todas las selecciones borradas',
    log: 'Registro',
    clearLog: 'Borrar',
    closeLog: 'Cerrar registro',
    openLog: 'Abrir registro',
    resizeLog: 'Arrastra para redimensionar el registro',
    logDataLoaded: 'Datos cargados correctamente',
    logRandomGenerated: 'Generación aleatoria ejecutada',
    logRandomCategory: 'Aleatorio generado: ',
    logRandomNoTarget: 'Marca al menos una categoría para aleatorizar',
    logCopied: 'Copiado al portapapeles',
    logFileSaved: 'Archivo guardado: ',
    logErrorCopy: 'Error: nada que copiar',
    logErrorSave: 'Error: nada que guardar',
    projects: 'Proyectos',
    settings: 'Ajustes',
    saveProject: '💾 Guardar proyecto',
    projectNamePlaceholder: 'Nombre del proyecto...',
    browse: 'Examinar',
    saveFolder: 'Carpeta de guardado',
    logProjectSaved: 'Proyecto guardado: ',
    logProjectLoaded: 'Proyecto cargado: ',
    logProjectDeleted: 'Proyecto eliminado',
    logProjectsError: 'No se pudo leer la carpeta de proyectos: ',
    logProjectsSkipped: 'Se omitieron {n} archivos ilegibles en la carpeta de proyectos',
    logFolderChanged: 'Carpeta de proyectos: ',
    instrumentOnly: 'solo nombre del instrumento',
    searchPlaceholder: 'Buscar…',
    clearSearch: 'Borrar la búsqueda',
    searchNoMatch: 'No hay coincidencias',
    position: 'Posición',
    panNone: 'Panorama: —',
    depthNone: 'Distancia: —',
    bpmTab: 'BPM',
    showRandomTargets: 'Mostrar opciones aleatorias por categoría',
    hideRandomTargets: 'Ocultar opciones aleatorias por categoría',
    reorderTabs: 'Arrastra una pestaña (o Ctrl + ← / →) para cambiar el orden del estilo — BPM incluido',
    logTabOrder: 'Orden del estilo: ',
    parsePrompt: '📥 Analizar estilo',
    parsePromptTitle: 'Analizar estilo',
    parsePlaceholder: 'Pega un prompt de estilo para analizar...',
    parseRun: 'Analizar',
    parseCancel: 'Cancelar',
    logParsed: 'Prompt analizado',
    logParseEmpty: 'Nada que analizar',
    logParseAmbiguous: 'Coincidencia ambigua',
    logParseAlso: 'también coincide',
    logParseLeftAsFree: 'se dejó como texto libre',
    parseModeAmbiguous: 'Coincidencia ambigua',
    parseModePrecise: 'Coincidencia precisa',
    parseModeCaseHint: 'No se distingue entre mayúsculas y minúsculas',
    logLangSwitched: 'Cambiado a español',
    logLogCleared: 'Registro borrado',
    logProjectNameRequired: 'Introduce un nombre de proyecto',
    projectsEmpty: 'Aún no hay proyectos guardados',
    confirmDeleteProject: '¿Eliminar este proyecto?',
    help: '❓ Ayuda',
    helpTitle: 'Ayuda',
    helpClose: 'Cerrar',
    helpIntro: 'Marca lo que quieras y el prompt de estilo se escribe solo. Con la primera sección ya puedes empezar; el resto está aquí para cuando lo necesites.',
    helpSections: [
      {
        heading: 'Para empezar',
        items: [
          'Marca elementos en las pestañas centrales: cada marca entra en el prompt al instante.',
          'Ajusta el tempo con el deslizador de BPM de la barra superior.',
          'Pulsa 📋 junto a la Vista previa para copiar el prompt y pégalo en el campo «Style of Music» de Suno.'
        ]
      },
      {
        heading: 'Las pestañas de categorías',
        items: [
          'Seis categorías alimentan el prompt: Géneros, Voces, Instrumentos, Acordes, Ánimo y emoción, y Estructuras.',
          'Voces e Instrumentos están agrupados en carpetas; haz clic en una carpeta para abrirla.',
          'La pestaña Otros es texto libre: lo que escribas allí se añade al prompt tal cual.',
          'Vuelve a hacer clic en un ítem marcado para excluirlo (se muestra tachado); un tercer clic lo deja sin marcar. Los ítems excluidos se agrupan al final del prompt en un bloque [EXCLUDE: ...].'
        ]
      },
      {
        heading: 'Buscar dentro de una pestaña',
        items: [
          'Cada pestaña tiene un buscador que filtra su lista mientras escribes y abre las carpetas que coinciden.',
          'Al vaciar el buscador vuelve la lista completa. Buscar nunca desmarca lo que ya habías marcado.'
        ]
      },
      {
        heading: 'BPM',
        items: [
          'Arrastra el deslizador o escribe un número entre 40 y 200 en la barra superior.',
          'El lugar donde aparece el tempo en el prompt lo decide la ficha BPM de la fila de pestañas; consulta «Reordenar las pestañas».'
        ]
      },
      {
        heading: 'Vista previa, Copiar y Guardar',
        items: [
          'El panel de Vista previa rehace el prompt con cada cambio.',
          'El contador de abajo controla el límite de 1000 caracteres del campo Style de Suno.',
          '📋 copia el prompt, 💾 lo guarda como archivo de texto y 🗑️ borra todas las selecciones de una vez.'
        ]
      },
      {
        heading: 'El diagrama de Escenario',
        items: [
          'El oyente está abajo y el escenario sonoro se abre en abanico por encima: el ángulo de un marcador es su paneo y su distancia al oyente es su profundidad.',
          'Cada marcador lleva el icono de su familia instrumental —teclado, guitarra, bajo, cuerdas, metales, viento madera, percusión, étnico, electrónico, conjunto— para leer el arreglo de un vistazo.',
          'Arrastra un marcador para colocar una parte, o dale una posición dentro de su carpeta. Las partes sin posición quedan huecas en el centro.',
          'Una parte sin un punto único se dibuja tal como es: «wide stereo» pasa a ser una barra y «auto-panned» el arco que recorre, con un marcador desplazándose por él.',
          'Pasa el cursor sobre un marcador para ver su nombre y su colocación.'
        ]
      },
      {
        heading: 'Generación aleatoria y nuevas tiradas',
        items: [
          '🎲 Generar aleatorio vuelve a tirar todas las categorías marcadas en su lista; desmárcala para dejarla como está.',
          'El 🎲 de una fila vuelve a tirar solo esa categoría y no toca las demás.',
          'El ▾ junto a Generar aleatorio abre las opciones por categoría. Empieza cerrado.'
        ]
      },
      {
        heading: 'Reordenar las pestañas',
        items: [
          'El orden de las pestañas es el orden en que se escriben las partes del prompt.',
          'Arrastra una pestaña de lado, o enfócala y pulsa Ctrl + ← / →, para moverla.',
          'La ficha BPM se desplaza en la misma fila, así el tempo puede ir al principio, al final o en medio. Al pulsarla no se abre ninguna pestaña.',
          'El orden se recuerda entre sesiones y se guarda con cada proyecto.'
        ]
      },
      {
        heading: 'Analizar prompt',
        items: [
          '📥 Analizar prompt toma un prompt de estilo que pegues y marca todo lo que reconoce.',
          'La coincidencia ambigua acepta aproximaciones; la precisa solo admite nombres exactos. En ambos casos no se distingue entre mayúsculas y minúsculas.',
          'Lo que no logra situar se queda como texto libre en la pestaña Otros. Ctrl + Enter ejecuta el análisis.'
        ]
      },
      {
        heading: 'Proyectos (aplicación de Windows)',
        items: [
          'Guardar proyecto, en el panel izquierdo, guarda con un nombre las selecciones actuales, el BPM y el orden de las pestañas.',
          'Haz clic en un proyecto guardado para cargarlo, o en su ✕ para eliminarlo.',
          'Los proyectos necesitan escribir en disco, por lo que solo están disponibles en la aplicación de Windows, no en la versión web.'
        ]
      },
      {
        heading: 'Carpeta de guardado (aplicación de Windows)',
        items: [
          'La pestaña Ajustes del panel izquierdo elige la carpeta en la que escriben 💾 y Guardar proyecto.',
          'Solo en la aplicación de Windows.'
        ]
      },
      {
        heading: 'El registro',
        items: [
          'El panel inferior informa de lo ocurrido: qué se copió, analizó, guardó o volvió a tirarse.',
          'Arrastra su borde superior para cambiar el tamaño, ✕ para plegarlo y 🗑️ para borrarlo. Se recuerdan su altura y si estaba plegado.'
        ]
      },
      {
        heading: 'Idioma',
        items: [
          'English, 日本語 y Español: elige uno en la barra superior y la elección se recuerda.',
          'Solo se traduce la interfaz. El prompt siempre se escribe en inglés, que es lo que Suno espera.'
        ]
      }
    ],
    about: 'ℹ️ Acerca de',
    aboutTitle: 'Acerca de',
    aboutApp: 'Aplicación',
    aboutDataFiles: 'Archivos de datos',
    aboutFileCol: 'Archivo',
    aboutVersionCol: 'Versión',
    aboutUpdatedCol: 'Actualizado',
    aboutUnknown: 'desconocida',
    aboutPending: 'Cargando datos…',
    openSuno: 'Abrir Suno en tu navegador'
  }
};
