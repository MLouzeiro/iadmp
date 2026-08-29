# Diagnóstico Completo — IADMPMA

**Data:** 29/08/2026

---

## 1. Projeto

| Item | Valor |
|---|---|
| Nome | `iadmpma` (admpma) |
| Versão | 1.0.0 |
| Framework | **Next.js 16.3.2** (App Router) |
| React | **19.2.8** |
| TypeScript | **7.0.2** |
| ORM | **Prisma 5.22.0** |
| Auth | **NextAuth 5.0.0-beta.32** |
| Validação | **Zod 4.4.3** |
| Ícones | **lucide-react 1.33.0** |
| Deploy | **Vercel** |
| Banco | **PostgreSQL (Neon)** |
| CSS | **CSS puro + variáveis CSS** |
| Fonte | **Montserrat + Playfair Display** (Google Fonts) |

---

## 2. Banco de Dados

| Item | Status |
|---|---|
| Provider | PostgreSQL (Neon Serverless) |
| Conexão | **FUNCIONANDO** |
| Prisma Sync | **SINCRONIZADO** (schema = banco) |
| Tabelas criadas | **21 tabelas** |
| Dados existentes | Sim (seed executado) |

**String de conexão:** Neon PostgreSQL (ep-dark-math-ahrjmyg9-pooler) — NÃO é Supabase.

---

## 3. Supabase

| Item | Status |
|---|---|
| Supabase URL | **NÃO** |
| Chave pública | **NÃO** |
| Cliente Supabase | **NÃO** |
| Banco conectado | **NÃO** (usa Neon) |
| Auth via Supabase | **NÃO** (usa NextAuth) |
| Storage via Supabase | **NÃO** |

**Conclusão:** O projeto **NÃO utiliza Supabase**. Utiliza Neon PostgreSQL como banco de dados e NextAuth para autenticação.

---

## 4. Tabelas — Schema vs Banco

| Tabela | Schema Prisma | Existe no Banco | Dados | Observação |
|---|---|---|---|---|
| User | SIM | SIM | 1 (admin) | Admin: admin@iadmp.com.br |
| Membro | SIM | SIM | 0 | Sem membros cadastrados |
| Ministerio | SIM | SIM | 6 | Seed: Ministerio da Promessa, Jovens, Crianças, Heroinas, Varões, Círculo |
| Departamento | SIM | SIM | 4 | Seed: Louvor, Mídia, Recepção, Infantil |
| Lideranca | SIM | SIM | 14 | Seed: todos os líderes da igreja |
| Evento | SIM | SIM | 5 | Seed: Festa Junina, Congresso, Páscoa, Retiro |
| CategoriaEvento | SIM | SIM | 5 | Seed: Culto, Congresso, Retiro, Festa, Ensaio |
| EventoParticipante | SIM | SIM | 0 | Vazio |
| TarefaEvento | SIM | SIM | 0 | Vazio |
| Campanha | SIM | SIM | 0 | Vazio |
| CategoriaFinanceira | SIM | SIM | 0 | Vazio |
| EventoFinanceiro | SIM | SIM | 0 | Vazio |
| Avaliacao | SIM | SIM | 0 | Vazio |
| Liturgia | SIM | SIM | 0 | Vazio |
| LiturgiaItem | SIM | SIM | 0 | Vazio |
| Agenda | SIM | SIM | 0 | Vazio |
| Aviso | SIM | SIM | 1 | Seed: "Bem-vindos ao novo site!" |
| GaleriaAlbum | SIM | SIM | 0 | Vazio |
| GaleriaItem | SIM | SIM | 0 | Vazio |
| Oportunidade | SIM | SIM | 0 | Vazio |
| ConfiguracoesIgreja | SIM | SIM | 1 | Config padrão com cores da logo |

**Total:** 21 tabelas definidas → 21 tabelas existentes → **100% sincronizado**

---

## 5. Autenticação

| Item | Status |
|---|---|
| Provider | NextAuth v5 (beta) |
| Método | Credentials (email + senha) |
| Senha | bcryptjs |
| Session | JWT |
| Login | `/admin/login` |
| Middleware | Protege `/admin/*` |
| Secret | Definido (NEXTAUTH_SECRET) |

### Roles definidas:
```
ADMIN, PASTOR, SECRETARIA, FINANCEIRO, LIDER_MINISTERIO, EDITOR_SITE, MEMBER
```

### Usuários:
| Email | Role | Status |
|---|---|---|
| admin@iadmp.com.br | ADMIN | Ativo (senha: admin123) |

