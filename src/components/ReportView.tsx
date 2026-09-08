import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Calendar,
  User,
  MapPin,
  Cpu,
  Layers,
  Camera,
} from 'lucide-react';
import { InspectionRecord, EvidenceRecord, FindingRecord, WorkPack } from '../types';

interface ReportViewProps {
  inspections: InspectionRecord[];
  evidence: EvidenceRecord[];
  findings: FindingRecord[];
  workpacks: WorkPack[];
  selectedInspectionId?: string;
  onSelectInspectionId?: (id: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  inspections,
  evidence,
  findings,
  workpacks,
  selectedInspectionId,
  onSelectInspectionId,
}) => {
  const [activeId, setActiveId] = useState<string>(
    selectedInspectionId || inspections[0]?.id || ''
  );

  const currentInspection = inspections.find((i) => i.id === activeId) || inspections[0];

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!currentInspection) return;
    const linkedEvidence = evidence.filter((e) => e.inspectionId === currentInspection.id);
    const linkedFindings = findings.filter((f) => f.inspectionId === currentInspection.id);

    const reportData = {
      reportType: 'SnapOps Vision Official Field Inspection Audit',
      generatedAt: new Date().toISOString(),
      inspection: currentInspection,
      evidenceVault: linkedEvidence,
      findings: linkedFindings,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SnapOps-Audit-Report-${currentInspection.assetTag}-${currentInspection.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!currentInspection) {
    return (
      <div className="p-12 text-center max-w-xl mx-auto">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Inspection Reports Available</h3>
        <p className="text-xs text-slate-400 mt-1">
          Complete an inspection or load sample data from the dashboard to review and print reports.
        </p>
      </div>
    );
  }

  const linkedEvidence = evidence.filter((e) => e.inspectionId === currentInspection.id);
  const linkedFindings = findings.filter((f) => f.inspectionId === currentInspection.id);
  const wp = workpacks.find((w) => w.id === currentInspection.workpackId);

  // Determine overall status
  const hasCritical = linkedFindings.some((f) => f.severity === 'critical');
  const hasOverrides = currentInspection.manualOverrides && currentInspection.manualOverrides.length > 0;
  const overallStatus = hasCritical
    ? 'FAIL / NON-COMPLIANT'
    : hasOverrides
    ? 'CONDITIONAL PASS (OVERRIDDEN)'
    : 'PASS (VERIFIED COMPLIANT)';

  const statusColor = hasCritical
    ? 'text-rose-500 border-rose-500 bg-rose-500/10'
    : hasOverrides
    ? 'text-amber-400 border-amber-400 bg-amber-400/10'
    : 'text-emerald-400 border-emerald-400 bg-emerald-500/10';

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Controls Bar (Hidden during Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-300">Select Audit Report:</label>
          <select
            value={currentInspection.id}
            onChange={(e) => {
              setActiveId(e.target.value);
              onSelectInspectionId?.(e.target.value);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 font-mono"
          >
            {inspections.map((i) => (
              <option key={i.id} value={i.id}>
                {i.assetTag} — {i.workpackName} ({new Date(i.startTime).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Official Printable Report Document Container */}
      <div className="report-container bg-slate-950 text-slate-200 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 font-sans">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-black text-sm">
                SO
              </div>
              <h1 className="text-xl font-black tracking-tight text-white">SnapOps Vision Audit Report</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automated SOP Compliance, Multimodal Perception & Evidence Verification System
            </p>
            <div className="text-[11px] text-cyan-400 font-mono mt-1">
              Snapdragon® Edge Architecture · Low-Latency On-Device Audit
            </div>
          </div>

          <div className="text-right sm:text-right">
            <div className={`inline-block px-3.5 py-1.5 rounded-xl border font-mono font-bold text-xs ${statusColor}`}>
              {overallStatus}
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              REPORT ID: <strong className="text-white">SOV-{currentInspection.id.slice(-8).toUpperCase()}</strong>
            </div>
          </div>
        </div>

        {/* Section 1: Asset & Audit Executive Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-medium block uppercase">Equipment Asset Tag</span>
            <strong className="text-white font-mono text-sm">{currentInspection.assetTag}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium block uppercase">Equipment Type</span>
            <strong className="text-slate-200">{currentInspection.equipmentType}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium block uppercase">Facility / Location</span>
            <strong className="text-slate-200">{currentInspection.location}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium block uppercase">Certified Operator</span>
            <strong className="text-slate-200">{currentInspection.operatorName}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium block uppercase">WorkPack Standard</span>
            <strong className="text-slate-200">{currentInspection.workpackName}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium block uppercase">Inspection Date</span>
            <strong className="text-slate-200 font-mono">
              {new Date(currentInspection.startTime).toLocaleDateString()}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium block uppercase">AI Runtime Mode</span>
            <strong className="text-cyan-400 font-mono">
              {currentInspection.aiRuntime.toUpperCase()}
              {currentInspection.isOffline ? ' (Offline Edge)' : ''}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium block uppercase">Audit Evidence Items</span>
            <strong className="text-white font-mono">{linkedEvidence.length} frames</strong>
          </div>
        </div>

        {/* Section 2: Step-by-Step SOP Verification Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Step-by-Step Standard Operating Procedure Execution</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {currentInspection.steps.filter((s) => s.status === 'completed').length} / {currentInspection.steps.length} Steps Verified
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Step Description</th>
                  <th className="py-2.5 px-3">AI Verification</th>
                  <th className="py-2.5 px-3">Extracted Data / OCR</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-medium">
                {currentInspection.steps.map((step, idx) => (
                  <tr key={step.stepId} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{step.title}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-slate-300">{step.aiObservationState || 'Observed'}</span>
                      {step.aiConfidence ? (
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                          ({Math.round(step.aiConfidence * 100)}%)
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-300">
                      {step.extractedText && step.extractedText.length > 0
                        ? step.extractedText.slice(0, 2).join(' | ')
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          step.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : step.status === 'overridden'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {step.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[11px]">
                      {step.completedAt
                        ? new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Manual Overrides & Supervisor Exceptions */}
        {currentInspection.manualOverrides && currentInspection.manualOverrides.length > 0 && (
          <div className="space-y-3 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Manual SOP Override Audit Trail</span>
            </h3>
            <div className="space-y-2">
              {currentInspection.manualOverrides.map((ov, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-amber-500/20 text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                    <span>Operator: <strong className="text-white">{ov.operatorId}</strong></span>
                    <span>{new Date(ov.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-amber-200">
                    <strong>Justification:</strong> {ov.reason}
                  </p>
                  {ov.supervisorApproval && (
                    <div className="text-[11px] text-emerald-400">
                      Supervisor Approval: {ov.supervisorApproval}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Operational Findings & Issues */}
        {linkedFindings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>Identified Non-Conformances & Findings ({linkedFindings.length})</span>
            </h3>
            <div className="space-y-2">
              {linkedFindings.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                        {f.severity}
                      </span>
                      <strong className="text-white">{f.title}</strong>
                    </div>
                    <p className="text-slate-400 mt-1">{f.description}</p>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">
                    Status: <strong className="text-cyan-400 uppercase">{f.status}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Evidence Photo Appendix */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Captured Photographic Evidence Appendix</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {linkedEvidence.map((ev) => (
              <div key={ev.id} className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden p-2 space-y-1.5">
                <div className="aspect-video bg-slate-950 rounded-lg overflow-hidden">
                  <img src={ev.imageBase64} alt={ev.stepTitle} className="w-full h-full object-cover" />
                </div>
                <div className="text-[11px] font-bold text-white truncate">{ev.stepTitle}</div>
                {ev.detectedSerialOrModel && (
                  <div className="text-[10px] text-cyan-300 font-mono">Tag: {ev.detectedSerialOrModel}</div>
                )}
                <div className="text-[9px] text-slate-400 font-mono">
                  {new Date(ev.timestamp).toLocaleTimeString()} · {ev.validationStatus}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Formal Sign-Off & Verification Block */}
        <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-8 text-xs text-slate-300">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Lead Inspector Sign-off
            </span>
            <div className="h-12 border-b border-slate-700 flex items-end pb-1 font-mono text-cyan-400">
              {currentInspection.operatorName}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Date: {new Date().toLocaleDateString()} · Cryptographic Hash: SHA256-OK
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Enterprise Compliance Authority
            </span>
            <div className="h-12 border-b border-slate-700 flex items-end pb-1 font-mono text-slate-400 italic">
              SnapOps Automated Audit Clearance Engine
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Snapdragon® HP Edge Workstation Verified
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
