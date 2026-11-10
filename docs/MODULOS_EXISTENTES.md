# Módulos Existentes — IADMPMA

> Fase 1 (auditoria read-only). Inventário dos módulos do painel, do site público e das capacidades por trás deles.

---

## 1. Painel administrativo (`src/app/admin/**`)

Todas as páginas são `'use client'` e consomem a API com `fetch` + `useState/useEffect`. A navegação fica em `src/app/admin/layout.tsx`.

### 1.1 Visão / Gestão
| Módulo | Página | APIs principais | Estado |
|---|---|---|---|
| Dashboard | `admin/page.tsx` | `/api/dashboard` | Funcional |
| Gestão | `admin/gestao/page.tsx` | `/api/gestao/indicadores`, `/api/gestao/auditoria` | Funcional (RBAC: `dashboard:visualizar`, `usuarios:ver_auditoria`) |
| Relatórios | `admin/relatorios/page.tsx` | indicadores/comparativo | Funcional com 1 erro de tipo (`"default"` em Button) |
| Indicadores | — | `/api/indicadores/lideranca-detalhada`, `/api/indicadores/comparativo-orgs` | Funcional com 1 erro de tipo |

### 1.2 Pessoas
| Módulo | Página | APIs | Observações |
|---|---|---|---|
| Membros | `admin/membros/page.tsx` | `/api/membros`, `/api/membros/[id]` | Multi-tenant, auditado |
| Liderança | `admin/lideranca/page.tsx` | `/api/lideranca`, `/api/lideranca/[id]`, `/api/lideranca/indicadores` | Multi-tenant |
| Ministérios | `admin/ministerios/page.tsx` | `/api/ministerios`, `/api/ministerios/[id]` | Testado |
| Usuários | `admin/usuarios/page.tsx` + `novo` + `[id]/editar` | `/api/usuarios`, `/api/usuarios/[id]`, `/api/usuarios/[id]/status` | RBAC forte (`canAssignRole`) |
| Perfis / Permissões | (via usuarios) | `/api/perfis`, `/api/permissoes` | RBAC |
| Organizações | `admin/organizacoes/page.tsx` + `[id]` | `/api/organizacoes`, `/api/organizacoes/[id]` | Multi-tenant |

### 1.3 Operação
| Módulo | Página | APIs | Observações |
|---|---|---|---|
| Eventos | `admin/eventos/page.tsx` | `/api/eventos`, `/api/eventos/[id]`, inscrições | Testado (isolamento + inscrição pública) |
| Liturgia | `admin/liturgia/page.tsx`, `nova`, `[id]`, `[id]/editar`, `[id]/imprimir`, `[id]/modo-culto`, `musicas`, `modelos` | `/api/liturgia/**` (programações, músicas, modelos, duplicar, status, modo-culto) | Módulo rico |
| Financeiro | `admin/financeiro/page.tsx` | `/api/financeiro`, `/api/financeiro/[id]`, `/api/financeiro/categorias` | Categorias e lançamentos |
| Avisos | `admin/avisos/page.tsx` | `/api/avisos`, `/api/avisos/[id]` | — |
| Oportunidades | `admin/oportunidades/page.tsx` | `/api/oportunidades`, `/api/oportunidades/[id]` | — |
| Galeria | `admin/galeria/page.tsx` | `/api/galeria`, `/api/galeria/[id]` | Álbuns + itens (Storage) |
| Banners | `admin/banners/page.tsx` | `/api/banners`, `/api/banners/[id]` | Testado |

### 1.4 Comunicação e conteúdo
| Módulo | Página | APIs | Observações |
|---|---|---|---|
| Comunicação (dashboard) | `admin/comunicacao/page.tsx` | `/api/comunicacao/dashboard` | — |
| Canais oficiais | `admin/comunicacao/canais/page.tsx` | `/api/comunicacao/canais`, `[id]` | — |
| Pregações | `admin/comunicacao/pregacoes/page.tsx`, `nova`, `[id]`, `[id]/editar` | `/api/comunicacao/pregacoes`, `[id]`, `[id]/[action]` | Fluxo de status |
| Versículos | `admin/comunicacao/versiculos/page.tsx` | `/api/admin/versiculos`, `[id]` | Versículo do dia |
| Publicações (CMS) | `admin/publicacoes/page.tsx` | `/api/publicacoes`, `/api/publicacoes/[id]` | **8 erros de tipo — prioridade de correção** |

