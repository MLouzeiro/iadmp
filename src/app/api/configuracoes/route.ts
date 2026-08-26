import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultColors } from '@/lib/theme-palettes';

export async function GET() {
  try {
    let config = await prisma.configuracoesIgreja.findFirst();
    if (!config) {
      config = await prisma.configuracoesIgreja.create({
        data: {
          nomeIgreja: 'Igreja Assembleia de Deus Ministerio da Promessa',
          ...defaultColors,
        },
      });
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching church config:', error);
    return NextResponse.json(defaultColors);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    let config = await prisma.configuracoesIgreja.findFirst();

    const data = {
      nomeIgreja: body.nomeIgreja,
      logoUrl: body.logoUrl,
      logoDarkUrl: body.logoDarkUrl,
      faviconUrl: body.faviconUrl,
      corPrincipal: body.corPrincipal,
      corSecundaria: body.corSecundaria,
      corDestaque: body.corDestaque,
      corFundo: body.corFundo,
      corFundoClaro: body.corFundoClaro,
      corSuperficie: body.corSuperficie,
      corTexto: body.corTexto,
      corTextoSecundario: body.corTextoSecundario,
      corBorda: body.corBorda,
      tema: body.tema,
    };

    if (config) {
      config = await prisma.configuracoesIgreja.update({
        where: { id: config.id },
        data,
      });
    } else {
      config = await prisma.configuracoesIgreja.create({ data });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating church config:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configuracoes' },
      { status: 500 }
    );
  }
}
