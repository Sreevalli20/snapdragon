import { AIInspectionResult, SOPStep, WorkPack, AIRuntimeMode, DetectedObject } from '../../types';

export type { DetectedObject };

export interface AIEngine {
  name: string;
  runtimeMode: AIRuntimeMode;
  isAvailable(): Promise<boolean>;
  inspectFrame(
    canvasOrBase64: string | HTMLCanvasElement,
    currentStep: SOPStep,
    workpack: WorkPack
  ): Promise<AIInspectionResult>;
  getHardwareSpecs(): {
    targetNPU: string;
    runtime: string;
    precision: string;
    acceleration: string;
  };
}

export interface VisionEngine {
  detectObjects(
    imageElement: CanvasImageSource | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<DetectedObject[]>;
  classifyComponents(imageElement: CanvasImageSource): Promise<{
    labels: { name: string; confidence: number }[];
    latencyMs: number;
    detectedObjects?: DetectedObject[];
  }>;
}


export interface OCRService {
  extractText(imageElement: CanvasImageSource | string): Promise<{
    text: string;
    lines: string[];
    confidence: number;
    latencyMs: number;
  }>;
}

export interface ReasoningEngine {
  verifyStepRequirements(
    step: SOPStep,
    extractedText: string[],
    visualObservations: string[]
  ): {
    isSatisfied: boolean;
    verificationStatus: 'PASS' | 'WARNING' | 'ACTION_REQUIRED';
    detectedState: 'Detected' | 'Likely' | 'Uncertain' | 'Not detected';
    guidance: string;
    confidence: number;
    evaluatedRules: { ruleName: string; satisfied: boolean; detail: string }[];
  };
}
