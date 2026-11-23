import { COMPONENTS_DATA } from '../data/componentsData';
import { PROJECTS_DATA } from '../data/projectsData';
import { ElectronicsComponent, ElectronicsProject } from '../types/electronics';

export interface SearchResultBundle {
  query: string;
  exactProjects: ElectronicsProject[];
  exactComponents: ElectronicsComponent[];
  fallbackProjects: ElectronicsProject[];
  fallbackComponents: ElectronicsComponent[];
  hasExactProjectMatch: boolean;
  hasAnyExactMatch: boolean;
}

const DOMAIN_EXPANSIONS: Record<string, string[]> = {
  drone: ['mpu6050', 'bmp280', 'hc-sr04', 'vl53l0x', 'nrf24l01', 'esp32', 'gyro', 'altitude'],
  quadcopter: ['mpu6050', 'bmp280', 'nrf24l01', 'esp32', 'gyro'],
  robot: ['hc-sr04', 'mpu6050', 'arduino-uno', 'hc-05', 'nrf24l01', 'vl53l0x'],
  greenhouse: ['dht22', 'soil-moisture', 'ldr', 'bh1750', 'relay-5v', 'esp32', 'irrigation', 'plant'],
  garden: ['soil-moisture', 'relay-5v', 'ldr', 'ds18b20', 'irrigation', 'plant'],
  doorbell: ['pir-hc-sr501', 'esp32', 'oled-ssd1306', 'motion', 'smart home'],
  alarm: ['pir-hc-sr501', 'mq-2', 'a3144-hall', 'motion', 'gas'],
  fire: ['mq-2', 'lm35', 'ds18b20', 'gas', 'temperature'],
  smoke: ['mq-2', 'mq-135', 'gas'],
  water: ['ds18b20', 'hc-sr04', 'soil-moisture', 'relay-5v', 'watering', 'irrigation'],
  tank: ['hc-sr04', 'vl53l0x', 'ds18b20', 'distance'],
  wifi: ['esp32', 'smart home', 'weather'],
  bluetooth: ['hc-05', 'esp32'],
  climate: ['dht22', 'dht11', 'bmp280', 'lm35', 'weather', 'temperature'],
  thermostat: ['lm35', 'ds18b20', 'dht22', 'relay-5v', 'temperature'],
  compass: ['qmc5883l', 'mpu6050', 'magnetic'],
  speed: ['a3144-hall', 'mpu6050', 'magnetic'],
};

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set<string>(tokens);
  for (const token of tokens) {
    const related = DOMAIN_EXPANSIONS[token];
    if (related) {
      related.forEach((r) => expanded.add(r));
    }
  }
  return Array.from(expanded);
}

function scoreComponent(comp: ElectronicsComponent, rawQuery: string, tokens: string[]): number {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return 0;

  let score = 0;
  const nameLower = comp.name.toLowerCase();
  const partLower = comp.partNumber.toLowerCase();
  const catLower = comp.category.toLowerCase();
  const summaryLower = comp.shortSummary.toLowerCase();

  if (nameLower === q || partLower === q || comp.id === q) score += 120;
  if (nameLower.includes(q) || partLower.includes(q)) score += 70;
  if (catLower.includes(q)) score += 45;
  if (summaryLower.includes(q)) score += 30;

  for (const token of tokens) {
    if (nameLower.includes(token)) score += 20;
    if (partLower.includes(token)) score += 25;
    if (catLower.includes(token)) score += 15;
    if (comp.keywords.some((kw) => kw.includes(token) || token.includes(kw))) score += 18;
    if (comp.applications.some((app) => app.toLowerCase().includes(token))) score += 10;
    if (comp.interfaceType.toLowerCase().includes(token)) score += 12;
  }

  return score;
}

function scoreProject(proj: ElectronicsProject, rawQuery: string, tokens: string[]): number {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return 0;

  let score = 0;
  const titleLower = proj.title.toLowerCase();
  const subtitleLower = proj.subtitle.toLowerCase();
  const overviewLower = proj.overview.toLowerCase();

  if (titleLower === q || proj.id === q) score += 120;
  if (titleLower.includes(q)) score += 75;
  if (subtitleLower.includes(q)) score += 40;
  if (overviewLower.includes(q)) score += 25;

  for (const token of tokens) {
    if (titleLower.includes(token)) score += 25;
    if (subtitleLower.includes(token)) score += 14;
    if (proj.keywords.some((kw) => kw.includes(token) || token.includes(kw))) score += 18;
    if (proj.requiredComponentIds.some((id) => id.includes(token))) score += 16;
    if (proj.primaryBoard.toLowerCase().includes(token)) score += 12;
  }

  return score;
}

export function searchCatalog(
  rawQuery: string,
  components: ElectronicsComponent[] = COMPONENTS_DATA,
  projects: ElectronicsProject[] = PROJECTS_DATA
): SearchResultBundle {
  const query = rawQuery.trim();
  if (!query) {
    return {
      query: '',
      exactProjects: projects,
      exactComponents: components,
      fallbackProjects: [],
      fallbackComponents: [],
      hasExactProjectMatch: true,
      hasAnyExactMatch: true,
    };
  }

  const directTokens = tokenize(query);
  const expandedTokens = expandTokens(directTokens);

  const exactProjects = projects
    .map((proj) => ({ item: proj, score: scoreProject(proj, query, directTokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);

  const exactComponents = components
    .map((comp) => ({ item: comp, score: scoreComponent(comp, query, directTokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);

  // Build smart fallback recommendations if exact project match is absent
  let fallbackProjects: ElectronicsProject[] = [];
  let fallbackComponents: ElectronicsComponent[] = [];

  if (exactProjects.length === 0) {
    const scoredExpandedProjects = projects
      .map((proj) => ({ item: proj, score: scoreProject(proj, query, expandedTokens) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);

    fallbackProjects =
      scoredExpandedProjects.length > 0
        ? scoredExpandedProjects.slice(0, 4)
        : projects.filter((p) => p.featured).slice(0, 3);
  }

  if (exactComponents.length < 4) {
    const exactIds = new Set(exactComponents.map((c) => c.id));
    const scoredExpandedComponents = components
      .filter((c) => !exactIds.has(c.id))
      .map((comp) => ({ item: comp, score: scoreComponent(comp, query, expandedTokens) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);

    fallbackComponents =
      scoredExpandedComponents.length > 0
        ? scoredExpandedComponents.slice(0, 6)
        : exactComponents.length === 0
          ? components.filter((c) => c.featured).slice(0, 4)
          : [];
  }

  return {
    query,
    exactProjects,
    exactComponents,
    fallbackProjects,
    fallbackComponents,
    hasExactProjectMatch: exactProjects.length > 0,
    hasAnyExactMatch: exactProjects.length > 0 || exactComponents.length > 0,
  };
}
