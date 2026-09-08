import React, { useEffect, useState } from 'react';
import { ShieldCheck, Wifi, WifiOff, Cpu, User, ArrowRight, Camera, Mic, CheckCircle2, AlertCircle } from 'lucide-react';
import { AIRuntimeMode, InspectionRecord } from '../types';
import { LocalAIAdapter } from '../ai/adapters/LocalAIAdapter';
import { QualcommAIAdapter } from '../ai/adapters/QualcommAIAdapter';

interface HeaderProps {
  currentView: string;
  setCurrentView: (v: string) => void;
  activeInspection: InspectionRecord | null;
  aiRuntime: AIRuntimeMode;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  activeInspection,
  aiRuntime,
}) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [localAIStatus, setLocalAIStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [qualcommReady, setQualcommReady] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [micAvailable, setMicAvailable] = useState(false);

  useEffect(() => {
    // Check hardware availability
    const checkHardware = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCameraAvailable(devices.some(d => d.kind === 'videoinput'));
        setMicAvailable(devices.some(d => d.kind === 'audioinput'));
      } catch {
        // Permission denied or no devices
      }
    };

    // Check Local AI status
    const localAdapter = new LocalAIAdapter();
    localAdapter.initModel().then(() => {
      const status = localAdapter.getModelStatus();
      setLocalAIStatus(status.isLoaded ? 'ready' : 'failed');
    }).catch(() => setLocalAIStatus('failed'));

    // Check Qualcomm readiness
    const qualcommAdapter = new QualcommAIAdapter();
    const env = qualcommAdapter.detectSnapdragonEnvironment();
    setQualcommReady(env.isSnapdragonDevice);

    checkHardware();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, []);

  const getRuntimeBadge = () => {
    switch (aiRuntime) {
      case 'qualcomm':
        return {
          label: 'Snapdragon® AI Edge',
          desc: 'Hexagon NPU Integration Boundary',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'local':
        return {
          label: 'Local Offline Edge',
          desc: 'WASM OCR + Canvas Vision',
          color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        };
      case 'development':
      default:
        return {
          label: 'Server Multimodal AI',
          desc: 'Gemini 3.8 Flash Server API',
          color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        };
    }
  };

  const runtimeInfo = getRuntimeBadge();

  return (
    <header className="no-print h-16 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-950/50 border border-cyan-400/30">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              SnapOps <span className="text-cyan-400 font-extrabold">Vision</span>
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Snapdragon® AI Lab
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium hidden md:block">
            Multimodal Edge Inspection Copilot · SEE → UNDERSTAND → VERIFY → GUIDE → PROVE
          </p>
        </div>
      </div>

      {/* Center / Active Inspection Banner */}
      {activeInspection && currentView !== 'live' && (
        <button
          onClick={() => setCurrentView('live')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/25 transition-colors animate-pulse"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>Active Inspection: {activeInspection.assetTag}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Right status badges */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Local AI Status */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs"
          title="Local TensorFlow.js Model Status"
        >
          {localAIStatus === 'ready' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-mono text-[10px]">LOCAL AI</span>
            </>
          ) : localAIStatus === 'loading' ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-amber-300 font-mono text-[10px]">LOADING</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 font-mono text-[10px]">OFFLINE</span>
            </>
          )}
        </div>

        {/* Qualcomm Ready Status */}
        {aiRuntime === 'qualcomm' && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs"
            title="Snapdragon Hardware Detection"
          >
            {qualcommReady ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-mono text-[10px]">SNAPDRAGON</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 font-mono text-[10px]">X86 EMULATION</span>
              </>
            )}
          </div>
        )}

        {/* Camera Status */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs"
          title="Camera Hardware Availability"
        >
          {cameraAvailable ? (
            <>
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-mono text-[10px]">CAMERA</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 font-mono text-[10px]">NO CAM</span>
            </>
          )}
        </div>

        {/* Mic Status */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs"
          title="Microphone Hardware Availability"
        >
          {micAvailable ? (
            <>
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-mono text-[10px]">MIC</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 font-mono text-[10px]">NO MIC</span>
            </>
          )}
        </div>

        {/* Network status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300 font-mono text-[11px] hidden sm:inline">ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-mono text-[11px]">OFFLINE</span>
            </>
          )}
        </div>

        {/* Runtime Badge */}
        <div
          onClick={() => setCurrentView('settings')}
          className={`cursor-pointer px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${runtimeInfo.color}`}
          title={runtimeInfo.desc}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span className="font-semibold hidden sm:inline">{runtimeInfo.label}</span>
          <span className="sm:hidden">{aiRuntime.toUpperCase()}</span>
        </div>

        {/* Time / Operator */}
        <div className="hidden lg:flex items-center gap-3 border-l border-slate-800 pl-3 text-slate-400 text-xs font-mono">
          <span>{currentTime}</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-sans text-[11px] font-medium">Field Operator</span>
          </div>
        </div>
      </div>
    </header>
  );
};
