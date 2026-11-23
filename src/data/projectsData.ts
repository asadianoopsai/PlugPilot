import { ElectronicsProject } from '../types/electronics';

export const PROJECTS_DATA: ElectronicsProject[] = [
  {
    id: 'esp32-smart-home-automation',
    title: 'ESP32 Smart Home Automation',
    subtitle: 'Wi-Fi web-controlled relay switching with live room climate and daylight telemetry.',
    difficulty: 'Intermediate',
    estimatedTime: '60 mins',
    primaryBoard: 'ESP32',
    imageUrl: '/src/assets/images/project_smart_home_1795446219617.jpg',
    featured: true,
    overview:
      'Build a local Wi-Fi smart home hub using the ESP32 DevKit V1. The board hosts a lightweight HTTP control server on your local network, letting you toggle appliances via a relay module while monitoring room temperature, humidity (DHT22), and ambient daylight (LDR) on an I2C OLED screen.',
    requiredComponentIds: ['esp32', 'dht22', 'oled-ssd1306', 'relay-5v', 'ldr'],
    additionalParts: [
      '1 × 10 kΩ resistor (for LDR voltage divider)',
      'Breadboard and 12 × Male-to-Female / Male-to-Male jumper wires',
      'Micro-USB data cable (5V power + flashing)',
    ],
    buildSteps: [
      {
        stepNumber: 1,
        title: 'Power Rails & 3.3V Logic Verification',
        detail:
          'Seat the ESP32 across the center bridge of your breadboard. Route 3V3 and GND to the side power rails for the DHT22, OLED, and LDR, while keeping the 5V relay coil powered from the ESP32 VIN pin.',
      },
      {
        stepNumber: 2,
        title: 'Connect I2C OLED & DHT22 Sensor',
        detail:
          'Wire OLED SDA to GPIO 21 and SCL to GPIO 22. Connect DHT22 DATA to GPIO 4.',
      },
      {
        stepNumber: 3,
        title: 'Wire LDR Divider & Relay Actuator',
        detail:
          'Place the LDR between 3V3 and GPIO 34, with a 10 kΩ pull-down resistor from GPIO 34 to GND. Wire the relay IN pin to GPIO 26.',
      },
      {
        stepNumber: 4,
        title: 'Configure Wi-Fi Credentials & Upload',
        detail:
          'Update SSID and PASSWORD in the firmware, install DHT sensor + Adafruit SSD1306 libraries, and flash at 115200 baud.',
      },
    ],
    wiringInstructions: [
      {
        id: 'w1',
        fromComponent: 'DHT22',
        fromPin: 'VCC / GND',
        toBoardPin: '3V3 / GND',
        wireColor: 'red',
        note: '3.3V safe supply',
      },
      {
        id: 'w2',
        fromComponent: 'DHT22',
        fromPin: 'DATA',
        toBoardPin: 'GPIO 4',
        wireColor: 'cyan',
        note: 'Single-wire telemetry input',
      },
      {
        id: 'w3',
        fromComponent: 'SSD1306 OLED',
        fromPin: 'SDA / SCL',
        toBoardPin: 'GPIO 21 / 22',
        wireColor: 'amber',
        note: 'Hardware I2C bus',
      },
      {
        id: 'w4',
        fromComponent: 'LDR Divider',
        fromPin: 'Junction',
        toBoardPin: 'GPIO 34 (ADC1)',
        wireColor: 'violet',
        note: 'Safe ADC1 input with Wi-Fi active',
      },
      {
        id: 'w5',
        fromComponent: '5V Relay',
        fromPin: 'VCC / IN',
        toBoardPin: 'VIN (5V) / GPIO 26',
        wireColor: 'emerald',
        note: 'Active-LOW relay trigger',
      },
    ],
    codeLanguage: 'cpp',
    codeFilename: 'esp32_smart_home.ino',
    code: `#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

const char* WIFI_SSID = "YourNetworkSSID";
const char* WIFI_PASS = "YourNetworkPassword";

#define DHT_PIN 4
#define DHT_TYPE DHT22
#define RELAY_PIN 26
#define LDR_PIN 34

DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_SSD1306 display(128, 64, &Wire, -1);
WebServer server(80);

bool relayActive = false;
float lastTemp = 0.0;
float lastHum = 0.0;

void updateOled(int lightLevel) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("PlugPilot Smart Hub");
  display.printf("Temp: %.1f C\n", lastTemp);
  display.printf("Hum:  %.1f %%\n", lastHum);
  display.printf("Lux~: %d / 4095\n", lightLevel);
  display.printf("Load: %s\n", relayActive ? "ON" : "OFF");
  display.display();
}

void handleRoot() {
  String html = "<h2>PlugPilot Smart Home</h2>";
  html += "<p>Temp: " + String(lastTemp, 1) + " C | Hum: " + String(lastHum, 1) + "%</p>";
  html += "<p>Relay: <b>" + String(relayActive ? "ON" : "OFF") + "</b></p>";
  html += "<a href='/toggle'><button>Toggle Relay</button></a>";
  server.send(200, "text/html", html);
}

void handleToggle() {
  relayActive = !relayActive;
  digitalWrite(RELAY_PIN, relayActive ? LOW : HIGH);
  server.sendHeader("Location", "/");
  server.send(303);
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Active-LOW off
  dht.begin();
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\nIP: " + WiFi.localIP().toString());

  server.on("/", handleRoot);
  server.on("/toggle", handleToggle);
  server.begin();
}

void loop() {
  server.handleClient();
  static unsigned long lastRead = 0;
  if (millis() - lastRead > 2000) {
    lastRead = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) {
      lastTemp = t;
      lastHum = h;
    }
    int lightVal = analogRead(LDR_PIN);
    updateOled(lightVal);
  }
}`,
    codeExplanations: [
      {
        section: 'Pin & Peripheral Configuration',
        lines: 'Lines 9–14',
        explanation:
          'Maps DHT22 to GPIO 4, active-LOW relay control to GPIO 26, and the LDR voltage divider to GPIO 34 (an ADC1 channel that never conflicts with ESP32 Wi-Fi).',
      },
      {
        section: 'Non-Blocking HTTP Server',
        lines: 'Lines 37–51 & 69',
        explanation:
          'WebServer listens on port 80 and exposes / and /toggle routes. Calling server.handleClient() inside loop() processes browser clicks immediately.',
      },
      {
        section: '2-Second Sensor Polling Timer',
        lines: 'Lines 70–82',
        explanation:
          'Uses millis() instead of delay(2000) so web requests stay responsive while respecting the DHT22 0.5 Hz minimum sampling interval.',
      },
    ],
    troubleshooting: [
      {
        symptom: 'OLED screen remains blank after flashing',
        cause: 'I2C address mismatch or swapped SDA/SCL pins',
        resolution: 'Verify SDA is on GPIO 21 and SCL on GPIO 22; try address 0x3D if 0x3C fails.',
      },
      {
        symptom: 'LDR always reads 4095 regardless of light',
        cause: 'Missing 10 kΩ pull-down resistor to GND',
        resolution: 'Ensure the 10 kΩ resistor connects from GPIO 34 to GND to complete the voltage divider.',
      },
      {
        symptom: 'Relay turns ON immediately at boot',
        cause: 'Module is Active-LOW and pin defaulted to LOW',
        resolution: 'Write digitalWrite(RELAY_PIN, HIGH) right after pinMode() in setup().',
      },
    ],
    expectedResult:
      'Serial Monitor prints the ESP32 local IP address (e.g., 192.168.1.42). Visiting that IP in any phone or desktop browser displays live room temperature/humidity and toggles the relay cleanly while updating the OLED readout.',
    keywords: ['smart home', 'wifi', 'iot', 'relay', 'automation', 'web server', 'esp32'],
  },
  {
    id: 'automatic-plant-watering',
    title: 'Automatic Plant Watering',
    subtitle: 'Closed-loop soil moisture sensing with Arduino Uno and hysteresis-protected pump relay.',
    difficulty: 'Beginner',
    estimatedTime: '35 mins',
    primaryBoard: 'Arduino Uno',
    imageUrl: '/src/assets/images/project_plant_watering_1795446219569.jpg',
    featured: true,
    overview:
      'Eliminate underwatering and root rot by automating plant hydration. An Arduino Uno continuously samples a corrosion-resistant capacitive soil moisture probe and triggers a 5V submersible pump via a relay whenever moisture drops below your calibrated dry threshold.',
    requiredComponentIds: ['arduino-uno', 'soil-moisture', 'relay-5v'],
    additionalParts: [
      '1 × 5V DC mini submersible water pump + silicone tubing',
      '1 × 1N4007 flyback diode across pump terminals',
      'External 5V USB power bank for pump isolation',
    ],
    buildSteps: [
      {
        stepNumber: 1,
        title: 'Calibrate Dry & Wet Probe Values',
        detail:
          'Plug the capacitive sensor into 5V, GND, and A0. Record the raw ADC value in dry air (~580–650) and submerged in water (~260–310).',
      },
      {
        stepNumber: 2,
        title: 'Wire the Relay & Pump Loop',
        detail:
          'Connect Relay IN to Arduino D7. Route the external pump positive wire through Relay COM and NO (Normally Open).',
      },
      {
        stepNumber: 3,
        title: 'Protect Against Back-EMF',
        detail:
          'Place a 1N4007 diode across the pump motor leads (stripe facing positive) to absorb inductive voltage spikes when the relay opens.',
      },
      {
        stepNumber: 4,
        title: 'Flash & Test Soak Cycle',
        detail:
          'Upload the sketch and lift the probe out of wet soil; verify the relay clicks ON for a controlled 3-second pulse then pauses to let water diffuse.',
      },
    ],
    wiringInstructions: [
      {
        id: 'pw1',
        fromComponent: 'Soil Moisture Sensor',
        fromPin: 'VCC / GND',
        toBoardPin: '5V / GND',
        wireColor: 'red',
        note: 'Clean 5V reference',
      },
      {
        id: 'pw2',
        fromComponent: 'Soil Moisture Sensor',
        fromPin: 'AOUT',
        toBoardPin: 'A0',
        wireColor: 'cyan',
        note: '10-bit analog moisture signal',
      },
      {
        id: 'pw3',
        fromComponent: '5V Relay',
        fromPin: 'VCC / GND',
        toBoardPin: '5V / GND',
        wireColor: 'black',
        note: 'Relay coil supply',
      },
      {
        id: 'pw4',
        fromComponent: '5V Relay',
        fromPin: 'IN',
        toBoardPin: 'D7',
        wireColor: 'emerald',
        note: 'Pump trigger output',
      },
    ],
    codeLanguage: 'cpp',
    codeFilename: 'auto_plant_watering.ino',
    code: `#define MOISTURE_PIN A0
#define RELAY_PIN 7

// Adjust based on your calibration readings
const int DRY_VALUE = 590;
const int WET_VALUE = 280;
const int TRIGGER_PERCENT = 35;

void setup() {
  Serial.begin(9600);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Keep pump OFF initially
  Serial.println("PlugPilot Plant Watering Initialized");
}

void loop() {
  int raw = analogRead(MOISTURE_PIN);
  int moisturePct = map(raw, DRY_VALUE, WET_VALUE, 0, 100);
  moisturePct = constrain(moisturePct, 0, 100);

  Serial.print("Raw ADC: ");
  Serial.print(raw);
  Serial.print(" | Moisture: ");
  Serial.print(moisturePct);
  Serial.println("%");

  if (moisturePct < TRIGGER_PERCENT) {
    Serial.println("Soil dry -> Running pump for 3s...");
    digitalWrite(RELAY_PIN, LOW);  // Pump ON
    delay(3000);
    digitalWrite(RELAY_PIN, HIGH); // Pump OFF
    Serial.println("Soak pause (15s) to allow soil absorption...");
    delay(15000);
  } else {
    delay(2000);
  }
}`,
    codeExplanations: [
      {
        section: 'Calibration Mapping',
        lines: 'Lines 17–18',
        explanation:
          'map() inverts the raw capacitive ADC reading (higher voltage = drier) into an intuitive 0–100% moisture scale, clamped by constrain().',
      },
      {
        section: 'Controlled Pulse + Soak Delay',
        lines: 'Lines 26–33',
        explanation:
          'Instead of running continuously until the sensor reads wet, the firmware pumps for 3 seconds and waits 15 seconds so water has time to percolate to the probe.',
      },
    ],
    troubleshooting: [
      {
        symptom: 'Arduino resets whenever the pump turns off',
        cause: 'Inductive kickback or voltage sag from sharing USB power with pump',
        resolution: 'Power the pump from a separate 5V supply and install a 1N4007 flyback diode across pump wires.',
      },
      {
        symptom: 'Moisture always reports 0% or 100%',
        cause: 'Un-calibrated DRY_VALUE and WET_VALUE constants',
        resolution: 'Read Raw ADC in Serial Monitor in dry air and water, then update lines 5–6.',
      },
    ],
    expectedResult:
      'Serial Monitor logs soil moisture percentage every 2 seconds. When moisture falls below 35%, the relay LED illuminates, water flows for 3 seconds, and the system pauses 15 seconds to prevent over-watering.',
    keywords: ['plant', 'watering', 'soil', 'pump', 'moisture', 'garden', 'beginner'],
  },
  {
    id: 'temperature-monitoring',
    title: 'Temperature Monitoring',
    subtitle: 'Dual-sensor thermal bench monitor comparing LM35 analog accuracy against DS18B20 1-Wire digital.',
    difficulty: 'Beginner',
    estimatedTime: '30 mins',
    primaryBoard: 'Arduino Uno',
    featured: true,
    overview:
      'Learn the practical difference between analog and digital temperature sensing. You will wire both an LM35 analog IC and a waterproof DS18B20 1-Wire probe to an Arduino Uno and render live Celsius/Fahrenheit readouts on a 0.96" OLED display.',
    requiredComponentIds: ['arduino-uno', 'lm35', 'ds18b20', 'oled-ssd1306'],
    additionalParts: [
      '1 × 4.7 kΩ pull-up resistor (required for DS18B20 DQ line)',
      'Breadboard and jumper wires',
    ],
    buildSteps: [
      {
        stepNumber: 1,
        title: 'Wire the LM35 Analog Sensor',
        detail: 'Connect LM35 pin 1 to 5V, pin 2 (VOUT) to A0, and pin 3 to GND.',
      },
      {
        stepNumber: 2,
        title: 'Wire the DS18B20 with 4.7 kΩ Pull-Up',
        detail:
          'Connect Red to 5V, Black to GND, and Yellow (DQ) to D2. Place a 4.7 kΩ resistor bridging D2 and 5V.',
      },
      {
        stepNumber: 3,
        title: 'Attach the I2C OLED Display',
        detail: 'Connect OLED VCC to 5V, GND to GND, SDA to A4, and SCL to A5.',
      },
      {
        stepNumber: 4,
        title: 'Install Libraries & Upload',
        detail:
          'Install OneWire, DallasTemperature, and Adafruit_SSD1306 in Arduino IDE, then upload and open Serial Monitor at 9600 baud.',
      },
    ],
    wiringInstructions: [
      { id: 'tm1', fromComponent: 'LM35', fromPin: 'VOUT (Pin 2)', toBoardPin: 'A0', wireColor: 'cyan', note: '10 mV/°C analog output' },
      { id: 'tm2', fromComponent: 'DS18B20', fromPin: 'DQ (Yellow)', toBoardPin: 'D2 (+4.7kΩ to 5V)', wireColor: 'amber', note: '1-Wire digital bus' },
      { id: 'tm3', fromComponent: 'SSD1306 OLED', fromPin: 'SDA / SCL', toBoardPin: 'A4 / A5', wireColor: 'emerald', note: 'Arduino Uno hardware I2C' },
      { id: 'tm4', fromComponent: 'All Sensors', fromPin: 'VCC / GND', toBoardPin: '5V / GND', wireColor: 'red', note: 'Shared 5V power rail' },
    ],
    codeLanguage: 'cpp',
    codeFilename: 'dual_temp_monitor.ino',
    code: `#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define LM35_PIN A0
#define ONE_WIRE_BUS 2

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Serial.begin(9600);
  ds18b20.begin();
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
}

void loop() {
  // 1. Read LM35 Analog (5.0V ref, 10-bit ADC = 1024 steps)
  int rawAdc = analogRead(LM35_PIN);
  float voltageMv = (rawAdc / 1024.0) * 5000.0;
  float lm35TempC = voltageMv / 10.0;

  // 2. Read DS18B20 Digital
  ds18b20.requestTemperatures();
  float dsTempC = ds18b20.getTempCByIndex(0);

  Serial.print("LM35: "); Serial.print(lm35TempC, 1);
  Serial.print(" C | DS18B20: "); Serial.print(dsTempC, 2);
  Serial.println(" C");

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("THERMAL MONITOR");
  display.setCursor(0, 20);
  display.print("LM35:    "); display.print(lm35TempC, 1); display.println(" C");
  display.setCursor(0, 38);
  display.print("DS18B20: "); display.print(dsTempC, 2); display.println(" C");
  display.display();

  delay(1000);
}`,
    codeExplanations: [
      {
        section: 'LM35 Millivolt Conversion',
        lines: 'Lines 22–24',
        explanation:
          'Converts the 0–1023 10-bit ADC integer into millivolts relative to 5000 mV, then divides by 10 mV/°C to obtain Celsius.',
      },
      {
        section: 'DS18B20 Bus Polling',
        lines: 'Lines 27–28',
        explanation:
          'requestTemperatures() commands the probe to execute a 12-bit conversion, and getTempCByIndex(0) fetches the signed floating-point value.',
      },
    ],
    troubleshooting: [
      {
        symptom: 'DS18B20 prints -127.00 C',
        cause: 'Missing 4.7 kΩ pull-up resistor or swapped data/power pins',
        resolution: 'Verify the 4.7 kΩ resistor bridges DQ (D2) and 5V, and re-check probe wire colors.',
      },
      {
        symptom: 'LM35 readings fluctuate by ±3°C',
        cause: 'Electrical noise on shared USB 5V rail or long jumper wires',
        resolution: 'Average 10 consecutive analogRead() samples and add a 0.1 µF capacitor across LM35 VCC and GND.',
      },
    ],
    expectedResult:
      'Both Serial Monitor and the OLED display show side-by-side live Celsius readouts from the LM35 and DS18B20 within ~0.5°C of each other.',
    keywords: ['temperature', 'lm35', 'ds18b20', 'thermometer', 'oled', 'monitor'],
  },
  {
    id: 'motion-detection',
    title: 'Motion Detection',
    subtitle: 'Interrupt-driven PIR human presence & MPU6050 vibration security alarm.',
    difficulty: 'Beginner',
    estimatedTime: '35 mins',
    primaryBoard: 'Arduino Uno',
    overview:
      'Combine passive infrared occupancy sensing (HC-SR501) with 3-axis accelerometer tamper detection (MPU6050) to build a reliable dual-layer security node that triggers an audible buzzer and LED indicator upon room entry or enclosure movement.',
    requiredComponentIds: ['arduino-uno', 'pir-hc-sr501', 'mpu6050'],
    additionalParts: [
      '1 × 5V active piezo buzzer + 1 × LED with 220 Ω resistor',
      'Breadboard and jumper wires',
    ],
    buildSteps: [
      {
        stepNumber: 1,
        title: 'Connect HC-SR501 PIR Sensor',
        detail: 'Wire PIR VCC to 5V, GND to GND, and OUT to digital pin D2 (hardware interrupt INT0).',
      },
      {
        stepNumber: 2,
        title: 'Wire MPU6050 on I2C',
        detail: 'Connect MPU6050 VCC to 5V, GND to GND, SDA to A4, and SCL to A5.',
      },
      {
        stepNumber: 3,
        title: 'Add Buzzer & Status LED',
        detail: 'Connect active buzzer positive to D8 and LED (through 220 Ω resistor) to D13.',
      },
      {
        stepNumber: 4,
        title: 'Allow 45s PIR Warm-Up',
        detail: 'Upload the code and keep the room still for 45 seconds during initial ambient IR baseline calibration.',
      },
    ],
    wiringInstructions: [
      { id: 'md1', fromComponent: 'HC-SR501 PIR', fromPin: 'OUT', toBoardPin: 'D2', wireColor: 'cyan', note: '3.3V active-HIGH motion trigger' },
      { id: 'md2', fromComponent: 'MPU6050', fromPin: 'SDA / SCL', toBoardPin: 'A4 / A5', wireColor: 'amber', note: 'I2C tamper accelerometer' },
      { id: 'md3', fromComponent: 'Piezo Buzzer', fromPin: '+', toBoardPin: 'D8', wireColor: 'violet', note: 'Audible alert output' },
      { id: 'md4', fromComponent: 'Status LED', fromPin: 'Anode (+220Ω)', toBoardPin: 'D13', wireColor: 'emerald', note: 'Visual alert indicator' },
    ],
    codeLanguage: 'cpp',
    codeFilename: 'dual_motion_detector.ino',
    code: `#include <Wire.h>

#define PIR_PIN 2
#define BUZZER_PIN 8
#define LED_PIN 13
const int MPU_ADDR = 0x68;

int16_t baseX, baseY, baseZ;

void readAccel(int16_t &x, int16_t &y, int16_t &z) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);
  x = Wire.read() << 8 | Wire.read();
  y = Wire.read() << 8 | Wire.read();
  z = Wire.read() << 8 | Wire.read();
}

void setup() {
  Serial.begin(9600);
  pinMode(PIR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  Wire.begin();
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // PWR_MGMT_1 register
  Wire.write(0);    // Wake up MPU6050
  Wire.endTransmission(true);

  delay(200);
  readAccel(baseX, baseY, baseZ);
  Serial.println("PIR calibrating (30s)... keep clear.");
}

void loop() {
  bool pirTriggered = digitalRead(PIR_PIN) == HIGH;

  int16_t ax, ay, az;
  readAccel(ax, ay, az);
  long delta = abs(ax - baseX) + abs(ay - baseY) + abs(az - baseZ);
  bool tamperTriggered = delta > 2500;

  if (pirTriggered || tamperTriggered) {
    digitalWrite(LED_PIN, HIGH);
    digitalWrite(BUZZER_PIN, HIGH);
    Serial.println(pirTriggered ? "ALERT: PIR Motion!" : "ALERT: Device Moved!");
    delay(500);
  } else {
    digitalWrite(LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
  }
  delay(100);
}`,
    codeExplanations: [
      {
        section: 'MPU6050 Wake-Up & Baseline',
        lines: 'Lines 25–32',
        explanation:
          'Writes 0 to register 0x6B to wake the MPU6050 from sleep mode, then captures initial resting X/Y/Z gravity vectors.',
      },
      {
        section: 'Dual-Sensor Alarm Logic',
        lines: 'Lines 37–45',
        explanation:
          'Fires the alarm if either the PIR pin goes HIGH or the L1 acceleration delta exceeds 2500 LSB (indicating someone bumped or tilted the unit).',
      },
    ],
    troubleshooting: [
      {
        symptom: 'PIR triggers continuously even in an empty room',
        cause: 'Sensitivity pot turned too high or sensor facing HVAC vent / sunlight',
        resolution: 'Rotate the HC-SR501 sensitivity trimpot counter-clockwise and aim away from heaters.',
      },
      {
        symptom: 'Tamper alert never fires when tilted',
        cause: 'MPU6050 SDA/SCL swapped or missing wake-up write to 0x6B',
        resolution: 'Confirm A4=SDA and A5=SCL and verify 0x68 responds on an I2C scanner.',
      },
    ],
    expectedResult:
      'Walking past the PIR dome or tilting the breadboard triggers the LED and buzzer immediately while logging the exact trigger source to Serial Monitor.',
    keywords: ['motion', 'pir', 'security', 'alarm', 'mpu6050', 'intruder'],
  },
  {
    id: 'smart-parking-system',
    title: 'Smart Parking System',
    subtitle: 'Ultrasonic bay distance guidance with 16×2 I2C LCD occupancy counter.',
    difficulty: 'Intermediate',
    estimatedTime: '45 mins',
    primaryBoard: 'Arduino Uno',
    featured: true,
    overview:
      'Design a scale smart parking bay assistant that measures approaching vehicle distance with an HC-SR04 sonar sensor, guides drivers with green/amber/red stop-zone LEDs, and prints exact clearance in centimeters plus bay status on a 16×2 I2C LCD.',
    requiredComponentIds: ['arduino-uno', 'hc-sr04', 'lcd-16x2-i2c'],
    additionalParts: [
      '3 × LEDs (Green, Yellow, Red) + 3 × 220 Ω resistors',
      'Breadboard and jumper wires',
    ],
    buildSteps: [
      {
        stepNumber: 1,
        title: 'Mount & Wire the HC-SR04',
        detail: 'Connect VCC to 5V, GND to GND, TRIG to D9, and ECHO to D10.',
      },
      {
        stepNumber: 2,
        title: 'Connect the 16×2 I2C LCD',
        detail: 'Wire LCD VCC to 5V, GND to GND, SDA to A4, and SCL to A5.',
      },
      {
        stepNumber: 3,
        title: 'Wire the Traffic Guidance LEDs',
        detail: 'Connect Green LED to D4, Yellow to D5, and Red (Stop) to D6, each via a 220 Ω series resistor.',
      },
      {
        stepNumber: 4,
        title: 'Test Distance Zones',
        detail: 'Move a flat book or cardboard target toward the sonar cones and watch the zone thresholds transition cleanly.',
      },
    ],
    wiringInstructions: [
      { id: 'sp1', fromComponent: 'HC-SR04', fromPin: 'TRIG / ECHO', toBoardPin: 'D9 / D10', wireColor: 'cyan', note: 'Ultrasonic pulse pair' },
      { id: 'sp2', fromComponent: '16x2 I2C LCD', fromPin: 'SDA / SCL', toBoardPin: 'A4 / A5', wireColor: 'amber', note: 'I2C display bus (0x27)' },
      { id: 'sp3', fromComponent: 'Zone LEDs', fromPin: 'G / Y / R', toBoardPin: 'D4 / D5 / D6', wireColor: 'emerald', note: 'Stop-zone indicators' },
      { id: 'sp4', fromComponent: 'System Power', fromPin: '5V / GND', toBoardPin: '5V / GND', wireColor: 'red', note: 'Common 5V rail' },
    ],
    codeLanguage: 'cpp',
    codeFilename: 'smart_parking_bay.ino',
    code: `#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define TRIG_PIN 9
#define ECHO_PIN 10
#define LED_GREEN 4
#define LED_YELLOW 5
#define LED_RED 6

LiquidCrystal_I2C lcd(0x27, 16, 2);

long measureCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return 999;
  return (duration * 0.0343) / 2;
}

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  lcd.init();
  lcd.backlight();
  lcd.print("PlugPilot Park");
  delay(1000);
}

void loop() {
  long cm = measureCm();

  digitalWrite(LED_GREEN, cm > 40);
  digitalWrite(LED_YELLOW, cm <= 40 && cm > 15);
  digitalWrite(LED_RED, cm <= 15);

  lcd.clear();
  lcd.setCursor(0, 0);
  if (cm > 120) {
    lcd.print("Bay: AVAILABLE  ");
  } else if (cm <= 15) {
    lcd.print("Bay: STOP NOW!  ");
  } else {
    lcd.print("Bay: OCCUPIED   ");
  }
  lcd.setCursor(0, 1);
  lcd.print("Dist: ");
  lcd.print(cm < 400 ? String(cm) + " cm" : ">400 cm");

  delay(250);
}`,
    codeExplanations: [
      {
        section: 'Timeout-Protected Sonar Ping',
        lines: 'Lines 12–21',
        explanation:
          'pulseIn(..., 30000) prevents the microcontroller from freezing for a full second if no acoustic echo returns.',
      },
      {
        section: 'Zone LED & LCD Feedback',
        lines: 'Lines 38–52',
        explanation:
          'Green lights above 40 cm, Yellow warns between 15–40 cm, and Red signals STOP below 15 cm while printing bay availability.',
      },
    ],
    troubleshooting: [
      {
        symptom: 'LCD backlight is on but text is invisible',
        cause: 'Contrast potentiometer out of range or wrong I2C address',
        resolution: 'Turn the blue trimpot on the I2C backpack clockwise, or change 0x27 to 0x3F.',
      },
      {
        symptom: 'Distance randomly spikes to 0 cm',
        cause: 'Acoustic cross-talk or angled soft surface absorbing sound',
        resolution: 'Keep test target flat and perpendicular to the sensor within 2–200 cm.',
      },
    ],
    expectedResult:
      'The 16×2 LCD updates 4 times per second showing bay status and exact centimeter distance while transitioning smoothly from Green to Yellow to Red.',
    keywords: ['parking', 'ultrasonic', 'hc-sr04', 'lcd', 'distance', 'car'],
  },
  {
    id: 'gas-leakage-monitoring',
    title: 'Gas Leakage Monitoring',
    subtitle: 'ESP32 flammable gas & smoke detector with local buzzer and live ppm alert threshold.',
    difficulty: 'Intermediate',
    estimatedTime: '45 mins',
    primaryBoard: 'ESP32',
    overview:
      'Protect kitchens, garages, and battery charging stations by monitoring combustible gas (LPG, methane, propane) and smoke concentrations with an MQ-2 sensor, displaying live ADC levels on a 16×2 LCD or Serial console and triggering an alert when levels breach safe baselines.',
    requiredComponentIds: ['esp32', 'mq-2', 'lcd-16x2-i2c'],
    additionalParts: [
      '1 × 1 kΩ + 1 × 2 kΩ resistor (5V-to-3.3V divider on MQ-2 AO)',
      '1 × 3.3V active buzzer + jumper wires',
    ],
    buildSteps: [
      {
        stepNumber: 1,
        title: 'Power MQ-2 Heater from 5V VIN',
        detail:
          'Connect MQ-2 VCC to ESP32 VIN (5V) and GND to GND so the internal SnO2 heater reaches operating temperature.',
      },
      {
        stepNumber: 2,
        title: 'Build the Analog Protection Divider',
        detail:
          'Because MQ-2 AO can swing up to 5V, pass AO through a 1 kΩ resistor into GPIO 35, with a 2 kΩ resistor from GPIO 35 to GND.',
      },
      {
        stepNumber: 3,
        title: 'Wire Status Buzzer & LCD',
        detail: 'Connect buzzer to GPIO 25 and I2C LCD SDA/SCL to GPIO 21/22 (powered from VIN 5V).',
      },
      {
        stepNumber: 4,
        title: 'Warm Up & Calibrate Clean-Air Baseline',
        detail:
          'Run the firmware for 30 seconds in clean air; the sketch auto-calibrates baseline + 450 threshold margin.',
      },
    ],
    wiringInstructions: [
      { id: 'gl1', fromComponent: 'MQ-2', fromPin: 'VCC / GND', toBoardPin: 'VIN (5V) / GND', wireColor: 'red', note: 'Heater needs full 5V' },
      { id: 'gl2', fromComponent: 'MQ-2', fromPin: 'AO (via 1k/2k div)', toBoardPin: 'GPIO 35', wireColor: 'cyan', note: 'Scaled 0–3.3V analog gas signal' },
      { id: 'gl3', fromComponent: '16x2 LCD', fromPin: 'SDA / SCL', toBoardPin: 'GPIO 21 / 22', wireColor: 'amber', note: 'Live ppm & alarm readout' },
      { id: 'gl4', fromComponent: 'Piezo Buzzer', fromPin: '+', toBoardPin: 'GPIO 25', wireColor: 'violet', note: 'Audible leak alarm' },
    ],
    codeLanguage: 'cpp',
    codeFilename: 'gas_leak_monitor.ino',
    code: `#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define GAS_PIN 35
#define BUZZER_PIN 25

LiquidCrystal_I2C lcd(0x27, 16, 2);
int baseline = 0;

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  lcd.init();
  lcd.backlight();

  lcd.setCursor(0, 0);
  lcd.print("Preheating MQ-2");
  for (int i = 20; i > 0; i--) {
    lcd.setCursor(0, 1);
    lcd.printf("Wait: %2d sec    ", i);
    delay(1000);
  }

  long sum = 0;
  for (int i = 0; i < 20; i++) {
    sum += analogRead(GAS_PIN);
    delay(50);
  }
  baseline = sum / 20;
  Serial.printf("Clean air baseline: %d\n", baseline);
}

void loop() {
  int gasVal = analogRead(GAS_PIN);
  int delta = gasVal - baseline;
  bool leakDetected = delta > 450;

  digitalWrite(BUZZER_PIN, leakDetected ? HIGH : LOW);

  lcd.setCursor(0, 0);
  lcd.printf("Gas ADC: %-4d   ", gasVal);
  lcd.setCursor(0, 1);
  lcd.print(leakDetected ? "STATUS: LEAK!   " : "STATUS: SAFE    ");

  Serial.printf("ADC=%d | Delta=%d | %s\n", gasVal, delta, leakDetected ? "LEAK" : "SAFE");
  delay(400);
}`,
    codeExplanations: [
      {
        section: '20-Second Heater Warm-Up & Baseline',
        lines: 'Lines 16–30',
        explanation:
          'Allows the SnO2 element to reach thermal equilibrium before averaging 20 clean-air readings into a dynamic baseline.',
      },
      {
        section: 'Delta Threshold Detection',
        lines: 'Lines 34–37',
        explanation:
          'Comparing against baseline delta makes the detector resilient to slight humidity or resistor tolerance variations.',
      },
    ],
    troubleshooting: [
      {
        symptom: 'False LEAK alarm immediately after countdown',
        cause: 'MQ-2 was brand new and needs initial 10-minute burn-in',
        resolution: 'Leave powered for 10 minutes on first use so manufacturing residues burn off the SnO2 bead.',
      },
      {
        symptom: 'ADC stays pinned near 0',
        cause: 'Voltage divider wired backwards or missing common ground',
        resolution: 'Confirm 1 kΩ is in series with AO and 2 kΩ pulls GPIO 35 to GND.',
      },
    ],
    expectedResult:
      'After the 20-second preheat countdown, the LCD shows SAFE. Exposing the sensor to an unlit butane lighter immediately spikes the ADC reading and sounds the alarm.',
    keywords: ['gas', 'mq-2', 'leak', 'smoke', 'safety', 'lpg', 'alarm'],
  },
  {
    id: 'weather-monitoring-station',
    title: 'Weather Monitoring Station',
    subtitle: 'Multi-sensor ESP32 climate station logging temperature, humidity, pressure, and lux.',
    difficulty: 'Intermediate',
    estimatedTime: '55 mins',
    primaryBoard: 'ESP32',
    imageUrl: '/src/assets/images/project_weather_station_1795446219655.jpg',
    featured: true,
    overview:
      'Construct a desk-ready environmental telemetry station combining a DHT22 (temperature & humidity), BMP280 (barometric pressure & altitude), BH1750 (ambient lux), and an SSD1306 OLED on a shared ESP32 I2C bus.',
    requiredComponentIds: ['esp32', 'dht22', 'bmp280', 'bh1750', 'oled-ssd1306'],
    additionalParts: [
      'Breadboard and jumper wires',
      'Micro-USB cable',
    ],
    buildSteps: [
      {
        stepNumber: 1,
        title: 'Create a Shared 3.3V I2C Bus',
        detail:
          'Tie GPIO 21 (SDA) and GPIO 22 (SCL) to two clean breadboard rows, then connect BMP280 (0x76), BH1750 (0x23), and SSD1306 OLED (0x3C) in parallel.',
      },
      {
        stepNumber: 2,
        title: 'Power All Modules Strictly from 3V3',
        detail:
          'Connect VCC of BMP280, BH1750, OLED, and DHT22 to the ESP32 3.3V output rail.',
      },
      {
        stepNumber: 3,
        title: 'Wire DHT22 Data Line',
        detail: 'Connect DHT22 DATA pin to ESP32 GPIO 4.',
      },
      {
        stepNumber: 4,
        title: 'Upload & Verify Multi-Address I2C Reads',
        detail:
          'Flash the sketch and verify all four metrics refresh simultaneously on the OLED without I2C address collisions.',
      },
    ],
    wiringInstructions: [
      { id: 'ws1', fromComponent: 'BMP280 (0x76)', fromPin: 'SDA / SCL', toBoardPin: 'GPIO 21 / 22', wireColor: 'cyan', note: 'Shared I2C barometric bus' },
      { id: 'ws2', fromComponent: 'BH1750 (0x23)', fromPin: 'SDA / SCL', toBoardPin: 'GPIO 21 / 22', wireColor: 'amber', note: 'Shared I2C lux meter' },
      { id: 'ws3', fromComponent: 'SSD1306 (0x3C)', fromPin: 'SDA / SCL', toBoardPin: 'GPIO 21 / 22', wireColor: 'emerald', note: 'Shared I2C OLED display' },
      { id: 'ws4', fromComponent: 'DHT22', fromPin: 'DATA', toBoardPin: 'GPIO 4', wireColor: 'violet', note: 'Temperature & humidity' },
    ],
    codeLanguage: 'cpp',
    codeFilename: 'esp32_weather_station.ino',
    code: `#include <Wire.h>
#include <Adafruit_BMP280.h>
#include <BH1750.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

#define DHT_PIN 4
DHT dht(DHT_PIN, DHT22);
Adafruit_BMP280 bmp;
BH1750 lightMeter;
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  dht.begin();
  bmp.begin(0x76);
  lightMeter.begin();
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
}

void loop() {
  float tempC = dht.readTemperature();
  float humPct = dht.readHumidity();
  float pressureHpa = bmp.readPressure() / 100.0F;
  float lux = lightMeter.readLightLevel();

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("WEATHER TELEMETRY");
  display.setCursor(0, 16);
  display.printf("Temp:  %.1f C\n", tempC);
  display.printf("Hum:   %.1f %%\n", humPct);
  display.printf("Press: %.1f hPa\n", pressureHpa);
  display.printf("Light: %.0f lx\n", lux);
  display.display();

  Serial.printf("T=%.1fC H=%.1f%% P=%.1fhPa L=%.0flx\n", tempC, humPct, pressureHpa, lux);
  delay(2000);
}`,
    codeExplanations: [
      {
        section: 'Multi-Device I2C Addressing',
        lines: 'Lines 15–20',
        explanation:
          'BMP280 (0x76), BH1750 (0x23), and SSD1306 (0x3C) each occupy distinct 7-bit addresses, allowing all three to share GPIO 21 and 22.',
      },
      {
        section: 'Pascal-to-hPa Conversion',
        lines: 'Line 26',
        explanation:
          'Divides raw Pascals from bmp.readPressure() by 100.0 to output standard meteorological hectopascals (hPa / mbar).',
      },
    ],
    troubleshooting: [
      {
        symptom: 'BMP280 prints 0.0 hPa',
        cause: 'BMP280 SDO pin pulled HIGH (address 0x77 instead of 0x76)',
        resolution: 'Tie BMP280 SDO to GND or change bmp.begin(0x76) to bmp.begin(0x77).',
      },
      {
        symptom: 'DHT22 returns NaN',
        cause: 'Polling faster than 2 seconds or loose DATA wire',
        resolution: 'Keep delay(2000) intact and verify GPIO 4 contact.',
      },
    ],
    expectedResult:
      'Every 2 seconds, the OLED screen cleanly renders real-time temperature, relative humidity, barometric pressure (~1013 hPa at sea level), and ambient illuminance in Lux.',
    keywords: ['weather', 'station', 'bmp280', 'dht22', 'pressure', 'bh1750', 'climate'],
  },
  {
    id: 'smart-irrigation',
    title: 'Smart Irrigation',
    subtitle: 'Weather-aware ESP32 multi-zone drip irrigation with soil, rain/light, and remote RF telemetry.',
    difficulty: 'Advanced',
    estimatedTime: '75 mins',
    primaryBoard: 'ESP32',
    overview:
      'Take plant watering to agricultural scale. This smart irrigation controller reads root-zone moisture (capacitive probe), soil temperature (DS18B20), and daylight intensity (LDR) so it only triggers pump relays during cool low-evaporation windows when soil moisture genuinely requires replenishment.',
    requiredComponentIds: ['esp32', 'soil-moisture', 'ds18b20', 'ldr', 'relay-5v'],
    additionalParts: [
      '1 × 4.7 kΩ resistor (for DS18B20) & 1 × 10 kΩ resistor (for LDR)',
      '12V solenoid valve or 5V pump with external power supply + flyback diode',
    ],
    buildSteps: [
      {
        stepNumber: 1,
        title: 'Wire Analog Soil & Daylight Inputs',
        detail:
          'Connect capacitive soil probe AOUT to GPIO 34 and the LDR divider to GPIO 35 (both ADC1 pins).',
      },
      {
        stepNumber: 2,
        title: 'Add Soil Temperature Probe',
        detail:
          'Connect waterproof DS18B20 DQ to GPIO 4 with a 4.7 kΩ pull-up resistor to 3V3.',
      },
      {
        stepNumber: 3,
        title: 'Connect Pump Valve Relay',
        detail:
          'Wire Relay IN to GPIO 26, VCC to VIN (5V), and GND to GND.',
      },
      {
        stepNumber: 4,
        title: 'Verify Evaporation & Frost Lockouts',
        detail:
          'Test that irrigation automatically locks out during midday peak sun or near-freezing soil temperatures.',
      },
    ],
    wiringInstructions: [
      { id: 'si1', fromComponent: 'Soil Moisture', fromPin: 'AOUT', toBoardPin: 'GPIO 34', wireColor: 'cyan', note: 'Root-zone moisture ADC' },
      { id: 'si2', fromComponent: 'LDR Divider', fromPin: 'Junction', toBoardPin: 'GPIO 35', wireColor: 'amber', note: 'Midday evaporation lockout' },
      { id: 'si3', fromComponent: 'DS18B20 Probe', fromPin: 'DQ (+4.7kΩ)', toBoardPin: 'GPIO 4', wireColor: 'violet', note: 'Soil frost protection' },
      { id: 'si4', fromComponent: 'Relay Module', fromPin: 'IN / VCC', toBoardPin: 'GPIO 26 / VIN', wireColor: 'emerald', note: 'Valve / pump driver' },
    ],
    codeLanguage: 'cpp',
    codeFilename: 'smart_irrigation_controller.ino',
    code: `#include <OneWire.h>
#include <DallasTemperature.h>

#define SOIL_PIN 34
#define LDR_PIN 35
#define ONE_WIRE_PIN 4
#define RELAY_PIN 26

OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature soilTemp(&oneWire);

const int DRY_ADC = 2850;
const int WET_ADC = 1250;

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Valve OFF
  soilTemp.begin();
}

void loop() {
  int rawSoil = analogRead(SOIL_PIN);
  int moisturePct = constrain(map(rawSoil, DRY_ADC, WET_ADC, 0, 100), 0, 100);
  int lightVal = analogRead(LDR_PIN);

  soilTemp.requestTemperatures();
  float tempC = soilTemp.getTempCByIndex(0);

  bool needsWater = moisturePct < 38;
  bool lowEvaporation = lightVal < 2600; // Avoid midday sun
  bool frostSafe = tempC > 3.0;

  if (needsWater && lowEvaporation && frostSafe) {
    Serial.println("Irrigating zone for 5s...");
    digitalWrite(RELAY_PIN, LOW);
    delay(5000);
    digitalWrite(RELAY_PIN, HIGH);
  } else {
    Serial.printf("Standby | Moisture:%d%% | Light:%d | Soil:%.1fC\n",
                  moisturePct, lightVal, tempC);
  }
  delay(3000);
}`,
    codeExplanations: [
      {
        section: '12-Bit ESP32 ADC Calibration',
        lines: 'Lines 12–13 & 23',
        explanation:
          'Unlike Arduino’s 10-bit ADC (0–1023), the ESP32 reads 12-bit values (0–4095), so DRY_ADC and WET_ADC thresholds are scaled accordingly.',
      },
      {
        section: 'Triple-Gate Irrigation Policy',
        lines: 'Lines 29–34',
        explanation:
          'Irrigation only activates when all three engineering interlocks pass: low root moisture, non-peak sunlight (reducing evaporation waste), and above-freezing soil.',
      },
    ],
    troubleshooting: [
      {
        symptom: 'Relay never activates even when soil is dry',
        cause: 'Bright indoor lamp hitting LDR triggers lowEvaporation = false',
        resolution: 'Cover the LDR briefly or tune the lightVal < 2600 threshold for your deployment.',
      },
      {
        symptom: 'Soil temperature shows -127°C locking out irrigation',
        cause: 'Missing 4.7 kΩ pull-up resistor on GPIO 4',
        resolution: 'Add 4.7 kΩ between GPIO 4 and 3V3.',
      },
    ],
    expectedResult:
      'Serial Monitor logs moisture %, daylight level, and soil temperature every 3 seconds, opening the irrigation valve strictly during safe, low-evaporation conditions.',
    keywords: ['irrigation', 'agriculture', 'smart farming', 'esp32', 'soil', 'valve'],
  },
];
