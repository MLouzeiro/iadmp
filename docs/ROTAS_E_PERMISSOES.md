# Rotas e Permissões — IADMPMA

> Fase 1 (auditoria read-only). Inventário das rotas de API (~78) com autenticação, permissão e escopo. Base para o mapa de RBAC da v2.

---

## 1. Modelo de autorização

- **Sessão:** `requireAuth()` (lança `UNAUTHORIZED`) ou `getSessionUser()`.
- **SUPER_ADMIN:** `requireSuperAdmin()` (lança `FORBIDDEN` para outros).
- **Permissão fina:** `hasPermission(userId, modulo, acao)`.
  - Internamente faz `perms.includes(`${modulo.toLowerCase()}:${acao}`)` → **o módulo é case-insensitive**; a ação deve estar em minúsculas.
- **Escopo multi-tenant:**
  - `resolveOrgScope(user, organizacaoId)` → `SINGLE` / `MULTI` / `ALL`.
  - `resolveTargetOrgId(user, organizacaoId)` → valida organização-alvo.
  - `resolvePublicOrganizacaoId({ slug, organizacaoId })` → resolve organização **ativa e com site público**.
- **Erros padronizados:** `ORG_FORBIDDEN`, `ORG_REQUIRED`, `orgForbiddenResponse()`.

Padrão de camadas de uma rota autenticada:

```
requireAuth() → hasPermission(modulo, acao) → resolveOrgScope/resolveTargetOrgId → Prisma → writeAudit() (quando sensível)
```

---

## 2. Rotas públicas (`/api/public/**`) — sem sessão

| Rota | Método | Escopo | Descrição |
|---|---|---|---|
| `/api/public/church-info` | GET | org pública (slug/orgId) | Dados da igreja |
| `/api/public/footer-info` | GET | org pública | Rodapé |
| `/api/public/hero-stats` | GET | org pública | Números do hero |
| `/api/public/congregacoes` | GET | — | Lista organizações com slug/site |
| `/api/public/eventos` | GET | org pública | Eventos |
| `/api/public/eventos/[id]` | GET | org pública | Detalhe do evento |
| `/api/public/galeria` | GET | org pública | Galeria |
| `/api/public/lideranca` | GET | org pública | Liderança |
| `/api/public/pregacoes` | GET | org pública | Pregações |
| `/api/public/pregacoes/[slug]` | GET | org pública | Detalhe da pregação |
| `/api/public/avisos` | GET | org pública | Avisos |
| `/api/public/canais` | GET | org pública | Canais oficiais |
| `/api/public/versiculo` | GET | org pública | Versículo do dia |
| `/api/public/programacao` | GET | org pública | Programação |
| `/api/public/ministerios` | GET | org pública | Ministérios |
| `/api/public/banners` | GET | org pública | Banners |
| `/api/public/contato` | POST | org pública | Recebe mensagem de contato |

> Todas filtram por `ativo: true` e `sitePublico: true` (quando aplicável). Testes: `public-isolamento`, `public-site-*`.

---

## 3. Autenticação

| Rota | Métodos | Observação |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | Handlers do NextAuth |

---

## 4. Pessoas

| Rota | Métodos | Auth | Permissão |
|---|---|---|---|
| `/api/membros` | GET, POST | requireAuth | `membros:criar` (POST); GET por escopo |
| `/api/membros/[id]` | GET, PATCH, DELETE | requireAuth | `membros:editar`, `membros:excluir` |
| `/api/lideranca` | GET, POST | requireAuth | `lideranca:criar` |
| `/api/lideranca/[id]` | GET, PATCH, DELETE | requireAuth | `lideranca:editar`, `lideranca:excluir` |
| `/api/lideranca/indicadores` | GET | requireAuth | escopo |
| `/api/ministerios` | GET, POST | requireAuth | `ministerios:visualizar`, `ministerios:criar` |
| `/api/ministerios/[id]` | GET, PATCH, DELETE | requireAuth | `ministerios:editar`, `ministerios:excluir` |
| `/api/usuarios` | GET, POST | requireAuth | `usuarios:visualizar` / `usuarios:criar` + `canAssignRole` |
| `/api/usuarios/[id]` | GET, PATCH, DELETE | requireAuth | `usuarios:editar` + `canAssignRole` |
| `/api/usuarios/[id]/status` | PATCH | requireAuth | `usuarios:editar` |
| `/api/perfis` | GET | requireAuth | `usuarios:visualizar` |
| `/api/permissoes` | GET | requireAuth | `usuarios:visualizar` |
| `/api/organizacoes` | GET, POST | requireAuth + requireSuperAdmin | SUPER_ADMIN |
| `/api/organizacoes/[id]` | GET, PATCH, DELETE | requireAuth + org | escopo |

