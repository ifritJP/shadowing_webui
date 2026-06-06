from __future__ import annotations

from typing import Any

from qwen_asr import Qwen3ASRModel
from qwen_tts import Qwen3TTSModel, Qwen3TTSTokenizer

from . import dev_cache

_QWEN_NAMESPACE = "qwen"


def get_asr_model(model_name: str, *, force_reload: bool = False, **kwargs: Any) -> Qwen3ASRModel:
    return dev_cache.get_or_create(
        _QWEN_NAMESPACE,
        "Qwen3ASRModel.from_pretrained",
        Qwen3ASRModel.from_pretrained,
        model_name,
        force_reload=force_reload,
        **kwargs,
    )


def get_tts_model(model_name: str, *, force_reload: bool = False, **kwargs: Any) -> Qwen3TTSModel:
    return dev_cache.get_or_create(
        _QWEN_NAMESPACE,
        "Qwen3TTSModel.from_pretrained",
        Qwen3TTSModel.from_pretrained,
        model_name,
        force_reload=force_reload,
        **kwargs,
    )


def get_tts_tokenizer(
    model_name: str,
    *,
    force_reload: bool = False,
    **kwargs: Any,
) -> Qwen3TTSTokenizer:
    return dev_cache.get_or_create(
        _QWEN_NAMESPACE,
        "Qwen3TTSTokenizer.from_pretrained",
        Qwen3TTSTokenizer.from_pretrained,
        model_name,
        force_reload=force_reload,
        **kwargs,
    )


def list_cached_models() -> list[tuple[str, str, Any, Any]]:
    return dev_cache.list_keys(namespace=_QWEN_NAMESPACE)


def clear_model_cache() -> int:
    return dev_cache.clear(namespace=_QWEN_NAMESPACE)
