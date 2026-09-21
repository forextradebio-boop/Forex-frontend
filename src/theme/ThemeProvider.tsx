import React, { createContext, useContext, useState, useEffect } from 'react';
import { whiteTheme } from './light';
import { navyTheme } from './dark';
import { systemTheme } from './system';

export type Theme = typeof whiteTheme;
export type ThemeMode = 'white' | 'navy' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('ff_theme') as ThemeMode;
    return saved === 'white' ? 'white' : saved === 'system' ? 'system' : 'navy';
  });

  const theme = themeMode === 'white' ? whiteTheme : themeMode === 'system' ? systemTheme : navyTheme;

  useEffect(() => {
    localStorage.setItem('ff_theme', themeMode);
    const root = document.documentElement;

    Object.entries(theme).forEach(([key, value]) => {
      const cssKey = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssKey, value);
    });

    root.classList.toggle('white-theme', themeMode === 'white');
    root.classList.toggle('navy-theme', themeMode === 'navy');
    root.classList.toggle('system-theme', themeMode === 'system');
    root.classList.toggle('light-mode', themeMode === 'white');
    root.classList.toggle('dark-mode', themeMode === 'navy' || themeMode === 'system');
  }, [themeMode, theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
