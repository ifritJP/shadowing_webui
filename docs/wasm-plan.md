# WASM 対応メモ

## 結論

現状の `qwen-tts` / `qwen-asr` / `torch` ベースの Python 実装は、そのままブラウザ WASM では動きません。
主な理由は以下です。

- `torch` と周辺依存が Pyodide / browser WASM 前提ではない
- モデルサイズが大きく、ブラウザメモリ制約に厳しい
- `qwen-tts` / `qwen-asr` は Python ランタイム前提の実装
- 音声 I/O がファイルシステム依存になりやすい

## 今回入れた対応

WASM 側へ移植しやすいよう、処理境界を JSON / base64 ベースに分離しました。

- 契約定義: [src/main/roundtrip_contract.py](src/main/roundtrip_contract.py)
- Python 実装: [src/main/qwen_roundtrip_processor.py](src/main/qwen_roundtrip_processor.py)
- 従来の CLI ラッパー: [src/main/qwen_tts_asr_roundtrip.py](src/main/qwen_tts_asr_roundtrip.py)

これにより、今後は `RoundTripRequest -> RoundTripResponse` を満たす別実装を作れば、
呼び出し側を大きく変えずに差し替えできます。

## WASM 化の現実的な進め方

### 方式 A: フロントだけ WASM、推論はサーバー

最も現実的です。

- ブラウザ側
  - 音声録音
  - WAV 変換
  - base64 化
  - API 呼び出し
- サーバー側
  - `QwenRoundTripProcessor` を使って TTS + ASR

利点:
- 既存 Python 実装を流用できる
- 品質と速度を維持しやすい

### 方式 B: 推論を ONNX / WebGPU / ORT Web に置き換える

完全ブラウザ実行を目指す場合の本命です。

必要作業:
- Qwen3 TTS / ASR の対応モデルを ONNX などへ変換
- JavaScript / TypeScript 側で推論実装
- 音声前処理 / 後処理を WebAudio に移植
- `RoundTripRequest` / `RoundTripResponse` に合わせた WASM 実装を作成

ただし工数はかなり大きいです。

## 次の実装候補

1. Python 側に HTTP API を追加
2. ブラウザ側の最小デモを作る
3. 将来 `WasmRoundTripProcessor` を追加して差し替え可能にする

## 補足

今回の変更は「即ブラウザで Qwen 推論が動く」状態ではなく、
**WASM 向けに移植しやすい境界へ整理した第一段階**です。
