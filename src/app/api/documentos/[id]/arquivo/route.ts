import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { canDo } from '@/lib/documentPermissions';
import {
  saveFile,
  deleteFile,
  fileExists,
  validateFile,
} from '@/lib/documentStorage';

/**
 * PUT: substitui o arquivo do documento por um novo (mantém id, nome de exibição e permissões).
 * Body: FormData com campo "file".
 */

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: '0' }];
}

export async function PUT(
  request: NextRequest,
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

    const allowed = await canDo(userId, idNum, 'edit');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para editar este documento.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const err = validateFile(file.type, file.size, file.name);
    if (err) {
      return NextResponse.json({ success: false, error: err }, { status: 400 });
    }

    const rows = await query<{ caminho: string }[]>(
      'SELECT caminho FROM documentos WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [idNum]
    );
    const doc = Array.isArray(rows) ? rows[0] : null;
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado.' }, { status: 404 });
    }

    if (doc.caminho) {
      const exists = await fileExists(doc.caminho);
      if (exists) await deleteFile(doc.caminho).catch(() => {});
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const novoCaminho = await saveFile(idNum, file.name, buffer);

    await query(
      `UPDATE documentos SET nome_arquivo = ?, caminho = ?, mime_type = ?, tamanho = ? WHERE id = ? AND deleted_at IS NULL`,
      [file.name, novoCaminho, file.type || null, file.size, idNum]
    );

    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API documentos [id] arquivo PUT:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao substituir arquivo.' },
      { status: 500 }
    );
  }
}
