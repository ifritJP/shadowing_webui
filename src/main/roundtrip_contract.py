from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(slots=True)
class RoundTripRequest:
    text: str
    reference_audio_base64: str
    reference_audio_filename: str = "reference.wav"
    language: str = "Japanese"
    tts_model_name: str = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"
    asr_model_name: str = "Qwen/Qwen3-ASR-1.7B"

    def to_dict(self) -> dict[str, str]:
        return asdict(self)


@dataclass(slots=True)
class RoundTripResponse:
    input_text: str
    transcribed_text: str
    language: str
    generated_audio_base64: str
    generated_audio_filename: str
    tts_model_name: str
    asr_model_name: str

    def to_dict(self) -> dict[str, str]:
        return asdict(self)
