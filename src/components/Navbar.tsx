import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Box,
  Cpu,
  Home,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
  Wrench,
  X,
} from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ShinyButton } from '@/components/ui/shiny-button';
import { useTheme } from '../context/ThemeContext';
import { AppView } from '../types/electronics';
import { BEGINNER_CIRCUIT_PRESETS } from '../utils/circuitSimulator';
import { searchCatalog } from '../utils/search';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

type NavSectionId = 'home' | 'components' | 'projects' | 'sandbox' | 'assistant';

const NAV_ITEMS: Array<{
  id: NavSectionId;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  view: AppView;
}> = [
  { id: 'home', label: 'Home', mobileLabel: 'Home', icon: Home, view: { name: 'home' } },
  {
    id: 'components',
    label: 'Components',
    mobileLabel: 'Components Library',
    icon: Cpu,
    view: { name: 'components', category: 'All' },
  },
  {
    id: 'projects',
    label: 'Projects',
    mobileLabel: 'Project Guides',
    icon: Wrench,
    view: { name: 'projects', difficulty: 'All' },
  },
  {
    id: 'sandbox',
    label: '3D Lab',
    mobileLabel: 'Beginner 3D Lab',
    icon: Box,
    view: { name: 'sandbox', presetId: 'dht22-climate' },
  },
  {
    id: 'assistant',
    label: 'AI Assistant',
    mobileLabel: 'AI Project Assistant',
    icon: Sparkles,
    view: { name: 'assistant' },
  },
];

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredNavId, setHoveredNavId] = useState<NavSectionId | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const quickInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickJumpOpen((prev) => !prev);
        return;
      }
      if (e.key === 'Escape' && quickJumpOpen) {
        setQuickJumpOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quickJumpOpen]);

  useEffect(() => {
    if (quickJumpOpen) {
      const timer = window.setTimeout(() => {
        quickInputRef.current?.focus();
      }, 40);
      return () => window.clearTimeout(timer);
    }
    setQuickQuery('');
  }, [quickJumpOpen]);

  const activeNavId: NavSectionId | null = useMemo(() => {
    if (currentView.name === 'home') return 'home';
    if (currentView.name === 'components' || currentView.name === 'component-detail') {
      return 'components';
    }
    if (currentView.name === 'projects' || currentView.name === 'project-detail') {
      return 'projects';
    }
    if (currentView.name === 'sandbox') return 'sandbox';
    if (currentView.name === 'assistant') return 'assistant';
    return null;
  }, [currentView.name]);

  const quickResults = useMemo(() => {
    const trimmed = quickQuery.trim();
    const bundle = searchCatalog(trimmed);
    const comps = (trimmed ? bundle.exactComponents : bundle.fallbackComponents).slice(0, 4);
    const projs = (trimmed ? bundle.exactProjects : bundle.fallbackProjects).slice(0, 3);
    const circuits = BEGINNER_CIRCUIT_PRESETS.filter((preset) => {
      if (!trimmed) return true;
      const lower = trimmed.toLowerCase();
      return (
        preset.title.toLowerCase().includes(lower) ||
        preset.shortTitle.toLowerCase().includes(lower) ||
        preset.description.toLowerCase().includes(lower)
      );
    }).slice(0, 2);

    return { comps, projs, circuits };
  }, [quickQuery]);

  const handleNav = (view: AppView) => {
    setMobileMenuOpen(false);
    setQuickJumpOpen(false);
    onNavigate(view);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickQuery.trim();
    if (!trimmed) return;
    handleNav({ name: 'search', query: trimmed });
  };

  return (
    <MotionConfig reducedMotion="user">
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-200 ease-unslop ${
          scrolled
            ? isLight
              ? 'border-slate-900/[0.12] bg-white/92 shadow-[0_6px_24px_rgba(15,23,42,0.06)]'
              : 'border-[#eef0f5]/[0.12] bg-[#050506]/85 shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
            : isLight
              ? 'border-slate-900/[0.08] bg-white/78'
              : 'border-[#eef0f5]/[0.08] bg-[#050506]/60'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-6 lg:px-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNav({ name: 'home' })}
            className="group flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg text-left transition-opacity duration-150 ease-unslop hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-105"
            >
              <rect
                x="2"
                y="2"
                width="20"
                height="20"
                rx="5"
                fill={isLight ? '#ffffff' : '#11141c'}
                stroke={isLight ? '#0f172a' : '#eef0f5'}
                strokeOpacity={isLight ? '0.14' : '0.14'}
                strokeWidth="1.25"
              />
              <path
                d="M7.5 12H12L14.5 8.5H16.5"
                stroke={isLight ? '#0284c7' : '#38bdf8'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 15.5H12.5L15 13H16.5"
                stroke={isLight ? '#64748b' : '#a3a9b8'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="7.5" cy="12" r="1.25" fill={isLight ? '#0284c7' : '#38bdf8'} />
              <circle cx="16.5" cy="8.5" r="1.25" fill={isLight ? '#0284c7' : '#38bdf8'} />
            </svg>
            <span className="font-display text-lg font-semibold tracking-[-0.02em] text-[#eef0f5] whitespace-nowrap sm:text-xl">
              Plug Pilot
            </span>
          </button>

          {/* Zone 2: Interactive Sliding-Pill Navigation Rail */}
          <nav
            aria-label="Primary navigation"
            onMouseLeave={() => setHoveredNavId(null)}
            className={`hidden items-center gap-0.5 rounded-xl border p-1 md:flex ${
              isLight
                ? 'border-slate-900/[0.08] bg-slate-100/80'
                : 'border-[#eef0f5]/[0.08] bg-[#0b0d14]/75'
            }`}
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeNavId === item.id;
              const showHoverPill = hoveredNavId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.view)}
                  onMouseEnter={() => setHoveredNavId(item.id)}
                  onFocus={() => setHoveredNavId(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ease-unslop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] ${
                    active
                      ? isLight
                        ? 'text-slate-950'
                        : 'text-[#eef0f5]'
                      : isLight
                        ? 'text-slate-600 hover:text-slate-950'
                        : 'text-[#a3a9b8] hover:text-[#eef0f5]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="navbar-active-pill"
                      transition={{ type: 'spring', stiffness: 440, damping: 34 }}
                      aria-hidden="true"
                      className={`absolute inset-0 rounded-lg border ${
                        isLight
                          ? 'border-slate-900/[0.08] bg-white shadow-xs'
                          : 'border-[#eef0f5]/[0.1] bg-[#1a1e28]'
                      }`}
                    />
                  )}
                  {showHoverPill && !active && (
                    <motion.span
                      layoutId="navbar-hover-pill"
                      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                      aria-hidden="true"
                      className={`absolute inset-0 rounded-lg ${
                        isLight ? 'bg-slate-900/[0.05]' : 'bg-[#eef0f5]/[0.06]'
                      }`}
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-3.5 w-3.5 shrink-0 transition-colors duration-150 ${
                      active
                        ? isLight
                          ? 'text-sky-600'
                          : 'text-[#38bdf8]'
                        : 'opacity-75'
                    }`}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span className="relative z-10">{item.label}</span>
                  {active && (
                    <motion.span
                      layoutId="navbar-active-bar"
                      transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                      aria-hidden="true"
                      className={`absolute inset-x-3 -bottom-1 h-0.5 rounded-full ${
                        isLight ? 'bg-sky-600' : 'bg-[#38bdf8]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Quick Jump, Interactive Dark/Light Toggle, Primary Action & Mobile Drawer */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {/* Quick Jump Command Launcher */}
            <button
              type="button"
              onClick={() => setQuickJumpOpen(true)}
              aria-label="Open quick jump search"
              title="Quick jump (Ctrl/Cmd + K)"
              className={`inline-flex h-9 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition-colors duration-150 ease-unslop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] ${
                isLight
                  ? 'border-slate-900/[0.1] bg-slate-100/80 text-slate-600 hover:border-slate-900/[0.18] hover:bg-slate-100 hover:text-slate-900'
                  : 'border-[#eef0f5]/[0.1] bg-[#11141c] text-[#a3a9b8] hover:border-[#eef0f5]/[0.2] hover:text-[#eef0f5]'
              }`}
            >
              <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden xl:inline">Quick jump</span>
              <kbd
                className={`hidden rounded px-1 py-0.5 font-mono text-[10px] xl:inline ${
                  isLight
                    ? 'bg-white text-slate-500 ring-1 ring-slate-900/[0.08]'
                    : 'bg-[#1a1e28] text-[#7a8296]'
                }`}
              >
                ⌘K
              </kbd>
            </button>

            {/* Interactive Dark Mode / Light Mode Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isLight}
              aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
              title={isLight ? 'Dark mode' : 'Light mode'}
              data-testid="theme-toggle"
              onClick={toggleTheme}
              className={`relative inline-flex h-9 w-[66px] shrink-0 cursor-pointer items-center justify-between rounded-full border p-1 transition-colors duration-200 ease-unslop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] ${
                isLight
                  ? 'border-sky-600/25 bg-sky-50 text-slate-600 hover:border-sky-600/40'
                  : 'border-[#eef0f5]/[0.12] bg-[#11141c] text-[#a3a9b8] hover:border-[#38bdf8]/40'
              }`}
            >
              <span
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200 ${
                  !isLight ? 'text-[#0b0d14]' : 'text-slate-400'
                }`}
              >
                {!isLight && (
                  <motion.span
                    layoutId="theme-switch-thumb"
                    transition={{ type: 'spring', stiffness: 460, damping: 32 }}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.45)]"
                  />
                )}
                <Moon
                  className={`relative z-10 h-3.5 w-3.5 transition-transform duration-300 ${
                    !isLight ? 'rotate-0 scale-105' : '-rotate-12 scale-90'
                  }`}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </span>
              <span
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200 ${
                  isLight ? 'text-white' : 'text-[#7a8296]'
                }`}
              >
                {isLight && (
                  <motion.span
                    layoutId="theme-switch-thumb"
                    transition={{ type: 'spring', stiffness: 460, damping: 32 }}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-[#0284c7] shadow-[0_2px_10px_rgba(2,132,199,0.35)]"
                  />
                )}
                <Sun
                  className={`relative z-10 h-3.5 w-3.5 transition-transform duration-300 ${
                    isLight ? 'rotate-0 scale-105' : 'rotate-45 scale-90'
                  }`}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </span>
            </button>

            {/* Primary CTA on Desktop */}
            <ShinyButton
              type="button"
              size="sm"
              cornerRadius={8}
              fillColor="#0b0d14"
              insetColor="rgba(238, 240, 245, 0.16)"
              labelColor="#eef0f5"
              accentColor="#38bdf8"
              accentSoftColor="#7dd3fc"
              label="Start Building"
              onClick={() => handleNav({ name: 'projects', difficulty: 'All' })}
              className="hidden h-9 shrink-0 px-4 text-sm lg:inline-flex"
            />

            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors duration-150 ease-unslop md:hidden ${
                isLight
                  ? 'border-slate-900/[0.12] bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  : 'border-[#eef0f5]/[0.1] bg-[#11141c] text-[#a3a9b8] hover:text-[#eef0f5]'
              }`}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Menu className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {/* Interactive Animated Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={`overflow-hidden border-t md:hidden ${
                isLight
                  ? 'border-slate-900/[0.08] bg-white/95'
                  : 'border-[#eef0f5]/[0.08] bg-[#07080d]/95'
              }`}
            >
              <nav aria-label="Mobile navigation" className="flex flex-col gap-1 px-4 py-4">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = activeNavId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNav(item.view)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex h-11 items-center justify-between rounded-xl px-3.5 text-left text-sm font-medium transition-colors duration-150 ease-unslop ${
                        active
                          ? isLight
                            ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20'
                            : 'bg-[#1a1e28] text-[#eef0f5] ring-1 ring-[#38bdf8]/30'
                          : isLight
                            ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                            : 'text-[#a3a9b8] hover:bg-[#11141c] hover:text-[#eef0f5]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 ${
                            active ? (isLight ? 'text-sky-600' : 'text-[#38bdf8]') : 'opacity-75'
                          }`}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        {item.mobileLabel}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 opacity-50" strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Interactive Quick-Jump Command Dialog */}
      <AnimatePresence>
        {quickJumpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setQuickJumpOpen(false)}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-20 backdrop-blur-sm sm:pt-28"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Quick jump search"
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl ${
                isLight
                  ? 'border-slate-900/[0.12] bg-white text-slate-900'
                  : 'border-[#eef0f5]/[0.14] bg-[#11141c] text-[#eef0f5]'
              }`}
            >
              <form
                onSubmit={handleQuickSubmit}
                className={`flex items-center gap-2.5 border-b px-4 py-3 ${
                  isLight ? 'border-slate-900/[0.08]' : 'border-[#eef0f5]/[0.08]'
                }`}
              >
                <Search
                  className={`h-4 w-4 shrink-0 ${isLight ? 'text-slate-500' : 'text-[#7a8296]'}`}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <input
                  ref={quickInputRef}
                  type="text"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Jump to sensors, ESP32 guides, or 3D lab circuits..."
                  className={`min-w-0 flex-1 bg-transparent text-sm focus:outline-none ${
                    isLight
                      ? 'text-slate-900 placeholder-slate-500'
                      : 'text-[#eef0f5] placeholder-[#7a8296]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setQuickJumpOpen(false)}
                  aria-label="Close quick jump search"
                  className={`inline-flex h-7 items-center rounded-md px-2 font-mono text-[11px] transition-colors ${
                    isLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-[#1a1e28] text-[#a3a9b8] hover:text-[#eef0f5]'
                  }`}
                >
                  ESC
                </button>
              </form>

              <div className="max-h-80 overflow-y-auto p-2.5 space-y-3">
                {quickResults.circuits.length > 0 && (
                  <div>
                    <div
                      className={`px-2.5 py-1 text-[11px] font-medium ${
                        isLight ? 'text-slate-500' : 'text-[#7a8296]'
                      }`}
                    >
                      3D Circuit Lab Presets
                    </div>
                    {quickResults.circuits.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleNav({ name: 'sandbox', presetId: preset.id })}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                          isLight
                            ? 'text-slate-800 hover:bg-slate-100'
                            : 'text-[#eef0f5] hover:bg-[#1a1e28]'
                        }`}
                      >
                        <span className="truncate font-medium">{preset.title}</span>
                        <span
                          className={`ml-3 shrink-0 font-mono text-xs ${
                            isLight ? 'text-sky-600' : 'text-[#38bdf8]'
                          }`}
                        >
                          3D Lab
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {quickResults.projs.length > 0 && (
                  <div>
                    <div
                      className={`px-2.5 py-1 text-[11px] font-medium ${
                        isLight ? 'text-slate-500' : 'text-[#7a8296]'
                      }`}
                    >
                      Project Guides
                    </div>
                    {quickResults.projs.map((proj) => (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => handleNav({ name: 'project-detail', projectId: proj.id })}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                          isLight
                            ? 'text-slate-800 hover:bg-slate-100'
                            : 'text-[#eef0f5] hover:bg-[#1a1e28]'
                        }`}
                      >
                        <span className="truncate">{proj.title}</span>
                        <span
                          className={`ml-3 shrink-0 font-mono text-xs ${
                            isLight ? 'text-sky-600' : 'text-[#38bdf8]'
                          }`}
                        >
                          {proj.primaryBoard}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {quickResults.comps.length > 0 && (
                  <div>
                    <div
                      className={`px-2.5 py-1 text-[11px] font-medium ${
                        isLight ? 'text-slate-500' : 'text-[#7a8296]'
                      }`}
                    >
                      Sensors & Components
                    </div>
                    {quickResults.comps.map((comp) => (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => handleNav({ name: 'component-detail', componentId: comp.id })}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                          isLight
                            ? 'text-slate-800 hover:bg-slate-100'
                            : 'text-[#eef0f5] hover:bg-[#1a1e28]'
                        }`}
                      >
                        <span className="truncate">{comp.name}</span>
                        <span
                          className={`ml-3 shrink-0 font-mono text-xs ${
                            isLight ? 'text-slate-500' : 'text-[#7a8296]'
                          }`}
                        >
                          {comp.partNumber}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {quickQuery.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleNav({ name: 'search', query: quickQuery.trim() })}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                      isLight
                        ? 'border-sky-600/20 bg-sky-50 text-sky-700 hover:bg-sky-100'
                        : 'border-[#38bdf8]/30 bg-[#0b0d14] text-[#38bdf8] hover:bg-[#1a1e28]'
                    }`}
                  >
                    <span>Search full catalog for &ldquo;{quickQuery.trim()}&rdquo;</span>
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
};
