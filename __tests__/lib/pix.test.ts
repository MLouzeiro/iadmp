/**
 * @jest-environment node
 */
import { gerarBrCode, crc16, normalizarChave, formatarBRL } from '@/lib/pix';
import { gerarQRSvg } from '@/lib/qrcode';

/** Parser TLV simples (id 2 dígitos + len 2 dígitos + valor) para validar estrutura. */
function parseTlv(s: string): Array<{ id: string; value: string }> {
  const out: Array<{ id: string; value: string }> = [];
  let i = 0;
  while (i + 4 <= s.length) {
    const id = s.slice(i, i + 2);
    const len = parseInt(s.slice(i + 2, i + 4), 10);
    if (Number.isNaN(len) || i + 4 + len > s.length) throw new Error(`TLV invalido em ${i}: ${id}`);
    out.push({ id, value: s.slice(i + 4, i + 4 + len) });
    i += 4 + len;
  }
  if (i !== s.length) throw new Error('sobrou lixo apos o ultimo TLV');
  return out;
}

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
      expect(parseTlv(br).some((f) => f.id === '54')).toBe(false);
    });

    it('usa Point of Initiation estatico (01=11) ja que a chave vai embutida', () => {
      const br = gerarBrCode(config);
      expect(br.startsWith('000201010211')).toBe(true);
    });

    it('monta payload em TLV valido, ascendente e com CRC no fim', () => {
      const br = gerarBrCode(config);
      const campos = parseTlv(br);
      expect(campos.map((f) => f.id)).toEqual(
        [...campos.map((f) => f.id)].sort((a, b) => Number(a) - Number(b))
      );
      expect(campos[campos.length - 1].id).toBe('63');
      expect(campos[campos.length - 1].value).toBe(crc16(br.slice(0, -4)));
      const mai = campos.find((f) => f.id === '26');
      expect(mai).toBeDefined();
      expect(Buffer.byteLength(mai!.value, 'utf8')).toBeLessThanOrEqual(99);
      expect(mai!.value).toContain('br.gov.bcb.pix');
    });

    it('omite a descricao quando ela excederia os 99 bytes do campo 26', () => {
      const br = gerarBrCode({
        ...config,
        chave: 'x'.repeat(66) + '@igreja.com',
        descricao: 'Inscricao Congresso Nacional',
      });
      expect(br).not.toContain('Inscricao');
      const mai = parseTlv(br).find((f) => f.id === '26');
      expect(Buffer.byteLength(mai!.value, 'utf8')).toBeLessThanOrEqual(99);
    });

    it('lanca erro quando a propria chave excede os 99 bytes do campo 26', () => {
      expect(() => gerarBrCode({ ...config, chave: 'x'.repeat(100) + '@a.com' })).toThrow();
    });
  });

  describe('crc16', () => {
    it('retorna 4 hex maiusculos', () => {
      const c = crc16('123456789');
      expect(c).toMatch(/^[0-9A-F]{4}$/);
    });

    it('confere com o vetor padrao CRC-16/CCITT-FALSE (123456789 -> 29B1)', () => {
      expect(crc16('123456789')).toBe('29B1');
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

    it('nao corrompe CPF com 3o digito 9 (parece telefone)', () => {
      expect(normalizarChave('11923456789', 'CPF')).toBe('11923456789');
    });

    it('sem tipo, preserva CPF valido que casaria com o regex de telefone', () => {
      expect(normalizarChave('52998224725', null)).toBe('52998224725');
    });

    it('sem tipo, ainda normaliza telefone valido', () => {
      expect(normalizarChave('98988035646', null)).toBe('+5598988035646');
    });

    it('nunca mexe em e-mail mesmo sem tipo', () => {
      expect(normalizarChave('marcio@codemed.com.br', null)).toBe('marcio@codemed.com.br');
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
