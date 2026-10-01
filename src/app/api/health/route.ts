import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.user.count();
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      databaseUrl: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
      nextauthSecret: process.env.NEXTAUTH_SECRET ? 'SET (hidden)' : 'NOT SET',
    });
  } catch {
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      databaseUrl: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
    }, { status: 500 });
  }
}
