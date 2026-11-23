import React, { useMemo, useState } from 'react';
import { ArrowRight, Wrench } from 'lucide-react';
import { BorderBeamSearch } from '@/components/ui/border-beam-search';
import { ShinyButton } from '@/components/ui/shiny-button';
import { AppView } from '../types/electronics';
import { searchCatalog } from '../utils/search';
import { ComponentIllustration } from './ComponentIllustration';

interface SmartSearchViewProps {
  initialQuery: string;
  onNavigate: (view: AppView) => void;
}

export const SmartSearchView: React.FC<SmartSearchViewProps> = ({
  initialQuery,
  onNavigate,
}) => {
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  const results = useMemo(() => searchCatalog(activeQuery), [activeQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = queryInput.trim();
    if (!q) return;
    setActiveQuery(q);
  };

  const projectsToDisplay = results.hasExactProjectMatch
    ? results.exactProjects
    : results.fallbackProjects;

  const componentsToDisplay =
    results.exactComponents.length > 0
      ? [...results.exactComponents, ...results.fallbackComponents]
      : results.fallbackComponents;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Search Bar Header */}
      <div className="border-b border-[#eef0f5]/[0.08] pb-8">
        <p className="text-xs font-medium text-[#38bdf8]">
          Smart catalog search
        </p>
        <h1 className="mt-2 font-display text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-[#eef0f5] sm:text-3xl">
          Results for "{activeQuery || 'all hardware'}"
        </h1>

        <form onSubmit={handleSubmit} className="mt-5 max-w-2xl" role="search">
          <BorderBeamSearch
            id="smart-search-input"
            label="Search sensors, components or projects"
            value={queryInput}
            onChange={setQueryInput}
            onClear={() => setQueryInput('')}
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
        </form>
      </div>

      {/* Fallback Notice when Requested Project is Unavailable */}
      {!results.hasExactProjectMatch && activeQuery && (
        <div className="mt-8 flex flex-col justify-between gap-4 rounded-xl border border-[#eef0f5]/[0.12] bg-[#11141c] p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-base font-medium text-[#eef0f5]">
              No exact project guide found for "{activeQuery}"
            </h2>
            <p className="mt-1 text-sm text-[#a3a9b8]">
              Showing the closest related project guides and hardware modules so you can begin
              prototyping right away.
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
            label={`Plan "${activeQuery}"`}
            onClick={() => onNavigate({ name: 'assistant', initialPrompt: activeQuery })}
            className="h-10 shrink-0 px-4 text-sm"
          >
            <Wrench className="h-4 w-4 shrink-0 text-[#38bdf8]" strokeWidth={1.5} aria-hidden="true" />
            Plan "{activeQuery}"
          </ShinyButton>
        </div>
      )}

      {/* Projects Section (Exact or Related Fallback) */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-medium tracking-[-0.015em] text-[#eef0f5]">
            {results.hasExactProjectMatch ? 'Matching project guides' : 'Closest related projects'}
          </h2>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'projects', difficulty: 'All' })}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#38bdf8] transition-colors duration-150 ease-unslop hover:text-[#7dd3fc]"
          >
            Browse all projects
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          {projectsToDisplay.map((proj) => (
            <button
              key={proj.id}
              type="button"
              onClick={() => onNavigate({ name: 'project-detail', projectId: proj.id })}
              className="group flex flex-col rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-5 text-left transition-[background-color,border-color] duration-150 ease-unslop hover:border-[#eef0f5]/[0.18] hover:bg-[#1a1e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
            >
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
              <p className="mt-1.5 text-sm text-[#a3a9b8]">{proj.subtitle}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Relevant Components Section */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-medium tracking-[-0.015em] text-[#eef0f5]">
            {results.exactComponents.length > 0
              ? 'Relevant components and sensors'
              : 'Recommended hardware modules'}
          </h2>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'components', category: 'All' })}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#38bdf8] transition-colors duration-150 ease-unslop hover:text-[#7dd3fc]"
          >
            Full component library
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {componentsToDisplay.map((comp) => (
            <button
              key={comp.id}
              type="button"
              onClick={() => onNavigate({ name: 'component-detail', componentId: comp.id })}
              className="group flex flex-col rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-5 text-left transition-[background-color,border-color] duration-150 ease-unslop hover:border-[#eef0f5]/[0.18] hover:bg-[#1a1e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
            >
              <ComponentIllustration kind={comp.illustration} compact />
              <div className="mt-4 flex items-center gap-2 text-xs text-[#7a8296]">
                <span className="font-medium text-[#38bdf8]">{comp.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{comp.partNumber}</span>
              </div>
              <h3 className="mt-1.5 font-display text-[15px] font-medium text-[#eef0f5]">
                {comp.name}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-sm text-[#a3a9b8]">{comp.shortSummary}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
