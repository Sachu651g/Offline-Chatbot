import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Scan, Layers, FileText, CheckCircle2, Play, RefreshCw, Sparkles,
    Eye, ShieldCheck, Box, Crosshair, Cpu, Maximize2, Hash, Terminal,
    FileSpreadsheet, Shield, ArrowUpRight
} from "lucide-react";

const SAMPLE_DOCS = [
    {
        id: "p1",
        title: "Technical Research Report.pdf",
        type: "Multi-Column Academic Paper",
        ocrScore: 99.4,
        tokens: 1420,
        blocks: [
            { id: "b1", type: "Header", label: "Title & Author Metadata", bbox: { top: 6, left: 6, width: 88, height: 16 }, text: "Offline Multimodal Retrieval-Augmented Generation Architecture (NEXUS-RAG)", conf: "99.8%", color: "border-cyan-400/90 bg-cyan-950/40 text-cyan-200" },
            { id: "b2", type: "Paragraph", label: "Abstract & Core Thesis", bbox: { top: 26, left: 6, width: 50, height: 34 }, text: "Air-gapped dual-stream retrieval fusing SentenceTransformers MiniLM-L6 (384-d) with CLIP ViT-B-32 (512-d) via Reciprocal Rank Fusion...", conf: "98.9%", color: "border-indigo-400/90 bg-indigo-950/40 text-indigo-200" },
            { id: "b3", type: "Visual Figure", label: "System Architecture Flow", bbox: { top: 26, left: 59, width: 35, height: 34 }, text: "[CLIP 512-d Visual Feature Embedding: Multi-Stage Document Ingestion & Routing]", conf: "97.5%", color: "border-amber-400/90 bg-amber-950/40 text-amber-200" },
            { id: "b4", type: "Table", label: "Empirical Latency Benchmarks", bbox: { top: 64, left: 6, width: 88, height: 30 }, text: "Encoder: MiniLM-L6 | Top-5 Recall: 94.2% | Latency: 42ms | GPU Offload: 100% | RAM Headroom: 1.95 GB", conf: "99.5%", color: "border-emerald-400/90 bg-emerald-950/40 text-emerald-200" },
        ]
    },
    {
        id: "p2",
        title: "Commercial Tax Invoice.pdf",
        type: "Financial & Structured Ledger",
        ocrScore: 99.1,
        tokens: 680,
        blocks: [
            { id: "b1", type: "Header", label: "Merchant & Invoice Metadata", bbox: { top: 6, left: 6, width: 88, height: 16 }, text: "INVOICE #NX-2026-9041 | VENDOR: NEXUS SYSTEMS INC. | DATE: 2026-10-28", conf: "99.9%", color: "border-cyan-400/90 bg-cyan-950/40 text-cyan-200" },
            { id: "b2", type: "Table", label: "Itemized Billing Schedule", bbox: { top: 26, left: 6, width: 58, height: 42 }, text: "Item 1: Enterprise Offline RAG Node ($1,200) | Item 2: Vector Acceleration Core ($450) | Subtotal: $1,650", conf: "99.2%", color: "border-emerald-400/90 bg-emerald-950/40 text-emerald-200" },
            { id: "b3", type: "Security Code", label: "Cryptographic QR Tax Seal", bbox: { top: 26, left: 67, width: 27, height: 42 }, text: "[Cryptographic GST/VAT Digital Signature - Verified Offline Against Hash NX-994]", conf: "99.7%", color: "border-purple-400/90 bg-purple-950/40 text-purple-200" },
            { id: "b4", type: "Key-Value", label: "Remittance & Total Due", bbox: { top: 72, left: 6, width: 88, height: 22 }, text: "Total Amount Due: $1,947.00 USD (Includes 18% Tax) | Payment Terms: Net 30 | Status: AUTHORIZED", conf: "99.4%", color: "border-indigo-400/90 bg-indigo-950/40 text-indigo-200" },
        ]
    },
    {
        id: "p3",
        title: "Government Identity Credential.png",
        type: "Structured Identity Document",
        ocrScore: 98.8,
        tokens: 340,
        blocks: [
            { id: "b1", type: "Header", label: "Issuing Authority Header", bbox: { top: 6, left: 8, width: 84, height: 16 }, text: "GOVERNMENT REGISTRY BUREAU / VERIFIED NATIONAL CREDENTIAL", conf: "99.6%", color: "border-cyan-400/90 bg-cyan-950/40 text-cyan-200" },
            { id: "b2", type: "Visual Figure", label: "Biometric Portrait Box", bbox: { top: 26, left: 8, width: 26, height: 44 }, text: "[Biometric Face Anchor - 512-d CLIP Visual Embedding & Holographic Seal]", conf: "99.1%", color: "border-amber-400/90 bg-amber-950/40 text-amber-200" },
            { id: "b3", type: "Key-Value", label: "Demographic Attributes", bbox: { top: 26, left: 38, width: 54, height: 44 }, text: "NAME: Prajwal Reddy | DOB: 1998-04-12 | ID NO: 4920-8819-2041 | EXPIRY: 2035", conf: "98.7%", color: "border-indigo-400/90 bg-indigo-950/40 text-indigo-200" },
            { id: "b4", type: "Security Code", label: "Machine Readable Zone (MRZ)", bbox: { top: 74, left: 8, width: 84, height: 20 }, text: "I<UTDPRAJWAL<<REDDY<<<<<<<<<<<<<<<<<< 492088192041IND9804126M3501018<<<<", conf: "99.9%", color: "border-emerald-400/90 bg-emerald-950/40 text-emerald-200" },
        ]
    }
];

