const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@iadmp.com.br' },
    update: {},
    create: {
      name: 'Admin IADMP',
      email: 'admin@iadmp.com.br',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created:', admin.email);

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

  console.log('Seed concluido com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
