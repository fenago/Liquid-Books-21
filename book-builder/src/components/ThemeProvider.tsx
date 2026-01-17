'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings } from '@/lib/supabase/hooks/useUserSettings';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { theme: userTheme, loading: settingsLoading } = useUserSettings();

  // Start with dark theme (default), will update once settings load
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage for non-authenticated users
  useEffect(() => {
    setMounted(true);

    if (!isAuthenticated) {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    }
  }, [isAuthenticated]);

  // Sync with user settings when authenticated
  useEffect(() => {
    if (isAuthenticated && !settingsLoading && userTheme) {
      setThemeState(userTheme);
    }
  }, [isAuthenticated, settingsLoading, userTheme]);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const applyTheme = () => {
      let resolved: 'light' | 'dark';

      if (theme === 'system') {
        resolved = getSystemTheme();
      } else {
        resolved = theme;
      }

      setResolvedTheme(resolved);

      // Apply to document
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // Save to localStorage for non-authenticated users
    if (!isAuthenticated) {
      localStorage.setItem('theme', newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
