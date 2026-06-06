from __future__ import annotations

import base64
import tempfile
from pathlib import Path
from typing import Any

import soundfile as sf
import torch

from . import qwen_session
from .roundtrip_contract import RoundTripRequest, RoundTripResponse


class QwenRoundTripProcessor:
    def build_model_load_kwargs(self) -> dict[str, Any]:
        if torch.cuda.is_available():
            return {
                "device_map": "cuda:0",
                "dtype": torch.bfloat16,
            }
        return {}

    def run(self, request: RoundTripRequest) -> RoundTripResponse:
        model_load_kwargs = self.build_model_load_kwargs()
        reference_audio_bytes = base64.b64decode(request.reference_audio_base64)

        with tempfile.TemporaryDirectory(prefix="study_lang_roundtrip_") as tmpdir:
            workdir = Path(tmpdir)
            ref_audio_path = workdir / request.reference_audio_filename
            output_audio_path = workdir / "generated.wav"

            ref_audio_path.write_bytes(reference_audio_bytes)

            tts = qwen_session.get_tts_model(request.tts_model_name, **model_load_kwargs)
            asr = qwen_session.get_asr_model(request.asr_model_name, **model_load_kwargs)

            wavs, sample_rate = tts.generate_voice_clone(
                text=request.text,
                language=request.language,
                ref_audio=str(ref_audio_path),
                x_vector_only_mode=True,
            )
            generated_wav = wavs[0]

            sf.write(output_audio_path, generated_wav, sample_rate)

            transcription = asr.transcribe(
                audio=(generated_wav, sample_rate),
                language=request.language,
            )[0]

            generated_audio_base64 = base64.b64encode(output_audio_path.read_bytes()).decode("ascii")

        return RoundTripResponse(
            input_text=request.text,
            transcribed_text=transcription.text,
            language=transcription.language,
            generated_audio_base64=generated_audio_base64,
            generated_audio_filename="generated.wav",
            tts_model_name=request.tts_model_name,
            asr_model_name=request.asr_model_name,
        )
