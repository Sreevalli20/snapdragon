import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { WorkPacksView } from './components/WorkPacksView';
import { LiveInspectionView } from './components/LiveInspectionView';
import { EvidenceView } from './components/EvidenceView';
import { FindingsView } from './components/FindingsView';
import { ReportView } from './components/ReportView';
import { PerformanceView } from './components/PerformanceView';
import { SettingsView } from './components/SettingsView';
import { StartInspectionModal } from './components/StartInspectionModal';

import {
  InspectionRecord,
  EvidenceRecord,
  FindingRecord,
  WorkPack,
  AIRuntimeMode,
} from './types';
import { db } from './storage/indexedDB';
import { DEFAULT_WORKPACKS } from './workpacks/defaultWorkpacks';
import { workpackStorage } from './workpacks/workpackStorage';
import { seedSampleIndustrialData } from './storage/seedData';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [workpacks, setWorkpacks] = useState<WorkPack[]>(DEFAULT_WORKPACKS);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [findings, setFindings] = useState<FindingRecord[]>([]);
  const [activeInspection, setActiveInspection] = useState<InspectionRecord | null>(null);
  const [selectedWorkpackIdForModal, setSelectedWorkpackIdForModal] = useState<string | undefined>(undefined);
  const [selectedInspectionIdForReport, setSelectedInspectionIdForReport] = useState<string | undefined>(undefined);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [aiRuntime, setAiRuntime] = useState<AIRuntimeMode>('development');

  // Load state from IndexedDB
  const refreshStorageData = useCallback(async () => {
    try {
      // 1. WorkPacks (Loaded and persisted via workpackStorage with IndexedDB + localStorage fallback)
      const storedWps = await workpackStorage.initializeWorkPacks();
      setWorkpacks(storedWps);

      // 2. Inspections
      const allInspections = await db.getAllInspections();
      
      // Auto seed sample data if empty so the app is instantly rich with real audit records
      if (allInspections.length === 0) {
        await seedSampleIndustrialData();
        const reloaded = await db.getAllInspections();
        setInspections(reloaded);
      } else {
        setInspections(allInspections);
      }

      // 3. Evidence
      const allEvidence = await db.getAllEvidence();
      setEvidence(allEvidence);

      // 4. Findings
      const allFindings = await db.getAllFindings();
      setFindings(allFindings);

      // Check if there is an in_progress inspection
      const inProgress = allInspections.find((i) => i.status === 'in_progress');
      if (inProgress) {
        setActiveInspection(inProgress);
      }
    } catch (err) {
      console.warn('Storage initial load notice:', err);
    }
  }, []);

  useEffect(() => {
    refreshStorageData();
  }, [refreshStorageData]);

  // Start Inspection handler
  const handleStartInspection = async (newInspection: InspectionRecord) => {
    await db.saveInspection(newInspection);
    setActiveInspection(newInspection);
    setInspections((prev) => [newInspection, ...prev.filter((i) => i.id !== newInspection.id)]);
    setAiRuntime(newInspection.aiRuntime);
    setCurrentView('live');
  };

  // Update inspection during live SOP progress
  const handleUpdateInspection = async (updated: InspectionRecord) => {
    await db.saveInspection(updated);
    setActiveInspection(updated.status === 'in_progress' ? updated : null);
    setInspections((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  // Evidence captured
  const handleEvidenceCaptured = (ev: EvidenceRecord) => {
    setEvidence((prev) => [ev, ...prev]);
  };

  // Finding logged
  const handleFindingLogged = async (finding: FindingRecord) => {
    await db.saveFinding(finding);
    setFindings((prev) => [finding, ...prev.filter((f) => f.id !== finding.id)]);
  };

  // Delete inspection
  const handleDeleteInspection = async (id: string) => {
    await db.deleteInspection(id);
    if (activeInspection?.id === id) {
      setActiveInspection(null);
    }
    await refreshStorageData();
  };

  // Clear all data
  const handleClearAllData = async () => {
    await db.clearAllData();
    setActiveInspection(null);
    setInspections([]);
    setEvidence([]);
    setFindings([]);
  };

  // Seed sample data
  const handleSeedSampleData = async () => {
    await seedSampleIndustrialData();
    await refreshStorageData();
  };

  // Open Start Modal with optional preselected WorkPack
  const handleOpenStartModal = (wpId?: string) => {
    setSelectedWorkpackIdForModal(wpId || workpacks[0]?.id);
    setIsStartModalOpen(true);
  };

  // Select inspection to view report
  const handleSelectInspection = (item: InspectionRecord) => {
    if (item.status === 'in_progress') {
      setActiveInspection(item);
      setCurrentView('live');
    } else {
      setSelectedInspectionIdForReport(item.id);
      setCurrentView('reports');
    }
  };

  // Active workpack for live inspection
  const activeWorkpack = activeInspection
    ? workpacks.find((w) => w.id === activeInspection.workpackId) || workpacks[0]
    : workpacks[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeInspection={activeInspection}
        aiRuntime={aiRuntime}
      />

      {/* Body: Sidebar + Main Content Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          activeInspection={activeInspection}
          onOpenStartModal={() => handleOpenStartModal()}
          evidenceCount={evidence.length}
          findingsCount={findings.length}
        />

        {/* View Router Container */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {currentView === 'dashboard' && (
            <DashboardView
              inspections={inspections}
              evidence={evidence}
              findings={findings}
              onStartInspection={() => handleOpenStartModal()}
              onSelectInspection={handleSelectInspection}
              onDeleteInspection={handleDeleteInspection}
              onSeedSampleData={handleSeedSampleData}
            />
          )}

          {currentView === 'workpacks' && (
            <WorkPacksView
              workpacks={workpacks}
              onSelectWorkPackForInspection={(wp) => handleOpenStartModal(wp.id)}
              onSaveWorkPack={async (wp) => {
                await db.saveWorkPack(wp);
                setWorkpacks((prev) => [...prev, wp]);
              }}
            />
          )}

          {currentView === 'live' && (
            activeInspection ? (
              <LiveInspectionView
                inspection={activeInspection}
                workpack={activeWorkpack}
                onUpdateInspection={handleUpdateInspection}
                onFinishInspection={() => {
                  setSelectedInspectionIdForReport(activeInspection.id);
                  setCurrentView('reports');
                }}
                onViewReports={() => {
                  setSelectedInspectionIdForReport(activeInspection.id);
                  setCurrentView('reports');
                }}
                onEvidenceCaptured={handleEvidenceCaptured}
                onFindingLogged={handleFindingLogged}
              />
            ) : (
              <div className="p-12 text-center max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
                  <span className="font-extrabold text-xl">LIVE</span>
                </div>
                <h3 className="text-base font-bold text-white">No Active Inspection in Progress</h3>
                <p className="text-xs text-slate-400">
                  Launch a live inspection to initiate camera acquisition, real-time OCR, and voice-assisted SOP guidance.
                </p>
                <button
                  onClick={() => handleOpenStartModal()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Start New Inspection
                </button>
              </div>
            )
          )}

          {currentView === 'evidence' && (
            <EvidenceView evidence={evidence} inspections={inspections} />
          )}

          {currentView === 'findings' && (
            <FindingsView
              findings={findings}
              inspections={inspections}
              onUpdateFindingStatus={async (id, status) => {
                const f = findings.find((item) => item.id === id);
                if (f) {
                  const updated = { ...f, status };
                  await db.saveFinding(updated);
                  setFindings((prev) => prev.map((item) => (item.id === id ? updated : item)));
                }
              }}
            />
          )}

          {currentView === 'reports' && (
            <ReportView
              inspections={inspections}
              evidence={evidence}
              findings={findings}
              workpacks={workpacks}
              selectedInspectionId={selectedInspectionIdForReport}
              onSelectInspectionId={(id) => setSelectedInspectionIdForReport(id)}
            />
          )}

          {currentView === 'performance' && (
            <PerformanceView currentRuntime={aiRuntime} />
          )}

          {currentView === 'settings' && (
            <SettingsView
              currentRuntime={aiRuntime}
              onRuntimeChange={(mode) => setAiRuntime(mode)}
              onClearAllData={handleClearAllData}
              onSeedSampleData={handleSeedSampleData}
              inspectionCount={inspections.length}
              evidenceCount={evidence.length}
              findingsCount={findings.length}
            />
          )}
        </main>
      </div>

      {/* Start Inspection Modal */}
      <StartInspectionModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        workpacks={workpacks}
        selectedWorkpackId={selectedWorkpackIdForModal}
        onStart={handleStartInspection}
        initialRuntime={aiRuntime}
      />
    </div>
  );
}
