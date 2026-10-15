import { VERSICULOS_TEMAS, temaDoPilar, versiculoDoTema } from '@/data/versiculos-temas';

describe('data/versiculos-temas', () => {
  describe('VERSICULOS_TEMAS', () => {
    it('contém pelo menos um versículo completo para cada tema esperado', () => {
      const temas = ['palavra', 'palavraDoDia', 'comunhao', 'adoracao', 'servico', 'geral'];
      for (const tema of temas) {
        const pool = VERSICULOS_TEMAS[tema as keyof typeof VERSICULOS_TEMAS];
        expect(pool.length).toBeGreaterThan(0);
        for (const v of pool) {
          expect(v.referencia).toBeTruthy();
          expect(v.versiculo).toBeTruthy();
          expect(v.reflexao).toBeTruthy();
        }
      }
    });
  });

  describe('temaDoPilar', () => {
    it('mapeia títulos dos pilares padrão para o tema correto', () => {
      expect(temaDoPilar('Palavra de Deus')).toBe('palavra');
      expect(temaDoPilar('Palavra do Dia')).toBe('palavraDoDia');
      expect(temaDoPilar('Comunhão')).toBe('comunhao');
      expect(temaDoPilar('Adoração')).toBe('adoracao');
      expect(temaDoPilar('Serviços')).toBe('servico');
    });

    it('ignora acentos e maiúsculas no título', () => {
      expect(temaDoPilar('PALAVRA DO DIA')).toBe('palavraDoDia');
      expect(temaDoPilar('comunhao')).toBe('comunhao');
      expect(temaDoPilar('Adoracão')).toBe('adoracao');
    });

    it('usa "palavra do dia" antes de "palavra" para não cair no tema errado', () => {
      expect(temaDoPilar('Palavra do Dia')).not.toBe('palavra');
    });

    it('retorna "geral" para títulos desconhecidos', () => {
      expect(temaDoPilar('Missões')).toBe('geral');
      expect(temaDoPilar('')).toBe('geral');
    });
  });

  describe('versiculoDoTema', () => {
    it('retorna um versículo válido do pool do tema', () => {
      const verso = versiculoDoTema('comunhao');
      expect(verso.referencia).toBeTruthy();
      expect(verso.versiculo).toBeTruthy();
      expect(verso.reflexao).toBeTruthy();
      expect(VERSICULOS_TEMAS.comunhao).toContainEqual(verso);
    });

    it('é determinístico para o mesmo timestamp (mesmo slot de 12h)', () => {
      const agora = new Date('2026-10-14T10:00:00.000Z').getTime();
      const a = versiculoDoTema('palavra', agora);
      const b = versiculoDoTema('palavra', agora);
      expect(a).toEqual(b);
    });

    it('gira para outro versículo quando o slot de 12h muda (pool > 1)', () => {
      const pool = VERSICULOS_TEMAS.palavra;
      if (pool.length < 2) return;
      const inicio = new Date('2026-10-01T00:00:00.000Z').getTime();
      const slot12h = 12 * 60 * 60 * 1000;
      const v1 = versiculoDoTema('palavra', inicio);
      const v2 = versiculoDoTema('palavra', inicio + slot12h);
      expect(v1).not.toEqual(v2);
    });

    it('cai no pool "geral" para tema desconhecido', () => {
      const verso = versiculoDoTema('inexistente' as keyof typeof VERSICULOS_TEMAS);
      expect(VERSICULOS_TEMAS.geral).toContainEqual(verso);
    });
  });
});
