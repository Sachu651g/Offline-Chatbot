"""LM Studio client — local OpenAI-compatible inference path.

Connects to LM Studio's local server (default: http://localhost:1234/v1).
Supports streaming chat completions, model listing, health checks,
and multimodal vision captioning with resilient idle-connection handling.
"""
import json
import time
import httpx
from core.config import settings

_status_cache = {}
_status_cache_time = 0
_last_active_time = 0

_http_client: httpx.AsyncClient | None = None


def _reset_client():
    global _http_client
    if _http_client is not None:
        try:
            # We recreate a fresh client; old one will be garbage collected
            _http_client = None
        except Exception:
            _http_client = None


def _get_client() -> httpx.AsyncClient:
    global _http_client, _last_active_time
    now = time.time()
    # If connection was idle for more than 40 seconds, discard old pooled socket
    if _http_client is not None and not _http_client.is_closed and (now - _last_active_time > 40.0):
        _http_client = None

    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=15, keepalive_expiry=15.0),
            timeout=httpx.Timeout(connect=5.0, read=50.0, write=15.0, pool=5.0),
        )
    return _http_client


def _normalize_host(host: str | None) -> str:
    h = (host or settings.LM_STUDIO_HOST).strip().rstrip("/")
    h = h.replace("localhost", "127.0.0.1")
    if not h.endswith("/v1"):
        h = f"{h}/v1"
    return h


def _model(model: str | None) -> str:
    return model or settings.LM_STUDIO_MODEL


async def is_available(host: str | None = None) -> bool:
    s = await status(host)
    return s.get("reachable", False)


async def status(host: str | None = None, model: str | None = None) -> dict:
    global _status_cache, _status_cache_time, _last_active_time
    now = time.time()
    h = _normalize_host(host)
    m = _model(model)
    cache_key = f"{h}::{m}"

    # Return cached status if recent (within 8 seconds) and marked reachable
    if now - _status_cache_time < 8.0 and cache_key in _status_cache:
        cached = _status_cache[cache_key]
        if cached.get("reachable"):
            return cached

    # If an inference stream was active within the last 15 seconds, we know it's reachable
    if now - _last_active_time < 15.0 and cache_key in _status_cache:
        cached = _status_cache[cache_key]
        if cached.get("reachable"):
            return cached

    r = None
    try:
        client = _get_client()
        r = await client.get(f"{h}/models", timeout=4.0)
    except Exception:
        # On connection drop after idle, reset client and retry with a fresh socket
        _reset_client()
        try:
            client = _get_client()
            r = await client.get(f"{h}/models", timeout=4.0)
        except Exception:
            r = None

    if r and r.status_code == 200:
        raw_models = r.json().get("data", [])
        models = [x.get("id") for x in raw_models if x.get("id")]
        gen_models = [x for x in models if "embed" not in x.lower()]
        effective_models = gen_models if gen_models else models
        loaded = (m in models) or (len(models) > 0 and (not m or m == "auto"))
        effective_model = m if (m and m in models) else (effective_models[0] if effective_models else m)
        res = {
            "reachable": True,
            "host": h,
            "model": effective_model,
            "loaded": loaded,
            "available_models": models,
        }
        _status_cache[cache_key] = res
        _status_cache_time = now
        _last_active_time = now
        return res

    # If a transient error occurs but we were reachable within 20s, preserve reachable state
    if cache_key in _status_cache and _status_cache[cache_key].get("reachable") and (now - _status_cache_time < 20.0):
        return _status_cache[cache_key]

    res = {
        "reachable": False,
        "host": h,
        "model": m,
        "loaded": False,
        "available_models": [],
    }
    _status_cache[cache_key] = res
    _status_cache_time = now
    return res


