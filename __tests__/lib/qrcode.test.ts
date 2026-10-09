/**
 * @jest-environment node
 */
import jsQR from 'jsqr';
import { gerarQrMatriz, gerarQRSvg } from '@/lib/qrcode';
import { gerarBrCode } from '@/lib/pix';

/** Rasteriza a matriz do QR (quiet zone de 4 módulos, escala 4px) e decodifica. */
function decodificar(modules: number[][]): string | null {
  const size = modules.length;
  const quiet = 4;
  const scale = 4;
  const dim = (size + quiet * 2) * scale;
  const rgba = new Uint8ClampedArray(dim * dim * 4).fill(255);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c] !== 1) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const x = (c + quiet) * scale + dx;
          const y = (r + quiet) * scale + dy;
          const i = (y * dim + x) * 4;
          rgba[i] = 0;
          rgba[i + 1] = 0;
          rgba[i + 2] = 0;
        }
      }
    }
  }
  const res = jsQR(rgba, dim, dim);
  return res ? res.data : null;
}

function brCodeReal(): string {
  return gerarBrCode({
    chave: '12345678909',
    tipoChave: 'CPF',
    nomeRecebedor: 'IADMP - Igreja',
    cidadeRecebedor: 'Sao Luis',
    valor: 25.5,
    descricao: 'Inscricao Congresso',
    txid: 'CMV0WVVH90001SMBIENTUWF9K',
  });
}

describe('lib/qrcode decodificacao', () => {
  it('decodifica payload curto (versao 1)', () => {
    expect(decodificar(gerarQrMatriz('hello world'))).toBe('hello world');
  });

  it('decodifica BR Code PIX real (multi-bloco, versao 7)', () => {
    const br = brCodeReal();
    expect(decodificar(gerarQrMatriz(br))).toBe(br);
  });

  it.each([
    [17, 'v1'],
    [106, 'v5'],
    [107, 'v6'],
    [154, 'v7'],
    [230, 'v9'],
    [271, 'v10'],
  ])('decodifica payload de %i bytes (%s, fronteira de versao)', (len) => {
    const payload = 'a'.repeat(len);
    expect(decodificar(gerarQrMatriz(payload))).toBe(payload);
  });

  it('mantem quiet zone de pelo menos 4 modulos no SVG', () => {
    const payload = 'teste de quiet zone';
    const matrix = gerarQrMatriz(payload);
    const size = matrix.length;
    const svg = gerarQRSvg(payload, 240);
    const px = 240 / (size + 8);
    const primeiroRect = svg.match(/<rect x="([\d.]+)"/);
    expect(primeiroRect).not.toBeNull();
    expect(parseFloat(primeiroRect![1])).toBeGreaterThanOrEqual(4 * px - 0.01);
  });
});