### 1.5 Sistema
| Módulo | Página | APIs | Observações |
|---|---|---|---|
| Armazenamento | `admin/armazenamento/page.tsx` | `/api/storage/monitoramento`, `/api/storage/limpeza`, `/api/storage/alertas/[id]` | Limites de uso e alertas |
| Configurações | `admin/configuracoes/page.tsx`, `aparencia`, `site` | `/api/configuracoes`, `/api/pagina-publica` | Tema + site |
| Login | `admin/login/page.tsx` | next-auth | `pages.signIn` |

---

## 2. Site público (`src/app/**`, fora de `/admin`)

| Rota | Arquivo | Conteúdo |
|---|---|---|
| `/` | `src/app/page.tsx` | Home do portal (slug `iadmp-sede` hardcoded) |
| `/sobre` | `src/app/sobre/page.tsx` | Sobre a igreja |
| `/contato` | `src/app/contato/page.tsx` | Contato (form → `/api/public/contato`) |
| `/eventos` | `src/app/eventos/page.tsx` | Lista de eventos |
| `/eventos/[id]` | `src/app/eventos/[id]/page.tsx` | Detalhe + inscrição |
| `/galeria` | `src/app/galeria/page.tsx` | Galeria |
| `/lideranca` | `src/app/lideranca/page.tsx` | Liderança |
| `/pregacoes` | `src/app/pregacoes/page.tsx` | Pregações |
| `/pregacoes/[slug]` | `src/app/pregacoes/[slug]/page.tsx` | Detalhe da pregação |
| `/igreja/[slug]` | `src/app/igreja/[slug]/page.tsx` | Portal da congregação |
| `/igreja/[slug]/contato` | idem | Contato da congregação |
| `/igreja/[slug]/eventos` | idem | Eventos da congregação |
| `/igreja/[slug]/galeria` | idem | Galeria da congregação |
| `/igreja/[slug]/lideranca` | idem | Liderança da congregação |
| `/igreja/[slug]/pregacoes` | idem | Pregações da congregação |

---

## 3. Componentes reutilizáveis

### UI (`src/components/ui/`)
Button, Card, Input, Select, Textarea, Checkbox, SearchBar, FormCard, FormGrid, SectionHead, **Modal**, Badge, entre outros.

### Layout público (`src/components/layout/`)
Navbar, Footer.

### Seções públicas (`src/components/public/`)
EventosSection, PregacoesSection, ChurchInfo, VerseOfTheDay, CanaisSection, CongregacoesPublicas, BannerCarousel, ProgramacaoPublica, MinisteriosSection, EventosAvisosSection, HeaderSite (em `public/site/`).

### Tema (`src/components/theme/`)
ThemeProvider, ClientLayout.

---

## 4. Bibliotecas internas (`src/lib/`)

| Arquivo | Responsabilidade |
|---|---|
| `auth.ts` | Configuração next-auth |
| `auth-helpers.ts` | Sessão, RBAC, hierarquia de roles |
| `tenant.ts` | Escopo multi-tenant e resolução pública |
| `audit.ts` | Registro em `AuditLog` + sanitização |
| `storage.ts` | Regras de upload e monitoramento |
| `supabase.ts` | Client Supabase |
| `prisma.ts` | Instância Prisma (sem adapter) |
| `validations.ts` | Schemas Zod |
| `indicadores.ts`, `datas.ts`, `pix.ts`, `qrcode.ts`, `versiculos-temas.ts` | Utilitários de domínio |

> `pix.ts` e `qrcode.ts` sugerem suporte a pagamentos/inscrições (modelos `Pagamento`, `Inscricao`).

---

## 5. Cobertura de testes por área

- **API:** auditoria, banners, gestão, health, IDOR, isolamento (eventos/membros), liderança, ministérios, módulos admin, public (congregações/eventos/galeria/pregões/isolamento/site dinâmico), rotas protegidas, storage, usuários escopo.
- **Lib:** datas, indicadores, pix, qrcode, storage, tenant, validations, versículos-temas.
- **Total:** 28 suítes / 387 testes passando.

---

## 6. Lacunas / oportunidades para a v2

1. **Publicações (CMS):** corrigir tipos e consolidar fluxo editorial (rascunho → aprovação → publicação por organização).
2. **Conteúdo institucional:** tirar de `site-data.ts` para o CMS (`PaginaPublica`/configurações).
3. **Home:** remover `slugPortal` hardcoded.
4. **Site público:** migrar para Server Components/ISR.
5. **Financeiro:** escopo ainda em aberto (dízimos vs. eventos com campanha) — decisão de produto pendente.
6. **Multi-igreja:** manter multi-tenant ou simplificar — decisão de produto pendente.