---

## 5. Operação

| Rota | Métodos | Auth | Permissão |
|---|---|---|---|
| `/api/eventos` | GET, POST | requireAuth | `eventos:criar` |
| `/api/eventos/[id]` | GET, PATCH, DELETE | requireAuth | `eventos:editar`, `eventos:excluir` |
| `/api/eventos/[id]/inscricoes` | GET, POST | requireAuth | `eventos:visualizar`, `eventos:criar` |
| `/api/eventos/[id]/inscricoes/[inscricaoId]` | PATCH, DELETE | requireAuth | `eventos:editar` |
| `/api/financeiro` | GET, POST | requireAuth | `financeiro:visualizar`, `financeiro:criar` |
| `/api/financeiro/[id]` | GET, PATCH, DELETE | requireAuth | `financeiro:editar`, `financeiro:excluir` |
| `/api/financeiro/categorias` | GET, POST | requireAuth | `financeiro:visualizar`, `financeiro:criar` |
| `/api/financeiro/categorias/[id]` | GET, PATCH, DELETE | requireAuth | `financeiro:editar` |
| `/api/avisos` | GET, POST | requireAuth | `avisos:criar` |
| `/api/avisos/[id]` | GET, PATCH, DELETE | requireAuth | `avisos:editar`, `avisos:excluir` |
| `/api/oportunidades` | GET, POST | requireAuth | `oportunidades:visualizar`, `oportunidades:criar` |
| `/api/oportunidades/[id]` | GET, PATCH, DELETE | requireAuth | `oportunidades:editar`, `oportunidades:excluir` |
| `/api/galeria` | GET, POST | requireAuth | `galeria:visualizar`, `galeria:criar` |
| `/api/galeria/[id]` | GET, PATCH, DELETE | requireAuth | `galeria:editar`, `galeria:excluir` |
| `/api/banners` | GET, POST | requireAuth | `banners:visualizar`, `banners:criar` |
| `/api/banners/[id]` | GET, PATCH, DELETE | requireAuth | `banners:editar`, `banners:excluir` |

---

## 6. Liturgia

| Rota | Métodos | Auth | Permissão |
|---|---|---|---|
| `/api/liturgia` | GET, POST | requireAuth | `liturgia:criar` |
| `/api/liturgia/[id]` | GET, PATCH, DELETE | requireAuth | `liturgia:editar`, `liturgia:excluir` |
| `/api/liturgia/[id]/duplicar` | POST | requireAuth | `liturgia:criar` |
| `/api/liturgia/[id]/status` | PATCH | requireAuth | `liturgia:criar`/`editar`/`iniciar_culto`/`finalizar_culto` |
| `/api/liturgia/[id]/modo-culto` | GET | requireAuth | escopo |
| `/api/liturgia/musicas` | GET, POST | requireAuth | `liturgia:gerenciar_musicas` |
| `/api/liturgia/musicas/[id]` | GET, PATCH, DELETE | requireAuth | `liturgia:gerenciar_musicas` |
| `/api/liturgia/modelos` | GET, POST | requireAuth | `liturgia:gerenciar_modelos` |
| `/api/liturgia/modelos/[id]` | GET, PATCH, DELETE | requireAuth | `liturgia:gerenciar_modelos` |

---

## 7. Comunicação e conteúdo

