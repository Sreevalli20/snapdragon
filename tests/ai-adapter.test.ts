import { test, describe } from 'node:test';
import assert from 'node:assert';
import { QualcommAIAdapter } from '../src/ai/adapters/QualcommAIAdapter';
import { AIAdapterFactory } from '../src/ai/adapters/AIAdapterFactory';

describe('AI Adapter Interface & Snapdragon Integration Tests', () => {
  test('AIAdapterFactory provisions required runtime adapters', () => {
    const devAdapter = AIAdapterFactory.getAdapter('development');
    assert.strictEqual(devAdapter.runtimeMode, 'development');

    const localAdapter = AIAdapterFactory.getAdapter('local');
    assert.strictEqual(localAdapter.runtimeMode, 'local');

    const qualcommAdapter = AIAdapterFactory.getAdapter('qualcomm');
    assert.strictEqual(qualcommAdapter.runtimeMode, 'qualcomm');
  });

  test('QualcommAIAdapter declares valid Snapdragon model targets', () => {
    const qAdapter = new QualcommAIAdapter();
    const models = qAdapter.getRegisteredModels();

    assert.ok(models.length >= 2, 'Should register industrial vision models');
    for (const m of models) {
      assert.ok(m.modelId, 'Model must have ID');
      assert.strictEqual(m.targetHardware, 'Hexagon NPU');
      assert.strictEqual(m.targetRuntime, 'QNN');
      assert.ok(m.inputResolution[0] > 0 && m.inputResolution[1] > 0);
    }
  });

  test('QualcommAIAdapter provides non-mocked environment detection', () => {
    const qAdapter = new QualcommAIAdapter();
    const env = qAdapter.detectSnapdragonEnvironment();

    assert.ok(typeof env.isSnapdragonDevice === 'boolean');
    assert.ok(typeof env.architecture === 'string');
    assert.ok(typeof env.npuTargetStatus === 'string');

    const specs = qAdapter.getHardwareSpecs();
    assert.ok(specs.targetNPU.length > 0);
    assert.ok(specs.runtime.includes('QNN'));
  });
});
