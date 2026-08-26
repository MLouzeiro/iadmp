# Auditoria Completa — Projeto Website

**Localização:** `C:\Users\Louzeiro\Documents\Louzeiro\Projeto\website`
**Data:** 26/08/2026

---

## 1. Tecnologia

| Tecnologia | Versão | Observação |
|---|---|---|
| Next.js | ^16.3.2 | App Router |
| React | ^19.2.8 | |
| TypeScript | ^7.0.2 | |
| Prisma | ^5.22.0 | ORM |
| @prisma/adapter-neon | ^7.9.1 | Serverless Postgres |
| @neondatabase/serverless | ^1.1.0 | Driver Neon |
| NextAuth | ^5.0.0-beta.32 | Autenticação (beta) |
| bcryptjs | ^3.0.3 | Hash de senhas |
| Zod | ^4.4.3 | Validação |
| lucide-react | ^1.33.0 | Ícones |
| react-icons | ^5.5.0 | Ícones adicionais |
| @emailjs/browser | ^4.4.1 | Envio de email (client) |
| react-slick / slick-carousel | ^0.30.2 / ^1.8.1 | Carrossel (legado, não utilizado) |
| react-router-dom | ^6.23.0 | Legado, não utilizado no Next.js |
| react-scripts | ^5.0.0 | CRA legado |

**CSS:** CSS puro com variáveis CSS (dark/light theme), sem Tailwind.
**Fonte:** Montserrat (via next/font/google).

---

## 2. Estrutura

```
website/
├── _legacy/              # Código CRA antigo (preservado, inativo)
├── build/                # Build CRA antigo
├── docs/                 # Documentação existente
├── prisma/               # Schema + seed
├── public/images/        # Imagens estáticas (~100+ imagens, ~10+ vídeos)
├── scripts/              # Script de versículo diário (WhatsApp)
├── src/
│   ├── app/              # Páginas Next.js App Router
│   ├── components/       # Componentes reutilizáveis
│   │   ├── home/         # Seções da home (7 componentes)
│   │   ├── layout/       # Navbar, Footer, ThemeToggle
│   │   └── ui/           # Card, SectionHead
│   ├── css/              # CSS legado
│   ├── data/             # Dados hardcoded (site-data.ts)
│   ├── images/           # Imagens importadas
│   ├── lib/              # auth.ts, prisma.ts
│   ├── middleware.ts      # Proteção de rotas /gestao
│   └── types/            # Tipos NextAuth
```

---

## 3. Páginas

### Públicas

| Rota | Arquivo | Descrição |
|---|---|---|
| `/` | `page.tsx` | Home: VideoEntrada, Versículo do Dia (31 versículos hardcoded), Programas (4), Congregações (3), Valores (4), Depoimentos (5), FAQs (8) |
| `/sobre` | `sobre/page.tsx` | 3 seções: Café da Manhã, Comunhão, Obediência |
| `/galeria` | `galeria/page.tsx` | 15 imagens estáticas em grid 3 colunas |
| `/lideranca` | `lideranca/page.tsx` | 14 líderes com nome, cargo e foto |
| `/inscricao` | `inscricao/page.tsx` | Formulários de cadastro (membro + líder) via EmailJS |
| `/contato` | `contato/page.tsx` | Email, Facebook Messenger, WhatsApp |

### Administrativas (`/gestao/*`)

| Rota | Descrição |
|---|---|
| `/gestao` | Dashboard com KPIs (eventos, arrecadação, variação) |
| `/gestao/login` | Login (NextAuth credentials) |
| `/gestao/eventos` | CRUD de eventos |
| `/gestao/historico` | Histórico de eventos com avaliações |
| `/gestao/avaliacoes` | Avaliações pós-evento (estrelas 1-5) |

---

## 4. Conteúdo

### Dados Hardcoded (src/data/site-data.ts)
- 6 links de navegação
- 4 programas semanais
- 4 valores cristãos
- 8 FAQs
- 3 congregações
- 14 líderes/obreiros
- 5 depoimentos

### Versículo Diário (VerseOfTheDay.tsx)
- 31 versículos bíblicos com reflexão teológica
- Seleção: `dayOfYear % 31`
- Funcionalidade WhatsApp via GitHub Actions (daily-verse.yml)

### Tema Dark/Light
- CSS custom properties
- Persistência em localStorage (`iadmp-theme`)

---

## 5. Banco de Dados

### Prisma Schema (15+ modelos)

| Modelo | Finalidade |
|---|---|
| User | Usuários com roles (ADMIN, PASTOR, SECRETARIA, FINANCEIRO, etc.) |
| Membro | Membros da igreja |
| Ministerio | Ministérios |
| Departamento | Departamentos |
| Lideranca | Liderança com ordem de exibição |
| Evento | Eventos com status, finanças, avaliação |
| CategoriaEvento | Categorias de eventos |
| EventoParticipante | Participantes |
| TarefaEvento | Tarefas de eventos |
| Campanha | Campanhas de arrecadação |
| CategoriaFinanceira | Categorias financeiras |
| EventoFinanceiro | Movimentações financeiras |
| Avaliacao | Avaliações pós-evento |
| Liturgia / LiturgiaItem | Liturgia |
| Agenda | Agenda com recorrência |
| Aviso | Avisos com prioridade |
| GaleriaAlbum / GaleriaItem | Galeria de fotos |
| Oportunidade | Oportunidades de voluntariado |

### Seed
- 1 admin (`admin@iadmp.com` / `admin123`)
- 5 eventos de exemplo
- Campanhas e avaliações

---

## 6. Autenticação

- **NextAuth v5 beta** com credentials provider
- **Problema:** Admin hardcoded no código (bypass do DB)
- JWT com roles
- Middleware protege `/gestao/*`
- **API routes não protegidas** (qualquer pessoa pode CRUD)

---

## 7. API Routes

| Rota | Métodos | Descrição |
|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handler |
| `/api/eventos` | GET, POST | Listar/criar eventos |
| `/api/eventos/[id]` | GET, PUT, DELETE | CRUD evento |
| `/api/dashboard` | GET | KPIs do dashboard |
| `/api/avaliacoes` | GET, POST | Listar/criar avaliações |

---

## 8. Imagens

### Públicas (public/images/)
- **Liderança/**: 15 fotos de líderes
- **Galeria/**: 15 imagens
- **Cohabiano/**: 13 arquivos
- **Sarney/**: 10 imagens
- **NovoRenascer/**: 12 arquivos
- **Slide/**: 9 imagens
- **Programs/**: 4 imagens
- **Videos/**: 3 vídeos
- **Total estimado:** ~100+ imagens, ~10+ vídeos

---

## 9. Problemas Identificados

### Segurança
1. Credenciais admin hardcoded no código
2. API routes sem autenticação
3. NEXTAUTH_URL_SECRET com valor placeholder
4. TypeScript errors ignorados no build

### Arquitetura
5. Código CRA legado misturado com Next.js
6. CSS duplicado (index.css + globals.css)
7. Componente Card duplicado (JSX + TSX)
8. Depoimentos com dados de placeholder

### Dados
9. Todos os dados são hardcoded (não do banco)
10. Sem migração de dados do schema para o frontend
11. Sem conexão entre modelos DB e páginas públicas

### Funcionalidades Ausentes
12. Sem páginas de filiais no Next.js
13. Sem política de privacidade/LGPD
14. EmailJS não configurado (modo demo)
