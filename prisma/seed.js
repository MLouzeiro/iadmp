const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const MODULOS = [
  { nome: 'Dashboard', permissoes: ['visualizar'] },
  { nome: 'Membros', permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { nome: 'Lideranca', permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { nome: 'Eventos', permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { nome: 'Financeiro', permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { nome: 'Liturgia', permissoes: ['visualizar', 'criar', 'editar', 'excluir', 'publicar', 'imprimir', 'gerenciar_musicas', 'gerenciar_modelos', 'iniciar_culto', 'finalizar_culto'] },
  { nome: 'Avisos', permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { nome: 'Galeria', permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { nome: 'Oportunidades', permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { nome: 'Configuracoes', permissoes: ['visualizar', 'editar'] },
  { nome: 'Usuarios', permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { nome: 'Comunicacao', permissoes: ['visualizar', 'criar', 'editar', 'excluir', 'gerenciar_canais'] },
  { nome: 'Pregacoes', permissoes: ['visualizar', 'criar', 'editar', 'excluir', 'publicar', 'destacar'] },
];

const PERFIS_CONFIG = {
  SUPER_ADMIN: {
    descricao: 'Acesso total ao sistema',
    permissoes: MODULOS.flatMap(m => m.permissoes.map(a => `${m.nome.toLowerCase()}:${a}`)),
  },
  ADMIN_IGREJA: {
    descricao: 'Administrador da igreja',
    permissoes: [
      'dashboard:visualizar', 'membros:visualizar', 'membros:criar', 'membros:editar', 'membros:excluir',
      'lideranca:visualizar', 'lideranca:criar', 'lideranca:editar', 'lideranca:excluir',
      'eventos:visualizar', 'eventos:criar', 'eventos:editar', 'eventos:excluir',
      'financeiro:visualizar', 'financeiro:criar', 'financeiro:editar', 'financeiro:excluir',
      'liturgia:visualizar', 'liturgia:criar', 'liturgia:editar', 'liturgia:excluir',
      'avisos:visualizar', 'avisos:criar', 'avisos:editar', 'avisos:excluir',
      'galeria:visualizar', 'galeria:criar', 'galeria:editar', 'galeria:excluir',
      'oportunidades:visualizar', 'oportunidades:criar', 'oportunidades:editar', 'oportunidades:excluir',
      'configuracoes:visualizar', 'configuracoes:editar',
      'usuarios:visualizar', 'usuarios:criar', 'usuarios:editar',
      'comunicacao:visualizar', 'comunicacao:criar', 'comunicacao:editar', 'comunicacao:excluir', 'comunicacao:gerenciar_canais',
      'pregacoes:visualizar', 'pregacoes:criar', 'pregacoes:editar', 'pregacoes:excluir', 'pregacoes:publicar', 'pregacoes:destacar',
    ],
  },
  LIDER: {
    descricao: 'Lider de ministério ou departamento',
    permissoes: [
      'dashboard:visualizar', 'membros:visualizar', 'membros:criar', 'membros:editar',
      'lideranca:visualizar', 'eventos:visualizar', 'eventos:criar', 'eventos:editar',
      'liturgia:visualizar', 'liturgia:criar', 'liturgia:editar',
      'avisos:visualizar', 'avisos:criar', 'galeria:visualizar', 'galeria:criar',
      'comunicacao:visualizar', 'comunicacao:criar', 'comunicacao:editar',
      'pregacoes:visualizar', 'pregacoes:criar', 'pregacoes:editar',
    ],
  },
  COORDENADOR: {
    descricao: 'Coordenador de atividades',
    permissoes: [
      'dashboard:visualizar', 'membros:visualizar', 'membros:criar',
      'eventos:visualizar', 'eventos:criar', 'eventos:editar',
      'liturgia:visualizar', 'liturgia:criar',
      'avisos:visualizar', 'galeria:visualizar', 'galeria:criar',
      'comunicacao:visualizar', 'comunicacao:criar',
      'pregacoes:visualizar', 'pregacoes:criar',
    ],
  },
  MUSICO: {
    descricao: 'Músico do ministério de louvor',
    permissoes: [
      'dashboard:visualizar', 'eventos:visualizar',
      'liturgia:visualizar', 'liturgia:gerenciar_musicas',
      'galeria:visualizar',
    ],
  },
  MEMBER: {
    descricao: 'Membro comum da igreja',
    permissoes: [
      'dashboard:visualizar', 'eventos:visualizar', 'avisos:visualizar',
      'comunicacao:visualizar', 'pregacoes:visualizar',
    ],
  },
};

async function seedPermissoes() {
  console.log('Criando permissoes...');
  const created = {};
  for (const modulo of MODULOS) {
    for (const acao of modulo.permissoes) {
      const key = `${modulo.nome.toLowerCase()}:${acao}`;
      const permissao = await prisma.permissao.upsert({
        where: { modulo_acao: { modulo: modulo.nome, acao } },
        update: {},
        create: { modulo: modulo.nome, acao, descricao: `${acao} ${modulo.nome}` },
      });
      created[key] = permissao;
    }
  }
  console.log(`  ${Object.keys(created).length} permissoes criadas`);
  return created;
}

async function seedPerfis(permissoesMap) {
  console.log('Criando perfis...');
  const created = {};
  for (const [nome, config] of Object.entries(PERFIS_CONFIG)) {
    const perfil = await prisma.perfil.upsert({
      where: { nome },
      update: { descricao: config.descricao },
      create: { nome, descricao: config.descricao, isSystem: true },
    });
    created[nome] = perfil;

    for (const permKey of config.permissoes) {
      const permissao = permissoesMap[permKey];
      if (permissao) {
        await prisma.perfilPermissao.upsert({
          where: { perfilId_permissaoId: { perfilId: perfil.id, permissaoId: permissao.id } },
          update: {},
          create: { perfilId: perfil.id, permissaoId: permissao.id },
        });
      }
    }
    console.log(`  Perfil ${nome} configurado`);
  }
  return created;
}

async function main() {
  console.log('Iniciando seed do banco de dados...');

  const permissoesMap = await seedPermissoes();
  const perfisMap = await seedPerfis(permissoesMap);

  let organizacao = await prisma.organizacao.findFirst({ where: { nome: 'IADMP - Igreja Assembleia de Deus Ministerio da Promessa' } });
  if (!organizacao) {
    organizacao = await prisma.organizacao.create({
      data: { nome: 'IADMP - Igreja Assembleia de Deus Ministerio da Promessa', descricao: 'Igreja principal' },
    });
    console.log('Organizacao criada:', organizacao.nome);
  }

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@iadmp.com.br' },
    update: { role: 'SUPER_ADMIN', perfilId: perfisMap.SUPER_ADMIN.id },
    create: {
      name: 'Admin IADMP',
      email: 'admin@iadmp.com.br',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      perfilId: perfisMap.SUPER_ADMIN.id,
    },
  });
  console.log('Admin user created:', admin.email);

  await prisma.usuarioOrganizacao.upsert({
    where: { userId_organizacaoId: { userId: admin.id, organizacaoId: organizacao.id } },
    update: {},
    create: { userId: admin.id, organizacaoId: organizacao.id },
  });

  const ministeriosData = [
    { nome: 'Ministerio da Promessa', descricao: 'Ministerio principal da igreja' },
    { nome: 'Ministerio de Jovens', descricao: 'Jovens da igreja' },
    { nome: 'Ministerio de Criancas', descricao: 'Departamento de criancas' },
    { nome: 'Heroinas da Fe', descricao: 'Ministerio feminino' },
    { nome: 'Varoes de Fe', descricao: 'Ministerio masculino' },
    { nome: 'Circulo de Oracao', descricao: 'Reuniao de oracao' },
  ];

  const createdMinisterios = {};
  for (const m of ministeriosData) {
    let ministerio = await prisma.ministerio.findFirst({ where: { nome: m.nome } });
    if (!ministerio) {
      ministerio = await prisma.ministerio.create({ data: m });
    }
    createdMinisterios[m.nome] = ministerio;
  }
  console.log('Ministerios created:', ministeriosData.length);

  const departamentosData = [
    { nome: 'Louvor', descricao: 'Ministerio de louvor e adoracao' },
    { nome: 'Midia', descricao: 'Comunicacao e redes sociais' },
    { nome: 'Recepcao', descricao: 'Recepcao de visitantes' },
    { nome: 'Infantil', descricao: 'Educacao infantil' },
  ];

  for (const d of departamentosData) {
    const existing = await prisma.departamento.findFirst({ where: { nome: d.nome } });
    if (!existing) {
      await prisma.departamento.create({ data: d });
    }
  }
  console.log('Departamentos created:', departamentosData.length);

  const lideres = [
    { nome: 'Pr. Cleiginaldo Barros', cargo: 'Pastor Presidente', ordemExibicao: 1 },
    { nome: 'Pr. Walmorio', cargo: 'Pastor da Vila Sarney', ordemExibicao: 2 },
    { nome: 'Pr. Melquesedeque', cargo: 'Pastor', ordemExibicao: 3 },
    { nome: 'Dc. Marcio Louzeiro', cargo: '1 Dirigente', ordemExibicao: 4 },
    { nome: 'Missionario Cristiano', cargo: '2 Dirigente', ordemExibicao: 5 },
    { nome: 'Ayton Sena', cargo: 'Lider de Jovens', ordemExibicao: 6 },
    { nome: 'Ana Caroline', cargo: 'Lider de Jovens', ordemExibicao: 7 },
    { nome: 'Missionaria Suenne Baros', cargo: '1 Dirigente do Circulo de Oracao', ordemExibicao: 8 },
    { nome: 'Dc. Thiane Louzeiro', cargo: 'Regente das Heroinas da Fe', ordemExibicao: 9 },
    { nome: 'Dc. Dayane', cargo: 'Regente das Heroinas da Fe', ordemExibicao: 10 },
    { nome: 'Dc. Janaina Freitas', cargo: 'Lider do Dep. de Criancas', ordemExibicao: 11 },
    { nome: 'Julia', cargo: 'Lider do Dep. de Criancas', ordemExibicao: 12 },
    { nome: 'Jannes', cargo: 'Tesoureiro', ordemExibicao: 13 },
    { nome: 'Erica Lopes', cargo: 'Tesoureira', ordemExibicao: 14 },
  ];

  for (const l of lideres) {
    const existing = await prisma.lideranca.findFirst({ where: { nome: l.nome } });
    if (!existing) {
      await prisma.lideranca.create({
        data: {
          nome: l.nome,
          cargo: l.cargo,
          ordemExibicao: l.ordemExibicao,
          publico: true,
          ativo: true,
        },
      });
    }
  }
  console.log('Lideres created:', lideres.length);

  const categorias = [
    { nome: 'Culto', descricao: 'Cultos regulares', cor: '#4caf50' },
    { nome: 'Congresso', descricao: 'Congressos e conferencias', cor: '#2196f3' },
    { nome: 'Retiro', descricao: 'Retiros espirituais', cor: '#9c27b0' },
    { nome: 'Festa', descricao: 'Festas e celebracoes', cor: '#ff9800' },
    { nome: 'Ensaio', descricao: 'Ensaios e preparacoes', cor: '#607d8b' },
  ];

  for (const c of categorias) {
    const existing = await prisma.categoriaEvento.findFirst({ where: { nome: c.nome } });
    if (!existing) {
      await prisma.categoriaEvento.create({ data: c });
    }
  }
  console.log('Categorias created:', categorias.length);

  const eventos = [
    {
      nome: 'Festa Junina 2024',
      dataInicio: new Date('2024-05-01'),
      dataEvento: new Date('2024-06-15'),
      tema: 'Festa Junina Tradicional',
      status: 'CONCLUIDO',
      local: 'Igreja IADMP',
    },
    {
      nome: 'Congresso da Promessa 2024',
      dataInicio: new Date('2024-03-01'),
      dataEvento: new Date('2024-04-02'),
      dataFim: new Date('2024-04-04'),
      tema: 'Comunhao e Unidade',
      status: 'CONCLUIDO',
      local: 'Igreja IADMP',
      diasDuracao: 3,
    },
    {
      nome: 'Culto de Pascoa 2025',
      dataInicio: new Date('2025-03-15'),
      dataEvento: new Date('2025-04-20'),
      tema: 'Ressurreicao e Vida',
      status: 'CONCLUIDO',
      local: 'Igreja IADMP',
    },
    {
      nome: 'Retiro de Jovens 2025',
      dataInicio: new Date('2025-05-01'),
      dataEvento: new Date('2025-05-10'),
      dataFim: new Date('2025-05-12'),
      tema: 'Proposito e Chamado',
      status: 'CONCLUIDO',
      local: 'Acampamento',
      diasDuracao: 3,
    },
    {
      nome: 'Festa Junina 2025',
      dataInicio: new Date('2025-05-01'),
      dataEvento: new Date('2025-06-20'),
      tema: 'Tradicao e Fe',
      status: 'PLANEJADO',
      local: 'Igreja IADMP',
      publicarNoSite: true,
    },
  ];

  for (const e of eventos) {
    const existing = await prisma.evento.findFirst({ where: { nome: e.nome } });
    if (!existing) {
      await prisma.evento.create({ data: e });
      console.log('Evento created:', e.nome);
    }
  }

  const avisoExistente = await prisma.aviso.findFirst({ where: { titulo: 'Bem-vindos ao novo site!' } });
  if (!avisoExistente) {
    await prisma.aviso.create({
      data: {
        titulo: 'Bem-vindos ao novo site!',
        descricao: 'Estamos felizes em apresentar o novo site da IADMP. Confira as novidades!',
        categoria: 'GERAL',
        urgencia: 'NORMAL',
        publicarSite: true,
        destaque: true,
      },
    });
    console.log('Aviso created');
  }

  await seedLiturgiaData(organizacao.id, admin.id);
  await seedVersiculos(organizacao.id);

  console.log('Seed concluido com sucesso!');
}

async function seedLiturgiaData(organizacaoId, adminId) {
  console.log('Criando dados de teste para liturgia...');

  const musicasData = [
    { titulo: 'Grandes Coisas', compositor: 'Diante do Trono', artista: 'Diante do Trono', tom: 'G', categoria: 'Adoracao', letra: 'Grandes coisas Tu tens feito, grandioso és Tu...', organizacaoId },
    { titulo: 'Aos Bracos do Pai', compositor: 'Aline Barros', artista: 'Aline Barros', tom: 'C', categoria: 'Adoracao', letra: 'Aos bracos do Pai eu vou correr...', organizacaoId },
    { titulo: 'Tu és Fiel', compositor: 'Harpa Crista', artista: 'Harpa Crista', tom: 'D', categoria: 'Adoracao', letra: 'Tu és fiel, oh meu Deus...', organizacaoId },
    { titulo: 'Santo Espirito', compositor: 'Fernando', artista: 'Gabriela Rocha', tom: 'A', categoria: 'Adoracao', letra: 'Santo Espirito, Te imploro, vem...', organizacaoId },
    { titulo: 'Vem, Espirito Santo', compositor: 'Ministerio Apascentar', artista: 'Ministerio Apascentar', tom: 'G', categoria: 'Louvor', letra: 'Vem, Espirito Santo, enche este lugar...', organizacaoId },
    { titulo: 'Eu Te Louvarei', compositor: 'Harpa Crista', artista: 'Harpa Crista', tom: 'C', categoria: 'Adoracao', letra: 'Eu Te louvarei, oh Senhor...', organizacaoId },
  ];

  for (const m of musicasData) {
    const existing = await prisma.liturgiaMusica.findFirst({ where: { titulo: m.titulo, organizacaoId } });
    if (!existing) {
      await prisma.liturgiaMusica.create({ data: m });
    }
  }
  console.log('  Musicas criadas:', musicasData.length);

  const modeloCultoDomingo = await prisma.liturgiaModelo.create({
    data: {
      nome: 'Culto Dominical Padrao',
      descricao: 'Estrutura basica para cultos dominicais da manha e da noite',
      tipoCulto: 'Celebracao',
      organizacaoId,
      createdById: adminId,
      momentos: {
        create: [
          { ordem: 1, tipo: 'ABERTURA', titulo: 'Abertura e Acolhimento', duracaoPrevista: 5, descricao: 'Recepcao dos membros e visitantes' },
          { ordem: 2, tipo: 'LOUVOR', titulo: 'Momento de Louvor', duracaoPrevista: 20, descricao: '3 musicas de louvor e adoracao' },
          { ordem: 3, tipo: 'ORACAO', titulo: 'Oração', duracaoPrevista: 5, descricao: 'Oração de abertura' },
          { ordem: 4, tipo: 'DIZIMOS', titulo: 'Dízimos e Ofertas', duracaoPrevista: 5, descricao: 'Momento de ofertas e dizimos' },
          { ordem: 5, tipo: 'ALAS', titulo: 'Momento das Alas', duracaoPrevista: 10, descricao: 'Apresentacao das alas (se houver)' },
          { ordem: 6, tipo: 'MENSAGEM', titulo: 'Pregação', duracaoPrevista: 40, descricao: 'Ministracao da palavra' },
          { ordem: 7, tipo: 'RESPOSTA', titulo: 'Momento de Resposta', duracaoPrevista: 10, descricao: 'Altar e oracao' },
          { ordem: 8, tipo: 'COMUNICADOS', titulo: 'Comunicados', duracaoPrevista: 5, descricao: 'Avisos gerais' },
          { ordem: 9, tipo: 'BENCAO', titulo: 'Bênção Final', duracaoPrevista: 3, descricao: 'Bênção e despedida' },
        ],
      },
    },
  });

  const modeloCultoJovens = await prisma.liturgiaModelo.create({
    data: {
      nome: 'Culto de Jovens',
      descricao: 'Culto dinamico para o ministerio de jovens',
      tipoCulto: 'Encontro',
      organizacaoId,
      createdById: adminId,
      momentos: {
        create: [
          { ordem: 1, tipo: 'ABERTURA', titulo: 'Abertura', duracaoPrevista: 5, descricao: 'Recepcao com musica ambiente' },
          { ordem: 2, tipo: 'LOUVOR', titulo: 'Louvor Intenso', duracaoPrevista: 15, descricao: '3 musicas agitadas' },
          { ordem: 3, tipo: 'DINAMICA', titulo: 'Dinamica', duracaoPrevista: 10, descricao: 'Quebra-gelo ou dinamica' },
          { ordem: 4, tipo: 'ORACAO', titulo: 'Oração', duracaoPrevista: 3, descricao: 'Oração rapida' },
          { ordem: 5, tipo: 'MENSAGEM', titulo: 'Palavra', duracaoPrevista: 30, descricao: 'Mensagem para jovens' },
          { ordem: 6, tipo: 'RESPOSTA', titulo: 'Momento de Resposta', duracaoPrevista: 10, descricao: 'Altar e oracao' },
          { ordem: 7, tipo: 'COMUNICADOS', titulo: 'Anuncios', duracaoPrevista: 3, descricao: 'Avisos do ministerio' },
        ],
      },
    },
  });
  console.log('  Modelos criados: Culto Dominical Padrao, Culto de Jovens');

  const liturgiasData = [
    {
      organizacaoId,
      data: new Date('2026-09-06'),
      horarioInicio: '19:00',
      horarioFimPrevisto: '21:00',
      tipoCulto: 'Celebracao',
      tema: 'Restauracao e Avivamento',
      dirigente: 'Dc. Marcio Louzeiro',
      pregador: 'Pr. Cleiginaldo Barros',
      responsavel: 'Dc. Marcio Louzeiro',
      status: 'PRONTA',
      createdById: adminId,
      itens: {
        create: [
          { ordem: 1, tipo: 'ABERTURA', titulo: 'Abertura e Acolhimento', horarioPrevisto: '19:00', duracaoPrevista: 5, responsavel: 'Dc. Marcio Louzeiro', status: 'PENDENTE' },
          { ordem: 2, tipo: 'LOUVOR', titulo: 'Momento de Louvor', horarioPrevisto: '19:05', duracaoPrevista: 20, responsavel: 'Ministerio de Louvor', status: 'PENDENTE' },
          { ordem: 3, tipo: 'ORACAO', titulo: 'Oração de Abertura', horarioPrevisto: '19:25', duracaoPrevista: 5, responsavel: 'Missionario Cristiano', status: 'PENDENTE' },
          { ordem: 4, tipo: 'DIZIMOS', titulo: 'Dízimos e Ofertas', horarioPrevisto: '19:30', duracaoPrevista: 5, responsavel: 'Tesouraria', status: 'PENDENTE' },
          { ordem: 5, tipo: 'MENSAGEM', titulo: 'Pregação: Restauracao', horarioPrevisto: '19:35', duracaoPrevista: 40, responsavel: 'Pr. Cleiginaldo Barros', status: 'PENDENTE', temaPregacao: 'Restauracao da primeira nocao' },
          { ordem: 6, tipo: 'RESPOSTA', titulo: 'Momento de Resposta', horarioPrevisto: '20:15', duracaoPrevista: 10, responsavel: 'Pr. Cleiginaldo Barros', status: 'PENDENTE' },
          { ordem: 7, tipo: 'COMUNICADOS', titulo: 'Comunicados', horarioPrevisto: '20:25', duracaoPrevista: 5, responsavel: 'Dc. Marcio Louzeiro', status: 'PENDENTE' },
          { ordem: 8, tipo: 'BENCAO', titulo: 'Bênção Final', horarioPrevisto: '20:30', duracaoPrevista: 3, responsavel: 'Pr. Cleiginaldo Barros', status: 'PENDENTE' },
        ],
      },
    },
    {
      organizacaoId,
      data: new Date('2026-09-07'),
      horarioInicio: '10:00',
      horarioFimPrevisto: '12:00',
      tipoCulto: 'Celebracao',
      tema: 'A Luz do Mundo',
      dirigente: 'Missionaria Suenne Baros',
      pregador: 'Pr. Walmorio',
      responsavel: 'Missionaria Suenne Baros',
      status: 'RASCUNHO',
      createdById: adminId,
      itens: {
        create: [
          { ordem: 1, tipo: 'ABERTURA', titulo: 'Abertura', horarioPrevisto: '10:00', duracaoPrevista: 5, responsavel: 'Missionaria Suenne Baros', status: 'PENDENTE' },
          { ordem: 2, tipo: 'LOUVOR', titulo: 'Louvor e Adoracao', horarioPrevisto: '10:05', duracaoPrevista: 15, responsavel: 'Ministerio de Louvor', status: 'PENDENTE' },
          { ordem: 3, tipo: 'ORACAO', titulo: 'Oração', horarioPrevisto: '10:20', duracaoPrevista: 5, responsavel: 'Dc. Thiane Louzeiro', status: 'PENDENTE' },
          { ordem: 4, tipo: 'DIZIMOS', titulo: 'Ofertas', horarioPrevisto: '10:25', duracaoPrevista: 5, responsavel: 'Tesouraria', status: 'PENDENTE' },
          { ordem: 5, tipo: 'MENSAGEM', titulo: 'Pregação', horarioPrevisto: '10:30', duracaoPrevista: 35, responsavel: 'Pr. Walmorio', status: 'PENDENTE', temaPregacao: 'Cristo, a luz do mundo' },
          { ordem: 6, tipo: 'RESPOSTA', titulo: 'Altar', horarioPrevisto: '11:05', duracaoPrevista: 10, responsavel: 'Pr. Walmorio', status: 'PENDENTE' },
          { ordem: 7, tipo: 'BENCAO', titulo: 'Bênção Final', horarioPrevisto: '11:15', duracaoPrevista: 3, responsavel: 'Pr. Walmorio', status: 'PENDENTE' },
        ],
      },
    },
    {
      organizacaoId,
      data: new Date('2026-09-13'),
      horarioInicio: '19:00',
      horarioFimPrevisto: '21:00',
      tipoCulto: 'Celebracao',
      tema: 'Unidade na Diversidade',
      dirigente: 'Ayton Sena',
      pregador: 'Pr. Melquesedeque',
      responsavel: 'Ayton Sena',
      status: 'EM_PREPARACAO',
      createdById: adminId,
      itens: {
        create: [
          { ordem: 1, tipo: 'ABERTURA', titulo: 'Abertura', horarioPrevisto: '19:00', duracaoPrevista: 5, responsavel: 'Ayton Sena', status: 'PENDENTE' },
          { ordem: 2, tipo: 'LOUVOR', titulo: 'Louvor', horarioPrevisto: '19:05', duracaoPrevista: 20, responsavel: 'Ministerio de Louvor', status: 'PENDENTE' },
          { ordem: 3, tipo: 'ORACAO', titulo: 'Oração', horarioPrevisto: '19:25', duracaoPrevista: 3, responsavel: 'Missionario Cristiano', status: 'PENDENTE' },
          { ordem: 4, tipo: 'MENSAGEM', titulo: 'Pregação', horarioPrevisto: '19:30', duracaoPrevista: 40, responsavel: 'Pr. Melquesedeque', status: 'PENDENTE', temaPregacao: 'A unidade que vem do Espirito' },
          { ordem: 5, tipo: 'RESPOSTA', titulo: 'Altar', horarioPrevisto: '20:10', duracaoPrevista: 10, responsavel: 'Pr. Melquesedeque', status: 'PENDENTE' },
        ],
      },
    },
  ];

  for (const l of liturgiasData) {
    const existing = await prisma.liturgia.findFirst({ where: { tema: l.tema, organizacaoId } });
    if (!existing) {
      await prisma.liturgia.create({ data: l });
    }
  }
  console.log('  Liturgias criadas:', liturgiasData.length);
}

async function seedVersiculos(organizacaoId) {
  const versiculosData = [
    {
      organizacaoId,
      referencia: 'Joao 3:16',
      versiculo: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nele cre nao peca, mas tenha a vida eterna.',
      reflexao: 'O amor de Deus nao e teorico - ele se moveu em nossa direcao. A salvacao nao e uma conquista humana, mas um presente divino. Crer em Jesus e abrir a porta para uma vida que a morte nao pode destruir.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Filipenses 4:13',
      versiculo: 'Tudo posso naquele que me fortalece.',
      reflexao: 'Paulo escreveu desta prisao, nao de um palacio. A forca que ele descreve nao e para vencer na vida, mas para enfrentar qualquer circunstancia sem perder a paz. Em Cristo, voce pode passar pela tempestade e ainda assim cantar.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Salmos 23:1',
      versiculo: 'O Senhor e o meu pastor; nada me faltara.',
      reflexao: 'Davi conhecia a vida de pastor: dependencia total, confianca absoluta. Quando reconhecemos Deus como nosso pastor, entregamos a direcao e descansamos.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Isaias 41:10',
      versiculo: 'Nao temas, porque eu sou contigo; nao te assombres, porque eu sou teu Deus; eu te fortaleco, e te ajudo, e te sustento com a minha destra fiel.',
      reflexao: 'Deus nao prometeu remover os obstaculos, mas estar presente em cada um deles. O medo perde a forca quando lembramos que o Criador do universo caminha ao nosso lado.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Joao 8:32',
      versiculo: 'E conhecereis a verdade, e a verdade vos libertara.',
      reflexao: 'Vivemos cercados de meias-verdades que nos aprisionam em ansiedade, culpa e medo. Conhecer a verdade de Cristo e trocar as correntes da mentira pela liberdade.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Efesios 3:20',
      versiculo: 'Aquele que e poderoso para fazer tudo muito mais abundantemente daquilo que pedimos ou pensamos, segundo o poder que em nos opera.',
      reflexao: 'Nossos sonhos e oracoes sao pequenos perto do que Deus pode fazer. Ele nao age apenas nos limites da nossa imaginacao - seu poder ultrapassa qualquer pedido que ousamos fazer.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Deuteronomio 31:6',
      versiculo: 'Sede fortes e corajosos; nao temais, nem vos atemorizeis diante deles, porque o Senhor vosso Deus e quem vai convosco; nao vos deixara, nem vos desamparara.',
      reflexao: 'A coragem nao vem de dentro de nos - vem da certeza de que nao estamos sozinhos. O que Deus comecou em sua vida, ele mesmo levara ate o fim.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Isaias 40:31',
      versiculo: 'Mas os que esperam no Senhor renovam as suas forcas; sobem com asas como aguias; correm e nao se cansam; caminham e nao se fatigam.',
      reflexao: 'Esperar no Senhor nao e passividade - e confiar ativamente enquanto se descansa. Somos sustentados pela graça divina quando deixamos de lutar com nossas proprias forcas.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Salmos 30:5',
      versiculo: 'O choro pode durar uma noite, mas a alegria vem pela manha.',
      reflexao: 'Davi sabia que a dor tem prazo de validade. As noites escuras da alma nao sao eternas. Deus nao se atrasa - ele chega no momento exato em que a luz precisa brilhar.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Mateus 6:33',
      versiculo: 'Buscai primeiro o reino de Deus e a sua justica, e todas estas coisas vos serao acrescentadas.',
      reflexao: 'Jesus inverte a logica do mundo. Nao e sobre correr atras de coisas, mas sobre buscar a presenca de Deus. Quando colocamos o Reino em primeiro lugar, tudo o mais se encaixa.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Salmos 91:1',
      versiculo: 'Aquele que habita no esconderijo do Altissimo, a sombra do Onipotente descansara.',
      reflexao: 'Habitar e diferente de visitar. E fazer da presenca de Deus a sua casa. Quem vive nesse esconderijo encontra uma paz que o mundo nao pode oferecer nem tirar.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Jeremias 29:11',
      versiculo: 'Porque eu bem sei os pensamentos que penso de vos, diz o Senhor; pensamentos de paz e nao de mal, para vos dar o fim que esperais.',
      reflexao: 'No exilio, o povo de Deus achava que tudo estava perdido. Mas Deus ja tinha um plano de restauracao. Mesmo quando voce nao entende o caminho, o coracao de Deus ja preparou um futuro de esperanca.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Salmos 46:1',
      versiculo: 'Deus e o nosso refugio e fortaleza, socorro bem presente na angustia.',
      reflexao: 'Refugio nao e fuga - e seguranca. Quando o mundo treme ao nosso redor, Deus nao e um abrigo distante; ele e socorro presente, acessivel, real.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Mateus 11:28',
      versiculo: 'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.',
      reflexao: 'Jesus nao convida os que ja estao descansados, mas os que estao sobrecarregados. O cansaco da vida, das lutas e das expectativas pode ser deixado aos pes dele.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: '1 Tessalonicenses 5:18',
      versiculo: 'Em tudo dai graças, porque esta e a vontade de Deus em Cristo Jesus para convosco.',
      reflexao: 'Nao e acao de graças pelo que acontece, mas em tudo o que acontece. A gratidao nao nega a dor - ela a enfrenta com a certeza de que Deus esta agindo mesmo no caos.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: '1 Joao 4:19',
      versiculo: 'Nos amamos porque ele nos amou primeiro.',
      reflexao: 'O amor humano e muitas vezes uma resposta. Mas o amor de Deus e origem - ele amou antes de qualquer merecimento. Somos capazes de amar porque fomos amados por completo.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Joao 14:27',
      versiculo: 'A paz deixo convosco, a minha paz vos dou; nao vo-la dou como o mundo a da. Nao se turbe o vosso coracao, nem se atemorize.',
      reflexao: 'A paz do mundo depende de circunstancias favoraveis. A paz de Jesus existe dentro da tempestade. Ela nao e ausencia de problemas, mas presenca de Cristo.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Salmos 119:105',
      versiculo: 'Lampada para os meus pes e a tua palavra e luz para o meu caminho.',
      reflexao: 'A palavra de Deus nao ilumina o futuro distante - ela clareia o proximo passo. Muitas vezes queremos ver o caminho inteiro, mas ele nos da luz suficiente para o hoje.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Josue 1:9',
      versiculo: 'Esforça-te, e tem bom animo; nao pasmes, nem te espantes, porque o Senhor teu Deus e contigo, por onde quer que andares.',
      reflexao: 'A ordem de Deus a Josue veio num momento de transicao e medo. A mesma ordem vale para nos: esforco e animo andam juntos. Nao porque somos fortes, mas porque Deus esta conosco.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Jeremias 33:3',
      versiculo: 'Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes e firmes que nao sabes.',
      reflexao: 'Deus faz um convite ousado: clame. Ele promete resposta e revelacao. Muitas vezes deixamos de clamar por achar que Deus ja sabe ou que nao se importa.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Filipenses 4:6',
      versiculo: 'Nao andeis ansiosos por coisa alguma; antes, em tudo, sejam os vossos pedidos conhecidos diante de Deus pela oracao e suplica, com acoes de graças.',
      reflexao: 'A ansiedade e um peso que nao fomos feitos para carregar. Paulo ensina o caminho: oracao, suplica e gratidao. Entregue a Deus o que te tira o sono e confie nele.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Salmos 27:1',
      versiculo: 'O Senhor e a minha luz e a minha salvacao; de quem terei medo? O Senhor e a fortaleza da minha vida; a quem temerei?',
      reflexao: 'Davi enfrentou inimigos reais, mas sua pergunta retorica nos desafia: se Deus e luz, salvacao e fortaleza, o que pode nos ameacar de verdade?',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Mateus 7:24',
      versiculo: 'Todo aquele, pois, que ouve estas minhas palavras e as pratica, assemelha-lo-ei ao homem prudente que edificou a sua casa sobre a rocha.',
      reflexao: 'Ouvir sem praticar e construir na areia. A sabedoria nao esta no conhecimento, mas na obediencia. As tempestades vem para todos - a diferenca e quem esta firmado na rocha.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Salmos 32:8',
      versiculo: 'Instruir-te-ei e ensinar-te-ei o caminho que deves seguir; guiar-te-ei com os meus olhos.',
      reflexao: 'Deus nao te deixou perdido no mundo. Ele promete instrucao, ensino e direcao pessoal. Nao e um mapa generico - e um guia que te conhece pelo nome.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: '2 Corintios 5:17',
      versiculo: 'De maneira que, se alguem esta em Cristo, nova criatura e; as coisas velhas ja passaram; eis que tudo se fez novo.',
      reflexao: 'Em Cristo, voce nao e apenas perdoado - voce e renovado. O passado nao define mais seu futuro. As marcas continuam, mas o poder delas se quebrou.',
      ativo: true,
    },
    {
      organizacaoId,
      referencia: 'Naum 1:7',
      versiculo: 'O Senhor e bom, uma fortaleza no dia da angustia, e conhece os que nele confiam.',
      reflexao: 'Mesmo num livro profetico de juizo, encontramos esta joia: Deus e bom. Ele nao muda seu carater por causa das circunstancias.',
      ativo: true,
    },
  ];

  let count = 0;
  for (const v of versiculosData) {
    const existing = await prisma.versiculoDiario.findFirst({
      where: { organizacaoId, referencia: v.referencia },
    });
    if (!existing) {
      await prisma.versiculoDiario.create({ data: v });
      count++;
    }
  }
  console.log('  Versiculos criados:', count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
