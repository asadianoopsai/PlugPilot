import { BeginnerCircuitId, BenchBoardId } from '../types/electronics';

export interface BenchPinDef {
  id: string;
  label: string;
  role: 'power_5v' | 'power_3v3' | 'ground' | 'digital' | 'analog';
  voltageSpec: string;
  description: string;
}

export interface SensorPinRequirement {
  pinId: string;
  label: string;
  expectedRole: 'power' | 'ground' | 'signal_out' | 'signal_in' | 'led_anode';
  idealBoardPins: Record<BenchBoardId, string>;
  hint: string;
}

export interface BeginnerCircuitPreset {
  id: BeginnerCircuitId;
  title: string;
  shortTitle: string;
  difficulty: 'Beginner';
  description: string;
  goalSummary: string;
  relatedProjectId: string;
  relatedComponentId: string;
  defaultBoard: BenchBoardId;
  recommendedPowerRail: Record<BenchBoardId, '5V' | '3V3'>;
  requiresEchoDividerOnEsp32?: boolean;
  sensorPins: SensorPinRequirement[];
}

export interface BenchWireConnection {
  sensorPinId: string;
  boardPinId: string;
}

export interface DiagnosticCheckItem {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'error' | 'pending';
  message: string;
}

export interface CircuitSimulationResult {
  overallStatus: 'unwired' | 'incomplete' | 'short_circuit' | 'wiring_error' | 'working';
  headline: string;
  summary: string;
  safeToPowerRealHardware: boolean;
  hasWarning: boolean;
  checks: DiagnosticCheckItem[];
  telemetry: {
    primaryLabel: string;
    primaryValue: string;
    secondaryLabel: string;
    secondaryValue: string;
    ledActive: boolean;
    pulseDistanceCm?: number;
  };
}

export interface BenchEnvironmentInputs {
  temperatureC: number;
  humidityPct: number;
  obstacleDistanceCm: number;
  blinkEnabled: boolean;
}

export const BOARD_PINS: Record<BenchBoardId, BenchPinDef[]> = {
  'arduino-uno': [
    {
      id: '5V',
      label: '5V',
      role: 'power_5v',
      voltageSpec: '5.0V Regulated',
      description: 'Main 5V regulated supply rail for sensors and LEDs',
    },
    {
      id: '3V3',
      label: '3.3V',
      role: 'power_3v3',
      voltageSpec: '3.3V LDO',
      description: 'Low-current 3.3V output (up to 50 mA on Uno R3)',
    },
    {
      id: 'GND',
      label: 'GND',
      role: 'ground',
      voltageSpec: '0V Reference',
      description: 'Common ground return reference',
    },
    {
      id: 'D2',
      label: 'D2',
      role: 'digital',
      voltageSpec: '5V Digital I/O',
      description: 'Interrupt-capable digital pin for DHT22 / pulse data',
    },
    {
      id: 'D9',
      label: 'D9',
      role: 'digital',
      voltageSpec: '5V Digital / PWM',
      description: 'PWM digital output ideal for Ultrasonic TRIG',
    },
    {
      id: 'D10',
      label: 'D10',
      role: 'digital',
      voltageSpec: '5V Digital I/O',
      description: 'Digital input pin ideal for Ultrasonic ECHO',
    },
    {
      id: 'D13',
      label: 'D13',
      role: 'digital',
      voltageSpec: '5V Digital / Built-in LED',
      description: 'Classic beginner LED output pin synced with onboard L LED',
    },
  ],
  esp32: [
    {
      id: 'VIN',
      label: 'VIN (5V)',
      role: 'power_5v',
      voltageSpec: '5.0V USB Input',
      description: 'Direct USB 5V rail for 5V modules like HC-SR04',
    },
    {
      id: '3V3',
      label: '3V3',
      role: 'power_3v3',
      voltageSpec: '3.3V Regulated',
      description: 'Primary 3.3V logic-safe supply rail on ESP32 DevKit V1',
    },
    {
      id: 'GND',
      label: 'GND',
      role: 'ground',
      voltageSpec: '0V Reference',
      description: 'Common ground return reference',
    },
    {
      id: 'GPIO4',
      label: 'GPIO 4',
      role: 'digital',
      voltageSpec: '3.3V Digital I/O',
      description: 'Safe general-purpose GPIO for DHT22 single-wire bus',
    },
    {
      id: 'GPIO5',
      label: 'GPIO 5',
      role: 'digital',
      voltageSpec: '3.3V Digital I/O',
      description: 'Digital output pin for HC-SR04 TRIG pulse',
    },
    {
      id: 'GPIO18',
      label: 'GPIO 18',
      role: 'digital',
      voltageSpec: '3.3V Digital I/O',
      description: 'Digital input pin (3.3V max — divide 5V Echo signals)',
    },
    {
      id: 'GPIO2',
      label: 'GPIO 2',
      role: 'digital',
      voltageSpec: '3.3V / Built-in LED',
      description: 'Onboard blue LED pin for beginner blink circuits',
    },
  ],
};

