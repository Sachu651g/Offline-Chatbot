import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText, GitBranch, Cpu, Network, CheckCircle2, Play, RefreshCw,
    Sparkles, Eye, Download, Copy, Share2, Layers, Search, BookOpen,
    ShieldAlert, ChevronRight, Check, Hash, ArrowUpRight
} from "lucide-react";
import { MermaidBlock } from "@/components/MermaidBlock";
import { toast } from "sonner";

// Preset Real-World Document Analysis Profiles
const DOCUMENT_PROFILES = [
    {
        id: "doc-rag-paper",
        title: "Offline Multimodal RAG Architecture",
        type: "Technical Whitepaper",
        pages: 18,
        chunks: 42,
        modality: "Dual (Text + CLIP Visual)",
        entities: ["MiniLM-L6-v2", "CLIP ViT-B-32", "ChromaDB HNSW", "Reciprocal Rank Fusion", "Gemma-3-4B"],
        mindmap: `mindmap
  root((Offline Multimodal RAG))
    Architecture Pipeline
      Text Path
        SentenceTransformers MiniLM
        384-dimensional dense vectors
      Visual Path
        CLIP ViT-B-32 Vision Backbone
        512-dimensional embeddings
      Audio Transcription
        Faster-Whisper on CPU
    Retrieval Engine
      ChromaDB HNSW Index
        Cosine Distance Metric
        Persistent disk storage
      Hybrid Re-Ranking
        Reciprocal Rank Fusion RRF
        Score Normalization k=60
    Synthesis & Grounding
      Local LLM Engine
        Gemma 3 4B via LM Studio
        Strict Zero-Hallucination Prompt
      Cited Context Verification
        Inline Citation Badges
        Evidence Snippet Previews`,
        summary: "Autonomous air-gapped system combining dual-modality vector embeddings with reciprocal rank fusion for grounded document question answering without internet connectivity.",
        keyFacts: [
            { label: "Vector Dimension", value: "384 (Text) / 512 (Visual)" },
            { label: "Indexing Latency", value: "85ms / page" },
            { label: "Precision @ Top-5", value: "94.2% Grounded" },
            { label: "Offline Guarantee", value: "100% Zero Data Leakage" },
        ],
    },
    {
        id: "doc-gov-id",
        title: "Identity Document & OCR Parsing",
        type: "Identity Verification Document",
        pages: 2,
        chunks: 8,
        modality: "Image OCR + Visual Layout",
        entities: ["Government of India", "Aadhaar UIDAI", "Permanent Account Number", "Date of Birth", "QR Code Signature"],
        mindmap: `mindmap
  root((Identity Document))
    Document Verification
      Header Entity
        Issuing Authority
        National Emblem Verification
      Subject Identification
        Full Legal Name
        Father or Guardian Name
        Date of Birth DOB
    Structural Layout Analysis
      Visual Regions
        Card Boundary Detection
        Photograph Bounding Box
        Cryptographic QR Code
      OCR Text Fields
        Alphanumeric Identification Number
        Permanent Resident Address
    Integrity Audit
      Tamper Detection
        Font Consistency Analysis
        Hologram Micro-print Verification
      Privacy Shield
        Masked UID Digits
        Local AES-256 Storage`,
        summary: "Deep document structure inspection extracting structured demographic metadata, OCR text, and cryptographic QR signatures entirely on local hardware.",
        keyFacts: [
            { label: "OCR Confidence", value: "98.7% Tesseract OCR" },
            { label: "Visual Feature Extraction", value: "CLIP ViT-B-32" },
            { label: "Privacy Protection", value: "Local Storage (No Cloud)" },
            { label: "Document Classification", value: "Identity Card" },
        ],
    },
    {
        id: "doc-contract",
        title: "Enterprise Master Services Agreement",
        type: "Legal Contract",
        pages: 34,
        chunks: 76,
        modality: "Structured Legal Text",
        entities: ["Licensor", "Licensee", "Indemnification Clause", "Service Level Agreement", "Termination for Breach"],
        mindmap: `mindmap
  root((Master Services Agreement))
    Contractual Parties
      Service Provider
        Corporate Registration
        Authorized Signatory
      Client Entity
        Subsidiary Coverage
        Billing Jurisdiction
    Operative Covenants
      Scope of Deliverables
        Milestone Schedule
        Acceptance Testing
      Financial Terms
        Net 30 Payment Terms
        Late Fee Accrual
    Risk Allocation
      Limitation of Liability
        Mutual Consequential Damages Waiver
        Aggregate Fee Cap 12 Months
      Intellectual Property
        Pre-existing Materials
        Work Made for Hire
    Governance & Exit
      Term and Renewal
        Auto-renewal Notice Period
        Termination for Convenience`,
        summary: "Automated legal analysis identifying governing obligations, risk caps, indemnity allocations, and SLA uptime requirements.",
        keyFacts: [
            { label: "Risk Score", value: "Low (Standard Mutual)" },
            { label: "Indemnity Cap", value: "12-Month Fees" },
            { label: "Governing Law", value: "Jurisdiction Identified" },
            { label: "Clause Coverage", value: "100% Parsed" },
        ],
    },
];

