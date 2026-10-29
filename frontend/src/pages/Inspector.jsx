import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ScanEye, Search, Database, Layers, RefreshCw, Sparkles, ChevronRight,
    X, Binary, Cpu, Activity, Compass, Eye, Copy, Check, Zap, Box, FileSpreadsheet,
    FileText, ShieldAlert, ArrowUpRight
} from "lucide-react";
import api from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { ModalityIcon } from "@/components/ModalityIcon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { VectorCosmos3D } from "@/components/VectorCosmos3D";

const VECTOR_DOC_TASKS = [
    {
        id: "cross_doc",
        title: "Cross-Document Semantic Retrieval",
        query: "multimodal retrieval augmented generation offline architecture",
        icon: FileText,
        badge: "Text Path",
        desc: "Probes nearest 384-d MiniLM cosine neighbors across heterogeneous research PDFs.",
    },
    {
        id: "invoice_table",
        title: "Invoice & Ledger Tabular Clustering",
        query: "itemized total amount tax rate subtotal financial balance",
        icon: FileSpreadsheet,
        badge: "Tabular Matrix",
        desc: "Maps financial line items into localized clusters for arithmetic verification.",
    },
    {
        id: "visual_diagram",
        title: "Visual Diagram & Flowchart Alignment",
        query: "system flowchart architecture diagram visual features",
        icon: Layers,
        badge: "CLIP 512-d",
        desc: "Projects visual bounding boxes and schematics into shared multimodal semantic space.",
    },
    {
        id: "kyc_hash",
        title: "KYC Credential & Security Feature Lookup",
        query: "biometric face portrait digital seal government authority",
        icon: ShieldAlert,
        badge: "Security Task",
        desc: "Audits credential biometric bounding boxes and MRZ alphanumeric checksums.",
    },
];

