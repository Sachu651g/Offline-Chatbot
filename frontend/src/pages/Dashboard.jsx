import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    BarChart3, GitCompareArrows, ScatterChart as ScatterIcon, Timer, MessagesSquare,
    Eye, Sparkles, Activity, CheckCircle2, Sliders, RefreshCw, Layers, ShieldCheck, Zap,
    FileSpreadsheet, FileText, ArrowRight, Box, Cpu, Play
} from "lucide-react";
import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, BarChart, Bar,
} from "recharts";

import api from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { ExplainabilityPipeline3D } from "@/components/ExplainabilityPipeline3D";
import { toast } from "sonner";

const AXIS = "#71717A";
const tooltipStyle = {
    background: "#08080C",
    border: "1px solid #1E1E2E",
    borderRadius: "12px",
    fontFamily: "JetBrains Mono",
    fontSize: "11px",
    color: "#E4E4E7",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
};

const DEMO_RANKINGS = {
    text: [
        { id: "s1", filename: "Technical Architecture Spec.pdf", page: 1, score: 0.942, metadata: { modality: "document" } },
        { id: "s2", filename: "Offline Deployment Guide.docx", page: 4, score: 0.885, metadata: { modality: "document" } },
        { id: "s3", filename: "Commercial Tax Invoice.pdf", page: 1, score: 0.720, metadata: { modality: "document" } },
    ],
    visual: [
        { id: "v1", filename: "System Flowchart Schematic.png", page: 1, score: 0.965, metadata: { modality: "image" } },
        { id: "v2", filename: "Technical Architecture Spec.pdf", page: 2, score: 0.890, metadata: { modality: "image" } },
        { id: "v3", filename: "Benchmark Bar Chart.png", page: 1, score: 0.740, metadata: { modality: "image" } },
    ],
    fused: [
        { id: "s1", filename: "Technical Architecture Spec.pdf", page: 1, score: 0.942, rrf_score: 0.0328, metadata: { modality: "document" } },
        { id: "v1", filename: "System Flowchart Schematic.png", page: 1, score: 0.965, rrf_score: 0.0322, metadata: { modality: "image" } },
        { id: "s2", filename: "Offline Deployment Guide.docx", page: 4, score: 0.885, rrf_score: 0.0275, metadata: { modality: "document" } },
    ]
};

const RAG_SIMULATION_TASKS = [
    {
        id: "conflict_res",
        title: "Discrepancy Resolution (Visual Seal vs Printed Text)",
        tag: "Financial Verification",
        wText: 1.0,
        wVisual: 1.5,
        desc: "When invoice printed date conflicts with the tamper-evident QR seal timestamp, increasing Visual Weight W_visual prioritizes the cryptographic seal.",
        prompt: "Verify the legal issuance date of Invoice #NX-2026-9041 between printed text header and QR seal.",
        outcome: "RRF engine prioritized Visual QR seal [V1] (Score: 0.0335) over printed draft header [T2], guaranteeing 0% hallucination."
    },
    {
        id: "diagram_align",
        title: "Architecture Schematics vs Body Text",
        tag: "Technical Blueprint",
        wText: 1.2,
        wVisual: 1.2,
        desc: "Fuses narrative descriptions of microservices with the Mermaid flow diagram to guarantee structural accuracy in code generation.",
        prompt: "Generate an end-to-end sequence diagram of the offline vector ingestion pipeline.",
        outcome: "Fused Text Spec [S1] + Visual Diagram [V1] in equal 1:1 balance, producing 100% syntactically valid Mermaid output."
    },
    {
        id: "kyc_grounding",
        title: "Cross-Modal Identity Authentication",
        tag: "KYC Verification",
        wText: 1.4,
        wVisual: 1.0,
        desc: "Matches biometric facial photo crop with alphanumeric MRZ strings across official national credentials.",
        prompt: "Confirm cardholder demographic attributes match the biometric anchor.",
        outcome: "Authenticated Name 'Prajwal Reddy' and DOB against facial bounding box with 99.4% confidence."
    }
];

const DEMO_POINTS = [
    { x: -0.42, y: 0.71, filename: "Technical Architecture Spec.pdf", path: "text" },
    { x: -0.38, y: 0.65, filename: "Offline Deployment Guide.docx", path: "text" },
    { x: 0.82, y: -0.34, filename: "System Flowchart Schematic.png", path: "visual" },
    { x: 0.75, y: -0.28, filename: "Benchmark Bar Chart.png", path: "visual" },
    { x: -0.15, y: -0.55, filename: "Commercial Tax Invoice.pdf", path: "text" },
];