export const BEGINNER_CIRCUIT_PRESETS: BeginnerCircuitPreset[] = [
  {
    id: 'led-blink',
    title: 'LED & 220Ω Resistor Starter',
    shortTitle: 'LED + Resistor',
    difficulty: 'Beginner',
    description:
      'Your first circuit check: wire the long positive LED leg through a 220Ω resistor to a digital output pin and the short cathode leg to GND.',
    goalSummary: 'Verify polarity (+ / -) before powering a real LED.',
    relatedProjectId: 'motion-detection',
    relatedComponentId: 'arduino-uno',
    defaultBoard: 'arduino-uno',
    recommendedPowerRail: {
      'arduino-uno': '5V',
      esp32: '3V3',
    },
    sensorPins: [
      {
        pinId: 'ANODE',
        label: 'Anode (+)',
        expectedRole: 'led_anode',
        idealBoardPins: {
          'arduino-uno': 'D13',
          esp32: 'GPIO2',
        },
        hint: 'Connect the longer (+) leg via 220Ω resistor to D13 (Uno) or GPIO 2 (ESP32).',
      },
      {
        pinId: 'CATHODE',
        label: 'Cathode (-)',
        expectedRole: 'ground',
        idealBoardPins: {
          'arduino-uno': 'GND',
          esp32: 'GND',
        },
        hint: 'Connect the shorter (-) flat-side leg directly to GND.',
      },
    ],
  },
  {
    id: 'dht22-climate',
    title: 'DHT22 Temperature & Humidity Test',
    shortTitle: 'DHT22 Climate',
    difficulty: 'Beginner',
    description:
      'Connect VCC power, single-wire DATA, and GND ground cleanly, then slide room temperature and humidity to verify live readings.',
    goalSummary: 'Prevent reversed VCC/GND polarity before plugging in your sensor.',
    relatedProjectId: 'weather-monitoring-station',
    relatedComponentId: 'dht22',
    defaultBoard: 'arduino-uno',
    recommendedPowerRail: {
      'arduino-uno': '5V',
      esp32: '3V3',
    },
    sensorPins: [
      {
        pinId: 'VCC',
        label: 'VCC (+)',
        expectedRole: 'power',
        idealBoardPins: {
          'arduino-uno': '5V',
          esp32: '3V3',
        },
        hint: 'Connect VCC to 5V on Arduino Uno or 3V3 on ESP32.',
      },
      {
        pinId: 'DATA',
        label: 'DATA',
        expectedRole: 'signal_out',
        idealBoardPins: {
          'arduino-uno': 'D2',
          esp32: 'GPIO4',
        },
        hint: 'Connect DATA signal to digital pin D2 (Uno) or GPIO 4 (ESP32).',
      },
      {
        pinId: 'GND',
        label: 'GND (-)',
        expectedRole: 'ground',
        idealBoardPins: {
          'arduino-uno': 'GND',
          esp32: 'GND',
        },
        hint: 'Connect GND to board GND.',
      },
    ],
  },
  {
    id: 'hcsr04-sonar',
    title: 'HC-SR04 Ultrasonic Distance Bench',
    shortTitle: 'HC-SR04 Sonar',
    difficulty: 'Beginner',
    description:
      'Wire a 4-pin ultrasonic sonar module (VCC, TRIG, ECHO, GND) and verify echo timing against a virtual 3D obstacle block.',
    goalSummary: 'Verify 5V power, Trig/Echo pin order, and ESP32 voltage-level safety.',
    relatedProjectId: 'smart-parking-system',
    relatedComponentId: 'hcsr04',
    defaultBoard: 'arduino-uno',
    recommendedPowerRail: {
      'arduino-uno': '5V',
      esp32: '5V',
    },
    requiresEchoDividerOnEsp32: true,
    sensorPins: [
      {
        pinId: 'VCC',
        label: 'VCC (5V)',
        expectedRole: 'power',
        idealBoardPins: {
          'arduino-uno': '5V',
          esp32: 'VIN',
        },
        hint: 'HC-SR04 transducers require 5V (5V on Uno, VIN on ESP32).',
      },
      {
        pinId: 'TRIG',
        label: 'TRIG',
        expectedRole: 'signal_in',
        idealBoardPins: {
          'arduino-uno': 'D9',
          esp32: 'GPIO5',
        },
        hint: 'Connect TRIG input to D9 (Uno) or GPIO 5 (ESP32).',
      },
      {
        pinId: 'ECHO',
        label: 'ECHO',
        expectedRole: 'signal_out',
        idealBoardPins: {
          'arduino-uno': 'D10',
          esp32: 'GPIO18',
        },
        hint: 'Connect ECHO output to D10 (Uno) or GPIO 18 (use resistor divider on ESP32).',
      },
      {
        pinId: 'GND',
        label: 'GND',
        expectedRole: 'ground',
        idealBoardPins: {
          'arduino-uno': 'GND',
          esp32: 'GND',
        },
        hint: 'Connect GND to board GND.',
      },
    ],
  },
];

