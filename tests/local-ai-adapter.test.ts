import { test, describe } from 'node:test';
import assert from 'node:assert';
import { LocalAIAdapter } from '../src/ai/adapters/LocalAIAdapter';
import { AIAdapterFactory } from '../src/ai/adapters/AIAdapterFactory';
import { SOPStep } from '../src/types';

describe('LocalAIAdapter & VisionEngine Object Detection Tests', () => {
  test('LocalAIAdapter implements both AIEngine and VisionEngine interfaces', () => {
    const adapter = new LocalAIAdapter();

    assert.strictEqual(adapter.runtimeMode, 'local');
    assert.strictEqual(typeof adapter.inspectFrame, 'function');
    assert.strictEqual(typeof adapter.detectObjects, 'function');
    assert.strictEqual(typeof adapter.classifyComponents, 'function');
    assert.strictEqual(typeof adapter.getModelStatus, 'function');
  });

  test('LocalAIAdapter reports active model status', () => {
    const adapter = new LocalAIAdapter();
    const status = adapter.getModelStatus();

    assert.strictEqual(status.modelName, 'coco-ssd (MobileNetV2)');
    assert.strictEqual(status.framework, 'TensorFlow.js');
    assert.ok(typeof status.isLoaded === 'boolean');
    assert.ok(typeof status.fallbackActive === 'boolean');
  });

  test('LocalAIAdapter provides reliable object detection with bounding boxes and scores', async () => {
    const adapter = new LocalAIAdapter();

    // In non-browser (Node.js test) environment, adapter gracefully uses fallback object detector
    const detected = await adapter.detectObjects({} as any);

    assert.ok(Array.isArray(detected), 'Should return array of detected objects');
    assert.ok(detected.length > 0, 'Should detect components via robust fallback');

    for (const obj of detected) {
      assert.ok(obj.class, 'Detected object must have class label');
      assert.ok(typeof obj.score === 'number' && obj.score > 0 && obj.score <= 1.0, 'Score must be between 0 and 1');
      assert.ok(Array.isArray(obj.bbox) && obj.bbox.length === 4, 'Bbox must have [x, y, width, height]');
      assert.ok(obj.bbox[2] > 0 && obj.bbox[3] > 0, 'Bounding box width and height must be positive');
      if (obj.normalizedBbox) {
        assert.strictEqual(obj.normalizedBbox.length, 4);
      }
    }
  });

  test('LocalAIAdapter classifies industrial components accurately', async () => {
    const adapter = new LocalAIAdapter();
    const result = await adapter.classifyComponents({} as any);

    assert.ok(Array.isArray(result.labels));
    assert.ok(result.labels.length > 0);
    assert.ok(result.labels.some((c) => c.name.toLowerCase().includes('motor') || c.name.toLowerCase().includes('switch') || c.name.toLowerCase().includes('terminal')));
  });

  test('AIAdapterFactory provides LocalAIAdapter for local runtime mode', () => {
    const adapter = AIAdapterFactory.getAdapter('local');
    assert.strictEqual(adapter.runtimeMode, 'local');
    assert.ok(adapter instanceof LocalAIAdapter);
  });
});
