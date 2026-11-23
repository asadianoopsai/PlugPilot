import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCircuit,
  getIdealConnections,
  getMistakeConnections,
} from './circuitSimulator';

const DEFAULT_ENV = {
  temperatureC: 24.5,
  humidityPct: 56,
  obstacleDistanceCm: 45,
  blinkEnabled: true,
};

test('unwired LED circuit reports unwired state and is not safe to power', () => {
  const result = evaluateCircuit('led-blink', 'arduino-uno', [], DEFAULT_ENV);
  assert.equal(result.overallStatus, 'unwired');
  assert.equal(result.safeToPowerRealHardware, false);
  assert.equal(result.checks.length, 2);
});

test('ideal DHT22 wiring on Arduino Uno verifies cleanly and outputs live climate telemetry', () => {
  const wires = getIdealConnections('dht22-climate', 'arduino-uno');
  const result = evaluateCircuit('dht22-climate', 'arduino-uno', wires, DEFAULT_ENV);
  assert.equal(result.overallStatus, 'working');
  assert.equal(result.safeToPowerRealHardware, true);
  assert.equal(result.hasWarning, false);
  assert.match(result.telemetry.primaryValue, /24\.5 °C/);
  assert.match(result.telemetry.primaryValue, /56% RH/);
});

test('short circuit (VCC to GND) is caught immediately before powering hardware', () => {
  const wires = getMistakeConnections('dht22-climate', 'arduino-uno');
  const result = evaluateCircuit('dht22-climate', 'arduino-uno', wires, DEFAULT_ENV);
  assert.equal(result.overallStatus, 'short_circuit');
  assert.equal(result.safeToPowerRealHardware, false);
  assert.equal(result.telemetry.ledActive, false);
});

test('reversed LED polarity flags wiring_error and keeps LED off', () => {
  const wires = getMistakeConnections('led-blink', 'arduino-uno');
  const result = evaluateCircuit('led-blink', 'arduino-uno', wires, DEFAULT_ENV);
  assert.equal(result.overallStatus, 'wiring_error');
  assert.equal(result.safeToPowerRealHardware, false);
  assert.equal(result.telemetry.ledActive, false);
});

test('HC-SR04 on ESP32 highlights Echo 3.3V divider warning while computing echo pulse microseconds', () => {
  const wires = getIdealConnections('hcsr04-sonar', 'esp32');
  const result = evaluateCircuit('hcsr04-sonar', 'esp32', wires, DEFAULT_ENV);
  assert.equal(result.overallStatus, 'working');
  assert.equal(result.hasWarning, true);
  assert.equal(result.telemetry.pulseDistanceCm, 45);
  assert.match(result.telemetry.secondaryValue, /2624 µs/);
});
