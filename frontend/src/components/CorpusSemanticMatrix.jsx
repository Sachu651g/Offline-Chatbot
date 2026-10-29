import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Database, Network, Layers, GitMerge, CheckCircle2, RefreshCw,
    ShieldCheck, Sparkles, ArrowRight, FileText, Check, AlertCircle, HardDrive
} from "lucide-react";
import { toast } from "sonner";

const CORPUS_DOCS = [
    { id: "d1", name: "RAG Architecture Paper.pdf", chunks: 42, modality: "Dual (Text+CLIP)", cluster: "Core Engine", entities: ["MiniLM-L6", "CLIP ViT-B-32", "ChromaDB HNSW", "RRF Fusion"] },
    { id: "d2", name: "ShivU Bhai Adhar.jpeg", chunks: 4, modality: "Visual OCR", cluster: "Identity", entities: ["Government of India", "UIDAI", "DOB", "QR Code"] },
    { id: "d3", name: "System Benchmark Specs.docx", chunks: 18, modality: "Text", cluster: "Performance", entities: ["MiniLM-L6", "6GB RAM Headroom", "LM Studio", "Gemma-3-4B"] },
    { id: "d4", name: "Voice Meeting Notes.wav", chunks: 12, modality: "Whisper Audio", cluster: "Audio Transcripts", entities: ["Faster-Whisper", "Offline STT", "Local Inference"] },
];

// Cross-Document Semantic Correlation Matrix (simulated Cosine similarities)
const CORRELATION_MATRIX = [
    [1.00, 0.14, 0.82, 0.45],
    [0.14, 1.00, 0.11, 0.18],
    [0.82, 0.11, 1.00, 0.38],
    [0.45, 0.18, 0.38, 1.00],
];

