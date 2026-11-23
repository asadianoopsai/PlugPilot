/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AssistantView } from './components/AssistantView';
import { ComponentDetailView } from './components/ComponentDetailView';
import { ComponentLibraryView } from './components/ComponentLibraryView';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { MosaicSkyBackground } from './components/MosaicSkyBackground';
import { Navbar } from './components/Navbar';
import { ProjectDetailView } from './components/ProjectDetailView';
import { ProjectLibraryView } from './components/ProjectLibraryView';
import { Sandbox3DView } from './components/Sandbox3DView';
import { SmartSearchView } from './components/SmartSearchView';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppView, BeginnerCircuitId } from './types/electronics';

function parseHashToView(): AppView {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash || hash === 'home') return { name: 'home' };
  const [route, param] = hash.split('/');
  const decoded = param ? decodeURIComponent(param) : '';

  if (route === 'components') {
    return { name: 'components', category: (decoded as never) || 'All' };
  }
  if (route === 'component' && decoded) {
    return { name: 'component-detail', componentId: decoded };
  }
  if (route === 'projects') {
    return { name: 'projects', difficulty: 'All' };
  }
  if (route === 'project' && decoded) {
    return { name: 'project-detail', projectId: decoded };
  }
  if (route === 'sandbox') {
    const validPresets: BeginnerCircuitId[] = ['led-blink', 'dht22-climate', 'hcsr04-sonar'];
    const presetId = validPresets.includes(decoded as BeginnerCircuitId)
      ? (decoded as BeginnerCircuitId)
      : undefined;
    return { name: 'sandbox', presetId };
  }
  if (route === 'search') {
    return { name: 'search', query: decoded };
  }
  if (route === 'assistant') {
    return { name: 'assistant', initialPrompt: decoded || undefined };
  }
  return { name: 'home' };
}

function viewToHash(view: AppView): string {
  switch (view.name) {
    case 'home':
      return '#/home';
    case 'components':
      return view.category && view.category !== 'All'
        ? `#/components/${encodeURIComponent(view.category)}`
        : '#/components';
    case 'component-detail':
      return `#/component/${encodeURIComponent(view.componentId)}`;
    case 'projects':
      return '#/projects';
    case 'project-detail':
      return `#/project/${encodeURIComponent(view.projectId)}`;
    case 'sandbox':
      return view.presetId ? `#/sandbox/${encodeURIComponent(view.presetId)}` : '#/sandbox';
    case 'search':
      return `#/search/${encodeURIComponent(view.query)}`;
    case 'assistant':
      return view.initialPrompt
        ? `#/assistant/${encodeURIComponent(view.initialPrompt)}`
        : '#/assistant';
  }
}

function AppShell() {
  const { theme } = useTheme();
  const [currentView, setCurrentView] = useState<AppView>(() => parseHashToView());

  useEffect(() => {
    const onHashChange = () => {
      setCurrentView(parseHashToView());
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (nextView: AppView) => {
    const nextHash = viewToHash(nextView);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    setCurrentView(nextView);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-[#050506] text-[#eef0f5]">
      {currentView.name !== 'sandbox' && <MosaicSkyBackground theme={theme} />}
      <Navbar currentView={currentView} onNavigate={navigate} />

      <main className="relative z-10 flex-1">
        {currentView.name === 'home' && <HomeView onNavigate={navigate} />}

        {currentView.name === 'components' && (
          <ComponentLibraryView
            key={currentView.category ?? 'All'}
            initialCategory={currentView.category ?? 'All'}
            initialBoard={currentView.board ?? 'All'}
            onNavigate={navigate}
          />
        )}

        {currentView.name === 'component-detail' && (
          <ComponentDetailView
            key={currentView.componentId}
            componentId={currentView.componentId}
            onNavigate={navigate}
          />
        )}

        {currentView.name === 'projects' && (
          <ProjectLibraryView
            initialDifficulty={currentView.difficulty ?? 'All'}
            initialBoard={currentView.board ?? 'All'}
            onNavigate={navigate}
          />
        )}

        {currentView.name === 'project-detail' && (
          <ProjectDetailView
            key={currentView.projectId}
            projectId={currentView.projectId}
            onNavigate={navigate}
          />
        )}

        {currentView.name === 'sandbox' && (
          <Sandbox3DView
            key={`${currentView.presetId ?? 'dht22-climate'}-${currentView.boardId ?? 'default'}`}
            initialPresetId={currentView.presetId}
            initialBoardId={currentView.boardId}
            onNavigate={navigate}
          />
        )}

        {currentView.name === 'search' && (
          <SmartSearchView
            key={currentView.query}
            initialQuery={currentView.query}
            onNavigate={navigate}
          />
        )}

        {currentView.name === 'assistant' && (
          <AssistantView
            initialPrompt={currentView.initialPrompt}
            onNavigate={navigate}
          />
        )}
      </main>

      {currentView.name !== 'sandbox' && <Footer onNavigate={navigate} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
