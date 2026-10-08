import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-helpers';
import bcrypt from 'bcryptjs';

export async function GET() {
  return handleSeed();
}

export async function POST() {
  return handleSeed();
}

async function handleSeed() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    await requireSuperAdmin();

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
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Erro ao executar seed' }, { status: 500 });
  }
}
