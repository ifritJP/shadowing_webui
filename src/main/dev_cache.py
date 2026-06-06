from __future__ import annotations

import builtins
from collections.abc import Callable, Mapping, Sequence
from typing import Any, TypeVar

T = TypeVar("T")
_CACHE_ATTR = "_study_lang_ipython_cache"


CacheKey = tuple[str, str, Any, Any]
CacheStore = dict[CacheKey, Any]


def _get_store() -> CacheStore:
    store = getattr(builtins, _CACHE_ATTR, None)
    if store is None:
        store = {}
        setattr(builtins, _CACHE_ATTR, store)
    return store


def _freeze(value: Any) -> Any:
    if isinstance(value, (str, int, float, bool, bytes, type(None))):
        return value

    if isinstance(value, Mapping):
        items = [(_freeze(key), _freeze(item)) for key, item in value.items()]
        return ("dict", tuple(sorted(items, key=repr)))

    if isinstance(value, tuple):
        return ("tuple", tuple(_freeze(item) for item in value))

    if isinstance(value, list):
        return ("list", tuple(_freeze(item) for item in value))

    if isinstance(value, set):
        return ("set", tuple(sorted((_freeze(item) for item in value), key=repr)))

    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return ("sequence", tuple(_freeze(item) for item in value))

    if hasattr(value, "__fspath__"):
        return ("path", str(value))

    module_name = getattr(value, "__module__", None)
    qualname = getattr(value, "__qualname__", None)
    if module_name and qualname:
        return ("symbol", module_name, qualname, repr(value))

    return ("repr", repr(value))


def _make_key(namespace: str, loader_name: str, args: tuple[Any, ...], kwargs: dict[str, Any]) -> CacheKey:
    return (namespace, loader_name, _freeze(args), _freeze(kwargs))


def get_or_create(
    namespace: str,
    loader_name: str,
    factory: Callable[..., T],
    *args: Any,
    force_reload: bool = False,
    **kwargs: Any,
) -> T:
    store = _get_store()
    key = _make_key(namespace=namespace, loader_name=loader_name, args=args, kwargs=kwargs)

    if force_reload or key not in store:
        store[key] = factory(*args, **kwargs)

    return store[key]


def list_keys(namespace: str | None = None) -> list[CacheKey]:
    store = _get_store()
    keys = list(store.keys())
    if namespace is None:
        return keys
    return [key for key in keys if key[0] == namespace]


def clear(namespace: str | None = None) -> int:
    store = _get_store()

    if namespace is None:
        size = len(store)
        store.clear()
        return size

    targets = [key for key in store if key[0] == namespace]
    for key in targets:
        del store[key]
    return len(targets)