export function CorpusSemanticMatrix({ className = "" }) {
    const [selectedDocA, setSelectedDocA] = useState(0);
    const [selectedDocB, setSelectedDocB] = useState(2);
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResults, setAuditResults] = useState(null);

    const docA = CORPUS_DOCS[selectedDocA];
    const docB = CORPUS_DOCS[selectedDocB];
    const similarityScore = CORRELATION_MATRIX[selectedDocA][selectedDocB];

    // Find shared entities
    const sharedEntities = docA.entities.filter(e => docB.entities.includes(e));

    const runDeduplicationAudit = () => {
        setIsAuditing(true);
        setTimeout(() => {
            setIsAuditing(false);
            setAuditResults({
                checkedChunks: 76,
                duplicateCount: 0,
                orphanVectors: 0,
                healthScore: "100% Optimal",
                indexIntegrity: "Verified Persistent ChromaDB HNSW",
            });
            toast.success("Corpus deduplication audit complete: 0 duplicate chunks detected.");
        }, 900);
    };

    return (
        <div className={`rounded-2xl border border-[#1E1E2E] bg-[#0A0A12] overflow-hidden shadow-2xl ${className}`}>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E1E2E] bg-[#0D0D18] px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-400 border border-indigo-500/30">
                        <GitMerge size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-heading font-black text-sm text-white tracking-tight">
                                Corpus Semantic Matrix & Cross-Document Linker
                            </h3>
                            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 font-mono text-[9px] font-bold text-indigo-300 border border-indigo-500/30">
                                Multi-File Analysis Lab
                            </span>
                        </div>
                        <p className="font-mono text-[11px] text-zinc-400">
                            Simulate cross-document entity correlations, thematic clusters, and chunk deduplication
                        </p>
                    </div>
                </div>

                <button
                    onClick={runDeduplicationAudit}
                    disabled={isAuditing}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={13} className={isAuditing ? "animate-spin" : ""} />
                    <span>{isAuditing ? "Auditing Chunks…" : "Run Deduplication Audit"}</span>
                </button>
            </div>

            {/* Main Stage */}
            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Document Correlation Heatmap Matrix */}
                <div className="lg:col-span-6 space-y-3">
                    <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
                        <span className="font-bold text-white uppercase tracking-wider">Semantic Similarity Matrix</span>
                        <span className="text-[10px] text-zinc-500">Cosine Proximity (0.0 - 1.0)</span>
                    </div>

                    <div className="rounded-xl border border-[#1E1E2E] bg-[#0E0E18] p-3 space-y-2 overflow-x-auto">
                        <table className="w-full font-mono text-xs text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#1E1E2E] text-zinc-500 text-[10px]">
                                    <th className="p-2">Document</th>
                                    {CORPUS_DOCS.map((d, i) => (
                                        <th key={i} className="p-2 text-center">D{i + 1}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {CORPUS_DOCS.map((docRow, rIdx) => (
                                    <tr key={rIdx} className="border-b border-[#1A1A24]/60 hover:bg-white/5 transition-colors">
                                        <td className="p-2 text-zinc-300 font-bold truncate max-w-[140px]" title={docRow.name}>
                                            D{rIdx + 1}: {docRow.name.slice(0, 16)}…
                                        </td>
                                        {CORRELATION_MATRIX[rIdx].map((val, cIdx) => {
                                            const isSelectedPair = (rIdx === selectedDocA && cIdx === selectedDocB) || (rIdx === selectedDocB && cIdx === selectedDocA);
                                            const intensity = Math.round(val * 100);
                                            let cellBg = "bg-zinc-800/20 text-zinc-400";
                                            if (val >= 0.8) cellBg = "bg-indigo-500/30 text-indigo-200 font-bold border border-indigo-500/40";
                                            else if (val >= 0.4) cellBg = "bg-purple-500/20 text-purple-300";

                                            return (
                                                <td key={cIdx} className="p-1.5 text-center">
                                                    <button
                                                        onClick={() => { setSelectedDocA(rIdx); setSelectedDocB(cIdx); }}
                                                        className={`w-full py-1 rounded transition-all ${cellBg} ${
                                                            isSelectedPair ? "ring-2 ring-cyan-400 shadow-md font-black" : ""
                                                        }`}
                                                    >
                                                        {val.toFixed(2)}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Cross-Document Entity Linker & Audit Results */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                    <div className="rounded-xl border border-[#1E1E2E] bg-[#0E0E18] p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#1A1A24] pb-2.5">
                            <span className="font-mono text-xs font-bold text-white">
                                Cross-Document Link: D{selectedDocA + 1} &harr; D{selectedDocB + 1}
                            </span>
                            <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                                Similarity: {(similarityScore * 100).toFixed(0)}%
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                            <div className="p-2.5 rounded-lg bg-black/40 border border-[#1E1E2E]">
                                <span className="text-[10px] text-indigo-400 font-bold block mb-1">D{selectedDocA + 1}: {docA.name}</span>
                                <span className="text-zinc-400 text-[10px] block">{docA.chunks} Chunks · {docA.modality}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-black/40 border border-[#1E1E2E]">
                                <span className="text-[10px] text-purple-400 font-bold block mb-1">D{selectedDocB + 1}: {docB.name}</span>
                                <span className="text-zinc-400 text-[10px] block">{docB.chunks} Chunks · {docB.modality}</span>
                            </div>
                        </div>

                        {/* Shared Entity Bridge */}
                        <div className="space-y-1.5 font-mono text-xs">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">
                                Shared Semantic Entities ({sharedEntities.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {sharedEntities.length > 0 ? (
                                    sharedEntities.map((ent, idx) => (
                                        <span key={idx} className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                            &bull; {ent}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-zinc-500 text-[11px] italic">No directly shared entity tokens (Orthogonal semantic topics).</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Deduplication Health Panel */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3.5 flex items-center justify-between font-mono text-xs">
                        <div className="flex items-center gap-2.5">
                            <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                            <div>
                                <p className="font-bold text-white text-xs">Zero Duplicate Chunks Detected</p>
                                <p className="text-[10px] text-zinc-400">All 76 active chunks are unique across 4 isolated collections</p>
                            </div>
                        </div>
                        <span className="text-emerald-400 font-bold bg-emerald-500/20 px-2 py-1 rounded text-[10px] border border-emerald-500/30">
                            100% HEALTHY
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default CorpusSemanticMatrix;
