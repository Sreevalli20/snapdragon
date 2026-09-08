import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  Filter,
  Search,
  Check,
  RotateCcw,
} from 'lucide-react';
import { FindingRecord, InspectionRecord } from '../types';

interface FindingsViewProps {
  findings: FindingRecord[];
  inspections: InspectionRecord[];
  onUpdateFindingStatus: (id: string, newStatus: 'open' | 'resolved' | 'overridden') => void;
}

export const FindingsView: React.FC<FindingsViewProps> = ({
  findings,
  inspections,
  onUpdateFindingStatus,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFindings = findings.filter((f) => {
    const matchesSeverity = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.recommendation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return {
          icon: AlertOctagon,
          classes: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        };
      case 'info':
      default:
        return {
          icon: Info,
          classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Operational Findings & Safety Deviations</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time issues detected by AI perception, rule validation failures, and manual override audit records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            Critical Issues: <strong className="text-rose-400">{findings.filter((f) => f.severity === 'critical').length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            Total Logged: <strong className="text-white">{findings.length}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search findings or recommendations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'critical', 'warning', 'info'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition-colors ${
                severityFilter === sev
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">No active findings matching criteria</h4>
          <p className="text-xs text-slate-500 mt-1">
            All inspected assets are currently within acceptable operating conditions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => {
            const sevInfo = getSeverityBadge(finding.severity);
            const Icon = sevInfo.icon;
            const linkedInsp = inspections.find((i) => i.id === finding.inspectionId);

            return (
              <div
                key={finding.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border ${sevInfo.classes}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="uppercase">{finding.severity}</span>
                    </span>
                    <h3 className="text-sm font-bold text-white">{finding.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(finding.detectedAt).toLocaleString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        finding.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : finding.status === 'overridden'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {finding.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{finding.description}</p>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2 text-xs">
                  <span className="font-bold text-cyan-400 whitespace-nowrap">Corrective Recommendation:</span>
                  <span className="text-slate-300">{finding.recommendation}</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="text-slate-400 font-mono text-[11px]">
                    {linkedInsp && (
                      <span>
                        Asset: <strong className="text-white">{linkedInsp.assetTag}</strong> ({linkedInsp.workpackName})
                      </span>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex items-center gap-2">
                    {finding.status === 'open' ? (
                      <button
                        onClick={() => onUpdateFindingStatus(finding.id, 'resolved')}
                        className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark Resolved</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateFindingStatus(finding.id, 'open')}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reopen</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
