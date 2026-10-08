import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getUserOrganizations } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const user = await requireAuth();
    const orgs = await getUserOrganizations(user.id);
    return NextResponse.json(orgs);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro ao buscar organizações' }, { status: 500 });
  }
}
