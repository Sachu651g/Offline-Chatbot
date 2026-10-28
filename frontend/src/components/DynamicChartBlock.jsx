import { useState, useMemo } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, Download, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

const COLORS = [
    "#6366F1", // Indigo
    "#A855F7", // Purple
    "#EC4899", // Pink
    "#10B981", // Emerald
    "#06B6D4", // Cyan
    "#F59E0B", // Amber
    "#3B82F6", // Blue
    "#8B5CF6", // Violet
];

export function DynamicChartBlock({ dataJson }) {
    const [chartType, setChartType] = useState("bar");
    const [copied, setCopied] = useState(false);

    const parsed = useMemo(() => {
        try {
            const obj = typeof dataJson === "string" ? JSON.parse(dataJson) : dataJson;
            const title = obj.title || "Visual Data Analysis";
            const type = obj.type || "bar";
            const data = Array.isArray(obj.data) ? obj.data : [];
            const xKey = obj.xKey || obj.xAxis || (data[0] ? Object.keys(data[0])[0] : "name");
            const keys = obj.keys || obj.series || (data[0] ? Object.keys(data[0]).filter((k) => k !== xKey) : ["value"]);
            return { title, type, data, xKey, keys, valid: data.length > 0 };
        } catch (e) {
            return { valid: false, error: e.message };
        }
    }, [dataJson]);

    if (!parsed.valid) {
        return null;
    }

    const { title, data, xKey, keys } = parsed;
    const activeType = chartType || parsed.type || "bar";

    const downloadCsv = () => {
        if (!data || data.length === 0) return;
        const allKeys = Object.keys(data[0]);
        const header = allKeys.join(",");
        const rows = data.map((row) => allKeys.map((k) => `"${row[k] ?? ""}"`).join(","));
        const csvContent = "\uFEFF" + [header, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, "_")}_chart.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Downloaded chart data as CSV");
    };

    const copyData = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            setCopied(true);
            toast.success("Copied chart dataset to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div className="rounded-xl border border-indigo-500/30 bg-[#0C0C16]/95 backdrop-blur-xl p-3 shadow-2xl font-mono text-xs">
                <p className="font-bold text-white mb-1.5 border-b border-white/10 pb-1">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-zinc-300">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                {entry.name}:
                            </span>
                            <span className="font-extrabold text-white">
                                {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="my-5 overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-[#0F0F1A] to-[#08080E] shadow-2xl backdrop-blur-xl transition-all hover:border-indigo-500/50">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-transparent px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-inner">
                        <Sparkles size={14} className="animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-black text-white tracking-wide font-heading">{title}</h4>
                        <p className="font-mono text-[10px] text-zinc-400">Grounded Document Data Visualizer</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs">
                    {/* View Switchers */}
                    <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5">
                        <button
                            onClick={() => setChartType("bar")}
                            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                                activeType === "bar" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-zinc-400 hover:text-white"
                            }`}
                            title="Bar Chart"
                        >
                            <BarChart3 size={12} />
                            <span className="hidden sm:inline">Bar</span>
                        </button>
                        <button
                            onClick={() => setChartType("area")}
                            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                                activeType === "area" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-zinc-400 hover:text-white"
                            }`}
                            title="Area Trend"
                        >
                            <LineIcon size={12} />
                            <span className="hidden sm:inline">Trend</span>
                        </button>
                        <button
                            onClick={() => setChartType("pie")}
                            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                                activeType === "pie" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-zinc-400 hover:text-white"
                            }`}
                            title="Donut Distribution"
                        >
                            <PieIcon size={12} />
                            <span className="hidden sm:inline">Share</span>
                        </button>
                    </div>

                    {/* Actions */}
                    <button
                        onClick={copyData}
                        className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Copy Data as JSON"
                    >
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                    <button
                        onClick={downloadCsv}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 hover:text-white transition-all shadow-sm shadow-emerald-500/20"
                        title="Export Chart Data as CSV"
                    >
                        <Download size={12} />
                        <span className="hidden sm:inline">CSV</span>
                    </button>
                </div>
            </div>

            {/* Chart Canvas */}
            <div className="h-64 sm:h-72 w-full p-4">
                <ResponsiveContainer width="100%" height="100%">
                    {activeType === "pie" ? (
                        <PieChart>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: 11, fontFamily: "monospace", paddingTop: 10 }}
                                formatter={(value) => <span className="text-zinc-300">{value}</span>}
                            />
                            <Pie
                                data={data}
                                dataKey={keys[0] || "value"}
                                nameKey={xKey}
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={85}
                                paddingAngle={3}
                                stroke="#0F0F1A"
                                strokeWidth={2}
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    ) : activeType === "area" ? (
                        <AreaChart data={data} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                            <defs>
                                {keys.map((k, i) => (
                                    <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1A1A28" vertical={false} />
                            <XAxis dataKey={xKey} stroke="#71717A" fontSize={11} tickLine={false} />
                            <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: 11, fontFamily: "monospace", paddingTop: 10 }}
                                formatter={(value) => <span className="text-zinc-300">{value}</span>}
                            />
                            {keys.map((k, i) => (
                                <Area
                                    key={k}
                                    type="monotone"
                                    dataKey={k}
                                    stroke={COLORS[i % COLORS.length]}
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill={`url(#grad-${k})`}
                                />
                            ))}
                        </AreaChart>
                    ) : (
                        <BarChart data={data} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1A1A28" vertical={false} />
                            <XAxis dataKey={xKey} stroke="#71717A" fontSize={11} tickLine={false} />
                            <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: 11, fontFamily: "monospace", paddingTop: 10 }}
                                formatter={(value) => <span className="text-zinc-300">{value}</span>}
                            />
                            {keys.map((k, i) => (
                                <Bar
                                    key={k}
                                    dataKey={k}
                                    fill={COLORS[i % COLORS.length]}
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={45}
                                />
                            ))}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default DynamicChartBlock;
