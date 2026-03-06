import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { canDo } from '@/lib/documentPermissions';
import { readFileBuffer, fileExists } from '@/lib/documentStorage';


export const dynamic = 'force-dynamic';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: '0' }];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const allowed = await canDo(userId, idNum, 'download');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para baixar este documento.' }, { status: 403 });
    }

    const rows = await query<{ nome_arquivo: string; caminho: string; mime_type: string | null }[]>(
      'SELECT nome_arquivo, caminho, mime_type FROM documentos WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [idNum]
    );
    const doc = Array.isArray(rows) ? rows[0] : null;
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado.' }, { status: 404 });
    }

    const exists = await fileExists(doc.caminho);
    if (!exists) {
      return NextResponse.json({ success: false, error: 'Arquivo não encontrado no armazenamento.' }, { status: 404 });
    }

    const buffer = await readFileBuffer(doc.caminho);
    const filename = doc.nome_arquivo || 'documento';
    const mime = doc.mime_type || 'application/octet-stream';

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (e) {
    console.error('API documentos [id] download GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao baixar documento.' }, { status: 500 });
  }
}
