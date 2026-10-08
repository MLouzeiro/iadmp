/**
 * @jest-environment node
 */
import {
  parseDataLocal,
  parseDataDateOnly,
  paraInputDate,
  formatarDataBR,
  formatarDataCurta,
  formatarDataLonga,
  formatarHora,
  formatarDataHora,
  diaDoMes,
  diasAte,
  formatarContagem,
} from '@/lib/datas';

describe('lib/datas', () => {
  describe('parseDataDateOnly', () => {
    it('grava YYYY-MM-DD como meia-noite UTC (sem deslocamento de dia)', () => {
      const d = parseDataDateOnly('2026-10-11');
      expect(d.toISOString()).toBe('2026-10-11T00:00:00.000Z');
    });

    it('preserva a data civil mesmo em fuso negativo (bug 11/10 -> 10/10)', () => {
      const d = parseDataDateOnly('2026-10-11');
      expect(formatarDataBR(d)).toBe('11/10/2026');
    });
  });

  describe('parseDataLocal', () => {
    it('interpreta YYYY-MM-DD como data local (janelas de período)', () => {
      const d = parseDataLocal('2026-01-01');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(0);
      expect(d.getDate()).toBe(1);
    });
  });

  describe('formatarDataBR', () => {
    it('formata ISO UTC como dd/mm/aaaa', () => {
      expect(formatarDataBR('2026-10-11T00:00:00.000Z')).toBe('11/10/2026');
    });

    it('nao desloca um dia para tras (regressao do bug)', () => {
      const iso = parseDataDateOnly('2026-10-11').toISOString();
      expect(formatarDataBR(iso)).toBe('11/10/2026');
      expect(formatarDataBR(iso)).not.toBe('10/10/2026');
    });

    it('retorna vazio para valor nulo ou invalido', () => {
      expect(formatarDataBR(null)).toBe('');
      expect(formatarDataBR(undefined)).toBe('');
      expect(formatarDataBR('nao-e-data')).toBe('');
    });

    it('funciona para datas de fim de ano', () => {
      expect(formatarDataBR('2026-12-31T00:00:00.000Z')).toBe('31/12/2026');
      expect(formatarDataBR('2027-01-01T00:00:00.000Z')).toBe('01/01/2027');
    });
  });

  describe('formatarDataCurta / formatarDataLonga', () => {
    it('curta usa mes abreviado', () => {
      expect(formatarDataCurta('2026-10-11T00:00:00.000Z')).toBe('11 out 2026');
    });

    it('longa usa mes por extenso', () => {
      expect(formatarDataLonga('2026-10-11T00:00:00.000Z')).toBe('11 de outubro de 2026');
    });
  });

  describe('formatarHora / formatarDataHora', () => {
    it('hora usa componentes UTC', () => {
      expect(formatarHora('2026-10-11T19:30:00.000Z')).toBe('19:30');
    });

    it('data+hora mostra hora apenas quando relevante', () => {
      expect(formatarDataHora('2026-10-11T00:00:00.000Z')).toBe('11/10/2026');
      expect(formatarDataHora('2026-10-11T19:30:00.000Z')).toBe('11/10/2026 19:30');
    });
  });

  describe('paraInputDate', () => {
    it('converte ISO para YYYY-MM-DD (input date)', () => {
      expect(paraInputDate('2026-10-11T00:00:00.000Z')).toBe('2026-10-11');
    });

    it('retorna vazio para nulo', () => {
      expect(paraInputDate(null)).toBe('');
    });
  });

  describe('diaDoMes', () => {
    it('retorna o dia com 2 digitos', () => {
      expect(diaDoMes('2026-10-11T00:00:00.000Z')).toBe('11');
      expect(diaDoMes('2026-10-05T00:00:00.000Z')).toBe('05');
    });
  });

  describe('diasAte', () => {
    it('retorna null para data inv\u00e1lida', () => {
      expect(diasAte(null)).toBeNull();
      expect(diasAte(undefined)).toBeNull();
      expect(diasAte('not-a-date')).toBeNull();
    });

    it('retorna 0 para hoje', () => {
      const hoje = new Date();
      const iso = hoje.toISOString().slice(0, 10);
      expect(diasAte(iso)).toBe(0);
    });

    it('retorna positivo para data futura', () => {
      const futura = new Date();
      futura.setUTCDate(futura.getUTCDate() + 10);
      const iso = futura.toISOString().slice(0, 10);
      expect(diasAte(iso)).toBe(10);
    });

    it('retorna negativo para data passada', () => {
      const passada = new Date();
      passada.setUTCDate(passada.getUTCDate() - 5);
      const iso = passada.toISOString().slice(0, 10);
      expect(diasAte(iso)).toBe(-5);
    });
  });

  describe('formatarContagem', () => {
    it('formata dias positivos', () => {
      expect(formatarContagem(12)).toBe('em 12 dias');
    });

    it('formata 1 dia como amanh\u00e3', () => {
      expect(formatarContagem(1)).toBe('amanh\u00e3');
    });

    it('formata 0 como hoje', () => {
      expect(formatarContagem(0)).toBe('hoje');
    });

    it('formata -1 como ontem', () => {
      expect(formatarContagem(-1)).toBe('ontem');
    });

    it('formata dias negativos', () => {
      expect(formatarContagem(-3)).toBe('h\u00e1 3 dias');
    });

    it('retorna vazio para null', () => {
      expect(formatarContagem(null)).toBe('');
    });
  });
});