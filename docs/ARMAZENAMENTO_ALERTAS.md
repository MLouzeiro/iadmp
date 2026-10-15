# Armazenamento e Alertas — IADMP

Guia operacional do módulo de monitoramento do Supabase Storage (plano gratuito), incluindo configuração, interpretação de alertas, agendamento e recuperação segura.

---

## 1. Visão geral

O IADMP usa o **Supabase Storage** apenas para armazenar imagens (banners, logos, galeria, fotos). O banco de dados oficial continua sendo o **PostgreSQL (Neon)**.

O módulo **Armazenamento e Alertas** (`/admin/armazenamento`) monitora o consumo, emite alertas por nível e oferece diagnóstico de limpeza.

> **Importante:** O Supabase **não expõe a cota real da conta** via API pública com a chave publishable. Por isso, o limite é **configurado pelo administrador** conforme o plano contratado. O uso é calculado a partir do **inventário interno** (arquivos registrados no sistema via `StoredFile`). Esse método pode não refletir arquivos enviados fora do sistema.

---

## 2. Configuração de credenciais

### Variáveis de ambiente (obrigatórias)

Adicione no `.env` (local) e nas env vars da Vercel (preview/produção):

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SUPABASE_BUCKET=imagens
```

- **NEXT_PUBLIC_SUPABASE_URL**: em Supabase → Settings → API → Project URL.
- **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY**: chave `anon` / `publishable` (segura para frontend). **Nunca** use a `service_role` aqui.
- **NEXT_PUBLIC_SUPABASE_BUCKET**: nome do bucket público criado no painel Supabase → Storage.

### Bucket

1. No painel Supabase → **Storage** → **New bucket**.
2. Nome: `imagens` (ou o definido na env).
3. Marcar como **Public bucket** (para URLs públicas de imagens).
4. Opcional: configurar política de tamanho (ex.: 5 MB) e tipos permitidos.

### Permissões no Supabase

- Com a chave publishable + bucket público, uploads e leitura funcionam sem RLS extra.
- Se preferir RLS, crie política de `INSERT`/`SELECT` autenticada ou anônima no bucket.

---

## 3. Definir a cota (limite)

O limite **não é obtido automaticamente** do Supabase. Configure em:

**Painel → Armazenamento → Limites** (botão "Limites" no topo da página).

| Campo | Padrão | Descrição |
|-------|--------|-----------|
| Limite (GB) | 1 GB | Cota considerada nos cálculos. Ajuste ao plano real. |
| Atenção (%) | 70 | Nível amarelo. |
| Crítico (%) | 85 | Nível laranja. |
| Urgente (%) | 95 | Nível vermelho. |

Validações: limite > 0 e ≥ 1 MB; percentuais entre 1 e 100; atencao < critico < urgente.

> **Plano Free do Supabase:** normalmente **1 GB** de armazenamento e **5 GB** de transferência/mês. Confirme no painel Supabase → Settings → Billing.

---

## 4. Interpretar os alertas

| Nível | % do limite | Significado |
|-------|-------------|-------------|
| NORMAL | < 70% | Uso dentro do esperado. |
| ATENÇÃO | ≥ 70% | Reveja imagens grandes, banners antigos, duplicatas. |
| CRÍTICO | ≥ 85% | Priorize compressão e arquivamento. |
| URGENTE | ≥ 95% | Uploads podem falhar. Suspenda não essenciais. |
| CHEIO | ≥ 100% ou falha por cota | Uploads bloqueados. Libere espaço. |

Cada alerta exibe:
- **Nível** e **status** (ATIVO / LIDO / RESOLVIDO).
- **Sugestões** específicas do nível.
- **Fonte**: `INVENTARIO` (cálculo interno) — nunca afirmamos que é o consumo oficial da conta.

Ações disponíveis:
- **Lido**: marca como visualizado (não apaga histórico).
- **Resolver**: marca como resolvido (ex.: após liberação de espaço).

**Deduplicação:** o sistema não cria novo alerta do mesmo nível enquanto houver um ATIVO. Quando o uso cai, alertas maiores são marcados automaticamente como RESOLVIDO; se subir de novo, um novo alerta é emitido.

---

## 5. Como os dados de consumo são calculados

1. Cada upload via `POST /api/upload` registra um registro em `StoredFile` (tamanho, bucket, congregação, usuário).
2. `coletarUso()` soma `sizeBytes` de todos os `StoredFile` ativos (global ou por congregação).
3. O percentual é `totalBytes / limiteBytes * 100`.
4. Medições históricas ficam em `StorageMeasurement` (últimas 30 exibidas como tendência).

**Limitação declarada:** arquivos enviados diretamente no Supabase (fora do sistema) **não** aparecem no inventário. O número exibido é um **piso**, não necessariamente o total da conta.

---

## 6. Agendamento (monitoramento periódico)

### Estado atual
- O monitoramento roda **sob demanda** (quando o admin abre a página ou clica "Atualizar").
- **Não há cron configurado** no Vercel neste projeto (plano Hobby não inclui crons automáticos ilimitados).

### Como habilitar verificação periódica (opcional, plano pago Vercel)

1. No Vercel → Settings → Functions → **Cron Jobs** (disponível em planos que suportam).
2. Criar cron: `0 * * * *` (de hora em hora) apontando para `GET /api/storage/monitoramento`.
3. Proteger o endpoint com `CRON_SECRET` no Vercel e checar no código (não implementado por padrão para evitar complexity sem necessidade).

> **Não afirmamos** que há monitoramento 24h automático — isso só é verdade após configurar e testar o cron.

---

## 7. Investigar falhas de monitoramento

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| "Monitoramento indisponível" | Env vars ausentes | Verificar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| "Configuração incompleta" | Bucket não definido | Definir `NEXT_PUBLIC_SUPABASE_BUCKET` |
| Uso sempre 0 | Inventário vazio (normal em início) ou upload falhou | Conferir uploads recentes e `StoredFile` |
| "ERRO" no estado | Falha de banco ao consultar | Verificar `DATABASE_URL` e logs |
| Upload falha com 507 | Espaço cheio | Ver alerta CHEIO; liberar espaço |

Logs relevantes: `AuditLog` com ações `UPLOAD_ARQUIVO` e `ATUALIZAR_CONFIG_STORAGE`.

---

## 8. Recuperar espaço com segurança

**Nunca exclua arquivos automaticamente.** Procedimento seguro:

1. Abra **Armazenamento → Limpeza (diagnóstico)**.
2. Analise os **arquivos maiores** e os marcados como **possível duplicado**.
3. Verifique se o arquivo é referenciado em banners, galeria, eventos ou configurações.
4. Remova manualmente no painel Supabase ou via UI correspondente do módulo.
5. Após remover, clique **Atualizar** no dashboard para nova medição.

A ferramenta de limpeza **apenas lista** — não exclui.

---

## 9. Limitações do plano gratuito

- **1 GB** de armazenamento (padrão Supabase Free — confirmar no painel).
- **5 GB** de transferência/mês.
- Cooldown de **7 dias** após pausar projeto inativo.
- API de gestão de cota **não disponível** com chave publishable — por isso o limite é manual.

---

## 10. Ações que podem gerar cobrança

- Subir para plano **Pro** do Supabase (mais storage/transferência).
- Migrar para **Vercel Blob**, **AWS S3** ou outro provedor de storage.
- Aumentar limite de functions/crons no Vercel.

> **Regra do projeto:** nenhuma dessas ações será executada sem **autorização explícita** do administrador. O sistema **não** contrata planos pagos automaticamente.

---

## 11. Endpoints da API

| Rota | Método | Acesso | Descrição |
|------|--------|--------|-----------|
| `/api/upload` | POST | Sessão + permissão | Upload de arquivo (FormData) |
| `/api/storage/monitoramento` | GET | SUPER_ADMIN ou `configuracoes:ver` | Uso, config, alertas, maiores arquivos |
| `/api/storage/monitoramento` | PUT | SUPER_ADMIN | Atualizar limites |
| `/api/storage/alertas/[id]` | PATCH | SUPER_ADMIN ou `configuracoes:editar` | Marcar alerta lido/resolvido |
| `/api/storage/limpeza` | GET | SUPER_ADMIN ou `configuracoes:ver` | Listar candidatos a limpeza |

### Exemplo de upload

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Cookie: authjs.session-token=..." \
  -F "arquivo=@foto.jpg" \
  -F "organizacaoId=ORG_ID" \
  -F "pasta=banners" \
  -F "entityTipo=Banner" \
  -F "entityId=BANNER_ID"
```

Resposta: `{ "url": "https://.../public", "path": "...", "sizeBytes": 12345 }`

Erros possíveis: `400` (tipo/tamanho), `507` (espaço cheio), `503` (Supabase não configurado).

---

## 12. Validação em Preview

1. Configurar env vars no Vercel → Settings → Environment Variables (Preview).
2. Fazer deploy de Preview (não produção).
3. Entrar como SUPER_ADMIN → `/admin/armazenamento`.
4. Verificar: KPIs, barra de uso, alertas, maiores arquivos.
5. Testar upload de imagem em Banners ou Galeria.
6. Testar alerta: configurar limite baixo (ex.: 0.001 GB) e verificar nível CHEIO.
7. Confirmar isolamento: usuário de outra congregação deve receber 403 em `?organizacaoId=` alheio.
