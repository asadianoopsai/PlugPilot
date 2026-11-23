import React, { useMemo, useState } from 'react';
import { ArrowRight, Box, CheckCircle2, Cpu, Layers, Wrench } from 'lucide-react';
import { BorderBeamSearch } from '@/components/ui/border-beam-search';
import { ShinyButton } from '@/components/ui/shiny-button';
import { COMPONENTS_DATA } from '../data/componentsData';
import { PROJECTS_DATA } from '../data/projectsData';
import { AppView, COMPONENT_CATEGORIES } from '../types/electronics';
import { BEGINNER_CIRCUIT_PRESETS } from '../utils/circuitSimulator';
import { searchCatalog } from '../utils/search';
import { ComponentIllustration } from './ComponentIllustration';
import { InteractiveHeroTitle } from './InteractiveHeroTitle';
import { ProjectBlueprintCover } from './ProjectBlueprintCover';

interface HomeViewProps {
  onNavigate: (view: AppView) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [heroQuery, setHeroQuery] = useState('');
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  const featuredComponents = useMemo(
    () => COMPONENTS_DATA.filter((c) => c.featured).slice(0, 6),
    []
  );
  const popularProjects = useMemo(
    () => PROJECTS_DATA.filter((p) => p.featured).slice(0, 4),
    []
  );

