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

    now_str = datetime.now().strftime("%A, %B %d, %Y")

    return (
        f"You are NEXUS-RAG, an offline AI assistant powered locally by {model_name}.\n"
        f"[Internal Clock reference: {now_str}]\n\n"
        "STRICT INSTRUCTIONS:\n"
        "1. ANSWER ONLY WHAT IS ASKED: Answer ONLY the specific question asked by the user. Never volunteer extra unasked information, unrequested document fields, or unsolicited sections.\n"
        "2. NO UNASKED DATE OR TIME: NEVER mention or output the current date, time, or system clock UNLESS the user explicitly asks about the date or time.\n"
        "3. TARGETED RESPONSES: If the user asks for a specific fact (e.g. a name, a number, a date, an address, or a single detail), give ONLY that specific answer directly. Do NOT output a full document summary or additional data.\n"
        "4. SUMMARIES ONLY WHEN EXPLICITLY REQUESTED: Only summarize or list all details if the user explicitly asks to 'summarize', 'explain all details', or 'give all information'.\n"
        "5. DIRECT & CONCISE: Start directly with the answer. Do not use conversational filler or preambles."
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

# Date and time queries
_DATE_TIME_PATTERNS = [
    r"^(what\s+is\s+)?(today('?s)?|the\s+current)\s+date[\s?!.,]*$",
    r"^(current|today('?s)?)\s+date[\s?!.,]*$",
    r"^what\s+date\s+is\s+(it|today)[\s?!.,]*$",
    r"^what('?s| is)\s+the\s+date(\s+today)?[\s?!.,]*$",
    r"^what\s+(time|day)\s+is\s+(it|today)[\s?!.,]*$",
    r"^(what\s+is\s+)?(the\s+)?current\s+time[\s?!.,]*$",
    r"^today('?s)?\s+day[\s?!.,]*$",
]
_DATE_TIME_RE = re.compile("|".join(_DATE_TIME_PATTERNS), re.IGNORECASE)


def is_small_talk(question: str) -> bool:
    q = question.strip()
    return bool(q) and len(q) <= 80 and bool(_SMALL_TALK_RE.match(q))


def is_model_query(question: str) -> bool:
    q = question.strip()
    return bool(q) and len(q) <= 120 and bool(_MODEL_QUERY_RE.match(q))


def is_date_query(question: str) -> bool:
    q = question.strip()
    return bool(q) and len(q) <= 80 and bool(_DATE_TIME_RE.match(q))


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
            f"- Answer ONLY what is specifically asked in the QUESTION above using the attached image and OCR text.{ocr_context}\n"
            "- Do NOT mention the current date or system time.\n"
            "- Do NOT provide unrequested extra information, unasked fields, or unsolicited summaries.\n"
            "- If asked for a specific detail (e.g. name, ID, number, date), output ONLY that detail directly."
        )

    has_context = bool(context.strip())

    if not has_context:
        return (
            f"QUESTION: {question}\n\n"
            "INSTRUCTIONS:\n"
            "- Answer what is asked in the QUESTION directly, accurately, and concisely.\n"
            "- Do NOT add unrequested dates or unsolicited sections."
        )

    return (
        f"{file_header}"
        f"CONTEXT (from uploaded documents):\n{context}\n\n"
        f"QUESTION: {question}\n\n"
        "INSTRUCTIONS:\n"
        "- If the QUESTION asks about facts in the uploaded documents, answer directly using the CONTEXT above.\n"
        "- If the QUESTION is a general greeting or query not related to the documents, answer normally.\n"
        "- Do NOT mention the current date or system time.\n"
        "- Do NOT provide unrequested extra sections, additional information, or document summaries unless explicitly asked to summarize.\n"
        "- If asked for a specific detail, provide ONLY that requested answer directly and concisely."
    )
