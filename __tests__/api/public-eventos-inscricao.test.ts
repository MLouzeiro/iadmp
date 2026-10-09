/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/public/eventos/[id]/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    evento: { findUnique: jest.fn() },
    inscricao: { count: jest.fn(), create: jest.fn() },
    pagamento: { create: jest.fn() },
  },
}));

const mockEventoFindUnique = prisma.evento.findUnique as jest.Mock;
const mockCount = prisma.inscricao.count as jest.Mock;
const mockCreate = prisma.inscricao.create as jest.Mock;
const mockPagamento = prisma.pagamento.create as jest.Mock;

let ipAtual = 0;

function postRequest(body: unknown): NextRequest {
  ipAtual += 1;
  return new NextRequest('http://localhost/api/public/eventos/ev1', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': `10.0.${Math.floor(ipAtual / 250)}.${(ipAtual % 250) + 1}`,
    },
    body: JSON.stringify(body),
  });
}

const idParams = { params: Promise.resolve({ id: 'ev1' }) };

function eventoPublicado(extra: Record<string, unknown> = {}) {
  return {
    id: 'ev1',
    nome: 'Congresso de Jovens',
    aceitaInscricoes: true,
    limiteInscricoes: null,
    taxaInscricao: null,
    chavePix: null,
    tipoChavePix: null,
    nomeRecebedor: null,
    cidadeRecebedor: null,
    publicarNoSite: true,
    organizacaoId: 'org1',
    ...extra,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockEventoFindUnique.mockResolvedValue(eventoPublicado());
  mockCount.mockResolvedValue(0);
  mockCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: 'ins1', nome: data.nome, status: data.status, valorPrevisto: data.valorPrevisto })
  );
  mockPagamento.mockResolvedValue({ id: 'pag1' });
});

describe('POST /api/public/eventos/[id] - ficha de inscricao com QR PIX', () => {
  it('com taxa e chave pix retorna 201 com brCode, QR SVG e o valor estipulado no evento', async () => {
    mockEventoFindUnique.mockResolvedValue(
      eventoPublicado({ taxaInscricao: 50, chavePix: '12345678909', tipoChavePix: 'CPF' })
    );

    const res = await POST(postRequest({ nome: 'Maria Silva' }), idParams);
    expect(res.status).toBe(201);
    const body = await res.json();

    expect(body.pix).not.toBeNull();
    expect(body.pix.valor).toBe(50);
    expect(body.pix.brCode).toContain('br.gov.bcb.pix');
    expect(body.pix.brCode).toContain('12345678909');
    expect(body.pix.brCode).toContain('50.00');
    expect(body.pix.qrCodeSvg).toContain('<svg');
    expect(body.pix.qrCodeSvg).toContain('</svg>');
  });

  it('cria a inscricao como PENDENTE com valorPrevisto da taxa', async () => {
    mockEventoFindUnique.mockResolvedValue(
      eventoPublicado({ taxaInscricao: 37.5, chavePix: '12345678909', tipoChavePix: 'CPF' })
    );

    await POST(postRequest({ nome: 'Joao Souza', email: 'joao@email.com' }), idParams);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventoId: 'ev1',
          nome: 'Joao Souza',
          status: 'PENDENTE',
          valorPrevisto: 37.5,
        }),
      })
    );
  });

  it('registra pagamento PIX PENDENTE vinculado a inscricao (txid)', async () => {
    mockEventoFindUnique.mockResolvedValue(
      eventoPublicado({ taxaInscricao: 50, chavePix: '12345678909', tipoChavePix: 'CPF' })
    );

    await POST(postRequest({ nome: 'Ana Lima' }), idParams);

    expect(mockPagamento).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          inscricaoId: 'ins1',
          valor: 50,
          forma: 'PIX',
          status: 'PENDENTE',
          txidPix: 'ins1',
        }),
      })
    );
  });

  it('sem taxa nao gera pix nem pagamento e inscricao sai sem valorPrevisto', async () => {
    const res = await POST(postRequest({ nome: 'Pedro Dias' }), idParams);
    expect(res.status).toBe(201);
    const body = await res.json();

    expect(body.pix).toBeNull();
    expect(mockPagamento).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ valorPrevisto: null }) })
    );
  });

  it('taxa sem chave pix cadastrada nao gera QR (mas a inscricao e criada)', async () => {
    mockEventoFindUnique.mockResolvedValue(eventoPublicado({ taxaInscricao: 20 }));

    const res = await POST(postRequest({ nome: 'Carlos Reis' }), idParams);
    expect(res.status).toBe(201);
    const body = await res.json();

    expect(body.pix).toBeNull();
    expect(mockPagamento).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('evento nao publicado retorna 404 e nao cria inscricao', async () => {
    mockEventoFindUnique.mockResolvedValue(eventoPublicado({ publicarNoSite: false }));

    const res = await POST(postRequest({ nome: 'Maria Silva' }), idParams);
    expect(res.status).toBe(404);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('evento que nao aceita inscricoes retorna 400', async () => {
    mockEventoFindUnique.mockResolvedValue(eventoPublicado({ aceitaInscricoes: false }));

    const res = await POST(postRequest({ nome: 'Maria Silva' }), idParams);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('aceitando inscrições');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('vagas esgotadas retornam 400 antes de criar inscricao', async () => {
    mockEventoFindUnique.mockResolvedValue(eventoPublicado({ limiteInscricoes: 5 }));
    mockCount.mockResolvedValue(5);

    const res = await POST(postRequest({ nome: 'Maria Silva' }), idParams);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('esgotadas');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('nome muito curto retorna 400 do schema Zod', async () => {
    const res = await POST(postRequest({ nome: 'A' }), idParams);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Nome muito curto');
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe('GET /api/public/eventos/[id]', () => {
  it('retorna evento publicado com vagas restantes calculadas', async () => {
    mockEventoFindUnique.mockResolvedValue(
      eventoPublicado({ limiteInscricoes: 10, taxaInscricao: 50 })
    );
    mockCount.mockResolvedValue(3);

    const res = await GET(new NextRequest('http://localhost/api/public/eventos/ev1'), idParams);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.evento.nome).toBe('Congresso de Jovens');
    expect(body.evento.vagasRestantes).toBe(7);
    expect(body.evento.inscricoes).toBe(3);
    expect(typeof body.evento.dataEvento).toBe('string');
  });

  it('evento nao publicado retorna 404', async () => {
    mockEventoFindUnique.mockResolvedValue(eventoPublicado({ publicarNoSite: false }));

    const res = await GET(new NextRequest('http://localhost/api/public/eventos/ev1'), idParams);
    expect(res.status).toBe(404);
  });
});