async def stream_chat(
    system_prompt: str,
    history: list,
    user_prompt: str,
    host: str | None = None,
    model: str | None = None,
    images: list[str] | None = None,
):
    """Multi-turn streaming chat via OpenAI-compatible /v1/chat/completions with vision support."""
    global _last_active_time
    h = _normalize_host(host)
    m = _model(model)
    cache_key = f"{h}::{m}"

    cached_status = _status_cache.get(cache_key)
    if cached_status and cached_status.get("reachable") and cached_status.get("model"):
        m = cached_status["model"]
    elif not m or m == "auto":
        try:
            stat = await status(h, m)
            if stat.get("reachable") and stat.get("model"):
                m = stat["model"]
        except Exception:
            pass

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages += [item for item in (history or []) if item.get("content")]

    if images:
        u_content = [{"type": "text", "text": user_prompt}]
        for img_raw in images:
            if not img_raw:
                continue
            url = img_raw if img_raw.startswith("data:") else f"data:image/jpeg;base64,{img_raw}"
            u_content.append({"type": "image_url", "image_url": {"url": url}})
        messages.append({"role": "user", "content": u_content})
    else:
        messages.append({"role": "user", "content": user_prompt})

    payload = {
        "model": m,
        "messages": messages,
        "stream": True,
        "temperature": 0.1,
        "max_tokens": 1024 if images else 768,
        "stop": ["<|im_end|>", "<|endoftext|>", "<|im_start|>", "<end_of_turn>", "<eos>"],
    }

    req_timeout = httpx.Timeout(connect=8.0, read=60.0, write=15.0, pool=8.0)

    # Attempt request with automatic retry if socket was closed by server during idle
    for attempt in range(2):
        client = _get_client()
        try:
            async with client.stream("POST", f"{h}/chat/completions", json=payload, timeout=req_timeout) as resp:
                if resp.status_code != 200:
                    err_text = await resp.aread()
                    yield f"[LM Studio Error {resp.status_code}]: {err_text.decode('utf-8', errors='ignore')}"
                    return

                repeat_char = None
                repeat_count = 0
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    line_str = line.strip()
                    if line_str == "data: [DONE]":
                        break
                    if line_str.startswith("data: "):
                        data_json = line_str[6:].strip()
                        try:
                            data = json.loads(data_json)
                        except Exception:
                            continue
                        choices = data.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {})
                            token = delta.get("content")
                            if token:
                                _last_active_time = time.time()
                                if "?" in token and token.count("?") >= 2:
                                    token = token.replace("?", "")
                                    if not token:
                                        break

                                if len(token) == 1 and token in "?!.-*# ":
                                    if token == repeat_char:
                                        repeat_count += 1
                                        if repeat_count >= 2:
                                            break
                                    else:
                                        repeat_char = token
                                        repeat_count = 1
                                else:
                                    repeat_char = None
                                    repeat_count = 0

                                if token:
                                    yield token
            return
        except (httpx.ConnectError, httpx.RemoteProtocolError, httpx.ReadTimeout, httpx.WriteError) as exc:
            _reset_client()
            if attempt == 0:
                continue
            yield f"[LM Studio Connection Error]: {exc}. Please verify LM Studio Local Server is running."
            return


async def caption_image(
    image_b64: str,
    host: str | None = None,
    vision_model: str | None = None,
) -> str:
    """Analyze image using a vision-capable model loaded in LM Studio."""
    h = _normalize_host(host)
    m = vision_model or settings.LM_STUDIO_VISION_MODEL or _model(None)

    prompt = (
        "Briefly describe this image in 2-3 concise sentences. "
        "State document or object type, key visible text or labels, and main visual elements."
    )

    payload = {
        "model": m,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                ],
            }
        ],
        "temperature": 0.1,
        "max_tokens": 128,
        "stream": False,
    }
    try:
        client = _get_client()
        r = await client.post(f"{h}/chat/completions", json=payload, timeout=15.0)
        if r.status_code == 200:
            choices = r.json().get("choices", [])
            if choices:
                text = (choices[0].get("message", {}).get("content") or "").strip()
                if text.count("?") > 5 and text.count("?") > len(text) * 0.3:
                    return ""
                return text
    except Exception:
        pass
    return ""
