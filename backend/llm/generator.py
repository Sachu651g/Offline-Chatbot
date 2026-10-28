"""LLM generation.

PRIMARY PATH (offline deployments — Docker/local): streams from a local LLM runner:
1. LM Studio (OpenAI-compatible server on http://localhost:1234/v1)
2. Ollama (native server on http://localhost:11434)

OPTIONAL FALLBACK: a cloud model via the Emergent Universal Key.
"""
from core.config import settings
from llm.prompts import SYSTEM_PROMPT, get_system_prompt
from llm import ollama_client, lm_studio_client


async def stream_answer(
    session_id,
    user_prompt,
    host=None,
    model=None,
    history=None,
    provider=None,
    images=None,
):
    """Yield answer tokens. Supports LM Studio and Ollama, falling back to cloud key if configured."""
    prov = provider or settings.LOCAL_LLM_PROVIDER

    # 1. Check LM Studio if selected or auto
    if prov in ("lm_studio", "auto"):
        lm_host = host if prov == "lm_studio" else None
        lm_model = model if prov == "lm_studio" else None
        if await lm_studio_client.is_available(lm_host):
            sys = get_system_prompt(lm_model or settings.LM_STUDIO_MODEL)
            async for tok in lm_studio_client.stream_chat(sys, history, user_prompt, lm_host, lm_model, images=images):
                yield tok
            return

    # 2. Check Ollama if selected or auto
    if prov in ("ollama", "auto"):
        ol_host = host if prov == "ollama" else None
        ol_model = model if prov == "ollama" else None
        if await ollama_client.is_available(ol_host):
            sys = get_system_prompt(ol_model or settings.OLLAMA_MODEL)
            async for tok in ollama_client.stream_chat(sys, history, user_prompt, ol_host, ol_model, images=images):
                yield tok
            return

    # 3. Direct retry on LM Studio (in case is_available was transiently slow)
    if prov in ("lm_studio", "auto"):
        lm_host = host if prov == "lm_studio" else None
        lm_model = model if prov == "lm_studio" else None
        try:
            sys = get_system_prompt(lm_model or settings.LM_STUDIO_MODEL)
            streamed_any = False
            async for tok in lm_studio_client.stream_chat(sys, history, user_prompt, lm_host, lm_model, images=images):
                streamed_any = True
                yield tok
            if streamed_any:
                return
        except Exception:
            pass

    # 4. Fallback: Check if Ollama is up if LM Studio was preferred
    if prov == "lm_studio" and await ollama_client.is_available():
        sys = get_system_prompt(settings.OLLAMA_MODEL)
        async for tok in ollama_client.stream_chat(sys, history, user_prompt, images=images):
            yield tok
        return

    # 5. Offline safety guarantee: In offline mode or when local provider is specified,
    # never hang for 2+ minutes on cloud connections.
    if prov in ("lm_studio", "ollama") or not settings.EMERGENT_LLM_KEY:
        yield (
            "⚠️ **Local Offline Inference Notice**: The local model server (LM Studio at `http://127.0.0.1:1234` "
            "or Ollama at `http://127.0.0.1:11434`) is currently unreachable. "
            "Please check that LM Studio is open, the Local Server toggle is **ON** (Green), and `google/gemma-3-4b` is loaded."
        )
        return

    # 6. Optional cloud fallback (only if emergent key is explicitly provided and internet is active)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
        chat = LlmChat(
            api_key=settings.EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=SYSTEM_PROMPT,
        ).with_model(settings.LLM_PROVIDER, settings.LLM_MODEL)

        async for ev in chat.stream_message(UserMessage(text=user_prompt)):
            if isinstance(ev, TextDelta):
                yield ev.content
            elif isinstance(ev, StreamDone):
                break
    except Exception as e:
        yield f"Local model server is offline and cloud fallback is unavailable: {e}"


async def active_backend(host=None, model=None, provider=None, lm_stat=None, ol_stat=None):
    prov = provider or settings.LOCAL_LLM_PROVIDER

    # LM Studio check
    if prov in ("lm_studio", "auto"):
        lm_host = host if prov == "lm_studio" else None
        lm_model = model if prov == "lm_studio" else None
        stat = lm_stat if lm_stat is not None else await lm_studio_client.status(lm_host, lm_model)
        if stat.get("reachable"):
            return {
                "mode": "lm_studio",
                "model": stat.get("model") or lm_model or settings.LM_STUDIO_MODEL,
                "endpoint": stat.get("host") or lm_host or settings.LM_STUDIO_HOST,
                "note": "LM Studio local inference active (OpenAI-compatible /v1).",
                "available_models": stat.get("available_models", []),
            }

    # Ollama check
    if prov in ("ollama", "auto"):
        ol_host = host if prov == "ollama" else None
        ol_model = model if prov == "ollama" else None
        stat = ol_stat if ol_stat is not None else await ollama_client.status(ol_host, ol_model)
        if stat.get("reachable"):
            return {
                "mode": "ollama",
                "model": stat.get("model") or ol_model or settings.OLLAMA_MODEL,
                "endpoint": stat.get("host") or ol_host or settings.OLLAMA_HOST,
                "note": "Ollama local inference active.",
                "available_models": stat.get("available_models", []),
            }

    # Alternate check if preferred was offline
    stat_lm = lm_stat if lm_stat is not None else await lm_studio_client.status()
    if stat_lm.get("reachable"):
        return {
            "mode": "lm_studio",
            "model": stat_lm.get("model") or settings.LM_STUDIO_MODEL,
            "endpoint": stat_lm.get("host") or settings.LM_STUDIO_HOST,
            "note": "LM Studio local inference active (auto-fallback).",
            "available_models": stat_lm.get("available_models", []),
        }

    stat_ol = ol_stat if ol_stat is not None else await ollama_client.status()
    if stat_ol.get("reachable"):
        return {
            "mode": "ollama",
            "model": stat_ol.get("model") or settings.OLLAMA_MODEL,
            "endpoint": stat_ol.get("host") or settings.OLLAMA_HOST,
            "note": "Ollama local inference active (auto-fallback).",
            "available_models": stat_ol.get("available_models", []),
        }

    if settings.EMERGENT_LLM_KEY:
        return {
            "mode": "cloud_substitution",
            "model": f"{settings.LLM_PROVIDER}/{settings.LLM_MODEL}",
            "endpoint": "emergent-universal-key",
            "note": "Local LLM unreachable; using cloud fallback model.",
        }

    return {
        "mode": "unavailable",
        "model": None,
        "endpoint": None,
        "note": "No local LLM reachable (LM Studio on :1234 or Ollama on :11434).",
    }

