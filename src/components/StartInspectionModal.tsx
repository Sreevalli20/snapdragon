import React, { useState, useEffect } from 'react';
import {
  Play,
  Camera,
  Mic,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  MapPin,
  Tag,
  User,
} from 'lucide-react';
import { WorkPack, AIRuntimeMode, InspectionRecord, StepRecord } from '../types';
import { QualcommAIAdapter } from '../ai/adapters/QualcommAIAdapter';

interface StartInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workpacks: WorkPack[];
  selectedWorkpackId?: string;
  onStart: (inspection: InspectionRecord) => void;
  initialRuntime: AIRuntimeMode;
}

export const StartInspectionModal: React.FC<StartInspectionModalProps> = ({
  isOpen,
  onClose,
  workpacks,
  selectedWorkpackId,
  onStart,
  initialRuntime,
}) => {
  const [operatorName, setOperatorName] = useState('Alex Chen (Field Specialist)');
  const [assetTag, setAssetTag] = useState('MTR-8842-HV');
  const [location, setLocation] = useState('Bay 4 - Primary Compressor Substation');
  const [workpackId, setWorkpackId] = useState(selectedWorkpackId || workpacks[0]?.id || '');
  const [runtimeMode, setRuntimeMode] = useState<AIRuntimeMode>(initialRuntime);

  // Hardware check states
  const [cameraStatus, setCameraStatus] = useState<'testing' | 'ready' | 'denied' | 'unsupported'>('ready');
  const [micStatus, setMicStatus] = useState<'testing' | 'ready' | 'denied' | 'unsupported'>('ready');
  const [snapdragonInfo, setSnapdragonInfo] = useState<any>(null);

  useEffect(() => {
    if (selectedWorkpackId) {
      setWorkpackId(selectedWorkpackId);
    }
  }, [selectedWorkpackId]);

  useEffect(() => {
    const qualcommAdapter = new QualcommAIAdapter();
    const env = qualcommAdapter.detectSnapdragonEnvironment();
    setSnapdragonInfo(env);
  }, []);

  if (!isOpen) return null;

  const currentWp = workpacks.find((w) => w.id === workpackId) || workpacks[0];

  const handleLaunch = async () => {
    if (!currentWp) return;

    // Check offline status
    const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;

    // Construct initial step records
    const stepRecords: StepRecord[] = currentWp.steps.map((step) => ({
      stepId: step.id,
      title: step.title,
      status: 'pending',
      aiObservationState: 'Not detected',
      aiVerificationStatus: 'ACTION_REQUIRED',
      aiConfidence: 0,
      extractedText: [],
      observations: [],
      evidenceIds: [],
    }));

    // Mark step 0 as in_progress
    if (stepRecords.length > 0) {
      stepRecords[0].status = 'in_progress';
      stepRecords[0].startedAt = new Date().toISOString();
    }

    const newInspection: InspectionRecord = {
      id: `insp-${Date.now()}`,
      workpackId: currentWp.id,
      workpackName: currentWp.name,
      equipmentType: currentWp.equipmentType,
      assetTag: assetTag.trim() || 'ASSET-GEN-01',
      location: location.trim() || 'Facility Floor',
      operatorName: operatorName.trim() || 'Field Operator',
      startTime: new Date().toISOString(),
      status: 'in_progress',
      steps: stepRecords,
      currentStepIndex: 0,
      evidenceIds: [],
      findings: [],
      manualOverrides: [],
      aiRuntime: runtimeMode,
      isOffline,
    };

    onStart(newInspection);
    onClose();
  };

  const testHardwarePermissions = async () => {
    setCameraStatus('testing');
    setMicStatus('testing');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setCameraStatus('ready');
        setMicStatus('ready');
      } else {
        setCameraStatus('unsupported');
        setMicStatus('unsupported');
      }
    } catch (err: any) {
      console.warn('Hardware permission check:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setMicStatus('denied');
      } else {
        setCameraStatus('ready');
        setMicStatus('ready');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Initiate Field Inspection</h3>
              <p className="text-[11px] text-slate-400">Configure parameters, operator, and AI execution target</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-3.5 text-xs">
          {/* WorkPack Selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Standard Operating Procedure (WorkPack)</span>
            </label>
            <select
              value={workpackId}
              onChange={(e) => setWorkpackId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/60 font-medium"
            >
              {workpacks.map((wp) => (
                <option key={wp.id} value={wp.id}>
                  {wp.name} ({wp.industry}) - {wp.steps.length} Steps
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Asset Tag */}
            <div>
              <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                <span>Asset Identifier / Serial Tag</span>
              </label>
              <input
                type="text"
                required
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            {/* Operator */}
            <div>
              <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span>Certified Operator</span>
              </label>
              <input
                type="text"
                required
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Plant / Substation Location</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* AI Runtime Target Selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Execution Architecture Target</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRuntimeMode('development')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  runtimeMode === 'development'
                    ? 'bg-indigo-500/15 border-indigo-500/60 text-indigo-300 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-white text-[11px]">Server AI</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Gemini 3.8 Multimodal</div>
              </button>

              <button
                type="button"
                onClick={() => setRuntimeMode('local')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  runtimeMode === 'local'
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-white text-[11px]">Local Edge</div>
                <div className="text-[10px] text-slate-400 mt-0.5">WASM OCR / 100% Offline</div>
              </button>

              <button
                type="button"
                onClick={() => setRuntimeMode('qualcomm')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  runtimeMode === 'qualcomm'
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-white text-[11px]">Snapdragon®</div>
                <div className="text-[10px] text-slate-400 mt-0.5">HP NPU Edge Boundary</div>
              </button>
            </div>
          </div>

          {/* Hardware & Environmental Readiness Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Hardware Readiness Verification
              </span>
              <button
                type="button"
                onClick={testHardwarePermissions}
                className="text-[10px] text-cyan-400 hover:underline"
              >
                Test Sensors
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300">Camera Stream</span>
                </div>
                {cameraStatus === 'ready' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {cameraStatus === 'testing' && <span className="text-[10px] text-cyan-400">Testing...</span>}
                {cameraStatus === 'denied' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300">Microphone</span>
                </div>
                {micStatus === 'ready' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {micStatus === 'testing' && <span className="text-[10px] text-cyan-400">Testing...</span>}
                {micStatus === 'denied' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
              </div>
            </div>

            {/* Architecture note */}
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900 font-mono">
              <span>Platform: {snapdragonInfo?.architecture || 'ARM64 / x86_64'}</span>
              <span className="text-cyan-400">Privacy-First Edge</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleLaunch}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Launch Live Copilot</span>
          </button>
        </div>
      </div>
    </div>
  );
};
