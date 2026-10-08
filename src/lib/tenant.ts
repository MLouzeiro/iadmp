import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canManageOrganization } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';

export const ORG_FORBIDDEN = 'ORG_FORBIDDEN';
export const ORG_REQUIRED = 'ORG_REQUIRED';

export type OrgScopeMode = 'SINGLE' | 'MULTI' | 'ALL';

export interface OrgScope {
  mode: OrgScopeMode;
  orgIds: string[];
  requestedOrgId?: string | null;
}

export interface SessionUserLike {
  id: string;
  role?: string;
}

export function orgForbiddenResponse() {
  return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
}

/**
 * Resolve o escopo de organizacoes do usuario.
 * - SUPER_ADMIN -> modo ALL (sem restricao de vinculo).
 * - Demais -> intersecao com UsuarioOrganizacao (ativo).
 * - `requestedOrgId` precisa pertencer ao escopo, senao lanca FORBIDDEN.
 * - Escopo vazio -> FORBIDDEN.
 */
export async function resolveOrgScope(
  user: SessionUserLike,
  requestedOrgId?: string | null
): Promise<OrgScope> {
  if (user.role === 'SUPER_ADMIN') {
    return { mode: 'ALL', orgIds: [], requestedOrgId: requestedOrgId || null };
  }

  const vinculos = await prisma.usuarioOrganizacao.findMany({
    where: { userId: user.id },
    select: { organizacaoId: true },
  });
  const orgIds = vinculos.map(v => v.organizacaoId);

  if (requestedOrgId) {
    if (!orgIds.includes(requestedOrgId)) {
      throw new Error(ORG_FORBIDDEN);
    }
    return { mode: 'SINGLE', orgIds, requestedOrgId };
  }

  if (orgIds.length === 0) {
    throw new Error(ORG_FORBIDDEN);
  }

  return {
    mode: orgIds.length === 1 ? 'SINGLE' : 'MULTI',
    orgIds,
    requestedOrgId: null,
  };
}

/**
 * Resolve a organizacao alvo de uma escrita.
 * - Se `requestedOrgId` vier do corpo, valida o acesso.
 * - Se o usuario tem exatamente uma organizacao, usa essa.
 * - Caso contrario lanca ORG_REQUIRED (o cliente precisa informar `organizacaoId`).
 */
export async function resolveTargetOrgId(
  user: SessionUserLike,
  requestedOrgId?: string | null
): Promise<string> {
  const scope = await resolveOrgScope(user, requestedOrgId);
  if (scope.requestedOrgId) return scope.requestedOrgId;
  if (scope.mode === 'SINGLE' && scope.orgIds.length === 1) return scope.orgIds[0];

  // SUPER_ADMIN (modo ALL) ou usuário com múltiplos vínculos:
  // se só existe uma organização ativa no sistema, usa ela.
  const ativas = await prisma.organizacao.findMany({
    where: { ativo: true },
    select: { id: true },
  });
  if (ativas.length === 1) return ativas[0].id;

  throw new Error(ORG_REQUIRED);
}

/**
 * Garante que o usuario pode operar a organizacao alvo.
 * Lanca ORG_FORBIDDEN e registra ACESSO_NEGADO quando negado.
 */
export async function assertOrgAccess(
  userId: string,
  organizacaoId: string,
  req?: Request
): Promise<void> {
  const allowed = await canManageOrganization(userId, organizacaoId);

  if (!allowed) {
    await writeAudit({
      userId,
      organizacaoId,
      acao: 'ACESSO_NEGADO',
      entidade: 'Organizacao',
      entidadeId: organizacaoId,
      resultado: 'NEGADO',
      detalhes: { motivo: 'sem vinculo com a organização' },
      req,
    });
    throw new Error(ORG_FORBIDDEN);
  }
}

/**
 * Injeta o filtro de organizacao num `where` do Prisma.
 * Nao sobrescreve um filtro de organizacao ja explicito.
 */
export function withOrgScope<T extends Record<string, unknown>>(where: T, scope: OrgScope): T {
  if (scope.mode === 'ALL') return where;
  if ((where as Record<string, unknown>).organizacaoId !== undefined) return where;
  return { ...where, organizacaoId: { in: scope.orgIds } };
}

/**
 * Garante que o usuario-alvo compartilha ao menos uma organizacao com o requisitante.
 * SUPER_ADMIN tem acesso livre. Lanca ORG_FORBIDDEN / NOT_FOUND.
 */
export async function assertTargetUserScope(
  requester: SessionUserLike,
  targetUserId: string,
  req?: Request
): Promise<void> {
  if (requester.role === 'SUPER_ADMIN') return;

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { organizacoes: { select: { organizacaoId: true } } },
  });
  if (!target) throw new Error('NOT_FOUND');

  const mine = await prisma.usuarioOrganizacao.findMany({
    where: { userId: requester.id },
    select: { organizacaoId: true },
  });
  const myIds = new Set(mine.map(m => m.organizacaoId));
  const shared = target.organizacoes.some(o => myIds.has(o.organizacaoId));

  if (!shared) {
    await writeAudit({
      userId: requester.id,
      acao: 'ACESSO_NEGADO',
      entidade: 'User',
      entidadeId: targetUserId,
      resultado: 'NEGADO',
      detalhes: { motivo: 'alvo fora do escopo de organização do requisitante' },
      req,
    });
    throw new Error(ORG_FORBIDDEN);
  }
}

/**
 * Converte um escopo num filtro pronto para `where`.
 */
export function orgFilter(scope: OrgScope): Record<string, unknown> {
  if (scope.mode === 'ALL') return {};
  return { organizacaoId: { in: scope.orgIds } };
}

type CongregacaoClient = {
  congregacao: {
    findUnique: (args: { where: { id: string } }) => Promise<{ id: string; organizacaoId: string } | null>;
    findFirst: (args: { where: { organizacaoId: string; nome: string } }) => Promise<{ id: string } | null>;
    create: (args: { data: { organizacaoId: string; nome: string }; select: { id: boolean } }) => Promise<{ id: string }>;
  };
};

/**
 * Resolve `congregacaoId` / `congregacao` (nome) para um id valido dentro da organizacao.
 * Cria a congregacao pelo nome se ela ainda nao existir.
 */
export async function resolveCongregacaoId(
  organizacaoId: string,
  input: { congregacaoId?: string | null; congregacao?: string | null },
  tx?: CongregacaoClient
): Promise<string | null> {
  const client = (tx ?? prisma) as unknown as CongregacaoClient;
  const nome = typeof input.congregacao === 'string' ? input.congregacao.trim() : '';

  if (input.congregacaoId) {
    const alvo = await client.congregacao.findUnique({ where: { id: input.congregacaoId } });
    if (!alvo || alvo.organizacaoId !== organizacaoId) {
      throw new Error(ORG_FORBIDDEN);
    }
    return alvo.id;
  }

  if (!nome) return null;

  const existente = await client.congregacao.findFirst({ where: { organizacaoId, nome } });
  if (existente) return existente.id;

  const criada = await client.congregacao.create({
    data: { organizacaoId, nome },
    select: { id: true },
  });
  return criada.id;
}
