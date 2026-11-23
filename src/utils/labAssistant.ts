import { BeginnerCircuitId, BenchBoardId } from '../types/electronics';
import {
  BenchEnvironmentInputs,
  BenchWireConnection,
  BOARD_PINS,
  CircuitSimulationResult,
  getPresetById,
} from './circuitSimulator';

export interface GuidedStep {
  stepNumber: number;
  totalSteps: number;
  sensorPinId: string;
  sensorPinLabel: string;
  boardPinId: string;
  boardPinLabel: string;
  status: 'completed' | 'next' | 'fix' | 'upcoming';
  instruction: string;
  whyItMatters: string;
}

export interface LabGuideContext {
  projectAbout: string;
  whatItDoes: string;
  whatToConnectSummary: string[];
  steps: GuidedStep[];
  activeStep: GuidedStep | null;
  coachHeadline: string;
  coachMessage: string;
  isAllDone: boolean;
  hasFault: boolean;
}

export interface LabAssistantReply {
  text: string;
  highlightPins: { sensorPinId: string; boardPinId: string } | null;
  suggestedAction: 'wire-next' | 'fix-fault' | 'toggle-test' | 'start-guided' | null;
}

interface PresetGuideCopy {
  about: string;
  whatItDoes: Record<BenchBoardId, string>;
  partsList: Record<BenchBoardId, string[]>;
  whyMattersByPin: Record<string, string>;
  glossaryTip: string;
}

const PRESET_GUIDE_COPY: Record<BeginnerCircuitId, PresetGuideCopy> = {
  'led-blink': {
    about:
      'Your very first hardware "Hello World" circuit. You are wiring an LED and a 220Ω protective resistor to a microcontroller output pin so code can turn the light on and off safely.',
    whatItDoes: {
      'arduino-uno':
        'Once wired safely, clicking Power ON pulses digital pin D13 at 1 Hz so both the 3D LED and the Arduino Uno onboard "L" LED blink at a safe ~13.6 mA current.',
      esp32:
        'Once wired safely, GPIO 2 blinks the 3D LED alongside the ESP32 onboard blue LED at a safe ~5.9 mA current.',
    },
    partsList: {
      'arduino-uno': [
        'Arduino Uno R3 board (5V digital logic)',
        '10mm LED + 220Ω current-limiting resistor',
        '2 jumper wires (Anode + to D13, Cathode - to GND)',
      ],
      esp32: [
        'ESP32 DevKit V1 board (3.3V digital logic)',
        '10mm LED + 220Ω current-limiting resistor',
        '2 jumper wires (Anode + to GPIO 2, Cathode - to GND)',
      ],
    },
    whyMattersByPin: {
      ANODE: 'The long (+) leg through the 220Ω resistor carries controlled voltage so the LED does not burn out.',
      CATHODE: 'The flat (-) leg returns electrical current back to 0V Ground (GND) to complete the loop.',
    },
    glossaryTip:
      'Always put a 220Ω–330Ω resistor in series with an LED—without it, direct pin current can overheat and burn out the LED.',
  },
  'dht22-climate': {
    about:
      'A digital room-climate monitor project. The DHT22 sensor measures ambient air temperature and humidity and sends digital packets over a single wire to your microcontroller.',
    whatItDoes: {
      'arduino-uno':
        'Power + DATA + GND let Arduino Uno read calibrated temperature (°C) and humidity (% RH) every 2 seconds. Move the Temp/Humidity sliders in Test & Verify to see live telemetry update.',
      esp32:
        'ESP32 reads the DHT22 digital pulse train on GPIO 4 at 3.3V logic—ready to display locally or publish over Wi-Fi.',
    },
    partsList: {
      'arduino-uno': [
        'Arduino Uno R3 board',
        'DHT22 Temperature & Humidity sensor module',
        '3 jumper wires: VCC → 5V, DATA → D2, GND → GND',
      ],
      esp32: [
        'ESP32 DevKit V1 board',
        'DHT22 Temperature & Humidity sensor module',
        '3 jumper wires: VCC → 3V3, DATA → GPIO 4, GND → GND',
      ],
    },
    whyMattersByPin: {
      VCC: 'Supplies steady DC power to the internal thermometer chip inside the white louvered housing.',
      DATA: 'Sends digital 40-bit temperature and humidity readings back to your microcontroller.',
      GND: 'Provides the shared 0V reference so power and data signals work properly.',
    },
    glossaryTip:
      'VCC is positive power (+) and GND is 0V ground (-). Never swap VCC and GND—that creates a short circuit that can damage the sensor.',
  },
  'hcsr04-sonar': {
    about:
      'A contactless ultrasonic distance finder—the same sensor used in smart parking bays and obstacle-avoiding robots. One transducer sends a 40 kHz sound chirp and the other listens for the echo.',
    whatItDoes: {
      'arduino-uno':
        'Arduino sends a 10 µs TRIG pulse and times the ECHO return pulse to measure distance in centimeters. Move the virtual obstacle slider to watch the 3D target block and ultrasonic rings react.',
      esp32:
        'ESP32 triggers 40 kHz bursts via GPIO 5 and measures echo duration on GPIO 18. On real ESP32 hardware, add a 1 kΩ + 2 kΩ resistor voltage divider on ECHO to safely step 5V down to 3.3V.',
    },
    partsList: {
      'arduino-uno': [
        'Arduino Uno R3 board (5V native)',
        'HC-SR04 Ultrasonic Distance sensor',
        '4 jumper wires: VCC → 5V, TRIG → D9, ECHO → D10, GND → GND',
      ],
      esp32: [
        'ESP32 DevKit V1 board (5V VIN power, 3.3V GPIO)',
        'HC-SR04 Ultrasonic Distance sensor + 1kΩ/2kΩ divider for real ECHO',
        '4 jumper wires: VCC → VIN, TRIG → GPIO 5, ECHO → GPIO 18, GND → GND',
      ],
    },
    whyMattersByPin: {
      VCC: 'Ultrasonic speakers need 5V power (5V on Uno, VIN on ESP32) to send strong sound waves.',
      TRIG: 'Trigger pin—your code pulses this HIGH for 10 microseconds to fire a sound burst.',
      ECHO: 'Echo pin—stays HIGH until the sound wave bounces back, telling your board the distance.',
      GND: 'Shared 0V ground return for the 5V ultrasonic driver circuit.',
    },
    glossaryTip:
      'TRIG is an input to the sensor (board talks to sensor). ECHO is an output from the sensor (sensor talks back to board).',
  },
};

