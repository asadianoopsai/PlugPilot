import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { ShinyButton } from '@/components/ui/shiny-button';
import { COMPONENTS_DATA } from '../data/componentsData';
import { PROJECTS_DATA } from '../data/projectsData';
import { AppView } from '../types/electronics';
import { ComponentIllustration } from './ComponentIllustration';

interface ComponentDetailViewProps {
  componentId: string;
  onNavigate: (view: AppView) => void;
}

export const ComponentDetailView: React.FC<ComponentDetailViewProps> = ({
  componentId,
  onNavigate,
}) => {
  const [selectedPinIdx, setSelectedPinIdx] = useState<number | null>(0);

  const component = COMPONENTS_DATA.find((c) => c.id === componentId);

  if (!component) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-medium text-[#eef0f5]">Component not found</h1>
        <p className="mt-2 text-sm text-[#a3a9b8]">
          The requested module could not be located in the library.
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
          label="Return to Component Library"
          onClick={() => onNavigate({ name: 'components', category: 'All' })}
          className="mt-6 h-10 px-4 text-sm"
        />
      </div>
    );
  }

  const relatedProjects = PROJECTS_DATA.filter(
    (p) =>
      component.relatedProjectIds.includes(p.id) ||
      p.requiredComponentIds.includes(component.id)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Contextual Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#7a8296]">
        <button
          type="button"
          onClick={() => onNavigate({ name: 'components', category: 'All' })}
          className="inline-flex items-center gap-1.5 transition-colors duration-150 ease-unslop hover:text-[#eef0f5]"
        >
          <ArrowLeft className="h-4 w-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
          Components
        </button>
        <span aria-hidden="true">/</span>
        <button
          type="button"
          onClick={() => onNavigate({ name: 'components', category: component.category })}
          className="transition-colors duration-150 ease-unslop hover:text-[#eef0f5]"
        >
          {component.category}
        </button>
        <span aria-hidden="true">/</span>
        <span className="font-mono text-[#eef0f5]">{component.partNumber}</span>
      </nav>

      {/* Top Overview Split */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Illustration & Interactive Pin Spotlight */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-5">
            <ComponentIllustration
              kind={component.illustration}
              activePinIndex={selectedPinIdx}
            />
            <div className="mt-4 flex items-center justify-between text-xs text-[#7a8296]">
              <span>Select any pin row to highlight</span>
              <span className="font-mono text-[#38bdf8]">{component.partNumber}</span>
            </div>

            {selectedPinIdx !== null && component.pinConfiguration[selectedPinIdx] && (
              <div className="mt-4 border-t border-[#eef0f5]/[0.08] pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-medium text-[#38bdf8]">
                    Pin {component.pinConfiguration[selectedPinIdx].pinNumber}:{' '}
                    {component.pinConfiguration[selectedPinIdx].name}
                  </span>
                  <span className="text-[#7a8296]">
                    {component.pinConfiguration[selectedPinIdx].type}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#a3a9b8]">
                  {component.pinConfiguration[selectedPinIdx].connectionNote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Title, Description & Working Principle */}
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#7a8296]">
            <span className="text-[#38bdf8]">{component.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{component.interfaceType}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{component.operatingVoltage}</span>
          </div>

          <h1 className="mt-2 font-display text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-[#eef0f5] text-balance sm:text-4xl">
            {component.name}
          </h1>

          <p className="mt-4 text-base leading-relaxed text-[#a3a9b8]">
            {component.description}
          </p>

          <div className="mt-6 rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-5">
            <h2 className="font-display text-sm font-medium text-[#eef0f5]">
              Working principle
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#a3a9b8]">
              {component.workingPrinciple}
            </p>
          </div>

          {/* Compatible Boards & Required Connections */}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-5">
              <h2 className="font-display text-sm font-medium text-[#eef0f5]">
                Compatible boards
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-[#a3a9b8]">
                {component.compatibleBoards.map((board) => (
                  <li key={board} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-[#4cc38a]" strokeWidth={1.5} aria-hidden="true" />
                    <span>{board}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-5">
              <h2 className="font-display text-sm font-medium text-[#eef0f5]">
                Required connections
              </h2>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#a3a9b8]">
                {component.requiredConnections.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications & Pin Configuration Tables */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Specifications */}
        <section className="lg:col-span-5">
          <h2 className="font-display text-lg font-medium text-[#eef0f5]">
            Technical specifications
          </h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c]">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-[#eef0f5]/[0.08]">
                {component.specifications.map((spec) => (
                  <tr key={spec.label} className="transition-colors duration-150 ease-unslop hover:bg-[#1a1e28]">
                    <th scope="row" className="px-4 py-3 font-normal text-[#a3a9b8]">
                      {spec.label}
                    </th>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[#eef0f5] tabular-nums sm:text-sm">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Applications */}
          <h2 className="mt-8 font-display text-lg font-medium text-[#eef0f5]">
            Common applications
          </h2>
          <ul className="mt-3 space-y-2 rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-5 text-sm text-[#a3a9b8]">
            {component.applications.map((app) => (
              <li key={app} className="flex items-start gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#38bdf8]" aria-hidden="true" />
                <span>{app}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Pin Configuration */}
        <section className="lg:col-span-7">
          <h2 className="font-display text-lg font-medium text-[#eef0f5]">
            Pin configuration
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c]">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#eef0f5]/[0.08] bg-[#07080d] text-xs text-[#7a8296]">
                  <th scope="col" className="px-4 py-3 font-medium">Pin</th>
                  <th scope="col" className="px-4 py-3 font-medium">Name</th>
                  <th scope="col" className="px-4 py-3 font-medium">Signal</th>
                  <th scope="col" className="px-4 py-3 font-medium">Function and wiring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef0f5]/[0.08]">
                {component.pinConfiguration.map((pin, idx) => {
                  const isSelected = selectedPinIdx === idx;
                  return (
                    <tr
                      key={pin.pinNumber + pin.name}
                      tabIndex={0}
                      onClick={() => setSelectedPinIdx(idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedPinIdx(idx);
                        }
                      }}
                      className={`cursor-pointer transition-colors duration-150 ease-unslop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#38bdf8] ${
                        isSelected
                          ? 'bg-[#1a1e28] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                          : 'hover:bg-[#1a1e28]/60'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-[#38bdf8] tabular-nums">
                        {pin.pinNumber}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-[#eef0f5]">
                        {pin.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#a3a9b8]">{pin.type}</td>
                      <td className="px-4 py-3 text-xs leading-relaxed text-[#a3a9b8]">
                        <div className="text-[#eef0f5]">{pin.description}</div>
                        <div className="mt-0.5 text-[#7a8296]">{pin.connectionNote}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Related Projects */}
          <h2 className="mt-8 font-display text-lg font-medium text-[#eef0f5]">
            Related projects using {component.partNumber}
          </h2>
          {relatedProjects.length === 0 ? (
            <div className="mt-3 rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-5 text-sm text-[#a3a9b8]">
              Use the AI Project Assistant to plan a custom circuit with {component.partNumber}.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {relatedProjects.map((proj) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => onNavigate({ name: 'project-detail', projectId: proj.id })}
                  className="group rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-4 text-left transition-[background-color,border-color] duration-150 ease-unslop hover:border-[#eef0f5]/[0.18] hover:bg-[#1a1e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                >
                  <div className="flex items-center gap-2 text-xs text-[#7a8296]">
                    <span className="text-[#38bdf8]">{proj.primaryBoard}</span>
                    <span aria-hidden="true">·</span>
                    <span>{proj.difficulty}</span>
                  </div>
                  <div className="mt-1.5 font-display text-sm font-medium text-[#eef0f5]">
                    {proj.title}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-[#a3a9b8]">{proj.subtitle}</div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
