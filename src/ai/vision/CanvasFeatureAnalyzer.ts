export interface FrameFeatures {
  brightness: number; // 0-255
  contrast: number; // 0-100
  edgeDensity: number; // 0-100 (high = complex machinery/text, low = blank wall)
  hasSafetyYellow: boolean;
  hasHazardOrangeRed: boolean;
  hasBlueIndication: boolean;
  sharpnessScore: number;
  detectedEquipmentTag?: string;
}

export class CanvasFeatureAnalyzer {
  static analyze(canvas: HTMLCanvasElement): FrameFeatures {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return {
        brightness: 128,
        contrast: 50,
        edgeDensity: 20,
        hasSafetyYellow: false,
        hasHazardOrangeRed: false,
        hasBlueIndication: false,
        sharpnessScore: 70,
      };
    }

    // Sample downscaled region for high FPS performance
    const sampleW = 160;
    const sampleH = 120;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sampleW;
    tempCanvas.height = sampleH;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) {
      return {
        brightness: 128,
        contrast: 50,
        edgeDensity: 20,
        hasSafetyYellow: false,
        hasHazardOrangeRed: false,
        hasBlueIndication: false,
        sharpnessScore: 70,
      };
    }

    tempCtx.drawImage(canvas, 0, 0, sampleW, sampleH);
    const imgData = tempCtx.getImageData(0, 0, sampleW, sampleH);
    const d = imgData.data;

    let totalLum = 0;
    let yellowCount = 0;
    let redOrangeCount = 0;
    let blueCount = 0;

    // Luminance and color analysis
    const lumArray = new Uint8Array(sampleW * sampleH);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const lum = (0.299 * r + 0.587 * g + 0.114 * b);
      lumArray[p] = lum;
      totalLum += lum;

      // Industrial Safety Yellow: high R, high G, low B
      if (r > 160 && g > 150 && b < 100 && (r + g) > (b * 2.5)) {
        yellowCount++;
      }
      // Hazard Red/Orange: high R, moderate/low G, low B
      if (r > 160 && g < 110 && b < 110) {
        redOrangeCount++;
      }
      // Industrial Blue / Status indicator
      if (b > 150 && b > r * 1.3 && b > g * 1.3) {
        blueCount++;
      }
    }

    const numPixels = sampleW * sampleH;
    const avgBrightness = Math.round(totalLum / numPixels);

    // Variance for contrast
    let varianceSum = 0;
    for (let p = 0; p < numPixels; p++) {
      const diff = lumArray[p] - avgBrightness;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / numPixels);
    const contrast = Math.min(100, Math.round((stdDev / 128) * 100));

    // Simple horizontal gradient edge density
    let edges = 0;
    for (let y = 1; y < sampleH - 1; y++) {
      for (let x = 1; x < sampleW - 1; x++) {
        const idx = y * sampleW + x;
        const gradX = Math.abs(lumArray[idx + 1] - lumArray[idx - 1]);
        const gradY = Math.abs(lumArray[idx + sampleW] - lumArray[idx - sampleW]);
        if (gradX + gradY > 50) {
          edges++;
        }
      }
    }
    const edgeDensity = Math.min(100, Math.round((edges / numPixels) * 100));
    const sharpnessScore = Math.min(100, Math.round((edgeDensity * 0.7 + contrast * 0.3)));

    const yellowRatio = yellowCount / numPixels;
    const redOrangeRatio = redOrangeCount / numPixels;
    const blueRatio = blueCount / numPixels;

    return {
      brightness: avgBrightness,
      contrast,
      edgeDensity,
      hasSafetyYellow: yellowRatio > 0.015,
      hasHazardOrangeRed: redOrangeRatio > 0.012,
      hasBlueIndication: blueRatio > 0.01,
      sharpnessScore,
    };
  }
}
