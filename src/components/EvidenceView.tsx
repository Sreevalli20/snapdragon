import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Calendar,
  Layers,
  Cpu,
} from 'lucide-react';
import { EvidenceRecord, InspectionRecord } from '../types';

interface EvidenceViewProps {
  evidence: EvidenceRecord[];
  inspections: InspectionRecord[];
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ evidence, inspections }) => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredEvidence = evidence.filter((ev) => {
    const matchesSearch =
      ev.stepTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.detectedSerialOrModel && ev.detectedSerialOrModel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.ocrExtractedText && ev.ocrExtractedText.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesStatus = statusFilter === 'ALL' || ev.validationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownload = (ev: EvidenceRecord) => {
    const link = document.createElement('a');
    link.href = ev.imageBase64;
    link.download = `evidence-${ev.id}.jpg`;
    link.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-cyan-400" />
            <span>Verifiable Evidence Vault</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable visual audit records, OCR string extractions, and operator observations stored in IndexedDB.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <span>Total Vault Records:</span>
          <strong className="text-cyan-400">{evidence.length}</strong>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by step, serial number, or OCR text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'PASS', 'WARNING', 'ACTION_REQUIRED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === status
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Gallery Grid */}
      {filteredEvidence.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">No evidence records found</h4>
          <p className="text-xs text-slate-500 mt-1">
            Capture evidence frames during live inspections to populate the audit vault.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredEvidence.map((ev) => {
            const insp = inspections.find((i) => i.id === ev.inspectionId);
            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEvidence(ev)}
                className="group rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer shadow-md flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden">
                  <img
                    src={ev.imageBase64}
                    alt={ev.stepTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-md ${
                        ev.validationStatus === 'PASS'
                          ? 'bg-emerald-500 text-slate-950'
                          : ev.validationStatus === 'WARNING'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {ev.validationStatus}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate">{ev.stepTitle}</h4>
                    {insp && (
                      <span className="text-[11px] text-cyan-400 font-mono block mt-0.5">
                        {insp.assetTag}
                      </span>
                    )}
                  </div>

                  {ev.detectedSerialOrModel && (
                    <div className="text-[10px] text-slate-300 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 truncate">
                      SN: {ev.detectedSerialOrModel}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-mono">{Math.round(ev.confidence * 100)}% conf</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Detail Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">EVIDENCE ID: {selectedEvidence.id}</span>
                <h3 className="text-sm font-bold text-white">{selectedEvidence.stepTitle}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(selectedEvidence)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* High-res Image */}
            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={selectedEvidence.imageBase64}
                alt="Captured Evidence"
                className="w-full max-h-96 object-contain"
              />
            </div>

            {/* Details breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Perception & OCR Extractions
                </span>
                {selectedEvidence.detectedSerialOrModel && (
                  <div className="text-cyan-300 font-mono font-bold">
                    Detected Tag: {selectedEvidence.detectedSerialOrModel}
                  </div>
                )}
                {selectedEvidence.ocrExtractedText.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedEvidence.ocrExtractedText.map((txt, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300">
                        {txt}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">No text extracted from frame.</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Metadata & Compliance
                </span>
                <div className="space-y-1 text-slate-300">
                  <div>Timestamp: <strong className="text-white font-mono">{new Date(selectedEvidence.timestamp).toLocaleString()}</strong></div>
                  <div>AI Runtime: <strong className="text-cyan-400 font-mono">{selectedEvidence.aiRuntime.toUpperCase()}</strong></div>
                  <div>Validation: <strong className="text-emerald-400">{selectedEvidence.validationStatus}</strong></div>
                  <div>Confidence: <strong className="text-white font-mono">{Math.round(selectedEvidence.confidence * 100)}%</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
