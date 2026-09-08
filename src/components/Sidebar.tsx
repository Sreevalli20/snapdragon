import React from 'react';
import {
  LayoutDashboard,
  Layers,
  PlayCircle,
  Camera,
  Image as ImageIcon,
  AlertTriangle,
  FileText,
  Activity,
  Settings,
} from 'lucide-react';
import { InspectionRecord } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (v: string) => void;
  activeInspection: InspectionRecord | null;
  onOpenStartModal: () => void;
  evidenceCount: number;
  findingsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  activeInspection,
  onOpenStartModal,
  evidenceCount,
  findingsCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workpacks', label: 'WorkPacks', icon: Layers },
    {
      id: 'live',
      label: 'Live Inspection',
      icon: Camera,
      badge: activeInspection ? 'LIVE' : undefined,
      badgeColor: 'bg-cyan-500 text-slate-950 font-bold animate-pulse',
    },
    {
      id: 'evidence',
      label: 'Evidence',
      icon: ImageIcon,
      badge: evidenceCount > 0 ? evidenceCount.toString() : undefined,
      badgeColor: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'findings',
      label: 'Findings & Issues',
      icon: AlertTriangle,
      badge: findingsCount > 0 ? findingsCount.toString() : undefined,
      badgeColor: findingsCount > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-300',
    },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'performance', label: 'Performance Telemetry', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="no-print w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between flex-shrink-0 z-20">
      {/* Top Action Button */}
      <div className="p-4 border-b border-slate-900">
        <button
          onClick={onOpenStartModal}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition-all active:scale-[0.98]"
        >
          <PlayCircle className="w-4 h-4 text-slate-950" />
          <span>Start New Inspection</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-cyan-400 border border-cyan-500/30 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Snapdragon Badge & Hardware Specs Footer */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/50">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span>Hardware Target</span>
            <span className="text-cyan-400">Snapdragon®</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Optimized for HP Snapdragon X Series PC edge Copilot deployment.
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span>Hexagon NPU: Ready</span>
            <span className="text-emerald-400">Low-Latency</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
