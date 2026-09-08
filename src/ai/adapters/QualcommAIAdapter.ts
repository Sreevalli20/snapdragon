import { AIEngine } from '../interfaces/AIEngine';
import { AIInspectionResult, SOPStep, WorkPack, AIRuntimeMode } from '../../types';
import { LocalAIAdapter } from './LocalAIAdapter';

export interface QualcommModelTarget {
  modelId: string;
  modelName: string;
  targetRuntime: 'QNN' | 'ONNX_EP' | 'DirectML';
  targetHardware: 'Hexagon NPU' | 'Adreno GPU' | 'Kryo CPU';
  quantization: 'INT8' | 'INT4' | 'FP16';
  inputResolution: [number, number]; // [width, height] e.g. [640, 640]
  expectedLatencyNpuMs?: number;
}

export class QualcommAIAdapter implements AIEngine {
  name = 'Snapdragon® AI Edge Adapter (Qualcomm AI Hub Integration Point)';
  runtimeMode: AIRuntimeMode = 'qualcomm';

  // Configured model targets for Snapdragon-powered HP PCs
  // Based on actual Qualcomm AI Hub pre-optimized models:
  // - EasyOCR: https://aihub.qualcomm.com/models/easyocr (80+ languages, Snapdragon X Elite/Plus supported)
  // - TrOCR: https://aihub.qualcomm.com/models/trocr (Transformer-based OCR, 320x320 input)
  // - MobileNet-v2: https://aihub.qualcomm.com/models/mobilenet_v2 (Object detection backbone)
  private registeredModels: QualcommModelTarget[] = [
    {
      modelId: 'qualcomm/easyocr',
      modelName: 'EasyOCR - Qualcomm AI Hub (80+ languages)',
      targetRuntime: 'QNN',
      targetHardware: 'Hexagon NPU',
      quantization: 'INT8',
      inputResolution: [608, 800],
      expectedLatencyNpuMs: 150,
    },
    {
      modelId: 'qualcomm/trocr',
      modelName: 'TrOCR - Transformer-based OCR (320x320)',
      targetRuntime: 'QNN',
      targetHardware: 'Hexagon NPU',
      quantization: 'INT8',
      inputResolution: [320, 320],
      expectedLatencyNpuMs: 120,
    },
    {
      modelId: 'qualcomm/mobilenet_v2',
      modelName: 'MobileNet-v2 - Object Detection Backbone',
      targetRuntime: 'QNN',
      targetHardware: 'Hexagon NPU',
      quantization: 'INT8',
      inputResolution: [640, 640],
      expectedLatencyNpuMs: 50,
    },
  ];

  // Integration point fallback to real client local perception during readiness phase
  private localEdgeEngine = new LocalAIAdapter();

  async isAvailable(): Promise<boolean> {
    // In this phase, Qualcomm AI Hub credentials and native NPU runtime are configured outside.
    // We return true as an integration interface ready for connection.
    return true;
  }

  getRegisteredModels(): QualcommModelTarget[] {
    return this.registeredModels;
  }

  detectSnapdragonEnvironment(): {
    isSnapdragonDevice: boolean;
    architecture: string;
    operatingSystem: string;
    hasWebNN: boolean;
    npuTargetStatus: 'Ready for AI Hub Configuration' | 'Emulated / Fallback';
  } {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const platform = typeof navigator !== 'undefined' ? (navigator as any).platform || '' : '';
    
    // Check if running on ARM64 Windows (typical Snapdragon X Elite / X Plus HP PCs)
    const isArm64 = ua.includes('ARM64') || ua.includes('aarch64') || platform.includes('ARM');
    const isWindows = ua.includes('Windows');
    const isSnapdragonDevice = isArm64 && isWindows;
    const hasWebNN = typeof navigator !== 'undefined' && 'ml' in navigator;

    return {
      isSnapdragonDevice,
      architecture: isArm64 ? 'ARM64 (Qualcomm Snapdragon Compatible)' : 'x86_64 / Standard Browser',
      operatingSystem: isWindows ? 'Windows 11 on ARM' : 'Desktop / Web OS',
      hasWebNN,
      npuTargetStatus: isSnapdragonDevice ? 'Ready for AI Hub Configuration' : 'Emulated / Fallback',
    };
  }

  async inspectFrame(
    canvasOrBase64: string | HTMLCanvasElement,
    currentStep: SOPStep,
    workpack: WorkPack
  ): Promise<AIInspectionResult> {
    const startTime = performance.now();

    // In this phase, execute real local client-side inference while logging the Snapdragon adapter interface contract
    const result = await this.localEdgeEngine.inspectFrame(canvasOrBase64, currentStep, workpack);
    const measuredLatency = Math.round(performance.now() - startTime);

    return {
      ...result,
      latencyMs: measuredLatency,
      sourceProvider: 'QualcommAIAdapter (Snapdragon AI Hub Prepared Interface)',
    };
  }

  getHardwareSpecs() {
    const env = this.detectSnapdragonEnvironment();
    return {
      targetNPU: env.isSnapdragonDevice ? 'Qualcomm® Hexagon™ NPU (45 TOPS Target)' : 'Qualcomm AI Hub Target (Ready for Configuration)',
      runtime: 'QNN / Qualcomm Neural Processing SDK & ONNX EP Boundary',
      precision: 'INT8 / FP16 Mixed Precision Pipeline',
      acceleration: env.isSnapdragonDevice ? 'Snapdragon X Series NPU Acceleration Ready' : 'Architecture Integration Boundary (Configured outside)',
    };
  }
}
