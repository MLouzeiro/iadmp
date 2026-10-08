/**
 * Utilitários de data do projeto.
 *
 * Problema original (bug 11/10 -> 10/10): `new Date("2026-10-11")` é interpretado
 * como MEIA-NOITE UTC. No horário do Brasil (UTC-3) isso é 10/10 21:00, e
 * `toLocaleDateString('pt-BR')` passava a exibir 10/10.
 *
 * Convenção adotada:
 * - Campos SOMENTE DE DATA (input `type="date"`) são gravados como meia-noite UTC
 *   (`parseDataDateOnly`) — a data civil fica preservada na representação.
 * - A formatação desses campos usa os componentes **UTC** (`getUTC*`), portanto a
 *   data exibida é sempre a data civil correta, independente do fuso de quem vê.
 * - Campos com HORÁRIO real usam `formatarHora` (componentes UTC, coerentes com o
 *   valor digitado) e não são afetados pelo deslocamento de fuso.
 */

/** Interpreta `YYYY-MM-DD` como data LOCAL (fuso do servidor/usuário). Usado em janelas de período. */
export function parseDataLocal(valor: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!m) return new Date(valor);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * Interpreta `YYYY-MM-DD` como data CIVIL, gravando em meia-noite UTC.
 * Evita o deslocamento de um dia na exibição (bug 11/10 -> 10/10).
 */
export function parseDataDateOnly(valor: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!m) return new Date(valor);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/** Converte Date/ISO em `YYYY-MM-DD` (componentes UTC) — pronto para `<input type="date">`. */
export function paraInputDate(valor: string | Date | null | undefined): string {
  if (!valor) return '';
  const d = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** `11/10/2026` — componentes UTC, sempre fiel à data civil gravada. */
export function formatarDataBR(valor: string | Date | null | undefined): string {
  if (!valor) return '';
  const d = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

/** `11 out 2026` — forma curta com mês abreviado (UTC). */
export function formatarDataCurta(valor: string | Date | null | undefined): string {
  if (!valor) return '';
  const d = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(d.getTime())) return '';
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${String(d.getUTCDate()).padStart(2, '0')} ${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** `11 de outubro de 2026` — forma longa (UTC). */
export function formatarDataLonga(valor: string | Date | null | undefined): string {
  if (!valor) return '';
  const d = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(d.getTime())) return '';
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  return `${d.getUTCDate()} de ${meses[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

/** `19:30` — componentes UTC (coerente com o horário digitado). */
export function formatarHora(valor: string | Date | null | undefined): string {
  if (!valor) return '';
  const d = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/** `11/10/2026 19:30` — data + hora (UTC). */
export function formatarDataHora(valor: string | Date | null | undefined): string {
  const data = formatarDataBR(valor);
  const hora = formatarHora(valor);
  if (!data) return '';
  return hora && hora !== '00:00' ? `${data} ${hora}` : data;
}

/** Dia do mês (UTC) — útil para badges em listas. */
export function diaDoMes(valor: string | Date | null | undefined): string {
  if (!valor) return '';
  const d = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(d.getTime())) return '';
  return String(d.getUTCDate()).padStart(2, '0');
}

/**
 * Dias at\u00e9 uma data (UTC).
 * - Positivo = futuro (ex.: 12 = "em 12 dias")
 * - 0 = hoje
 * - Negativo = passado (ex.: -3 = "h\u00e1 3 dias")
 * - 
ull = data inv\u00e1lida ou ausente
 */
export function diasAte(valor: string | Date | null | undefined): number | null {
  if (!valor) return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(d.getTime())) return null;
  const agora = new Date();
  const alvoUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const hojeUTC = Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate());
  return Math.round((alvoUTC - hojeUTC) / 86400000);
}

/** Formata a contagem regressiva: "em 12 dias", "hoje", "há 3 dias". */
export function formatarContagem(dias: number | null): string {
  if (dias === null) return '';
  if (dias > 1) return `em ${dias} dias`;
  if (dias === 1) return 'amanhã';
  if (dias === 0) return 'hoje';
  if (dias === -1) return 'ontem';
  return `há ${Math.abs(dias)} dias`;
}