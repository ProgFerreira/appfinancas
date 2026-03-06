import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';


export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'perfis.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para listar perfis.' }, { status: 403 });
    }
    const rows = await query<
      { id: number; nome: string; descricao: string | null; ativo: number; created_at: string }[]
    >('SELECT id, nome, descricao, ativo, created_at FROM roles ORDER BY nome');
    return NextResponse.json({
      success: true,
      data: Array.isArray(rows) ? rows : [],
    });
  } catch (e) {
    console.error('API perfis GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar perfis.' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'perfis.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para criar perfil.' }, { status: 403 });
    }
    const body = await request.json();
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : null;
    if (!nome) {
      return NextResponse.json({ success: false, error: 'Nome do perfil é obrigatório.' }, { status: 400 });
    }
    await query('INSERT INTO roles (nome, descricao, ativo) VALUES (?, ?, 1)', [nome, descricao ?? null]);
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : 0;
    const permissionIds = Array.isArray(body.permission_ids) ? body.permission_ids.filter((x: unknown) => Number.isInteger(x)) : [];
    if (permissionIds.length > 0 && id > 0) {
      for (const pid of permissionIds) {
        await query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [id, pid]);
      }
    }
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API perfis POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao criar perfil.' }, { status: 500 });
  }
}
