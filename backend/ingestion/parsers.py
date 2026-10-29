"""File parsers for the four modalities — operate on in-memory bytes.

Files are stored in MongoDB (local, offline datastore), never on the pod
filesystem, so parsers accept raw bytes and use in-memory streams.

- PDF  : text via PyMuPDF + page-image render for the visual path
- DOCX : text via python-docx
- Image: PIL image for the visual (CLIP) path
- Audio: transcript via faster-whisper, running fully local/offline on CPU
         (falls back to the OpenAI whisper-1 cloud path only if
         STT_PROVIDER=cloud is explicitly set, e.g. for sandbox demos)
"""
import os
import io
import base64
from PIL import Image

from core.config import settings

_whisper_model = None  # lazily loaded, cached across calls so the model
                        # (several hundred MB) is only loaded into memory once


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel

        _whisper_model = WhisperModel(
            settings.WHISPER_MODEL_SIZE,
            device=settings.WHISPER_DEVICE,
            compute_type=settings.WHISPER_COMPUTE_TYPE,
        )
    return _whisper_model

SUPPORTED = {
    ".pdf": "document",
    ".docx": "document",
    ".doc": "document",
    ".png": "image",
    ".jpg": "image",
    ".jpeg": "image",
    ".webp": "image",
    ".wav": "audio",
    ".mp3": "audio",
    ".m4a": "audio",
}


def detect_modality(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    return SUPPORTED.get(ext, "unsupported")


def parse_pdf(data: bytes):
    """Return (full_text, [PIL page images]).
    Includes automatic OCR fallback for scanned or image-based PDF pages.
    """
    import fitz  # PyMuPDF

    text_parts = []
    page_images = []
    doc = fitz.open(stream=data, filetype="pdf")
    for page in doc:
        page_txt = (page.get_text("text") or "").strip()
        pix = page.get_pixmap(matrix=fitz.Matrix(1.3, 1.3))
        img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
        page_images.append(img)

        # Automatic OCR fallback: if page has little or no text (e.g. scanned doc, invoice, image),
        # run OCR on the rendered page image so no data is missed.
        if len(page_txt) < 30:
            try:
                ocr_txt = ocr_image(img).strip()
                if ocr_txt:
                    page_txt = f"{page_txt}\n{ocr_txt}".strip() if page_txt else ocr_txt
            except Exception:
                pass
        text_parts.append(page_txt)
    doc.close()
    return "\n\n".join(tp for tp in text_parts if tp), page_images


def parse_docx(data: bytes) -> str:
    import docx

    d = docx.Document(io.BytesIO(data))
    return "\n".join(p.text for p in d.paragraphs if p.text.strip())


def parse_image(data: bytes):
    return Image.open(io.BytesIO(data)).convert("RGB")


def ocr_image(img) -> str:
    """Extract printed/handwritten text from an image.
    Uses multi-tier offline OCR with fast early-exit:
    1. RapidOCR (PaddleOCR ONNX) — state-of-the-art deep learning OCR (<0.4s).
    2. Native Windows OCR (winocr) — fast Windows-native OCR (<0.3s).
    3. OpenCV QR code / barcode detector.
    4. Tesseract OCR (with fast Otsu thresholding fallback).
    """
    img = img.convert("RGB")
    extracted_texts = []

    # 1. RapidOCR (Deep-learning ONNX OCR — highest accuracy for ID cards, receipts, documents)
    try:
        from rapidocr_onnxruntime import RapidOCR
        import numpy as np
        if not hasattr(ocr_image, "_rapidocr"):
            ocr_image._rapidocr = RapidOCR()
        rapid_res, _ = ocr_image._rapidocr(np.array(img))
        if rapid_res:
            r_lines = [line[1].strip() for line in rapid_res if line and line[1].strip()]
            if r_lines:
                combined_rapid = "\n".join(r_lines)
                if len(combined_rapid) > 20:
                    import re
                    clean = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', combined_rapid)
                    return re.sub(r'[ \t]+', ' ', clean).strip()
                extracted_texts.append(combined_rapid)
    except Exception:
        pass

    # 2. Native Windows Media OCR (instant, offline, built into Windows 10/11)
    try:
        import winocr
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            res_w = pool.submit(winocr.recognize_pil_sync, img, "en").result()
            if res_w and res_w.get("text") and len(res_w["text"].strip()) > 20:
                import re
                clean = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', res_w["text"].strip())
                return re.sub(r'[ \t]+', ' ', clean).strip()
            elif res_w and res_w.get("text"):
                extracted_texts.append(res_w["text"].strip())
    except Exception:
        pass

    # 3. QR / Barcode Data Detection
    try:
        import cv2
        import numpy as np
        arr = np.array(img)
        detector = cv2.QRCodeDetector()
        qr_val, _, _ = detector.detectAndDecode(arr)
        if qr_val and qr_val.strip():
            extracted_texts.append(f"[Embedded QR Code Data: {qr_val.strip()}]")
    except Exception:
        pass

    # 4. Tesseract OCR (with Windows path auto-discovery and fast Otsu thresholding)
    try:
        import pytesseract
        import shutil
        import os
        import numpy as np

        if not shutil.which("tesseract"):
            for candidate in [
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
                os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
            ]:
                if os.path.exists(candidate):
                    pytesseract.pytesseract.tesseract_cmd = candidate
                    break

        t_text = pytesseract.image_to_string(img).strip()
        if t_text and t_text not in extracted_texts:
            extracted_texts.append(t_text)

        # Fast preprocessed Otsu pass (instant <5ms, replaces slow 30s nlMeans filter)
        if not extracted_texts:
            try:
                import cv2
                arr = np.array(img)
                gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
                _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                from PIL import Image as PILImage
                processed = PILImage.fromarray(thresh)
                p_text = pytesseract.image_to_string(processed, config="--psm 6").strip()
                if p_text:
                    extracted_texts.append(p_text)
            except Exception:
                pass
    except Exception:
        pass

    raw = "\n\n".join(t for t in extracted_texts if t.strip()).strip()
    import re
    raw = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', raw)
    raw = re.sub(r'[ \t]+', ' ', raw)
    return raw.strip()


async def caption_image_if_enabled(img, existing_text: str = "") -> str:
    """Real image content analysis via a local vision model (LM Studio or Ollama).
    If OCR already extracted comprehensive text (>35 characters, e.g. ID card, invoice, document),
    returns immediately to ensure sub-second ingestion.
    For non-textual images (photos, charts), requests a concise 2-3 sentence visual summary."""
    if not settings.ENABLE_IMAGE_CAPTIONING:
        return ""
    # If OCR text is already rich and clear, skip expensive vision LLM ingestion delay
    if existing_text and len(existing_text.strip()) > 35:
        return ""

    try:
        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="JPEG", quality=85)
        img_b64 = base64.b64encode(buf.getvalue()).decode("ascii")

        from llm import lm_studio_client, ollama_client
        if settings.LOCAL_LLM_PROVIDER in ("lm_studio", "auto") and await lm_studio_client.is_available():
            try:
                cap = await asyncio.wait_for(lm_studio_client.caption_image(img_b64), timeout=8.0)
                if cap and not (cap.count("?") > 5 and cap.count("?") > len(cap) * 0.2):
                    return cap
            except Exception:
                pass

        if await ollama_client.is_available(settings.OLLAMA_HOST):
            try:
                cap = await asyncio.wait_for(
                    ollama_client.caption_image(img_b64, settings.OLLAMA_HOST, settings.OLLAMA_VISION_MODEL),
                    timeout=8.0,
                )
                if cap and not (cap.count("?") > 5 and cap.count("?") > len(cap) * 0.2):
                    return cap
            except Exception:
                pass
    except Exception:
        return ""
    return ""


