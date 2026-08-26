# Auditoria Completa — Projeto IADMP-Sistemas

**Localização:** `C:\Users\Louzeiro\Documents\Louzeiro\Projeto\iadmp-sistemas`
**Data:** 26/08/2026

---

## 1. Tecnologia

### Frontend (`/client`)
| Tecnologia | Versão |
|---|---|
| React | ^18.3.1 |
| React DOM | ^18.3.1 |
| TypeScript | ^5.3.3 |
| Vite | ^5.1.0 |
| CSS puro | Variáveis CSS, sem Tailwind |

### Backend (`/server`)
| Tecnologia | Versão |
|---|---|
| Express | ^4.18.2 |
| TypeScript | ^5.3.3 |
| Prisma Client | ^5.10.0 |
| PostgreSQL | Via Prisma |
| jsonwebtoken | ^9.0.2 |
| bcryptjs | ^2.4.3 |
| Zod | ^3.22.4 |
| multer | ^1.4.5-lts.1 (listado, não utilizado) |
| pdfkit | ^0.15.0 |
| Jest | ^29.7.0 (testes) |

**Dev Server:** Porta 3002, proxy `/api` → `localhost:3001`

---

## 2. Estrutura

```
iadmp-sistemas/
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/             # LandingPage, AdminPanel
│   │   ├── components/        # 9 componentes (Navbar, Hero, Programs, etc.)
│   │   └── styles/global.css  # 1134 linhas
│   └── public/images/         # Imagens da igreja
├── server/                    # Backend (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma      # 9 modelos, 3 enums
│   │   ├── seed.ts            # Seed com dados realistas
│   │   └── migrations/        # 1 migração
│   └── src/
│       ├── modules/
│       │   ├── auth/          # COMPLETO (6 arquivos + testes)
│       │   ├── congregacoes/  # COMPLETO (5 arquivos + testes)
│       │   ├── membros/       # COMPLETO (6 arquivos + testes)
│       │   ├── eventos/       # VAZIO
│       │   ├── financeiro/    # VAZIO
│       │   ├── avisos/        # VAZIO
│       │   └── flyers/        # VAZIO
│       ├── middlewares/       # auth.middleware.ts, validation.middleware.ts
│       └── prisma/index.ts    # Singleton PrismaClient
├── docs/                      # Changelog
├── PLAN.md                    # Roadmap
├── SPEC.md                    # Especificação
└── mockup.html                # Protótipo visual
```

---

## 3. Páginas

### Frontend
| Página | Descrição |
|---|---|
| LandingPage | Página pública: Navbar, Hero, Programs, Values, Congregations, Leadership, FAQ, Footer |
| AdminPanel | Painel admin com sidebar: Dashboard, Igrejas (tabela), Membros (tabela) |

**Nota:** React Router DOM listado mas NÃO utilizado. Troca de views via `useState`.

