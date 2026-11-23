import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { Palette, type Colors } from '@/constants/theme';
import { prefs } from '@/lib/prefs';

export type ThemePref = 'system' | 'light' | 'dark';

interface ThemeCtx {
  colors: Colors;
  scheme: 'light' | 'dark';
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>(
    () => (prefs.get('theme') as ThemePref | null) ?? 'system',
  );
  const scheme: 'light' | 'dark' = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;

  const value = useMemo<ThemeCtx>(
    () => ({
      colors: Palette[scheme],
      scheme,
      pref,
      setPref: (p) => {
        prefs.set('theme', p);
        setPrefState(p);
      },
    }),
    [scheme, pref],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be used inside AppThemeProvider');
  return v;
}

export const useColors = () => useTheme().colors;
