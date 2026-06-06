# PC / モバイル分離方針

## 目的

- クローン音声生成は PC で実行
- ASR は PC / モバイルで別実装に分離
- モバイル側は、生成済み音声とその元テキストのペアをブラウザへアップロードして使う
- 音声とテキストは英語限定で扱う

## 今回追加したもの

- PC TTS / ASR 実装: [src/main/qwen_pc_processors.py](src/main/qwen_pc_processors.py)
- モバイル配布用バンドル形式: [src/main/study_bundle.py](src/main/study_bundle.py)
- PC 用 CLI ラッパー: [src/main/qwen_tts_asr_roundtrip.py](src/main/qwen_tts_asr_roundtrip.py)
- モバイル OSS ASR モデル梱包スクリプト: [src/main/mobile_asr_model_bundle.py](src/main/mobile_asr_model_bundle.py)
- モバイル UI: [src/mobile/index.html](src/mobile/index.html)

## バンドルの中身

ZIP に以下を入れます。

- `manifest.json`
- 生成済み音声ファイル (`generated.wav` など)

`manifest.json` には以下を保存します。

- 元テキスト
- 言語
- 音声ファイル名
- 使用 TTS モデル名
- 作成日時

## PC 側の使い方

### 1. 生成済み音声 + PC ASR 確認

```bash
uv run python src/main/qwen_tts_asr_roundtrip.py \
  --text "This is a sample sentence for English voice-clone playback and ASR practice." \
  --ref-audio .local/00_short_clip.wav \
  --output-audio .local/qwen3tts_roundtrip.wav \
  --language English
```

### 2. モバイル用バンドルも同時に作る

```bash
uv run python src/main/qwen_tts_asr_roundtrip.py \
  --text "This is a sample sentence for English voice-clone playback and ASR practice." \
  --ref-audio .local/00_short_clip.wav \
  --output-audio .local/qwen3tts_roundtrip.wav \
  --bundle-output .local/mobile_study_bundle.zip \
  --language English
```

## モバイル側の流れ

### 起動方法

`src/mobile` は静的フロントエンドです。マイク利用のため、`localhost` などの安全なオリジンで配信してください。

例:

```bash
cd src/mobile
python -m http.server 8000
```

その後、ブラウザで `http://localhost:8000` を開きます。

1. ブラウザで `mobile_study_bundle.zip` をアップロード
2. `manifest.json` を読む
3. 音声を再生
4. 元テキストを表示
5. ユーザー音声を録音
6. モバイル用 ASR 実装で英語文字起こし
7. 元テキストと比較

現在の [src/mobile/index.html](src/mobile/index.html) は、以下の 2 モードを切り替えられます。

- `Browser SpeechRecognition`
- `OSS local model bundle`

後者では、PC 側で事前にダウンロードして ZIP 化した ONNX 系 ASR モデルをブラウザへアップロードし、その場で読み込んで推論します。

低レベルの WebGPU 経路だけを切り分けたい場合は、[src/mobile/ort-webgpu-diagnostic.html](src/mobile/ort-webgpu-diagnostic.html) を開いてください。
このページは `transformers.js` を通さず、`onnxruntime-web/webgpu` を直接 import して、ごく小さい ONNX `MatMul` モデルでセッション作成と推論を試します。

### OSS ASR モデル ZIP の作成

例: 精度重視の英語用 `whisper-base.en` をブラウザ用に梱包する。

```bash
uv run python src/main/mobile_asr_model_bundle.py \
  --model-id onnx-community/whisper-base.en \
  --output .local/mobile_asr_model_bundle.zip \
  --dtype q8 \
  --preferred-device webgpu
```

複数の組み合わせを 1 つの ZIP に入れたい場合は `--variant` を追加します。

```bash
uv run python src/main/mobile_asr_model_bundle.py \
  --model-id onnx-community/whisper-base.en \
  --output .local/mobile_asr_model_bundle.zip \
  --variant webgpu:fp16 \
  --variant wasm:q8
```

この場合、ブラウザ側では利用可能なバックエンドに合わせて適切な組み合わせを自動選択します。

生成された ZIP を、モバイル画面の `OSS model bundle` からアップロードします。

### ローカル OSS ASR の前提

- 初回ロードは `SpeechRecognition` よりかなり重い
- `WebGPU` が使える Chromium 系で最も現実的
- `WebGPU` が使えない場合は `wasm` にフォールバック
- 今回の実装は「リアルタイム」ではなく「録音後に推論」前提

## 実装分離の考え方

### PC 側
- `QwenPcTtsProcessor`
- `QwenPcAsrProcessor`

### モバイル側
モバイル側では、以下の 2 系統を比較できます。

- `SpeechRecognition` ベースのブラウザ実装
- `transformers.js` + アップロード済み ONNX モデル ZIP によるローカル OSS 実装

## 次にやると良いこと

1. 実機 Chrome / Edge で `SpeechRecognition` と OSS ローカル推論の待ち時間を比較する
2. `whisper-base.en` とより軽量な英語モデルを差し替えて速度差を見る
3. 実測結果をもとに、既定エンジンをどちらにするか決める
