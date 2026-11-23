export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'plugpilot-theme';

export function resolveTheme(
  stored: string | null | undefined,
  fallback: ThemeMode = 'dark'
): ThemeMode {
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return fallback;
}

export function readInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // Ignore storage access errors in restricted frames
  }
  return 'dark';
}

export function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
  root.style.colorScheme = theme;
}

export function persistTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage quota or sandbox errors
  }
}
