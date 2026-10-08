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
});
