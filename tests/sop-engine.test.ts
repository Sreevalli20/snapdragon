import { test, describe } from 'node:test';
import assert from 'node:assert';
import { RuleEvaluator } from '../src/ai/reasoning/RuleEvaluator';
import { DEFAULT_WORKPACKS } from '../src/workpacks/defaultWorkpacks';
import { SOPStep, ValidationRule, InspectionRecord } from '../src/types';

describe('SOP Engine & WorkPack Validation Tests', () => {
  test('WorkPack definitions must satisfy enterprise schema', () => {
    assert.ok(DEFAULT_WORKPACKS.length >= 3, 'Must have at least 3 industrial WorkPacks');

    for (const wp of DEFAULT_WORKPACKS) {
      assert.ok(wp.id, 'WorkPack must have an id');
      assert.ok(wp.name, 'WorkPack must have a name');
      assert.ok(wp.industry, 'WorkPack must have an industry');
      assert.ok(wp.equipmentType, 'WorkPack must have an equipment type');
      assert.ok(wp.steps.length > 0, 'WorkPack must contain SOP steps');
      assert.ok(wp.acceptableConditions.length > 0, 'WorkPack must define acceptable conditions');
      assert.ok(wp.escalationConditions.length > 0, 'WorkPack must define escalation conditions');
    }
  });

  test('RuleEvaluator correctly evaluates keyword and regex rules', () => {
    const evaluator = new RuleEvaluator();

    const rules: ValidationRule[] = [
      {
        id: 'rule-danger',
        ruleName: 'Danger Warning Label',
        description: 'Detect DANGER or HIGH VOLTAGE',
        requiredKeywordRegex: '(DANGER|HIGH VOLTAGE)',
        minimumConfidence: 0.8,
        severityIfFailed: 'critical',
      },
      {
        id: 'rule-serial',
        ruleName: 'Serial Number Format',
        description: 'Detect 4+ alphanumeric serial characters',
        requiredKeywordRegex: '[A-Z0-9]{4,}',
        minimumConfidence: 0.7,
        severityIfFailed: 'critical',
      },
    ];

    // Case 1: Matching OCR text
    const ocrTextPass = ['DANGER', 'HIGH VOLTAGE 480V', 'SERIAL: MTR-9021'];
    const visualPass = ['Equipment casing', 'Warning decal'];

    const mockStepPass: SOPStep = {
      id: 'test-step-1',
      order: 1,
      title: 'Safety and Serial Check',
      instruction: 'Verify danger label and serial',
      targetArea: 'Control box',
      requiredObservations: ['Labels'],
      requiredEvidence: true,
      requiresAIValidation: true,
      validationRules: rules,
      guidanceOnFail: 'Realign camera',
      allowManualOverride: true,
    };

    const resultPass = evaluator.verifyStepRequirements(mockStepPass, ocrTextPass, visualPass);
    assert.strictEqual(resultPass.isSatisfied, true);
    assert.strictEqual(resultPass.verificationStatus, 'PASS');
    assert.strictEqual(resultPass.evaluatedRules.length, 2);
    assert.strictEqual(resultPass.evaluatedRules[0].satisfied, true);
    assert.strictEqual(resultPass.evaluatedRules[1].satisfied, true);

    // Case 2: Failing OCR text (missing DANGER warning)
    const ocrTextFail = ['STANDARD CAUTION', 'SERIAL: MTR-9021'];
    const resultFail = evaluator.verifyStepRequirements(mockStepPass, ocrTextFail, visualPass);
    assert.strictEqual(resultFail.isSatisfied, false);
    assert.strictEqual(resultFail.evaluatedRules[0].satisfied, false);
    assert.strictEqual(resultFail.evaluatedRules[1].satisfied, true);
  });

  test('RuleEvaluator handles component presence checks', () => {
    const evaluator = new RuleEvaluator();

    const ruleComponent: ValidationRule = {
      id: 'rule-motor',
      ruleName: 'Motor Housing Presence',
      description: 'Must observe motor',
      targetComponent: 'motor',
      severityIfFailed: 'warning',
    };

    const mockStepComponent: SOPStep = {
      id: 'test-step-comp',
      order: 1,
      title: 'Motor Check',
      instruction: 'Check motor',
      targetArea: 'Motor',
      requiredObservations: ['Motor'],
      requiredEvidence: false,
      requiresAIValidation: true,
      validationRules: [ruleComponent],
      guidanceOnFail: 'Point at motor',
      allowManualOverride: true,
    };

    const resultMatch = evaluator.verifyStepRequirements(
      mockStepComponent,
      [],
      ['Three-phase induction motor housing observed']
    );
    assert.strictEqual(resultMatch.isSatisfied, true);
    assert.strictEqual(resultMatch.evaluatedRules[0].satisfied, true);

    const resultNoMatch = evaluator.verifyStepRequirements(
      mockStepComponent,
      [],
      ['Empty floor and drywall']
    );
    assert.strictEqual(resultNoMatch.isSatisfied, false);
    assert.strictEqual(resultNoMatch.evaluatedRules[0].satisfied, false);
  });
});