export function getPresetById(id: BeginnerCircuitId): BeginnerCircuitPreset {
  return BEGINNER_CIRCUIT_PRESETS.find((p) => p.id === id) ?? BEGINNER_CIRCUIT_PRESETS[0];
}

export function getIdealConnections(
  presetId: BeginnerCircuitId,
  boardId: BenchBoardId
): BenchWireConnection[] {
  const preset = getPresetById(presetId);
  return preset.sensorPins.map((pin) => ({
    sensorPinId: pin.pinId,
    boardPinId: pin.idealBoardPins[boardId],
  }));
}

export function getMistakeConnections(
  presetId: BeginnerCircuitId,
  boardId: BenchBoardId
): BenchWireConnection[] {
  const preset = getPresetById(presetId);
  if (preset.id === 'led-blink') {
    return [
      { sensorPinId: 'ANODE', boardPinId: 'GND' },
      { sensorPinId: 'CATHODE', boardPinId: boardId === 'arduino-uno' ? 'D13' : 'GPIO2' },
    ];
  }
  return preset.sensorPins.map((pin) => {
    if (pin.pinId === 'VCC') {
      return { sensorPinId: 'VCC', boardPinId: 'GND' };
    }
    if (pin.pinId === 'GND') {
      return { sensorPinId: 'GND', boardPinId: boardId === 'arduino-uno' ? '5V' : '3V3' };
    }
    return { sensorPinId: pin.pinId, boardPinId: pin.idealBoardPins[boardId] };
  });
}

