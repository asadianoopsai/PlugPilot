import React, { useMemo, useState } from 'react';
import { Clock, Search, SlidersHorizontal, X } from 'lucide-react';
import { ShinyButton } from '@/components/ui/shiny-button';
import { COMPONENTS_DATA } from '../data/componentsData';
import { PROJECTS_DATA } from '../data/projectsData';
import { AppView, DifficultyLevel } from '../types/electronics';
import { ProjectBlueprintCover } from './ProjectBlueprintCover';

interface ProjectLibraryViewProps {
  initialDifficulty?: DifficultyLevel | 'All';
  initialBoard?: string;
  onNavigate: (view: AppView) => void;
}

const DIFFICULTIES: Array<DifficultyLevel | 'All'> = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const BOARDS = ['All', 'ESP32', 'Arduino Uno'] as const;

export const ProjectLibraryView: React.FC<ProjectLibraryViewProps> = ({
  initialDifficulty = 'All',
  initialBoard = 'All',
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'All'>(initialDifficulty);
  const [board, setBoard] = useState<string>(initialBoard);

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return PROJECTS_DATA.filter((proj) => {
      if (difficulty !== 'All' && proj.difficulty !== difficulty) return false;
      if (board !== 'All' && proj.primaryBoard !== board) return false;
      if (!q) return true;
      return (
        proj.title.toLowerCase().includes(q) ||
        proj.subtitle.toLowerCase().includes(q) ||
        proj.overview.toLowerCase().includes(q) ||
        proj.primaryBoard.toLowerCase().includes(q) ||
        proj.keywords.some((kw) => kw.includes(q)) ||
        proj.requiredComponentIds.some((id) => id.includes(q))
      );
    });
  }, [searchTerm, difficulty, board]);

  const resetFilters = () => {
    setSearchTerm('');
    setDifficulty('All');
    setBoard('All');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 border-b border-[#eef0f5]/[0.08] pb-8 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-medium text-[#38bdf8]">
            Step-by-step project library
          </p>
          <h1 className="mt-2 font-display text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-[#eef0f5] sm:text-3xl">
            Guided electronics builds
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#a3a9b8] sm:text-base">
            Verified bills of materials, interactive wiring schematics, commented Arduino/ESP32 code,
            and troubleshooting diagnostics
          </p>
        </div>

        <div className="w-full lg:w-80">
          <label htmlFor="project-library-search" className="sr-only">
            Search projects
          </label>
          <div className="flex h-10 items-center rounded-lg border border-[#eef0f5]/[0.12] bg-[#11141c] px-3 transition-colors duration-150 ease-unslop focus-within:border-[#38bdf8]/70">
            <Search className="h-4 w-4 shrink-0 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
            <input
              id="project-library-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search smart home, irrigation, gas..."
              className="w-full bg-transparent px-2.5 text-sm text-[#eef0f5] placeholder-[#7a8296] focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Clear project search"
                onClick={() => setSearchTerm('')}
                className="text-[#7a8296] transition-colors duration-150 ease-unslop hover:text-[#eef0f5]"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Difficulty filter">
            <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium text-[#7a8296]">
              <SlidersHorizontal className="h-4 w-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
              Difficulty
            </span>
            {DIFFICULTIES.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDifficulty(lvl)}
                className={`h-8 rounded-md px-3 text-xs font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 ease-unslop active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] ${
                  difficulty === lvl
                    ? 'border border-[#eef0f5]/[0.12] bg-[#1a1e28] text-[#eef0f5] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'border border-[#eef0f5]/[0.08] bg-[#11141c] text-[#a3a9b8] hover:border-[#eef0f5]/[0.18] hover:text-[#eef0f5]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Board filter">
            <span className="mr-1 text-xs font-medium text-[#7a8296]">Board</span>
            {BOARDS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBoard(b)}
                className={`h-8 rounded-md px-3 text-xs font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 ease-unslop active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] ${
                  board === b
                    ? 'bg-[#38bdf8] font-semibold text-[#07080d]'
                    : 'border border-[#eef0f5]/[0.08] bg-[#11141c] text-[#a3a9b8] hover:border-[#eef0f5]/[0.18] hover:text-[#eef0f5]'
                }`}
              >
                {b === 'All' ? 'All boards' : b}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-[#7a8296] tabular-nums">
          {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Project Grid or Smart Fallback */}
      {filteredProjects.length === 0 ? (
        <div className="mt-8 rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-10 text-center">
          <h2 className="font-display text-lg font-medium text-[#eef0f5]">
            No project guides match "{searchTerm || `${difficulty} · ${board}`}"
          </h2>
          <p className="mt-2 text-sm text-[#a3a9b8]">
            Reset the active filters, run a Smart Search for related hardware, or open the Project
            Assistant to plan a custom build.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ShinyButton
              type="button"
              size="md"
              cornerRadius={8}
              fillColor="#0b0d14"
              insetColor="rgba(56, 189, 248, 0.3)"
              labelColor="#eef0f5"
              accentColor="#38bdf8"
              accentSoftColor="#7dd3fc"
              label="Show all projects"
              onClick={resetFilters}
              className="h-10 px-4 text-sm"
            />
            {searchTerm.trim() && (
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
                label={`Smart Search "${searchTerm.trim()}"`}
                onClick={() => onNavigate({ name: 'search', query: searchTerm.trim() })}
                className="h-10 px-4 text-sm"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredProjects.map((proj) => {
            const partLabels = proj.requiredComponentIds
              .map((id) => COMPONENTS_DATA.find((c) => c.id === id)?.partNumber ?? id)
              .slice(0, 4);

            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => onNavigate({ name: 'project-detail', projectId: proj.id })}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] text-left transition-[background-color,border-color] duration-150 ease-unslop hover:border-[#eef0f5]/[0.18] hover:bg-[#1a1e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
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
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#7a8296]">
                    <span className="font-medium text-[#38bdf8]">{proj.primaryBoard}</span>
                    <span aria-hidden="true">·</span>
                    <span>{proj.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Clock className="h-4 w-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
                      {proj.estimatedTime}
                    </span>
                  </div>

                  <h2 className="mt-2 font-display text-lg font-medium text-[#eef0f5]">
                    {proj.title}
                  </h2>

                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#a3a9b8]">
                    {proj.subtitle}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-[#eef0f5]/[0.08] pt-3 text-xs">
                    <span className="max-w-[65%] truncate font-mono text-[#a3a9b8]">
                      {partLabels.join(' / ')}
                    </span>
                    <span className="font-medium text-[#38bdf8] whitespace-nowrap group-hover:text-[#7dd3fc]">
                      Open guide
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
