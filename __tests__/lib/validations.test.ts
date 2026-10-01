import {
  membroSchema,
  eventoSchema,
  avisoSchema,
  financeiroSchema,
  loginSchema,
} from '@/lib/validations';

describe('validations — schemas Zod', () => {
  describe('membroSchema', () => {
    it('rejeita membro sem nome', () => {
      const result = membroSchema.safeParse({ nome: '' });
      expect(result.success).toBe(false);
    });

    it('aceita membro com dados válidos', () => {
      const result = membroSchema.safeParse({
        nome: 'João Silva',
        email: 'joao@example.com',
        status: 'ATIVO',
      });
      expect(result.success).toBe(true);
    });

    it('aceita membro sem email (opcional)', () => {
      const result = membroSchema.safeParse({ nome: 'Maria' });
      expect(result.success).toBe(true);
    });

    it('rejeita status fora do enum', () => {
      const result = membroSchema.safeParse({ nome: 'Ana', status: 'FOO' });
      expect(result.success).toBe(false);
    });
  });

  describe('eventoSchema', () => {
    it('rejeita evento sem datas', () => {
      const result = eventoSchema.safeParse({ nome: 'Culto' });
      expect(result.success).toBe(false);
    });

    it('aceita evento com dados válidos', () => {
      const result = eventoSchema.safeParse({
        nome: 'Congresso',
        dataInicio: '2026-10-01',
        dataEvento: '2026-10-03',
        status: 'PLANEJADO',
        publicarNoSite: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('avisoSchema', () => {
    it('rejeita aviso sem titulo/descricao', () => {
      expect(avisoSchema.safeParse({ titulo: '', descricao: '' }).success).toBe(false);
    });

    it('aceita aviso válido', () => {
      const result = avisoSchema.safeParse({
        titulo: 'Reunião de líderes',
        descricao: 'Sexta às 19h',
        prioridade: 'ALTA',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('financeiroSchema', () => {
    it('rejeita valor negativo', () => {
      const result = financeiroSchema.safeParse({
        descricao: 'Dízimo',
        valor: -10,
        tipo: 'ENTRADA',
      });
      expect(result.success).toBe(false);
    });

    it('aceita registro válido', () => {
      const result = financeiroSchema.safeParse({
        descricao: 'Dízimo',
        valor: 100,
        tipo: 'ENTRADA',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('rejeita email inválido', () => {
      const result = loginSchema.safeParse({ email: 'not-an-email', password: '123456' });
      expect(result.success).toBe(false);
    });

    it('rejeita senha com menos de 6 caracteres', () => {
      const result = loginSchema.safeParse({ email: 'a@b.com', password: '123' });
      expect(result.success).toBe(false);
    });

    it('aceita credenciais válidas', () => {
      const result = loginSchema.safeParse({ email: 'admin@igreja.com', password: 'secret123' });
      expect(result.success).toBe(true);
    });
  });
});