async def parse_audio(data: bytes, filename: str) -> str:
    """Entry point used by the ingestion pipeline for the "audio" modality.

    Routes to the fully-offline faster-whisper transcription path by
    default, or the cloud fallback only when STT_PROVIDER=cloud is
    explicitly set.
    """
    if settings.STT_PROVIDER == "cloud":
        return await _parse_audio_cloud(data, filename)
    return await _parse_audio_local(data, filename)


async def _parse_audio_local(data: bytes, filename: str) -> str:
    """Fully offline transcription via faster-whisper (CTranslate2, CPU-friendly)."""
    import asyncio
    import tempfile

    def _transcribe():
        model = _get_whisper_model()
        suffix = os.path.splitext(filename)[1] or ".wav"
        fd, path = tempfile.mkstemp(suffix=suffix)
        try:
            with os.fdopen(fd, "wb") as f:
                f.write(data)
            # beam_size=1 delivers instant latency and low memory footprint on CPU (ideal for 6GB RAM)
            segments, _info = model.transcribe(path, beam_size=1)
            return " ".join(seg.text.strip() for seg in segments)
        finally:
            try:
                os.remove(path)
            except Exception:
                pass

    return await asyncio.to_thread(_transcribe)


async def _parse_audio_cloud(data: bytes, filename: str) -> str:
    """Cloud fallback (OpenAI whisper-1 via Emergent key) — kept only for
    environments without local model access, e.g. this sandbox."""
    from emergentintegrations.llm.openai import OpenAISpeechToText

    stt = OpenAISpeechToText(api_key=settings.EMERGENT_LLM_KEY)
    bio = io.BytesIO(data)
    bio.name = filename
    resp = await stt.transcribe(file=bio, model="whisper-1", response_format="json")
    return resp.text