### Problemas de segurança identificados:
1. API routes **NÃO protegidas** — qualquer pessoa pode criar/deletar dados via API
2. Middleware **só verifica cookie**, não verifica role
3. Senha admin **hardcoded** no seed (admin123)
4. NEXTAUTH_SECRET **fraco** para produção
5. Sem rate limiting no login

---

## 6. Painel Administrativo

| Rota | Status | Funcionalidade |
|---|---|---|
| `/admin` | **Implementado** | Dashboard com KPIs (membros, líderes, eventos, avisos) |
| `/admin/login` | **Implementado** | Formulário de login funcional |
| `/admin/membros` | **Implementado** | CRUD completo (listar, criar, excluir) |
| `/admin/lideranca` | **Implementado** | CRUD completo (listar, criar, excluir) |
| `/admin/eventos` | **Implementado** | CRUD completo (listar, criar, excluir) |
| `/admin/financeiro` | **Placeholder** | Apenas KPIs zerados, "módulo em desenvolvimento" |
| `/admin/liturgia` | **Placeholder** | "Módulo em desenvolvimento" |
| `/admin/avisos` | **Placeholder** | "Módulo em desenvolvimento" |
| `/admin/galeria` | **Placeholder** | "Módulo em desenvolvimento" |
| `/admin/oportunidades` | **Placeholder** | "Módulo em desenvolvimento" |
| `/admin/configuracoes` | **Placeholder** | "Módulo em desenvolvimento" |
| `/admin/configuracoes/aparencia` | **Implementado** | Editor de cores, paletas, preview em tempo real |

### Sidebar do Admin:
- Dashboard, Membros, Liderança, Eventos, Financeiro, Liturgia, Avisos, Galeria, Oportunidades, Configurações (Geral + Aparência)

---

## 7. APIs Implementadas

| Rota | Método | Status | Protegida? |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | **Funcional** | Sim (NextAuth) |
| `/api/health` | GET | **Funcional** | **NÃO** |
| `/api/seed` | GET/POST | **Funcional** | **NÃO** |
| `/api/dashboard` | GET | **Funcional** | **NÃO** |
| `/api/membros` | GET/POST | **Funcional** | **NÃO** |
| `/api/membros/[id]` | GET/PUT/DELETE | **Funcional** | **NÃO** |
| `/api/lideranca` | GET/POST | **Funcional** | **NÃO** |
| `/api/lideranca/[id]` | GET/PUT/DELETE | **Funcional** | **NÃO** |
| `/api/eventos` | GET/POST | **Funcional** | **NÃO** |
| `/api/eventos/[id]` | GET/PUT/DELETE | **Funcional** | **NÃO** |
| `/api/avisos` | GET/POST | **Funcional** | **NÃO** |
| `/api/configuracoes` | GET/PUT | **Funcional** | **NÃO** |

**Problema crítico:** Nenhuma API route está protegida por autenticação. Qualquer pessoa pode acessar, criar, modificar ou deletar dados.

---

## 8. Site Público

| Página | Rota | Status | Fonte dos Dados |
|---|---|---|---|
| Home | `/` | **Implementada** | Dados estáticos (site-data.ts) |
| Sobre | `/sobre` | **Implementada** | Dados estáticos |
| Eventos | `/eventos` | **Placeholder** | "Em breve" (não busca do banco) |
| Galeria | `/galeria` | **Implementada** | Dados estáticos (15 imagens) |
| Liderança | `/lideranca` | **Implementada** | Dados estáticos (14 líderes) |
| Contato | `/contato` | **Implementada** | Dados estáticos |

### Componentes:
- **Navbar:** Fixa, com logo, links, toggle tema (dark/light), menu mobile
- **Footer:** Grid 4 colunas (brand, links, congregações, contato)
- **ThemeProvider:** Busca config de cores da API, aplica variáveis CSS em tempo real

### Conteúdo da Home:
1. Hero com imagem de fundo
2. Versículo do dia (rotação diária de 32 versículos)
3. Programação semanal (4 programações)
4. Congregações (3: Cohabiano, Vila Sarney, Novo Renascer)
5. Valores (4: Adoração, Comunhão, Obediência, Transformação)
6. Liderança (preview dos 4 primeiros)

### Dados estáticos vs Banco:
O site público **NÃO busca dados do banco**. Usa `site-data.ts` com dados hardcoded. Exceção: o ThemeProvider busca `/api/configuracoes`.

