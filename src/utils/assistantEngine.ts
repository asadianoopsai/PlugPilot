import { COMPONENTS_DATA } from '../data/componentsData';
import { PROJECTS_DATA } from '../data/projectsData';
import { AssistantRecommendation } from '../types/electronics';

interface IntentRule {
  id: string;
  triggers: string[];
  componentIds: string[];
  roles: Record<string, string>;
  boardPreference: 'esp32' | 'arduino-uno';
  boardRationale: string;
  extraParts: string[];
  relatedProjectIds: string[];
  powerNote: string;
}

const INTENT_RULES: IntentRule[] = [
  {
    id: 'air-gas-safety',
    triggers: ['gas', 'smoke', 'leak', 'lpg', 'methane', 'air quality', 'co2', 'garage', 'kitchen', 'fume'],
    componentIds: ['mq-2', 'mq-135', 'oled-ssd1306', 'relay-5v'],
    roles: {
      'mq-2': 'Detects combustible LPG, methane, propane, and smoke particles.',
      'mq-135': 'Tracks indoor VOCs, ammonia, and stale air quality.',
      'oled-ssd1306': 'Displays live gas ADC levels and SAFE/ALERT status locally.',
      'relay-5v': 'Switches an exhaust fan automatically on gas threshold breach.',
    },
    boardPreference: 'esp32',
    boardRationale: 'ESP32 provides built-in Wi-Fi for mobile safety alerts alongside 12-bit ADC channels.',
    extraParts: ['1 kΩ + 2 kΩ resistor divider (for 5V MQ-2 AO to 3.3V ESP32 ADC)', '3.3V active piezo buzzer'],
    relatedProjectIds: ['gas-leakage-monitoring', 'esp32-smart-home-automation'],
    powerNote: 'MQ-series heaters draw ~160 mA at 5V each—power them from ESP32 VIN (5V USB) rather than the 3.3V regulator.',
  },
  {
    id: 'plant-irrigation',
    triggers: ['plant', 'water', 'soil', 'moisture', 'irrigation', 'garden', 'greenhouse', 'farm', 'drip'],
    componentIds: ['soil-moisture', 'dht22', 'ds18b20', 'relay-5v', 'ldr'],
    roles: {
      'soil-moisture': 'Measures root-zone dielectric soil moisture without copper corrosion.',
      'dht22': 'Monitors greenhouse air temperature and relative humidity.',
      'ds18b20': 'Protects roots against frost-water locking with waterproof soil temperature reads.',
      'relay-5v': 'Drives the submersible pump or solenoid water valve safely.',
      'ldr': 'Prevents midday watering during peak solar evaporation.',
    },
    boardPreference: 'esp32',
    boardRationale: 'ESP32 lets you log moisture trends over Wi-Fi while handling multiple ADC1 sensors.',
    extraParts: ['5V submersible pump or 12V solenoid valve', '1N4007 flyback diode', '10 kΩ pull-down resistor for LDR', '4.7 kΩ pull-up for DS18B20'],
    relatedProjectIds: ['automatic-plant-watering', 'smart-irrigation'],
    powerNote: 'Always isolate inductive water pump power from MCU logic and include a 1N4007 flyback diode across pump terminals.',
  },
  {
    id: 'weather-climate',
    triggers: ['weather', 'temp', 'temperature', 'humidity', 'pressure', 'barometer', 'climate', 'station', 'altitude', 'forecast'],
    componentIds: ['dht22', 'bmp280', 'bh1750', 'oled-ssd1306'],
    roles: {
      'dht22': 'Delivers ±0.5°C temperature and 0–100% relative humidity readings.',
      'bmp280': 'Measures barometric pressure (300–1100 hPa) for storm and altitude tracking.',
      'bh1750': 'Reports calibrated ambient illuminance directly in Lux over I2C.',
      'oled-ssd1306': 'Renders crisp 4-metric telemetry locally over the shared I2C bus.',
    },
    boardPreference: 'esp32',
    boardRationale: 'Native 3.3V I2C logic matches BMP280, BH1750, and SSD1306 directly without level shifters.',
    extraParts: ['Breadboard & jumper wires', 'Optional LiFePO4 battery + solar TP4056 charger for outdoor deployment'],
    relatedProjectIds: ['weather-monitoring-station', 'temperature-monitoring'],
    powerNote: 'Run all I2C sensors (0x76, 0x23, 0x3C) from the regulated 3.3V rail with shared GPIO 21 (SDA) and GPIO 22 (SCL).',
  },
  {
    id: 'parking-distance',
    triggers: ['parking', 'distance', 'ultrasonic', 'obstacle', 'sonar', 'tank', 'level', 'garage door', 'lidar', 'laser'],
    componentIds: ['hc-sr04', 'vl53l0x', 'lcd-16x2-i2c'],
    roles: {
      'hc-sr04': 'Measures 2–400 cm ultrasonic echo range for vehicles or tank fluid surfaces.',
      'vl53l0x': 'Provides narrow-beam 940 nm laser ToF precision up to 2 m.',
      'lcd-16x2-i2c': 'Shows bay availability and exact centimeter clearance.',
    },
    boardPreference: 'arduino-uno',
    boardRationale: 'Arduino Uno runs natively at 5V, matching HC-SR04 and 16×2 LCD backlights with zero voltage dividers.',
    extraParts: ['Green, Yellow, Red LEDs + 3 × 220 Ω resistors'],
    relatedProjectIds: ['smart-parking-system'],
    powerNote: 'If switching to a 3.3V ESP32 with HC-SR04, step down the 5V ECHO pin using a 1 kΩ + 2 kΩ resistor divider.',
  },
  {
    id: 'security-motion',
    triggers: ['motion', 'security', 'intruder', 'alarm', 'pir', 'door', 'window', 'lock', 'presence', 'occupancy'],
    componentIds: ['pir-hc-sr501', 'a3144-hall', 'mpu6050', 'oled-ssd1306'],
    roles: {
      'pir-hc-sr501': 'Detects warm-body infrared movement across a 110° field up to 7 meters.',
      'a3144-hall': 'Senses magnetic door/window reed state contactlessly.',
      'mpu6050': 'Detects physical vibration or enclosure tampering on 6 axes.',
      'oled-ssd1306': 'Displays armed/triggered state and event counter.',
    },
    boardPreference: 'esp32',
    boardRationale: 'ESP32 supports Wi-Fi push alerts and hardware interrupt wakeups from deep sleep.',
    extraParts: ['Small neodymium magnet (for Hall sensor)', 'Active piezo buzzer'],
    relatedProjectIds: ['motion-detection', 'esp32-smart-home-automation'],
    powerNote: 'Allow 30–60 seconds of stillness on power-up so the HC-SR501 PIR settles its ambient IR reference.',
  },
  {
    id: 'robotics-drone-imu',
    triggers: ['robot', 'drone', 'car', 'rover', 'balance', 'gyro', 'tilt', 'bluetooth', 'remote', 'rc', 'compass', 'imu'],
    componentIds: ['mpu6050', 'hc-sr04', 'qmc5883l', 'hc-05', 'nrf24l01'],
    roles: {
      'mpu6050': 'Provides 6-axis gyro/accel pitch and roll feedback for stabilization.',
      'hc-sr04': 'Front-mounted ultrasonic obstacle detection.',
      'qmc5883l': '3-axis magnetic compass heading for rover navigation.',
      'hc-05': 'Classic Bluetooth UART bridge for smartphone teleoperation.',
      'nrf24l01': 'Low-latency 2.4 GHz radio telemetry link up to 100m+.',
    },
    boardPreference: 'arduino-uno',
    boardRationale: 'Deterministic 16 MHz loop timing and 5V PWM timers simplify motor driver and HC-SR04 integration.',
    extraParts: ['L298N or TB6612FNG dual motor driver', '10 µF capacitor across NRF24L01 3.3V VCC/GND'],
    relatedProjectIds: ['motion-detection', 'smart-parking-system'],
    powerNote: 'Keep high-current motor battery grounds tied in a star topology and power NRF24L01 strictly from 3.3V.',
  },
  {
    id: 'smart-home-automation',
    triggers: ['smart home', 'home', 'lamp', 'fan', 'relay', 'switch', 'light', 'automation', 'appliance', 'dashboard'],
    componentIds: ['esp32', 'relay-5v', 'dht22', 'ldr', 'oled-ssd1306'],
    roles: {
      'relay-5v': 'Provides opto-isolated switching for room lights, fans, or DC loads.',
      'dht22': 'Monitors indoor thermal comfort and humidity.',
      'ldr': 'Automates dusk-to-dawn ambient lighting triggers.',
      'oled-ssd1306': 'Displays IP address, sensor metrics, and active relay state.',
    },
    boardPreference: 'esp32',
    boardRationale: 'ESP32 hosts a self-contained Wi-Fi web UI directly on your local router without external hubs.',
    extraParts: ['10 kΩ pull-down resistor for LDR', 'Project enclosure for safe relay isolation'],
    relatedProjectIds: ['esp32-smart-home-automation', 'weather-monitoring-station'],
    powerNote: 'For student prototypes, test relays with safe 5V/12V DC loads first; never expose uninsulated mains AC wiring on a breadboard.',
  },
];

