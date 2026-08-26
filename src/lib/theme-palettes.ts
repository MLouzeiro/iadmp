export interface ThemeColors {
  corPrincipal: string;
  corSecundaria: string;
  corDestaque: string;
  corFundo: string;
  corFundoClaro: string;
  corSuperficie: string;
  corTexto: string;
  corTextoSecundario: string;
  corBorda: string;
}

export interface Palette {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
}

export const defaultColors: ThemeColors = {
  corPrincipal: '#C8960C',
  corSecundaria: '#C41E1E',
  corDestaque: '#D4A017',
  corFundo: '#0A1628',
  corFundoClaro: '#F5E6C8',
  corSuperficie: '#0D1F35',
  corTexto: '#F0ECE2',
  corTextoSecundario: '#C8C2B6',
  corBorda: 'rgba(201, 168, 76, 0.12)',
};

export const palettes: Palette[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'Cores derivadas da logo da igreja — ouro, vermelho chama e fundo escuro.',
    colors: {
      corPrincipal: '#C8960C',
      corSecundaria: '#C41E1E',
      corDestaque: '#D4A017',
      corFundo: '#0A1628',
      corFundoClaro: '#F5E6C8',
      corSuperficie: '#0D1F35',
      corTexto: '#F0ECE2',
      corTextoSecundario: '#C8C2B6',
      corBorda: 'rgba(201, 168, 76, 0.12)',
    },
  },
  {
    id: 'elegante',
    name: 'Elegante',
    description: 'Variacao mais sofisticada com dourado profundo e fundo neutro.',
    colors: {
      corPrincipal: '#B8860B',
      corSecundaria: '#8B0000',
      corDestaque: '#DAA520',
      corFundo: '#111827',
      corFundoClaro: '#FEF3C7',
      corSuperficie: '#1F2937',
      corTexto: '#F9FAFB',
      corTextoSecundario: '#D1D5DB',
      corBorda: 'rgba(184, 134, 11, 0.15)',
    },
  },
  {
    id: 'moderna',
    name: 'Moderna',
    description: 'Variacao mais contemporanea com ambar vibrante e fundo limpo.',
    colors: {
      corPrincipal: '#D97706',
      corSecundaria: '#DC2626',
      corDestaque: '#F59E0B',
      corFundo: '#0F172A',
      corFundoClaro: '#FFFBEB',
      corSuperficie: '#1E293B',
      corTexto: '#F8FAFC',
      corTextoSecundario: '#CBD5E1',
      corBorda: 'rgba(217, 119, 6, 0.15)',
    },
  },
  {
    id: 'clara',
    name: 'Clara',
    description: 'Tema claro para uso diurno com fundo beige quente.',
    colors: {
      corPrincipal: '#92700C',
      corSecundaria: '#B91C1C',
      corDestaque: '#A16207',
      corFundo: '#FFFBEB',
      corFundoClaro: '#FEF3C7',
      corSuperficie: '#FFFFFF',
      corTexto: '#1C1917',
      corTextoSecundario: '#57534E',
      corBorda: 'rgba(146, 112, 12, 0.15)',
    },
  },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 0;

  const luminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return Math.round(ratio * 100) / 100;
}

export function colorsToCssVariables(colors: ThemeColors): string {
  const bgSecondary = adjustColor(colors.corSuperficie, 5);
  const bgCard = `${colors.corSuperficie}cc`;
  const bgCardHover = adjustColor(colors.corSuperficie, 10);
  const bgNav = `${colors.corFundo}f0`;
  const bgInput = `${colors.corTexto}0a`;
  const borderHover = colors.corPrincipal + '40';
  const textAccent = colors.corPrincipal;
  const shadowCard = `0 4px 24px ${colors.corFundo}66`;
  const shadowGlow = `0 0 30px ${colors.corPrincipal}14`;
  const overlayDark = `${colors.corFundo}d9`;
  const overlayLight = `${colors.corFundo}80`;
  const gradientGold = `linear-gradient(135deg, ${colors.corPrincipal}, ${darkenColor(colors.corPrincipal, 20)})`;
  const gradientGoldSoft = `linear-gradient(135deg, ${colors.corPrincipal}26, ${colors.corPrincipal}0d)`;

  return `
    --color-primary: ${colors.corPrincipal};
    --color-primary-variant: ${lightenColor(colors.corPrincipal, 15)};
    --color-secondary: ${colors.corSecundaria};
    --color-accent: ${colors.corDestaque};
    --bg-primary: ${colors.corFundo};
    --bg-secondary: ${bgSecondary};
    --bg-card: ${bgCard};
    --bg-card-hover: ${bgCardHover};
    --bg-nav: ${bgNav};
    --bg-hero: ${darkenColor(colors.corFundo, 5)};
    --bg-input: ${bgInput};
    --border-color: ${colors.corBorda};
    --border-hover: ${borderHover};
    --text-primary: ${colors.corTexto};
    --text-secondary: ${colors.corTextoSecundario};
    --text-muted: ${adjustColor(colors.corTextoSecundario, -20)};
    --text-accent: ${textAccent};
    --shadow-card: ${shadowCard};
    --shadow-glow: ${shadowGlow};
    --overlay-dark: ${overlayDark};
    --overlay-light: ${overlayLight};
    --gradient-gold: ${gradientGold};
    --gradient-gold-soft: ${gradientGoldSoft};
    --gradient-dark: linear-gradient(180deg, ${colors.corFundo} 0%, ${bgSecondary} 100%);
  `.trim();
}

function adjustColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `#${[clamp(rgb.r + amount), clamp(rgb.g + amount), clamp(rgb.b + amount)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const amount = Math.round(255 * (percent / 100));
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `#${[
    clamp(rgb.r + amount),
    clamp(rgb.g + amount),
    clamp(rgb.b + amount),
  ]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const amount = Math.round(255 * (percent / 100));
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `#${[
    clamp(rgb.r - amount),
    clamp(rgb.g - amount),
    clamp(rgb.b - amount),
  ]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}
