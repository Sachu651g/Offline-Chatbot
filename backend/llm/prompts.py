"""Prompt templates that inject RRF-fused context with source citations."""
import re
from datetime import datetime


def get_system_prompt(model: str | None = None) -> str:
    m = (model or "gemma-3-4b").lower()
    if "gemma" in m:
        model_name = "Gemma 3 (Google Gemma 3 4B Vision)"
    elif "qwen" in m:
        model_name = "Qwen 2.5 (Qwen2.5-VL 3B Instruct)"
    elif "llama" in m:
        model_name = "Llama 3"
    else:
        model_name = model or "Gemma 3"

    now = datetime.now()
    now_str = now.strftime("%A, %B %d, %Y")
    time_str = now.strftime("%I:%M %p")

    return (
        f"You are NEXUS-RAG, an intelligent offline AI assistant powered locally by {model_name}.\n"
        f"[Local System Clock: {now_str}, {time_str}]\n\n"
        "CORE CAPABILITIES & GUIDELINES:\n"
        "1. VERSATILE ASSISTANT: You excel at day-to-day general tasks: writing clean code in any language, drafting professional emails and letters, solving math/logic problems, explaining complex topics clearly, and summarizing information.\n"
        "2. DOCUMENT GROUNDING: When document context or images are provided, answer faithfully using the facts in those documents without inventing unmentioned details.\n"
        "3. DIRECT & HELPFUL: Give clear, accurate, high-quality answers. If the user asks for a specific detail, provide that detail directly. When writing code, provide working, well-commented code. When explaining or drafting, produce well-structured markdown.\n"
        "4. NO SPURIOUS TIMESTAMPS: Only mention the date or time when the user specifically asks for it."
    )


SYSTEM_PROMPT = get_system_prompt()

# Comprehensive small-talk & conversational greetings regex
_SMALL_TALK_PATTERNS = [
    r"^(h(i|ello|ey|eyy+|lo|lw|iya)|yo|sup|hola|heya)[\s!.,]*$",
    r"^(good\s?(morning|afternoon|evening|night|day))[\s!.,]*$",
    r"^(how are you|how('?s| is) it going|what'?s up|how do you do)[\s!.,]*$",
    r"^(thanks?( you)?|thank you( so much)?|ty|thx|cheers)[\s!.,]*$",
    r"^(bye|goodbye|see ya|see you|cya|later|take care)[\s!.,]*$",
    r"^(ok(ay)?|cool|nice|great|awesome|got it|sounds good|done)[\s!.,]*$",
]
_SMALL_TALK_RE = re.compile("|".join(_SMALL_TALK_PATTERNS), re.IGNORECASE)

# Questions about the AI system itself, model architecture, or capabilities
_MODEL_QUERY_PATTERNS = [
    r"^(what|which)\s+(model|llm|ai)\s+(are\s+(you|u)(\s+using)?|is\s+this|do\s+(you|u)\s+use|do\s+(you|u)\s+run|using)[\s?!.,]*$",
    r"^(what|which)\s+(model|llm|ai)[\s?!.,]*$",
    r"^what\s+(is\s+your\s+model(\s+using)?|model\s+are\s+you(\s+using)?)[\s?!.,]*$",
    r"^(tell\s+me\s+about\s+your(self|\s+model)|explain\s+your\s+architecture)[\s?!.,]*$",
    r"^(who\s+are\s+you|what\s+are\s+you|what\s+can\s+you\s+do|who\s+made\s+you)[\s?!.,]*$",
    r"^(what\s+is\s+nexus(\s*rag)?)[\s?!.,]*$",
    r"^(are\s+you\s+(chatgpt|openai|gpt|claude|gemini|gemma|llama))[\s?!.,]*$",
]
_MODEL_QUERY_RE = re.compile("|".join(_MODEL_QUERY_PATTERNS), re.IGNORECASE)


def is_small_talk(question: str) -> bool:
    q = question.strip()
    return bool(q) and len(q) <= 80 and bool(_SMALL_TALK_RE.match(q))


def is_model_query(question: str) -> bool:
    q = question.strip()
    return bool(q) and len(q) <= 120 and bool(_MODEL_QUERY_RE.match(q))


def resolve_date_time_query(question: str) -> str | None:
    """Robust, multi-lingual day, date, and clock resolver.
    Never fails on phrasing: 'what is Date Today', 'what is Time Now', 'tell about today's day', etc.
    """
    q = question.strip().lower()
    if len(q) > 90:
        return None

    # Check if question contains time or date indicators
    has_date = bool(re.search(r'\b(date|day)\b', q))
    has_time = bool(re.search(r'\b(time|clock)\b', q))
    has_today = bool(re.search(r'\b(today|now|current|present)\b', q))
    is_what = bool(re.search(r'\b(what|tell|which|give|show|is it)\b', q))

    if not (has_date or has_time):
        return None

    now = datetime.now()
    d_str = now.strftime("%A, %B %d, %Y")
    t_str = now.strftime("%I:%M %p")

    # Asking for both date and time
    if has_date and has_time:
        return f"Today is **{d_str}**, and the local time is **{t_str}**."

    # Asking specifically about time
    if has_time and (has_today or is_what or "time" in q):
        return f"The current local time is **{t_str}** ({d_str})."

    # Asking specifically about date / day
    if has_date and (has_today or is_what or "day" in q):
        return f"Today is **{d_str}**."

    return None


