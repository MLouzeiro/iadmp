# Compatibilidade com Vercel

**Data:** 26/08/2026

---

## Status Atual

| Projeto | Deploy na Vercel | Status |
|---|---|---|
| Website | Sim | Funcionando |
| IADMP-Sistemas | Não | Backend Express não é compatível |
| IADMPMA (novo) | Sim | Deployado em https://iadmp.vercel.app |

---

## Compatibilidade

### Next.js ✅
- Framework nativo da Vercel
- App Router suportado
- Server Components suportados
- API Routes suportados

### PostgreSQL ✅
- Vercel Postgres (Neon) compatível
- Prisma ORM compatível
- Driver adapter para serverless

### Auth ✅
- NextAuth v5 compatível
- JWT em cookies funciona
- Middleware funciona

### Imagens ✅
- `next/image` otimiza automaticamente
- Remote patterns configurados

### Build ✅
- `npx prisma generate && npx next build` funciona
- TypeScript com `ignoreBuildErrors: true` (necessário por NextAuth beta)

---

## Pontos de Atenção

### 1. Prisma Generate no Build
O Vercel executa `prisma generate` no build. Configurado no `vercel.json`:
```json
{
  "buildCommand": "npx prisma generate && npx next build"
}
```

### 2. Variáveis de Ambiente
Necessárias no painel Vercel:
- `DATABASE_URL` — Connection string do Neon/Vercel Postgres
- `NEXTAUTH_SECRET` — Secret seguro para JWT
- `NEXTAUTH_URL` — URL do domínio (ex: https://iadmp.vercel.app)

### 3. Middleware (Proxy)
Next.js 16 deprecation warning sobre `middleware` → `proxy`. Não afeta funcionamento, mas deve ser migrado futuramente.

### 4. TypeScript Errors
`typescript.ignoreBuildErrors: true` no next.config.js é necessário devido à incompatibilidade entre NextAuth v5 beta e Next.js 16.

### 5. Serverless Functions
API Routes rodam como serverless functions na Vercel. Limitações:
- Timeout de 10s (free) / 60s (pro)
- Sem estado entre requisições (usar DB)
- Sem filesystem persistente (usar storage externo)

### 6. Upload de Arquivos
Na Vercel, não há filesystem persistente. Para uploads:
- Usar Vercel Blob (recomendado)
- Ou Cloudflare R2 / S3
- Não usar `public/` para uploads dinâmicos

---

## Configuração Recomendada

### vercel.json
```json
{
  "buildCommand": "npx prisma generate && npx next build",
  "framework": "nextjs"
}
```

### Variáveis de Ambiente (Produção)
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<gerar com openssl rand -base64 32>
NEXTAUTH_URL=https://iadmp.vercel.app
```

### Domínio Customizado
- Configurar no painel Vercel
- SSL automático
- DNS apontar para Vercel

---

## Limitações da Vercel

| Funcionalidade | Suporte | Alternativa |
|---|---|---|
| Serverless functions | ✅ | — |
| Cron jobs | ⚠️ | Vercel Cron (limits: 1/min free) |
| Websockets | ❌ | Pusher / Ably / Supabase Realtime |
| File uploads | ⚠️ | Vercel Blob / S3 |
| Background jobs | ❌ | Inngest / Temporal |
| Email sending | ❌ | Resend / SendGrid / AWS SES |
| WhatsApp | ❌ | API externa (UltraMsg, Twilio) |

---

## Recomendações

1. **Manter Vercel** para deploy (já funcionando)
2. **Usar Neon** para banco (já conectado)
3. **Vercel Blob** para uploads futuros
4. **Vercel Cron** para versículo diário (substituir GitHub Actions)
5. **Resend** para emails (se necessário)
6. **Evitar** dependências de filesystem persistente
