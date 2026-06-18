"""
Passport / document OCR microservice (PyTorch + Transformers TrOCR).

Install: pip install -r server/requirements-ocr.txt
Run:     python server/ocr_server.py

Listens on http://localhost:3002
  GET  /health  — dependency + model status
  POST /scan    — JSON { "imageBase64": "<data-url or raw base64>" }
"""

from __future__ import annotations

import base64
import json
import re
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from io import BytesIO
from typing import Any

PORT = 3002
MODEL_ID = "microsoft/trocr-base-printed"

_processor = None
_model = None
_load_error: str | None = None


def _load_model() -> tuple[Any, Any]:
    global _processor, _model, _load_error
    if _processor is not None and _model is not None:
        return _processor, _model
    if _load_error:
        raise RuntimeError(_load_error)
    try:
        import torch
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel

        _processor = TrOCRProcessor.from_pretrained(MODEL_ID)
        _model = VisionEncoderDecoderModel.from_pretrained(MODEL_ID)
        _model.eval()
        if torch.cuda.is_available():
            _model = _model.to("cuda")
        return _processor, _model
    except Exception as exc:  # noqa: BLE001
        _load_error = str(exc)
        raise


def _decode_image(image_b64: str):
    from PIL import Image

    raw = image_b64.strip()
    if "," in raw:
        raw = raw.split(",", 1)[1]
    data = base64.b64decode(raw)
    return Image.open(BytesIO(data)).convert("RGB")


def _parse_passport_fields(text: str) -> dict[str, str]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    mrz_lines = [
        ln.upper().replace(" ", "")
        for ln in lines
        if len(ln) >= 30 and "<" in ln
    ]

    fields = {
        "firstName": "",
        "lastName": "",
        "passportNumber": "",
        "nationality": "",
        "dateOfBirth": "",
        "expiryDate": "",
        "gender": "",
    }

    if len(mrz_lines) >= 2:
        mrz1 = re.sub(r"[^A-Z0-9<]", "", mrz_lines[-2]).ljust(44, "<")[:44]
        mrz2 = re.sub(r"[^A-Z0-9<]", "", mrz_lines[-1]).ljust(44, "<")[:44]
        if len(mrz1) >= 44:
            fields["nationality"] = mrz1[2:5].replace("<", "")
            name_field = mrz1[5:]
            if "<<" in name_field:
                last, first = name_field.split("<<", 1)
                fields["lastName"] = last.replace("<", " ").strip()
                fields["firstName"] = first.replace("<", " ").strip().split(" ")[0]
        if len(mrz2) >= 44:
            fields["passportNumber"] = mrz2[0:9].replace("<", "")
            fields["gender"] = "Male" if mrz2[20:21] == "M" else "Female" if mrz2[20:21] == "F" else ""

    if not fields["passportNumber"]:
        m = re.search(r"\b([A-Z]{1,2}[0-9]{6,8})\b", text.upper())
        if m:
            fields["passportNumber"] = m.group(1)

    return fields


def scan_image(image_b64: str) -> dict[str, Any]:
    import torch

    processor, model = _load_model()
    image = _decode_image(image_b64)
    pixel_values = processor(images=image, return_tensors="pt").pixel_values
    if next(model.parameters()).is_cuda:
        pixel_values = pixel_values.to("cuda")

    with torch.no_grad():
        generated_ids = model.generate(pixel_values)

    raw_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    parsed = _parse_passport_fields(raw_text)
    return {
        "ok": True,
        "engine": "trocr",
        "model": MODEL_ID,
        "rawText": raw_text,
        "parsed": parsed,
    }


def health_payload() -> dict[str, Any]:
    payload: dict[str, Any] = {"ok": True, "port": PORT, "model": MODEL_ID}
    try:
        import torch
        from PIL import Image  # noqa: F401
        import transformers

        payload["torch"] = torch.__version__
        payload["transformers"] = transformers.__version__
        payload["cuda"] = torch.cuda.is_available()
    except ImportError as exc:
        return {"ok": False, "error": f"Missing dependency: {exc}"}

    try:
        _load_model()
        payload["modelLoaded"] = True
    except Exception as exc:  # noqa: BLE001
        payload["modelLoaded"] = False
        payload["modelError"] = str(exc)

    return payload


class OcrHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, body: dict[str, Any]) -> None:
        data = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._send_json(200, health_payload())
            return
        self._send_json(404, {"ok": False, "error": "Not found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/scan":
            self._send_json(404, {"ok": False, "error": "Not found"})
            return
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(body.decode("utf-8"))
            image_b64 = str(payload.get("imageBase64", ""))
            if not image_b64:
                self._send_json(400, {"ok": False, "error": "imageBase64 is required"})
                return
            result = scan_image(image_b64)
            self._send_json(200, result)
        except Exception as exc:  # noqa: BLE001
            self._send_json(500, {"ok": False, "error": str(exc)})

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stdout.write("[ocr] " + (fmt % args) + "\n")


def main() -> None:
    server = HTTPServer(("127.0.0.1", PORT), OcrHandler)
    print(f"[ocr] ML OCR service on http://127.0.0.1:{PORT}")
    print(f"[ocr] Model: {MODEL_ID} (downloads on first scan)")
    server.serve_forever()


if __name__ == "__main__":
    main()
