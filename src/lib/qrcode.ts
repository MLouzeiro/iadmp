/**
 * Gerador de QR Code (modo byte, correção de erro L) renderizado como SVG.
 * Implementação própria — sem dependências externas.
 *
 * Suporta payloads até ~600 bytes (mais que suficiente para BR Code PIX,
 * que fica tipicamente entre 150 e 300 bytes).
 */

// Tabelas do padrão QR (ISO/IEC 18004)
const RS_BLOCKS_L: Record<number, number[][]> = {
  1: [[26, 19]], 2: [[44, 34]], 3: [[70, 55]], 4: [[100, 80]], 5: [[134, 108]],
  6: [[172, 136]], 7: [[196, 156]], 8: [[242, 194]], 9: [[292, 232]], 10: [[346, 274]],
};

const ALIGN_POS: Record<number, number[]> = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGenerator(n: number): number[] {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      next[j] ^= g[j];
      next[j + 1] ^= gfMul(g[j], GF_EXP[i]);
    }
    g = next;
  }
  return g;
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGenerator(ecLen);
  const res = new Array(ecLen).fill(0);
  for (const d of data) {
    const factor = d ^ res[0];
    res.shift();
    res.push(0);
    for (let i = 0; i < gen.length - 1; i++) {
      res[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return res;
}

function pad(bits: number[], total: number): number[] {
  while (bits.length < total && bits.length + 4 <= total) {
    bits.push(0, 0, 0, 0);
  }
  while (bits.length < total) bits.push(0);
  return bits;
}

function bitBuffer(): { push(v: number, len: number): void; bits: number[] } {
  const bits: number[] = [];
  return {
    push(v: number, len: number) {
      for (let i = len - 1; i >= 0; i--) bits.push((v >> i) & 1);
    },
    bits,
  };
}

function utf8Bytes(s: string): number[] {
  return Array.from(new TextEncoder().encode(s));
}

function chooseVersion(byteLen: number): number {
  for (let v = 1; v <= 10; v++) {
    const [[total, data]] = RS_BLOCKS_L[v];
    const cci = v <= 9 ? 8 : 16;
    const capacityBits = data * 8 - 4 - cci;
    if (byteLen <= Math.floor(capacityBits / 8)) return v;
  }
  throw new Error('Payload longo demais para QR (limite ~600 bytes)');
}

function buildMatrix(dataBits: number[], version: number): number[][] {
  const size = version * 4 + 17;
  const matrix: number[][] = Array.from({ length: size }, () => new Array(size).fill(-1));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  const setFinder = (r: number, c: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const inRing = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
          (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6));
        const inCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        matrix[rr][cc] = inRing || inCore ? 1 : 0;
        reserved[rr][cc] = true;
      }
    }
  };
  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // Timing
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  // Alignment
  const pos = ALIGN_POS[version] || [];
  for (const r of pos) {
    for (const c of pos) {
      if (reserved[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const rr = r + dr, cc = c + dc;
          const ring = Math.max(Math.abs(dr), Math.abs(dc));
          matrix[rr][cc] = ring === 1 ? 0 : 1;
          reserved[rr][cc] = true;
        }
      }
    }
  }

  // Reserva formato (dark module incluso)
  for (let i = 0; i < 9; i++) {
    if (!reserved[8][i]) { reserved[8][i] = true; matrix[8][i] = 0; }
    if (!reserved[i][8]) { reserved[i][8] = true; matrix[i][8] = 0; }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }
  matrix[size - 8][8] = 1;
  reserved[size - 8][8] = true;

  // Posiciona dados em zig-zag
  let bitIdx = 0;
  let up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5;
    for (let i = 0; i < size; i++) {
      const row = up ? size - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (reserved[row][cc]) continue;
        matrix[row][cc] = bitIdx < dataBits.length ? dataBits[bitIdx++] : 0;
      }
    }
    up = !up;
  }

  // Máscara 0 (alternância) + informação de formato (EC level L = 01, mask 0)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      if ((r + c) % 2 === 0) matrix[r][c] ^= 1;
    }
  }

  const fmt = 0b011011110100101; // L + mask 0
  for (let i = 0; i < 15; i++) {
    const bit = (fmt >> (14 - i)) & 1;
    if (i < 6) matrix[8][i] = bit;
    else if (i < 8) matrix[8][i + 1] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    if (i < 8) matrix[size - 1 - i][8] = bit;
    else matrix[8][size - 15 + i] = bit;
  }

  return matrix;
}

/** Gera o QR do payload e devolve um SVG pronto para injetar no DOM. */
export function gerarQRSvg(payload: string, tamanho = 240): string {
  const bytes = utf8Bytes(payload);
  const version = chooseVersion(bytes.length);
  const [[total, dataLen]] = RS_BLOCKS_L[version];
  const ecLen = total - dataLen;

  const buf = bitBuffer();
  buf.push(0b0100, 4); // modo byte
  buf.push(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) buf.push(b, 8);
  const bits = pad(buf.bits, dataLen * 8);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    codewords.push(v);
  }
  const ec = rsEncode(codewords, ecLen);

  const all: number[] = [];
  for (const c of codewords) all.push(c);
  for (const e of ec) all.push(e);

  const dataBits: number[] = [];
  for (const c of all) {
    for (let i = 7; i >= 0; i--) dataBits.push((c >> i) & 1);
  }

  const matrix = buildMatrix(dataBits, version);
  const size = matrix.length;
  const quiet = 2;
  const totalSize = size + quiet * 2;
  const px = tamanho / totalSize;

  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        rects += `<rect x="${(c + quiet) * px}" y="${(r + quiet) * px}" width="${px + 0.5}" height="${px + 0.5}"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 ${tamanho} ${tamanho}" shape-rendering="crispEdges"><rect width="${tamanho}" height="${tamanho}" fill="#fff"/><g fill="#000">${rects}</g></svg>`;
}