| Rota | Métodos | Auth | Permissão |
|---|---|---|---|
| `/api/comunicacao/dashboard` | GET | requireAuth | escopo |
| `/api/comunicacao/canais` | GET, POST | requireAuth | `comunicacao:gerenciar_canais` |
| `/api/comunicacao/canais/[id]` | GET, PATCH, DELETE | requireAuth | `comunicacao:gerenciar_canais`/`excluir` |
| `/api/comunicacao/pregacoes` | GET, POST | requireAuth | `pregacoes:criar` |
| `/api/comunicacao/pregacoes/[id]` | GET, PATCH, DELETE | requireAuth | `pregacoes:editar`, `pregacoes:excluir` |
| `/api/comunicacao/pregacoes/[id]/[action]` | POST | requireAuth | `pregacoes:publicar`/`editar`/`destacar` |
| `/api/admin/versiculos` | GET, POST | requireAuth | `comunicacao:criar` |
| `/api/admin/versiculos/[id]` | PATCH, DELETE | requireAuth | `comunicacao:editar`, `comunicacao:excluir` |
| `/api/publicacoes` | GET, POST | requireAuth + requireSuperAdmin | `comunicacao:visualizar` |
| `/api/publicacoes/[id]` | GET, PATCH, DELETE | requireAuth | fluxo de publicação/aprovação |
| `/api/pagina-publica` | GET, PUT | requireAuth + requireSuperAdmin | `configuracoes:editar`, escopo alvo |

---

## 8. Gestão, métricas e sistema

| Rota | Métodos | Auth | Permissão |
|---|---|---|---|
| `/api/dashboard` | GET | requireAuth | `dashboard:visualizar` |
| `/api/gestao/indicadores` | GET | requireAuth | `dashboard:visualizar` |
| `/api/gestao/auditoria` | GET | requireAuth | `usuarios:ver_auditoria` |
| `/api/indicadores/lideranca-detalhada` | GET | requireAuth | escopo (⚠️ 1 erro de tipo) |
| `/api/indicadores/comparativo-orgs` | GET | requireAuth + requireSuperAdmin | SUPER_ADMIN |
| `/api/configuracoes` | GET, PUT | requireAuth | `configuracoes:editar` |
| `/api/health` | GET | público | status do banco/env (sem valores) |
| `/api/seed` | GET, POST | requireSuperAdmin | SUPER_ADMIN |
| `/api/upload` | POST | requireAuth | exige `organizacaoId` |
| `/api/storage/monitoramento` | GET, PUT | requireAuth | `configuracoes:ver` |
| `/api/storage/limpeza` | GET | requireAuth | `configuracoes:ver` |
| `/api/storage/alertas/[id]` | PATCH | requireAuth | `configuracoes:editar` ou SUPER_ADMIN |

---

## 9. Middleware

- `src/middleware.ts` — matcher `['/admin/:path*']`.
- Verifica **apenas existência** do cookie `authjs.session-token`; não valida assinatura, role nem permissão.
- **Defesa em profundidade:** a autorização real está nas rotas/helpers. Recomenda-se reforçar o middleware na v2.

---

## 10. Auditoria por rota

- `writeAudit(...)` é chamado em 43 pontos (rotas sensíveis: criação/edição/exclusão/publicação).
- Campos sensíveis removidos automaticamente (`password`, `senha`, `hash`, `token`, `secret`, `authorization`, `cookie`, `jwt`).

---

## 11. Observações de RBAC

1. **`hasPermission` normaliza o módulo para minúsculas** — `'Usuarios'` funciona, mas o padrão documentado é minúsculo (`usuarios`).
2. **Ações especiais** existem além de CRUD: `iniciar_culto`, `finalizar_culto`, `gerenciar_musicas`, `gerenciar_modelos`, `gerenciar_canais`, `ver_auditoria`, `publicar`, `destacar`, `ver`.
3. **`requireSuperAdmin`** aparece em organizações, publicações, página pública, seed e comparativo de orgs.
4. **Rotas públicas** nunca exigem sessão, mas sempre resolvem organização ativa/site público.
