import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { uploadArquivo } from '@/lib/storage';
import { writeAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await request.formData();
    const arquivo = formData.get('arquivo');
    const organizacaoId = formData.get('organizacaoId') as string | null;
    const pasta = (formData.get('pasta') as string) || 'geral';
    const entityTipo = formData.get('entityTipo') as string | null;
    const entityId = formData.get('entityId') as string | null;

    if (!arquivo || !(arquivo instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }
    if (!organizacaoId) {
      return NextResponse.json({ error: 'organizacaoId é obrigatório.' }, { status: 400 });
    }

    const resultado = await uploadArquivo({
      organizacaoId,
      arquivo,
      pasta,
      entityTipo: entityTipo || undefined,
      entityId: entityId || undefined,
      uploadedById: user.id,
    });

    if (!resultado.ok) {
      const status =
        resultado.codigo === 'SEM_ESPACO' ? 507 :
        resultado.codigo === 'TIPO_INVALIDO' || resultado.codigo === 'GRANDE_DEMAIS' ? 400 :
        resultado.codigo === 'NAO_CONFIGURADO' ? 503 : 500;
      return NextResponse.json({ error: resultado.erro, codigo: resultado.codigo }, { status });
    }

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'UPLOAD_ARQUIVO',
      entidade: 'StoredFile',
      entidadeId: resultado.path || '',
      depois: { path: resultado.path, sizeBytes: resultado.sizeBytes, pasta },
      req: request,
    });

    return NextResponse.json({
      url: resultado.url,
      path: resultado.path,
      sizeBytes: resultado.sizeBytes,
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: `Erro no upload: ${(e as Error).message}` }, { status: 500 });
  }
}