function getBoardLabel(boardId: BenchBoardId): string {
  return boardId === 'arduino-uno' ? 'Arduino Uno R3' : 'ESP32 DevKit V1';
}

export function buildLabGuideContext(
  presetId: BeginnerCircuitId,
  boardId: BenchBoardId,
  connections: BenchWireConnection[],
  simResult: CircuitSimulationResult
): LabGuideContext {
  const preset = getPresetById(presetId);
  const copy = PRESET_GUIDE_COPY[preset.id];
  const boardPins = BOARD_PINS[boardId];
  const findBoardLabel = (pinId: string) =>
    boardPins.find((b) => b.id === pinId)?.label ?? pinId;

  let assignedNext = false;
  const steps: GuidedStep[] = preset.sensorPins.map((sp, idx) => {
    const conn = connections.find((c) => c.sensorPinId === sp.pinId);
    const check = simResult.checks.find((c) => c.id === sp.pinId);
    const targetBoardPinId = sp.idealBoardPins[boardId];
    const targetBoardLabel = findBoardLabel(targetBoardPinId);

    let status: GuidedStep['status'];
    let instruction: string;

    if (check?.status === 'error') {
      status = 'fix';
      const currentLabel = conn ? findBoardLabel(conn.boardPinId) : 'wrong pin';
      instruction = `Fix ${sp.label}: disconnect from ${currentLabel} and connect to ${targetBoardLabel}.`;
    } else if (conn) {
      status = 'completed';
      instruction = `${sp.label} is safely connected to ${findBoardLabel(conn.boardPinId)}.`;
    } else if (!assignedNext) {
      status = 'next';
      assignedNext = true;
      instruction = `Click ${sp.label} on the sensor, then click ${targetBoardLabel} on the ${getBoardLabel(boardId)}.`;
    } else {
      status = 'upcoming';
      instruction = `Connect ${sp.label} to ${targetBoardLabel}.`;
    }

    return {
      stepNumber: idx + 1,
      totalSteps: preset.sensorPins.length,
      sensorPinId: sp.pinId,
      sensorPinLabel: sp.label,
      boardPinId: targetBoardPinId,
      boardPinLabel: targetBoardLabel,
      status,
      instruction,
      whyItMatters: copy.whyMattersByPin[sp.pinId] ?? sp.hint,
    };
  });

  const fixStep = steps.find((s) => s.status === 'fix') ?? null;
  const nextStep = steps.find((s) => s.status === 'next') ?? null;
  const activeStep = fixStep ?? nextStep;

  const hasFault =
    simResult.overallStatus === 'short_circuit' || simResult.overallStatus === 'wiring_error';
  const isAllDone = simResult.overallStatus === 'working';

  let coachHeadline = '';
  let coachMessage = '';

  if (hasFault && fixStep) {
    coachHeadline = `Step ${fixStep.stepNumber} needs fixing before USB power`;
    coachMessage = `${fixStep.instruction} ${
      simResult.overallStatus === 'short_circuit'
        ? 'Right now power and ground are shorted or reversed—never plug in real hardware like this.'
        : 'Moving this lead to the highlighted board pin fixes the mismatch.'
    }`;
  } else if (nextStep) {
    coachHeadline = `Next step (${nextStep.stepNumber} of ${nextStep.totalSteps}): Wire ${nextStep.sensorPinLabel}`;
    coachMessage = `${nextStep.instruction} (${nextStep.whyItMatters})`;
  } else if (isAllDone) {
    coachHeadline = 'All pins wired safely — circuit is working!';
    coachMessage = simResult.hasWarning
      ? `Your connections work in 3D (${simResult.telemetry.primaryValue}). Note: check the ESP32 3.3V divider reminder before wiring real hardware.`
      : `Great job! Live output is ${simResult.telemetry.primaryValue}. You can now replicate this exact pinout on your real ${getBoardLabel(boardId)}.`;
  } else {
    coachHeadline = 'Follow steps 1–' + steps.length + ' below';
    coachMessage = 'Pick each highlighted sensor pin and connect it to the matching board pin.';
  }

  return {
    projectAbout: copy.about,
    whatItDoes: copy.whatItDoes[boardId],
    whatToConnectSummary: copy.partsList[boardId],
    steps,
    activeStep,
    coachHeadline,
    coachMessage,
    isAllDone,
    hasFault,
  };
}

