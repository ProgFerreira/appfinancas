import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';


export const dynamic = 'force-static';
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
    const allowed = await hasPermission(userId, 'perfis.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão.' }, { status: 403 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const roleRows = await query<
      { id: number; nome: string; descricao: string | null; ativo: number }[]
    >('SELECT id, nome, descricao, ativo FROM roles WHERE id = ? LIMIT 1', [idNum]);
    const role = Array.isArray(roleRows) ? roleRows[0] : null;
    if (!role) {
      return NextResponse.json({ success: false, error: 'Perfil não encontrado' }, { status: 404 });
    }
    const permRows = await query<{ permission_id: number }[]>(
      'SELECT permission_id FROM role_permissions WHERE role_id = ?',
      [idNum]
    );
    const permission_ids = Array.isArray(permRows) ? permRows.map((r) => r.permission_id) : [];
    const userRows = await query<{ user_id: number; nome: string; email: string }[]>(
      `SELECT u.id AS user_id, u.nome, u.email FROM user_roles ur INNER JOIN usuarios u ON u.id = ur.user_id WHERE ur.role_id = ? ORDER BY u.nome`,
      [idNum]
    );
    const usuarios = Array.isArray(userRows) ? userRows : [];
    return NextResponse.json({
      success: true,
      data: {
        ...role,
        permission_ids,
        usuarios,
      },
    });
  } catch (e) {
    console.error('API perfis [id] GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar perfil.' }, { status: 500 });
  }
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
    const allowed = await hasPermission(userId, 'perfis.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para editar perfil.' }, { status: 403 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : null;
    const ativo = body.ativo === 0 ? 0 : 1;
    if (!nome) {
      return NextResponse.json({ success: false, error: 'Nome do perfil é obrigatório.' }, { status: 400 });
    }
    await query('UPDATE roles SET nome = ?, descricao = ?, ativo = ? WHERE id = ?', [
      nome,
      descricao ?? null,
      ativo,
      idNum,
    ]);
    if (Array.isArray(body.permission_ids)) {
      await query('DELETE FROM role_permissions WHERE role_id = ?', [idNum]);
      const permissionIds = body.permission_ids.filter((x: unknown) => Number.isInteger(x));
      for (const pid of permissionIds) {
        await query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [idNum, pid]);
      }
    }
    if (Array.isArray(body.user_ids)) {
      await query('DELETE FROM user_roles WHERE role_id = ?', [idNum]);
      const userIds = body.user_ids.filter((x: unknown) => Number.isInteger(x));
      for (const uid of userIds) {
        await query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [uid, idNum]);
      }
    }
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API perfis [id] PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar perfil.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'perfis.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para excluir perfil.' }, { status: 403 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    await query('DELETE FROM role_permissions WHERE role_id = ?', [idNum]);
    await query('DELETE FROM user_roles WHERE role_id = ?', [idNum]);
    await query('DELETE FROM roles WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API perfis [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir perfil.' }, { status: 500 });
  }
}
