# study-lang Web UI

英語シャドーイング練習を支援するブラウザアプリです。  
PC 上で音声（クローン TTS）を生成し、モバイルブラウザで再生しながら自分の発音を録音・ASR で採点できます。

---

## 機能一覧

| 機能 | 説明 |
|------|------|
| **スタディバンドル アップロード** | PC ワークフローで生成した ZIP をブラウザに読み込む |
| **TTS 音声生成（単発）** | 学年・フレーズを選び、参照音声を使ってクローン TTS で音声を生成する |
| **TTS 音声生成（一括）** | 選択した学年の全フレーズを一括で生成してバンドルにまとめる |
| **バンドル生成** | 生成済み音声リストを 1 つの ZIP にまとめてブラウザに読み込む |
| **ASR エンジン切替** | ブラウザ内蔵 SpeechRecognition と OSS ローカルモデルを切り替える |
| **OSS モデル読み込み** | WASM/ONNX モデル ZIP をアップロードまたは URL 指定で読み込む |
| **音声再生** | クローン音声を参照としてブラウザ上で再生する |
| **録音 / 停止** | マイクを使って自分の音声を録音する |
| **文字起こし（ASR）** | 録音した音声を ASR でテキスト化する（自動実行オプションあり） |
| **テキスト差分比較** | ASR 結果と正解テキストを単語単位で比較・ハイライト表示する |
| **スコア表示** | 単語一致率をパーセンテージで表示する |
| **ストレージ管理** | IndexedDB に保存した各種データを個別に確認・削除できる |

---

## システム構成

```
[ブラウザ（モバイル/PC）]
  ├── src/mobile/index.html  ← Web UI のエントリポイント
  ├── src/mobile/app.js      ← フロントエンドロジック
  └── src/mobile/styles.css  ← スタイル

[Python API サーバー]
  └── src/main/app.py        ← 静的ファイル配信 + TTS API
        └── POST /api/generate-bundle  ← TTS 音声生成エンドポイント
```

- フロントエンドは **IndexedDB** にスタディバンドル・ASR モデル・参照音声を永続保存します。
- バックエンドは **Qwen3-TTS** を使ったボイスクローン TTS を提供します（要 GPU 環境）。

---

## セットアップ

### 必要環境

