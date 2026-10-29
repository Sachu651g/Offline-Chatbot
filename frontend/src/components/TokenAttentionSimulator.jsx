import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Activity, Cpu, Sliders, Sparkles, RefreshCw, Zap,
    FileText, Layers, Terminal, CheckCircle2, ShieldAlert
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

const DOCUMENT_PASSAGES = [
    {
        id: "pass-rag",
        title: "Multimodal Retrieval Context Snippet",
        tokens: [
            { text: "NEXUS-RAG", weight: 0.95 },
            { text: "operates", weight: 0.15 },
            { text: "100%", weight: 0.88 },
            { text: "offline", weight: 0.92 },
            { text: "by", weight: 0.05 },
            { text: "combining", weight: 0.20 },
            { text: "MiniLM-L6", weight: 0.85 },
            { text: "dense", weight: 0.40 },
            { text: "text", weight: 0.50 },
            { text: "vectors", weight: 0.65 },
            { text: "with", weight: 0.05 },
            { text: "CLIP", weight: 0.90 },
            { text: "ViT-B-32", weight: 0.82 },
            { text: "visual", weight: 0.60 },
            { text: "features.", weight: 0.35 },
            { text: "Reciprocal", weight: 0.89 },
            { text: "Rank", weight: 0.80 },
            { text: "Fusion", weight: 0.85 },
            { text: "(RRF)", weight: 0.92 },
            { text: "merges", weight: 0.30 },
            { text: "multimodal", weight: 0.75 },
            { text: "candidate", weight: 0.45 },
            { text: "ranks", weight: 0.55 },
            { text: "into", weight: 0.05 },
            { text: "a", weight: 0.05 },
            { text: "unified", weight: 0.40 },
            { text: "grounded", weight: 0.94 },
            { text: "context.", weight: 0.30 },
        ],
        personas: {
            academic: "Strict academic summary citing MiniLM and CLIP dimensional fusion.",
            technical: "Architectural specification extracting vector sizes and RRF normalization formulas.",
            executive: "Bullet-pointed summary highlighting 100% offline air-gapped security.",
        }
    },
    {
        id: "pass-legal",
        title: "Commercial SLA & Indemnity Clause",
        tokens: [
            { text: "The", weight: 0.05 },
            { text: "Service", weight: 0.35 },
            { text: "Provider", weight: 0.40 },
            { text: "guarantees", weight: 0.70 },
            { text: "99.9%", weight: 0.95 },
            { text: "monthly", weight: 0.45 },
            { text: "uptime.", weight: 0.85 },
            { text: "In", weight: 0.05 },
            { text: "the", weight: 0.05 },
            { text: "event", weight: 0.10 },
            { text: "of", weight: 0.05 },
            { text: "unplanned", weight: 0.75 },
            { text: "downtime,", weight: 0.88 },
            { text: "service", weight: 0.40 },
            { text: "credits", weight: 0.90 },
            { text: "shall", weight: 0.65 },
            { text: "accrue", weight: 0.60 },
            { text: "at", weight: 0.05 },
            { text: "5%", weight: 0.92 },
            { text: "per", weight: 0.10 },
            { text: "hour.", weight: 0.50 },
            { text: "Maximum", weight: 0.80 },
            { text: "liability", weight: 0.94 },
            { text: "cap", weight: 0.85 },
            { text: "is", weight: 0.05 },
            { text: "limited", weight: 0.75 },
            { text: "to", weight: 0.05 },
            { text: "12", weight: 0.85 },
            { text: "months", weight: 0.70 },
            { text: "fees.", weight: 0.80 },
        ],
        personas: {
            academic: "Legal textual analysis comparing liability caps with market standards.",
            technical: "SLA parameter audit highlighting 99.9% uptime and credit thresholds.",
            executive: "Executive risk review: 12-month fee liability cap flagged.",
        }
    }
];