export function getBeginnerQuickQuestions(
  presetId: BeginnerCircuitId,
  boardId: BenchBoardId,
  simResult: CircuitSimulationResult
): string[] {
  const questions: string[] = [];

  if (
    simResult.overallStatus === 'short_circuit' ||
    simResult.overallStatus === 'wiring_error'
  ) {
    questions.push('Why is my wire red and how do I fix it?');
  }

  questions.push(
    'What is this project about?',
    'What and how should I connect?',
    'What should it do when it works?'
  );

  if (presetId === 'led-blink') {
    questions.push('Why do I need a 220Ω resistor?');
  } else if (presetId === 'dht22-climate') {
    questions.push('What do VCC, DATA, and GND mean?');
  } else if (boardId === 'esp32') {
    questions.push('Why does ESP32 warn about ECHO voltage?');
  } else {
    questions.push('How do TRIG and ECHO pins work?');
  }

  return questions.slice(0, 4);
}

export function answerLabQuestion(
  rawQuestion: string,
  presetId: BeginnerCircuitId,
  boardId: BenchBoardId,
  connections: BenchWireConnection[],
  simResult: CircuitSimulationResult,
  envInputs: BenchEnvironmentInputs
): LabAssistantReply {
  const q = rawQuestion.trim().toLowerCase();
  const preset = getPresetById(presetId);
  const copy = PRESET_GUIDE_COPY[preset.id];
  const guide = buildLabGuideContext(presetId, boardId, connections, simResult);
  const boardName = getBoardLabel(boardId);

  const activeHighlight = guide.activeStep
    ? {
        sensorPinId: guide.activeStep.sensorPinId,
        boardPinId: guide.activeStep.boardPinId,
      }
    : null;

  // 1. Fault / Red Wire / Safety Check
  if (
    /red|wrong|error|short|fix|fault|safe|usb|burn|broken|warning|mistake|problem/.test(q)
  ) {
    if (guide.hasFault && guide.activeStep) {
      const errorChecks = simResult.checks
        .filter((c) => c.status === 'error')
        .map((c) => `${c.label}: ${c.message}`)
        .join(' ');
      return {
        text: `Good catch checking before plugging in USB! ${errorChecks} Click "Fix Red Wire" or wire ${guide.activeStep.sensorPinLabel} to ${guide.activeStep.boardPinLabel} in 3D.`,
        highlightPins: activeHighlight,
        suggestedAction: 'fix-fault',
      };
    }
    if (simResult.hasWarning) {
      return {
        text: `Your circuit is safe to run in 3D, with one beginner hardware tip: ${preset.id === 'hcsr04-sonar' && boardId === 'esp32' ? 'HC-SR04 outputs a 5V ECHO pulse while ESP32 GPIO pins expect 3.3V max, so add a simple 1kΩ + 2kΩ voltage divider on real hardware.' : 'Prefer the 3V3 supply rail on ESP32 so sensor logic stays at 3.3V.'}`,
        highlightPins: null,
        suggestedAction: null,
      };
    }
    if (guide.isAllDone) {
      return {
        text: `Everything checks out! All ${guide.steps.length} pins are connected with safe polarity and voltage rails (${simResult.telemetry.primaryValue}). You can safely wire your real ${boardName} using these exact pin pairs.`,
        highlightPins: null,
        suggestedAction: null,
      };
    }
    return {
      text: `No faults so far—just ${guide.steps.filter((s) => s.status !== 'completed').length} wire(s) left to finish. Next up: connect ${guide.activeStep?.sensorPinLabel} to ${guide.activeStep?.boardPinLabel}.`,
      highlightPins: activeHighlight,
      suggestedAction: 'wire-next',
    };
  }

  // 2. What is this project about?
  if (/about|purpose|project|why build|what is this/.test(q)) {
    return {
      text: `${preset.title} (${boardName}): ${copy.about} ${copy.glossaryTip}`,
      highlightPins: activeHighlight,
      suggestedAction: guide.activeStep ? 'wire-next' : null,
    };
  }

  // 3. What should it do for you / Expected behavior / Output
  if (/what should it do|what does it do|expect|result|output|behavior|work/.test(q)) {
    const liveNote =
      guide.isAllDone
        ? ` Right now your live simulation is already showing: ${simResult.telemetry.primaryValue} (${simResult.telemetry.secondaryValue}).`
        : preset.id === 'hcsr04-sonar'
          ? ` Right now the virtual obstacle is at ${envInputs.obstacleDistanceCm} cm—once wired, ultrasonic rings will travel from the dual transducers to the block.`
          : '';
    return {
      text: `${copy.whatItDoes[boardId]}${liveNote}`,
      highlightPins: activeHighlight,
      suggestedAction: guide.isAllDone ? 'toggle-test' : 'wire-next',
    };
  }

  // 4. ESP32 / Divider / Resistor / Pin Acronyms Glossary
  if (/resistor|220|divider|vcc|gnd|trig|echo|anode|cathode|mean|stand for/.test(q)) {
    const pinBreakdown = guide.steps
      .map((s) => `${s.sensorPinLabel} (connects to ${s.boardPinLabel}): ${s.whyItMatters}`)
      .join(' ');
    return {
      text: `${copy.glossaryTip} Pin breakdown for ${preset.shortTitle}: ${pinBreakdown}`,
      highlightPins: activeHighlight,
      suggestedAction: guide.activeStep ? 'wire-next' : null,
    };
  }

  // 5. What & How to connect (General or next step)
  const stepList = guide.steps
    .map((s) => `${s.stepNumber}. ${s.sensorPinLabel} → ${s.boardPinLabel}`)
    .join(' · ');

  if (guide.activeStep) {
    return {
      text: `You need ${guide.steps.length} wires on ${boardName}: ${stepList}. Next step (${guide.activeStep.stepNumber}/${guide.steps.length}): ${guide.activeStep.instruction}`,
      highlightPins: activeHighlight,
      suggestedAction: guide.hasFault ? 'fix-fault' : 'wire-next',
    };
  }

  return {
    text: `All ${guide.steps.length} wires are connected cleanly (${stepList})! ${copy.whatItDoes[boardId]} Click "Start Guided Build" anytime if you want to clear the bench and practice wiring step by step.`,
    highlightPins: null,
    suggestedAction: 'start-guided',
  };
}
