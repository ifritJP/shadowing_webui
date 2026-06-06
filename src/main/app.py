from __future__ import annotations

import email
import tempfile
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

from .qwen_tts_asr_roundtrip import DEFAULT_REF_AUDIO, export_mobile_study_bundle


class ApiHandler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        if self.path == '/api/generate-bundle':
            self.handle_generate_bundle()
        else:
            self.send_error(404, "Not Found")

    def handle_generate_bundle(self) -> None:
        content_type = self.headers.get('Content-Type', '')
        if not content_type.startswith('multipart/form-data'):
            self.send_error(400, "Bad Request: Content-Type must be multipart/form-data")
            return

        content_length = int(self.headers.get('Content-Length', 0))
        if content_length <= 0:
            self.send_error(400, "Bad Request: Content-Length must be greater than 0")
            return

        try:
            raw_data = self.rfile.read(content_length)
            msg_bytes = b"Content-Type: " + content_type.encode('utf-8') + b"\r\n\r\n" + raw_data
            msg = email.message_from_bytes(msg_bytes)

            text = ""
            ref_audio_bytes = None
            language = "English"

            for part in msg.walk():
                if part.is_multipart():
                    continue
                disp = part.get('Content-Disposition')
                if disp:
                    params = {}
                    for p in disp.split(';'):
                        if '=' in p:
                            k, v = p.split('=', 1)
                            params[k.strip()] = v.strip().strip('"')
                    
                    name = params.get('name')
                    if name == 'text':
                        text = part.get_payload(decode=True).decode('utf-8', errors='ignore').strip()
                    elif name == 'ref_audio':
                        ref_audio_bytes = part.get_payload(decode=True)
                    elif name == 'language':
                        language = part.get_payload(decode=True).decode('utf-8', errors='ignore').strip()

            if not text:
                self.send_error(400, "Bad Request: 'text' field is required")
                return

            with tempfile.TemporaryDirectory(prefix="study-lang-api-") as temp_dir:
                temp_path = Path(temp_dir)
                
                if ref_audio_bytes:
                    ref_audio_path = temp_path / "uploaded_ref.wav"
                    ref_audio_path.write_bytes(ref_audio_bytes)
                else:
                    ref_audio_path = DEFAULT_REF_AUDIO
                    if not ref_audio_path.exists():
                        self.send_error(500, f"Internal Server Error: Default reference audio not found at {ref_audio_path}")
                        return

                output_bundle_path = temp_path / "study_bundle.zip"
                output_audio_path = temp_path / "generated.wav"

                export_mobile_study_bundle(
                    text=text,
                    ref_audio_path=ref_audio_path,
                    bundle_output_path=output_bundle_path,
                    generated_audio_path=output_audio_path,
                    language=language,
                )

                if not output_bundle_path.exists():
                    self.send_error(500, "Internal Server Error: Failed to generate study bundle ZIP")
                    return

                zip_data = output_bundle_path.read_bytes()

            self.send_response(200)
            self.send_header('Content-Type', 'application/zip')
            self.send_header('Content-Disposition', 'attachment; filename="study_bundle.zip"')
            self.send_header('Content-Length', str(len(zip_data)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(zip_data)

        except Exception as e:
            self.send_error(500, f"Internal Server Error: {str(e)}")


def run(port: int = 8000) -> None:
    server_address = ('', port)
    httpd = HTTPServer(server_address, ApiHandler)
    print(f"Starting Python API server on port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
        print("Server stopped.")


def main() -> int:
    run()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
