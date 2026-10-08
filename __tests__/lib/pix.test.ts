/**
 * @jest-environment node
 */
import { gerarBrCode, crc16, normalizarChave, formatarBRL } from '@/lib/pix';
import { gerarQRSvg } from '@/lib/qrcode';

describe('lib/pix', () => {
  const config = {
    chave: '12345678909',
    tipoChave: 'CPF' as const,
    nomeRecebedor: 'IADMP - Igreja',
    cidadeRecebedor: 'Sao Luis',
    valor: 25.5,
    descricao: 'Inscricao Congresso',
    txid: 'ABC123',
  };

  describe('gerarBrCode', () => {
    it('gera payload EMV comestrutura valida', () => {
      const br = gerarBrCode(config);
      expect(br.startsWith('000201')).toBe(true);
      expect(br).toContain('br.gov.bcb.pix');
      expect(br).toContain('5802BR');
    });

    it('inclui o valor formatado com 2 casas', () => {
      const br = gerarBrCode(config);
      expect(br).toContain('540525.50');
    });

    it('termina com CRC16 valido (6304 + 4 hex)', () => {
      const br = gerarBrCode(config);
      expect(br.slice(-8, -4)).toHaveLength(4);
      expect(br.slice(-4)).toMatch(/^[0-9A-F]{4}$/);
    });

    it('CRC16 bate com o calculo sobre o payload ate 6304', () => {
      const br = gerarBrCode(config);
      const corpo = br.slice(0, -4);
      expect(corpo.endsWith('6304')).toBe(true);
      expect(br.slice(-4)).toBe(crc16(corpo));
    });

    it('normaliza telefone com +55', () => {
      const br = gerarBrCode({ ...config, chave: '(98) 98803-5646', tipoChave: 'TELEFONE' });
      expect(br).toContain('+5598988035646');
    });

    it('aceita chave e-mail sem alteracao', () => {
      const br = gerarBrCode({ ...config, chave: 'marcio@codemed.com.br', tipoChave: 'EMAIL' });
      expect(br).toContain('marcio@codemed.com.br');
    });

    it('usa *** como txid padrao quando nao informado', () => {
      const br = gerarBrCode({ ...config, txid: undefined });
      expect(br).toContain('0503***');
    });

    it('lanca erro sem chave', () => {
      expect(() => gerarBrCode({ ...config, chave: '' })).toThrow();
    });

    it('lanca erro sem nome', () => {
      expect(() => gerarBrCode({ ...config, nomeRecebedor: '' })).toThrow();
    });

    it('omite o valor quando zero ou nulo', () => {
      const br = gerarBrCode({ ...config, valor: 0 });
      expect(br).not.toContain('54');
    });
  });

  describe('crc16', () => {
    it('retorna 4 hex maiusculos', () => {
      const c = crc16('123456789');
      expect(c).toMatch(/^[0-9A-F]{4}$/);
    });

    it('e deterministico', () => {
      expect(crc16('abc')).toBe(crc16('abc'));
    });
  });

  describe('normalizarChave', () => {
    it('telefone vira +55...', () => {
      expect(normalizarChave('98988035646', 'TELEFONE')).toBe('+5598988035646');
    });

    it('ja com +55 nao duplica', () => {
      expect(normalizarChave('+5598988035646', 'TELEFONE')).toBe('+5598988035646');
    });
  });

  describe('formatarBRL', () => {
    it('formata como moeda brasileira', () => {
      expect(formatarBRL(25.5)).toContain('25');
    });
  });
});

describe('lib/qrcode', () => {
  it('gera SVG com estrutura valida', () => {
    const svg = gerarQRSvg('teste de payload');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('<rect');
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  it('suporta payload de PIX real (BR Code)', () => {
    const br = gerarBrCode({
      chave: '12345678909',
      tipoChave: 'CPF',
      nomeRecebedor: 'IADMP',
      cidadeRecebedor: 'Sao Luis',
      valor: 30,
      txid: 'XYZ',
    });
    const svg = gerarQRSvg(br);
    expect(svg).toContain('<svg');
  });

  it('lanca erro para payload acima do limite', () => {
    expect(() => gerarQRSvg('x'.repeat(2000))).toThrow();
  });
});
