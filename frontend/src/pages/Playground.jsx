import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BrainCircuit, Play, RefreshCw, Sliders, Sparkles, Code2, Cpu, Loader2, Copy, Check,
    FileText, Download, CheckCircle2, ArrowRight, BookOpen, Briefcase, Zap, HelpCircle,
    Activity, Gauge, Terminal, Layers, Compass, Eye, X, Box, FileSpreadsheet, ShieldAlert, CheckSquare
} from "lucide-react";
import api, { API, getToken } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Markdown } from "@/components/Markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { NeuralSynapse3D } from "@/components/NeuralSynapse3D";
import { TokenAttentionSimulator } from "@/components/TokenAttentionSimulator";
import { DocumentTaskSimulator3D } from "@/components/DocumentTaskSimulator3D";

const PERSONAS = [
    {
        id: "academic",
        name: "Academic Researcher",
        icon: BookOpen,
        color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
        desc: "Strict academic rigor with inline [S#] citations",
        system: "You are an academic researcher. Answer strictly using grounded facts from retrieved document chunks. Quote citations in [S1], [S2] format.",
        temp: 0.2,
        topK: 5,
    },
    {
        id: "coding_specialist",
        name: "Algorithm & Code Architect",
        icon: Terminal,
        color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
        desc: "Optimal algorithms, clean code & Big-O complexity",
        system: "You are an elite software architect and algorithm expert. Write production-grade code with Time & Space Complexity (Big-O analysis) and edge-case handling.",
        temp: 0.1,
        topK: 4,
    },
    {
        id: "executive",
        name: "Executive Briefing",
        icon: Briefcase,
        color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
        desc: "High-level bulleted briefing for leadership",
        system: "You are an executive briefing assistant. Provide a concise bulleted executive summary of the retrieved document chunks.",
        temp: 0.4,
        topK: 8,
    },
    {
        id: "tech_spec",
        name: "Technical Spec Extractor",
        icon: Code2,
        color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
        desc: "Extracts API schemas, specs & visual diagrams",
        system: "Extract technical specifications, API schemas, and mermaid architecture diagrams from retrieved context. Output clean markdown.",
        temp: 0.1,
        topK: 5,
    },
    {
        id: "general",
        name: "General Synthesis",
        icon: Zap,
        color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
        desc: "Balanced multi-modal synthesis across documents",
        system: "Synthesize insights across all retrieved text and visual document chunks into an engaging explanatory answer with visual charts if applicable.",
        temp: 0.5,
        topK: 6,
    },
];

const DOCUMENT_TASKS = [
    {
        id: "financial",
        title: "Financial Audit & Statement Extraction",
        icon: FileSpreadsheet,
        color: "from-emerald-500/20 to-cyan-500/20 border-emerald-500/40 text-emerald-300",
        badge: "P&L Ledger Task",
        desc: "Parses tabular balance sheets, validates arithmetic line totals, and verifies vendor tax identifiers.",
        pipeline: ["OCR Table Grid Matrix", "384-d Column Embedding", "Cross-Row Attention", "Balance Verification"],
        sampleQuery: "Audit the itemized invoice amounts, calculate tax breakdown, and output a structured financial table.",
        persona: "tech_spec",
        temp: 0.1,
    },
    {
        id: "tech_arch",
        title: "System Architecture & API Spec Extraction",
        icon: Code2,
        color: "from-cyan-500/20 to-indigo-500/20 border-cyan-500/40 text-cyan-300",
        badge: "Technical Blueprint Task",
        desc: "Translates technical research documents and system schematics into valid Mermaid sequence diagrams.",
        pipeline: ["Multi-Column Segmentation", "Diagram Vector Anchor", "Softmax Token Beam", "Mermaid Diagram Code"],
        sampleQuery: "Extract system architecture specifications and generate a clean Mermaid flowchart diagram of the pipeline.",
        persona: "coding_specialist",
        temp: 0.15,
    },
    {
        id: "legal",
        title: "Commercial SLA & Legal Compliance Audit",
        icon: ShieldAlert,
        color: "from-rose-500/20 to-purple-500/20 border-rose-500/40 text-rose-300",
        badge: "Contract Audit Task",
        desc: "Flags indemnification liabilities, uptime guarantees, and maximum liability caps across commercial agreements.",
        pipeline: ["Clause Parsing", "HNSW Precedent Search", "Risk Attention Scoring", "Executive Risk Brief"],
        sampleQuery: "Audit the contract terms for indemnity caps, service credits, and SLA uptime guarantees.",
        persona: "executive",
        temp: 0.25,
    },
    {
        id: "identity",
        title: "Government Credential & KYC Verification",
        icon: CheckSquare,
        color: "from-amber-500/20 to-indigo-500/20 border-amber-500/40 text-amber-300",
        badge: "Multimodal KYC Task",
        desc: "Fuses biometric facial portrait bounding boxes with alphanumeric MRZ text and cryptographic QR hashes.",
        pipeline: ["Biometric Face Anchor", "512-d CLIP Vision Patch", "MRZ Alphanumeric OCR", "Zero-Hallucination Match"],
        sampleQuery: "Extract cardholder name, identification number, and verify visible security features from the credential.",
        persona: "academic",
        temp: 0.1,
    },
];

