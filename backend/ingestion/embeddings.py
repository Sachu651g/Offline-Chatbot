"""Dual-modality embeddings with offline local snapshot caching.

Text path : SentenceTransformers `all-MiniLM-L6-v2` (384-d).
Visual path: CLIP `clip-ViT-B-32` (512-d).
"""
import asyncio
import os
from pathlib import Path
import torch  # Pre-initialize C++ runtime DLLs (c10.dll) on the main thread to prevent WinError 1114 in worker threads
from core.config import settings

_text_model = None
_clip_model = None


def _resolve_local_model_path(model_name: str) -> str:
    """Find direct local HuggingFace cache directory to guarantee 0-latency offline loading without network DNS checks."""
    p = Path(model_name)
    if p.exists():
        return str(p)

    hub_dir = Path(os.environ.get("USERPROFILE", "")) / ".cache" / "huggingface" / "hub"
    candidates = [
        hub_dir / f"models--{model_name.replace('/', '--')}" / "snapshots",
        hub_dir / f"models--sentence-transformers--{model_name}" / "snapshots",
    ]
    for c in candidates:
        if c.exists():
            snaps = list(c.glob("*"))
            if snaps:
                return str(snaps[0])
    return model_name


def _load_text():
    global _text_model
    if _text_model is None:
        from sentence_transformers import SentenceTransformer
        path = _resolve_local_model_path(settings.TEXT_EMBED_MODEL)
        try:
            _text_model = SentenceTransformer(path, local_files_only=True)
        except Exception:
            _text_model = SentenceTransformer(settings.TEXT_EMBED_MODEL)
    return _text_model


def _load_clip():
    global _clip_model
    if _clip_model is None:
        from sentence_transformers import SentenceTransformer
        path = _resolve_local_model_path(settings.VISUAL_EMBED_MODEL)
        try:
            _clip_model = SentenceTransformer(path, local_files_only=True)
        except Exception:
            _clip_model = SentenceTransformer(settings.VISUAL_EMBED_MODEL)
    return _clip_model


_text_cache = {}
_clip_cache = {}


def _embed_texts_sync(texts):
    if len(texts) == 1 and texts[0] in _text_cache:
        return [_text_cache[texts[0]]]
    embs = _load_text().encode(texts, normalize_embeddings=True).tolist()
    if len(texts) == 1:
        if len(_text_cache) > 500:
            _text_cache.clear()
        _text_cache[texts[0]] = embs[0]
    return embs


def _embed_images_sync(images):
    return _load_clip().encode(images, normalize_embeddings=True).tolist()


def _embed_clip_text_sync(texts):
    if len(texts) == 1 and texts[0] in _clip_cache:
        return [_clip_cache[texts[0]]]
    embs = _load_clip().encode(texts, normalize_embeddings=True).tolist()
    if len(texts) == 1:
        if len(_clip_cache) > 500:
            _clip_cache.clear()
        _clip_cache[texts[0]] = embs[0]
    return embs


async def embed_texts(texts):
    return await asyncio.to_thread(_embed_texts_sync, texts)


async def embed_images(images):
    return await asyncio.to_thread(_embed_images_sync, images)


async def embed_clip_text(texts):
    return await asyncio.to_thread(_embed_clip_text_sync, texts)


def warm_up():
    """Pre-load encoders into memory."""
    _load_text()
    _load_clip()
