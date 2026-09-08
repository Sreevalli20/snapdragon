import { SOPStep, ValidationRule, ObservationState, VerificationStatus } from '../../types';
import { ReasoningEngine } from '../interfaces/AIEngine';

export class RuleEvaluator implements ReasoningEngine {
  verifyStepRequirements(
    step: SOPStep,
    extractedText: string[],
    visualObservations: string[]
  ): {
    isSatisfied: boolean;
    verificationStatus: VerificationStatus;
    detectedState: ObservationState;
    guidance: string;
    confidence: number;
    evaluatedRules: { ruleName: string; satisfied: boolean; detail: string }[];
  } {
    const combinedText = extractedText.join(' ').toLowerCase();
    const rules = step.validationRules || [];
    const evaluatedRules: { ruleName: string; satisfied: boolean; detail: string }[] = [];

    if (rules.length === 0) {
      // If step has no strict automated rules (e.g. general visual overview)
      return {
        isSatisfied: true,
        verificationStatus: 'PASS',
        detectedState: 'Detected',
        guidance: 'General visual requirement satisfied. Review image and proceed to next step.',
        confidence: 0.9,
        evaluatedRules: [{ ruleName: 'General Observation', satisfied: true, detail: 'Manual/Visual check passed' }],
      };
    }

    let allRequiredPassed = true;
    let anyPassed = false;
    let confidenceSum = 0;

    for (const rule of rules) {
      let satisfied = false;
      let detail = '';

      // Check required keyword regex (e.g. serial number patterns, model numbers)
      if (rule.requiredKeywordRegex) {
        try {
          const regex = new RegExp(rule.requiredKeywordRegex, 'i');
          const matched = regex.test(combinedText);
          if (matched) {
            satisfied = true;
            detail = `Found matching text pattern: /${rule.requiredKeywordRegex}/`;
          } else {
            satisfied = false;
            detail = `Text pattern /${rule.requiredKeywordRegex}/ not found in OCR stream`;
          }
        } catch {
          satisfied = false;
          detail = 'Invalid rule pattern regex';
        }
      } else if (rule.requiredLabelText) {
        // Check for specific safety or rating label (e.g. "HIGH VOLTAGE", "DANGER", "ISO", "UL")
        const term = rule.requiredLabelText.toLowerCase();
        if (combinedText.includes(term)) {
          satisfied = true;
          detail = `Found required safety label wording: "${rule.requiredLabelText}"`;
        } else {
          satisfied = false;
          detail = `Safety label text "${rule.requiredLabelText}" missing from view`;
        }
      } else if (rule.targetComponent) {
        // Check if observation or text lists component
        const comp = rule.targetComponent.toLowerCase();
        const foundInObs = visualObservations.some(obs => obs.toLowerCase().includes(comp));
        const foundInText = combinedText.includes(comp);
        if (foundInObs || foundInText) {
          satisfied = true;
          detail = `Target component verified: "${rule.targetComponent}"`;
        } else {
          satisfied = false;
          detail = `Target component "${rule.targetComponent}" not clearly identified`;
        }
      } else {
        satisfied = true;
        detail = 'Criterion satisfied';
      }

      if (satisfied) {
        anyPassed = true;
        confidenceSum += (rule.minimumConfidence || 0.85);
      } else {
        allRequiredPassed = false;
      }

      evaluatedRules.push({
        ruleName: rule.ruleName,
        satisfied,
        detail,
      });
    }

    const calculatedConfidence = rules.length > 0 ? Math.round((confidenceSum / rules.length) * 100) / 100 : 0.85;

    let verificationStatus: VerificationStatus = 'PASS';
    let detectedState: ObservationState = 'Detected';
    let guidance = 'All step requirements validated. Capture evidence or advance to the next step.';

    if (!allRequiredPassed && !anyPassed) {
      verificationStatus = 'ACTION_REQUIRED';
      detectedState = 'Not detected';
      guidance = step.guidanceOnFail || 'Target label or component not detected. Realign camera toward target area.';
    } else if (!allRequiredPassed && anyPassed) {
      verificationStatus = 'WARNING';
      detectedState = 'Uncertain';
      const failedRule = evaluatedRules.find(r => !r.satisfied);
      guidance = `Partial match. ${failedRule?.detail || 'Verify position'}. Ensure lens is focused and well-lit.`;
    } else {
      verificationStatus = 'PASS';
      detectedState = calculatedConfidence > 0.8 ? 'Detected' : 'Likely';
    }

    return {
      isSatisfied: allRequiredPassed,
      verificationStatus,
      detectedState,
      guidance,
      confidence: Math.max(0.2, Math.min(1.0, calculatedConfidence)),
      evaluatedRules,
    };
  }
}

export const ruleEvaluator = new RuleEvaluator();
