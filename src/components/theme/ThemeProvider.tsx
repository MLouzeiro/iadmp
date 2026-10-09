'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { defaultColors, getContrastRatio, darkenColor, type ThemeColors } from '@/lib/theme-palettes';

interface ThemeContextType {
  colors: ThemeColors;
  tema: string;
  loading: boolean;
  toggleTheme: () => void;
  setTemaManual: (t: string) => void;
  updateColors: (c: Partial<ThemeColors>) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: defaultColors,
  tema: 'dark',
  loading: true,
  toggleTheme: () => {},
  setTemaManual: () => {},
  updateColors: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [tema, setTema] = useState('dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('iadmp-theme') : null;
    if (savedTheme) setTema(savedTheme);

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
          if (!savedTheme && data.tema) setTema(data.tema);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const handleUpdate = (e: CustomEvent) => {
      const d = e.detail;
      if (d.corPrincipal) {
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
      }
      if (d.tema) {
        setTema(d.tema);
        try { localStorage.setItem('iadmp-theme', d.tema); } catch {}
      }
    };

    window.addEventListener('theme-updated', handleUpdate as EventListener);
    return () => window.removeEventListener('theme-updated', handleUpdate as EventListener);
  }, []);

  const toggleTheme = useCallback(() => {
    setTema((prev) => {
      const base = prev === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : prev;
      const next = base === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('iadmp-theme', next); } catch {}
      return next;
    });
  }, []);

  const setTemaManual = useCallback((t: string) => {
    setTema(t);
    try { localStorage.setItem('iadmp-theme', t); } catch {}
  }, []);

  const updateColors = useCallback((c: Partial<ThemeColors>) => {
    setColors((prev) => ({ ...prev, ...c }));
  }, []);

  useEffect(() => {
    if (loading) return;

    const effectiveTheme = tema === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : tema;

    document.documentElement.setAttribute('data-theme', effectiveTheme);

    const claro = effectiveTheme === 'light';
    const fundoLuz = colors.corFundoClaro || '#f5e6c8';
    const fundoEhClaro = getContrastRatio(colors.corFundo, '#ffffff') < 1.5;
    const superficieEhClara = getContrastRatio(colors.corSuperficie, '#ffffff') < 1.5;
    const bgClaro = fundoEhClaro ? colors.corFundo : '#faf8f4';
    const textoPrimario = claro && getContrastRatio(colors.corTexto, bgClaro) < 4.5
      ? '#1a1a1a'
      : colors.corTexto;
    const textoSecundario = claro && getContrastRatio(colors.corTextoSecundario, bgClaro) < 4.5
      ? '#3d3d3d'
      : colors.corTextoSecundario;
    const textoAcento = claro && getContrastRatio(colors.corPrincipal, bgClaro) < 3
      ? darkenColor(colors.corPrincipal, 25)
      : colors.corPrincipal;

    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.corPrincipal);
    root.style.setProperty('--color-primary-variant', colors.corPrincipal);
    root.style.setProperty('--color-secondary', colors.corSecundaria);
    root.style.setProperty('--color-accent', colors.corDestaque);
    root.style.setProperty('--bg-primary', claro ? bgClaro : colors.corFundo);
    root.style.setProperty('--bg-hero', claro ? fundoLuz : colors.corFundo);
    root.style.setProperty(
      '--bg-card',
      claro
        ? superficieEhClara
          ? `${colors.corSuperficie}cc`
          : 'rgba(255, 255, 255, 0.9)'
        : `${colors.corSuperficie}cc`
    );
    root.style.setProperty(
      '--bg-card-hover',
      claro ? (superficieEhClara ? colors.corSuperficie : '#ffffff') : colors.corSuperficie
    );
    root.style.setProperty(
      '--bg-nav',
      claro
        ? fundoEhClaro
          ? `${colors.corFundo}f0`
          : 'rgba(250, 248, 244, 0.95)'
        : `${colors.corFundo}f0`
    );
    root.style.setProperty('--bg-input', claro ? 'rgba(0, 0, 0, 0.04)' : `${colors.corTexto}0a`);
    root.style.setProperty('--text-primary', textoPrimario);
    root.style.setProperty('--text-secondary', textoSecundario);
    root.style.setProperty('--text-accent', textoAcento);
    root.style.setProperty('--border-color', colors.corBorda);
    root.style.setProperty('--border-hover', `${colors.corPrincipal}40`);
    root.style.setProperty(
      '--shadow-card',
      claro
        ? fundoEhClaro
          ? 'rgba(0, 0, 0, 0.06)'
          : `${colors.corFundo}14`
        : `0 4px 24px ${colors.corFundo}66`
    );
    root.style.setProperty('--shadow-glow', `0 0 30px ${colors.corPrincipal}14`);
    root.style.setProperty('--overlay-dark', claro ? `${fundoLuz}e6` : `${colors.corFundo}d9`);
    root.style.setProperty('--overlay-light', `${colors.corFundo}80`);
    root.style.setProperty('--gradient-gold', `linear-gradient(135deg, ${colors.corPrincipal}, ${colors.corDestaque || colors.corSecundaria || colors.corPrincipal})`);
    root.style.setProperty('--gradient-gold-soft', `linear-gradient(135deg, ${colors.corPrincipal}26, ${colors.corPrincipal}0d)`);
    root.style.setProperty('--gradient-dark', `linear-gradient(180deg, ${colors.corFundo} 0%, ${colors.corSuperficie} 100%)`);

    if (claro) {
      root.style.setProperty('--bg-secondary', fundoLuz);
    } else {
      root.style.setProperty('--bg-secondary', colors.corSuperficie);
    }
  }, [colors, tema, loading]);

  return (
    <ThemeContext.Provider value={{ colors, tema, loading, toggleTheme, setTemaManual, updateColors }}>
      {children}
    </ThemeContext.Provider>
  );
}