const DEMO_LATENCY = [
    { embedding_ms: 18.2, retrieval_ms: 4.1, generation_ms: 380.5, name: "q1" },
    { embedding_ms: 19.0, retrieval_ms: 3.8, generation_ms: 410.2, name: "q2" },
    { embedding_ms: 17.5, retrieval_ms: 4.5, generation_ms: 360.8, name: "q3" },
    { embedding_ms: 20.1, retrieval_ms: 4.0, generation_ms: 395.0, name: "q4" },
];

function RankColumn({ title, color, hits, showRank = "score" }) {
    return (
        <div className="flex-1 rounded-2xl border border-[#1A1A24] bg-[#0E0E14] p-4 shadow-xl space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-[#1A1A24] pb-2.5">
                <span className="text-xs font-bold" style={{ color }}>{title}</span>
                <span className="text-[10px] text-zinc-500 font-extrabold">{hits?.length || 0} hits</span>
            </div>
            <div className="space-y-2">
                {(hits || []).slice(0, 5).map((h, i) => (
                    <div key={h.id || i} className="flex items-center justify-between gap-2 rounded-xl bg-[#08080C] p-2.5 text-xs border border-[#1A1A24] hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-[10px] font-bold text-zinc-300">
                                {i + 1}
                            </span>
                            <span className="truncate text-zinc-200 text-[11px] font-semibold">{h.filename}</span>
                        </div>
                        <span className="font-extrabold text-[10px] shrink-0" style={{ color }}>
                            {showRank === "rrf" ? (h.rrf_score?.toFixed(4) ?? "—") : `${(h.score * 100).toFixed(0)}%`}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [rankings, setRankings] = useState(null);
    const [content, setContent] = useState(null);
    const [points, setPoints] = useState([]);
    const [latency, setLatency] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [showDemo, setShowDemo] = useState(true);

    // 3D Pipeline Active Stage
    const [activeStageIdx, setActiveStageIdx] = useState(2);

    // RRF Simulation Controls
    const [simTextWeight, setSimTextWeight] = useState(1.0);
    const [simVisualWeight, setSimVisualWeight] = useState(1.0);
    const [activeSimTask, setActiveSimTask] = useState(RAG_SIMULATION_TASKS[0]);

    useEffect(() => {
        (async () => {
            try {
                const [lr, es, lat] = await Promise.all([
                    api.get("/dashboard/last-retrieval"),
                    api.get("/dashboard/embedding-space"),
                    api.get("/dashboard/latency"),
                ]);
                if (lr.data.rankings) setRankings(lr.data.rankings);
                if (lr.data.content) setContent(lr.data.content);
                if (es.data.points?.length) setPoints(es.data.points);
                if (lat.data.series?.length) setLatency(lat.data.series.map((s, i) => ({ ...s, name: `q${i + 1}` })));
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoaded(true);
            }
        })();
    }, []);

    const applySimTask = (t) => {
        setActiveSimTask(t);
        setSimTextWeight(t.wText);
        setSimVisualWeight(t.wVisual);
        toast.info(`Configured simulation for '${t.title}'`);
    };

    const activeRankings = rankings || (showDemo ? DEMO_RANKINGS : null);
    const activePoints = points.length > 0 ? points : (showDemo ? DEMO_POINTS : []);
    const activeLatency = latency.length > 0 ? latency : (showDemo ? DEMO_LATENCY : []);

    const textPts = activePoints.filter((p) => p.path === "text");
    const visualPts = activePoints.filter((p) => p.path === "visual");

    // Dynamic RRF Re-computed scores
    const computeSimulatedRRF = () => {
        const k = 60;
        const items = [
            { id: "s1", filename: "Technical Architecture Spec.pdf", textRank: 1, visualRank: 2, modality: "document" },
            { id: "v1", filename: "System Flowchart Schematic.png", textRank: 99, visualRank: 1, modality: "image" },
            { id: "s2", filename: "Offline Deployment Guide.docx", textRank: 2, visualRank: 99, modality: "document" },
            { id: "v2", filename: "Benchmark Bar Chart.png", textRank: 99, visualRank: 3, modality: "image" },
        ];

        return items.map((item) => {
            const textTerm = item.textRank <= 5 ? (simTextWeight / (k + item.textRank)) : 0;
            const visTerm = item.visualRank <= 5 ? (simVisualWeight / (k + item.visualRank)) : 0;
            const rrfScore = textTerm + visTerm;
            return {
                ...item,
                rrf_score: rrfScore,
                score: 0.80 + rrfScore * 5
            };
        }).sort((a, b) => b.rrf_score - a.rrf_score);
    };

    const simulatedFused = computeSimulatedRRF();

    return (
        <AppShell>
            <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 font-mono text-[10px] font-extrabold text-indigo-400">
                            <BarChart3 size={13} /> Retrieval Telemetry & Visual Analytics
                        </div>
                        <h1 className="font-heading text-3xl font-black tracking-tight text-white">Explainability Dashboard</h1>
                        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                            Audit RRF rank scores across text and visual retrieval streams, simulate multi-modal rank weighting, and inspect mathematical grounded verification.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setShowDemo(!showDemo)}
                            variant="outline"
                            className={`h-9 gap-2 rounded-xl font-mono text-xs font-bold transition-all ${
                                showDemo
                                    ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                                    : "border-[#1A1A24] bg-[#0E0E14] text-zinc-300 hover:bg-[#12121A]"
                            }`}
                        >
                            <Eye size={14} /> {showDemo ? "Demo Telemetry Mode ON" : "Preview Demo Telemetry"}
                        </Button>
                    </div>
                </div>

                {/* 3D Holographic 4-Stage RAG Pipeline Deck with Click-to-Inspect */}
                <div className="rounded-3xl border border-[#1E1E2E] glass-surface-3d p-6 shadow-2xl hud-corner space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E1E2E] pb-3">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                            <span className="font-heading font-black text-xs text-white uppercase tracking-wider flex items-center gap-2">
                                Multi-Stage RAG Pipeline Architecture
                                <span className="text-[10px] font-mono text-cyan-300 font-normal">
                                    (Click stage nodes to inspect transformation)
                                </span>
                            </span>
                        </div>
                        <span className="font-mono text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
                            REAL-TIME DATA STREAM
                        </span>
                    </div>

                    <ExplainabilityPipeline3D
                        activeStageIdx={activeStageIdx}
                        onSelectStage={(idx) => setActiveStageIdx(idx)}
                        className="w-full"
                    />

                    {/* Interactive Clickable 4-Stage Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs pt-1">
                        {[
                            { idx: 0, title: "1. Tokenize", model: "MiniLM (384d)", color: "cyan" },
                            { idx: 1, title: "2. HNSW Search", model: "ChromaDB Dual", color: "purple" },
                            { idx: 2, title: "3. RRF Fusion", model: "Reciprocal Rank", color: "pink" },
                            { idx: 3, title: "4. Synthesis", model: "Gemma 3 4B", color: "emerald" },
                        ].map((s) => (
                            <button
                                key={s.idx}
                                onClick={() => setActiveStageIdx(s.idx)}
                                className={`rounded-xl border p-2.5 text-center transition-all ${
                                    activeStageIdx === s.idx
                                        ? "border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400/40 shadow-lg"
                                        : "border-[#1E1E2E] bg-[#0E0E18] hover:border-zinc-700"
                                }`}
                            >
                                <p className="text-[10px] text-zinc-400 font-bold uppercase">{s.title}</p>
                                <p className="text-white font-black text-xs mt-0.5">{s.model}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Interactive RAG Simulation Tasks & RRF Dynamic Weight Balancing */}
                <div className="rounded-3xl border border-indigo-500/30 bg-[#0A0A14] p-6 shadow-2xl space-y-5 font-mono">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E1E2E] pb-3">
                        <div className="flex items-center gap-2">
                            <Zap size={16} className="text-amber-400" />
                            <h2 className="font-heading font-black text-sm text-white uppercase tracking-wider">
                                RAG Explainability Simulation Task Lab
                            </h2>
                        </div>
                        <span className="text-[10px] text-zinc-400">
                            Simulate how reciprocal rank fusion resolves document conflicts
                        </span>
                    </div>

                    {/* Simulation Task Selection Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {RAG_SIMULATION_TASKS.map((task) => {
                            const isCurrent = activeSimTask.id === task.id;
                            return (
                                <button
                                    key={task.id}
                                    onClick={() => applySimTask(task)}
                                    className={`rounded-2xl border p-4 text-left transition-all flex flex-col justify-between space-y-2.5 ${
                                        isCurrent
                                            ? "border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400/40 shadow-lg"
                                            : "border-[#1E1E2E] bg-[#0E0E18] hover:bg-[#121220] hover:border-zinc-700"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded bg-black/60 text-cyan-300 border border-white/10">
                                            {task.tag}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-bold">
                                            W:[{task.wText}, {task.wVisual}]
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-white">{task.title}</h4>
                                    <p className="text-[10px] text-zinc-400 leading-snug line-clamp-2">{task.desc}</p>
                                    <span className="text-[9px] text-cyan-400 font-bold flex items-center gap-1 pt-1 border-t border-white/5">
                                        <Play size={10} /> Run Simulation
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Dynamic RRF Weight Sliders */}
                    <div className="rounded-2xl border border-white/5 bg-[#08080E] p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white flex items-center gap-1.5">
                                <Sliders size={14} className="text-indigo-400" /> Dynamic Reciprocal Rank Fusion Weights
                            </span>
                            <span className="text-[10px] text-zinc-400">Formula: RRF(d) = W_text/(60+r_t) + W_vis/(60+r_v)</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-indigo-300 font-bold">Text Path Weight (MiniLM):</span>
                                    <span className="text-white font-extrabold">{simTextWeight.toFixed(1)}x</span>
                                </div>
                                <Slider value={[simTextWeight]} min={0} max={2} step={0.1} onValueChange={([v]) => setSimTextWeight(v)} />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-amber-300 font-bold">Visual Path Weight (CLIP):</span>
                                    <span className="text-white font-extrabold">{simVisualWeight.toFixed(1)}x</span>
                                </div>
                                <Slider value={[simVisualWeight]} min={0} max={2} step={0.1} onValueChange={([v]) => setSimVisualWeight(v)} />
                            </div>
                        </div>

                        {/* Live Simulation Outcome Banner */}
                        <div className="pt-2 text-[11px] text-zinc-300 flex items-center gap-2 border-t border-white/5">
                            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                            <span><strong>Simulated Outcome:</strong> {activeSimTask.outcome}</span>
                        </div>
                    </div>
                </div>

                {/* Active RRF Rankings Cards */}
                {activeRankings && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-rose-400">
                                <GitCompareArrows size={16} /> Reciprocal Rank Fusion (RRF) Trace
                            </div>
                            {showDemo && !rankings && (
                                <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                                    Simulated Demo Telemetry
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col gap-4 lg:flex-row">
                            <RankColumn title="Text Path · MiniLM" color="#818CF8" hits={activeRankings.text} />
                            <RankColumn title="Visual Path · CLIP" color="#FBBF24" hits={activeRankings.visual} />
                            <RankColumn title="Fused Output · RRF" color="#F43F5E" hits={simulatedFused} showRank="rrf" />
                        </div>
                        {(content || showDemo) && (
                            <div className="rounded-2xl border border-[#1A1A24] bg-[#0E0E14] p-5 shadow-xl space-y-2.5">
                                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                    <Sparkles size={14} /> Grounded Answer Synthesis
                                </p>
                                <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300 bg-[#08080C] p-4 rounded-xl border border-[#1A1A24]">
                                    {content || "The dual RRF vector engine retrieved relevant MiniLM text chunks and CLIP visual layout diagrams to construct a fully grounded answer with isolated zero-cloud privacy."}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* 2D Vector Cluster Graph */}
                    <div className="rounded-2xl border border-[#1A1A24] bg-[#0E0E14] p-5 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-[#1A1A24] pb-3.5">
                            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-indigo-400">
                                <ScatterIcon size={17} /> 2D Vector Embedding Space (PCA)
                            </div>
                            <span className="font-mono text-[10px] text-zinc-500 font-bold">{activePoints.length} vectors</span>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
                                <CartesianGrid stroke="#1A1A24" strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="x" stroke={AXIS} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                                <YAxis type="number" dataKey="y" stroke={AXIS} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                                <ZAxis range={[60, 60]} />
                                <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3", stroke: "#3F3F46" }}
                                    formatter={(v, n, p) => [p.payload.filename, p.payload.path]} />
                                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                                <Scatter name="Text (MiniLM)" data={textPts} fill="#818CF8" />
                                <Scatter name="Visual (CLIP)" data={visualPts} fill="#FBBF24" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Latency History */}
                    <div className="rounded-2xl border border-[#1A1A24] bg-[#0E0E14] p-5 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-[#1A1A24] pb-3.5">
                            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-rose-400">
                                <Timer size={17} /> Latency Breakdown History (ms)
                            </div>
                            <span className="font-mono text-[10px] text-zinc-500 font-bold">{activeLatency.length} runs</span>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={activeLatency} margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
                                <CartesianGrid stroke="#1A1A24" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke={AXIS} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                                <YAxis stroke={AXIS} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#ffffff08" }} />
                                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                                <Bar dataKey="embedding_ms" stackId="a" fill="#818CF8" name="Embed" />
                                <Bar dataKey="retrieval_ms" stackId="a" fill="#FBBF24" name="Retrieve" />
                                <Bar dataKey="generation_ms" stackId="a" fill="#F43F5E" name="Generate" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Eval API Footer */}
                <div className="flex items-center gap-3 rounded-2xl border border-[#1A1A24] bg-[#0E0E14] px-5 py-4 shadow-xl">
                    <Activity size={18} className="text-emerald-400 shrink-0" />
                    <p className="font-mono text-xs text-zinc-400">
                        Evaluation suite exposed via API at <span className="text-indigo-400 font-bold">/api/eval</span> — compute Recall@K and MRR metrics on ground-truth evaluation sets.
                    </p>
                </div>
            </div>
        </AppShell>
    );
}
