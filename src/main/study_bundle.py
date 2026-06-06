from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


@dataclass(slots=True)
class StudyBundleManifest:
    source_text: str
    language: str
    generated_audio_filename: str
    tts_model_name: str
    created_at: str
    schema_version: int = 1

    def to_dict(self) -> dict[str, str | int]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, str | int]) -> "StudyBundleManifest":
        return cls(
            source_text=str(data["source_text"]),
            language=str(data["language"]),
            generated_audio_filename=str(data["generated_audio_filename"]),
            tts_model_name=str(data["tts_model_name"]),
            created_at=str(data["created_at"]),
            schema_version=int(data.get("schema_version", 1)),
        )


MANIFEST_FILENAME = "manifest.json"


def build_manifest(
    *,
    source_text: str,
    language: str,
    generated_audio_filename: str,
    tts_model_name: str,
) -> StudyBundleManifest:
    return StudyBundleManifest(
        source_text=source_text,
        language=language,
        generated_audio_filename=generated_audio_filename,
        tts_model_name=tts_model_name,
        created_at=datetime.now(UTC).isoformat(),
    )


def write_study_bundle(
    bundle_path: Path | str,
    *,
    manifest: StudyBundleManifest,
    audio_bytes: bytes,
) -> Path:
    bundle_path = Path(bundle_path)
    bundle_path.parent.mkdir(parents=True, exist_ok=True)

    with ZipFile(bundle_path, mode="w", compression=ZIP_DEFLATED) as zf:
        zf.writestr(MANIFEST_FILENAME, json.dumps(manifest.to_dict(), ensure_ascii=False, indent=2))
        zf.writestr(manifest.generated_audio_filename, audio_bytes)

    return bundle_path


def read_study_bundle(bundle_path: Path | str) -> tuple[StudyBundleManifest, bytes]:
    bundle_path = Path(bundle_path)

    with ZipFile(bundle_path, mode="r") as zf:
        manifest = StudyBundleManifest.from_dict(json.loads(zf.read(MANIFEST_FILENAME).decode("utf-8")))
        audio_bytes = zf.read(manifest.generated_audio_filename)

    return manifest, audio_bytes
