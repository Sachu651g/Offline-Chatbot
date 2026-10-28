import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ScanEye, Search, Database, Layers, RefreshCw, Sparkles, ChevronRight,
    X, Binary, Cpu, Activity, Compass, Eye, Copy, Check, Zap
} from "lucide-react";
import api from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { ModalityIcon } from "@/components/ModalityIcon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Inspector() {
    const [docs, setDocs] = useState([]);
    const [search, setSearch] = useState("");
    const [modalityFilter, setModalityFilter] = useState("all");
    const [loading, setLoading] = useState(false);

    // Live Vector Similarity Probe
    const [probeQuery, setProbeQuery] = useState("");
    const [probing, setProbing] = useState(false);
    const [probeResults, setProbeResults] = useState(null);
    const [showProbe, setShowProbe] = useState(false);

    // Selected document for deep chunk inspection
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [docChunks, setDocChunks] = useState([]);
    const [loadingChunks, setLoadingChunks] = useState(false);
    const [copiedChunkId, setCopiedChunkId] = useState(null);

    const runProbe = async (overrideQuery) => {
        const q = (overrideQuery || probeQuery).trim();
        if (!q) return;
        setProbeQuery(q);
        setProbing(true);
        setShowProbe(true);
        try {
            const { data } = await api.post("/chat/retrieve", {
                question: q,
                top_k: 3,
                rrf_text_weight: 1.0,
                rrf_visual_weight: 1.0,
            });
            const combined = [...(data.text || []), ...(data.visual || [])].slice(0, 3);
            setProbeResults(combined);
            toast.success(`Vector probe computed across ChromaDB`);
        } catch (err) {
            toast.error("Vector probe failed: " + err.message);
        } finally {
            setProbing(false);
        }
    };

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/documents");
            setDocs(data.documents);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openDocInspection = async (doc) => {
        setSelectedDoc(doc);
        setLoadingChunks(true);
        try {
            const { data } = await api.get(`/documents/${doc.id}/chunks`);
            setDocChunks(data.chunks || []);
        } catch (err) {
            toast.error("Failed to fetch chunks from ChromaDB: " + err.message);
            setDocChunks([]);
        } finally {
            setLoadingChunks(false);
        }
    };

    const copyChunkText = async (chunk) => {
        try {
            await navigator.clipboard.writeText(chunk.text);
            setCopiedChunkId(chunk.id);
            toast.success("Copied chunk payload to clipboard");
            setTimeout(() => setCopiedChunkId(null), 2000);
        } catch {
            /* ignore */
        }
    };

    const filtered = docs.filter((d) => {
        const matchesSearch = (d.filename || "").toLowerCase().includes(search.toLowerCase());
        const matchesModality = modalityFilter === "all" || d.modality === modalityFilter;
        return matchesSearch && matchesModality;
    });

    const totalChunks = docs.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
    const textDocsCount = docs.filter((d) => d.modality === "document").length;
    const imageDocsCount = docs.filter((d) => d.modality === "image").length;
    const audioDocsCount = docs.filter((d) => d.modality === "audio").length;

    return (
        <AppShell>
            <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8 space-y-7">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 font-mono text-[10px] font-extrabold text-indigo-400">
                            <ScanEye size={13} className="animate-pulse" /> Deep ChromaDB Vector & Chunk Inspector
                        </div>
                        <h1 className="font-heading text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            Vector Inspector <Binary size={24} className="text-indigo-400" />
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                            Analyze dense multi-dimensional embeddings (384-d & 512-d CLIP), chunk activation heatmaps, HNSW cosine distance indexes, and real-time retrieval metadata.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            onClick={load}
                            disabled={loading}
                            variant="outline"
                            className="h-10 gap-2 rounded-xl border-[#222232] bg-[#0E0E18] font-mono text-xs text-zinc-300 hover:bg-[#161624] hover:text-white hover:border-indigo-500/40 transition-all shadow-lg"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh ChromaDB
                        </Button>
                    </div>
                </div>

                {/* Corpus Stats Bar */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-[#0E0E18] to-[#080810] p-4 shadow-xl space-y-1 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-full blur-xl" />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Database size={12} className="text-indigo-400" /> Total Chunks
                        </span>
                        <p className="text-2xl font-black text-indigo-400">{totalChunks}</p>
                        <span className="text-[9px] text-zinc-500">Dense vectors indexed</span>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#0E0E18] to-[#080810] p-4 shadow-xl space-y-1 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/5 rounded-full blur-xl" />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={12} className="text-purple-400" /> Text Docs
                        </span>
                        <p className="text-2xl font-black text-purple-400">{textDocsCount}</p>
                        <span className="text-[9px] text-zinc-500">MiniLM 384-d vectors</span>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#0E0E18] to-[#080810] p-4 shadow-xl space-y-1 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full blur-xl" />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={12} className="text-amber-400" /> Visual Docs
                        </span>
                        <p className="text-2xl font-black text-amber-400">{imageDocsCount}</p>
                        <span className="text-[9px] text-zinc-500">CLIP ViT-B 512-d</span>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#0E0E18] to-[#080810] p-4 shadow-xl space-y-1 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full blur-xl" />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Activity size={12} className="text-emerald-400" /> Audio Modalities
                        </span>
                        <p className="text-2xl font-black text-emerald-400">{audioDocsCount}</p>
                        <span className="text-[9px] text-zinc-500">Whisper transcriptions</span>
                    </motion.div>
                </div>

                {/* Search & Modality Filter Ribbon */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#1E1E2E] bg-[#0C0C16] p-3 shadow-xl backdrop-blur-xl">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3.5 top-3 text-zinc-500" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter document chunks by filename or collection…"
                            className="h-10 border-0 bg-transparent pl-9 font-mono text-xs text-white placeholder:text-zinc-500 focus-visible:ring-0"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                        {[
                            { id: "all", label: "All Modalities" },
                            { id: "document", label: "📄 Document" },
                            { id: "image", label: "🖼️ Image" },
                            { id: "audio", label: "🎙️ Audio" },
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setModalityFilter(m.id)}
                                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    modalityFilter === m.id
                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                                        : "bg-[#141422] text-zinc-400 hover:text-white border border-[#222234]"
                                }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* In-Inspector Live Vector Similarity Probe */}
                <div className="rounded-2xl border border-indigo-500/30 bg-[#0B0B14] p-4 shadow-2xl space-y-3 font-mono">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                            <Compass size={15} className="text-indigo-400" />
                            <span>Live High-Dimensional Vector Similarity Probe</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500">Quick Test:</span>
                            {["Architecture", "Neural Network", "Security", "Audio Transcript"].map((preset, i) => (
                                <button
                                    key={i}
                                    onClick={() => runProbe(preset)}
                                    className="rounded-lg bg-[#141424] px-2 py-0.5 text-[10px] text-zinc-300 hover:text-white hover:bg-indigo-600/30 border border-white/5 transition-all"
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Input
                            value={probeQuery}
                            onChange={(e) => setProbeQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && runProbe()}
                            placeholder="Enter any semantic term or sentence to probe nearest cosine neighbor chunks..."
                            className="h-9 border-[#1E1E2E] bg-[#07070E] text-xs text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500/20"
                        />
                        <Button
                            onClick={() => runProbe()}
                            disabled={probing || !probeQuery.trim()}
                            size="sm"
                            className="h-9 gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-mono text-xs font-bold px-3.5 shadow-md shadow-indigo-600/20 hover:opacity-90"
                        >
                            <Zap size={13} className={probing ? "animate-spin" : ""} />
                            {probing ? "Probing..." : "Probe Vectors"}
                        </Button>
                    </div>

                    {probeResults && probeResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-2 pt-2 border-t border-[#181826]"
                        >
                            <p className="text-[10px] uppercase font-bold text-indigo-400">
                                Nearest Neighbor Hits for "{probeQuery}":
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {probeResults.map((hit, idx) => {
                                    const matchPct = Math.round((hit.score || 0.85) * 100);
                                    return (
                                        <div
                                            key={idx}
                                            className="rounded-xl border border-white/5 bg-[#0F0F1A] p-2.5 space-y-1.5 text-xs hover:border-indigo-500/40 transition-colors"
                                        >
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="font-bold text-white truncate max-w-[140px]">
                                                    {hit.filename}
                                                </span>
                                                <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                    {matchPct}% match
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 line-clamp-2">
                                                {hit.document || "(No preview text available)"}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Vector Chunk Cards Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.length === 0 ? (
                        <div className="col-span-full rounded-2xl border border-dashed border-[#222232] bg-[#0E0E18]/60 p-14 text-center space-y-2">
                            <Database className="mx-auto text-zinc-500" size={32} />
                            <p className="font-mono text-xs text-zinc-400">No document vector chunks match the selected filters.</p>
                        </div>
                    ) : (
                        filtered.map((d) => (
                            <motion.div
                                key={d.id}
                                whileHover={{ y: -3 }}
                                onClick={() => openDocInspection(d)}
                                className="group cursor-pointer rounded-2xl border border-[#1E1E2E] bg-gradient-to-b from-[#0E0E18] to-[#0A0A12] p-5 shadow-xl space-y-3.5 hover:border-indigo-500/60 transition-all flex flex-col justify-between"
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <ModalityIcon modality={d.modality} size={18} showLabel />
                                        <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-300 border border-white/5">
                                            {d.collection}
                                        </span>
                                    </div>
                                    <h3 className="font-mono text-xs font-bold text-white truncate" title={d.filename}>
                                        {d.filename}
                                    </h3>
                                </div>

                                <div className="rounded-xl bg-[#07070D] p-3 border border-[#1A1A28] space-y-2 font-mono text-[11px]">
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Status:</span>
                                        <span className="text-emerald-400 font-bold uppercase tracking-wider">{d.status}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Indexed Chunks:</span>
                                        <span className="text-indigo-300 font-bold">{d.chunk_count || 0} chunks</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Space & Metric:</span>
                                        <span className="text-zinc-300">HNSW (Cosine)</span>
                                    </div>
                                    {/* Mini Simulated Vector Heatbar */}
                                    <div className="pt-1">
                                        <div className="flex justify-between text-[9px] text-zinc-500 pb-1">
                                            <span>Vector Heatmap</span>
                                            <span>{d.modality === "image" ? "512-d" : "384-d"}</span>
                                        </div>
                                        <div className="flex h-2 w-full gap-0.5 rounded overflow-hidden bg-black/40">
                                            {Array.from({ length: 16 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1"
                                                    style={{
                                                        backgroundColor:
                                                            i % 3 === 0
                                                                ? "#6366F1"
                                                                : i % 2 === 0
                                                                ? "#A855F7"
                                                                : "#10B981",
                                                        opacity: 0.3 + (i % 7) * 0.1,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 pt-1">
                                    <span>ID: {d.id.slice(0, 8)}…</span>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openDocInspection(d);
                                        }}
                                        size="sm"
                                        className="h-7 gap-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white font-mono text-[10px] transition-all px-2.5"
                                    >
                                        <Eye size={12} /> Inspect Chunks
                                    </Button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Deep Chunk Inspection Modal / Drawer */}
                <AnimatePresence>
                    {selectedDoc && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6"
                            onClick={() => setSelectedDoc(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 10 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 10 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative flex flex-col max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-indigo-500/40 bg-[#0C0C16] shadow-2xl"
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between border-b border-[#1E1E2E] bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-transparent px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                            <Binary size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-mono text-sm font-bold text-white truncate max-w-md">
                                                {selectedDoc.filename}
                                            </h3>
                                            <p className="font-mono text-[10px] text-zinc-400">
                                                ChromaDB Vector Decomposition • {docChunks.length} Stored Chunks
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDoc(null)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Modal Content List */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">
                                    {loadingChunks ? (
                                        <div className="py-20 text-center space-y-3">
                                            <RefreshCw size={24} className="mx-auto animate-spin text-indigo-400" />
                                            <p className="text-zinc-400 text-xs">Querying ChromaDB vector storage...</p>
                                        </div>
                                    ) : docChunks.length === 0 ? (
                                        <div className="py-16 text-center text-zinc-500">
                                            No raw chunks found for this document in ChromaDB.
                                        </div>
                                    ) : (
                                        docChunks.map((chunk, idx) => (
                                            <div
                                                key={chunk.id || idx}
                                                className="rounded-2xl border border-[#1E1E2E] bg-[#080810] p-4 space-y-3 shadow-md hover:border-indigo-500/40 transition-colors"
                                            >
                                                {/* Chunk Header */}
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2 text-[11px]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded bg-indigo-500/20 px-2 py-0.5 font-bold text-indigo-300 border border-indigo-500/30">
                                                            Chunk #{idx + 1}
                                                        </span>
                                                        <span className="text-zinc-500">ID: {chunk.id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/20">
                                                            {chunk.dimensions}-dimensional vector
                                                        </span>
                                                        <button
                                                            onClick={() => copyChunkText(chunk)}
                                                            className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300 hover:text-white hover:bg-white/10"
                                                        >
                                                            {copiedChunkId === chunk.id ? (
                                                                <Check size={11} className="text-emerald-400" />
                                                            ) : (
                                                                <Copy size={11} />
                                                            )}
                                                            {copiedChunkId === chunk.id ? "Copied" : "Copy"}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Vector Dimension Heatmap Sample */}
                                                {chunk.vector_sample && chunk.vector_sample.length > 0 && (
                                                    <div className="space-y-1 rounded-xl bg-black/40 p-2.5 border border-white/5">
                                                        <div className="flex justify-between text-[10px] text-zinc-400 font-semibold">
                                                            <span>Dense Embedding Dimension Activations (Sample)</span>
                                                            <span className="text-indigo-400 font-mono">
                                                                Range: [-1.0, +1.0]
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-8 sm:grid-cols-12 gap-1 pt-1">
                                                            {chunk.vector_sample.map((val, vi) => (
                                                                <div
                                                                    key={vi}
                                                                    className="flex flex-col items-center justify-center p-1 rounded text-[9px] border"
                                                                    style={{
                                                                        backgroundColor:
                                                                            val >= 0
                                                                                ? `rgba(99, 102, 241, ${Math.min(0.9, Math.max(0.15, val * 3))})`
                                                                                : `rgba(244, 63, 94, ${Math.min(0.9, Math.max(0.15, Math.abs(val) * 3))})`,
                                                                        borderColor:
                                                                            val >= 0
                                                                                ? "rgba(129, 140, 248, 0.4)"
                                                                                : "rgba(251, 113, 133, 0.4)",
                                                                    }}
                                                                    title={`Dimension ${vi}: ${val}`}
                                                                >
                                                                    <span className="text-white font-bold">{val}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Text Payload */}
                                                <div className="rounded-xl bg-[#05050A] p-3 text-zinc-300 leading-relaxed border border-white/5 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                                    {chunk.text}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AppShell>
    );
}
