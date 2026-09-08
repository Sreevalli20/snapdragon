export type ObservationState = 'Detected' | 'Likely' | 'Uncertain' | 'Not detected';
export type VerificationStatus = 'PASS' | 'WARNING' | 'ACTION_REQUIRED';
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped' | 'overridden';
export type AIRuntimeMode = 'development' | 'local' | 'qualcomm';
export type FindingSeverity = 'critical' | 'warning' | 'info';

export interface ValidationRule {
  id: string;
  ruleName: string;
  description: string;
  requiredKeywordRegex?: string;
  requiredLabelText?: string;
  targetComponent?: string;
  minimumConfidence?: number;
  severityIfFailed: FindingSeverity;
}

export interface SOPStep {
  id: string;
  order: number;
  title: string;
  instruction: string;
  targetArea: string;
  requiredObservations: string[];
  requiredEvidence: boolean;
  requiresAIValidation: boolean;
  validationRules: ValidationRule[];
  guidanceOnFail: string;
  allowManualOverride: boolean;
}

export interface WorkPack {
  id: string;
  name: string;
  industry: string;
  description: string;
  equipmentType: string;
  version: string;
  inspectionObjectives: string[];
  steps: SOPStep[];
  acceptableConditions: string[];
  escalationConditions: string[];
  metadata: {
    author: string;
    targetHardwareProfile: string;
    lastUpdated: string;
    tags: string[];
  };
}

export interface StepRecord {
  stepId: string;
  title: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  aiObservationState: ObservationState;
  aiVerificationStatus: VerificationStatus;
  aiConfidence: number;
  extractedText: string[];
  observations: string[];
  evidenceIds: string[];
  override?: ManualOverride;
}

export interface ManualOverride {
  stepId: string;
  operatorId: string;
  timestamp: string;
  reason: string;
  supervisorApproval?: string;
}

export interface EvidenceRecord {
  id: string;
  inspectionId: string;
  workpackId: string;
  stepId: string;
  stepTitle: string;
  timestamp: string;
  imageBase64: string;
  ocrExtractedText: string[];
  detectedSerialOrModel?: string;
  observations: string[];
  validationStatus: VerificationStatus;
  confidence: number;
  operatorNotes?: string;
  aiRuntime: AIRuntimeMode;
  metadata?: {
    cameraResolution?: string;
    orientation?: string;
    deviceType?: string;
  };
}

export interface FindingRecord {
  id: string;
  inspectionId: string;
  stepId: string;
  title: string;
  severity: FindingSeverity;
  description: string;
  recommendation: string;
  detectedAt: string;
  status: 'open' | 'resolved' | 'overridden';
  evidenceId?: string;
}

export interface InspectionRecord {
  id: string;
  workpackId: string;
  workpackName: string;
  equipmentType: string;
  assetTag: string;
  location: string;
  operatorName: string;
  startTime: string;
  endTime?: string;
  status: 'in_progress' | 'completed' | 'flagged' | 'aborted';
  steps: StepRecord[];
  currentStepIndex: number;
  evidenceIds: string[];
  findings: FindingRecord[];
  manualOverrides: ManualOverride[];
  aiRuntime: AIRuntimeMode;
  isOffline: boolean;
  summaryNotes?: string;
}

export interface TelemetrySample {
  timestamp: string;
  cameraLatencyMs: number;
  aiLatencyMs: number;
  ocrLatencyMs: number;
  speechLatencyMs: number;
  reasoningLatencyMs: number;
  totalLatencyMs: number;
  memoryMB?: number;
  framesProcessed: number;
  aiRuntime: AIRuntimeMode;
  isOffline: boolean;
}

export interface DetectedObject {
  /** Bounding box coordinates [x, y, width, height] */
  bbox: [number, number, number, number];
  /** Normalized bounding box [ymin, xmin, ymax, xmax] between 0 and 1 */
  normalizedBbox?: [number, number, number, number];
  /** Object class label (e.g. motor, machinery, cell phone, person, etc.) */
  class: string;
  /** Detection confidence score 0.0 - 1.0 */
  score: number;
}

export interface AIInspectionResult {
  equipmentIdentified: string;
  detectedState: ObservationState;
  verificationStatus: VerificationStatus;
  extractedText: string[];
  serialOrModelNumber?: string;
  safetyLabelsDetected: string[];
  observations: string[];
  guidance: string;
  confidence: number;
  rulesEvaluated: {
    ruleName: string;
    satisfied: boolean;
    detail: string;
  }[];
  latencyMs: number;
  sourceProvider: string;
  detectedObjects?: DetectedObject[];
}

