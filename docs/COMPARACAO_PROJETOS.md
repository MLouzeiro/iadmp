# Comparação dos Projetos — Website vs IADMP-Sistemas

**Data:** 26/08/2026

---

## 1. Tecnologia

| Recurso | Website | IADMP-Sistemas | Conflito? |
|---|---|---|---|
| Framework | Next.js 16 (App Router) | Vite + Express (separado) | SIM |
| React | 19.2.8 | 18.3.1 | SIM (versões diferentes) |
| TypeScript | 7.0.2 | 5.3.3 | SIM |
| CSS | CSS puro + variáveis | CSS puro + variáveis | NÃO |
| Tailwind | Não | Não | OK |
| ORM | Prisma 5.22.0 | Prisma 5.10.0 | Leve |
| Banco | PostgreSQL (Neon) | PostgreSQL (puro) | Compatível |
| Auth | NextAuth v5 beta | JWT customizado | SIM |
| Testes | Não | Jest + supertest | SIM |

---

## 2. Funcionalidades

| Funcionalidade | Website | IADMP-Sistemas | Decisão |
|---|---|---|---|
| **Página pública** | 6 páginas (Home, Sobre, Galeria, Liderança, Inscrição, Contato) | 1 LandingPage | Reaproveitar website |
| **Versículo diário** | 31 versículos + WhatsApp | Não existe | Manter do website |
| **Reflexão diária** | Incluída no versículo | Não existe | Manter do website |
| **Dark/Light theme** | Implementado | Não existe | Manter do website |
| **Hero com vídeo** | VideoEntrada (auto-play) | Hero (estático) | Modernizar |
| **Programas** | 4 programas semanais | 4 programas (hardcoded) | Unificar dados |
| **Congregações** | 3 congregações | 3 congregações | Unificar |
| **Liderança** | 14 líderes com fotos | 11 líderes | Unificar |
| **FAQ** | 8 FAQs | 6 FAQs | Unificar |
| **Depoimentos** | 5 depoimentos (placeholder) | Não existe | Avaliar |
| **Inscrição/Cadastro** | Formulário EmailJS | LoginModal | Adaptar |
| **Galeria** | 15 imagens estáticas | Não existe | Reaproveitar website |
| **Contato** | Email, Messenger, WhatsApp | Não existe | Reaproveitar website |

---

## 3. Admin/Gestão

| Funcionalidade | Website | IADMP-Sistemas | Decisão |
|---|---|---|---|
| **Dashboard** | KPIs (eventos, arrecadação) | Stats (igrejas, membros) | Unificar |
| **Login** | NextAuth (credentials) | JWT customizado | Unificar (NextAuth) |
| **Membros** | Schema existe, sem UI admin | CRUD completo com API | Reaproveitar lógica |
| **Liderança** | Schema existe, sem UI admin | Listagem no admin | Adaptar |
| **Eventos** | CRUD completo | Schema existe, sem código | Reaproveitar website |
| **Avaliações** | Sistema completo (estrelas) | Não existe | Reaproveitar website |
| **Financeiro** | Schema existe, sem código | Schema existe, sem código | Criar |
| **Liturgia** | Schema existe, sem código | Não existe | Criar |
| **Avisos** | Schema existe, sem código | Diretório vazio | Criar |
| **Galeria admin** | Schema existe, sem código | Não existe | Criar |
| **Congregações** | Listagem hardcoded | CRUD completo com hierarquia | Reaproveitar lógica |
| **Agenda** | Schema existe, sem código | Não existe | Criar |
| **Oportunidades** | Schema existe, sem código | Não existe | Criar |
| **Importação CSV** | Não existe | Implementado | Reaproveitar |
| **PDF (carteirinha)** | Não existe | Implementado | Reaproveitar |
| **Testes** | Não | 18 testes | Reaproveitar |

---

## 4. Banco de Dados

| Aspecto | Website | IADMP-Sistemas |
|---|---|---|
| ORM | Prisma 5.22 | Prisma 5.10 |
| Provider | PostgreSQL (Neon/Vercel) | PostgreSQL |
| Modelos | 15+ | 9 |
| Migrações | db push | 1 migração SQL |
| Seed | Sim | Sim |

### Modelos Comuns (ambos têm)
- Evento
- Membro
- CategoriaFinanceira

### Modelos Exclusivos do Website
- User (com roles detalhadas)
- Ministerio
- Departamento
- Lideranca (com ordem de exibição)
- CategoriaEvento
- EventoParticipante
- TarefaEvento
- Campanha
- EventoFinanceiro
- Avaliacao
- Liturgia / LiturgiaItem
- Agenda
- Aviso
- GaleriaAlbum / GaleriaItem
- Oportunidade

### Modelos Exclusivos do IADMP-Sistemas
- Igreja (com hierarquia sede/filiais)
- Familia
- Inscricao (com check-in)
- ContaFinanceira
- LancamentoFinanceiro
- Usuario (com roles diferentes)

---

## 5. Autenticação

| Aspecto | Website | IADMP-Sistemas |
|---|---|---|
| Solução | NextAuth v5 beta | JWT customizado |
| Provider | Credentials | Credentials |
| Session | JWT | JWT |
| Roles | 7 roles | 5 roles |
| Proteção | Middleware Next.js | Middleware Express |
| Cadastro | Formulário EmailJS | API /auth/register |
| Recuperação senha | Não | Não |

---

## 6. Conflitos Principais

1. **Framework:** Next.js vs Vite+Express —完全不同 stack
2. **React:** v19 vs v18
3. **Auth:** NextAuth vs JWT customizado
4. **Estrutura:** Monolito Next.js vs Front/Backend separados
5. **Roles:** Nomenclatura diferente (ADMIN vs ADMIN_GERAL, etc.)
6. **Dados:** Hardcoded vs API-backed

---

## 7. O que pode ser reaproveitado de cada

### Do Website
- Layout e design das páginas públicas
- Versículo e reflexão diária
- Tema dark/light
- Galeria de imagens
- Conteúdo de líderes
- Programas semanais
- Depoimentos
- CSS design system
- Componentes de UI (Card, SectionHead, Navbar, Footer)

### Do IADMP-Sistemas
- Lógica de Auth (JWT, middleware, RBAC)
- CRUD de Membros (com paginação, filtros, soft-delete)
- CRUD de Congregações (com hierarquia sede/filiais)
- Importação CSV de membros
- Geração de PDF (carteirinha)
- Testes de integração
- Validações Zod
- Schema do banco (modelos simplificados)
- Seed com dados realistas
