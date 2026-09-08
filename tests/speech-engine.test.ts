import { test, describe } from 'node:test';
import assert from 'node:assert';
import { SpeechEngine, SOPCommandAction } from '../src/speech/SpeechEngine';

describe('SpeechEngine & Web Speech API Integration Tests', () => {
  test('SpeechEngine registers comprehensive SOP command mappings', () => {
    const engine = new SpeechEngine();
    const commands = engine.getRegisteredCommands();

    assert.ok(commands.length >= 10, 'Should have at least 10 registered voice commands');

    const expectedActions: SOPCommandAction[] = [
      'START_INSPECTION',
      'NEXT_STEP',
      'MARK_STEP_COMPLETE',
      'PREVIOUS_STEP',
      'REPEAT_INSTRUCTION',
      'CAPTURE_EVIDENCE',
      'SHOW_ISSUE',
      'GENERATE_REPORT',
      'OVERRIDE_STEP',
      'PAUSE_INSPECTION',
      'RESUME_INSPECTION',
    ];

    for (const expected of expectedActions) {
      const match = commands.find((c) => c.action === expected);
      assert.ok(match, `Must define command for action ${expected}`);
    }
  });

  test('SpeechEngine matches exact and colloquial operator phrases', () => {
    const engine = new SpeechEngine();

    // Start inspection
    const startCmd = engine.parseTranscript('Please start inspection now');
    assert.ok(startCmd);
    assert.strictEqual(startCmd?.action, 'START_INSPECTION');

    // Next step
    const nextCmd = engine.parseTranscript('Okay, proceed to next step');
    assert.ok(nextCmd);
    assert.strictEqual(nextCmd?.action, 'NEXT_STEP');

    // Mark complete
    const completeCmd = engine.parseTranscript('Mark this step complete');
    assert.ok(completeCmd);
    assert.strictEqual(completeCmd?.action, 'MARK_STEP_COMPLETE');

    // Previous step
    const prevCmd = engine.parseTranscript('Go back to previous step');
    assert.ok(prevCmd);
    assert.strictEqual(prevCmd?.action, 'PREVIOUS_STEP');

    // Repeat instruction
    const repeatCmd = engine.parseTranscript('Repeat instruction please');
    assert.ok(repeatCmd);
    assert.strictEqual(repeatCmd?.action, 'REPEAT_INSTRUCTION');

    // Capture evidence
    const captureCmd = engine.parseTranscript('Capture evidence photo');
    assert.ok(captureCmd);
    assert.strictEqual(captureCmd?.action, 'CAPTURE_EVIDENCE');

    // Show issue
    const issueCmd = engine.parseTranscript('What is the issue here');
    assert.ok(issueCmd);
    assert.strictEqual(issueCmd?.action, 'SHOW_ISSUE');

    // Generate report
    const reportCmd = engine.parseTranscript('Generate final inspection report');
    assert.ok(reportCmd);
    assert.strictEqual(reportCmd?.action, 'GENERATE_REPORT');

    // Override step
    const overrideCmd = engine.parseTranscript('Override this step');
    assert.ok(overrideCmd);
    assert.strictEqual(overrideCmd?.action, 'OVERRIDE_STEP');
  });

  test('SpeechEngine triggers bound SOP engine action handlers', () => {
    const engine = new SpeechEngine();
    let actionTriggered = '';
    let recognizedCmdAction = '';

    engine.bindAction('MARK_STEP_COMPLETE', () => {
      actionTriggered = 'STEP_COMPLETED';
    });

    engine.setCallbacks({
      onCommandRecognized: (cmd) => {
        recognizedCmdAction = cmd.action;
      },
    });

    // Simulate operator saying 'mark this step complete'
    const match = engine.simulateCommand('Mark this step complete');
    assert.ok(match);
    assert.strictEqual(actionTriggered, 'STEP_COMPLETED');
    assert.strictEqual(recognizedCmdAction, 'MARK_STEP_COMPLETE');
  });

  test('SpeechEngine provides graceful fallback when Web Speech API is absent', async () => {
    const engine = new SpeechEngine();

    // Node.js environment has no window.webkitSpeechRecognition, so isSupported must be false
    assert.strictEqual(engine.isSupported(), false);

    let statusReported = '';
    engine.setCallbacks({
      onStatusChange: (status) => {
        statusReported = status;
      },
    });

    const started = await engine.startListening();
    assert.strictEqual(started, false, 'Should return false when speech recognition is unavailable');
    assert.strictEqual(statusReported, 'unsupported');

    // Ensure simulation mode remains fully functional as fallback
    let fallbackAction = false;
    engine.bindAction('NEXT_STEP', () => {
      fallbackAction = true;
    });

    engine.simulateCommand('next step');
    assert.strictEqual(fallbackAction, true, 'Fallback simulation must execute bound actions');
  });

  test('SpeechEngine allows adding custom SOP commands', () => {
    const engine = new SpeechEngine();

    engine.registerCommand({
      id: 'custom-emergency',
      action: 'PAUSE_INSPECTION',
      phrases: ['emergency stop procedure'],
      patterns: [/emergency stop/i, /halt all/i],
      description: 'Emergency stop trigger',
    });

    const parsed = engine.parseTranscript('Operator declares emergency stop right now');
    assert.ok(parsed);
    assert.strictEqual(parsed?.action, 'PAUSE_INSPECTION');
  });
});