export function TokenAttentionSimulator({ className = "" }) {
    const [selectedPassageIdx, setSelectedPassageIdx] = useState(0);
    const [temperature, setTemperature] = useState(0.2);
    const [activePersona, setActivePersona] = useState("technical");
    const [isSimulating, setIsSimulating] = useState(false);

    const passage = DOCUMENT_PASSAGES[selectedPassageIdx];

    const getScaledWeight = (baseWeight) => {
        // Temperature scales attention sharpness: low temp = sharp focal attention, high temp = flattened/diffuse
        const tFactor = Math.max(0.1, temperature);
        const sharpened = Math.pow(baseWeight, 1 / (tFactor * 1.5));
        return Math.min(1.0, Math.max(0.05, sharpened));
    };

    const getHighlightColor = (weight) => {
        if (weight >= 0.75) return "bg-cyan-500/30 text-cyan-200 border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.4)]";
        if (weight >= 0.50) return "bg-indigo-500/25 text-indigo-200 border-indigo-400/40";
        if (weight >= 0.25) return "bg-purple-500/15 text-purple-200 border-purple-500/20";
        return "bg-zinc-800/20 text-zinc-400 border-transparent";
    };

    return (
        <div className={`rounded-2xl border border-[#1E1E2E] bg-[#0A0A12] overflow-hidden shadow-2xl ${className}`}>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E1E2E] bg-[#0D0D18] px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-400 border border-indigo-500/30">
                        <Activity size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-heading font-black text-sm text-white tracking-tight">
                                Token Attention Heatmap & Synthesis Simulation
                            </h3>
                            <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-300 border border-cyan-500/30">
                                Neural Attention Lab
                            </span>
                        </div>
                        <p className="font-mono text-[11px] text-zinc-400">
                            Simulate how temperature scaling and persona prompts focus attention over document tokens
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setIsSimulating(true);
                            setTimeout(() => setIsSimulating(false), 600);
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-md hover:opacity-90 transition-all"
                    >
                        <RefreshCw size={13} className={isSimulating ? "animate-spin" : ""} />
                        <span>Recompute Attention</span>
                    </button>
                </div>
            </div>

            {/* Passage Preset Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-black/40 border-b border-[#1A1A24]">
                <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-zinc-500 font-bold uppercase mr-1">Document Passage:</span>
                    {DOCUMENT_PASSAGES.map((p, idx) => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPassageIdx(idx)}
                            className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all ${
                                selectedPassageIdx === idx
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "bg-[#0E0E16] text-zinc-400 hover:text-white border border-[#1E1E2E]"
                            }`}
                        >
                            {p.title}
                        </button>
                    ))}
                </div>

                {/* Persona Switchers */}
                <div className="flex items-center gap-1.5 bg-[#0D0D18] p-1 rounded-xl border border-[#1E1E2E] text-xs font-mono">
                    <span className="text-zinc-500 text-[10px] font-bold px-1.5">PERSONA:</span>
                    {["technical", "academic", "executive"].map((persona) => (
                        <button
                            key={persona}
                            onClick={() => setActivePersona(persona)}
                            className={`px-2.5 py-0.5 rounded-lg capitalize font-bold transition-all ${
                                activePersona === persona
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            {persona}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Interactive Stage */}
            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Interactive Token Attention Heatmap Canvas */}
                <div className="lg:col-span-8 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-1">
                        <span className="font-bold text-white flex items-center gap-1.5">
                            <Zap size={14} className="text-cyan-400" />
                            Document Token Attention Distribution
                        </span>
                        <span className="text-[10px] text-cyan-300">
                            Attention Sharpness: {temperature <= 0.3 ? "Hyper-Focused (Low Hallucination)" : "Broad & Exploratory"}
                        </span>
                    </div>

                    <div className="rounded-2xl border border-[#1E1E2E] bg-[#08080E] p-4.5 min-h-[160px] flex flex-wrap gap-1.5 shadow-inner">
                        {passage.tokens.map((tok, idx) => {
                            const scaledWeight = getScaledWeight(tok.weight);
                            const styleClass = getHighlightColor(scaledWeight);
                            return (
                                <motion.span
                                    key={idx}
                                    layout
                                    className={`px-2 py-1 rounded-lg border font-mono text-xs cursor-default transition-all duration-300 ${styleClass}`}
                                    title={`Token: "${tok.text}" | Raw: ${tok.weight.toFixed(2)} | Temperature-Scaled: ${scaledWeight.toFixed(2)}`}
                                >
                                    {tok.text}
                                </motion.span>
                            );
                        })}
                    </div>

                    {/* Simulated Synthesis Output */}
                    <div className="rounded-xl border border-indigo-500/25 bg-gradient-to-r from-indigo-950/20 via-[#0E0E18] to-black p-3.5 space-y-1.5 font-mono text-xs">
                        <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold block">
                            Simulated Persona Grounded Output ({activePersona})
                        </span>
                        <p className="text-zinc-200 text-xs leading-relaxed">
                            {passage.personas[activePersona]}
                        </p>
                    </div>
                </div>

                {/* Right: Live Hyperparameter Controls & Entropy Meter */}
                <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
                    <div className="rounded-xl border border-[#1E1E2E] bg-[#0E0E18] p-4 space-y-4">
                        <div className="border-b border-[#1A1A24] pb-2">
                            <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                                <Sliders size={14} className="text-indigo-400" />
                                Attention Hyperparameters
                            </span>
                        </div>

                        {/* Temperature Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline font-mono text-xs">
                                <span className="text-zinc-300 font-bold">Temperature: {temperature.toFixed(2)}</span>
                                <span className="text-cyan-400 text-[10px] font-bold">
                                    {temperature <= 0.2 ? "Zero-Hallucination" : "Creative"}
                                </span>
                            </div>
                            <Slider
                                value={[temperature]}
                                min={0.05}
                                max={1.0}
                                step={0.05}
                                onValueChange={([v]) => setTemperature(v)}
                            />
                            <p className="font-mono text-[10px] text-zinc-500 leading-relaxed">
                                Lower values focus attention on highest-probability grounded document tokens.
                            </p>
                        </div>

                        {/* Entropy Gauge */}
                        <div className="p-3 rounded-lg bg-black/40 border border-[#1E1E2E] space-y-1.5 font-mono text-xs">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-400">Token Sampling Entropy:</span>
                                <span className="text-emerald-400 font-bold">
                                    {(temperature * 2.8).toFixed(1)} bits/tok
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300"
                                    style={{ width: `${Math.min(100, temperature * 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 font-mono text-[10px] text-zinc-300 leading-relaxed">
                            <CheckCircle2 size={12} className="inline mr-1 text-emerald-400" />
                            Grounded prompt architecture forces Gemma 3 to reference inline citations `[S1]`, `[S2]`.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default TokenAttentionSimulator;
