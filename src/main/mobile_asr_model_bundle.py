from __future__ import annotations

import argparse
import json
import tempfile
import zipfile
from datetime import UTC, datetime
from pathlib import Path

from huggingface_hub import list_repo_files, snapshot_download

#DEFAULT_MODEL_ID = "onnx-community/whisper-base.en"
#DEFAULT_MODEL_ID = "onnx-community/whisper-tiny.en"
#DEFAULT_MODEL_ID = "onnx-community/whisper-tiny"
DEFAULT_MODEL_ID = "onnx-community/whisper-base"
DEFAULT_DTYPE = "q8"
DEFAULT_DEVICE = "webgpu"
DEFAULT_VARIANT = f"{DEFAULT_DEVICE}:{DEFAULT_DTYPE}"

CORE_MODEL_FILES = [
    "added_tokens.json",
    "config.json",
    "generation_config.json",
    "merges.txt",
    "normalizer.json",
    "preprocessor_config.json",
    "quantize_config.json",
    "special_tokens_map.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "vocab.json",
]

DTYPE_SUFFIX_MAP = {
    "fp32": "",
    "fp16": "_fp16",
    "q8": "_quantized",
    "q4": "_q4",
    "int8": "_int8",
    "uint8": "_uint8",
    "bnb4": "_bnb4",
}

MODEL_FILE_GROUPS = [
    ["onnx/encoder_model{suffix}.onnx", "onnx/decoder_model_merged{suffix}.onnx"],
    [
        "onnx/encoder_model{suffix}.onnx",
        "onnx/decoder_model{suffix}.onnx",
        "onnx/decoder_with_past_model{suffix}.onnx",
    ],
]


def resolve_bundle_file_list(model_id: str, dtype: str) -> list[str]:
    if dtype not in DTYPE_SUFFIX_MAP:
        supported = ", ".join(sorted(DTYPE_SUFFIX_MAP))
        raise ValueError(f"Unsupported dtype '{dtype}'. Supported values: {supported}")

    repo_files = set(list_repo_files(model_id))
    suffix = DTYPE_SUFFIX_MAP[dtype]

    selected_files = [path for path in CORE_MODEL_FILES if path in repo_files]

    for group in MODEL_FILE_GROUPS:
        resolved = [pattern.format(suffix=suffix) for pattern in group]
        if all(path in repo_files for path in resolved):
            selected_files.extend(resolved)
            return selected_files

    available_onnx = sorted(path for path in repo_files if path.startswith("onnx/"))
    raise ValueError(
        "Could not resolve a compatible ONNX file set for the requested dtype. "
        f"model_id={model_id!r}, dtype={dtype!r}, available_onnx={available_onnx}"
    )


def parse_variant(value: str) -> tuple[str, str]:
    try:
        preferred_device, dtype = value.split(":", 1)
    except ValueError as exc:
        raise ValueError(
            f"Invalid variant '{value}'. Use '<device>:<dtype>', for example 'webgpu:fp16'."
        ) from exc

    preferred_device = preferred_device.strip()
    dtype = dtype.strip()

    if preferred_device not in {"webgpu", "wasm"}:
        raise ValueError(
            f"Unsupported device '{preferred_device}' in variant '{value}'. Use 'webgpu' or 'wasm'."
        )
    if dtype not in DTYPE_SUFFIX_MAP:
        supported = ", ".join(sorted(DTYPE_SUFFIX_MAP))
        raise ValueError(
            f"Unsupported dtype '{dtype}' in variant '{value}'. Supported values: {supported}"
        )

    return preferred_device, dtype


def resolve_bundle_variants(model_id: str, variants: list[tuple[str, str]]) -> list[dict[str, object]]:
    resolved_variants: list[dict[str, object]] = []
    seen: set[tuple[str, str]] = set()

    for preferred_device, dtype in variants:
        key = (preferred_device, dtype)
        if key in seen:
            continue
        seen.add(key)
        resolved_variants.append(
            {
                "preferred_device": preferred_device,
                "dtype": dtype,
                "files": resolve_bundle_file_list(model_id, dtype),
            }
        )

    return resolved_variants


def build_mobile_asr_model_bundle(
    *,
    model_id: str,
    output_path: str | Path,
    dtype: str = DEFAULT_DTYPE,
    preferred_device: str = DEFAULT_DEVICE,
    variants: list[tuple[str, str]] | None = None,
) -> Path:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    selected_variants = variants or [(preferred_device, dtype)]
    resolved_variants = resolve_bundle_variants(model_id, selected_variants)
    default_variant = resolved_variants[0]
    files = sorted({path for variant in resolved_variants for path in variant["files"]})

    with tempfile.TemporaryDirectory(prefix="study-lang-asr-model-") as temp_dir:
        temp_root = Path(temp_dir)
        model_root = temp_root / model_id
        snapshot_download(
            repo_id=model_id,
            local_dir=model_root,
            local_dir_use_symlinks=False,
            allow_patterns=files,
        )

        manifest = {
            "format": "study-lang-mobile-asr-model-bundle/v1",
            "engine": "transformers.js",
            "task": "automatic-speech-recognition",
            "model_id": model_id,
            "dtype": default_variant["dtype"],
            "preferred_device": default_variant["preferred_device"],
            "default_variant": {
                "preferred_device": default_variant["preferred_device"],
                "dtype": default_variant["dtype"],
            },
            "variants": resolved_variants,
            "generated_at": datetime.now(UTC).isoformat(),
            "files": files,
        }

        with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.writestr(
                "manifest.json",
                json.dumps(manifest, ensure_ascii=False, indent=2),
            )
            for relative_path in files:
                archive.write(model_root / relative_path, arcname=relative_path)

    return output_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download and package a local browser ASR model bundle for study-lang mobile.",
    )
    parser.add_argument(
        "--model-id",
        default=DEFAULT_MODEL_ID,
        help=f"Hugging Face model id to package (default: {DEFAULT_MODEL_ID})",
    )
    parser.add_argument(
        "--output",
        default=".local/mobile_asr_model_bundle.zip",
        help="ZIP output path for the packaged browser model bundle.",
    )
    parser.add_argument(
        "--dtype",
        default=DEFAULT_DTYPE,
        help=f"Suggested dtype metadata for the browser loader (default: {DEFAULT_DTYPE})",
    )
    parser.add_argument(
        "--preferred-device",
        default=DEFAULT_DEVICE,
        choices=["webgpu", "wasm"],
        help=f"Suggested browser backend metadata (default: {DEFAULT_DEVICE})",
    )
    parser.add_argument(
        "--variant",
        action="append",
        default=[],
        help=(
            "Bundle an additional runtime combination in the form '<device>:<dtype>'. "
            "Example: --variant webgpu:fp16 --variant wasm:q8"
        ),
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    variants = [parse_variant(value) for value in args.variant]
    output_path = build_mobile_asr_model_bundle(
        model_id=args.model_id,
        output_path=args.output,
        dtype=args.dtype,
        preferred_device=args.preferred_device,
        variants=variants or None,
    )
    print(output_path)
    return 0

def test():
    return build_mobile_asr_model_bundle(
        model_id=DEFAULT_MODEL_ID,
        output_path="mobile_asr_model_bundle_wasm_uint8_base.zip",
        variants=[parse_variant(value) for value in ["wasm:uint8"] ]
    )


if __name__ == "__main__":
    raise SystemExit(main())
