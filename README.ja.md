# 🎵 Suno Prompt Generator

[English](README.md) | 日本語

[Suno AI](https://suno.com/) 用のスタイルプロンプトを、チェックボックスを選ぶだけで組み立てられるデスクトップアプリです。

![Suno Prompt Generator](snapshot/application-main.jpg)

## 特徴

- **4つのカテゴリから選択** — ジャンル・ボーカル・楽器・構造を組み合わせてプロンプトを生成
- **BPM 指定** — スライダーまたは数値入力でテンポを設定
- **リアルタイムプレビュー** — 選択に合わせてプロンプトが即時更新
- **ランダム生成** — ワンクリックでランダムな組み合わせを作成
- **すべてクリア** — 選択とプレビューを一括リセット
- **コピー / 保存** — クリップボードへのコピー、テキストファイルへの保存
- **プロジェクト管理** — 選択内容に名前を付けて保存・読み込み・削除
- **日本語 / English** — UI 言語を切り替え可能

## Web版

インストール不要でブラウザからすぐに使えます: **[https://gadget114514.github.io/SunoPrompt/](https://gadget114514.github.io/SunoPrompt/)**

プロジェクトの保存・読み込みは Windows アプリ版のみの機能です。

## ダウンロード (Windowsアプリ)

[Releases](https://github.com/gadget114514/SunoPrompt/releases) から `SunoPromptGenerator.exe` をダウンロードして実行してください。
インストール不要で、Node.js や npm も必要ありません（Windows x64）。

> 署名なしの実行ファイルのため、初回起動時に Windows SmartScreen の警告が出ることがあります。
> その場合は「詳細情報」→「実行」を選んでください。

## 使い方

1. 中央のタブ（Genres / Vocals / Instruments / Structures）から項目をチェック
2. 右上のスライダーで BPM を調整
3. Preview に表示されたプロンプトを **Copy to Clipboard** でコピー
4. Suno の Style of Music 欄に貼り付け

気に入った組み合わせは左パネルの **Save Project** で保存できます。

## 開発

```bash
git clone https://github.com/gadget114514/SunoPrompt.git
cd SunoPrompt
npm install
npm start
```

### Web版 (GitHub Pages)

`main` へ push すると `.github/workflows/pages.yml` が `src/` と JSON データをまとめて GitHub Pages にデプロイします。
ローカルで確認する場合はリポジトリのルートを配信して `/src/index.html` を開いてください。

```bash
npx http-server . -c-1
```

### exe のビルド

```bash
npm run dist
```

`dist/SunoPromptGenerator.exe`（ポータブル版）が生成されます。

## データファイル

プロンプトの候補は以下の JSON から読み込まれます。編集すれば選択肢をカスタマイズできます。

| ファイル | 内容 |
|---|---|
| `genre.json` | ジャンル |
| `suno_style_vocal_spec.json` | ボーカルのモード・表現 |
| `suno_instrument_techniques.json` | 楽器と奏法 |
| `suno_style_structure_phrases.json` | 曲構成のフレーズ |

## ライセンス

[MIT](LICENSE)
