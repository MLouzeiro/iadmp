# Banco de Dados Atual

**Data:** 26/08/2026

---

## Visão Geral

Existem DOIS bancos de dados separados, um para cada projeto:

| Projeto | Provider | ORM | Status |
|---|---|---|---|
| Website | PostgreSQL (Neon/Vercel Postgres) | Prisma 5.22 | Em uso |
| IADMP-Sistemas | PostgreSQL | Prisma 5.10 | Em uso |

**Não existe Supabase em nenhum dos dois projetos.**

---

## Schema do Website (15+ modelos)

### User
- **Finalidade:** Autenticação de usuários do painel
- **Campos:** id, name, email (unique), passwordHash, role (enum), ativo, createdAt, updatedAt
- **Roles:** ADMIN, PASTOR, SECRETARIA, FINANCEIRO, LIDER_MINISTERIO, EDITOR_SITE, MEMBER
- **Relacionamentos:** has many avaliacoes, has one membro

### Membro
- **Finalidade:** Cadastro de membros da igreja
- **Campos:** id, nome, email, telefone, whatsapp, dataNascimento, endereco, foto, dataEntrada, status, observacoes, congregacao, userId, ministerioId, departamentoId
- **Status:** ATIVO, INATIVO, TRANSFERIDO, FALECIDO
- **Relacionamentos:** belongs to Ministerio, Departamento, User; has many lideranca

### Ministerio
- **Finalidade:** Ministérios da igreja
- **Campos:** id, nome, descricao, responsavel, ativo, createdAt, updatedAt
- **Relacionamentos:** has many membros, lideranca

### Departamento
- **Finalidade:** Departamentos da igreja
- **Campos:** id, nome, descricao, responsavel, ativo, createdAt, updatedAt
- **Relacionamentos:** has many membros

### Lideranca
- **Finalidade:** Liderança com ordem de exibição pública
- **Campos:** id, nome, cargo, foto, biografia, ordemExibicao, publico, ativo, dataInicio, dataFim, membroId, ministerioId
- **Relacionamentos:** belongs to Membro, Ministerio

### Evento
- **Finalidade:** Eventos da igreja
- **Campos:** id, nome, categoriaId, dataInicio, dataEvento, dataFim, tema, preletores[], diasDuracao, status, observacoes, local, responsavelGeral, publicarNoSite, orcamentoPrevisto, totalDespesas, totalReceitas
- **Status:** PLANEJADO, EM_ANDAMENTO, CONCLUIDO, CANCELADO
- **Relacionamentos:** belongs to CategoriaEvento; has many participantes, financeiro, liturgias, galeriaItems, agenda, tarefas; has one campanha, avaliacao

### CategoriaEvento
- **Finalidade:** Categorias de eventos
- **Campos:** id, nome, descricao, cor, ativo

### EventoParticipante
- **Finalidade:** Participantes de eventos
- **Campos:** id, nome, email, telefone, funcaoParticipante, observacoes, eventoId

### TarefaEvento
- **Finalidade:** Tarefas/checklist de eventos
- **Campos:** id, titulo, descricao, responsavel, prazo, concluida, eventoId

### Campanha
- **Finalidade:** Campanhas de arrecadação vinculadas a eventos
- **Campos:** id, eventoId (unique), meta, valorArrecadado, dataInicio, dataFim, descricao

### CategoriaFinanceira
- **Finalidade:** Categorias de entradas/saídas
- **Campos:** id, nome, genero (tipo), descricao, ativo

### EventoFinanceiro
- **Finalidade:** Movimentações financeiras de eventos
- **Campos:** id, descricao, valor, quando, generoMovimentacao, fornecedor, comprovante, responsavel, observacoes, eventoId, categoriaFinanceiraId

### Avaliacao
- **Finalidade:** Avaliações pós-evento
- **Campos:** id, eventoId (unique), notaEquipe, observacoesEquipe, presencaEstimada, planejamentoDiasAntes, metaAtingidaPercent, sugestoesAutomaticas[], userId

### Liturgia / LiturgiaItem
- **Finalidade:** Programação de cultos
- **Campos Liturgia:** id, quando, horario, dirigente, pregador, tema, observacoes, eventoId
- **Campos LiturgiaItem:** id, ordem, titulo, responsavel, horarioPrevisto, duracao, observacao, liturgiaId

### Agenda
- **Finalidade:** Agenda de eventos/reuniões
- **Campos:** id, titulo, descricao, comeco, termino, horario, local, recorrente, recorrencia, eventoId

### Aviso
- **Finalidade:** Avisos públicos
- **Campos:** id, titulo, descricao, imagem, categoria, comecaEm, terminaEm, urgencia, situacaoAviso, publicoAlvo, publicarSite, mostrarPainel, destaque

### GaleriaAlbum / GaleriaItem
- **Finalidade:** Galeria de fotos
- **Campos Album:** id, nome, descricao, capa, momentoAlbum, publico
- **Campos Item:** id, titulo, descricao, url, classArquivo, ordem, momentoItem, albumId, eventoId

### Oportunidade
- **Finalidade:** Oportunidades de voluntariado
- **Campos:** id, titulo, descricao, generoOportunidade, responsavel, prazo, vagas, abrirOportunidade, observacoes

---

## Schema do IADMP-Sistemas (9 modelos)

### Igreja
- **Finalidade:** Cadastro de igrejas com hierarquia sede/filiais
- **Campos:** id, nome, tipo (SEDE/CONGREGACAO), igrejaPaiId (self-FK), endereco, criadoEm
- **Regra:** Congregação deve ter sede como pai

### Familia
- **Finalidade:** Cadastro de famílias
- **Campos:** id, nome

### Membro
- **Finalidade:** Cadastro de membros
- **Campos:** id, nome, dataNascimento, telefone, email, endereco, latitude, longitude, fotoUrl, situacao (VISITANTE/CONGREGADO/MEMBRO/AFASTADO/TRANSFERIDO), dataBatismo, familiaId, igrejaId, criadoEm

### Usuario
- **Finalidade:** Autenticação
- **Campos:** id, nome, email (unique), senhaHash, perfil (ADMIN_GERAL/PASTOR/SECRETARIO/TESOUREIRO/LIDER_CONGREGACAO), igrejaId, criadoEm

### Evento
- **Finalidade:** Eventos
- **Campos:** id, titulo, descricao, dataInicio, dataFim, local, igrejaId, vagasLimite, flyerUrl

### Inscricao
- **Finalidade:** Inscrições em eventos
- **Campos:** id, eventoId, membroId, status (default: CONFIRMADA), checkinEm
- **Constraint:** @@unique([eventoId, membroId])

### ContaFinanceira
- **Finalidade:** Contas financeiras
- **Campos:** id, nome, tipo, igrejaId, saldoAtual

### CategoriaFinanceira
- **Finalidade:** Categorias financeiras
- **Campos:** id, nome, tipo

### LancamentoFinanceiro
- **Finalidade:** Lançamentos financeiros
- **Campos:** id, descricao, valor, tipo, data, contaId, categoriaId, membroId, criadoEm

---

## Observações

1. Os dois schemas são **complementares** — o website tem mais modelos de conteúdo, o sistemas tem mais modelos de gestão
2. A modelagem de **Membro** difere: website usa ministerioId/departamentoId, sistemas usa igrejaId/familiaId
3. A modelagem de **Evento** difere: website tem mais campos (finanças, avaliação, liturgia), sistemas tem menos mas com inscrição/check-in
4. **Igreja** com hierarquia sede/filiais só existe no sistemas
5. **Familia** só existe no sistemas
6. Os dois precisarão ser unificados com cuidado para não perder dados
