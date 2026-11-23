import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCircuit,
  getIdealConnections,
  getMistakeConnections,
} from './circuitSimulator';
import {
  answerLabQuestion,
  buildLabGuideContext,
  getBeginnerQuickQuestions,
} from './labAssistant';

const DEFAULT_ENV = {
  temperatureC: 24.5,
  humidityPct: 56,
  obstacleDistanceCm: 48,
  blinkEnabled: true,
};

test('unwired starter reports step 1 of N with clear beginner instructions', () => {
  const sim = evaluateCircuit('led-blink', 'arduino-uno', [], DEFAULT_ENV);
  const guide = buildLabGuideContext('led-blink', 'arduino-uno', [], sim);

  assert.equal(guide.isAllDone, false);
  assert.equal(guide.hasFault, false);
  assert.ok(guide.projectAbout.toLowerCase().includes('220ω'));
  assert.equal(guide.steps.length, 2);
  assert.equal(guide.activeStep?.stepNumber, 1);
  assert.equal(guide.activeStep?.sensorPinId, 'ANODE');
  assert.equal(guide.activeStep?.boardPinId, 'D13');
  assert.equal(guide.activeStep?.status, 'next');
});

test('partial wiring advances activeStep cleanly to remaining wire', () => {
  const partial = [{ sensorPinId: 'ANODE', boardPinId: 'D13' }];
  const sim = evaluateCircuit('led-blink', 'arduino-uno', partial, DEFAULT_ENV);
  const guide = buildLabGuideContext('led-blink', 'arduino-uno', partial, sim);

  assert.equal(guide.steps[0].status, 'completed');
  assert.equal(guide.steps[1].status, 'next');
  assert.equal(guide.activeStep?.sensorPinId, 'CATHODE');
  assert.equal(guide.activeStep?.boardPinId, 'GND');
});

test('short circuit mistake prioritizes fix step and answers why wire is red', () => {
  const wrong = getMistakeConnections('dht22-climate', 'arduino-uno');
  const sim = evaluateCircuit('dht22-climate', 'arduino-uno', wrong, DEFAULT_ENV);
  const guide = buildLabGuideContext('dht22-climate', 'arduino-uno', wrong, sim);

  assert.equal(guide.hasFault, true);
  assert.equal(guide.activeStep?.status, 'fix');

  const quick = getBeginnerQuickQuestions('dht22-climate', 'arduino-uno', sim);
  assert.ok(quick[0].toLowerCase().includes('red'));

  const reply = answerLabQuestion(
    'Why is my wire red and how do I fix it?',
    'dht22-climate',
    'arduino-uno',
    wrong,
    sim,
    DEFAULT_ENV
  );
  assert.equal(reply.suggestedAction, 'fix-fault');
  assert.ok(reply.highlightPins !== null);
  assert.ok(reply.text.includes('GND') || reply.text.includes('5V'));
});

test('working HC-SR04 on ESP32 explains ultrasonic operation and 3.3V Echo tip', () => {
  const ideal = getIdealConnections('hcsr04-sonar', 'esp32');
  const sim = evaluateCircuit('hcsr04-sonar', 'esp32', ideal, DEFAULT_ENV);
  const guide = buildLabGuideContext('hcsr04-sonar', 'esp32', ideal, sim);

  assert.equal(guide.isAllDone, true);
  assert.ok(guide.whatItDoes.includes('ESP32'));
  assert.ok(guide.whatItDoes.includes('voltage divider'));

  const whatItDoesReply = answerLabQuestion(
    'What should it do when it works?',
    'hcsr04-sonar',
    'esp32',
    ideal,
    sim,
    DEFAULT_ENV
  );
  assert.ok(whatItDoesReply.text.includes('48 cm'));
});
