import test from 'node:test';
import assert from 'node:assert/strict';
import { generateProjectRecommendation } from './assistantEngine';

test('gas & garage prompt recommends MQ-2 and ESP32', () => {
  const rec = generateProjectRecommendation('Monitor LPG gas leak in my garage with Wi-Fi alerts');
  assert.equal(rec.recommendedBoardId, 'esp32');
  assert.ok(rec.suggestedComponents.some((c) => c.componentId === 'mq-2'));
  assert.ok(rec.relatedProjectIds.includes('gas-leakage-monitoring'));
});

test('plant watering prompt with Arduino honors board preference and suggests soil moisture sensor', () => {
  const rec = generateProjectRecommendation('Automatic indoor plant watering system using Arduino Uno');
  assert.equal(rec.recommendedBoardId, 'arduino-uno');
  assert.ok(rec.suggestedComponents.some((c) => c.componentId === 'soil-moisture'));
  assert.ok(rec.wiringSummary.length > 0);
});

test('weather station prompt recommends BMP280, DHT22, and OLED', () => {
  const rec = generateProjectRecommendation('Build a weather monitoring station measuring barometric pressure and humidity');
  const ids = rec.suggestedComponents.map((c) => c.componentId);
  assert.ok(ids.includes('bmp280'));
  assert.ok(ids.includes('dht22'));
});