def resolve_live_query(question: str) -> str | None:
    """Polite, instant resolution for live internet feeds (sports fixtures, live stock tickers).
    Avoids 20-second hangs on queries that require live external internet connections.
    """
    q = question.strip().lower()
    if len(q) > 120:
        return None

    sports_match = any(w in q for w in [
        "cricket match", "next match", "live score", "match schedule",
        "ipl match", "football match", "world cup match", "match for india"
    ])
    if sports_match:
        return (
            "As NEXUS-RAG is running **100% offline and air-gapped** on your local machine, "
            "I do not connect to external live web feeds for real-time sports fixtures or live match scores. "
            "You can upload any tournament schedule, score sheet, or sports document, and I will analyze and extract the details for you!"
        )

    market_live = any(w in q for w in ["stock price of", "live stock", "crypto price right now", "share price of"])
    if market_live:
        return (
            "As an offline local AI system, I do not have access to live external financial ticker feeds. "
            "You can upload financial reports, balance sheets, or CSV stock data, and I will analyze them locally."
        )

    return None


def get_model_specs_response(model_name: str | None = None) -> str:
    m_name = model_name or "Google Gemma 3 4B Vision"
    return (
        f"I am **NEXUS-RAG**, running **100% offline locally** on your machine with zero cloud dependencies.\n\n"
        f"**Local Hardware & AI Architecture:**\n"
        f"• **Language Model**: {m_name} (accelerated locally on your NVIDIA GeForce RTX 4050 GPU via LM Studio)\n"
        f"• **Dense Semantic Text Embeddings**: `all-MiniLM-L6-v2` (384-dimensional dense vectors)\n"
        f"• **Visual Multimodal Embeddings**: `clip-ViT-B-32` (512-dimensional CLIP vectors)\n"
        f"• **Vector Database**: Local ChromaDB with Reciprocal Rank Fusion (RRF)\n"
        f"• **OCR & Vision Engine**: RapidOCR / Windows OCR\n"
        f"• **Deployment Mode**: 100% air-gapped / offline."
    )


def build_context_block(fused_hits):
    lines = []
    for i, hit in enumerate(fused_hits, start=1):
        meta = hit.get("metadata", {})
        modality = meta.get("modality", "document")
        fname = meta.get("filename", "unknown")
        loc = meta.get("page")
        loc_str = f", page {loc}" if loc is not None else ""
        doc = (hit.get("document") or "").strip()
        doc = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', doc)
        doc = re.sub(r'[ \t]+', ' ', doc).strip()
        lines.append(f"[S{i}] ({modality} - {fname}{loc_str})\n{doc}")
    return "\n\n".join(lines)


def build_user_prompt(question, fused_hits, has_image=False):
    active_files = []
    for hit in (fused_hits or []):
        fn = (hit.get("metadata") or {}).get("filename")
        if fn and fn not in active_files:
            active_files.append(fn)

    file_header = f"ACTIVE RESOURCE: {', '.join(active_files)}\n\n" if active_files else ""
    context = build_context_block(fused_hits) if fused_hits else ""

    if has_image:
        ocr_context = f"\n\nEXTRACTED DOCUMENT OCR TEXT:\n{context}" if context.strip() else ""
        return (
            f"{file_header}"
            f"QUESTION: {question}\n\n"
            "INSTRUCTIONS:\n"
            f"- Answer what is specifically asked in the QUESTION above using the attached image and OCR text.{ocr_context}\n"
            "- Only mention the date or system time if the question specifically asks for it.\n"
            "- If asked for a specific detail (e.g. name, ID, number, date), output that detail directly."
        )

    has_context = bool(context.strip())

    if not has_context:
        return (
            f"QUESTION: {question}\n\n"
            "INSTRUCTIONS:\n"
            "- Answer the user's question directly, accurately, and thoroughly.\n"
            "- If writing code, provide clean, working code blocks with concise explanations.\n"
            "- If drafting an email, letter, or plan, format it professionally with markdown headings and bullet points.\n"
            "- Only mention date or time if specifically asked."
        )

    return (
        f"{file_header}"
        f"CONTEXT (from uploaded documents):\n{context}\n\n"
        f"QUESTION: {question}\n\n"
        "INSTRUCTIONS:\n"
        "- If the QUESTION asks about facts in the uploaded documents, answer directly using the CONTEXT above.\n"
        "- If the QUESTION is a general query, provide a helpful and direct answer.\n"
        "- If asked for a specific detail from the document, provide that requested answer directly and concisely."
    )