export default function Inspector() {
    const [docs, setDocs] = useState([]);
    const [search, setSearch] = useState("");
    const [modalityFilter, setModalityFilter] = useState("all");
    const [loading, setLoading] = useState(false);

    // Live Vector Similarity Probe
    const [probeQuery, setProbeQuery] = useState("");
    const [probing, setProbing] = useState(false);
    const [probeResults, setProbeResults] = useState(null);
    const [activeTask, setActiveTask] = useState(VECTOR_DOC_TASKS[0]);
    const [selectedVectorNode, setSelectedVectorNode] = useState(null);

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
        try {
            const { data } = await api.post("/chat/retrieve", {
                question: q,
                top_k: 4,
                rrf_text_weight: 1.0,
                rrf_visual_weight: 1.0,
            });
            const combined = [...(data.text || []), ...(data.visual || [])].slice(0, 4);
            setProbeResults(combined);
            toast.success(`HNSW projection computed for "${q.slice(0, 32)}…"`);
        } catch (err) {
            toast.error("Vector probe failed: " + err.message);
        } finally {
            setProbing(false);
        }
    };

    const applyTaskSimulation = (task) => {
        setActiveTask(task);
        setProbeQuery(task.query);
        runProbe(task.query);
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
                        className="rounded-2xl border border-[#1E1E2E] bg-[#0D0D16] p-4 shadow-xl space-y-1"
                    >
                        <span className="text-zinc-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
                            <Database size={13} className="text-indigo-400" /> Total Chunks
                        </span>
                        <p className="text-2xl font-black text-white">{totalChunks}</p>
                        <p className="text-[10px] text-zinc-500">Dense vectors indexed</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-[#1E1E2E] bg-[#0D0D16] p-4 shadow-xl space-y-1"
                    >
                        <span className="text-zinc-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
                            <Layers size={13} className="text-cyan-400" /> Text Docs
                        </span>
                        <p className="text-2xl font-black text-cyan-300">{textDocsCount}</p>
                        <p className="text-[10px] text-zinc-500">MiniLM 384-d vectors</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-[#1E1E2E] bg-[#0D0D16] p-4 shadow-xl space-y-1"
                    >
                        <span className="text-zinc-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-400" /> Visual Docs
                        </span>
                        <p className="text-2xl font-black text-amber-300">{imageDocsCount}</p>
                        <p className="text-[10px] text-zinc-500">CLIP ViT-B 512-d</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-[#1E1E2E] bg-[#0D0D16] p-4 shadow-xl space-y-1"
                    >
                        <span className="text-zinc-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
                            <Activity size={13} className="text-emerald-400" /> Audio Modalities
                        </span>
                        <p className="text-2xl font-black text-emerald-300">{audioDocsCount}</p>
                        <p className="text-[10px] text-zinc-500">Whisper transcriptions</p>
                    </motion.div>
                </div>

                {/* 3D Vector Space Cosmos Stage with Orbit Controls */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 className="font-heading font-black text-lg text-white flex items-center gap-2">
                                <Compass size={18} className="text-cyan-400" />
                                High-Dimensional Vector Cosmos & HNSW Graph Simulator
                            </h2>
                            <p className="font-mono text-xs text-zinc-400">
                                Click & drag to rotate through multi-tier HNSW hierarchy, inspect cosine clusters, and probe semantic coordinates
                            </p>
                        </div>
                        <span className="rounded-full bg-cyan-500/20 px-3 py-1 font-mono text-[10px] font-extrabold text-cyan-300 border border-cyan-500/30 shrink-0 self-start sm:self-auto">
                            HNSW GRAPH TOPOLOGY ACTIVE
                        </span>
                    </div>

                    <VectorCosmos3D
                        isProbing={probing}
                        activeFilter={modalityFilter}
                        selectedTask={activeTask.id}
                        onSelectNode={(node) => setSelectedVectorNode(node)}
                    />
                </div>

                {/* Document Analysis Vector Simulation Tasks */}
                <div className="space-y-3 font-mono">
                    <span className="text-xs uppercase font-bold text-zinc-400 flex items-center gap-2">
                        <Zap size={14} className="text-amber-400" />
                        Document Analysis Vector Simulation Presets:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {VECTOR_DOC_TASKS.map((t) => {
                            const IconComponent = t.icon;
                            const isCurrent = activeTask.id === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => applyTaskSimulation(t)}
                                    className={`rounded-2xl border p-4 text-left transition-all shadow-xl flex flex-col justify-between space-y-2.5 ${
                                        isCurrent
                                            ? "border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400/40"
                                            : "border-[#1E1E2E] bg-[#0E0E18] hover:bg-[#121222] hover:border-indigo-500/40"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-cyan-300 border border-white/10">
                                            <IconComponent size={14} />
                                        </div>
                                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10 text-zinc-300">
                                            {t.badge}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white">{t.title}</h4>
                                        <p className="text-[10px] text-zinc-400 mt-1 leading-snug line-clamp-2">{t.desc}</p>
                                    </div>
                                    <span className="text-[9px] text-cyan-400 font-bold flex items-center gap-1 pt-1 border-t border-white/5">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-cyan-400">
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                        Probe Cosine Space
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* High-Dimensional Vector Similarity Probe Input Bar */}
                <div className="rounded-3xl border border-[#1E1E2E] glass-surface-3d p-5 shadow-2xl hud-corner font-mono space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                            <Compass size={15} className="text-cyan-400" />
                            <span>Custom Semantic Query Vector Probe</span>
                        </div>
                        <span className="text-[10px] text-zinc-400">
                            Executes dual-encoder (MiniLM + CLIP) query against ChromaDB
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Input
                            value={probeQuery}
                            onChange={(e) => setProbeQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && runProbe()}
                            placeholder="Enter any semantic term or sentence to probe nearest cosine neighbor chunks..."
                            className="h-10 border-[#252538] bg-[#0E0E18] text-xs text-white placeholder:text-zinc-500 focus-visible:ring-cyan-500/30 rounded-xl"
                        />
                        <Button
                            onClick={() => runProbe()}
                            disabled={probing || !probeQuery.trim()}
                            size="sm"
                            className="h-10 gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white font-mono text-xs font-bold px-5 shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all shrink-0"
                        >
                            <Zap size={14} className={probing ? "animate-spin" : ""} />
                            {probing ? "Probing..." : "Probe Vectors"}
                        </Button>
                    </div>

                    {/* Probe Nearest Neighbor Hits */}
                    {probeResults && probeResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-2 pt-3 border-t border-[#181826]"
                        >
                            <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 uppercase">
                                <span>Nearest Cosine Neighbors for "{probeQuery}":</span>
                                <span className="text-zinc-400 text-[10px]">Top {probeResults.length} Chunks</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                {probeResults.map((hit, idx) => {
                                    const matchPct = Math.round((hit.score || 0.85) * 100);
                                    return (
                                        <div
                                            key={idx}
                                            className="rounded-xl border border-white/5 bg-[#0F0F1A] p-3 space-y-2 text-xs hover:border-cyan-500/40 transition-colors"
                                        >
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="font-bold text-white truncate max-w-[130px]" title={hit.filename}>
                                                    {hit.filename}
                                                </span>
                                                <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                    {matchPct}% match
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 line-clamp-3 leading-relaxed">
                                                {hit.document || "(No preview text available)"}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter document chunks by filename or collection..."
                            className="h-10 pl-10 border-[#222232] bg-[#0E0E18] text-xs text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500/30 rounded-xl"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        {[
                            { id: "all", label: "All Modalities" },
                            { id: "document", label: "📄 Document" },
                            { id: "image", label: "🖼️ Image" },
                            { id: "audio", label: "🎙️ Audio" },
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setModalityFilter(m.id)}
                                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
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
                                            <span>Vector Spectrum</span>
                                            <span>{d.modality === "image" ? "512-d CLIP" : "384-d MiniLM"}</span>
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
                                                        opacity: 0.35 + (i % 7) * 0.1,
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
                                                className="rounded-2xl border border-white/5 bg-[#10101C] p-4 space-y-3 hover:border-indigo-500/30 transition-all"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                                                    <span className="font-bold text-indigo-300 text-[11px]">
                                                        Chunk #{idx + 1} • ID: {chunk.id}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                                                            {chunk.metadata?.modality || selectedDoc.modality}
                                                        </span>
                                                        <button
                                                            onClick={() => copyChunkText(chunk)}
                                                            className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white transition-colors"
                                                        >
                                                            {copiedChunkId === chunk.id ? (
                                                                <>
                                                                    <Check size={11} className="text-emerald-400" /> Copied
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy size={11} /> Copy Text
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className="text-zinc-300 leading-relaxed text-[11px] whitespace-pre-wrap bg-black/40 p-3 rounded-xl border border-white/5">
                                                    {chunk.text}
                                                </p>
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
