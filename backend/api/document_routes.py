"""Document ingestion + knowledge-base management routes.

Raw files are stored in MongoDB (local, offline datastore) as base64 in the
`document_files` collection — never on the pod filesystem — so the system stays
fully offline and portable.
"""
import base64
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, Depends, HTTPException
from typing import List, Optional

from core.db import db
from core.security import get_current_user
from ingestion import parsers
from ingestion.pipeline import process_document, new_doc_record
from retrieval import chroma_client

router = APIRouter(prefix="/documents", tags=["documents"])


async def _store_file(doc_id, filename, data):
    await db.document_files.insert_one({
        "doc_id": doc_id,
        "filename": filename,
        "content": base64.b64encode(data).decode("ascii"),
    })


async def _delete_file(doc_id):
    await db.document_files.delete_one({"doc_id": doc_id})


@router.post("/upload")
async def upload(
    background: BackgroundTasks,
    files: List[UploadFile] = File(...),
    collection: Optional[str] = Form("default"),
    user: dict = Depends(get_current_user),
):
    created = []
    for f in files:
        modality = parsers.detect_modality(f.filename)
        if modality == "unsupported":
            created.append({"filename": f.filename, "status": "failed",
                            "error": "Unsupported format", "modality": "unsupported"})
            continue
        data = await f.read()
        rec = new_doc_record(user["id"], f.filename, modality, len(data), collection)
        await _store_file(rec["id"], f.filename, data)
        await db.documents.insert_one({**rec})
        background.add_task(process_document, rec["id"])
        created.append({k: rec[k] for k in
                        ("id", "filename", "modality", "size", "status", "collection")})
    return {"uploaded": created}


@router.get("")
async def list_documents(collection: Optional[str] = None, user: dict = Depends(get_current_user)):
    q = {"user_id": user["id"]}
    if collection:
        q["collection"] = collection
    docs = await db.documents.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"documents": docs}


@router.get("/collections")
async def collections(user: dict = Depends(get_current_user)):
    cols = await db.documents.distinct("collection", {"user_id": user["id"]})
    result = []
    for c in cols:
        count = await db.documents.count_documents({"user_id": user["id"], "collection": c})
        result.append({"name": c, "count": count})
    return {"collections": result}


@router.get("/{doc_id}")
async def get_document(doc_id: str, user: dict = Depends(get_current_user)):
    doc = await db.documents.find_one({"id": doc_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    preview = None
    if doc["modality"] == "image":
        rec = await db.document_files.find_one({"doc_id": doc_id})
        if rec:
            preview = "data:image/png;base64," + rec["content"]
    doc["image_preview"] = preview
    return doc


@router.get("/{doc_id}/chunks")
async def get_document_chunks(doc_id: str, user: dict = Depends(get_current_user)):
    """Retrieve raw vector chunks, metadata attributes, and embedding activations."""
    doc = await db.documents.find_one({"id": doc_id, "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chunks = []
    # 1. Text chunks from ChromaDB
    try:
        t_res = chroma_client.text_collection().get(
            where={"doc_id": doc_id},
            include=["documents", "metadatas", "embeddings"]
        )
        if t_res and t_res.get("ids"):
            embs = t_res.get("embeddings") if t_res.get("embeddings") is not None else []
            for i, cid in enumerate(t_res["ids"]):
                doc_text = t_res["documents"][i] if t_res.get("documents") and i < len(t_res["documents"]) else ""
                meta = t_res["metadatas"][i] if t_res.get("metadatas") and i < len(t_res["metadatas"]) else {}
                emb = embs[i] if i < len(embs) else None
                chunks.append({
                    "id": cid,
                    "text": doc_text,
                    "metadata": meta,
                    "modality": meta.get("modality", "document"),
                    "dimensions": len(emb) if emb is not None else 384,
                    "vector_sample": [round(float(x), 4) for x in emb[:24]] if emb is not None else [],
                })
    except Exception:
        pass

    # 2. Visual chunks from ChromaDB
    try:
        v_res = chroma_client.visual_collection().get(
            where={"doc_id": doc_id},
            include=["documents", "metadatas", "embeddings"]
        )
        if v_res and v_res.get("ids"):
            embs = v_res.get("embeddings") if v_res.get("embeddings") is not None else []
            for i, cid in enumerate(v_res["ids"]):
                doc_text = v_res["documents"][i] if v_res.get("documents") and i < len(v_res["documents"]) else "(CLIP Embedding Vector)"
                meta = v_res["metadatas"][i] if v_res.get("metadatas") and i < len(v_res["metadatas"]) else {}
                emb = embs[i] if i < len(embs) else None
                chunks.append({
                    "id": cid,
                    "text": doc_text,
                    "metadata": meta,
                    "modality": "image",
                    "dimensions": len(emb) if emb is not None else 512,
                    "vector_sample": [round(float(x), 4) for x in emb[:24]] if emb is not None else [],
                })
    except Exception:
        pass

    return {"doc_id": doc_id, "filename": doc.get("filename"), "chunks": chunks}



@router.post("/{doc_id}/reindex")
async def reindex(doc_id: str, background: BackgroundTasks, user: dict = Depends(get_current_user)):
    doc = await db.documents.find_one({"id": doc_id, "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    chroma_client.delete_document(doc_id)
    await db.documents.update_one({"id": doc_id}, {"$set": {"status": "queued", "error": None, "chunk_count": 0}})
    background.add_task(process_document, doc_id)
    return {"ok": True}


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, user: dict = Depends(get_current_user)):
    doc = await db.documents.find_one({"id": doc_id, "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    chroma_client.delete_document(doc_id)
    await _delete_file(doc_id)
    await db.documents.delete_one({"id": doc_id})
    return {"ok": True}


@router.post("/bulk-delete")
async def bulk_delete(payload: dict, user: dict = Depends(get_current_user)):
    ids = payload.get("ids", [])
    deleted = 0
    for doc_id in ids:
        doc = await db.documents.find_one({"id": doc_id, "user_id": user["id"]})
        if not doc:
            continue
        chroma_client.delete_document(doc_id)
        await _delete_file(doc_id)
        await db.documents.delete_one({"id": doc_id})
        deleted += 1
    return {"deleted": deleted}
