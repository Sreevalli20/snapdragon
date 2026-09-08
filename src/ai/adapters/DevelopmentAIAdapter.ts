import { AIEngine } from '../interfaces/AIEngine';
import { AIInspectionResult, SOPStep, WorkPack, AIRuntimeMode } from '../../types';
import { LocalAIAdapter } from './LocalAIAdapter';

export class DevelopmentAIAdapter implements AIEngine {
  name = 'Development AI Engine (Full-Stack Multimodal)';
  runtimeMode: AIRuntimeMode = 'development';
  private fallbackLocal = new LocalAIAdapter();

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.onLine) {
      return false;
    }
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return false;
      const data = await res.json();
      return !!data.hasGeminiKey;
    } catch {
      return false;
    }
  }

  async inspectFrame(
    canvasOrBase64: string | HTMLCanvasElement,
    currentStep: SOPStep,
    workpack: WorkPack
  ): Promise<AIInspectionResult> {
    const startTime = performance.now();

    let imageBase64: string;
    if (typeof canvasOrBase64 === 'string') {
      imageBase64 = canvasOrBase64;
    } else {
      imageBase64 = canvasOrBase64.toDataURL('image/jpeg', 0.82);
    }

    try {
      const response = await fetch('/api/ai/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          currentStep,
          workpackContext: {
            name: workpack.name,
            equipmentType: workpack.equipmentType,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('[DevelopmentAIAdapter] Server API returned error, falling back to LocalAIAdapter:', errorData);
        // Seamless fallback to local client-side inspection
        const localResult = await this.fallbackLocal.inspectFrame(canvasOrBase64, currentStep, workpack);
        localResult.sourceProvider = 'LocalAIAdapter (Server Unavailable Fallback)';
        return localResult;
      }

      const result = await response.json();
      const latencyMs = Math.round(performance.now() - startTime);

      const d = result.data;
      return {
        equipmentIdentified: d.equipmentIdentified || workpack.equipmentType,
        detectedState: d.detectedState || 'Likely',
        verificationStatus: d.verificationStatus || 'PASS',
        extractedText: d.extractedText || [],
        serialOrModelNumber: d.serialOrModelNumber,
        safetyLabelsDetected: d.safetyLabelsDetected || [],
        observations: d.observations || [],
        guidance: d.guidance || 'Verify camera alignment with target area.',
        confidence: typeof d.confidence === 'number' ? d.confidence : 0.88,
        rulesEvaluated: d.rulesEvaluated || [],
        latencyMs,
        sourceProvider: 'DevelopmentAIAdapter (Server Gemini 3.8 Flash)',
      };
    } catch (err: any) {
      console.warn('[DevelopmentAIAdapter] Network failure, using local offline fallback:', err);
      const localResult = await this.fallbackLocal.inspectFrame(canvasOrBase64, currentStep, workpack);
      localResult.sourceProvider = 'LocalAIAdapter (Offline Fallback)';
      return localResult;
    }
  }

  getHardwareSpecs() {
    return {
      targetNPU: 'Cloud / Server Development Gateway',
      runtime: 'Gemini 3.8 Flash (Multimodal Server Proxy)',
      precision: 'FP16 / Server Multimodal',
      acceleration: 'Server API (Vite/Express Bridge)',
    };
  }
}
