export type ComponentCategory =
  | 'Temperature Sensors'
  | 'Humidity Sensors'
  | 'Pressure Sensors'
  | 'Distance Sensors'
  | 'Motion Sensors'
  | 'Accelerometers and Gyroscopes'
  | 'Magnetic Sensors'
  | 'Gas Sensors'
  | 'Light Sensors'
  | 'Microcontrollers'
  | 'Displays'
  | 'Communication Modules';

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  'Temperature Sensors',
  'Humidity Sensors',
  'Pressure Sensors',
  'Distance Sensors',
  'Motion Sensors',
  'Accelerometers and Gyroscopes',
  'Magnetic Sensors',
  'Gas Sensors',
  'Light Sensors',
  'Microcontrollers',
  'Displays',
  'Communication Modules',
];

export type BoardCompatibility = 'ESP32' | 'Arduino Uno' | 'Arduino Nano' | 'Raspberry Pi Pico';

export type IllustrationKind =
  | 'lm35'
  | 'ds18b20'
  | 'dht11'
  | 'dht22'
  | 'bmp280'
  | 'hcsr04'
  | 'vl53l0x'
  | 'pir'
  | 'mpu6050'
  | 'hall'
  | 'magnetometer'
  | 'mq2'
  | 'mq135'
  | 'ldr'
  | 'bh1750'
  | 'esp32'
  | 'arduino_uno'
  | 'oled'
  | 'lcd16x2'
  | 'hc05'
  | 'nrf24l01'
  | 'soil_moisture'
  | 'relay';

export interface PinConfigItem {
  pinNumber: string;
  name: string;
  type: 'Power' | 'Ground' | 'Analog' | 'Digital' | 'I2C' | 'SPI' | 'UART' | 'Control';
  description: string;
  connectionNote: string;
}

export interface ComponentSpecItem {
  label: string;
  value: string;
}

export interface ElectronicsComponent {
  id: string;
  name: string;
  partNumber: string;
  category: ComponentCategory;
  shortSummary: string;
  description: string;
  workingPrinciple: string;
  operatingVoltage: string;
  interfaceType: string;
  illustration: IllustrationKind;
  featured?: boolean;
  specifications: ComponentSpecItem[];
  pinConfiguration: PinConfigItem[];
  applications: string[];
  compatibleBoards: BoardCompatibility[];
  requiredConnections: string[];
  relatedProjectIds: string[];
  keywords: string[];
}

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ProjectWiringConnection {
  id: string;
  fromComponent: string;
  fromPin: string;
  toBoardPin: string;
  wireColor: 'red' | 'black' | 'cyan' | 'amber' | 'emerald' | 'violet';
  note: string;
}

export interface ProjectCodeExplanation {
  section: string;
  lines: string;
  explanation: string;
}

export interface ProjectTroubleshootingItem {
  symptom: string;
  cause: string;
  resolution: string;
}

export interface ElectronicsProject {
  id: string;
  title: string;
  subtitle: string;
  difficulty: DifficultyLevel;
  estimatedTime: string;
  primaryBoard: 'ESP32' | 'Arduino Uno';
  imageUrl?: string;
  featured?: boolean;
  overview: string;
  requiredComponentIds: string[];
  additionalParts: string[];
  buildSteps: {
    stepNumber: number;
    title: string;
    detail: string;
  }[];
  wiringInstructions: ProjectWiringConnection[];
  codeLanguage: 'cpp';
  codeFilename: string;
  code: string;
  codeExplanations: ProjectCodeExplanation[];
  troubleshooting: ProjectTroubleshootingItem[];
  expectedResult: string;
  keywords: string[];
}

export type BeginnerCircuitId = 'led-blink' | 'dht22-climate' | 'hcsr04-sonar';

export type BenchBoardId = 'arduino-uno' | 'esp32';

export type AppView =
  | { name: 'home' }
  | { name: 'components'; category?: ComponentCategory | 'All'; board?: string }
  | { name: 'component-detail'; componentId: string }
  | { name: 'projects'; difficulty?: DifficultyLevel | 'All'; board?: string }
  | { name: 'project-detail'; projectId: string }
  | { name: 'sandbox'; presetId?: BeginnerCircuitId; boardId?: BenchBoardId }
  | { name: 'search'; query: string }
  | { name: 'assistant'; initialPrompt?: string };

export interface AssistantRecommendation {
  projectTitle: string;
  summary: string;
  recommendedBoardId: string;
  recommendedBoardName: string;
  boardRationale: string;
  suggestedComponents: {
    componentId: string;
    name: string;
    role: string;
  }[];
  additionalHardware: string[];
  architectureSteps: string[];
  wiringSummary: string[];
  powerAndSafetyNote: string;
  relatedProjectIds: string[];
  starterCodeSnippet: string;
}
