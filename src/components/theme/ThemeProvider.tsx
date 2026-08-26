'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { defaultColors, type ThemeColors } from '@/lib/theme-palettes';

interface ThemeContextType {
  colors: ThemeColors;
  tema: string;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: defaultColors,
  tema: 'dark',
  loading: true,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [tema, setTema] = useState('dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/configuracoes')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.corPrincipal) {
          setColors({
            corPrincipal: data.corPrincipal,
            corSecundaria: data.corSecundaria,
            corDestaque: data.corDestaque,
            corFundo: data.corFundo,
            corFundoClaro: data.corFundoClaro,
            corSuperficie: data.corSuperficie,
            corTexto: data.corTexto,
            corTextoSecundario: data.corTextoSecundario,
            corBorda: data.corBorda,
          });
          setTema(data.tema || 'dark');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const handleUpdate = (e: CustomEvent) => {
      const d = e.detail;
      setColors({
        corPrincipal: d.corPrincipal,
        corSecundaria: d.corSecundaria,
        corDestaque: d.corDestaque,
        corFundo: d.corFundo,
        corFundoClaro: d.corFundoClaro,
        corSuperficie: d.corSuperficie,
        corTexto: d.corTexto,
        corTextoSecundario: d.corTextoSecundario,
        corBorda: d.corBorda,
      });
      if (d.tema) setTema(d.tema);
    };

    window.addEventListener('theme-updated', handleUpdate as EventListener);
    return () => window.removeEventListener('theme-updated', handleUpdate as EventListener);
  }, []);

  useEffect(() => {
    if (loading) return;

    const effectiveTheme = tema === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : tema;

    document.documentElement.setAttribute('data-theme', effectiveTheme);

    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.corPrincipal);
    root.style.setProperty('--color-primary-variant', colors.corPrincipal);
    root.style.setProperty('--color-secondary', colors.corSecundaria);
    root.style.setProperty('--color-accent', colors.corDestaque);
    root.style.setProperty('--bg-primary', colors.corFundo);
    root.style.setProperty('--bg-hero', colors.corFundo);
    root.style.setProperty('--bg-card', `${colors.corSuperficie}cc`);
    root.style.setProperty('--bg-card-hover', colors.corSuperficie);
    root.style.setProperty('--bg-nav', `${colors.corFundo}f0`);
    root.style.setProperty('--bg-input', `${colors.corTexto}0a`);
    root.style.setProperty('--text-primary', colors.corTexto);
    root.style.setProperty('--text-secondary', colors.corTextoSecundario);
    root.style.setProperty('--text-accent', colors.corPrincipal);
    root.style.setProperty('--border-color', colors.corBorda);
    root.style.setProperty('--border-hover', `${colors.corPrincipal}40`);
    root.style.setProperty('--shadow-card', `0 4px 24px ${colors.corFundo}66`);
    root.style.setProperty('--shadow-glow', `0 0 30px ${colors.corPrincipal}14`);
    root.style.setProperty('--overlay-dark', `${colors.corFundo}d9`);
    root.style.setProperty('--overlay-light', `${colors.corFundo}80`);
    root.style.setProperty('--gradient-gold', `linear-gradient(135deg, ${colors.corPrincipal}, ${colors.corPrincipal})`);
    root.style.setProperty('--gradient-gold-soft', `linear-gradient(135deg, ${colors.corPrincipal}26, ${colors.corPrincipal}0d)`);
    root.style.setProperty('--gradient-dark', `linear-gradient(180deg, ${colors.corFundo} 0%, ${colors.corSuperficie} 100%)`);

    if (effectiveTheme === 'light') {
      root.style.setProperty('--bg-secondary', colors.corFundoClaro);
    } else {
      root.style.setProperty('--bg-secondary', colors.corSuperficie);
    }
  }, [colors, tema, loading]);

  return (
    <ThemeContext.Provider value={{ colors, tema, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}
