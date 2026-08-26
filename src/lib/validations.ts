import { z } from 'zod';

export const membroSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
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
  nome: z.string().min(1, 'Nome e obrigatorio'),
  cargo: z.string().min(1, 'Cargo e obrigatorio'),
  biografia: z.string().optional(),
  ordemExibicao: z.number().optional(),
  publico: z.boolean().optional(),
  ativo: z.boolean().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  membroId: z.string().optional(),
  ministerioId: z.string().optional(),
});

export const eventoSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  categoriaId: z.string().optional(),
  dataInicio: z.string().min(1, 'Data de inicio e obrigatoria'),
  dataEvento: z.string().min(1, 'Data do evento e obrigatoria'),
  dataFim: z.string().optional(),
  tema: z.string().optional(),
  preletores: z.array(z.string()).optional(),
  diasDuracao: z.number().optional(),
  status: z.enum(['PLANEJADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']).optional(),
  observacoes: z.string().optional(),
  local: z.string().optional(),
  responsavelGeral: z.string().optional(),
  publicarNoSite: z.boolean().optional(),
  orcamentoPrevisto: z.number().optional(),
});

export const avisoSchema = z.object({
  titulo: z.string().min(1, 'Titulo e obrigatorio'),
  descricao: z.string().min(1, 'Descricao e obrigatoria'),
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
  data: z.string().min(1, 'Data e obrigatoria'),
  horario: z.string().optional(),
  dirigente: z.string().optional(),
  pregador: z.string().optional(),
  tema: z.string().optional(),
  observacoes: z.string().optional(),
  eventoId: z.string().optional(),
});

export const liturgiaItemSchema = z.object({
  ordem: z.number().min(1),
  titulo: z.string().min(1, 'Titulo e obrigatorio'),
  responsavel: z.string().optional(),
  horarioPrevisto: z.string().optional(),
  duracao: z.string().optional(),
  observacao: z.string().optional(),
});

export const financeiroSchema = z.object({
  descricao: z.string().min(1, 'Descricao e obrigatoria'),
  valor: z.number().min(0, 'Valor deve ser positivo'),
  data: z.string().optional(),
  tipo: z.enum(['ENTRADA', 'SAIDA']),
  fornecedor: z.string().optional(),
  responsavel: z.string().optional(),
  observacoes: z.string().optional(),
  categoriaFinanceiraId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
});
