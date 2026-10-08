/**
 * Geração de PIX estático (BR Code / "copia e cola") no padrão EMV do Banco Central.
 *
 * Layout do payload:
 *  00 - Payload Format Indicator (01)
 *  01 - Point of Initiation (12 = dinâmico com reuso, 11 = estático)
 *  26 - Merchant Account Information (GUI br.gov.bcb.pix + chave [+ descrição])
 *  52 - Merchant Category Code (0000)
 *  53 - Transaction Currency (986 = BRL)
 *  54 - Transaction Amount (opcional, 2 casas)
 *  58 - Country Code (BR)
 *  59 - Merchant Name (máx. 25)
 *  60 - Merchant City (máx. 15)
 *  62 - Additional Data Field (TXID em 05)
 *  63 - CRC16-CCITT (0xFFFF, polinômio 0x1021, inicial '6304')
 */

export interface PixConfig {
  chave: string;
  tipoChave?: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA' | null;
  nomeRecebedor: string;
  cidadeRecebedor: string;
  valor?: number | null;
  descricao?: string | null;
  txid?: string | null;
}

function tlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

/** CRC16-CCITT (0xFFFF) — exigência do padrão EMV/PIX. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function sanitizar(valor: string, max: number): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .slice(0, max);
}

/** Normaliza chave PIX: telefone ganha +55, e-mail/caixa alta não se aplica. */
export function normalizarChave(chave: string, tipo?: string | null): string {
  const k = chave.trim();
  if (!k) return k;
  const t = (tipo || '').toUpperCase();
  if (t === 'TELEFONE' || /^(\+?55)?\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(k)) {
    const digitos = k.replace(/\D/g, '');
    return `+${digitos.startsWith('55') ? digitos : `55${digitos}`}`;
  }
  return k;
}

/**
 * Gera o BR Code (payload EMV) do PIX estático.
 * Lança erro se faltar chave, nome ou cidade.
 */
export function gerarBrCode(config: PixConfig): string {
  const chave = normalizarChave(config.chave, config.tipoChave);
  if (!chave) throw new Error('Chave PIX é obrigatória');
  const nome = sanitizar(config.nomeRecebedor || '', 25);
  const cidade = sanitizar(config.cidadeRecebedor || 'SAO PAULO', 15);
  if (!nome) throw new Error('Nome do recebedor é obrigatório');
  if (!cidade) throw new Error('Cidade do recebedor é obrigatória');

  const txid = (config.txid || '***').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';

  let merchantAccount = tlv('00', 'br.gov.bcb.pix') + tlv('01', chave);
  if (config.descricao) {
    const desc = sanitizar(config.descricao, 20);
    if (desc) merchantAccount += tlv('02', desc);
  }

  let payload =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('26', merchantAccount) +
    tlv('52', '0000') +
    tlv('53', '986');

  if (config.valor != null && config.valor > 0) {
    payload += tlv('54', config.valor.toFixed(2));
  }

  payload += tlv('58', 'BR') + tlv('59', nome) + tlv('60', cidade) + tlv('62', tlv('05', txid));

  payload += '6304';
  payload += crc16(payload);
  return payload;
}

/** Formata valor monetário para exibição (R$ 12,34). */
export function formatarBRL(valor: number | string | null | undefined): string {
  const n = typeof valor === 'string' ? parseFloat(valor) : valor || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
