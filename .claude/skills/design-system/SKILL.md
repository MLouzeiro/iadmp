---
name: design-system
description: >-
  Tokens de design da identidade visual IADMP. Use esta skill para aplicar a
  identidade visual da igreja em componentes frontend: paleta de cores
  (ouro/vermelho/fundo escuro), tipografia Playfair Display + Montserrat,
  variáveis CSS, cards, botões e temas claro/escuro.
---

# Skill: Design System - IADMP

Identidade visual da Igreja Assembleia de Deus Ministério da Promessa.
Referência completa: `docs/IDENTIDADE_VISUAL.md`. Tokens oficiais em `src/app/globals.css`.

**NUNCA use cores hardcoded** — sempre variáveis CSS (`var(--...)`).
**NUNCA use Tailwind** — stack é CSS Modules + variáveis do tema.

## Paleta de Cores (tema escuro — padrão)

```css
:root,
[data-theme="dark"] {
  /* Primárias */
  --color-primary: #c9a84c;          /* Ouro — botões, links, destaques */
  --color-primary-variant: #e0c068;
  --color-secondary: #d4a843;
  --color-accent: #b8922e;

  /* Fundos */
  --bg-primary: #0a1628;             /* Fundo do site */
  --bg-secondary: #0d1f35;           /* Superfície: cards, sidebar, navbar */
  --bg-card: rgba(13, 31, 53, 0.8);
  --bg-card-hover: rgba(20, 45, 75, 0.9);
  --bg-nav: rgba(10, 22, 40, 0.95);
  --bg-hero: #070e1a;
  --bg-input: rgba(255, 255, 255, 0.05);

  /* Bordas */
  --border-color: rgba(201, 168, 76, 0.12);
  --border-hover: rgba(201, 168, 76, 0.3);

  /* Texto */
  --text-primary: #f0ece2;           /* Títulos e texto principal */
  --text-secondary: #c8c2b6;         /* Corpo e descrições */
  --text-muted: #8a8578;
  --text-accent: #c9a84c;

  /* Efeitos */
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4);
  --shadow-glow: 0 0 30px rgba(201, 168, 76, 0.08);
  --overlay-dark: rgba(7, 14, 26, 0.85);
  --overlay-light: rgba(7, 14, 26, 0.5);
}
```

## Tema claro

```css
[data-theme="light"] {
  --color-primary: #8b6914;
  --color-secondary: #c9a84c;
  --bg-primary: #faf8f4;
  --bg-secondary: #f0ece2;
  --bg-card: rgba(255, 255, 255, 0.9);
  --text-primary: #1a1a1a;
  --text-secondary: #3d3d3d;
  --text-muted: #6b6b6b;
}
```

## Gradientes, raios e layout

```css
:root {
  --gradient-gold: linear-gradient(135deg, #c9a84c, #a67c1a);
  --gradient-gold-soft: linear-gradient(135deg, rgba(201, 168, 76, 0.15), rgba(166, 124, 26, 0.05));
  --gradient-dark: linear-gradient(180deg, #0a1628 0%, #0d1f35 100%);
  --radius-lg: 1rem;
  --radius-md: 0.75rem;
  --radius-sm: 0.5rem;
  --radius-xl: 1.5rem;
  --header-height: 4.5rem;
  --container-width-lg: 75%;
  --container-width-md: 90%;
  --container-width-sm: 95%;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Paletas predefinidas

Definidas em `src/lib/theme-palettes.ts`, aplicadas pelo `ThemeProvider`:

| Paleta | Primary | Secondary | Accent | Fundo |
|--------|---------|-----------|--------|-------|
| **Original** | `#C8960C` | `#C41E1E` | `#D4A017` | `#0A1628` |
| **Elegante** | `#B8860B` | `#8B0000` | `#DAA520` | `#111827` |
| **Moderna** | `#D97706` | `#DC2626` | `#F59E0B` | `#0F172A` |
| **Clara** | `#92700C` | `#B91C1C` | `#A16207` | `#FFFBEB` |

## Tipografia

| Fonte | Uso | Como aplicar |
|-------|-----|--------------|
| **Playfair Display** | Títulos (h1–h6) | `font-family: 'Playfair Display', serif` — já global em `globals.css` |
| **Montserrat** | Corpo, botões, inputs | `font-family: 'Montserrat', sans-serif` — já global em `globals.css` |

Carregada via `@import` do Google Fonts no topo de `globals.css` (pesos 300–800).

### Escala recomendada

| Elemento | Font | Peso |
|----------|------|------|
| H1 hero | Playfair Display | 700 |
| H2 seção | Playfair Display | 600 |
| Card title | Playfair Display | 600 |
| Corpo | Montserrat | 400, line-height 1.7 |
| Botão/label | Montserrat | 600, `text-transform: uppercase`, `letter-spacing: 0.05em` |

## Botões (`.btn` global em globals.css)

- `display: inline-flex; align-items: center; gap: 0.5rem`
- `padding: 0.75rem 1.75rem; border-radius: var(--radius-sm)`
- Montserrat 600, 0.875rem, uppercase, letter-spacing 0.05em
- Primário: `background: var(--gradient-gold)`, texto escuro
- Hover: transição `var(--transition)`

## Cards

- `background: var(--bg-card)`; hover: `var(--bg-card-hover)`
- `border: 1px solid var(--border-color)`; hover: `var(--border-hover)`
- `border-radius: var(--radius-lg)`; `box-shadow: var(--shadow-card)`

## Componentes a reutilizar

Antes de criar UI nova, verifique `src/components/ui/`:
Button, Card, Input, Select, Textarea, Checkbox, SearchBar, FormCard, FormGrid, SectionHead.
Formulários do painel: `FormCard` + `FormGrid` + `@/components/ui/form.module.css`.

## Como o tema é aplicado

1. `ThemeProvider` busca `/api/configuracoes` na montagem
2. Injeta variáveis no `:root` via `document.documentElement.style.setProperty()`
3. Define `data-theme` no `<html>` (dark/light)
4. Escuta o evento `theme-updated` para atualizações em tempo real

## Utilização

Carregue esta skill com o comando `skill design-system` sempre que for criar
componentes que devam seguir a identidade visual IADMP. Use `frontend-design`
para as diretrizes estéticas de implementação.