- Python 3.11+
- [uv](https://github.com/astral-sh/uv)
- GPU 環境（TTS 生成時。VRAM 16GB 以上推奨）

### インストール

```bash
git clone git@github.com:ifritJP/shadowing_webui.git
cd shadowing_webui
uv sync
```

---

## サーバーの起動

```bash
uv run python -m src.main.app -p 8080
```

| オプション | 省略時デフォルト | 説明 |
|-----------|----------------|------|
| `-p`, `--port` | `8000` | 待ち受けポート番号 |

起動後、ブラウザで `http://localhost:8080` にアクセスすると Web UI が開きます（`/src/mobile/index.html` に自動リダイレクトされます）。

---

## 使い方

### ステップ 1：スタディバンドルを用意する

スタディバンドルは「フレーズテキスト + クローン音声」を ZIP にまとめたファイルです。  
2 通りの方法で用意できます。

#### Option A：既存の ZIP をアップロード

1. **「Study bundle」** カードの **「Option A: Upload study bundle ZIP」** からファイルを選択します。
2. 読み込みが完了するとフレーズが自動でセットされます。

#### Option B：TTS でその場生成する

> バックエンドサーバーが起動している必要があります。

1. **「Grade Level」** から学年を選択します（中学 1 年〜高校 3 年）。
2. **「Select Phrase」** から練習したいフレーズを選びます（テキストエリアに自動入力されます）。
3. **「Reference audio for voice cloning」** から参照音声（WAV）を選択します。  
   ※省略すると、サーバーのデフォルト参照音声が使われます。
4. **「Generate & Add to List」** ボタンを押すと、サーバーで TTS が実行されて生成済みリストに追加されます。

##### 学年の全フレーズを一括生成する

1. **「Generate All for Selected Grade」** ボタンを押します。
2. OOM（メモリ不足）を防ぐため、フレーズ間に 800ms の待機を挟みながら順次生成します。
3. 生成が完了すると自動でバンドルが作成・読み込まれます。

#### バンドルをまとめて読み込む

フレーズを複数生成した後、**「Create & Load Study Bundle」** ボタンを押すと、生成済みリストを 1 つの ZIP にまとめてブラウザに読み込みます。

---

### ステップ 2：ASR エンジンを選択する

| エンジン | 特徴 |
|---------|------|
| **Browser SpeechRecognition** | セットアップ不要。ネットワーク接続が必要 |
| **OSS local model bundle** | オフライン動作。WASM/ONNX モデルを読み込む必要あり |

**OSS ローカルモデルを使う場合：**

1. **「OSS model bundle」** から ZIP をアップロード、または URL を入力して **「Fetch & Load」** を押します。
   - デフォルト URL: `/mobile_asr_model_bundle_wasm_uint8_tiny.zip`（tiny モデル）
   - base モデルは `/mobile_asr_model_bundle_wasm_uint8_base.zip`
2. **「Load OSS model」** ボタンでモデルを読み込みます（初回は数十秒かかる場合があります）。

---

### ステップ 3：バンドルを確認する

バンドルが読み込まれると **「3. Review bundle」** カードが表示されます。

- **フレーズ切替**: `Switch Phrase in Bundle` ドロップダウンで複数フレーズを切り替えられます。
- **参照音声再生**: `<audio>` プレイヤーでクローン音声を再生できます。
- **参照音声の ASR**: **「ASR uploaded sample audio」** ボタンで参照音声を文字起こしできます。

---

### ステップ 4：録音して文字起こしする

1. **「Start recording」** を押してマイクで発音を録音します。
2. **「Stop」** で録音を停止します。
3. **「Transcribe」** で ASR を実行します。

**自動化オプション：**

| チェックボックス | 動作 |
|----------------|------|
| 録音停止後、自動で ASR を実行する | Stop を押すと自動で Transcribe が走る |
| ASR 実行後、自動で比較する | 文字起こし完了後に自動でテキスト比較が走る |

---

### ステップ 5：結果を確認する

- **Transcript**: ASR の文字起こし結果が表示されます。
- **Compare Texts (Show Diff)**: 正解テキストと ASR 結果を単語単位で差分表示します。
  - 緑: ASR 結果のうち一致した単語
  - 赤: 誤認識または挿入された単語
  - 赤（取り消し線）: 読み飛ばした単語
- **Word overlap**: 単語一致率（%）が表示されます。
- **実行時情報**: エンジン・バックエンド・各処理時間が表示されます。

---

### ストレージ管理

ブラウザの IndexedDB に保存されたデータを確認・削除できます。

- **個別削除**: ストレージ一覧の各項目の **「Delete」** ボタンで個別に削除できます。
  - Study Bundle
  - Model Bundle（OSS ASR モデル）
  - Reference Audio（参照音声）
- **全削除**: **「Clear browser storage」** ボタンで IndexedDB の全データを削除します。

---

## 開発者向け情報

### IPython モデルキャッシュ（開発用）

Qwen 系モデルのロードを毎回やり直さないように、開発用 IPython シェルを用意しています。

```bash
# 開発用依存のセットアップ（初回のみ）
uv sync --group dev

# 起動
uv run --group dev ipython -i src/main/dev_shell.py
# または
IPYTHONDIR=$PWD/.ipython uv run --group dev ipython
```

起動後に使えるヘルパー:

```python
get_asr_model("Qwen/Qwen3-ASR-4B", device_map="cuda:0")
get_tts_model("Qwen/Qwen3-TTS-4B", device_map="cuda:0")
list_cached_models()
clear_model_cache()
```

詳細は [docs/mobile-browser-workflow.md](docs/mobile-browser-workflow.md) を参照してください。

### ソース配置

```
src/
├── main/          # Python バックエンド（TTS API サーバー）
└── mobile/        # ブラウザ Web UI
    ├── index.html
    ├── app.js
    ├── styles.css
    └── ort-webgpu-diagnostic.html  # ONNX Runtime WebGPU 確認用
```

---

## ライセンス

MIT License — 詳細は [LICENSE](LICENSE) を参照してください。
