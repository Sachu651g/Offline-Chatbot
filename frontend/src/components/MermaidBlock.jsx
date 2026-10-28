import { useEffect, useRef, useState, useId } from "react";
import mermaid from "mermaid";
import { GitBranch, Copy, Check, Maximize2, Minimize2, Download, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";

mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true,
    theme: "dark",
    securityLevel: "loose",
    themeVariables: {
        darkMode: true,
        background: "#0A0A12",
        primaryColor: "#6366F1",
        primaryTextColor: "#FFFFFF",
        primaryBorderColor: "#818CF8",
        lineColor: "#A5B4FC",
        secondaryColor: "#1E1B4B",
        tertiaryColor: "#0F172A",
        fontFamily: "ui-monospace, monospace",
        fontSize: "13px",
    },
});

function sanitizeMermaid(raw) {
    if (!raw) return "";
    let code = raw.trim();
    code = code.replace(/^```(?:mermaid)?/i, "").replace(/```$/, "").trim();

    // Auto-quote unquoted labels containing parentheses or brackets inside square brackets:
    // e.g. A[Aadhaar Card (ShivU Bhai Adhar.jpeg)] -> A["Aadhaar Card (ShivU Bhai Adhar.jpeg)"]
    code = code.replace(/\[([^"\]\n]*\([^"\]\n]*\)[^"\]\n]*)\]/g, '["$1"]');

    // Remove any trailing semicolons inside label strings
    code = code.replace(/"([^"]*);([^"]*)"/g, '"$1 $2"');

    // Ensure diagram type header exists
    const firstLine = code.split("\n")[0]?.trim().toLowerCase() || "";
    if (
        !firstLine.startsWith("graph") &&
        !firstLine.startsWith("flowchart") &&
        !firstLine.startsWith("mindmap") &&
        !firstLine.startsWith("sequence") &&
        !firstLine.startsWith("class") &&
        !firstLine.startsWith("erdiagram") &&
        !firstLine.startsWith("state")
    ) {
        code = "graph TD\n" + code;
    }
    return code;
}

export function MermaidBlock({ chartCode }) {
    const rawId = useId().replace(/:/g, "_");
    const containerId = `mermaid_${rawId}`;
    const [svgHtml, setSvgHtml] = useState("");
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isVisible, setIsVisible] = useState(false); // Default hidden until user requests to view mindmap
    const containerRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const renderDiagram = async () => {
            if (!chartCode || !chartCode.trim()) return;
            const cleanedCode = sanitizeMermaid(chartCode);
            try {
                const uniqueId = `mermaid_svg_${Math.random().toString(36).substring(2, 9)}`;
                const { svg } = await mermaid.render(uniqueId, cleanedCode);
                if (isMounted) {
                    setSvgHtml(svg);
                    setError(null);
                }
            } catch (err) {
                // Remove any global error divs Mermaid inserts into document.body
                try {
                    document.querySelectorAll("[id^='dmermaid']").forEach((el) => el.remove());
                } catch { /* ignore */ }
                if (isMounted) {
                    setError("Diagram syntax formatting issue");
                }
            }
        };

        renderDiagram();
        return () => {
            isMounted = false;
        };
    }, [chartCode]);

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(chartCode);
            setCopied(true);
            toast.success("Copied diagram source to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };

    const downloadSvg = () => {
        if (!svgHtml) return;
        const blob = new Blob([svgHtml], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nexus_diagram_${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Downloaded diagram as SVG");
    };

    // 1. If user has not requested to see the mindmap yet, present the Mindmap Option Card
    if (!isVisible) {
        return (
            <div className="my-4 overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-[#0C0C18] via-[#0E0E1E] to-[#080812] p-4 shadow-xl backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-inner">
                            <GitBranch size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-mono text-xs font-bold text-white tracking-wide">
                                    Visual Mindmap Architecture Available
                                </h4>
                                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 font-mono text-[9px] font-extrabold text-indigo-300 border border-indigo-500/30">
                                    On-Demand
                                </span>
                            </div>
                            <p className="font-mono text-[11px] text-zinc-400 mt-0.5">
                                Would you like to view the visual mindmap diagram for this analysis?
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center font-mono">
                        <button
                            onClick={copyCode}
                            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                            title="Copy Diagram Syntax"
                        >
                            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copied ? "Copied" : "Source"}</span>
                        </button>
                        <button
                            onClick={() => setIsVisible(true)}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition-all cursor-pointer"
                        >
                            <Eye size={14} />
                            <span>View Mindmap Result</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Visible Mindmap Diagram with Collapse / Toolbar controls
    return (
        <div
            ref={containerRef}
            className={`my-5 overflow-hidden rounded-2xl border border-indigo-500/40 bg-[#0A0A14] shadow-2xl backdrop-blur-xl transition-all ${
                isFullscreen ? "fixed inset-4 z-50 flex flex-col bg-[#07070D]/95 border-indigo-500/80 shadow-2xl" : ""
            }`}
        >
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-transparent px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                        <GitBranch size={13} />
                    </div>
                    <span className="font-mono text-xs font-bold text-white tracking-wide">
                        Mindmap & Flow Architecture
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                        Visible
                    </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1 text-[11px] text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all font-bold"
                        title="Hide Mindmap"
                    >
                        <EyeOff size={12} />
                        <span>Hide Mindmap</span>
                    </button>
                    <button
                        onClick={copyCode}
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Copy Diagram Syntax"
                    >
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span className="hidden sm:inline">{copied ? "Copied" : "Source"}</span>
                    </button>
                    {svgHtml && (
                        <button
                            onClick={downloadSvg}
                            className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 hover:text-white transition-all"
                            title="Export Diagram SVG"
                        >
                            <Download size={12} />
                            <span className="hidden sm:inline">SVG</span>
                        </button>
                    )}
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
                    >
                        {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                    </button>
                </div>
            </div>

            {/* Diagram Display */}
            <div className={`overflow-auto p-4 sm:p-6 flex items-center justify-center ${isFullscreen ? "flex-1" : "min-h-[160px]"}`}>
                {error ? (
                    <div className="w-full rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 font-mono text-xs text-rose-300">
                        <p className="font-bold mb-1">Diagram render previewing / syntax error:</p>
                        <pre className="text-[11px] text-zinc-400 overflow-x-auto">{chartCode}</pre>
                    </div>
                ) : svgHtml ? (
                    <div
                        id={containerId}
                        className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto transition-transform"
                        dangerouslySetInnerHTML={{ __html: svgHtml }}
                    />
                ) : (
                    <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 animate-pulse">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                        Generating visual diagram...
                    </div>
                )}
            </div>
        </div>
    );
}

export default MermaidBlock;
