from __future__ import annotations

from . import qwen_session


def get_asr_model(*args, **kwargs):
    return qwen_session.get_asr_model(*args, **kwargs)


def get_tts_model(*args, **kwargs):
    return qwen_session.get_tts_model(*args, **kwargs)


def get_tts_tokenizer(*args, **kwargs):
    return qwen_session.get_tts_tokenizer(*args, **kwargs)


def list_cached_models():
    return qwen_session.list_cached_models()


def clear_model_cache():
    return qwen_session.clear_model_cache()


def _enable_autoreload() -> None:
    try:
        from IPython import get_ipython
    except ImportError:
        return

    shell = get_ipython()
    if shell is None:
        return

    try:
        shell.run_line_magic("load_ext", "autoreload")
    except Exception:
        pass

    try:
        shell.run_line_magic("autoreload", "2")
    except Exception:
        pass


def help_dev_shell() -> None:
    print(
        """
[study-lang dev shell]

Available helpers:
  - get_asr_model(model_name, **kwargs)
  - get_tts_model(model_name, **kwargs)
  - get_tts_tokenizer(model_name, **kwargs)
  - list_cached_models()
  - clear_model_cache()

Examples:
  asr = get_asr_model("Qwen/Qwen3-ASR-4B", device_map="cuda:0")
  tts = get_tts_model("Qwen/Qwen3-TTS-4B", device_map="cuda:0")
  list_cached_models()
  clear_model_cache()

Notes:
  - Same arguments reuse the already loaded model in the current IPython session.
  - Pass force_reload=True if you want to recreate the model.
  - %autoreload 2 is enabled automatically when possible.
""".strip()
    )


_enable_autoreload()
help_dev_shell()
