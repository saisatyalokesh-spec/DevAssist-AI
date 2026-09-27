"""
Screenshot OCR extraction.

This is your "FAST IMAGE OCR" notebook cell, made server-safe:
  * the hardcoded Windows tesseract.exe path is replaced with an
    environment variable (TESSERACT_CMD) that only gets set if provided —
    on Linux/macOS, pytesseract finds `tesseract` on PATH automatically.
  * works on in-memory bytes (an uploaded file) as well as a path on disk,
    since the notebook version only supported a file path via the CLI.
  * if pytesseract / the tesseract binary isn't installed, this fails with
    a clear, catchable error instead of crashing the whole API — the route
    that calls this tells the user OCR isn't available rather than 500ing.
"""

from __future__ import annotations

import io
import os
import time

from PIL import Image, ImageOps

MAX_OCR_WIDTH = 1280

_tess_cmd = os.environ.get("TESSERACT_CMD")
_OCR_IMPORT_ERROR: Exception | None = None

try:
    import pytesseract

    if _tess_cmd:
        pytesseract.pytesseract.tesseract_cmd = _tess_cmd
    OCR_AVAILABLE = True
except ImportError as exc:  # pragma: no cover - environment dependent
    OCR_AVAILABLE = False
    _OCR_IMPORT_ERROR = exc


class OcrUnavailableError(RuntimeError):
    pass


def _prepare_image(image: Image.Image) -> tuple[Image.Image, tuple[int, int]]:
    """Resize and simplify the screenshot before OCR (unchanged from notebook)."""
    image = image.convert("RGB")
    original_size = image.size

    if image.width > MAX_OCR_WIDTH:
        new_width = MAX_OCR_WIDTH
        new_height = int(image.height * new_width / image.width)
        image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

    image = ImageOps.grayscale(image)
    image = ImageOps.autocontrast(image)
    return image, original_size


def extract_text_from_bytes(image_bytes: bytes) -> dict:
    """Run OCR on an uploaded image's raw bytes. Returns text + timing/size info."""
    if not OCR_AVAILABLE:
        raise OcrUnavailableError(
            "OCR is not available on this server. Install Tesseract OCR "
            "(https://github.com/tesseract-ocr/tesseract) and the pytesseract "
            "package, then restart the backend. "
            f"(import error: {_OCR_IMPORT_ERROR})"
        )

    start = time.perf_counter()
    raw_image = Image.open(io.BytesIO(image_bytes))
    image, original_size = _prepare_image(raw_image)

    text = pytesseract.image_to_string(image, config="--oem 3 --psm 6").strip()
    elapsed = time.perf_counter() - start

    return {
        "text": text,
        "original_size": {"width": original_size[0], "height": original_size[1]},
        "ocr_size": {"width": image.width, "height": image.height},
        "elapsed_seconds": round(elapsed, 2),
    }


def extract_error_fields(ocr_text: str) -> dict:
    """
    Best-effort structured extraction from raw OCR text, for the
    'Extracted Context' UI shown in spec section 21 (endpoint / error code).
    This is a light heuristic pass, not a model — good enough to populate the
    UI fields; the full text is always still passed into the RAG pipeline.
    """
    import re

    endpoint_match = re.search(r"(?:GET|POST|PUT|PATCH|DELETE)\s+(/\S+)", ocr_text)
    status_match = re.search(r"\b(\d{3})\b\s*(Unauthorized|Forbidden|Not Found|"
                              r"Bad Request|Internal Server Error|Timeout|Too Many Requests)?", ocr_text)
    error_code_match = re.search(r'"error"\s*:\s*"([^"]+)"', ocr_text)

    return {
        "endpoint": endpoint_match.group(1) if endpoint_match else None,
        "status_line": status_match.group(0).strip() if status_match else None,
        "error_code": error_code_match.group(1) if error_code_match else None,
    }
