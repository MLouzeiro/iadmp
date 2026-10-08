import { z } from 'zod';

export const membroSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  dataNascimento: z.string().optional(),
  endereco: z.string().optional(),
  congregacao: z.string().optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'TRANSFERIDO', 'FALECIDO']).optional(),
  ministerioId: z.string().optional(),
  departamentoId: z.string().optional(),
  observacoes: z.string().optional(),
});

export const liderancaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cargo: z.string().min(1, 'Cargo é obrigatório'),
  biografia: z.string().optional(),
  ordemExibicao: z.number().optional(),
  publico: z.boolean().optional(),
  ativo: z.boolean().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  membroId: z.string().optional(),
  ministerioId: z.string().optional(),
});

export const eventoSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    categoriaId: z.string().optional(),
    dataInicio: z.string().min(1, 'Data de início é obrigatória'),
    dataEvento: z.string().min(1, 'Data do evento é obrigatória'),
    dataFim: z.string().optional(),
    inscricoesAbremEm: z.string().optional(),
    inscricoesFechamEm: z.string().optional(),
    tema: z.string().optional(),
    preletores: z.array(z.string()).optional(),
    diasDuracao: z.number().int().min(1).optional(),
    status: z.enum(['PLANEJADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']).optional(),
    observacoes: z.string().optional(),
    local: z.string().optional(),
    responsavelGeral: z.string().optional(),
    publicarNoSite: z.boolean().optional(),
    orcamentoPrevisto: z.number().optional(),
    aceitaInscricoes: z.boolean().optional(),
    limiteInscricoes: z.number().int().min(0).optional(),
    taxaInscricao: z.number().min(0).optional(),
    chavePix: z.string().optional(),
    tipoChavePix: z.enum(['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA']).optional(),
    nomeRecebedor: z.string().optional(),
    cidadeRecebedor: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.dataFim && val.dataEvento && new Date(val.dataFim) < new Date(val.dataEvento)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dataFim'],
        message: 'Data fim deve ser igual ou posterior à data do evento',
      });
    }
    if (
      val.inscricoesAbremEm &&
      val.inscricoesFechamEm &&
      new Date(val.inscricoesFechamEm) < new Date(val.inscricoesAbremEm)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['inscricoesFechamEm'],
        message: 'Fechamento das inscrições deve ser igual ou posterior à abertura',
      });
    }
  });

export const avisoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  imagem: z.string().optional(),
  categoria: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'EXPIRADO']).optional(),
  publicoAlvo: z.string().optional(),
  publicarNoSite: z.boolean().optional(),
  exibirNoPainel: z.boolean().optional(),
  destaque: z.boolean().optional(),
});

export const liturgiaSchema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  horario: z.string().optional(),
  dirigente: z.string().optional(),
  pregador: z.string().optional(),
  tema: z.string().optional(),
  observacoes: z.string().optional(),
  eventoId: z.string().optional(),
});

export const liturgiaItemSchema = z.object({
  ordem: z.number().min(1),
  titulo: z.string().min(1, 'Título é obrigatório'),
  responsavel: z.string().optional(),
  horarioPrevisto: z.string().optional(),
  duracao: z.string().optional(),
  observacao: z.string().optional(),
});

export const financeiroSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.number().min(0, 'Valor deve ser positivo'),
  data: z.string().optional(),
  tipo: z.enum(['ENTRADA', 'SAIDA']),
  categoria: z.enum(['DIZIMO', 'OFERTA', 'DOACAO', 'INSCRICAO', 'DESPESA', 'OUTRO']).optional(),
  fornecedor: z.string().optional(),
  responsavel: z.string().optional(),
  observacoes: z.string().optional(),
  categoriaFinanceiraId: z.string().optional(),
});

export const inscricaoPublicaSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto').max(120),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().max(30).optional().or(z.literal('')),
  observacoes: z.string().max(500).optional().or(z.literal('')),
});

export const inscricaoAdminSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto').max(120),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().max(30).optional().or(z.literal('')),
  membroId: z.string().optional(),
  status: z.enum(['PENDENTE', 'CONFIRMADA', 'CANCELADA', 'REALIZADA']).optional(),
  valorPrevisto: z.number().min(0).optional(),
  observacoes: z.string().max(500).optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});