export function evaluateCircuit(
  presetId: BeginnerCircuitId,
  boardId: BenchBoardId,
  connections: BenchWireConnection[],
  env: BenchEnvironmentInputs
): CircuitSimulationResult {
  const preset = getPresetById(presetId);
  const boardPins = BOARD_PINS[boardId];
  const findBoardPin = (id: string) => boardPins.find((p) => p.id === id);

  if (connections.length === 0) {
    return {
      overallStatus: 'unwired',
      headline: 'Ready to wire',
      summary:
        'Select a sensor pin and connect it to a matching microcontroller pin, or use Auto-Wire Guide to inspect a valid circuit.',
      safeToPowerRealHardware: false,
      hasWarning: false,
      checks: preset.sensorPins.map((sp) => ({
        id: sp.pinId,
        label: sp.label,
        status: 'pending',
        message: `Unconnected — ${sp.hint}`,
      })),
      telemetry: {
        primaryLabel: 'Circuit State',
        primaryValue: '0 / ' + preset.sensorPins.length + ' pins wired',
        secondaryLabel: 'Board Target',
        secondaryValue: boardId === 'arduino-uno' ? 'Arduino Uno R3' : 'ESP32 DevKit V1',
        ledActive: false,
      },
    };
  }

  let hasShortCircuit = false;
  let hasWiringError = false;
  let hasWarning = false;
  let missingCount = 0;

  // Detect multiple sensor power/ground pins hitting conflicting rails or same power+ground short
  const vccConn = connections.find((c) => c.sensorPinId === 'VCC');
  const gndConn = connections.find((c) => c.sensorPinId === 'GND');
  if (
    vccConn &&
    gndConn &&
    vccConn.boardPinId === gndConn.boardPinId
  ) {
    hasShortCircuit = true;
  }

  const checks: DiagnosticCheckItem[] = preset.sensorPins.map((sp) => {
    const conn = connections.find((c) => c.sensorPinId === sp.pinId);
    if (!conn) {
      missingCount++;
      return {
        id: sp.pinId,
        label: sp.label,
        status: 'pending',
        message: `Not wired yet — ${sp.hint}`,
      };
    }

    const bp = findBoardPin(conn.boardPinId);
    if (!bp) {
      hasWiringError = true;
      return {
        id: sp.pinId,
        label: sp.label,
        status: 'error',
        message: `Invalid board pin target "${conn.boardPinId}".`,
      };
    }

    if (sp.expectedRole === 'power') {
      if (bp.role === 'ground') {
        hasShortCircuit = true;
        return {
          id: sp.pinId,
          label: `${sp.label} -> ${bp.label}`,
          status: 'error',
          message: `Power short to GND! Connecting ${sp.label} to GND risks overheating the regulator.`,
        };
      }
      if (bp.role !== 'power_5v' && bp.role !== 'power_3v3') {
        hasWiringError = true;
        return {
          id: sp.pinId,
          label: `${sp.label} -> ${bp.label}`,
          status: 'error',
          message: `GPIO pin ${bp.label} cannot supply continuous sensor power — use 5V or 3.3V.`,
        };
      }
      if (preset.id === 'hcsr04-sonar' && bp.role === 'power_3v3') {
        hasWarning = true;
        return {
          id: sp.pinId,
          label: `${sp.label} -> ${bp.label}`,
          status: 'warning',
          message:
            'Undervoltage notice: HC-SR04 prefers a 5V rail (5V / VIN) for reliable 40 kHz sonar bursts.',
        };
      }
      if (
        preset.id === 'dht22-climate' &&
        boardId === 'esp32' &&
        bp.role === 'power_5v'
      ) {
        hasWarning = true;
        return {
          id: sp.pinId,
          label: `${sp.label} -> ${bp.label}`,
          status: 'warning',
          message:
            'Level mismatch warning: Powering DHT22 at 5V on an ESP32 pulls DATA toward 5V. Prefer 3V3.',
        };
      }
      return {
        id: sp.pinId,
        label: `${sp.label} -> ${bp.label}`,
        status: 'pass',
        message: `Regulated ${bp.voltageSpec} supply OK.`,
      };
    }

    if (sp.expectedRole === 'ground') {
      if (bp.role === 'power_5v' || bp.role === 'power_3v3') {
        hasShortCircuit = true;
        return {
          id: sp.pinId,
          label: `${sp.label} -> ${bp.label}`,
          status: 'error',
          message: `Reversed polarity / short circuit! ${sp.label} must go to GND, never ${bp.label}.`,
        };
      }
      if (bp.role !== 'ground') {
        hasWiringError = true;
        return {
          id: sp.pinId,
          label: `${sp.label} -> ${bp.label}`,
          status: 'error',
          message: `${sp.label} wired to signal pin ${bp.label} instead of GND — circuit reference broken.`,
        };
      }
      return {
        id: sp.pinId,
        label: `${sp.label} -> ${bp.label}`,
        status: 'pass',
        message: 'Common 0V ground return verified.',
      };
    }

    if (sp.expectedRole === 'led_anode') {
      if (bp.role === 'ground') {
        hasWiringError = true;
        return {
          id: sp.pinId,
          label: `${sp.label} -> ${bp.label}`,
          status: 'error',
          message: 'LED Anode (+) is connected to GND — LED will remain off (reverse biased).',
        };
      }
      if (bp.role !== 'digital' && bp.role !== 'power_5v' && bp.role !== 'power_3v3') {
        hasWiringError = true;
        return {
          id: sp.pinId,
          label: `${sp.label} -> ${bp.label}`,
          status: 'error',
          message: `Connect LED Anode (+) to digital output ${sp.idealBoardPins[boardId]}.`,
        };
      }
      return {
        id: sp.pinId,
        label: `${sp.label} -> ${bp.label}`,
        status: 'pass',
        message:
          bp.role === 'digital'
            ? `220Ω current-limited drive via ${bp.label} OK.`
            : `Constant illumination from ${bp.label} rail OK (digital blink unavailable).`,
      };
    }

    // Signal pins (DATA / TRIG / ECHO)
    if (bp.role === 'ground' || bp.role === 'power_5v' || bp.role === 'power_3v3') {
      hasWiringError = true;
      return {
        id: sp.pinId,
        label: `${sp.label} -> ${bp.label}`,
        status: 'error',
        message: `Signal pin ${sp.label} tied directly to ${bp.label} rail — move to a digital GPIO pin.`,
      };
    }

    // Check Trig vs Echo swap on HC-SR04
    if (preset.id === 'hcsr04-sonar') {
      const trigConn = connections.find((c) => c.sensorPinId === 'TRIG');
      const echoConn = connections.find((c) => c.sensorPinId === 'ECHO');
      if (trigConn && echoConn && trigConn.boardPinId === echoConn.boardPinId) {
        hasWiringError = true;
        return {
          id: sp.pinId,
          label: `${sp.label} -> ${bp.label}`,
          status: 'error',
          message: 'TRIG and ECHO are shorted to the same GPIO pin — assign separate pins.',
        };
      }
      if (sp.pinId === 'ECHO' && boardId === 'esp32') {
        hasWarning = true;
        return {
          id: sp.pinId,
          label: `${sp.label} -> ${bp.label}`,
          status: 'warning',
          message: `ESP32 safeguard: add a 1kΩ / 2kΩ voltage divider on ECHO to drop 5V pulse to 3.3V at ${bp.label}.`,
        };
      }
    }

    return {
      id: sp.pinId,
      label: `${sp.label} -> ${bp.label}`,
      status: 'pass',
      message: `Digital signal line connected to ${bp.label} (${bp.voltageSpec}).`,
    };
  });

  // Also ensure no two different sensor pins share GND/GPIO improperly if not ground
  if (hasShortCircuit) {
    return {
      overallStatus: 'short_circuit',
      headline: 'Short circuit detected — do not power real hardware',
      summary:
        'A power rail and ground return are conflicted or reversed. Disconnect/rewire the highlighted red connections before plugging in USB.',
      safeToPowerRealHardware: false,
      hasWarning,
      checks,
      telemetry: {
        primaryLabel: 'Protection Fault',
        primaryValue: 'SHORT / REVERSE POLARITY',
        secondaryLabel: 'Action',
        secondaryValue: 'Fix red pins before USB power',
        ledActive: false,
      },
    };
  }

  if (hasWiringError) {
    return {
      overallStatus: 'wiring_error',
      headline: 'Wiring fault — signal or polarity mismatch',
      summary:
        'At least one wire is mapped to an incompatible pin type. Review the pin check diagnostics below and swap the flagged lead.',
      safeToPowerRealHardware: false,
      hasWarning,
      checks,
      telemetry: {
        primaryLabel: 'Check Result',
        primaryValue: 'PIN MISMATCH',
        secondaryLabel: 'Ready for Bench?',
        secondaryValue: 'No — fix flagged pin',
        ledActive: false,
      },
    };
  }

  if (missingCount > 0) {
    return {
      overallStatus: 'incomplete',
      headline: `Circuit incomplete (${preset.sensorPins.length - missingCount}/${preset.sensorPins.length} pins wired)`,
      summary:
        'Wired connections look safe so far. Finish connecting the remaining sensor pins to run the live hardware check.',
      safeToPowerRealHardware: false,
      hasWarning,
      checks,
      telemetry: {
        primaryLabel: 'Wired Pins',
        primaryValue: `${preset.sensorPins.length - missingCount} / ${preset.sensorPins.length}`,
        secondaryLabel: 'Remaining',
        secondaryValue: `${missingCount} pin${missingCount === 1 ? '' : 's'} left`,
        ledActive: false,
      },
    };
  }

  // Working circuit! Compute realistic simulated hardware telemetry
  if (preset.id === 'led-blink') {
    const anodeConn = connections.find((c) => c.sensorPinId === 'ANODE');
    const drivenByGpio = anodeConn ? findBoardPin(anodeConn.boardPinId)?.role === 'digital' : false;
    const ledLit = drivenByGpio ? env.blinkEnabled : true;
    const currentMa = boardId === 'arduino-uno' ? '13.6 mA (via 220Ω)' : '5.9 mA (via 220Ω)';
    return {
      overallStatus: 'working',
      headline: 'Circuit verified — ready for real wiring',
      summary:
        'Polarity and 220Ω current limiting match safely. You can safely replicate this exact pinout on your physical board.',
      safeToPowerRealHardware: true,
      hasWarning,
      checks,
      telemetry: {
        primaryLabel: 'LED Output State',
        primaryValue: ledLit ? 'ILLUMINATED (Safe Current)' : 'BLINK PAUSED (LOW)',
        secondaryLabel: 'Forward Current',
        secondaryValue: currentMa,
        ledActive: ledLit,
      },
    };
  }

  if (preset.id === 'dht22-climate') {
    return {
      overallStatus: 'working',
      headline: hasWarning
        ? 'Circuit working with 3.3V logic note'
        : 'Circuit verified — sensor streaming live data',
      summary:
        'Power, ground, and single-wire DATA timing check out. Real hardware will report temperature and humidity over Serial Monitor.',
      safeToPowerRealHardware: true,
      hasWarning,
      checks,
      telemetry: {
        primaryLabel: 'Simulated DHT22 Output',
        primaryValue: `${env.temperatureC.toFixed(1)} °C · ${env.humidityPct.toFixed(0)}% RH`,
        secondaryLabel: '1-Wire Checksum',
        secondaryValue: 'VALID (40-bit frame OK)',
        ledActive: true,
      },
    };
  }

  // HC-SR04 Ultrasonic
  const echoUs = Math.round((env.obstacleDistanceCm * 2) / 0.0343);
  return {
    overallStatus: 'working',
    headline: hasWarning
      ? 'Sonar working — check ESP32 Echo divider note'
      : 'Circuit verified — ultrasonic ranging active',
    summary:
      'Power, ground, Trigger, and Echo pins verified. Move the virtual obstacle distance slider to test sonar return time.',
    safeToPowerRealHardware: true,
    hasWarning,
    checks,
    telemetry: {
      primaryLabel: 'Measured Distance',
      primaryValue: `${env.obstacleDistanceCm.toFixed(0)} cm`,
      secondaryLabel: 'Echo Pulse Width',
      secondaryValue: `${echoUs} µs (40 kHz)`,
      ledActive: true,
      pulseDistanceCm: env.obstacleDistanceCm,
    },
  };
}
