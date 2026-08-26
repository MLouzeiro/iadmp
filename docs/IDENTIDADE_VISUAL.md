# Identidade Visual — IADMP

## Visao Geral

O sistema de identidade visual permite configurar as cores, logos e tema do site publico e do painel administrativo de forma centralizada. As configuracoes sao salvas no banco de dados e aplicadas automaticamente em todo o sistema.

## Extracao de Cores da Logo

A logo da IADMP foi analisada e as seguintes cores foram identificadas:

| Cor | Hex | Uso |
|---|---|---|
| **Principal (Ouro)** | `#C8960C` | Texto "ASSEMBLEIA DE DEUS", letra "P" do ADMP |
| **Secundaria (Vermelho)** | `#C41E1E` | Chamas da logo |
| **Destaque (Ambar)** | `#D4A017` | Detalhes dourados |
| **Fundo Escuro** | `#0A1628` | Fundo do site (tema escuro) |
| **Superficie** | `#0D1F35` | Cards, sidebar, navbar |
| **Fundo Claro** | `#F5E6C8` | Fundo circular da logo |
| **Texto** | `#F0ECE2` | Texto principal |
| **Texto Secundario** | `#C8C2B6` | Texto descritivo |

## Paletas Pre-definidas

### Original
Cores derivadas da logo — ouro, vermelho chama e fundo escuro.

### Elegante
Variacao mais sofisticada com dourado profundo (`#B8860B`) e fundo neutro (`#111827`).

### Moderna
Variacao mais contemporanea com ambar vibrante (`#D97706`) e fundo limpo (`#0F172A`).

### Clara
Tema claro para uso diurno com fundo beige quente (`#FFFBEB`).

## Variaveis CSS

Todas as cores sao controladas por variaveis CSS no `:root`:

```css
:root {
  --color-primary: #C8960C;
  --color-primary-variant: ...;
  --color-secondary: #C41E1E;
  --color-accent: #D4A017;
  --bg-primary: #0A1628;
  --bg-secondary: ...;
  --bg-card: ...;
  --bg-card-hover: ...;
  --bg-nav: ...;
  --bg-hero: ...;
  --bg-input: ...;
  --border-color: ...;
  --border-hover: ...;
  --text-primary: #F0ECE2;
  --text-secondary: #C8C2B6;
  --text-muted: ...;
  --text-accent: ...;
  --shadow-card: ...;
  --shadow-glow: ...;
  --overlay-dark: ...;
  --overlay-light: ...;
  --gradient-gold: ...;
  --gradient-gold-soft: ...;
  --gradient-dark: ...;
}
```

## Estrutura do Tema

```
IDENTIDADE VISUAL
│
├── Cores
│   ├── Principal (botoes, links, destaques)
│   ├── Secundaria (avisos, alertas, chamas)
│   ├── Destaque (detalhes, hover)
│   ├── Fundo (background principal)
│   ├── Fundo Claro (tema claro)
│   ├── Superficie (cards, navbar, sidebar)
│   ├── Texto (titulos, corpo)
│   ├── Texto Secundario (descricoes)
│   └── Borda (separadores)
│
├── Tema
│   ├── Escuro (dark)
│   ├── Claro (light)
│   └── Automatico (baseado no SO)
│
├── Logos
│   ├── Logo Principal
│   ├── Logo para Fundo Claro
│   └── Favicon
│
└── Tipografia
    ├── Playfair Display (titulos)
    └── Montserrat (corpo)
```

## Como Alterar

1. Acesse `/admin/configuracoes/aparencia`
2. Altere as cores usando os seletores
3. Ou selecione uma paleta pre-definida
4. Visualize em tempo real na area de pre-visualizacao
5. Clique em "Salvar alteracoes"

## Onde Ficam Armazenadas

- **Banco de dados:** Tabela `ConfiguracoesIgreja` no PostgreSQL (Neon)
- **API:** `GET/PUT /api/configuracoes`
- **Frontend:** `ThemeProvider` injeta variaveis CSS no `document.documentElement`

## Como o Site Carrega o Tema

1. `ThemeProvider` busca `/api/configuracoes` na montagem
2. Injeta variaveis CSS no `:root` via `document.documentElement.style.setProperty()`
3. Define `data-theme` no `<html>` para temas claro/escuro
4. Escuta evento `theme-updated` para atualizacoes em tempo real

## Como o Painel Carrega o Tema

O painel administrativo utiliza o mesmo `ThemeProvider` e as mesmas variaveis CSS. A sidebar e os componentes do admin usam `var(--bg-card)`, `var(--color-primary)`, etc.

## Seguranca

- Somente usuarios autenticados podem acessar `/admin/configuracoes/aparencia`
- A API `PUT /api/configuracoes` deve validar a autenticacao (a implementar com middleware)
- Configuracoes sao validadas no backend antes de salvar

## Paleta de Cores Disponivel

```
Original:    #C8960C  #C41E1E  #D4A017  #0A1628  #0D1F35
Elegante:    #B8860B  #8B0000  #DAA520  #111827  #1F2937
Moderna:     #D97706  #DC2626  #F59E0B  #0F172A  #1E293B
Clara:       #92700C  #B91C1C  #A16207  #FFFBEB  #FFFFFF
```

## Arquivos Relacionados

- `prisma/schema.prisma` — Model `ConfiguracoesIgreja`
- `src/lib/theme-palettes.ts` — Paletas, utilitarios de cor, conversao CSS
- `src/components/theme/ThemeProvider.tsx` — Provedor de tema
- `src/components/theme/ClientLayout.tsx` — Layout client-side com ThemeProvider
- `src/app/api/configuracoes/route.ts` — API GET/PUT
- `src/app/admin/configuracoes/aparencia/page.tsx` — Tela de configuracao
- `src/app/globals.css` — Variaveis CSS base
