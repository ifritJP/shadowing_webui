## 開発時の IPython モデルキャッシュ

Qwen 系モデルのロードを毎回やり直さないように、開発用の IPython シェルを追加しました。

### 初回セットアップ

```bash
uv sync --group dev
```

### 起動

```bash
uv run --group dev ipython -i src/main/dev_shell.py
```

プロジェクト専用の初期化も追加してあるので、毎回 `-i` を付けたくない場合は以下でも起動できます。

```bash
IPYTHONDIR=$PWD/.ipython uv run --group dev ipython
```

この起動方法では [/.ipython/profile_default/startup/00-study-lang.py](.ipython/profile_default/startup/00-study-lang.py) が読み込まれ、
`src/main/dev_shell.py` と同じヘルパーが自動で入ります。

起動後は以下のヘルパーが使えます。

- `get_asr_model(model_name, **kwargs)`
- `get_tts_model(model_name, **kwargs)`
- `get_tts_tokenizer(model_name, **kwargs)`
- `list_cached_models()`
- `clear_model_cache()`

例:

```python
asr = get_asr_model(
	"Qwen/Qwen3-ASR-4B",
	device_map="cuda:0",
)

# 同じ引数なら 2 回目以降は再ロードされません
asr_again = get_asr_model(
	"Qwen/Qwen3-ASR-4B",
	device_map="cuda:0",
)

# モデルを入れ直したい時
asr = get_asr_model(
	"Qwen/Qwen3-ASR-4B",
	device_map="cuda:0",
	force_reload=True,
)
```

`%autoreload 2` も自動で有効化されるので、アプリ側コードを編集しながらモデルだけは生かしたまま試せます。

注意:

- キャッシュは同じ IPython セッションの間だけ有効です。
- キャッシュキーには `model_name` と `kwargs` が使われます。
- モデルを完全に解放したい時は `clear_model_cache()` を呼んでからセッションを終了してください。

## PC / モバイル分離ワークフロー

- クローン音声生成は PC 側で実行
- ASR は PC / モバイルで別実装
- モバイル側には「生成済み音声 + 元テキスト」を ZIP で持ち込み、ブラウザにアップロードして使う前提です
- モバイル側は、`SpeechRecognition` とローカル OSS ASR モデル ZIP の両方を切り替えられます

詳細は [docs/mobile-browser-workflow.md](docs/mobile-browser-workflow.md) を参照してください。

## ソース配置

- Python / PC 側: [src/main](src/main)
- モバイル ASR フロントエンド: [src/mobile](src/mobile)

低レベルの `onnxruntime-web/webgpu` 確認用に、[src/mobile/ort-webgpu-diagnostic.html](src/mobile/ort-webgpu-diagnostic.html) も追加してあります。
