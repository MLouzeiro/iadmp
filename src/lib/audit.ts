import { prisma } from '@/lib/prisma';

/** Acoes padrao de auditoria (Fase 1). */
export const AUDIT_ACOES = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'CANCEL',
  'APPROVE',
  'REJECT',
  'PUBLISH',
  'UNPUBLISH',
  'PAY',
  'REFUND',
  'LOGIN',
  'LOGOUT',
  'PERMISSION_CHANGE',
  'CONFIG_CHANGE',
  'ACESSO_NEGADO',
  'TROCA_CONTEXTO',
] as const;

export type AuditAcao = (typeof AUDIT_ACOES)[number] | string;

const SENSITIVE_KEY = /password|senha|hash|token|secret|authorization|cookie|jwt/i;

function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? '***' : sanitize(v);
    }
    return out;
  }
  return value;
}

export interface RequestMeta {
  ip?: string | null;
  userAgent?: string | null;
}

export function extractRequestMeta(req?: Request | { headers?: Headers }): RequestMeta {
  if (!req || typeof (req as Request).headers?.get !== 'function') return {};
  const headers = (req as Request).headers;
  const fwd = headers.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0].trim() : headers.get('x-real-ip');
  return { ip: ip || null, userAgent: headers.get('user-agent') };
}

export interface AuditInput {
  userId: string;
  organizacaoId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  antes?: unknown;
  depois?: unknown;
  detalhes?: unknown;
  resultado?: string;
  req?: Request | { headers?: Headers };
}

type AuditClient = {
  auditLog: {
    create: (args: {
      data: {
        userId: string;
        organizacaoId?: string | null;
        acao: string;
        entidade: string;
        entidadeId?: string | null;
        antes?: unknown;
        depois?: unknown;
        detalhes?: unknown;
        ip?: string | null;
        userAgent?: string | null;
        resultado?: string;
      };
    }) => Promise<unknown>;
  };
};

export async function writeAudit(input: AuditInput, tx?: AuditClient): Promise<void> {
  try {
    const meta = extractRequestMeta(input.req);
    const client = (tx ?? prisma) as unknown as AuditClient;
    await client.auditLog.create({
      data: {
        userId: input.userId,
        organizacaoId: input.organizacaoId ?? null,
        acao: input.acao,
        entidade: input.entidade,
        entidadeId: input.entidadeId ?? null,
        antes: sanitize(input.antes) as never,
        depois: sanitize(input.depois) as never,
        detalhes: sanitize(input.detalhes) as never,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        resultado: input.resultado || 'SUCESSO',
      },
    });
  } catch {
    // Auditoria nunca deve derrubar a requisicao principal.
  }
}
