# Banco de Dados Atual — IADMPMA

> Fase 1 (auditoria read-only). Descreve `prisma/schema.prisma` como está hoje. **Nenhuma consulta ao banco de produção foi feita.**

---

## 1. Visão geral

- **SGBD:** PostgreSQL (Neon).
- **ORM:** Prisma Client `^5.22.0`.
- **Datasource:** `provider = "postgresql"` (URL em `DATABASE_URL`).
- **Generator:** `prisma-client-js` com `previewFeatures = ["driverAdapters"]`.
- **Modelos:** ~45 `model` + 9 `enum`.
- **Convenções:** IDs `cuid()`, `createdAt`/`updatedAt`, flags `ativo`/`status` (soft delete), índices por `organizacaoId`.

> ⚠️ `previewFeatures = ["driverAdapters"]` está habilitado, mas `src/lib/prisma.ts` **não usa adapter**. As dependências `@prisma/adapter-neon ^7.9.1` e `@neondatabase/serverless ^1.1.0` estão instaladas mas não são usadas — inconsistência a resolver.

---

## 2. Núcleo multi-tenant

### `Organizacao`
Entidade raiz de isolamento (igreja/congregação).
- `id`, `nome`, `slug` (único), `descricao`, `ativo`, `sitePublico`, `dominioPersonalizado`.
- Relações com praticamente todos os módulos (membros, eventos, financeiro, liturgia, galeria, banners, publicações etc.).
- `paginaPublica` (1:1 opcional).
- Índices: `[ativo]`, `[slug]`.

### `Congregacao`
Unidade subordinada a uma organização.
- `organizacaoId`, `nome`, `descricao`, `ativo`.
- Único por `[organizacaoId, nome]`.
- Relações com membros, liturgias, lideranças, eventos, campanhas, financeiro, avisos, galeria, oportunidades, agendas, inscrições, pagamentos.

### `UsuarioOrganizacao`
Vínculo usuário↔organização (com perfil).
- `userId`, `organizacaoId`, `perfilId?`, `ativo`.
- Único por `[userId, organizacaoId]`.

---

## 3. Autenticação, RBAC e auditoria

### `User`
- `id`, `name`, `email` (único), `passwordHash`, `role` (`enum Role`), `ativo`, timestamps.
- Relações com organizações, permissões diretas, auditoria, publicações (autor/publicador), aprovações (solicitante/aprovador), arquivos enviados.

### `enum Role`
`SUPER_ADMIN`, `ADMIN_IGREJA`, `PASTOR`, `LIDER`, `COORDENADOR`, `SECRETARIA`, `FINANCEIRO`, `EDITOR_SITE`, `MUSICO`, `MEMBER` (conforme hierarquia em `auth-helpers.ts`).

### `Perfil`, `Permissao`, `PerfilPermissao`, `UsuarioPermissao`
- RBAC por `modulo:acao`.
- Permissões podem vir do perfil ou serem atribuídas diretamente ao usuário.

### `AuditLog`
- `userId`, `organizacaoId?`, `acao`, `entidade`, `entidadeId?`, `antes`/`depois`/`detalhes` (JSON), `ip`, `userAgent`, `resultado` (`SUCESSO` etc.).
- Índices por organização, usuário, entidade e data.

### `Aprovacao`
- `organizacaoId`, `entidade`, `entidadeId`, `tipo`, `solicitanteId`, `aprovadorId?`, `status` (`StatusAprovacao`), `justificativa`, `observacoes`, `decididoEm`.

---

## 4. Pessoas e organização interna

| Modelo | Papel |
|---|---|
| `Membro` | Membros da igreja (`StatusMembro`) |
| `Ministerio` | Ministérios |
| `Departamento` | Departamentos |
| `Lideranca` | Lideranças (cargo, vigência) |
| `LiderancaHistorico` | Histórico de liderança |

---

## 5. Eventos e operação

| Modelo | Papel |
|---|---|
| `Evento` | Eventos (`StatusEvento`) |
| `CategoriaEvento` | Categorias de evento |
| `EventoParticipante` | Participantes |
| `TarefaEvento` | Tarefas do evento |
| `EventoOrganizador` | Organizadores |
| `Campanha` | Campanhas |
| `Inscricao` | Inscrições (`StatusInscricao`) |
| `Pagamento` | Pagamentos (`StatusPagamento`, `FormaPagamento`) |
| `Avaliacao` | Avaliações |
| `Agenda` | Agenda |

---

## 6. Liturgia

