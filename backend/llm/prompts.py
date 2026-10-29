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

    now_str = datetime.now().strftime("%A, %B %d, %Y, %I:%M %p")

    return (
        f"You are NEXUS-RAG, an elite offline AI assistant powered locally by {model_name}.\n"
        f"CURRENT SYSTEM TIME & DATE: {now_str}\n\n"
        "Formatting & Presentation Standards:\n"
        "1. Clean Markdown Hierarchy: Format answers cleanly using Markdown headers (`### Section Title`), bold labels (`**Field:**`), and bulleted lists (`* Item`).\n"
        "2. Visual Spacing: Separate paragraphs and list items with clear double newlines.\n"
        "3. Direct & Concise: Answer queries directly, accurately, and concisely. Never generate long-winded preambles, redundant filler, or repetitive explanations unless asked for extensive elaboration.\n"
        "4. Independent Queries: When asked general questions, current date, definitions, or code questions, answer directly and accurately using your knowledge and the current system date.\n"
        "5. Document & Image Grounding: When an attached document, image, or retrieved snippet is provided, ground your answer on the visible content with exact precision.\n"
        "6. Diagrams & Charts: When explaining workflows or architectures, include a ```mermaid block. When summarizing numbers, include a ```chart block.\n"
        "7. Zero Hallucination: Never fabricate missing information. If an attribute is not visible or unknown, state that directly rather than guessing."
    )


SYSTEM_PROMPT = get_system_prompt()

# Deterministic, zero-latency small-talk / conversational detector.
# Includes greetings, casual chat, and direct identity/model questions so they
# never trigger unnecessary ChromaDB retrieval passes across unrelated documents.
_SMALL_TALK_PATTERNS = [
    r"^(hi|hello|hey|yo|sup|hiya)[\s!.,]*$",
    r"^(good\s?(morning|afternoon|evening|night))[\s!.,]*$",
    r"^(how are you|how('?s| is) it going|what'?s up)[\s!.,]*$",
    r"^(thanks?( you)?|thank you( so much)?|ty|thx)[\s!.,]*$",
    r"^(bye|goodbye|see ya|see you|cya|later)[\s!.,]*$",
    r"^(ok(ay)?|cool|nice|great|awesome|got it|sounds good)[\s!.,]*$",
    r"^(who are you|what are you|what can you do|tell me about yourself)[\s?!.,]*$",
    r"^(what|which)\s+(model|llm|ai)\s+(are\s+(you|u)(\s+using)?|is\s+this|do\s+(you|u)\s+use|do\s+(you|u)\s+run)[\s?!.,]*$",
    r"^(what|which)\s+model[\s?!.,]*$",
    r"^which\s+model\s+(are\s+)?(u|you)[\s?!.,]*$",
    r"^what\s+(is\s+your\s+model|model\s+are\s+you)[\s?!.,]*$",
    r"^(are\s+you\s+(chatgpt|openai|gpt|claude))[\s?!.,]*$",
]
_SMALL_TALK_RE = re.compile("|".join(_SMALL_TALK_PATTERNS), re.IGNORECASE)

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
    return bool(q) and len(q) <= 100 and bool(_SMALL_TALK_RE.match(q))


def is_date_query(question: str) -> bool:
    q = question.strip()
    return bool(q) and len(q) <= 80 and bool(_DATE_TIME_RE.match(q))


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
        ocr_context = f"\n\nEXTRACTED DOCUMENT OCR TRANSCRIPT:\n{context}" if context.strip() else ""
        return (
            f"{file_header}"
            f"QUESTION: {question}\n\n"
            f"INSTRUCTIONS:\n"
            f"- Inspect the attached image directly and answer the user's question with 100% accuracy based on what is visible.{ocr_context}\n"
            "- Extract and list relevant details clearly (document type, names, IDs, dates, numbers, text fields).\n"
            "- Answer directly, cleanly, and concisely using Markdown headers (###), bold labels, and bullet points."
        )

    has_context = bool(context.strip())

    if not has_context:
        return (
            f"QUESTION: {question}\n\n"
            "INSTRUCTIONS:\n"
            "- Answer the user's question directly, clearly, and concisely.\n"
            "- Use clean Markdown headings (###), bold labels, and neat bullet points (*).\n"
            "- If asked for code, provide clean, working, and concise code with brief comments.\n"
            "- Avoid unnecessary verbosity or unrequested complexity analysis."
        )

    return (
        f"{file_header}"
        f"CONTEXT (from uploaded documents):\n{context}\n\n"
        f"QUESTION: {question}\n\n"
        "INSTRUCTIONS:\n"
        "- The user is asking about their uploaded documents or related topics.\n"
        "- Answer any query related directly or indirectly to the provided context with high accuracy.\n"
        "- Ground your facts, figures, dates, and conclusions in the document content above.\n"
        "- If synthesizing or explaining concepts, connect them clearly to the provided document facts.\n"
        "- Structure your answer with clean Markdown headings (###), bold key terms, and bullet points.\n"
        "- Keep responses direct, informative, and concise."
    )
