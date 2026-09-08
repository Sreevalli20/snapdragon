import React, { useEffect, useState } from 'react';
import { ShieldCheck, Wifi, WifiOff, Cpu, User, ArrowRight } from 'lucide-react';
import { AIRuntimeMode, InspectionRecord } from '../types';

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
      <div className="flex items-center gap-2 sm:gap-4">
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
