import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  Search,
  Plus,
  Tag,
  Shield,
  FileCheck,
} from 'lucide-react';
import { WorkPack } from '../types';

interface WorkPacksViewProps {
  workpacks: WorkPack[];
  onSelectWorkPackForInspection: (wp: WorkPack) => void;
  onSaveWorkPack: (wp: WorkPack) => void;
}

export const WorkPacksView: React.FC<WorkPacksViewProps> = ({
  workpacks,
  onSelectWorkPackForInspection,
  onSaveWorkPack,
}) => {
  const [selectedWorkpack, setSelectedWorkpack] = useState<WorkPack>(workpacks[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New WorkPack form state
  const [newWpName, setNewWpName] = useState('');
  const [newWpIndustry, setNewWpIndustry] = useState('Manufacturing');
  const [newWpDesc, setNewWpDesc] = useState('');
  const [newWpEquipment, setNewWpEquipment] = useState('');
  const [newWpStepTitle, setNewWpStepTitle] = useState('');
  const [newWpStepInstruction, setNewWpStepInstruction] = useState('');

  const industries = ['All', ...Array.from(new Set(workpacks.map((w) => w.industry)))];

  const filteredWorkpacks = workpacks.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.equipmentType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = selectedIndustry === 'All' || w.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  const handleCreateCustomWorkPack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWpName || !newWpEquipment) return;

    const customWp: WorkPack = {
      id: `wp-custom-${Date.now()}`,
      name: newWpName,
      industry: newWpIndustry,
      description: newWpDesc || 'Custom enterprise standard operating procedure.',
      equipmentType: newWpEquipment,
      version: '1.0.0',
      inspectionObjectives: [
        'Verify physical condition and asset integrity',
        'Inspect labeling and operational indicators',
        'Record verifiable evidence for audit report',
      ],
      acceptableConditions: [
        'Operating parameters within standard thresholds',
        'All safety markings clearly displayed',
      ],
      escalationConditions: [
        'Visible physical damage, overheating, or missing warning placards',
      ],
      metadata: {
        author: 'Custom Field Engineering',
        targetHardwareProfile: 'Snapdragon X Series / HP Elite Dragonfly',
        lastUpdated: new Date().toISOString().split('T')[0],
        tags: ['Custom', newWpIndustry],
      },
      steps: [
        {
          id: `step-1-${Date.now()}`,
          order: 1,
          title: newWpStepTitle || 'Initial Asset Identification',
          instruction: newWpStepInstruction || 'Frame equipment and capture overall physical condition.',
          targetArea: 'Main unit chassis',
          requiredObservations: ['Unit integrity intact'],
          requiredEvidence: true,
          requiresAIValidation: true,
          validationRules: [
            {
              id: `rule-1-${Date.now()}`,
              ruleName: 'Asset Presence',
              description: 'Confirm target equipment is in frame',
              targetComponent: newWpEquipment,
              minimumConfidence: 0.75,
              severityIfFailed: 'warning',
            },
          ],
          guidanceOnFail: 'Bring camera closer to the asset.',
          allowManualOverride: true,
        },
      ],
    };

    onSaveWorkPack(customWp);
    setSelectedWorkpack(customWp);
    setShowCreateModal(false);
    setNewWpName('');
    setNewWpEquipment('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Configurable WorkPack Library</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Data-driven SOP templates defining inspection objectives, validation rules, required evidence, and escalation logic.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Custom WorkPack</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search WorkPacks or equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {industries.map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedIndustry === ind
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: WorkPack Cards & Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: WorkPacks List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredWorkpacks.map((wp) => {
            const isSelected = selectedWorkpack?.id === wp.id;
            return (
              <div
                key={wp.id}
                onClick={() => setSelectedWorkpack(wp)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-cyan-400 tracking-wider uppercase">
                      {wp.industry}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{wp.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    v{wp.version}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{wp.description}</p>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-[11px] truncate max-w-[180px]">{wp.equipmentType}</span>
                  </div>
                  <span className="text-slate-300 font-semibold">{wp.steps.length} SOP Steps</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Selected WorkPack Breakdown */}
        {selectedWorkpack && (
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  {selectedWorkpack.industry}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedWorkpack.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedWorkpack.description}</p>
              </div>

              <button
                onClick={() => onSelectWorkPackForInspection(selectedWorkpack)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] self-start sm:self-auto flex-shrink-0"
              >
                <Play className="w-4 h-4 text-slate-950" />
                <span>Launch Inspection</span>
              </button>
            </div>

            {/* Objectives & Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Inspection Objectives
                </span>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-400">
                  {selectedWorkpack.inspectionObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Escalation Thresholds
                </span>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-400">
                  {selectedWorkpack.escalationConditions.map((cond, i) => (
                    <li key={i} className="flex items-start gap-2 text-rose-300">
                      <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span>{cond}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* SOP Steps Stepper */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Sequential SOP Execution Pipeline ({selectedWorkpack.steps.length} Steps)
                </h4>
                <span className="text-[10px] text-cyan-400 font-mono">Rule-Enforced Verification</span>
              </div>

              <div className="space-y-3">
                {selectedWorkpack.steps.map((step, index) => (
                  <div key={step.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-bold flex items-center justify-center border border-cyan-500/30">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-white">{step.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        {step.requiresAIValidation && (
                          <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold">
                            AI Perception
                          </span>
                        )}
                        {step.requiredEvidence && (
                          <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
                            Photo Evidence
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{step.instruction}</p>

                    <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <div>
                        <span className="text-slate-500">Target Area:</span>{' '}
                        <span className="text-slate-300 font-medium">{step.targetArea}</span>
                      </div>
                      {step.validationRules.length > 0 && (
                        <div>
                          <span className="text-slate-500">Validation:</span>{' '}
                          <span className="text-cyan-400 font-mono">
                            {step.validationRules[0].ruleName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Custom WorkPack */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Create Custom Enterprise WorkPack</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomWorkPack} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">WorkPack Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Battery Energy Storage Cabinet Inspection"
                  value={newWpName}
                  onChange={(e) => setNewWpName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Industry Sector</label>
                  <select
                    value={newWpIndustry}
                    onChange={(e) => setNewWpIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/60"
                  >
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Energy & Utilities">Energy & Utilities</option>
                    <option value="Facilities & HVAC">Facilities & HVAC</option>
                    <option value="Logistics & Robotics">Logistics & Robotics</option>
                    <option value="Healthcare Equipment">Healthcare Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Equipment / Asset Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lithium-Ion Battery Rack"
                    value={newWpEquipment}
                    onChange={(e) => setNewWpEquipment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of SOP procedure and safety mandate..."
                  value={newWpDesc}
                  onChange={(e) => setNewWpDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Initial SOP Step 1
                </span>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Step Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Verify Cabinet Door Seal & Warning Decal"
                    value={newWpStepTitle}
                    onChange={(e) => setNewWpStepTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Operator Instruction</label>
                  <input
                    type="text"
                    placeholder="e.g. Position camera 1 meter away to inspect high voltage warning placard."
                    value={newWpStepInstruction}
                    onChange={(e) => setNewWpStepInstruction(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
                >
                  Save & Add WorkPack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
