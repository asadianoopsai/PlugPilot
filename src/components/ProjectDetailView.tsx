import React, { useState } from 'react';
import { ArrowLeft, Box, Check, Clock, Copy } from 'lucide-react';
import { ShinyButton } from '@/components/ui/shiny-button';
import { COMPONENTS_DATA } from '../data/componentsData';
import { PROJECTS_DATA } from '../data/projectsData';
import { AppView, BeginnerCircuitId } from '../types/electronics';
import { ProjectWiringDiagram } from './ProjectWiringDiagram';

function mapProjectToSandboxPreset(projectId: string): BeginnerCircuitId {
  if (projectId === 'smart-parking-system') return 'hcsr04-sonar';
  if (
    projectId === 'weather-monitoring-station' ||
    projectId === 'esp32-smart-home-automation' ||
    projectId === 'temperature-monitoring' ||
    projectId === 'gas-leakage-monitoring'
  ) {
    return 'dht22-climate';
  }
  return 'led-blink';
}

interface ProjectDetailViewProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  projectId,
  onNavigate,
}) => {
  const project = PROJECTS_DATA.find((p) => p.id === projectId);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeWireId, setActiveWireId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-medium text-[#eef0f5]">Project guide not found</h1>
        <p className="mt-2 text-sm text-[#a3a9b8]">
          The requested build guide could not be found.
        </p>
        <ShinyButton
          type="button"
          size="md"
          cornerRadius={8}
          fillColor="#0b0d14"
          insetColor="rgba(56, 189, 248, 0.3)"
          labelColor="#eef0f5"
          accentColor="#38bdf8"
          accentSoftColor="#7dd3fc"
          label="Back to project library"
          onClick={() => onNavigate({ name: 'projects', difficulty: 'All' })}
          className="mt-6 h-10 px-4 text-sm"
        />
      </div>
    );
  }

  const requiredComponents = project.requiredComponentIds
    .map((id) => COMPONENTS_DATA.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber) ? prev.filter((s) => s !== stepNumber) : [...prev, stepNumber]
    );
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(project.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#7a8296]">
        <button
          type="button"
          onClick={() => onNavigate({ name: 'projects', difficulty: 'All' })}
          className="inline-flex items-center gap-1.5 transition-colors duration-150 ease-unslop hover:text-[#eef0f5]"
        >
          <ArrowLeft className="h-4 w-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
          Projects
        </button>
        <span aria-hidden="true">/</span>
        <span>{project.primaryBoard}</span>
        <span aria-hidden="true">/</span>
        <span className="text-[#eef0f5]">{project.title}</span>
      </nav>

      {/* Hero Overview */}
      <header className="mt-6 grid grid-cols-1 gap-8 border-b border-[#eef0f5]/[0.08] pb-8 lg:grid-cols-12">
        <div className={project.imageUrl ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#7a8296]">
            <span className="font-medium text-[#38bdf8]">{project.primaryBoard}</span>
            <span aria-hidden="true">·</span>
            <span>Difficulty: {project.difficulty}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Clock className="h-4 w-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
              {project.estimatedTime}
            </span>
          </div>

          <h1 className="mt-2 font-display text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-[#eef0f5] text-balance sm:text-4xl">
            {project.title}
          </h1>

          <p className="mt-4 text-base leading-relaxed text-[#a3a9b8]">
            {project.overview}
          </p>

          {/* Progress summary */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-[#7a8296]">
            <span className="font-mono text-[#eef0f5] tabular-nums">
              Build progress: {completedSteps.length} / {project.buildSteps.length} steps completed
            </span>
          </div>
        </div>

        {project.imageUrl && (
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c]">
              <img
                src={project.imageUrl}
                alt={project.title}
                referrerPolicy="no-referrer"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>
        )}
      </header>

      {/* Required Components */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-medium tracking-[-0.015em] text-[#eef0f5]">
          Required components
        </h2>
        <p className="mt-1 text-sm text-[#a3a9b8]">
          Select any hardware module to inspect its full datasheet and pinout before wiring
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requiredComponents.map((comp) => (
            <button
              key={comp.id}
              type="button"
              onClick={() => onNavigate({ name: 'component-detail', componentId: comp.id })}
              className="group flex flex-col justify-between rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-4 text-left transition-[background-color,border-color] duration-150 ease-unslop hover:border-[#eef0f5]/[0.18] hover:bg-[#1a1e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#7a8296]">
                  <span className="text-[#38bdf8]">{comp.category}</span>
                  <span className="font-mono">{comp.partNumber}</span>
                </div>
                <div className="mt-1.5 font-display text-sm font-medium text-[#eef0f5]">
                  {comp.name}
                </div>
              </div>
              <div className="mt-3 text-xs font-medium text-[#38bdf8] group-hover:text-[#7dd3fc]">
                Inspect pinout and voltage
              </div>
            </button>
          ))}
        </div>

        {project.additionalParts.length > 0 && (
          <div className="mt-4 rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-5">
            <h3 className="text-xs font-medium text-[#eef0f5]">Supporting hardware</h3>
            <ul className="mt-2 grid grid-cols-1 gap-1.5 text-sm text-[#a3a9b8] sm:grid-cols-2">
              {project.additionalParts.map((part) => (
                <li key={part} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a8296]" aria-hidden="true" />
                  <span>{part}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Step-by-Step Build Checklist + Interactive Wiring Schematic */}
      <section className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="font-display text-xl font-medium tracking-[-0.015em] text-[#eef0f5]">
            Step-by-step assembly
          </h2>
          <p className="mt-1 text-sm text-[#a3a9b8]">
            Check off each milestone as you assemble the circuit
          </p>

          <div className="mt-4 space-y-3">
            {project.buildSteps.map((step) => {
              const done = completedSteps.includes(step.stepNumber);
              return (
                <button
                  key={step.stepNumber}
                  type="button"
                  onClick={() => toggleStep(step.stepNumber)}
                  aria-pressed={done}
                  className={`flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-[background-color,border-color,transform] duration-150 ease-unslop active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] ${
                    done
                      ? 'border-[#4cc38a]/40 bg-[#1a1e28] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'border-[#eef0f5]/[0.08] bg-[#11141c] hover:border-[#eef0f5]/[0.18] hover:bg-[#1a1e28]/60'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-medium tabular-nums ${
                      done
                        ? 'bg-[#4cc38a] text-[#07080d]'
                        : 'bg-[#1a1e28] text-[#a3a9b8]'
                    }`}
                  >
                    {done ? <Check className="h-4 w-4 text-[#07080d]" strokeWidth={1.75} aria-hidden="true" /> : step.stepNumber}
                  </span>
                  <div>
                    <div className="font-display text-sm font-medium text-[#eef0f5]">
                      {step.title}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#a3a9b8]">{step.detail}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-medium tracking-[-0.015em] text-[#eef0f5]">
                Wiring instructions and connection diagram
              </h2>
              <p className="mt-1 text-sm text-[#a3a9b8]">
                Select a wire in the diagram or table to trace pin-to-pin connections
              </p>
            </div>
            <ShinyButton
              type="button"
              size="sm"
              cornerRadius={8}
              fillColor="#0b0d14"
              insetColor="rgba(56, 189, 248, 0.3)"
              labelColor="#eef0f5"
              accentColor="#38bdf8"
              accentSoftColor="#7dd3fc"
              label="Test wiring in 3D"
              onClick={() =>
                onNavigate({
                  name: 'sandbox',
                  presetId: mapProjectToSandboxPreset(project.id),
                  boardId: project.primaryBoard === 'ESP32' ? 'esp32' : 'arduino-uno',
                })
              }
              className="h-9 shrink-0 px-3.5 text-xs"
            >
              <Box className="h-3.5 w-3.5 text-[#38bdf8]" strokeWidth={1.5} aria-hidden="true" />
              Test wiring in 3D
            </ShinyButton>
          </div>

          <div className="mt-4">
            <ProjectWiringDiagram
              boardName={project.primaryBoard}
              connections={project.wiringInstructions}
              activeConnectionId={activeWireId}
              onSelectConnection={(id) =>
                setActiveWireId((prev) => (prev === id ? null : id))
              }
            />
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c]">
            <table className="w-full min-w-[520px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#eef0f5]/[0.08] bg-[#07080d] text-xs text-[#7a8296]">
                  <th scope="col" className="px-4 py-3 font-medium">Module</th>
                  <th scope="col" className="px-4 py-3 font-medium">Module pin</th>
                  <th scope="col" className="px-4 py-3 font-medium">{project.primaryBoard} pin</th>
                  <th scope="col" className="px-4 py-3 font-medium">Engineering note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef0f5]/[0.08]">
                {project.wiringInstructions.map((conn) => {
                  const selected = activeWireId === conn.id;
                  return (
                    <tr
                      key={conn.id}
                      tabIndex={0}
                      onClick={() =>
                        setActiveWireId((prev) => (prev === conn.id ? null : conn.id))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveWireId((prev) => (prev === conn.id ? null : conn.id));
                        }
                      }}
                      className={`cursor-pointer transition-colors duration-150 ease-unslop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#38bdf8] ${
                        selected
                          ? 'bg-[#1a1e28] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                          : 'hover:bg-[#1a1e28]/60'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-[#eef0f5]">{conn.fromComponent}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#38bdf8]">{conn.fromPin}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#eef0f5]">{conn.toBoardPin}</td>
                      <td className="px-4 py-3 text-xs text-[#a3a9b8]">{conn.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Firmware Code & Code Explanation */}
      <section className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-medium tracking-[-0.015em] text-[#eef0f5]">
              Firmware source code
            </h2>
            <ShinyButton
              type="button"
              size="sm"
              cornerRadius={6}
              fillColor="#11141c"
              insetColor="rgba(238, 240, 245, 0.14)"
              labelColor="#eef0f5"
              accentColor={copied ? "#4cc38a" : "#7a8296"}
              accentSoftColor="#eef0f5"
              speckleOpacity={0.22}
              label={copied ? "Copied" : "Copy code"}
              onClick={handleCopyCode}
              className="h-8 px-3 text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-[#4cc38a]" strokeWidth={1.5} aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-[#a3a9b8]" strokeWidth={1.5} aria-hidden="true" />
                  Copy code
                </>
              )}
            </ShinyButton>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-[#eef0f5]/[0.08] bg-[#07080d]">
            <div className="flex items-center justify-between border-b border-[#eef0f5]/[0.08] bg-[#11141c] px-4 py-2.5 text-xs text-[#7a8296]">
              <span className="font-mono text-[#38bdf8]">{project.codeFilename}</span>
              <span>Arduino C++</span>
            </div>
            <pre className="max-h-[480px] overflow-auto p-4 font-mono text-xs leading-relaxed text-[#eef0f5]">
              <code>{project.code}</code>
            </pre>
          </div>
        </div>

        <div className="lg:col-span-5">
          <h2 className="font-display text-xl font-medium tracking-[-0.015em] text-[#eef0f5]">
            Explanation of the code
          </h2>
          <div className="mt-3 space-y-4">
            {project.codeExplanations.map((item) => (
              <div
                key={item.section}
                className="rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-display text-sm font-medium text-[#eef0f5]">{item.section}</span>
                  <span className="font-mono text-[#38bdf8] tabular-nums">{item.lines}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#a3a9b8]">{item.explanation}</p>
              </div>
            ))}

            {/* Expected Result */}
            <div className="rounded-xl border border-[#4cc38a]/30 bg-[#11141c] p-5">
              <h3 className="font-display text-sm font-medium text-[#4cc38a]">
                Expected result
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#eef0f5]">
                {project.expectedResult}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testing & Troubleshooting */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-medium tracking-[-0.015em] text-[#eef0f5]">
          Testing and troubleshooting
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c]">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#eef0f5]/[0.08] bg-[#07080d] text-xs text-[#7a8296]">
                <th scope="col" className="px-5 py-3 font-medium">Observed symptom</th>
                <th scope="col" className="px-5 py-3 font-medium">Likely cause</th>
                <th scope="col" className="px-5 py-3 font-medium">Recommended fix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef0f5]/[0.08]">
              {project.troubleshooting.map((row) => (
                <tr key={row.symptom} className="transition-colors duration-150 ease-unslop hover:bg-[#1a1e28]/60">
                  <td className="px-5 py-4 font-medium text-[#eef0f5]">{row.symptom}</td>
                  <td className="px-5 py-4 text-[#a3a9b8]">{row.cause}</td>
                  <td className="px-5 py-4 text-[#eef0f5]">
                    <span className="inline-flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4cc38a]" strokeWidth={1.5} aria-hidden="true" />
                      <span>{row.resolution}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
