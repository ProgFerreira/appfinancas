import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


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
    const rows = await query<
      { id: number; nome: string; email: string; perfil: string; status: string; ativo: number; created_at: string }[]
    >(
      'SELECT id, nome, email, perfil, status, ativo, created_at FROM usuarios WHERE id = ? LIMIT 1',
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }
    const roleRows = await query<{ role_id: number }[]>(
      'SELECT role_id FROM user_roles WHERE user_id = ?',
      [idNum]
    );
    const role_ids = Array.isArray(roleRows) ? roleRows.map((r) => r.role_id) : [];
    return NextResponse.json({ success: true, data: { ...item, role_ids } });
  } catch (e) {
    console.error('API usuarios [id] GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar.' }, { status: 500 });
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
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const perfil = typeof body.perfil === 'string' && ['administrador', 'financeiro', 'diretoria', 'operacao'].includes(body.perfil) ? body.perfil : 'operacao';
    const status = typeof body.status === 'string' && ['ativo', 'inativo'].includes(body.status) ? body.status : 'ativo';
    const ativo = body.ativo === 0 ? 0 : 1;
    if (!nome || !email) {
      return NextResponse.json({ success: false, error: 'Nome e e-mail são obrigatórios.' }, { status: 400 });
    }
    const updates: string[] = ['nome = ?', 'email = ?', 'perfil = ?', 'status = ?', 'ativo = ?'];
    const values: (string | number)[] = [nome, email, perfil, status, ativo];
    if (typeof body.senha === 'string' && body.senha.length >= 6) {
      const bcrypt = await import('bcryptjs');
      values.push(await bcrypt.hash(body.senha, 10));
      updates.push('senha_hash = ?');
    }
    values.push(idNum);
    await query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, values);
    const role_ids = Array.isArray(body.role_ids) ? body.role_ids.filter((x: unknown) => Number.isInteger(x)) : [];
    await query('DELETE FROM user_roles WHERE user_id = ?', [idNum]);
    for (const roleId of role_ids) {
      await query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [idNum, roleId]);
    }
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API usuarios [id] PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar.' }, { status: 500 });
  }
}

/** Soft delete: define ativo = 0 e status = 'inativo'. */
export async function DELETE(
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
    await query('UPDATE usuarios SET ativo = 0, status = ? WHERE id = ?', ['inativo', idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API usuarios [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir.' }, { status: 500 });
  }
}
