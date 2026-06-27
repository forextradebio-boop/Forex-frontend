import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme } from './light';
import { darkTheme } from './dark';

export type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isLightMode: boolean;
  setIsLightMode: (isLight: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('forexfactory_light_mode');
    return saved === 'true';
  });

  const theme = isLightMode ? lightTheme : darkTheme;

  useEffect(() => {
    localStorage.setItem('forexfactory_light_mode', isLightMode ? 'true' : 'false');
    localStorage.setItem('ff_theme', isLightMode ? 'light' : 'dark');
    
    // Inject all theme properties as CSS Custom Properties on document element
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      const cssKey = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssKey, value);
    });

    if (isLightMode) {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    } else {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    }
  }, [isLightMode, theme]);

  return (
    <ThemeContext.Provider value={{ theme, isLightMode, setIsLightMode }}>
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
