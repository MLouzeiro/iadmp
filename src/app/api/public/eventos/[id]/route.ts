import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inscricaoPublicaSchema } from '@/lib/validations';
import { gerarBrCode } from '@/lib/pix';
import { gerarQRSvg } from '@/lib/qrcode';

export const dynamic = 'force-dynamic';

// Limite simples de criação por IP (anti-abuso) — sem dependência externa.
const janela = new Map<string, { count: number; reset: number }>();
const LIMITE = 8;
const JANELA_MS = 10 * 60 * 1000;

function rateLimit(ip: string): boolean {
  const agora = Date.now();
  const atual = janela.get(ip);
  if (!atual || agora > atual.reset) {
    janela.set(ip, { count: 1, reset: agora + JANELA_MS });
    return true;
  }
  atual.count += 1;
  return atual.count <= LIMITE;
}

function extrairIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'desconhecido'
  );
}

function dataBR(iso: string | Date) {
  const d = iso instanceof Date ? iso : new Date(iso);
  return d.toLocaleDateString('pt-BR');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evento = await prisma.evento.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        tema: true,
        dataEvento: true,
        dataInicio: true,
        dataFim: true,
        local: true,
        status: true,
        observacoes: true,
        publicarNoSite: true,
        aceitaInscricoes: true,
        limiteInscricoes: true,
        taxaInscricao: true,
      },
    });

    if (!evento || !evento.publicarNoSite) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    const total = await prisma.inscricao.count({
      where: { eventoId: id, status: { in: ['PENDENTE', 'CONFIRMADA'] } },
    });

    return NextResponse.json({
      evento: {
        ...evento,
        dataEvento: dataBR(evento.dataEvento),
        inscricoes: total,
        vagasRestantes: evento.limiteInscricoes != null ? Math.max(0, evento.limiteInscricoes - total) : null,
      },
    });
  } catch (error) {
    console.error('GET /api/public/eventos/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ip = extrairIp(request);
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde alguns minutos.' },
        { status: 429 }
      );
    }

    const evento = await prisma.evento.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        aceitaInscricoes: true,
        limiteInscricoes: true,
        taxaInscricao: true,
        chavePix: true,
        tipoChavePix: true,
        nomeRecebedor: true,
        cidadeRecebedor: true,
        publicarNoSite: true,
        organizacaoId: true,
      },
    });

    if (!evento || !evento.publicarNoSite) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }
    if (!evento.aceitaInscricoes) {
      return NextResponse.json(
        { error: 'Este evento não está aceitando inscrições' },
        { status: 400 }
      );
    }

    if (evento.limiteInscricoes != null) {
      const total = await prisma.inscricao.count({
        where: { eventoId: id, status: { in: ['PENDENTE', 'CONFIRMADA'] } },
      });
      if (total >= evento.limiteInscricoes) {
        return NextResponse.json({ error: 'Inscrições esgotadas' }, { status: 400 });
      }
    }

    const body = await request.json().catch(() => null);
    const parsed = inscricaoPublicaSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: first.message }, { status: 400 });
    }

    const { nome, email, telefone, observacoes } = parsed.data;
    const taxa = evento.taxaInscricao ? Number(evento.taxaInscricao) : 0;
    const temTaxa = taxa > 0;

    const inscricao = await prisma.inscricao.create({
      data: {
        organizacaoId: evento.organizacaoId,
        eventoId: id,
        nome,
        email: email || null,
        telefone: telefone || null,
        status: 'PENDENTE',
        valorPrevisto: temTaxa ? taxa : null,
        observacoes: observacoes || null,
      },
    });

    let pix: { brCode: string; qrCodeSvg: string; valor: number } | null = null;
    if (temTaxa && evento.chavePix) {
      const brCode = gerarBrCode({
        chave: evento.chavePix,
        tipoChave: (evento.tipoChavePix as 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA' | null) ?? null,
        nomeRecebedor: evento.nomeRecebedor || evento.nome,
        cidadeRecebedor: evento.cidadeRecebedor || 'SAO PAULO',
        valor: taxa,
        descricao: `Inscricao ${evento.nome}`.slice(0, 20),
        txid: inscricao.id.replace(/[^A-Za-z0-9]/g, '').slice(0, 25).toUpperCase() || '***',
      });

      await prisma.pagamento.create({
        data: {
          organizacaoId: evento.organizacaoId,
          inscricaoId: inscricao.id,
          descricao: `Taxa de inscricao - ${evento.nome}`,
          valor: taxa,
          forma: 'PIX',
          status: 'PENDENTE',
          txidPix: inscricao.id,
        },
      });

      pix = {
        brCode,
        qrCodeSvg: gerarQRSvg(brCode, 240),
        valor: taxa,
      };
    }

    return NextResponse.json(
      {
        inscricao: {
          id: inscricao.id,
          nome: inscricao.nome,
          status: inscricao.status,
          valorPrevisto: inscricao.valorPrevisto,
        },
        pix,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/public/eventos/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