  const liveSuggestions = useMemo(() => {
    const trimmed = heroQuery.trim();
    if (trimmed.length < 2) return null;
    const bundle = searchCatalog(trimmed);
    return {
      projects: bundle.exactProjects.slice(0, 3),
      components: bundle.exactComponents.slice(0, 4),
    };
  }, [heroQuery]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroQuery.trim();
    if (!q) return;
    onNavigate({ name: 'search', query: q });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 lg:px-8 lg:pt-16 lg:pb-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-7">
            <p className="text-xs font-medium tracking-[0.01em] text-[#7a8296]">
              Electronics learning and hardware reference
            </p>
            <InteractiveHeroTitle />
            <p className="mt-2.5 font-display text-lg font-medium tracking-[-0.015em] text-[#38bdf8] sm:text-2xl">
              Turn ideas into real-world electronics.
            </p>
            <p className="mt-4 max-w-[36rem] text-base leading-relaxed text-[#a3a9b8]">
              Plug Pilot helps beginners, students, hobbyists, and engineers understand sensors,
              microcontrollers, Arduino, and ESP32 hardware through verified pinouts, interactive
              wiring schematics, and step-by-step project guides.
            </p>

            {/* Smart Unified Search Bar */}
            <form onSubmit={handleHeroSearch} className="relative mt-8 max-w-2xl" role="search">
              <BorderBeamSearch
                id="hero-search-input"
                label="Search sensors, components or projects"
                value={heroQuery}
                onChange={setHeroQuery}
                onClear={() => setHeroQuery('')}
                placeholder="Search sensors, components or projects..."
                rightSlot={
                  <ShinyButton
                    type="submit"
                    size="sm"
                    cornerRadius={10}
                    fillColor="#0b0d14"
                    insetColor="rgba(56, 189, 248, 0.3)"
                    labelColor="#eef0f5"
                    accentColor="#38bdf8"
                    accentSoftColor="#7dd3fc"
                    label="Search"
                    className="h-9 shrink-0 px-4 text-xs sm:h-10 sm:text-sm"
                  />
                }
              />

              {/* Instant Typeahead Results */}
              {liveSuggestions &&
                (liveSuggestions.components.length > 0 || liveSuggestions.projects.length > 0) && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-[#eef0f5]/[0.12] bg-[#11141c]">
                    {liveSuggestions.projects.length > 0 && (
                      <div className="border-b border-[#eef0f5]/[0.08] p-2">
                        <div className="px-2.5 py-1 text-xs font-medium text-[#7a8296]">
                          Project guides
                        </div>
                        {liveSuggestions.projects.map((proj) => (
                          <button
                            key={proj.id}
                            type="button"
                            onClick={() => onNavigate({ name: 'project-detail', projectId: proj.id })}
                            className="flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-sm text-[#eef0f5] transition-colors duration-150 ease-unslop hover:bg-[#1a1e28]"
                          >
                            <span className="truncate">{proj.title}</span>
                            <span className="ml-3 shrink-0 font-mono text-xs text-[#38bdf8]">{proj.primaryBoard}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {liveSuggestions.components.length > 0 && (
                      <div className="p-2">
                        <div className="px-2.5 py-1 text-xs font-medium text-[#7a8296]">
                          Sensors and modules
                        </div>
                        {liveSuggestions.components.map((comp) => (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => onNavigate({ name: 'component-detail', componentId: comp.id })}
                            className="flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-sm text-[#eef0f5] transition-colors duration-150 ease-unslop hover:bg-[#1a1e28]"
                          >
                            <span className="truncate">{comp.name}</span>
                            <span className="ml-3 shrink-0 font-mono text-xs text-[#7a8296]">{comp.partNumber}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </form>

            {/* Primary CTAs: 1 Primary Accent ShinyButton + 1 Secondary Subtle ShinyButton */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ShinyButton
                type="button"
                size="md"
                cornerRadius={8}
                fillColor="#0b0d14"
                insetColor="rgba(56, 189, 248, 0.3)"
                labelColor="#eef0f5"
                accentColor="#38bdf8"
                accentSoftColor="#7dd3fc"
                label="Explore Components"
                onClick={() => onNavigate({ name: 'components', category: 'All' })}
                className="h-11 px-5 text-sm"
              >
                <Cpu className="h-4 w-4 shrink-0 text-[#38bdf8]" strokeWidth={1.5} aria-hidden="true" />
                Explore Components
              </ShinyButton>
              <ShinyButton
                type="button"
                size="md"
                cornerRadius={8}
                fillColor="#11141c"
                insetColor="rgba(238, 240, 245, 0.14)"
                labelColor="#eef0f5"
                accentColor="#7a8296"
                accentSoftColor="#eef0f5"
                speckleOpacity={0.22}
                label="Explore Projects"
                onClick={() => onNavigate({ name: 'projects', difficulty: 'All' })}
                className="h-11 px-5 text-sm"
              >
                <Wrench className="h-4 w-4 shrink-0 text-[#a3a9b8]" strokeWidth={1.5} aria-hidden="true" />
                Explore Projects
              </ShinyButton>
            </div>
          </div>

          {/* Right Column: Hardware Workbench Visual */}
          <div className="lg:col-span-5">
            <div
              data-preserve-dark="true"
              className="relative overflow-hidden rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c]"
            >
              {!heroImageFailed ? (
                <img
                  src="/src/assets/images/hero_workbench_esp32_1795446219625.jpg"
                  alt="ESP32 microcontroller wired to HC-SR04 ultrasonic sensor and OLED display on an ESD electronics workbench"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImageFailed(true)}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full flex-col items-center justify-center bg-[#07080d] p-8 text-center">
                  <Cpu className="h-6 w-6 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
                  <p className="mt-3 font-display text-sm font-medium text-[#eef0f5]">
                    ESP32 and Arduino Hardware Lab
                  </p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07080d]/90 via-[#07080d]/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-xs font-medium text-[#38bdf8]">
                  Interactive bench reference
                </p>
                <p className="mt-1 text-sm text-[#eef0f5]">
                  Verified pinouts, 3.3V and 5V logic notes, and compilable sketches
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Capabilities Strip (Uniform Height, Tabular Numbers) */}
        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#eef0f5]/[0.1] bg-[#eef0f5]/[0.08] backdrop-blur-xl lg:grid-cols-4">
          <div className="bg-[#11141c]/70 p-5">
            <div className="font-display text-2xl font-medium text-[#eef0f5] tabular-nums sm:text-[28px]">
              {COMPONENTS_DATA.length}
            </div>
            <div className="mt-1 text-xs text-[#a3a9b8]">Sensors, MCUs and modules</div>
          </div>
          <div className="bg-[#11141c]/70 p-5">
            <div className="font-display text-2xl font-medium text-[#eef0f5] tabular-nums sm:text-[28px]">
              {COMPONENT_CATEGORIES.length}
            </div>
            <div className="mt-1 text-xs text-[#a3a9b8]">Hardware categories</div>
          </div>
          <div className="bg-[#11141c]/70 p-5">
            <div className="font-display text-2xl font-medium text-[#eef0f5] tabular-nums sm:text-[28px]">
              {PROJECTS_DATA.length}
            </div>
            <div className="mt-1 text-xs text-[#a3a9b8]">Step-by-step build guides</div>
          </div>
          <div className="bg-[#11141c]/70 p-5">
            <div className="font-mono text-2xl font-medium text-[#38bdf8] tabular-nums sm:text-[28px]">
              3.3V / 5V
            </div>
            <div className="mt-1 text-xs text-[#a3a9b8]">ESP32 and Arduino Uno logic</div>
          </div>
        </div>
      </section>

      {/* Beginner 3D Interactive Demo Section */}
      <section className="border-t border-[#eef0f5]/[0.08] bg-[#07080d]/55 py-16 backdrop-blur-[2px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium text-[#38bdf8]">
                Beginner pre-wiring verification
              </p>
              <h2 className="mt-1 font-display text-2xl font-medium tracking-[-0.02em] text-[#eef0f5]">
                Test your circuit in 3D before wiring real hardware
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-[#a3a9b8]">
                Practice connecting jumper wires between Arduino Uno or ESP32 and real 3D sensors,
                catch short circuits or reversed polarity safely, and confirm readings work first.
              </p>
            </div>
            <ShinyButton
              type="button"
              size="md"
              cornerRadius={8}
              fillColor="#0b0d14"
              insetColor="rgba(56, 189, 248, 0.3)"
              labelColor="#eef0f5"
              accentColor="#38bdf8"
              accentSoftColor="#7dd3fc"
              label="Open 3D Lab"
              onClick={() => onNavigate({ name: 'sandbox', presetId: 'dht22-climate' })}
              className="h-10 shrink-0 px-4 text-sm"
            >
              <Box className="h-4 w-4 shrink-0 text-[#38bdf8]" strokeWidth={1.5} aria-hidden="true" />
              Open 3D Lab
            </ShinyButton>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {BEGINNER_CIRCUIT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onNavigate({ name: 'sandbox', presetId: preset.id })}
                className="group flex flex-col justify-between rounded-xl border border-[#eef0f5]/[0.1] bg-[#11141c]/75 p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-[background-color,border-color] duration-150 ease-unslop hover:border-[#38bdf8]/40 hover:bg-[#1a1e28]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#7a8296]">
                    <span className="font-medium text-[#38bdf8]">3D Interactive Bench</span>
                    <span className="font-mono tabular-nums">
                      {preset.sensorPins.length} pins
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-base font-medium text-[#eef0f5]">
                    {preset.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#a3a9b8]">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#eef0f5]/[0.08] pt-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-[#a3a9b8]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#4cc38a]" strokeWidth={1.5} aria-hidden="true" />
                    Short & polarity check
                  </span>
                  <span className="font-medium text-[#38bdf8] group-hover:text-[#7dd3fc]">
                    Launch 3D demo →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Category Strip */}
      <section className="border-t border-[#eef0f5]/[0.08] bg-[#07080d]/40 py-16 backdrop-blur-[2px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-2xl font-medium tracking-[-0.02em] text-[#eef0f5]">
                Component categories
              </h2>
              <p className="mt-1 text-sm text-[#a3a9b8]">
                Datasheets, pin configurations, and board compatibility notes
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'components', category: 'All' })}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#38bdf8] whitespace-nowrap transition-colors duration-150 ease-unslop hover:text-[#7dd3fc]"
            >
              View full library
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {COMPONENT_CATEGORIES.map((category) => {
              const count = COMPONENTS_DATA.filter((c) => c.category === category).length;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onNavigate({ name: 'components', category })}
                  className="flex h-11 items-center justify-between rounded-lg border border-[#eef0f5]/[0.1] bg-[#11141c]/70 px-4 text-left backdrop-blur-md transition-colors duration-150 ease-unslop hover:border-[#eef0f5]/[0.2] hover:bg-[#1a1e28]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                >
                  <span className="truncate text-sm font-normal text-[#eef0f5]">{category}</span>
                  <span className="ml-2 shrink-0 font-mono text-xs text-[#7a8296] tabular-nums">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Components */}
      <section className="border-t border-[#eef0f5]/[0.08] bg-[#0b0d14]/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-2xl font-medium tracking-[-0.02em] text-[#eef0f5]">
                Featured sensors and microcontrollers
              </h2>
              <p className="mt-1 text-sm text-[#a3a9b8]">
                Operating voltage limits, pinouts, and wiring safeguards
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'components', category: 'All' })}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#38bdf8] whitespace-nowrap transition-colors duration-150 ease-unslop hover:text-[#7dd3fc]"
            >
              All components
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredComponents.map((comp) => (
              <button
                key={comp.id}
                type="button"
                onClick={() => onNavigate({ name: 'component-detail', componentId: comp.id })}
                className="group flex flex-col rounded-xl border border-[#eef0f5]/[0.1] bg-[#11141c]/72 p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-[background-color,border-color] duration-150 ease-unslop hover:border-[#eef0f5]/[0.2] hover:bg-[#1a1e28]/82 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
              >
                <ComponentIllustration kind={comp.illustration} compact />
                <div className="mt-4 flex items-center gap-2 text-xs text-[#7a8296]">
                  <span className="text-[#38bdf8]">{comp.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{comp.operatingVoltage}</span>
                </div>
                <h3 className="mt-1.5 font-display text-[15px] font-medium text-[#eef0f5]">
                  {comp.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#a3a9b8]">
                  {comp.shortSummary}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-[#eef0f5]/[0.08] pt-3 text-xs">
                  <span className="font-mono text-[#a3a9b8]">{comp.interfaceType}</span>
                  <span className="font-medium text-[#38bdf8] group-hover:text-[#7dd3fc]">
                    Inspect pinout
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Projects */}
      <section className="border-t border-[#eef0f5]/[0.08] bg-[#07080d]/45 py-16 backdrop-blur-[2px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-2xl font-medium tracking-[-0.02em] text-[#eef0f5]">
                Popular step-by-step projects
              </h2>
              <p className="mt-1 text-sm text-[#a3a9b8]">
                Schematic wiring diagrams, tested C++ firmware, and troubleshooting
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'projects', difficulty: 'All' })}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#38bdf8] whitespace-nowrap transition-colors duration-150 ease-unslop hover:text-[#7dd3fc]"
            >
              All 8 project guides
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {popularProjects.map((proj) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => onNavigate({ name: 'project-detail', projectId: proj.id })}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#eef0f5]/[0.1] bg-[#11141c]/72 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-[background-color,border-color] duration-150 ease-unslop hover:border-[#eef0f5]/[0.2] hover:bg-[#1a1e28]/82 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
              >
                {proj.imageUrl ? (
                  <div className="aspect-[16/9] w-full overflow-hidden border-b border-[#eef0f5]/[0.08] bg-[#07080d]">
                    <img
                      src={proj.imageUrl}
                      alt={proj.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <ProjectBlueprintCover project={proj} />
                )}

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 text-xs text-[#7a8296]">
                    <span className="font-medium text-[#38bdf8]">{proj.primaryBoard}</span>
                    <span aria-hidden="true">·</span>
                    <span>{proj.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{proj.estimatedTime}</span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-medium text-[#eef0f5]">
                    {proj.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#a3a9b8]">
                    {proj.subtitle}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-[#eef0f5]/[0.08] pt-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-[#7a8296] tabular-nums">
                      <Layers className="h-4 w-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
                      {proj.requiredComponentIds.length} core components
                    </span>
                    <span className="font-medium text-[#38bdf8] group-hover:text-[#7dd3fc]">
                      Open build guide
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
