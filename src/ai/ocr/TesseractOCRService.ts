import { OCRService } from '../interfaces/AIEngine';

export class TesseractOCRService implements OCRService {
  private isLoaded = false;
  private worker: any = null;

  async initWorker(): Promise<void> {
    if (this.isLoaded && this.worker) return;
    try {
      // Dynamic import to keep initial bundle load lean
      const { createWorker } = await import('tesseract.js');
      this.worker = await createWorker('eng');
      this.isLoaded = true;
    } catch (err) {
      console.warn('[OCRService] Worker initialization fallback to direct recognition', err);
    }
  }

  async extractText(imageSource: CanvasImageSource | string): Promise<{
    text: string;
    lines: string[];
    confidence: number;
    latencyMs: number;
  }> {
    const startTime = performance.now();
    try {
      // If worker initialized, use worker. Otherwise use recognize directly
      const { recognize } = await import('tesseract.js');
      const result = await recognize(imageSource as any, 'eng', {
        logger: () => {}, // silent in console
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const rawText = result.data.text || '';
      const lines = rawText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      const confidence = (result.data.confidence || 0) / 100;

      return {
        text: rawText,
        lines,
        confidence: Math.round(confidence * 100) / 100,
        latencyMs,
      };
    } catch (error: any) {
      console.error('[OCRService] OCR extraction error:', error);
      return {
        text: '',
        lines: [],
        confidence: 0,
        latencyMs: Math.round(performance.now() - startTime),
      };
    }
  }
}

export const ocrService = new TesseractOCRService();