export function DocumentMindmapSimulator({ className = "", compact = false, onDocumentSelect = null }) {
    const [selectedDocId, setSelectedDocId] = useState(DOCUMENT_PROFILES[0].id);
    const [activeTab, setActiveTab] = useState("mindmap"); // "mindmap" | "entities" | "chunks" | "audit"
    const [isSimulating, setIsSimulating] = useState(false);
    const [simStep, setSimStep] = useState(0);
    const [viewMode, setViewMode] = useState("visual"); // "visual" | "mermaid"

    const currentDoc = DOCUMENT_PROFILES.find((d) => d.id === selectedDocId) || DOCUMENT_PROFILES[0];

    const runAnalysisSimulation = () => {
        setIsSimulating(true);
        setSimStep(1);
        setTimeout(() => setSimStep(2), 600);
        setTimeout(() => setSimStep(3), 1200);
        setTimeout(() => {
            setSimStep(4);
            setIsSimulating(false);
            toast.success(`Analysis simulation completed for "${currentDoc.title}"`);
        }, 1800);
    };

    return (
        <div className={`rounded-2xl border border-[#1E1E2E] bg-[#0A0A12] overflow-hidden shadow-2xl ${className}`}>
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E1E2E] bg-[#0D0D18] px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-400 border border-indigo-500/30">
                        <Network size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-heading font-black text-sm text-white tracking-tight">
                                Document Analysis & Concept Mindmap Engine
                            </h3>
                            <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-300 border border-cyan-500/30">
                                Autonomous Offline Simulation
                            </span>
                        </div>
                        <p className="font-mono text-[11px] text-zinc-400">
                            Hierarchical concept extraction, entity relation mapping, and semantic chunk topology
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={runAnalysisSimulation}
                        disabled={isSimulating}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={13} className={isSimulating ? "animate-spin" : ""} />
                        <span>{isSimulating ? "Running Analysis…" : "Re-Simulate Analysis"}</span>
                    </button>
                </div>
            </div>

            {/* Document Profile Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-black/40 border-b border-[#1A1A24]">
                {DOCUMENT_PROFILES.map((doc) => {
                    const isSelected = doc.id === selectedDocId;
                    return (
                        <button
                            key={doc.id}
                            onClick={() => {
                                setSelectedDocId(doc.id);
                                if (onDocumentSelect) onDocumentSelect(doc);
                            }}
                            className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                                isSelected
                                    ? "bg-gradient-to-br from-indigo-950/60 to-[#0F1020] border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10"
                                    : "bg-[#0E0E16] border-[#1E1E2E] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="font-mono text-[9px] uppercase tracking-wider text-indigo-400 font-bold">
                                    {doc.type}
                                </span>
                                <span className="font-mono text-[10px] text-zinc-400 font-semibold">
                                    {doc.chunks} chunks
                                </span>
                            </div>
                            <span className="font-heading text-xs font-bold text-white truncate w-full">
                                {doc.title}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400 truncate mt-1">
                                {doc.modality}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Interactive Simulation Progress Stream */}
            <AnimatePresence>
                {isSimulating && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 py-2.5 bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-black border-b border-indigo-500/30 flex items-center justify-between text-xs font-mono"
                    >
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                            <span className="text-cyan-300 font-bold">
                                {simStep === 1 && "Stage 1: Parsing Document Page Layout & OCR Tokens…"}
                                {simStep === 2 && "Stage 2: Computing SentenceTransformers & CLIP Embeddings…"}
                                {simStep === 3 && "Stage 3: Extracting Named Entities & Concept Triples…"}
                                {simStep === 4 && "Stage 4: Assembling Hierarchical Knowledge Mindmap…"}
                            </span>
                        </div>
                        <span className="text-zinc-400 font-bold">Step {simStep}/4</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Interactive Workspace */}
            <div className="p-5 space-y-5">
                {/* Mode Selector Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A24] pb-3">
                    <div className="flex items-center gap-1.5 bg-[#0D0D18] p-1 rounded-xl border border-[#1E1E2E]">
                        <button
                            onClick={() => setActiveTab("mindmap")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                                activeTab === "mindmap"
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            <GitBranch size={13} />
                            <span>Concept Mindmap</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("entities")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                                activeTab === "entities"
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            <Hash size={13} />
                            <span>Extracted Entities</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("audit")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                                activeTab === "audit"
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            <CheckCircle2 size={13} />
                            <span>Grounded Verification</span>
                        </button>
                    </div>

                    {activeTab === "mindmap" && (
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-zinc-400">View Format:</span>
                            <div className="flex items-center bg-[#0D0D18] p-0.5 rounded-lg border border-[#1E1E2E]">
                                <button
                                    onClick={() => setViewMode("visual")}
                                    className={`px-2 py-1 rounded font-mono text-[10px] font-bold ${
                                        viewMode === "visual" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    Interactive Tree
                                </button>
                                <button
                                    onClick={() => setViewMode("mermaid")}
                                    className={`px-2 py-1 rounded font-mono text-[10px] font-bold ${
                                        viewMode === "mermaid" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    Mermaid Syntax
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tab Content 1: Mindmap */}
                {activeTab === "mindmap" && (
                    <div className="space-y-4">
                        {viewMode === "visual" ? (
                            <div className="rounded-xl border border-[#1E1E2E] bg-gradient-to-b from-[#090912] to-[#0D0D1A] p-5 shadow-inner">
                                <div className="flex items-center justify-between mb-4 border-b border-[#1A1A24] pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                                            Hierarchical Concept Hierarchy for {currentDoc.title}
                                        </span>
                                    </div>
                                    <span className="font-mono text-[10px] text-zinc-400">
                                        Grounding Score: 99.4% · Zero Cloud Leakage
                                    </span>
                                </div>

                                {/* Concept Topology Node Map */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Root Node Column */}
                                    <div className="flex flex-col justify-center items-center p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/20 text-center space-y-2">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <span className="font-mono text-[9px] uppercase tracking-wider text-indigo-400 font-bold">
                                                Document Root
                                            </span>
                                            <h4 className="font-heading font-black text-sm text-white mt-0.5">
                                                {currentDoc.title}
                                            </h4>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 font-mono leading-relaxed line-clamp-3">
                                            {currentDoc.summary}
                                        </p>
                                    </div>

                                    {/* Primary Concept Branches */}
                                    <div className="space-y-2.5">
                                        <div className="font-mono text-[10px] uppercase tracking-wider text-cyan-400 font-bold px-1">
                                            Primary Concept Branches
                                        </div>
                                        {currentDoc.entities.slice(0, 3).map((entity, idx) => (
                                            <div
                                                key={idx}
                                                className="group flex items-center justify-between p-3 rounded-xl border border-[#1E1E2E] bg-[#0E0E18] hover:border-cyan-500/40 hover:bg-[#121222] transition-all"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className="h-6 w-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold border border-cyan-500/20">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-mono text-xs font-bold text-white group-hover:text-cyan-300">
                                                        {entity}
                                                    </span>
                                                </div>
                                                <ArrowUpRight size={14} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Semantic Grounding Facts */}
                                    <div className="space-y-2.5">
                                        <div className="font-mono text-[10px] uppercase tracking-wider text-purple-400 font-bold px-1">
                                            Semantic Verification Metrics
                                        </div>
                                        {currentDoc.keyFacts.map((fact, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-3 rounded-xl border border-[#1E1E2E] bg-[#0E0E18]"
                                            >
                                                <span className="font-mono text-[11px] text-zinc-400">
                                                    {fact.label}
                                                </span>
                                                <span className="font-mono text-xs font-bold text-emerald-400">
                                                    {fact.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-[#1E1E2E] bg-[#07070E] p-4">
                                <MermaidBlock chartCode={currentDoc.mindmap} />
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Content 2: Extracted Entities */}
                {activeTab === "entities" && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {currentDoc.entities.map((entity, idx) => (
                                <div
                                    key={idx}
                                    className="p-3.5 rounded-xl border border-[#1E1E2E] bg-[#0E0E16] flex items-center justify-between hover:border-indigo-500/40 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 font-mono text-xs font-bold">
                                            #
                                        </div>
                                        <div>
                                            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                                                Entity {idx + 1}
                                            </span>
                                            <p className="font-heading text-xs font-bold text-white">{entity}</p>
                                        </div>
                                    </div>
                                    <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        Indexed
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab Content 3: Grounded Verification */}
                {activeTab === "audit" && (
                    <div className="rounded-xl border border-[#1E1E2E] bg-[#0E0E16] p-5 space-y-4">
                        <div className="flex items-center gap-3 border-b border-[#1A1A24] pb-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                                <CheckCircle2 size={16} />
                            </div>
                            <div>
                                <h4 className="font-heading text-sm font-bold text-white">
                                    Zero-Hallucination Grounding Audit
                                </h4>
                                <p className="font-mono text-[11px] text-zinc-400">
                                    All facts verified against persistent ChromaDB HNSW local chunks
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3.5 rounded-xl bg-black/40 border border-[#1E1E2E] space-y-2">
                                <span className="font-mono text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                                    Document Abstract
                                </span>
                                <p className="font-mono text-xs text-zinc-300 leading-relaxed">
                                    {currentDoc.summary}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-black/40 border border-[#1E1E2E] space-y-2">
                                <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                    Offline Privacy Certification
                                </span>
                                <p className="font-mono text-xs text-zinc-300 leading-relaxed">
                                    Document chunks reside entirely in local disk ChromaDB. No outbound HTTP requests or cloud vector syncs are executed during extraction or query time.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
export default DocumentMindmapSimulator;
