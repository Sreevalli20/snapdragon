import { db } from './indexedDB';
import { DEFAULT_WORKPACKS } from '../workpacks/defaultWorkpacks';
import { InspectionRecord, EvidenceRecord, FindingRecord } from '../types';

// Helper to generate a realistic industrial graphic as base64 data URL
function createSampleIndustrialImage(
  title: string,
  serial: string,
  badgeText: string,
  color: string
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - Industrial dark panel
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 640, 360);

  // Metal texture plate
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(30, 30, 580, 300);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(30, 30, 580, 300);

  // Corner bolts
  const boltPositions = [
    [45, 45],
    [595, 45],
    [45, 315],
    [595, 315],
  ];
  boltPositions.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#64748b';
    ctx.fill();
    ctx.stroke();
  });

  // Header banner badge
  ctx.fillStyle = color;
  ctx.fillRect(50, 50, 540, 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(badgeText, 70, 82);

  // Title
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(title, 50, 140);

  // Serial Plate
  ctx.fillStyle = '#020617';
  ctx.fillRect(50, 165, 540, 85);
  ctx.strokeStyle = '#0ea5e9';
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 165, 540, 85);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '13px monospace';
  ctx.fillText('IDENTIFICATION TAG / SERIAL NO:', 65, 195);
  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(serial, 65, 230);

  // Footer status
  ctx.font = '12px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('SNAPOPS VISION · EDGE COMPLIANCE CAPTURE · SNAPDRAGON® AI READY', 50, 290);

  return canvas.toDataURL('image/jpeg', 0.85);
}

export async function seedSampleIndustrialData(): Promise<void> {
  const wp = DEFAULT_WORKPACKS[0]; // Industrial Equipment Inspection
  const now = new Date();
  const earlier = new Date(now.getTime() - 28 * 60000); // 28 mins ago

  const img1 = createSampleIndustrialImage(
    'Three-Phase Induction Motor Chassis',
    'MTR-8842-HV-2026',
    'EQUIPMENT UNIT VERIFICATION',
    '#0284c7'
  );

  const img2 = createSampleIndustrialImage(
    'Rating Plate & Electrical Specs',
    'SN: 9048-VFD-460V-60HZ',
    'NAMEPLATE OCR VALIDATION',
    '#059669'
  );

  const img3 = createSampleIndustrialImage(
    'Arc Flash & Voltage Safety Decal',
    'DANGER: HIGH VOLTAGE 480V',
    'SAFETY WARNING PLACARD',
    '#dc2626'
  );

  const inspectionId = `insp-sample-${Date.now()}`;

  const evidence1: EvidenceRecord = {
    id: `ev-sample-1`,
    inspectionId,
    workpackId: wp.id,
    stepId: wp.steps[0].id,
    stepTitle: wp.steps[0].title,
    timestamp: earlier.toISOString(),
    imageBase64: img1,
    ocrExtractedText: ['MTR-8842-HV', 'SIEMENS INDUCTION MOTOR', 'FRAME 256T'],
    detectedSerialOrModel: 'MTR-8842-HV',
    observations: ['Frame mounting base secure', 'Unit free of physical deformation'],
    validationStatus: 'PASS',
    confidence: 0.94,
    operatorNotes: 'Full unit framing verified',
    aiRuntime: 'development',
  };

  const evidence2: EvidenceRecord = {
    id: `ev-sample-2`,
    inspectionId,
    workpackId: wp.id,
    stepId: wp.steps[1].id,
    stepTitle: wp.steps[1].title,
    timestamp: new Date(earlier.getTime() + 5 * 60000).toISOString(),
    imageBase64: img2,
    ocrExtractedText: ['SN: 9048-VFD-460V', 'MODEL: X900', '460V 3PH 60HZ'],
    detectedSerialOrModel: '9048-VFD-460V',
    observations: ['Rating plate legible with clear model designation'],
    validationStatus: 'PASS',
    confidence: 0.96,
    operatorNotes: 'OCR matched asset registry tag',
    aiRuntime: 'development',
  };

  const evidence3: EvidenceRecord = {
    id: `ev-sample-3`,
    inspectionId,
    workpackId: wp.id,
    stepId: wp.steps[2].id,
    stepTitle: wp.steps[2].title,
    timestamp: new Date(earlier.getTime() + 12 * 60000).toISOString(),
    imageBase64: img3,
    ocrExtractedText: ['DANGER', 'HIGH VOLTAGE', '480 VOLTS', 'QUALIFIED PERSONNEL ONLY'],
    observations: ['Safety placard intact and high visibility certified'],
    validationStatus: 'PASS',
    confidence: 0.98,
    operatorNotes: 'Required OSHA safety decal confirmed',
    aiRuntime: 'development',
  };

  const finding1: FindingRecord = {
    id: `fnd-sample-1`,
    inspectionId,
    stepId: wp.steps[3].id,
    title: 'Dust Accumulation on Cooling Fins',
    severity: 'warning',
    description: 'Moderate airborne particulate accumulation observed on lower cooling fins.',
    recommendation: 'Schedule compressed air cleaning at next scheduled maintenance cycle.',
    detectedAt: new Date(earlier.getTime() + 18 * 60000).toISOString(),
    status: 'resolved',
  };

  const sampleInspection: InspectionRecord = {
    id: inspectionId,
    workpackId: wp.id,
    workpackName: wp.name,
    equipmentType: wp.equipmentType,
    assetTag: 'MTR-8842-HV',
    location: 'Building 4 - Compressor Substation',
    operatorName: 'Alex Chen (Certified Lead Tech)',
    startTime: earlier.toISOString(),
    endTime: now.toISOString(),
    status: 'completed',
    steps: wp.steps.map((s, idx) => ({
      stepId: s.id,
      title: s.title,
      status: 'completed',
      aiObservationState: 'Detected',
      aiVerificationStatus: 'PASS',
      aiConfidence: 0.95,
      extractedText: idx === 1 ? ['9048-VFD-460V'] : idx === 2 ? ['DANGER HIGH VOLTAGE'] : [],
      observations: ['Step verified and compliant with SOP'],
      evidenceIds: idx === 0 ? ['ev-sample-1'] : idx === 1 ? ['ev-sample-2'] : idx === 2 ? ['ev-sample-3'] : [],
      completedAt: new Date(earlier.getTime() + (idx + 1) * 4 * 60000).toISOString(),
    })),
    currentStepIndex: wp.steps.length - 1,
    evidenceIds: ['ev-sample-1', 'ev-sample-2', 'ev-sample-3'],
    findings: [finding1],
    manualOverrides: [],
    aiRuntime: 'development',
    isOffline: false,
  };

  await db.saveInspection(sampleInspection);
  await db.saveEvidence(evidence1);
  await db.saveEvidence(evidence2);
  await db.saveEvidence(evidence3);
  await db.saveFinding(finding1);
}
