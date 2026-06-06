from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from .qwen_pc_processors import QwenPcAsrProcessor, QwenPcTtsProcessor
from .study_bundle import build_manifest, write_study_bundle

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REF_AUDIO = PROJECT_ROOT / ".local" / "00_short_clip.wav"
DEFAULT_OUTPUT_AUDIO = PROJECT_ROOT / "qwen3tts_roundtrip.wav"
DEFAULT_BUNDLE_OUTPUT = PROJECT_ROOT / "mobile_study_bundle.zip"
DEFAULT_TTS_MODEL = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"
DEFAULT_ASR_MODEL = "Qwen/Qwen3-ASR-1.7B"
#DEFAULT_TEXT = "This is a sample sentence for English voice-clone playback and ASR practice."
DEFAULT_TEXT = """
Okay, let's finalize the plan. I'm quitting the soccer team after this season because my knee injury is getting worse. The doctor said no more high-impact sports for at least six months. So, what next?
I was thinking about joining the robotics club, but wait... they only meet on Wednesdays from 4:00 to 6:30 PM. That conflicts with my part-time job at the library which starts at 4:15 PM. I can't make it.
Hmm... maybe the coding workshop instead? It's open to everyone, meets every Tuesday evening after school, and costs only 500 yen per session. Plus, it helps me improve my English since the instructor speaks mostly in Japanese but uses lots of technical terms.
Okay, that works. I'll sign up for the coding workshop starting next week. Let's do this!
"""
DEFAULT_LANGUAGE = "English"


def synthesize_and_transcribe(
    text: str,
    ref_audio_path: Path | str,
    output_audio_path: Path | str,
    tts_model_name: str = DEFAULT_TTS_MODEL,
    asr_model_name: str = DEFAULT_ASR_MODEL,
    language: str = DEFAULT_LANGUAGE,
) -> dict[str, Any]:
    ref_audio_path = Path(ref_audio_path)
    output_audio_path = Path(output_audio_path)

    tts_processor = QwenPcTtsProcessor()
    asr_processor = QwenPcAsrProcessor()

    generated_audio_path = tts_processor.generate_clone_audio(
        text=text,
        ref_audio_path=ref_audio_path,
        output_audio_path=output_audio_path,
        tts_model_name=tts_model_name,
        language=language,
    )
    transcription = asr_processor.transcribe_audio(
        audio=generated_audio_path,
        asr_model_name=asr_model_name,
        language=language,
    )

    return {
        "reference_audio": str(ref_audio_path),
        "generated_audio": str(generated_audio_path),
        "tts_model": tts_model_name,
        "asr_model": asr_model_name,
        "language": transcription["language"],
        "input_text": text,
        "transcribed_text": transcription["transcribed_text"],
    }


def export_mobile_study_bundle(
    text: str,
    ref_audio_path: Path | str,
    bundle_output_path: Path | str,
    generated_audio_path: Path | str = DEFAULT_OUTPUT_AUDIO,
    tts_model_name: str = DEFAULT_TTS_MODEL,
    language: str = DEFAULT_LANGUAGE,
) -> dict[str, str]:
    generated_audio_path = Path(generated_audio_path)
    bundle_output_path = Path(bundle_output_path)

    tts_processor = QwenPcTtsProcessor()
    generated_audio_path = tts_processor.generate_clone_audio(
        text=text,
        ref_audio_path=ref_audio_path,
        output_audio_path=generated_audio_path,
        tts_model_name=tts_model_name,
        language=language,
    )

    manifest = build_manifest(
        source_text=text,
        language=language,
        generated_audio_filename=generated_audio_path.name,
        tts_model_name=tts_model_name,
    )
    write_study_bundle(
        bundle_output_path,
        manifest=manifest,
        audio_bytes=generated_audio_path.read_bytes(),
    )

    return {
        "bundle_path": str(bundle_output_path),
        "generated_audio": str(generated_audio_path),
        "source_text": text,
        "language": language,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate TTS audio from a reference clip with Qwen3-TTS, then transcribe it with Qwen3-ASR.",
    )
    parser.add_argument("--text", default=DEFAULT_TEXT, help="Text to synthesize.")
    parser.add_argument(
        "--ref-audio",
        type=Path,
        default=DEFAULT_REF_AUDIO,
        help="Reference audio file for voice cloning.",
    )
    parser.add_argument(
        "--output-audio",
        type=Path,
        default=DEFAULT_OUTPUT_AUDIO,
        help="Path to save the generated waveform.",
    )
    parser.add_argument(
        "--tts-model",
        default=DEFAULT_TTS_MODEL,
        help="Qwen3-TTS base model name or local path.",
    )
    parser.add_argument(
        "--asr-model",
        default=DEFAULT_ASR_MODEL,
        help="Qwen3-ASR model name or local path.",
    )
    parser.add_argument(
        "--language",
        default=DEFAULT_LANGUAGE,
        help="Language label passed to both TTS and ASR.",
    )
    parser.add_argument(
        "--bundle-output",
        type=Path,
        default=None,
        help="Optional zip path for the mobile browser upload bundle.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = synthesize_and_transcribe(
        text=args.text,
        ref_audio_path=args.ref_audio,
        output_audio_path=args.output_audio,
        tts_model_name=args.tts_model,
        asr_model_name=args.asr_model,
        language=args.language,
    )

    if args.bundle_output is not None:
        result["mobile_bundle"] = export_mobile_study_bundle(
            text=args.text,
            ref_audio_path=args.ref_audio,
            bundle_output_path=args.bundle_output,
            generated_audio_path=args.output_audio,
            tts_model_name=args.tts_model,
            language=args.language,
        )["bundle_path"]

    print(json.dumps(result, ensure_ascii=False, indent=2))


def test():
    return synthesize_and_transcribe(DEFAULT_TEXT, DEFAULT_REF_AUDIO, "output.wav")


def build_mobile_bundle_test():
    return export_mobile_study_bundle(
        DEFAULT_TEXT,
        DEFAULT_REF_AUDIO,
        DEFAULT_BUNDLE_OUTPUT,
        DEFAULT_OUTPUT_AUDIO,
    )


def hoge():
    print("hoge")


if __name__ == "__main__":
    main()