### Backend API
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/health` | Não | Health check |
| POST | `/auth/login` | Não | Login (email+senha) → JWT |
| POST | `/auth/register` | Sim | Cadastrar usuário |
| GET | `/auth/me` | Sim | Perfil do usuário |
| POST | `/auth/refresh` | Sim | Renovar JWT |
| POST | `/igrejas` | ADMIN_GERAL, PASTOR | Criar igreja |
| GET | `/igrejas` | Sim | Listar igrejas |
| GET | `/igrejas/:id` | Sim | Detalhes igreja |
| PUT | `/igrejas/:id` | ADMIN_GERAL, PASTOR | Atualizar igreja |
| POST | `/membros` | ADMIN_GERAL, PASTOR, SECRETARIO | Criar membro |
| GET | `/membros` | Sim | Listar membros (paginado) |
| GET | `/membros/:id` | Sim | Detalhes membro |
| PUT | `/membros/:id` | ADMIN_GERAL, PASTOR, SECRETARIO | Atualizar membro |
| DELETE | `/membros/:id` | ADMIN_GERAL, PASTOR | Soft-delete (TRANSFERIDO) |
| POST | `/membros/import` | ADMIN_GERAL, PASTOR, SECRETARIO | Importar CSV |
| GET | `/membros/:id/carteirinha` | Sim | Gerar PDF (carteirinha) |

---

## 4. Módulos Implementados

| Módulo | Status | Arquivos |
|---|---|---|
| Auth | COMPLETO | routes, controller, service, validation, helpers, test |
| Congregações | COMPLETO | routes, controller, service, validation, test |
| Membros | COMPLETO | routes, controller, service, validation, pdf, test |
| Eventos | VAZIO | Diretório existe, sem código |
| Financeiro | VAZIO | Diretório existe, sem código |
| Avisos | VAZIO | Diretório existe, sem código |
| Flyers | VAZIO | Diretório existe, sem código |

---

## 5. Banco de Dados

### Enums
| Enum | Valores |
|---|---|
| TipoIgreja | SEDE, CONGREGACAO |
| SituacaoMembro | VISITANTE, CONGREGADO, MEMBRO, AFASTADO, TRANSFERIDO |
| PerfilUsuario | ADMIN_GERAL, PASTOR, SECRETARIO, TESOUREIRO, LIDER_CONGREGACAO |

### Modelos (9)

#### Igreja
| Campo | Tipo | Notas |
|---|---|---|
| id | String (UUID) | PK |
| nome | String | |
| tipo | TipoIgreja | SEDE ou CONGREGACAO |
| igrejaPaiId | String? | FK self-referencial (congração → sede) |
| endereco | String? | |
| criadoEm | DateTime | |

#### Familia
| Campo | Tipo |
|---|---|
| id | String (UUID) |
| nome | String |

#### Membro
| Campo | Tipo | Notas |
|---|---|---|
| id | String (UUID) | PK |
| nome | String | |
| dataNascimento | DateTime? | |
| telefone | String? | |
| email | String? | |
| endereco | String? | |
| latitude | Float? | Geolocalização |
| longitude | Float? | Geolocalização |
| fotoUrl | String? | |
| situacao | SituacaoMembro | Default: VISITANTE |
| dataBatismo | DateTime? | |
| familiaId | String? | FK Familia |
| igrejaId | String | FK Igreja (obrigatório) |

#### Usuario
| Campo | Tipo |
|---|---|
| id | String (UUID) |
| nome | String |
| email | String (unique) |
| senhaHash | String |
| perfil | PerfilUsuario |
| igrejaId | String? |

#### Evento
| Campo | Tipo |
|---|---|
| id | String (UUID) |
| titulo | String |
| descricao | String? |
| dataInicio | DateTime |
| dataFim | DateTime? |
| local | String? |
| igrejaId | String |
| vagasLimite | Int? |
| flyerUrl | String? |

#### Inscricao
| Campo | Tipo |
|---|---|
| id | String (UUID) |
| eventoId | String |
| membroId | String |
| status | String (default: CONFIRMADA) |
| checkinEm | DateTime? |

#### ContaFinanceira
| Campo | Tipo |
|---|---|
| id | String (UUID) |
| nome | String |
| tipo | String |
| igrejaId | String |
| saldoAtual | Decimal |

#### CategoriaFinanceira
| Campo | Tipo |
|---|---|
| id | String (UUID) |
| nome | String |
| tipo | String |

#### LancamentoFinanceiro
| Campo | Tipo |
|---|---|
| id | String (UUID) |
| descricao | String |
| valor | Decimal |
| tipo | String |
| data | DateTime |
| contaId | String |
| categoriaId | String |
| membroId | String? |

### Relacionamentos
```
Igreja --< Membro
Igreja --< Usuario
Igreja --< Evento
Igreja --< ContaFinanceira
Igreja >-- Igreja (sede/filiais)
Familia --< Membro
Membro --< LancamentoFinanceiro
Membro --< Inscricao
Evento --< Inscricao
ContaFinanceira --< LancamentoFinanceiro
CategoriaFinanceira --< LancamentoFinanceiro
```

### Seed
- 1 Admin (admin@admin.com.br / admin)
- 1 Sede (Igreja Central)
- 1 Congregação (Congregação Nova Vida)
- 3 Famílias
- 10 membros fictícios

---

## 6. Autenticação

- **JWT customizado** (sem NextAuth, sem Supabase Auth)
- Login: `POST /auth/login` → `{token, usuario}`
- Token no localStorage: `iadmp_token`
- Header: `Authorization: Bearer <token>`
- Expiração: 24h
- Senha: bcryptjs (10 salt rounds)
- RBAC: middleware `authorize(...perfis)`

### Roles
| Role | Permissões |
|---|---|
| ADMIN_GERAL | Tudo |
| PASTOR | Tudo (exceto delete de admin) |
| SECRETARIO | Membros (CRUD), Import |
| TESOUREIRO | Financeiro (planejado) |
| LIDER_CONGREGACAO | Sua congregação |

### Ausências
- Sem recuperação de senha
- Sem logout server-side
- Sem rate limiting
- Sem verificação de email

---

## 7. Supabase

**Não existe nenhuma integração com Supabase neste projeto.**

O banco é PostgreSQL puro via Prisma ORM.

---

## 8. Testes

- 18 testes de integração
- Cobertura: Auth (5), Congregações (5), Membros (8)
- Framework: Jest + supertest
- Usa banco real (seed), não mocks

---

## 9. Segurança

1. `.env` com credenciais reais no working tree
2. JWT secret hardcoded como fallback (`'default-secret'`)
3. Sem rate limiting no login
4. CORS aceita todas as origens
5. Register permite qualquer autenticado criar usuários
6. Cliente hardcoded `localhost:3001` em vez do proxy
