import { prisma } from '@/lib/prisma';

export interface SessionOrg {
  id: string;
  nome: string;
}

export interface SessionUserState {
  id: string;
  role: string;
  ativo: boolean;
  organizacoes: SessionOrg[];
}

/**
 * Carrega o estado atual do usuario para revalidar a sessao JWT.
 * Somente vinculos ativos com organizacoes ativas sao considerados.
 */
export async function loadSessionUserState(userId: string): Promise<SessionUserState | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      ativo: true,
      organizacoes: {
        where: { ativo: true, organizacao: { ativo: true } },
        select: { organizacao: { select: { id: true, nome: true } } },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    role: user.role,
    ativo: user.ativo,
    organizacoes: user.organizacoes.map(v => ({
      id: v.organizacao.id,
      nome: v.organizacao.nome,
    })),
  };
}
