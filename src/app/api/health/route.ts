import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      userCount,
      databaseUrl: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
      nextauthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
      nextauthSecret: process.env.NEXTAUTH_SECRET ? 'SET (hidden)' : 'NOT SET',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      databaseUrl: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
    }, { status: 500 });
  }
}
