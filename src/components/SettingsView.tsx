import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Camera,
  Mic,
  Database,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Shield,
  Layers,
  HardDrive,
  Info,
} from 'lucide-react';
import { AIRuntimeMode } from '../types';
import { db } from '../storage/indexedDB';
import { speechSynthesizer } from '../speech/speechSynthesizer';
import { QualcommAIAdapter } from '../ai/adapters/QualcommAIAdapter';

interface SettingsViewProps {
  currentRuntime: AIRuntimeMode;
  onRuntimeChange: (mode: AIRuntimeMode) => void;
  onClearAllData: () => void;
  onSeedSampleData: () => void;
  inspectionCount: number;
  evidenceCount: number;
  findingsCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentRuntime,
  onRuntimeChange,
  onClearAllData,
  onSeedSampleData,
  inspectionCount,
  evidenceCount,
  findingsCount,
}) => {
  const [speechEnabled, setSpeechEnabled] = useState(speechSynthesizer.isEnabled());
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [qualcommAdapter] = useState(() => new QualcommAIAdapter());
  const [registeredModels, setRegisteredModels] = useState<any[]>([]);

  useEffect(() => {
    setRegisteredModels(qualcommAdapter.getRegisteredModels());
  }, [qualcommAdapter]);

  const toggleSpeech = () => {
    const next = !speechEnabled;
    speechSynthesizer.setEnabled(next);
    setSpeechEnabled(next);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>Application Settings & Snapdragon® Edge Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure active AI perception pipelines, hardware boundaries, audio feedback, and local IndexedDB audit persistence.
        </p>
      </div>

      {/* Section 1: AI Runtime Engine Architecture */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white">AI Engine Adapter Architecture</h3>
            <p className="text-xs text-slate-400">Select active provider execution layer</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Server / Development */}
          <div
            onClick={() => onRuntimeChange('development')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              currentRuntime === 'development'
                ? 'bg-indigo-500/15 border-indigo-500/80 ring-1 ring-indigo-500/40 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Development Server AI</span>
              {currentRuntime === 'development' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Full-stack backend integration utilizing Google Gemini 3.8 Flash multimodal API with enterprise SOP guidance.
            </p>
            <div className="mt-3 text-[10px] text-indigo-300 font-mono">
              Mode: Server Multimodal (API Proxy)
            </div>
          </div>

          {/* Local Edge */}
          <div
            onClick={() => onRuntimeChange('local')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              currentRuntime === 'local'
                ? 'bg-cyan-500/15 border-cyan-500/80 ring-1 ring-cyan-500/40 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Local Offline Edge</span>
              {currentRuntime === 'local' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              100% in-browser edge perception using WebAssembly OCR (Tesseract.js) and Canvas computer vision. Zero cloud latency.
            </p>
            <div className="mt-3 text-[10px] text-cyan-300 font-mono">
              Mode: In-Browser Client Edge (WASM)
            </div>
          </div>

          {/* Snapdragon / Qualcomm */}
          <div
            onClick={() => onRuntimeChange('qualcomm')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              currentRuntime === 'qualcomm'
                ? 'bg-emerald-500/15 border-emerald-500/80 ring-1 ring-emerald-500/40 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Snapdragon® AI Edge</span>
              {currentRuntime === 'qualcomm' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Clean integration interface designed for Snapdragon X Series HP PCs. Pre-configured for Qualcomm AI Hub deployment.
            </p>
            <div className="mt-3 text-[10px] text-emerald-300 font-mono">
              Mode: Hexagon NPU Integration Point
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Snapdragon AI Hub Integration Point Architecture */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Shield className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Snapdragon® AI Hub Model Target Registry</h3>
            <p className="text-xs text-slate-400">
              Clean architectural interface for Snapdragon X Series NPU acceleration (Configured outside this project phase)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {registeredModels.map((m) => (
            <div
              key={m.modelId}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <div className="font-bold text-white font-mono">{m.modelName}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID: {m.modelId} · Input: {m.inputResolution[0]}x{m.inputResolution[1]}px
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono font-semibold">
                  {m.targetHardware}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-mono font-semibold">
                  {m.quantization}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                  {m.targetRuntime}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Snapdragon-specific commands, Qualcomm AI Hub credentials, and NPU compilation runtimes are isolated inside{' '}
            <code className="text-cyan-300">QualcommAIAdapter</code>. The application core does not hardcode proprietary tokens or fake NPU speeds.
          </p>
        </div>
      </div>

      {/* Section 3: Audio & Operator Speech Guidance */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Voice Guidance & Audio Copilot</h3>
              <p className="text-xs text-slate-400">Synthesize spoken instructions and guidance during inspection</p>
            </div>
          </div>
          <button
            onClick={toggleSpeech}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-colors ${
              speechEnabled
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {speechEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          When enabled, the browser's native SpeechSynthesis engine reads each SOP instruction upon step advance and announces verified compliance or required manual overrides.
        </p>
      </div>

      {/* Section 4: IndexedDB Storage & Audit Data Management */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Local Storage & Audit Vault</h3>
            <p className="text-xs text-slate-400">IndexedDB persistence metrics and database controls</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Inspections</span>
            <strong className="text-white text-lg font-mono">{inspectionCount}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Evidence Frames</span>
            <strong className="text-white text-lg font-mono">{evidenceCount}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Logged Findings</span>
            <strong className="text-white text-lg font-mono">{findingsCount}</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={onSeedSampleData}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Industrial Sample Dataset</span>
          </button>

          {!showConfirmClear ? (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-rose-400 border border-rose-900/50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local Database</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-400 font-semibold">Delete all audit records?</span>
              <button
                onClick={() => {
                  onClearAllData();
                  setShowConfirmClear(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