export function DocumentStructureScanner({ className = "" }) {
    const [selectedDocIdx, setSelectedDocIdx] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(100);
    const [activeBlock, setActiveBlock] = useState(null);
    const [activeLayer, setActiveLayer] = useState("all");

    const doc = SAMPLE_DOCS[selectedDocIdx];

    useEffect(() => {
        setActiveBlock(doc.blocks[0]);
    }, [selectedDocIdx]);

    const runScanSimulation = () => {
        setIsScanning(true);
        setScanProgress(0);
        let p = 0;
        const interval = setInterval(() => {
            p += 10;
            setScanProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                setIsScanning(false);
            }
        }, 70);
    };

    const filteredBlocks = doc.blocks.filter(b => {
        if (activeLayer === "all") return true;
        if (activeLayer === "text") return b.type === "Header" || b.type === "Paragraph" || b.type === "Key-Value";
        if (activeLayer === "visual") return b.type === "Visual Figure" || b.type === "Photo Box" || b.type === "Security Code";
        if (activeLayer === "table") return b.type === "Table";
        return true;
    });

    return (
        <div className={`rounded-2xl border border-[#1E1E2E] bg-[#0A0A12] overflow-hidden shadow-2xl ${className}`}>
            {/* Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E1E2E] bg-[#0D0D18] px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30">
                        <Scan size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-heading font-black text-sm text-white tracking-tight">
                                Document Structure & OCR Layout Segmentation Simulation
                            </h3>
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                                Real-time Parser Lab
                            </span>
                        </div>
                        <p className="font-mono text-[11px] text-zinc-400">
                            Simulate bounding-box layout parsing, OCR token extraction, and multimodal routing
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={runScanSimulation}
                        disabled={isScanning}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={13} className={isScanning ? "animate-spin" : ""} />
                        <span>{isScanning ? `Scanning (${scanProgress}%)` : "Simulate Page Scan"}</span>
                    </button>
                </div>
            </div>

            {/* Document Selector & Layer Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A28] bg-[#08080E] px-5 py-2.5">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-zinc-500 text-[10px] font-bold">SAMPLE:</span>
                    {SAMPLE_DOCS.map((d, idx) => (
                        <button
                            key={d.id}
                            onClick={() => setSelectedDocIdx(idx)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                                selectedDocIdx === idx
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-[#10101C] text-zinc-400 hover:text-white border border-[#222234]"
                            }`}
                        >
                            {d.title}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1.5 bg-[#0D0D18] p-1 rounded-xl border border-[#1E1E2E] text-xs font-mono">
                    <span className="text-zinc-500 text-[10px] font-bold px-1.5">LAYER:</span>
                    {["all", "text", "visual", "table"].map((layer) => (
                        <button
                            key={layer}
                            onClick={() => setActiveLayer(layer)}
                            className={`px-2.5 py-0.5 rounded-lg capitalize font-bold transition-all ${
                                activeLayer === layer
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            {layer}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Interactive Stage */}
            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Visual Document Layout Canvas with Bounding Boxes */}
                <div className="lg:col-span-7 flex flex-col">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2">
                        <span className="flex items-center gap-1.5 text-zinc-300 font-bold">
                            <Crosshair size={13} className="text-cyan-400" /> Page Layout Segmentation View
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                OCR Confidence: {doc.ocrScore}%
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                                {filteredBlocks.length} Blocks Segmented
                            </span>
                        </div>
                    </div>

                    <div className="relative w-full h-[410px] rounded-2xl border border-[#252538] bg-[#07070D] p-3 overflow-hidden shadow-inner">
                        {/* Virtual Paper Surface */}
                        <div className="absolute inset-2 rounded-xl bg-[#090A12] border border-white/5 overflow-hidden shadow-2xl">
                            {/* Paper Grid Lines */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#141424_1px,transparent_1px),linear-gradient(to_bottom,#141424_1px,transparent_1px)] bg-[size:16px_16px] opacity-35 pointer-events-none" />
                            {/* Watermark Label */}
                            <div className="absolute top-2 right-3 font-mono text-[9px] text-zinc-700 uppercase tracking-widest pointer-events-none font-bold">
                                {doc.type} · 300 DPI SCAN
                            </div>
                        </div>

                        {/* Animated Laser Scanning Sweep Line */}
                        {isScanning && (
                            <motion.div
                                initial={{ top: "0%" }}
                                animate={{ top: "100%" }}
                                transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_16px_#06b6d4] z-30 pointer-events-none"
                            />
                        )}

                        {/* Simulated Document Layout Bounding Boxes (Clipped & Overlapping Text Fixed) */}
                        {filteredBlocks.map((b) => {
                            const isHovered = activeBlock?.id === b.id;
                            const isCompact = b.bbox.height <= 18;

                            return (
                                <motion.div
                                    key={b.id}
                                    onClick={() => setActiveBlock(b)}
                                    onMouseEnter={() => setActiveBlock(b)}
                                    style={{
                                        top: `${b.bbox.top}%`,
                                        left: `${b.bbox.left}%`,
                                        width: `${b.bbox.width}%`,
                                        height: `${b.bbox.height}%`,
                                        minHeight: "48px",
                                    }}
                                    className={`absolute cursor-pointer rounded-xl border-2 transition-all p-2.5 flex flex-col justify-between backdrop-blur-sm ${b.color} ${
                                        isHovered
                                            ? "ring-2 ring-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.35)] scale-[1.01] z-20"
                                            : "opacity-90 hover:opacity-100 z-10"
                                    }`}
                                >
                                    {isCompact ? (
                                        /* Compact single-row layout for shallow header boxes to prevent squishing */
                                        <div className="flex items-center justify-between gap-2 w-full h-full">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <span className="bg-black/80 px-2 py-0.5 rounded-md uppercase font-mono font-bold text-[9px] text-cyan-300 border border-white/10 shrink-0">
                                                    {b.type}
                                                </span>
                                                <span className="font-mono text-[11px] font-bold text-white truncate">
                                                    {b.label}
                                                </span>
                                            </div>
                                            <span className="font-mono text-[10px] font-extrabold text-cyan-300 bg-black/70 px-2 py-0.5 rounded border border-white/10 shrink-0">
                                                {b.conf}
                                            </span>
                                        </div>
                                    ) : (
                                        /* Multi-row layout for taller boxes */
                                        <>
                                            <div className="flex items-center justify-between text-[9px] font-mono font-bold pb-1">
                                                <span className="bg-black/80 px-2 py-0.5 rounded uppercase tracking-wider text-white border border-white/10">
                                                    {b.type}
                                                </span>
                                                <span className="text-white/90 font-extrabold bg-black/60 px-1.5 py-0.5 rounded">
                                                    {b.conf}
                                                </span>
                                            </div>
                                            <div className="space-y-0.5 min-w-0">
                                                <p className="font-mono text-[11px] font-bold text-white truncate">
                                                    {b.label}
                                                </p>
                                                <p className="font-mono text-[10px] text-zinc-300 truncate opacity-85">
                                                    {b.text}
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* Corner Crosshair Accents */}
                                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white/60 pointer-events-none" />
                                    <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white/60 pointer-events-none" />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Real-time Bounding Box Token Telemetry */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
                    <div className="rounded-xl border border-[#1E1E2E] bg-[#0E0E18] p-4 space-y-3 h-full flex flex-col justify-between shadow-md">
                        <div>
                            <div className="flex items-center justify-between border-b border-[#1A1A24] pb-2.5">
                                <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                                    <Box size={14} className="text-indigo-400" />
                                    {activeBlock ? activeBlock.label : "Active Segment Telemetry"}
                                </span>
                                <span className="font-mono text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                                    {activeBlock ? activeBlock.type : "Select Bounding Box"}
                                </span>
                            </div>

                            {activeBlock ? (
                                <div className="mt-3 space-y-2.5 font-mono text-xs">
                                    <div>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5 font-bold">
                                            Extracted Token Content
                                        </span>
                                        <p className="p-3 rounded-lg bg-black/60 border border-white/5 text-zinc-100 leading-relaxed text-xs">
                                            {activeBlock.text}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <div className="rounded-lg bg-[#12121E] p-2 border border-white/5">
                                            <span className="text-[9px] text-zinc-500 uppercase block">OCR Confidence</span>
                                            <span className="text-emerald-400 font-extrabold text-sm">{activeBlock.conf}</span>
                                        </div>
                                        <div className="rounded-lg bg-[#12121E] p-2 border border-white/5">
                                            <span className="text-[9px] text-zinc-500 uppercase block">Bounding Box [T,L,W,H]</span>
                                            <span className="text-cyan-400 font-bold text-xs">
                                                [{activeBlock.bbox.top}%, {activeBlock.bbox.left}%, {activeBlock.bbox.width}%, {activeBlock.bbox.height}%]
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-[#12121E] p-2.5 border border-white/5 space-y-1">
                                        <span className="text-[9px] text-zinc-500 uppercase block font-bold">Multimodal Ingestion Path</span>
                                        <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                                            {activeBlock.type === "Visual Figure" ? (
                                                <span className="text-amber-400 flex items-center gap-1">
                                                    <Sparkles size={12} /> CLIP ViT-B-32 Vector (512-d)
                                                </span>
                                            ) : activeBlock.type === "Table" ? (
                                                <span className="text-emerald-400 flex items-center gap-1">
                                                    <FileSpreadsheet size={12} /> Markdown Table Matrix + MiniLM (384-d)
                                                </span>
                                            ) : (
                                                <span className="text-indigo-400 flex items-center gap-1">
                                                    <FileText size={12} /> Dense SentenceTransformer (384-d)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                                    Click any bounding box above to inspect OCR tokens and coordinates.
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-[#1A1A24] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                            <span className="flex items-center gap-1">
                                <ShieldCheck size={13} className="text-emerald-400" /> Grounded Verification Active
                            </span>
                            <span className="text-zinc-500">
                                {doc.tokens} Tokens Ingested
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DocumentStructureScanner;
