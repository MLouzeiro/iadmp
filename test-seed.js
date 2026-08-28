const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Conectando ao banco...');
    const count = await prisma.user.count();
    console.log('Usuarios no banco:', count);
    
    console.log('Criando admin...');
    const hash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@iadmp.com.br' },
      update: {},
      create: {
        name: 'Admin IADMP',
        email: 'admin@iadmp.com.br',
        passwordHash: hash,
        role: 'ADMIN',
      },
    });
    console.log('Admin criado:', admin.id, admin.email, admin.role);
    
    await prisma.$disconnect();
  } catch(e) {
    console.error('ERRO:', e.message);
    await prisma.$disconnect();
  }
}
test();
