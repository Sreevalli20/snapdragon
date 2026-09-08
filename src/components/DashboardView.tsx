import React from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  WifiOff,
  Plus,
  Play,
  FileText,
  Trash2,
  Layers,
  Database,
} from 'lucide-react';
import { InspectionRecord, EvidenceRecord, FindingRecord } from '../types';

interface DashboardViewProps {
  inspections: InspectionRecord[];
  evidence: EvidenceRecord[];
  findings: FindingRecord[];
  onStartInspection: () => void;
  onSelectInspection: (inspection: InspectionRecord) => void;
  onDeleteInspection: (id: string) => void;
  onSeedSampleData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  inspections,
  evidence,
  findings,
  onStartInspection,
  onSelectInspection,
  onDeleteInspection,
  onSeedSampleData,
}) => {
  // Real calculations based strictly on stored data
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const inspectionsToday = inspections.filter((i) => new Date(i.startTime).getTime() >= todayStart).length;
  const completedInspections = inspections.filter((i) => i.status === 'completed').length;
  const requiringReview = inspections.filter(
    (i) => i.status === 'flagged' || (i.manualOverrides && i.manualOverrides.length > 0)
  ).length;
  const detectedIssues = findings.length;
  const evidenceCaptured = evidence.length;
  const offlineInspections = inspections.filter((i) => i.isOffline).length;

  // Average inspection duration in minutes
  const completedWithDurations = inspections.filter((i) => i.status === 'completed' && i.endTime);
  let avgDurationMinutes = 0;
  if (completedWithDurations.length > 0) {
    const totalMs = completedWithDurations.reduce((sum, item) => {
      const start = new Date(item.startTime).getTime();
      const end = new Date(item.endTime!).getTime();
      return sum + Math.max(0, end - start);
    }, 0);
    avgDurationMinutes = Math.round((totalMs / completedWithDurations.length / 60000) * 10) / 10;
  }

  const statCards = [
    {
      title: 'Inspections Today',
      value: inspectionsToday,
      subtitle: `${inspections.length} total logged`,
      icon: ClipboardCheck,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Completed',
      value: completedInspections,
      subtitle: `${Math.round((completedInspections / (inspections.length || 1)) * 100)}% completion rate`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Requires Review',
      value: requiringReview,
      subtitle: 'Overrides or flags flagged',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Issues Detected',
      value: detectedIssues,
      subtitle: `${findings.filter((f) => f.severity === 'critical').length} critical safety issues`,
      icon: AlertTriangle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      title: 'Avg Duration',
      value: avgDurationMinutes > 0 ? `${avgDurationMinutes}m` : '0m',
      subtitle: 'From start to sign-off',
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Evidence Captured',
      value: evidenceCaptured,
      subtitle: 'Verified frames & OCR logs',
      icon: Camera,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Offline Inspections',
      value: offlineInspections,
      subtitle: 'Local-only edge runs',
      icon: WifiOff,
      color: 'text-slate-300',
      bgColor: 'bg-slate-800/60 border-slate-700/60',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Operations & Inspection Dashboard</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Live Edge Copilot
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multimodal operations, OCR verification, and evidence persistence for Snapdragon-powered HP PCs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {inspections.length === 0 && (
            <button
              onClick={onSeedSampleData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Industrial Sample Data</span>
            </button>
          )}

          <button
            onClick={onStartInspection}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>New Inspection</span>
          </button>
        </div>
      </div>

      {/* Real Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${card.bgColor} backdrop-blur-sm flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400 truncate">{card.title}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="my-2">
                <span className="text-2xl font-black tracking-tight text-white">{card.value}</span>
              </div>
              <span className="text-[10px] text-slate-400 truncate">{card.subtitle}</span>
            </div>
          );
        })}
      </div>

      {/* Core Loop Architecture Banner */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Inspection Loop</span>
          <span className="text-[11px] text-cyan-400 font-mono">Snapdragon Multimodal Engine</span>
        </div>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="font-extrabold text-cyan-400 block">1. SEE</span>
            <span className="text-[10px] text-slate-400">Camera / Mic</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="font-extrabold text-blue-400 block">2. UNDERSTAND</span>
            <span className="text-[10px] text-slate-400">OCR & Perception</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="font-extrabold text-emerald-400 block">3. VERIFY</span>
            <span className="text-[10px] text-slate-400">SOP Rule Engine</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="font-extrabold text-amber-400 block">4. GUIDE</span>
            <span className="text-[10px] text-slate-400">Real-time Audio/HUD</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="font-extrabold text-purple-400 block">5. PROVE</span>
            <span className="text-[10px] text-slate-400">Evidence & Report</span>
          </div>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Recent Inspection Records</h3>
            <span className="text-xs text-slate-400 font-mono">({inspections.length} recorded)</span>
          </div>
        </div>

        {inspections.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">No inspections logged yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Launch your first inspection with live camera, OCR, and voice copilot, or populate industrial benchmark sample records.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onStartInspection}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
              >
                Launch Live Inspection
              </button>
              <button
                onClick={onSeedSampleData}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Load Sample Data
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Asset & WorkPack</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">AI Runtime</th>
                  <th className="py-3 px-4">Evidence</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {inspections.slice(0, 10).map((item) => {
                  const getStatusBadge = (status: string) => {
                    switch (status) {
                      case 'completed':
                        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
                      case 'in_progress':
                        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 animate-pulse';
                      case 'flagged':
                        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                      default:
                        return 'bg-slate-800 text-slate-300 border-slate-700';
                    }
                  };

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white font-mono">{item.assetTag}</div>
                        <div className="text-[11px] text-slate-400">{item.workpackName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(item.status)}`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{item.operatorName}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {item.aiRuntime.toUpperCase()}
                        {item.isOffline && <span className="ml-1 text-amber-400 text-[10px]">(Offline)</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="font-mono font-semibold">{item.evidenceIds?.length || 0}</span> photos
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(item.startTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'in_progress' ? (
                            <button
                              onClick={() => onSelectInspection(item)}
                              className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
                              title="Resume Inspection"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onSelectInspection(item)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="View Report & Evidence"
                            >
                              <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteInspection(item.id)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