const PRESET_QUERIES = [
    { label: "Architecture Flowchart", query: "Extract system architecture and generate a visual mermaid flowchart." },
    { label: "Algorithms & Complexity", query: "Explain the optimal algorithm with code and time/space complexity analysis." },
    { label: "Executive Summary", query: "Summarize the key findings, metrics, and actionable executive takeaways." },
    { label: "Financial Data & Chart", query: "Extract numeric values and generate a dynamic json-chart for visual distribution." },
];

export default function Playground() {
    const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
    const [activeDocTask, setActiveDocTask] = useState(DOCUMENT_TASKS[0]);
    const [systemPrompt, setSystemPrompt] = useState(PERSONAS[0].system);
    const [userPrompt, setUserPrompt] = useState(DOCUMENT_TASKS[0].sampleQuery);
    const [temp, setTemp] = useState(PERSONAS[0].temp);
    const [topK, setTopK] = useState(PERSONAS[0].topK);
    const [wText, setWText] = useState(1.0);
    const [wVisual, setWVisual] = useState(1.0);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState("");
    const [sources, setSources] = useState([]);
    const [latency, setLatency] = useState(null);
    const [copied, setCopied] = useState(false);

    const applyPersona = (p) => {
        setSelectedPersona(p);
        setSystemPrompt(p.system);
        setTemp(p.temp);
        setTopK(p.topK);
        toast.info(`Activated '${p.name}' simulator persona`);
    };

    const applyDocTask = (task) => {
        setActiveDocTask(task);
        setUserPrompt(task.sampleQuery);
        const matchedPersona = PERSONAS.find((p) => p.id === task.persona) || PERSONAS[0];
        setSelectedPersona(matchedPersona);
        setSystemPrompt(matchedPersona.system);
        setTemp(task.temp);
        toast.success(`Configured simulator for '${task.title}'`);
    };

    const runSandbox = async () => {
        if (!userPrompt.trim() || loading) return;
        setLoading(true);
        setResponse("");
        setSources([]);
        setLatency(null);

        try {
            const resp = await fetch(`${API}/chat/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ question: userPrompt, is_playground: true }),
            });
            if (!resp.ok) throw new Error("Simulator execution failed");
            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop();
                for (const part of parts) {
                    if (!part.startsWith("data: ")) continue;
                    let obj;
                    try { obj = JSON.parse(part.slice(6)); } catch { continue; }
                    if (obj.type === "meta") {
                        setSources(obj.sources || []);
                        setLatency(obj.latency);
                    } else if (obj.type === "token") {
                        setResponse((prev) => prev + obj.content);
                    } else if (obj.type === "done") {
                        setLatency(obj.latency);
                    }
                }
            }
        } catch (e) {
            toast.error("Simulator execution failed: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const copyResponse = () => {
        navigator.clipboard.writeText(response);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied markdown to clipboard!");
    };

    return (
        <AppShell>
            <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8 space-y-6">
                {/* Hero Header with 3D Synaptic Matrix Console */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 rounded-3xl border border-[#1E1E2E] glass-surface-3d p-6 shadow-2xl hud-corner">
                    <div className="lg:col-span-2 space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 font-mono text-[11px] font-extrabold text-cyan-300 shadow-lg">
                            <BrainCircuit size={14} className="text-cyan-400" />
                            <span>Neural Inference & Multi-Dimensional Simulation Lab</span>
                        </div>
                        <h1 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-white">Neural Playground</h1>
                        <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                            Simulate high-dimensional multi-layer document attention, benchmark local LLM persona activations, and visualize how RRF fusion resolves document tasks in real time.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-2 font-mono text-xs">
                            <span className="rounded-xl border border-[#252538] bg-[#12121E] px-3 py-1.5 text-zinc-300 flex items-center gap-1.5">
                                <span className="text-zinc-500">Active Task:</span>
                                <span className="font-bold text-emerald-300">{activeDocTask.badge}</span>
                            </span>
                            <span className="rounded-xl border border-[#252538] bg-[#12121E] px-3 py-1.5 text-zinc-300 flex items-center gap-1.5">
                                <span className="text-zinc-500">Persona:</span>
                                <span className="font-bold text-cyan-300">{selectedPersona.name}</span>
                            </span>
                            <span className="rounded-xl border border-[#252538] bg-[#12121E] px-3 py-1.5 text-zinc-300 flex items-center gap-1.5">
                                <span className="text-zinc-500">Temp:</span>
                                <span className="font-bold text-amber-300">{temp}</span>
                            </span>
                        </div>
                    </div>

                    <div className="lg:col-span-1 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-[#1E1E2E] pt-4 lg:pt-0 lg:pl-6">
                        <NeuralSynapse3D isRunning={loading} temperature={temp} className="w-full" />
                        <div className="text-center mt-[-8px]">
                            <span className="font-heading font-black text-xs text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                                SYNAPSE LATTICE
                                <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-amber-400 animate-ping' : 'bg-cyan-400'}`} />
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400">
                                {loading ? "FIRING NEURAL IMPULSES…" : "SYNAPSE MATRIX ARMED"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3D Multi-Layer Document Analysis Task Simulator (Three.js) */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 className="font-heading font-black text-lg text-white flex items-center gap-2">
                                <Box size={18} className="text-indigo-400" />
                                Document Manifold & Neural Attention Dimension
                            </h2>
                            <p className="font-mono text-xs text-zinc-400">
                                Interactive spatial simulation of multi-layer document parsing, vector projection, and attention ray concentration
                            </p>
                        </div>
                        <span className="rounded-full bg-indigo-500/20 px-3 py-1 font-mono text-[10px] font-extrabold text-indigo-300 border border-indigo-500/30 shrink-0 self-start sm:self-auto">
                            PROCEDURAL THREE.JS SIMULATOR
                        </span>
                    </div>

                    <DocumentTaskSimulator3D
                        activeTask={activeDocTask.id}
                        temperature={temp}
                        topK={topK}
                        isSimulating={loading}
                    />
                </div>

                {/* Visual Representation of Document Analysis Tasks */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-xs uppercase font-bold text-zinc-400 flex items-center gap-2">
                            <Layers size={14} className="text-cyan-400" />
                            Select Document Analysis Task Simulator:
                        </span>
                        <span className="font-mono text-[11px] text-zinc-500 font-bold">
                            Click to auto-tune neural manifold & persona
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {DOCUMENT_TASKS.map((task) => {
                            const IconComponent = task.icon;
                            const isActive = activeDocTask.id === task.id;
                            return (
                                <motion.div
                                    key={task.id}
                                    whileHover={{ y: -2 }}
                                    onClick={() => applyDocTask(task)}
                                    className={`cursor-pointer rounded-2xl border p-4 transition-all shadow-xl flex flex-col justify-between space-y-3 ${
                                        isActive
                                            ? `border-cyan-400 bg-gradient-to-br ${task.color} ring-1 ring-cyan-400/40 shadow-cyan-500/10`
                                            : "border-[#1E1E2E] bg-[#0E0E16] hover:bg-[#121220] hover:border-indigo-500/40"
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/60 border border-white/10 text-cyan-300">
                                                <IconComponent size={16} />
                                            </div>
                                            <span className="font-mono text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-black/50 border border-white/10 text-zinc-300">
                                                {task.badge}
                                            </span>
                                        </div>
                                        <h3 className="font-heading font-black text-xs text-white mt-2.5 leading-snug">
                                            {task.title}
                                        </h3>
                                        <p className="font-mono text-[10px] text-zinc-400 mt-1 leading-relaxed">
                                            {task.desc}
                                        </p>
                                    </div>

                                    {/* Visual Representation of Step-by-Step Implementation Pipeline */}
                                    <div className="pt-2 border-t border-white/5 space-y-1.5 font-mono text-[9px]">
                                        <span className="text-zinc-500 uppercase tracking-wider block font-bold">Task Implementation Steps:</span>
                                        <div className="flex flex-col gap-1">
                                            {task.pipeline.map((step, sIdx) => (
                                                <div key={sIdx} className="flex items-center gap-1.5 text-zinc-300">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                                                    <span className="truncate">{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* 1-Click Interactive Persona Selection Grid */}
                <div className="space-y-2">
                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 block">Select Simulator AI Persona:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {PERSONAS.map((p) => {
                            const IconComponent = p.icon;
                            const active = selectedPersona.id === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => applyPersona(p)}
                                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all shadow-xl ${
                                        active
                                            ? "border-indigo-500 bg-[#12121A] ring-1 ring-indigo-500/50 shadow-indigo-500/10"
                                            : "border-[#1A1A24] bg-[#0E0E14] hover:bg-[#12121A] hover:border-indigo-500/30"
                                    }`}
                                >
                                    <div className={`p-2 rounded-xl border ${p.color} shrink-0`}>
                                        <IconComponent size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{p.name}</p>
                                        <p className="text-[10px] font-mono text-zinc-400 mt-0.5 leading-snug line-clamp-2">{p.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Token Attention Heatmap & Synthesis Simulation Lab */}
                <TokenAttentionSimulator />

                {/* Main Split Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Controls (5 cols) */}
                    <div className="lg:col-span-5 space-y-5">
                        {/* System Prompt Instructions */}
                        <div className="rounded-2xl border border-[#1A1A24] bg-[#0E0E14] p-5 shadow-2xl space-y-3">
                            <label className="flex items-center justify-between font-mono text-xs font-bold text-white">
                                <span className="flex items-center gap-2">
                                    <Code2 size={16} className="text-indigo-400" /> Active System Persona Instructions
                                </span>
                            </label>
                            <Textarea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                rows={4}
                                className="resize-none rounded-xl border-[#1A1A24] bg-[#12121A] font-mono text-xs text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500/20"
                            />
                        </div>

                        {/* Hyperparameter Controls */}
                        <div className="rounded-2xl border border-[#1A1A24] bg-[#0E0E14] p-5 shadow-2xl space-y-4">
                            <div className="flex items-center gap-2 font-mono text-xs font-bold text-white border-b border-[#1A1A24] pb-3">
                                <Sliders size={16} className="text-indigo-400" /> Simulation Parameters
                            </div>

                            <div className="space-y-3 font-mono text-xs">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Creativity / Temperature</span>
                                        <span className="text-indigo-300 font-bold">{temp.toFixed(2)}</span>
                                    </div>
                                    <Slider value={[temp]} min={0} max={1} step={0.05} onValueChange={([v]) => setTemp(v)} />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Top-K Retrieved Chunks</span>
                                        <span className="text-indigo-300 font-bold">{topK} Chunks</span>
                                    </div>
                                    <Slider value={[topK]} min={1} max={15} step={1} onValueChange={([v]) => setTopK(v)} />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Text Path Weight (MiniLM)</span>
                                        <span className="text-indigo-300 font-bold">{wText.toFixed(1)}</span>
                                    </div>
                                    <Slider value={[wText]} min={0} max={3} step={0.1} onValueChange={([v]) => setWText(v)} />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Visual Path Weight (CLIP)</span>
                                        <span className="text-amber-300 font-bold">{wVisual.toFixed(1)}</span>
                                    </div>
                                    <Slider value={[wVisual]} min={0} max={3} step={0.1} onValueChange={([v]) => setWVisual(v)} />
                                </div>
                            </div>
                        </div>

                        {/* Test Question Box & Presets */}
                        <div className="rounded-2xl border border-[#1A1A24] bg-[#0E0E14] p-5 shadow-2xl space-y-3.5">
                            <div className="flex items-center justify-between">
                                <label className="font-mono text-xs font-bold text-white block">Test Simulation Query</label>
                                <span className="text-[10px] font-mono text-indigo-400 font-bold">1-Click Benchmark Presets</span>
                            </div>

                            {/* Preset Chips */}
                            <div className="flex flex-wrap gap-1.5">
                                {PRESET_QUERIES.map((pq, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setUserPrompt(pq.query)}
                                        className="rounded-lg border border-[#222234] bg-[#12121A] px-2.5 py-1 text-[10px] font-mono font-medium text-zinc-300 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all text-left"
                                    >
                                        ⚡ {pq.label}
                                    </button>
                                ))}
                            </div>

                            <Textarea
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                rows={3}
                                placeholder="Enter prompt to benchmark…"
                                className="resize-none rounded-xl border-[#1A1A24] bg-[#12121A] font-mono text-xs text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500/20"
                            />
                            <Button
                                onClick={runSandbox}
                                disabled={loading || !userPrompt.trim()}
                                className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 font-bold text-xs text-white shadow-xl shadow-indigo-500/20 hover:opacity-95 transition-all gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />} Run Live Simulation
                            </Button>
                        </div>
                    </div>

                    {/* Right Results Console (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col space-y-5">
                        {/* Response Output Card */}
                        <div className="flex-1 rounded-2xl border border-[#1A1A24] bg-[#0E0E14] p-6 shadow-2xl flex flex-col justify-between space-y-4 min-h-[420px]">
                            <div className="flex items-center justify-between border-b border-[#1A1A24] pb-3.5">
                                <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                                    <Sparkles size={16} className="text-indigo-400" /> Simulated AI Response Stream
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                                        Interactive Markdown & Diagrams
                                    </span>
                                </div>
                                {response && (
                                    <button
                                        onClick={copyResponse}
                                        className="flex items-center gap-1.5 rounded-lg border border-[#1A1A24] bg-[#12121A] px-2.5 py-1 font-mono text-[10px] text-zinc-300 hover:text-white"
                                    >
                                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                        <span>{copied ? "Copied" : "Copy Output"}</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto max-h-[480px] space-y-3 font-mono text-xs leading-relaxed text-zinc-200">
                                {loading && !response && (
                                    <div className="flex flex-col items-center justify-center py-24 space-y-3">
                                        <Loader2 className="animate-spin text-cyan-400" size={32} />
                                        <p className="font-mono text-xs text-zinc-400">
                                            Simulating multi-layer forward pass & RRF fusion across document context…
                                        </p>
                                    </div>
                                )}

                                {!loading && !response && (
                                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-2">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
                                            <BrainCircuit size={24} />
                                        </div>
                                        <p className="font-heading font-black text-base text-zinc-300">Simulator Standby</p>
                                        <p className="font-mono text-xs text-zinc-500 max-w-md">
                                            Select a Document Analysis Task, tweak parameters, and click "Run Live Simulation" to evaluate offline inference.
                                        </p>
                                    </div>
                                )}

                                {response && (
                                    <div className="prose prose-invert max-w-none text-xs">
                                        <Markdown content={response} />
                                    </div>
                                )}
                            </div>

                            {/* Telemetry Footer */}
                            {latency && (
                                <div className="pt-3 border-t border-[#1A1A24] flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-zinc-400">
                                    <div className="flex items-center gap-3">
                                        <span>Embed: <strong className="text-indigo-400">{latency.embedding_ms} ms</strong></span>
                                        <span>Retrieve: <strong className="text-purple-400">{latency.retrieval_ms} ms</strong></span>
                                        <span>Generate: <strong className="text-cyan-400">{latency.generation_ms} ms</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold">
                                        <CheckCircle2 size={12} /> Total Latency: {latency.total_ms} ms
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