---

## 9. Funcionalidades do iadmp-sistemas que podem ser aproveitadas

| Funcionalidade | Relevância | Observação |
|---|---|---|
| Cadastro de Igrejas (sede/filiais) | ALTA | Modelo hierárquico IGREJA → CONGREGAÇÃO |
| Cadastro de Famílias | MÉDIA | Não existe no iadmpma |
| Sistema de Inscrições em Eventos | ALTA | Check-in, vagas limite |
| ContaFinanceira (saldo por conta) | ALTA | Modelo mais completo que o atual |
| LancamentoFinanceiro | ALTA | CRUD funcional com categorias |
| RBAC detalhado por rota | ALTA | Middleware de permissão por role |
| Importação de membros | MÉDIA | Funcionalidade de importação |
| Carteirinha de membro | BAIXA | Geração de PDF |

---

## 10. Conteúdos do website que podem ser aproveitados

| Conteúdo | Disponível | Observação |
|---|---|---|
| Fotos da igreja | SIM | Galeria de imagens |
| História | PARCIAL | Textos sobre a igreja |
| Liderança | SIM | Nomes, cargos, fotos |
| Identidade visual | SIM | Logo, cores, fontes |
| Versículos diários | SIM | 32 versículos com reflexões |
| Congregações | SIM | 3 congregações com fotos |
| Programação | SIM | 4 cultos semanais |

---

## 11. Pendências Críticas

### Segurança (URGENTE)
- [ ] Proteger todas as API routes com autenticação
- [ ] Implementar verificação de role no middleware
- [ ] Adicionar rate limiting no login
- [ ] Usar secret seguro para produção
- [ ] Remover admin hardcoded do seed

### Funcionalidades Incompletas
- [ ] **Eventos:** Página pública mostra "Em breve" — precisa buscar do banco
- [ ] **Financeiro:** Módulo placeholder — precisa implementar CRUD
- [ ] **Liturgia:** Módulo placeholder — precisa implementar CRUD
- [ ] **Avisos:** Módulo placeholder — precisa implementar CRUD + integração com site
- [ ] **Galeria:** Módulo placeholder — precisa implementar upload + gestão
- [ ] **Oportunidades:** Módulo placeholder
- [ ] **Configurações:** Módulo placeholder (exceto Aparência)
- [ ] **Agenda:** Tabela existe mas sem UI

### Integração Site ↔ Banco
- [ ] Home deve buscar dados do banco (membros, eventos, avisos)
- [ ] Eventos devem ser listados do banco
- [ ] Avisos devem aparecer no site
- [ ] Galeria deve usar dados do banco
- [ ] Liderança pode ser buscada do banco

### Migração de Dados
- [ ] Unificar schema do iadmpma com iadmp-sistemas
- [ ] Adicionar tabelas: Igreja, Familia, Inscricao, ContaFinanceira
- [ ] Migrar dados do website existente
- [ ] Migrar dados do iadmp-sistemas

---

## 12. Próximas Etapas Recomendadas

### Fase 1 — Segurança (IMEDIATO)
1. Proteger todas as API routes com NextAuth
2. Implementar middleware de verificação de role
3. Gerar secret seguro para produção

### Fase 2 — Integração Site ↔ Banco
1. Home buscar dados do banco (via Server Components)
2. Eventos listados do banco
3. Avisos integrados ao site
4. Galeria usando banco

### Fase 3 — Módulos Incompletos
1. Financeiro (CRUD completo)
2. Liturgia (CRUD completo)
3. Avisos (CRUD + integração site)
4. Galeria (upload + gestão)
5. Agenda

### Fase 4 — Unificação
1. Adicionar tabelas do iadmp-sistemas
2. Migrar dados
3. RBAC detalhado

---

## Resumo Executivo

| Aspecto | Estado |
|---|---|
| **Banco** | Funcionando (Neon PostgreSQL, 21 tabelas) |
| **Supabase** | NÃO utilizado |
| **Auth** | Funcional (NextAuth v5, mas sem proteção de API) |
| **Admin** | Parcialmente implementado (3 módulos CRUD, 6 placeholders) |
| **Site público** | Parcialmente implementado (dados estáticos, não busca do banco) |
| **APIs** | 12 rotas implementadas, **NENHUMA protegida** |
| **Segurança** | CRÍTICA — precisa implementar urgente |
| **Próxima ação** | Proteger APIs → Integrar site com banco → Completar módulos |
