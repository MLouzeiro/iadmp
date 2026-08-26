import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
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

    return NextResponse.json({ success: true, user: { id: admin.id, email: admin.email, role: admin.role } });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Erro ao criar admin' }, { status: 500 });
  }
}
