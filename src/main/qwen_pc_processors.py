from __future__ import annotations

from pathlib import Path
from typing import Any

import soundfile as sf
import torch

from . import qwen_session


class QwenPcBaseProcessor:
    def build_model_load_kwargs(self) -> dict[str, Any]:
        if torch.cuda.is_available():
            return {
                "device_map": "cuda:0",
                "dtype": torch.bfloat16,
            }
        return {}


class QwenPcTtsProcessor(QwenPcBaseProcessor):
    def generate_clone_audio(
        self,
        *,
        text: str,
        ref_audio_path: Path | str,
        output_audio_path: Path | str,
        tts_model_name: str,
        language: str,
    ) -> Path:
        ref_audio_path = Path(ref_audio_path)
        output_audio_path = Path(output_audio_path)

        if not ref_audio_path.exists():
            raise FileNotFoundError(f"Reference audio was not found: {ref_audio_path}")

        model_load_kwargs = self.build_model_load_kwargs()
        tts = qwen_session.get_tts_model(tts_model_name, **model_load_kwargs)

        wavs, sample_rate = tts.generate_voice_clone(
            text=text,
            language=language,
            ref_audio=str(ref_audio_path),
            x_vector_only_mode=True,
        )

        output_audio_path.parent.mkdir(parents=True, exist_ok=True)
        sf.write(output_audio_path, wavs[0], sample_rate)
        return output_audio_path


class QwenPcAsrProcessor(QwenPcBaseProcessor):
    def transcribe_audio(
        self,
        *,
        audio: Path | str | tuple[Any, int],
        asr_model_name: str,
        language: str,
    ) -> dict[str, str]:
        model_load_kwargs = self.build_model_load_kwargs()
        asr = qwen_session.get_asr_model(asr_model_name, **model_load_kwargs)
        transcription = asr.transcribe(audio=audio, language=language)[0]
        return {
            "language": transcription.language,
            "transcribed_text": transcription.text,
        }
