import test from 'node:test';
import assert from 'node:assert/strict';
import { searchCatalog } from './search';

test('exact component part number search returns HC-SR04 first', () => {
  const result = searchCatalog('HC-SR04');
  assert.ok(result.exactComponents.length > 0);
  assert.equal(result.exactComponents[0].id, 'hc-sr04');
});

test('exact project search finds ESP32 Smart Home Automation', () => {
  const result = searchCatalog('Smart Home Automation');
  assert.equal(result.hasExactProjectMatch, true);
  assert.equal(result.exactProjects[0].id, 'esp32-smart-home-automation');
});

test('unavailable project query provides smart fallback projects and relevant components instead of empty page', () => {
  const result = searchCatalog('autonomous quadcopter drone flight controller');
  assert.equal(result.hasExactProjectMatch, false);
  assert.ok(result.fallbackProjects.length > 0, 'Should surface related fallback projects');
  const allRelevantComponents = [...result.exactComponents, ...result.fallbackComponents];
  assert.ok(
    allRelevantComponents.some((c) => c.id === 'mpu6050' || c.id === 'bmp280'),
    'Should recommend IMU/barometer components via domain expansion'
  );
});

test('empty query returns full catalog cleanly', () => {
  const result = searchCatalog('   ');
  assert.equal(result.hasExactProjectMatch, true);
  assert.ok(result.exactComponents.length >= 18);
  assert.equal(result.exactProjects.length, 8);
});
