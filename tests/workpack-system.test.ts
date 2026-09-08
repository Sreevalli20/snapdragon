import { test, describe } from 'node:test';
import assert from 'node:assert';
import { WorkPack, SOPStep, ValidationRule } from '../src/types';
import { DEFAULT_WORKPACKS } from '../src/workpacks/defaultWorkpacks';
import { WorkPackStorageManager } from '../src/workpacks/workpackStorage';

describe('WorkPack System & Interface Conformance Tests', () => {
  test('Initial "Industrial Equipment Inspection" WorkPack conforms strictly to TypeScript specification', () => {
    const industrialWp = DEFAULT_WORKPACKS.find(
      (w) => w.name === 'Industrial Equipment Inspection'
    );

    assert.ok(industrialWp, 'Initial "Industrial Equipment Inspection" WorkPack must exist');
    assert.strictEqual(industrialWp.name, 'Industrial Equipment Inspection');
    assert.ok(industrialWp.industry, 'Must specify industry');
    assert.ok(industrialWp.equipmentType, 'Must specify equipmentType');
    assert.ok(industrialWp.steps.length >= 4, 'Must have at least 4 SOP steps');

    for (const step of industrialWp.steps) {
      // Robust TypeScript interface requirements:
      // instruction, requiresAIValidation (AI verification requirements), allowManualOverride (manual overrides), requiredObservations, validationRules
      assert.ok(step.id, 'Step must have unique ID');
      assert.ok(typeof step.order === 'number', 'Step must have order number');
      assert.ok(step.title, 'Step must have title');
      assert.ok(step.instruction, 'Step must contain operator instruction');
      assert.ok(typeof step.requiresAIValidation === 'boolean', 'Step must specify requiresAIValidation');
      assert.ok(typeof step.allowManualOverride === 'boolean', 'Step must specify allowManualOverride');
      assert.ok(Array.isArray(step.requiredObservations), 'Step must specify requiredObservations array');
      assert.ok(step.requiredObservations.length > 0, 'requiredObservations must not be empty');
      assert.ok(Array.isArray(step.validationRules), 'Step must specify validationRules array');

      for (const rule of step.validationRules) {
        assert.ok(rule.id, 'Validation rule must have ID');
        assert.ok(rule.ruleName, 'Validation rule must have name');
        assert.ok(rule.description, 'Validation rule must have description');
        assert.ok(rule.severityIfFailed, 'Validation rule must define severity');
      }
    }
  });

  test('WorkPackStorageManager initializes and seeds default WorkPacks with fallback', async () => {
    const manager = new WorkPackStorageManager();
    const workpacks = await manager.initializeWorkPacks();

    assert.ok(workpacks.length > 0, 'WorkPacks must be initialized');
    const industrial = workpacks.find((w) => w.name === 'Industrial Equipment Inspection');
    assert.ok(industrial, 'Must contain "Industrial Equipment Inspection" WorkPack');
    assert.strictEqual(industrial.equipmentType, 'Three-Phase Motor & Variable Frequency Drive');

    // Retrieve via getWorkPack
    const retrieved = await manager.getWorkPack(industrial.id);
    assert.ok(retrieved);
    assert.strictEqual(retrieved?.id, industrial.id);
  });

  test('WorkPack interface accommodates custom enterprise inspection procedures', () => {
    const customRule: ValidationRule = {
      id: 'rule-psi-check',
      ruleName: 'Pressure Gauge Threshold',
      description: 'Ensure gauge reads between 80-120 PSI',
      requiredKeywordRegex: '\\b(8[0-9]|9[0-9]|1[0-1][0-9]|120)\\s*PSI\\b',
      severityIfFailed: 'critical',
    };

    const customStep: SOPStep = {
      id: 'step-pump-pressure',
      order: 1,
      title: 'Hydraulic Pressure Verification',
      instruction: 'Verify gauge indicator is within acceptable 80-120 PSI envelope.',
      targetArea: 'Primary manifold gauge',
      requiredObservations: ['Analog dial reading', 'Leak-free fitting'],
      requiredEvidence: true,
      requiresAIValidation: true,
      validationRules: [customRule],
      guidanceOnFail: 'Isolate pump circuit and vent auxiliary line.',
      allowManualOverride: true,
    };

    const customWorkPack: WorkPack = {
      id: 'wp-hydraulic-press',
      name: 'Hydraulic Press Weekly Certification',
      industry: 'Automotive Stamping',
      equipmentType: '2000-Ton Hydraulic Stamping Press',
      version: '1.2.0',
      description: 'Weekly mechanical and hydraulic integrity verification.',
      inspectionObjectives: ['Verify hydraulic envelope', 'Confirm leak-free connections'],
      metadata: {
        author: 'Lead Inspector',
        targetHardwareProfile: 'Snapdragon X Elite',
        lastUpdated: '2026-03-01',
        tags: ['Hydraulics', 'Stamping'],
      },
      steps: [customStep],
      acceptableConditions: ['Gauge stable at 90-110 PSI', 'Zero fluid weepage'],
      escalationConditions: ['Pressure exceeding 125 PSI', 'Visible seal blowout'],
    };

    assert.strictEqual(customWorkPack.name, 'Hydraulic Press Weekly Certification');
    assert.strictEqual(customWorkPack.steps[0].requiresAIValidation, true);
    assert.strictEqual(customWorkPack.steps[0].allowManualOverride, true);
    assert.strictEqual(customWorkPack.steps[0].validationRules[0].severityIfFailed, 'critical');
  });
});