| Modelo | Papel |
|---|---|
| `Liturgia` | Programação de culto (`StatusLiturgia`) |
| `LiturgiaItem` | Momentos (`StatusMomento`) |
| `LiturgiaMusica` | Músicas |
| `LiturgiaModelo` | Modelos de liturgia |
| `LiturgiaModeloMomento` | Momentos do modelo |

---

## 7. Financeiro

| Modelo | Papel |
|---|---|
| `CategoriaFinanceira` | Categorias (`CategoriaLancamento`) |
| `EventoFinanceiro` | Lançamentos financeiros |
| `Campanha` | Campanhas de arrecadação |

> **Decisão de produto pendente:** escopo do financeiro (dízimos vs. eventos com campanha).

---

## 8. Comunicação e conteúdo

| Modelo | Papel |
|---|---|
| `Aviso` | Avisos |
| `GaleriaAlbum` / `GaleriaItem` | Galeria |
| `Oportunidade` | Oportunidades de serviço |
| `Banner` | Banners do site |
| `CanalOficial` | Canais (YouTube, etc.) |
| `Pregacao` | Pregações (`StatusPregacao`) |
| `VersiculoDiario` / `VersiculoHistorico` | Versículo do dia e histórico |
| `ContatoMensagem` | Mensagens do formulário de contato |
| `ConfiguracoesIgreja` | Configurações (tema, dados da igreja) |

---

## 9. CMS / publicação

### `PaginaPublica` (1:1 com Organizacao)
- `organizacaoId` (único), `conteudo` (JSON), e seções em JSON: hero, sobre, eventos, liderança, galeria, contato, pregações, pilares, ministérios, rodapé.
- **Base do editor de blocos** da v2.

### `Publicacao`
- `titulo`, `conteudo`, `tipo`, `autorId`, `status` (default `RASCUNHO`), `publicadoEm`, `publicadoPorId`.
- Relações: `autor`, `publicadoPor`, `destinos`.

### `PublicacaoOrganizacao`
- Destino de uma publicação por organização.
- `publicacaoId`, `organizacaoId`, `status` (default `PENDENTE`), `publicadoEm`, `publicadoPorId`, `erro`.
- Único por `[publicacaoId, organizacaoId]`.
- ⚠️ Observação técnica: há `publicadoPorId` mas **não há relação `publicadoPor`** neste modelo — algumas consultas da rota `/api/publicacoes/[id]` tentam incluir `publicadoPor` em `destinos` e falham na checagem de tipos.

---

## 10. Storage

| Modelo | Papel |
|---|---|
| `StoredFile` | Arquivo enviado (`organizacaoId`, `bucket`, `path`, `sizeBytes`, `contentType`, `etag`, `entityTipo/entityId`, `uploadedById`, `ativo`) — único por `[bucket, path]` |
| `StorageConfig` | Configuração de limites por organização |
| `StorageMeasurement` | Medições de uso |
| `StorageAlert` | Alertas de uso (70/85/95%) |

---

## 11. Migração multi-tenant

- `prisma/migrate-tenant.js` — script **idempotente e não destrutivo**: cria colunas, popula `congregacaoId`, adiciona FKs/índices.
- **Regra do projeto:** não editar SQL de migrations à mão; usar `npm run db:push` / `npx prisma migrate dev`.

---

## 12. Seeds

- `prisma/seed.js`:
  - Cria módulos/permissões, perfis, `SUPER_ADMIN` e `ConfiguracoesIgreja`.
  - Cria/atualiza organização principal com slug **`iadmp-central`** (linha ~155).
  - Gera slug via `slugify()` quando ausente.
- ✅ **Verificado (branch `v2-dev`, cópia de produção):** existem 3 organizações ativas — `iadmp-sede`, `iadmp-vilasarney`, `iadmp-central`. A home (`iadmp-sede`) resolve. O hardcode continua sendo frágil e deve ser removido na v2.

---

## 13. Observações e riscos de banco

1. **Cliente Prisma vs. schema:** o código gerado contém `publicadoPor`/`destinos`, mas a rota de publicações usa includes inválidos em alguns pontos (ver erros de tipo). Rodar `npx prisma generate` e corrigir os includes.
2. **Adapter Neon:** habilitado no schema, não usado no client.
3. **Soft delete:** preferir flags (`ativo`, `status`) — já é o padrão.
4. **Sem acesso a produção nesta fase:** não foi possível confirmar slugs, contagens ou integridade real dos dados.
