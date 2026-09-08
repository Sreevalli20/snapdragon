import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Clock,
  Zap,
  Layers,
  Server,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { TelemetrySample, AIRuntimeMode } from '../types';
import { db } from '../storage/indexedDB';
import { QualcommAIAdapter } from '../ai/adapters/QualcommAIAdapter';

interface PerformanceViewProps {
  currentRuntime: AIRuntimeMode;
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({ currentRuntime }) => {
  const [telemetry, setTelemetry] = useState<TelemetrySample[]>([]);
  const [snapdragonEnv, setSnapdragonEnv] = useState<any>(null);
  const [snapdragonSpecs, setSnapdragonSpecs] = useState<any>(null);
  const [memoryInfo, setMemoryInfo] = useState<{ usedJSHeapSize?: number; totalJSHeapSize?: number } | null>(null);

  const loadTelemetry = async () => {
    const samples = await db.getRecentTelemetry(30);
    setTelemetry(samples);

    const qAdapter = new QualcommAIAdapter();
    setSnapdragonEnv(qAdapter.detectSnapdragonEnvironment());
    setSnapdragonSpecs(qAdapter.getHardwareSpecs());

    if (typeof window !== 'undefined' && (window.performance as any)?.memory) {
      const mem = (window.performance as any).memory;
      setMemoryInfo({
        usedJSHeapSize: Math.round(mem.usedJSHeapSize / 1024 / 1024),
        totalJSHeapSize: Math.round(mem.totalJSHeapSize / 1024 / 1024),
      });
    }
  };

  useEffect(() => {
    loadTelemetry();
    const interval = setInterval(loadTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  // Compute average latencies from real samples
  const count = telemetry.length;
  const avgAi = count > 0 ? Math.round(telemetry.reduce((s, t) => s + t.aiLatencyMs, 0) / count) : 0;
  const avgOcr = count > 0 ? Math.round(telemetry.reduce((s, t) => s + t.ocrLatencyMs, 0) / count) : 0;
  const avgCamera = count > 0 ? Math.round(telemetry.reduce((s, t) => s + t.cameraLatencyMs, 0) / count) : 16;
  const avgTotal = count > 0 ? Math.round(telemetry.reduce((s, t) => s + t.totalLatencyMs, 0) / count) : 0;
  const latest = telemetry[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Developer Telemetry & Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real measured latency, memory allocation, and Snapdragon AI Hub adapter interface (no physical NPU validation).
          </p>
        </div>

        <button
          onClick={loadTelemetry}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Latency Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>AI Inference Latency</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {latest?.aiLatencyMs || avgAi || 0} <span className="text-xs text-slate-400 font-sans">ms</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Avg: {avgAi}ms ({count} samples)</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>OCR & Text Extractions</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {latest?.ocrLatencyMs || avgOcr || 0} <span className="text-xs text-slate-400 font-sans">ms</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Avg: {avgOcr}ms</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Camera Frame Acquisition</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {latest?.cameraLatencyMs || avgCamera || 16} <span className="text-xs text-slate-400 font-sans">ms</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">~60 FPS capture clock</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total End-to-End Latency</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {latest?.totalLatencyMs || avgTotal || 0} <span className="text-xs text-slate-400 font-sans">ms</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Round-trip SOP loop</div>
        </div>
      </div>

      {/* Snapdragon AI Edge Architecture Interface (Clean integration interface prepared) */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Snapdragon® AI Edge Integration Interface
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Prepared Interface
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          The SnapOps Vision AI engine has been built with an isolated adapter boundary (<code className="text-cyan-300">QualcommAIAdapter</code>)
          ready for direct deployment on Snapdragon-powered HP PCs without rewriting application logic.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Target NPU Hardware</span>
            <strong className="text-white block font-mono">{snapdragonSpecs?.targetNPU}</strong>
            <span className="text-cyan-400 text-[10px]">Up to 45 TOPS Hexagon Engine</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Runtime Layer</span>
            <strong className="text-white block font-mono">QNN & ONNX Execution Provider</strong>
            <span className="text-emerald-400 text-[10px]">DirectML / WebNN Compliant</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Quantization Profile</span>
            <strong className="text-white block font-mono">INT8 / FP16 Mixed Precision</strong>
            <span className="text-slate-400 text-[10px]">Ultra-low thermal footprint</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Local Host Environment</span>
            <strong className="text-white block font-mono">{snapdragonEnv?.architecture}</strong>
            <span className="text-cyan-400 text-[10px]">{snapdragonEnv?.operatingSystem}</span>
          </div>
        </div>
      </div>

      {/* Memory & System Diagnostic Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-400" />
            <span>Process Memory Footprint</span>
          </h3>

          {memoryInfo ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>JS Heap Used:</span>
                <strong className="text-white font-mono">{memoryInfo.usedJSHeapSize} MB</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>JS Heap Total:</span>
                <strong className="text-slate-400 font-mono">{memoryInfo.totalJSHeapSize} MB</strong>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.round(((memoryInfo.usedJSHeapSize || 1) / (memoryInfo.totalJSHeapSize || 100)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              V8 heap metrics are available in Chromium-based browsers.
            </p>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Active AI Pipeline Mode</span>
          </h3>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div>
              Current Mode: <strong className="text-cyan-400 font-mono">{currentRuntime.toUpperCase()}</strong>
            </div>
            <div>
              Network Fallback: <span className="text-emerald-400">Supported (Automatic Offline Degradation)</span>
            </div>
            <div>
              Telemetry Persistence: <span className="text-white">IndexedDB Telemetry Store</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real Recent Telemetry Samples Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Real Inference Latency Log ({telemetry.length} samples)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Live In-Session Telemetry</span>
        </div>

        {telemetry.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No telemetry recorded yet. Frames analyzed during live inspection will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Runtime</th>
                  <th className="py-2.5 px-3">Camera</th>
                  <th className="py-2.5 px-3">AI Engine</th>
                  <th className="py-2.5 px-3">OCR</th>
                  <th className="py-2.5 px-3">Total Roundtrip</th>
                  <th className="py-2.5 px-3">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {telemetry.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-400">
                      {new Date(t.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 text-cyan-400">{t.aiRuntime.toUpperCase()}</td>
                    <td className="py-2 px-3 text-slate-300">{t.cameraLatencyMs}ms</td>
                    <td className="py-2 px-3 text-white font-bold">{t.aiLatencyMs}ms</td>
                    <td className="py-2 px-3 text-blue-300">{t.ocrLatencyMs}ms</td>
                    <td className="py-2 px-3 text-purple-300 font-bold">{t.totalLatencyMs}ms</td>
                    <td className="py-2 px-3">
                      {t.isOffline ? (
                        <span className="text-amber-400">OFFLINE</span>
                      ) : (
                        <span className="text-emerald-400">ONLINE</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
