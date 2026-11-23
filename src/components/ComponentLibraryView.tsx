import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ShinyButton } from '@/components/ui/shiny-button';
import { COMPONENTS_DATA } from '../data/componentsData';
import { AppView, COMPONENT_CATEGORIES, ComponentCategory } from '../types/electronics';
import { ComponentIllustration } from './ComponentIllustration';

interface ComponentLibraryViewProps {
  initialCategory?: ComponentCategory | 'All';
  initialBoard?: string;
  onNavigate: (view: AppView) => void;
}

const BOARD_FILTERS = ['All', 'ESP32', 'Arduino Uno', 'Raspberry Pi Pico'] as const;

export const ComponentLibraryView: React.FC<ComponentLibraryViewProps> = ({
  initialCategory = 'All',
  initialBoard = 'All',
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'All'>(initialCategory);
  const [selectedBoard, setSelectedBoard] = useState<string>(initialBoard);

  const filteredComponents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return COMPONENTS_DATA.filter((comp) => {
      if (selectedCategory !== 'All' && comp.category !== selectedCategory) return false;
      if (
        selectedBoard !== 'All' &&
        !comp.compatibleBoards.includes(selectedBoard as typeof comp.compatibleBoards[number])
      ) {
        return false;
      }
      if (!q) return true;
      return (
        comp.name.toLowerCase().includes(q) ||
        comp.partNumber.toLowerCase().includes(q) ||
        comp.category.toLowerCase().includes(q) ||
        comp.shortSummary.toLowerCase().includes(q) ||
        comp.interfaceType.toLowerCase().includes(q) ||
        comp.keywords.some((kw) => kw.includes(q))
      );
    });
  }, [searchTerm, selectedCategory, selectedBoard]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedBoard('All');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-6 border-b border-[#eef0f5]/[0.08] pb-8 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-medium tracking-[0.01em] text-[#38bdf8]">
            Sensor and component library
          </p>
          <h1 className="mt-2 font-display text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-[#eef0f5] sm:text-4xl">
            Hardware reference catalog
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#a3a9b8]">
            Verified datasheets, operating principles, pin configurations, and 3.3V / 5V
            board integration guidelines across all 12 component categories.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full lg:w-80">
          <label htmlFor="component-library-search" className="sr-only">
            Filter components by name, part number, or interface
          </label>
          <div className="flex h-10 items-center rounded-lg border border-[#eef0f5]/[0.1] bg-[#11141c] px-3 transition-colors duration-150 ease-unslop focus-within:border-[#38bdf8]/70">
            <Search className="h-4 w-4 shrink-0 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
            <input
              id="component-library-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter LM35, I2C, ESP32, MQ-2"
              className="w-full bg-transparent px-2.5 text-sm text-[#eef0f5] placeholder-[#7a8296] focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Clear component search"
                onClick={() => setSearchTerm('')}
                className="text-[#7a8296] transition-colors duration-150 ease-unslop hover:text-[#eef0f5]"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Controls: Board Compatibility + 12 Categories */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-[#7a8296]">
              <SlidersHorizontal className="h-4 w-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
              Board
            </span>
            {BOARD_FILTERS.map((board) => {
              const active = selectedBoard === board;
              return (
                <button
                  key={board}
                  type="button"
                  onClick={() => setSelectedBoard(board)}
                  className={`h-8 rounded-md px-3 text-xs font-medium whitespace-nowrap transition-[background-color,color,border-color] duration-150 ease-unslop ${
                    active
                      ? 'bg-[#38bdf8] text-[#07080d]'
                      : 'border border-[#eef0f5]/[0.08] bg-[#11141c] text-[#a3a9b8] hover:border-[#eef0f5]/[0.18] hover:text-[#eef0f5]'
                  }`}
                >
                  {board === 'All' ? 'All boards' : board}
                </button>
              );
            })}
          </div>

          <div className="font-mono text-xs text-[#7a8296] tabular-nums">
            {filteredComponents.length} / {COMPONENTS_DATA.length} components
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Component categories">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`h-8 rounded-md px-3 text-xs font-medium whitespace-nowrap transition-[background-color,color,border-color] duration-150 ease-unslop ${
              selectedCategory === 'All'
                ? 'border border-[#38bdf8]/50 bg-[#1a1e28] text-[#38bdf8]'
                : 'border border-[#eef0f5]/[0.08] bg-[#11141c] text-[#a3a9b8] hover:border-[#eef0f5]/[0.18] hover:text-[#eef0f5]'
            }`}
          >
            All categories
          </button>
          {COMPONENT_CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`h-8 rounded-md px-3 text-xs font-medium whitespace-nowrap transition-[background-color,color,border-color] duration-150 ease-unslop ${
                  active
                    ? 'border border-[#38bdf8]/50 bg-[#1a1e28] text-[#38bdf8]'
                    : 'border border-[#eef0f5]/[0.08] bg-[#11141c] text-[#a3a9b8] hover:border-[#eef0f5]/[0.18] hover:text-[#eef0f5]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Grid or Empty State */}
      {filteredComponents.length === 0 ? (
        <div className="mt-10 rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-10 text-center">
          <h2 className="font-display text-lg font-medium text-[#eef0f5]">
            No matching components found
          </h2>
          <p className="mt-2 text-sm text-[#a3a9b8]">
            No sensors or modules matched your current category, board, and keyword filters.
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
              label="Reset all filters"
              onClick={resetFilters}
              className="h-9 px-4 text-sm"
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
                label={`Run smart search for "${searchTerm.trim()}"`}
                onClick={() => onNavigate({ name: 'search', query: searchTerm.trim() })}
                className="h-9 px-4 text-sm"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredComponents.map((comp) => (
            <button
              key={comp.id}
              type="button"
              onClick={() => onNavigate({ name: 'component-detail', componentId: comp.id })}
              className="group flex flex-col rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-5 text-left transition-[background-color,border-color] duration-150 ease-unslop hover:border-[#eef0f5]/[0.18] hover:bg-[#1a1e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
            >
              <ComponentIllustration kind={comp.illustration} compact />
              <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-[#7a8296]">
                <span className="text-[#38bdf8]">{comp.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{comp.partNumber}</span>
              </div>
              <h2 className="mt-1.5 font-display text-[15px] font-medium text-[#eef0f5]">
                {comp.name}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#a3a9b8]">
                {comp.shortSummary}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-[#eef0f5]/[0.08] pt-3 text-xs">
                <span className="font-mono text-[#a3a9b8] tabular-nums">{comp.operatingVoltage}</span>
                <span className="font-medium text-[#38bdf8] group-hover:text-[#7dd3fc]">
                  View datasheet
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