export function generateProjectRecommendation(rawPrompt: string): AssistantRecommendation {
  const prompt = rawPrompt.trim();
  const lower = prompt.toLowerCase();

  const matchedRules = INTENT_RULES.map((rule) => {
    const hitCount = rule.triggers.reduce((acc, kw) => (lower.includes(kw) ? acc + 1 : acc), 0);
    return { rule, hitCount };
  })
    .filter((x) => x.hitCount > 0)
    .sort((a, b) => b.hitCount - a.hitCount);

  const primaryRule = matchedRules[0]?.rule ?? INTENT_RULES[6]; // Default to smart-home-automation template if broad

  // Collect up to 4 unique relevant sensors/modules from top matched rules
  const selectedIds: string[] = [];
  const roleMap: Record<string, string> = {};
  const extraPartsSet = new Set<string>();
  const relatedProjectsSet = new Set<string>();

  for (const { rule } of matchedRules.length > 0 ? matchedRules.slice(0, 2) : [{ rule: primaryRule }]) {
    for (const cid of rule.componentIds) {
      if (cid !== 'esp32' && cid !== 'arduino-uno' && !selectedIds.includes(cid) && selectedIds.length < 4) {
        selectedIds.push(cid);
        roleMap[cid] = rule.roles[cid] || 'Core sensing or interface module for your build.';
      }
    }
    rule.extraParts.forEach((p) => extraPartsSet.add(p));
    rule.relatedProjectIds.forEach((pid) => relatedProjectsSet.add(pid));
  }

  // Board choice: if user explicitly mentions arduino or uno, honor it; if wifi/iot/esp32, choose esp32
  let boardId: 'esp32' | 'arduino-uno' = primaryRule.boardPreference;
  let boardRationale = primaryRule.boardRationale;
  if (lower.includes('arduino') || lower.includes('uno')) {
    boardId = 'arduino-uno';
    boardRationale = 'Selected Arduino Uno R3 per your preference—ideal for 5V sensors and straightforward C++ timing.';
  } else if (lower.includes('esp32') || lower.includes('wifi') || lower.includes('iot') || lower.includes('web')) {
    boardId = 'esp32';
    boardRationale = 'Selected ESP32 DevKit V1 for integrated 2.4 GHz Wi-Fi, BLE, and 3.3V high-speed I2C/ADC peripherals.';
  }

  const boardComp = COMPONENTS_DATA.find((c) => c.id === boardId) ?? COMPONENTS_DATA[0];

  const suggestedComponents = selectedIds
    .map((id) => {
      const comp = COMPONENTS_DATA.find((c) => c.id === id);
      if (!comp) return null;
      return {
        componentId: comp.id,
        name: comp.name,
        role: roleMap[id] ?? comp.shortSummary,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const cleanWords = prompt.split(/\s+/).slice(0, 7).join(' ');
  const projectTitle =
    prompt.length <= 64
      ? prompt.charAt(0).toUpperCase() + prompt.slice(1)
      : `${cleanWords.charAt(0).toUpperCase() + cleanWords.slice(1)} (${boardComp.partNumber})`;

  const wiringSummary = suggestedComponents.map((item, idx) => {
    const comp = COMPONENTS_DATA.find((c) => c.id === item.componentId);
    const iface = comp?.interfaceType ?? 'GPIO';
    if (iface.includes('I2C')) {
      return `${comp?.partNumber}: Connect SDA/SCL to ${boardId === 'esp32' ? 'GPIO 21 / GPIO 22' : 'A4 / A5'} and power via ${boardId === 'esp32' ? '3V3' : '5V'}.`;
    }
    if (iface.includes('Analog')) {
      return `${comp?.partNumber}: Route analog signal to ${boardId === 'esp32' ? `GPIO ${34 + (idx % 2)} (ADC1)` : `A${idx % 4}`}; check 3.3V divider if sensor outputs 5V.`;
    }
    return `${comp?.partNumber}: Connect digital signal pin to ${boardId === 'esp32' ? `GPIO ${4 + idx * 2}` : `D${2 + idx * 2}`} and tie GND to common ground.`;
  });

  const relatedIds = Array.from(relatedProjectsSet).filter((id) =>
    PROJECTS_DATA.some((p) => p.id === id)
  );

  const starterCodeSnippet = `// Plug Pilot Demo Architecture Starter (${boardComp.partNumber})
// Target: ${projectTitle}
#include <Wire.h>

void setup() {
  Serial.begin(${boardId === 'esp32' ? '115200' : '9600'});
  Wire.begin(${boardId === 'esp32' ? '21, 22' : ''});
  Serial.println("Plug Pilot prototype booting...");
  // Initialize ${suggestedComponents.map((c) => c.componentId.toUpperCase()).join(', ')}
}

void loop() {
  // 1. Sample primary sensors & apply calibration
  // 2. Evaluate safety / automation threshold
  // 3. Update display & actuator state
  delay(1000);
}`;

  return {
    projectTitle,
    summary: `Recommended ${boardComp.partNumber} architecture tailored for "${prompt}" using ${suggestedComponents.length} core modules and ${relatedIds.length} matching Plug Pilot reference guide${relatedIds.length === 1 ? '' : 's'}.`,
    recommendedBoardId: boardComp.id,
    recommendedBoardName: boardComp.name,
    boardRationale,
    suggestedComponents,
    additionalHardware: Array.from(extraPartsSet).slice(0, 4),
    architectureSteps: [
      `Bench-test each sensor individually with ${boardComp.partNumber} over Serial Monitor before combining them.`,
      'Establish a clean 3.3V / 5V breadboard power rail and verify common GND across all modules.',
      'Integrate I2C peripherals first (confirm addresses with an I2C scanner), then add analog/actuator thresholds.',
      'Add non-blocking millis() timers and hysteresis margins so relays or alerts do not chatter.',
    ],
    wiringSummary,
    powerAndSafetyNote: primaryRule.powerNote,
    relatedProjectIds: relatedIds.length > 0 ? relatedIds : ['esp32-smart-home-automation'],
    starterCodeSnippet,
  };
}
