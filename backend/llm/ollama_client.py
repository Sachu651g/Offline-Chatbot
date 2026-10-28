"""Local Ollama client — the true offline inference path (Mistral-7B).

Host and model are parametrised so the UI can point the app at any reachable
Ollama server (local machine, LAN, or an SSH tunnel) and prove fully-offline
generation. Defaults come from the environment.
"""
import json
import time
import httpx
from core.config import settings

_ollama_cache = {}
_ollama_cache_time = 0
_last_active_time = 0


def _host(host):
    return host or settings.OLLAMA_HOST


def _model(model):
    return model or settings.OLLAMA_MODEL


async def is_available(host=None) -> bool:
    s = await status(host)
    return s.get("reachable", False)


async def status(host=None, model=None) -> dict:
    global _ollama_cache, _ollama_cache_time
    now = time.time()
    h, m = _host(host), _model(model)
    cache_key = f"{h}::{m}"

    # Return cached if within 10 seconds and was reachable
    if now - _ollama_cache_time < 10.0 and cache_key in _ollama_cache:
        cached = _ollama_cache[cache_key]
        if cached.get("reachable"):
            return cached

    if now - _last_active_time < 15.0 and cache_key in _ollama_cache:
        cached = _ollama_cache[cache_key]
        if cached.get("reachable"):
            return cached

    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            r = await client.get(f"{h}/api/tags")
            if r.status_code == 200:
                models = [x.get("name") for x in r.json().get("models", [])]
                loaded = any(m == x or x.startswith(m.split(":")[0]) for x in models)
                res = {"reachable": True, "host": h, "model": m,
                       "loaded": loaded, "available_models": models}
                _ollama_cache[cache_key] = res
                _ollama_cache_time = now
                return res
    except Exception:
        if cache_key in _ollama_cache and _ollama_cache[cache_key].get("reachable") and (now - _ollama_cache_time < 20.0):
            return _ollama_cache[cache_key]

    res = {"reachable": False, "host": h, "model": m, "loaded": False, "available_models": []}
    _ollama_cache[cache_key] = res
    _ollama_cache_time = now
    return res


async def stream_generate(system_prompt: str, user_prompt: str, host=None, model=None):
    payload = {
        "model": _model(model),
        "prompt": user_prompt,
        "system": system_prompt,
        "stream": True,
    }
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("POST", f"{_host(host)}/api/generate", json=payload) as resp:
            async for line in resp.aiter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                except Exception:
                    continue
                if data.get("response"):
                    yield data["response"]
                if data.get("done"):
                    break


async def _resolve_model(host=None, model=None) -> str:
    m = model or settings.OLLAMA_MODEL
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            r = await client.get(f"{_host(host)}/api/tags")
            if r.status_code == 200:
                models = [x.get("name") for x in r.json().get("models", [])]
                if m in models:
                    return m
                for x in models:
                    if x.startswith(m.split(":")[0]):
                        return x
                if models:
                    return models[0]
    except Exception:
        pass
    return m


async def stream_chat(system_prompt: str, history: list, user_prompt: str, host=None, model=None, images: list[str] | None = None):
    """Multi-turn chat via /api/chat so the model remembers earlier messages, with vision support."""
    target_model = await _resolve_model(host, model)
    messages = [{"role": "system", "content": system_prompt}]
    messages += [m for m in (history or []) if m.get("content")]

    user_msg = {"role": "user", "content": user_prompt}
    if images:
        raw_imgs = []
        for img in images:
            if not img:
                continue
            raw_imgs.append(img.split(",", 1)[-1] if "," in img else img)
        if raw_imgs:
            user_msg["images"] = raw_imgs
    messages.append(user_msg)

    payload = {"model": target_model, "messages": messages, "stream": True,
               "options": {"num_ctx": 4096}}
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("POST", f"{_host(host)}/api/chat", json=payload) as resp:
            if resp.status_code != 200:
                err_bytes = await resp.aread()
                yield f"[Ollama Error {resp.status_code}]: {err_bytes.decode('utf-8', errors='ignore')}"
                return
            async for line in resp.aiter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                except Exception:
                    continue
                piece = (data.get("message") or {}).get("content")
                if piece:
                    yield piece
                if data.get("done"):
                    break


async def caption_image(image_b64: str, host=None, vision_model=None) -> str:
    """Real image analysis: ask a local VISION-capable Ollama model
    (e.g. llava, moondream) to describe what's actually in the image —
    objects, layout, chart/diagram content, anything not covered by OCR
    text. Returns "" on any failure (model not pulled, non-vision model
    configured, Ollama unreachable) so callers can fall back gracefully to
    OCR + CLIP-only behavior rather than break ingestion.
    """
    payload = {
        "model": vision_model or settings.OLLAMA_VISION_MODEL,
        "prompt": (
            "Describe this image factually and specifically: what it shows, "
            "any objects/people/scenes, and if it's a chart, diagram, or "
            "table, describe its structure and key data points. Be concise "
            "(2-4 sentences), no speculation beyond what's visible."
        ),
        "images": [image_b64],
        "stream": False,
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(f"{_host(host)}/api/generate", json=payload)
            if r.status_code == 200:
                return (r.json().get("response") or "").strip()
    except Exception:
        pass
    return ""
