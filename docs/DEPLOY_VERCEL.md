# Deploy na Vercel — IADMPMA

**Data:** 29/08/2026

---

## Pré-requisitos

- Conta Vercel ativa
- Repositório GitHub com o projeto `iadmpma`
- Acesso ao banco Neon PostgreSQL (já configurado)

---

## PASSO 1 — Entrar na Vercel

Acesse [https://vercel.com](https://vercel.com) e faça login na nova conta.

---

## PASSO 2 — Criar Projeto

1. Clique em **Add New Project**
2. Escolha **Import Git Repository**
3. Selecione o repositório `MLouzeiro/iadmp` (ou o repositório correto)
4. Clique em **Import**

---

## PASSO 3 — Configurar o Projeto

| Campo | Valor |
|---|---|
| **Project Name** | `admpma` |
| **Framework Preset** | Next.js |
| **Root Directory** | `./` (padrão) |
| **Build Command** | `npx prisma generate && npx next build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

> O `vercel.json` já define essas configurações automaticamente.

---

## PASSO 4 — Variáveis de Ambiente

Acesse **Project Settings → Environment Variables** e cadastre as seguintes variáveis:

### Obrigatórias

| Variável | Ambiente | Valor |
|---|---|---|
| `DATABASE_URL` | Production, Preview, Development | String de conexão do Neon PostgreSQL |
| `NEXTAUTH_SECRET` | Production, Preview, Development | String aleatória segura (mínimo 32 caracteres) |
| `NEXTAUTH_URL` | Production | `https://admpma.vercel.app` |

### Como gerar NEXTAUTH_SECRET

Execute localmente:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use a saída como valor de `NEXTAUTH_SECRET`.

### Sobre NEXTAUTH_URL

- **Production:** `https://admpma.vercel.app` (URL real após o deploy)
- **Preview:** Não necessário (Next.js detecta automaticamente)
- **Development:** `http://localhost:3000`

> O `NEXTAUTH_URL` é necessário para o NextAuth saber a URL correta do site em produção.

---

## PASSO 5 — Deploy

1. Clique em **Deploy**
2. Aguarde o build finalizar (geralmente 1-3 minutos)
3. Após o deploy, a Vercel fornecerá a URL do projeto

---

## PASSO 6 — Seed do Banco (após primeiro deploy)

Se o banco ainda não tiver o usuário admin, acesse:

```
https://admpma.vercel.app/api/seed
```

Isso criará o usuário admin:
- **Email:** admin@iadmp.com.br
- **Senha:** admin123

> **IMPORTANTE:** Altere a senha após o primeiro login!

---

## PASSO 7 — Acessar o Painel

- **Site público:** `https://admpma.vercel.app`
- **Painel admin:** `https://admpma.vercel.app/admin/login`

---

## Notas Importantes

### Banco de Dados

- O projeto usa **Neon PostgreSQL** (não Supabase)
- A string de conexão deve ser a mesma já utilizada localmente
- Não é necessário criar um novo banco

### Segurança

- Nunca commite `.env` ou `.env.local` no Git
- Use o `NEXTAUTH_SECRET` fornecido pela Vercel em Environment Variables
- Altere a senha do admin após o primeiro login

### Build

- O `vercel.json` já configura o build corretamente
- O `postinstall` do `package.json` executa `prisma generate` automaticamente
- TypeScript errors são ignorados (`ignoreBuildErrors: true` no `next.config.js`)

### Avisos do Build

O build pode exibir os seguintes avisos (não são erros):
- **Middleware deprecation:** Next.js 16 recomenda usar "proxy" ao invés de "middleware"
- **TypeScript skipped:** Validação de tipos é pulada (configuração intencional)

---

## Variáveis de Ambiente — Resumo

```env
# Obrigatório
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=string-segura-32-characters
NEXTAUTH_URL=https://admpma.vercel.app

# Não utilizado (removido do .env.example)
# WHATSAPP_*, BLOB_READ_WRITE_TOKEN, EMAILJS_*, DIRECT_URL
```

---

## Troubleshooting

### Build falha com erro de Prisma

Verifique se `DATABASE_URL` está configurada nas variáveis de ambiente da Vercel.

### Login não funciona

1. Verifique se `NEXTAUTH_SECRET` está configurado
2. Verifique se `NEXTAUTH_URL` aponta para a URL correta do deploy
3. Verifique se o usuário foi criado via `/api/seed`

### Página 404 em rotas admin

Isso é normal durante o build — as rotas admin são dinâmicas e serão servidas corretamente após o deploy.

---

## Checklist Pré-Deploy

- [ ] Build local passa (`npm run build`)
- [ ] `.env` e `.env.local` não estão versionados
- [ ] `NEXTAUTH_SECRET` está configurado na Vercel
- [ ] `DATABASE_URL` está configurado na Vercel
- [ ] `NEXTAUTH_URL` está configurado para produção
- [ ] Repositório está no GitHub
- [ ] Nome do projeto na Vercel: `admpma`
