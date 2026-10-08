import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const contatoSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto').max(120),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().max(30).optional().or(z.literal('')),
  assunto: z.string().max(120).optional().or(z.literal('')),
  mensagem: z.string().min(5, 'Mensagem muito curta').max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = contatoSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: first.message }, { status: 400 });
    }

    const { nome, email, telefone, assunto, mensagem } = parsed.data;

    const org = await prisma.organizacao.findFirst({
      where: { ativo: true },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    try {
      await prisma.contatoMensagem.create({
        data: {
          nome,
          email,
          telefone: telefone || null,
          assunto: assunto || null,
          mensagem,
          organizacaoId: org?.id || null,
        },
      });
    } catch {
      // Tabela pode não existir ainda em alguns ambientes; não falha o envio
    }

    return NextResponse.json({ ok: true, message: 'Mensagem recebida' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/public/contato error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
