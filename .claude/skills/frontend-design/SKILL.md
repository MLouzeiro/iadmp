---
name: frontend-design
description: >-
  Cria interfaces frontend de alto nível de design, com estética marcante e
  código de produção. Use esta skill quando o usuário pedir para construir
  componentes, páginas ou aplicações frontend.
---

# Skill: Frontend Design

Cria interfaces frontend com direção estética ousada, evitando o visual genérico de "AI slop". Gera código funcional com atenção excepcional a detalhes estéticos e escolhas criativas.

O usuário fornece requisitos de frontend: um componente, página, aplicação ou interface para construir. Pode incluir contexto sobre propósito, público ou restrições técnicas.

## Design Thinking

Antes de codificar, entenda o contexto e escolha uma **direção estética** clara:

- **Propósito**: Qual problema esta interface resolve? Quem usa? (no IADMP: pastores, líderes, secretários, membros)
- **Tom**: Escolha um extremo: brutalmente minimalista, luxuoso/refinado, editorial/revista, orgânico/natural, geométrico, etc. Use estes como inspiração mas crie algo fiel à direção estética.
- **Restrições**: Requisitos técnicos (framework, performance, acessibilidade, tema claro/escuro).
- **Diferenciação**: O que torna isso INESQUECÍVEL? Qual a única coisa que alguém vai lembrar?

**CRÍTICO**: Escolha uma direção conceitual clara e execute com precisão. Maximalismo ousado e minimalismo refinado funcionam — o segredo é intencionalidade, não intensidade.

Depois implemente código funcional (React/Next.js, CSS Modules) que seja:
- De nível de produção e funcional
- Visualmente marcante e memorável
- Coeso com um ponto de vista estético claro
- Meticulosamente refinado em cada detalhe

## Diretrizes de Estética Frontend

Foco em:

- **Tipografia**: Junte Playfair Display (títulos) com Montserrat (corpo) — não invente fontes novas fora desta dupla. Varie pesos, tamanhos e hierarquia com intenção.
- **Cor & Tema**: Comprometa-se com uma estética coesa usando as variáveis CSS do tema (`var(--color-primary)`, `var(--bg-card)`, ...). Ouro + fundo escuro `#0a1628` é a base; acentos marcantes superam paletas tímidas.
- **Movimento**: Use animações e micro-interações com `var(--transition)`/CSS-only. Revele seções com `animation-delay` escalonado no carregamento; hover que surpreenda. Não adicione bibliotecas de animação novas — a stack não inclui framer-motion.
- **Composição Espacial**: Layouts inesperados. Assimetria. Sobreposição. Espaço negativo generoso OU densidade controlada.
- **Fundos & Detalhes Visuais**: Crie atmosfera com `--gradient-gold-soft`, `--gradient-dark`, `--shadow-glow`, texturas sutis e transparências — nada de gradientes roxos genéricos.

NUNCA use estética genérica de IA: fontes clichê (Inter, Roboto, Arial, system fonts), gradientes roxos, layouts previsíveis, componentes genéricos. NUNCA use Tailwind ou shadcn/ui — a stack é CSS Modules.

Interprete criativamente e faça escolhas inesperadas que pareçam genuinamente projetadas para o contexto da igreja. Nenhum design deve ser igual.

**IMPORTANTE**: Combine a complexidade da implementação com a visão estética. Designs maximalistas precisam de código elaborado; designs minimalistas precisam de contenção, precisão e cuidado com espaçamento e detalhes sutis.

## Stack do Projeto

Este projeto usa:
- **Framework**: Next.js 16 (App Router) + React 19
- **Estilização**: CSS Modules (`*.module.css`) + variáveis CSS do tema — **sem Tailwind, sem shadcn/ui**
- **Componentes base**: `src/components/ui/` (Button, Card, Input, Select, Textarea, Checkbox, SearchBar, FormCard, FormGrid, SectionHead)
- **Estado**: `useState` + `useEffect` + `fetch` — **sem TanStack Query**
- **Ícones**: lucide-react — disponível no projeto
- **Fontes**: Playfair Display + Montserrat, carregadas via `@import` do Google Fonts em `src/app/globals.css`
- **Identidade visual**: aplicar os tokens da skill `design-system` (`docs/IDENTIDADE_VISUAL.md`)

### Padrão de CSS Module

```css
.meuComponente {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: var(--transition);
}

.meuComponente:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-glow);
}
```

### Padrão de página `'use client'`

```tsx
'use client';
import { useState, useEffect } from 'react';
import styles from './pagina.module.css';

export default function Pagina() {
  const [dados, setDados] = useState<Tipagem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/...')
      .then((r) => r.json())
      .then(setDados)
      .finally(() => setLoading(false));
  }, []);
  // sempre tratar: loading, erro e lista vazia
}
```

## Quando NÃO usar esta skill

- **API Routes** — usar a skill `api-route-pattern`
- **Testes** (`__tests__/`) — testes não precisam de design
- **Lógica de backend** (Prisma queries, auth) — fora do escopo
- **Configuração de infraestrutura** — usar o agent `infra`
