/**
 * Gerador de QR Code (modo byte, correção de erro L) renderizado como SVG.
 * Implementação própria — sem dependências externas (ISO/IEC 18004).
 *
 * Suporta payloads até ~271 bytes (mais que suficiente para BR Code PIX,
 * que fica tipicamente entre 150 e 300 bytes).
 */

// Nível L: grupos de [data por bloco, ec por bloco, quantidade de blocos]
const RS_BLOCKS_L: Record<number, [number, number, number][]> = {
  1: [[19, 7, 1]], 2: [[34, 10, 1]], 3: [[55, 15, 1]], 4: [[80, 20, 1]], 5: [[108, 26, 1]],
  6: [[68, 18, 2]], 7: [[78, 20, 2]], 8: [[97, 24, 2]], 9: [[116, 30, 2]],
  10: [[68, 18, 2], [69, 18, 2]],
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

/** Terminador (até 4 zeros), alinhamento de byte e bytes de preenchimento 0xEC/0x11. */
function pad(bits: number[], total: number): number[] {
  for (let i = 0; i < 4 && bits.length < total; i++) bits.push(0);
  while (bits.length < total && bits.length % 8 !== 0) bits.push(0);
  let b = 0xec;
  while (bits.length + 8 <= total) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
    b = b === 0xec ? 0x11 : 0xec;
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
    const totalData = RS_BLOCKS_L[v].reduce((acc, [k, , n]) => acc + k * n, 0);
    const cci = v <= 9 ? 8 : 16;
    const capacityBits = totalData * 8 - 4 - cci;
    if (byteLen <= Math.floor(capacityBits / 8)) return v;
  }
  throw new Error('Payload longo demais para QR (limite ~271 bytes)');
}

/** Codewords de dados + EC com blocos intercalados, conforme ISO/IEC 18004. */
function codewordsInterleaved(version: number, bytes: number[]): number[] {
  const groups = RS_BLOCKS_L[version];
  const totalData = groups.reduce((acc, [k, , n]) => acc + k * n, 0);
  const ecLen = groups[0][1];

  const buf = bitBuffer();
  buf.push(0b0100, 4); // modo byte
  buf.push(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) buf.push(b, 8);
  const bits = pad(buf.bits, totalData * 8);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    data.push(v);
  }

  const dataBlocks: number[][] = [];
  let off = 0;
  for (const [k, , n] of groups) {
    for (let b = 0; b < n; b++) {
      dataBlocks.push(data.slice(off, off + k));
      off += k;
    }
  }
  const ecBlocks = dataBlocks.map((b) => rsEncode(b, ecLen));

  const out: number[] = [];
  const maxK = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxK; i++) for (const b of dataBlocks) if (i < b.length) out.push(b[i]);
  for (let i = 0; i < ecLen; i++) for (const b of ecBlocks) out.push(b[i]);
  return out;
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

  // Alignment — pula apenas os 3 que colidem com os finders (6,6), (6,last), (last,6);
  // os que cruzam o timing devem ser desenhados e reservados.
  const pos = ALIGN_POS[version] || [];
  if (pos.length) {
    const last = pos[pos.length - 1];
    for (const r of pos) {
      for (const c of pos) {
        if ((r === 6 && c === 6) || (r === 6 && c === last) || (r === last && c === 6)) continue;
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
  }

  // Version information (versões >= 7): 18 bits com BCH(18,6), dois blocos espelhados
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const vBits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const bit = (vBits >> i) & 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      matrix[b][a] = bit;
      reserved[b][a] = true;
      matrix[a][b] = bit;
      reserved[a][b] = true;
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

  // Máscara 0 (alternância) — só em módulos de dados
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      if ((r + c) % 2 === 0) matrix[r][c] ^= 1;
    }
  }

  // Informação de formato: EC level L (01) + máscara 0 — BCH(15,5) com máscara 0x5412
  const fmt = 0b111011111000100;
  const fb = (i: number) => (fmt >> i) & 1;
  // Cópia 1 (topo-esquerda)
  for (let i = 0; i <= 5; i++) matrix[i][8] = fb(i);
  matrix[7][8] = fb(6);
  matrix[8][8] = fb(7);
  matrix[8][7] = fb(8);
  for (let i = 9; i < 15; i++) matrix[8][14 - i] = fb(i);
  // Cópia 2 (linha 8 à direita + coluna 8 embaixo)
  for (let i = 0; i < 8; i++) matrix[8][size - 1 - i] = fb(i);
  for (let i = 8; i < 15; i++) matrix[size - 15 + i][8] = fb(i);
  // Dark module — sempre escuro
  matrix[size - 8][8] = 1;

  return matrix;
}

/** Gera a matriz de módulos do QR (0 = claro, 1 = escuro), sem quiet zone. */
export function gerarQrMatriz(payload: string): number[][] {
  const bytes = utf8Bytes(payload);
  const version = chooseVersion(bytes.length);
  const all = codewordsInterleaved(version, bytes);

  const dataBits: number[] = [];
  for (const c of all) {
    for (let i = 7; i >= 0; i--) dataBits.push((c >> i) & 1);
  }

  return buildMatrix(dataBits, version);
}

/** Gera o QR do payload e devolve um SVG pronto para injetar no DOM. */
export function gerarQRSvg(payload: string, tamanho = 240): string {
  const matrix = gerarQrMatriz(payload);
  const size = matrix.length;
  const quiet = 4;
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
