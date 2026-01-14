import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  accentColor: string;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [accentColor, setAccentColorState] = useState('#f59e0b');

  useEffect(() => {
    if (user) {
      // Load theme from profile
      supabase
        .from('profiles')
        .select('theme_mode, custom_accent_color')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setModeState((data.theme_mode as ThemeMode) || 'light');
            setAccentColorState(data.custom_accent_color || '#f59e0b');
          }
        });
    } else {
      // Load from localStorage for non-logged-in users
      const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
      const savedColor = localStorage.getItem('accent-color');
      if (savedMode) setModeState(savedMode);
      if (savedColor) setAccentColorState(savedColor);
    }
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update accent color CSS variable
    const hsl = hexToHSL(accentColor);
    root.style.setProperty('--accent', hsl);
  }, [mode, accentColor]);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ theme_mode: newMode })
        .eq('id', user.id);
    } else {
      localStorage.setItem('theme-mode', newMode);
    }
  };

  const setAccentColor = async (color: string) => {
    setAccentColorState(color);
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ custom_accent_color: color })
        .eq('id', user.id);
    } else {
      localStorage.setItem('accent-color', color);
    }
  };

  return (
    <ThemeContext.Provider value={{ mode, accentColor, setMode, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '38 92% 50%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lVal = Math.round(l * 100);

  return `${h} ${s}% ${lVal}%`;
}
