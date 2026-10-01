# Regras de Frontend (Componentes, Páginas, Tema)

Aplica para: `src/app/**/page.tsx`, `src/components/**`, `src/data/**`

## 'use client'
- Todo arquivo que usa hooks React (`useState`, `useEffect`, `usePathname`), browser APIs (`localStorage`, `document`, `fetch`), ou event handlers DEVE ter `"use client";` na primeira linha
- Páginas do painel (`src/app/admin/**`) são sempre client components
- Componentes que só recebem props e renderizam JSX podem ficar server components

## Estilização (sem Tailwind, sem shadcn)
- CSS Modules (`*.module.css`) + variáveis CSS do tema — **nunca** cores/fontes hardcoded
- Usar `var(--color-primary)`, `var(--bg-card)`, `var(--text-primary)`, `var(--border-color)`, ... (ver `docs/IDENTIDADE_VISUAL.md`)
- Componentes base em `src/components/ui/` (Button, Card, Input, Select, Textarea, Checkbox, SearchBar, FormCard, FormGrid, SectionHead) — reaproveitar antes de criar novo

## API calls
- URL relativa sempre: `fetch("/api/eventos")` — nunca `http://localhost:3000`
- Nunca importar módulos server-side (`@/lib/prisma`, `@/lib/auth`) em client components
- Sessão/cookies são tratadas pelo NextAuth — não repetir token manualmente nas chamadas do painel

## Padrão de dados do painel
- `useState` + `useEffect` + `fetch` (não há TanStack Query neste projeto)
- Sempre tratar `loading` e erro na UI; recarregar a lista após create/update/delete
- Exemplo: `src/app/admin/eventos/page.tsx`

## Tema
- `ThemeProvider` (`src/components/theme/ThemeProvider.tsx`) busca `/api/configuracoes` e injeta as variáveis CSS no `:root`
- Paletas predefinidas em `@/lib/theme-palettes` (Original, Elegante, Moderna, Clara)
- Nunca sobrescrever variáveis do tema com valores fixos nos componentes

## Ícones e assets
- Ícones: `lucide-react`
- Imagens do site público: `public/images/...`; referenciar com caminho relativo ou `next/image`
