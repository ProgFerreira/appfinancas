import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const offset = (page - 1) * perPage;
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (status === 'ativo') { where += ' AND u.ativo = 1'; }
    else if (status === 'inativo') { where += ' AND u.ativo = 0'; }
    const countRows = await query<{ total: number }[]>(`SELECT COUNT(*) AS total FROM usuarios u ${where}`, params);
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;
    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const list = await query<
      { id: number; nome: string; email: string; perfil: string; status: string; ativo: number; created_at: string }[]
    >(
      `SELECT id, nome, email, perfil, status, ativo, created_at FROM usuarios ${where} ORDER BY nome LIMIT ${limit} OFFSET ${Math.max(0, offset)}`,
      params
    );
    return NextResponse.json({
      success: true,
      data: Array.isArray(list) ? list : [],
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API usuarios GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar usuários.' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const senha = typeof body.senha === 'string' ? body.senha : '';
    const perfil = typeof body.perfil === 'string' && ['administrador', 'financeiro', 'diretoria', 'operacao'].includes(body.perfil) ? body.perfil : 'operacao';
    if (!nome || !email || !senha || senha.length < 6) {
      return NextResponse.json({ success: false, error: 'Nome, e-mail e senha (mín. 6 caracteres) são obrigatórios.' }, { status: 400 });
    }
    const bcrypt = await import('bcryptjs');
    const senhaHash = await bcrypt.hash(senha, 10);
    await query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, status, ativo) VALUES (?, ?, ?, ?, 'ativo', 1)`,
      [nome, email, senhaHash, perfil]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : 0;
    const role_ids = Array.isArray(body.role_ids) ? body.role_ids.filter((x: unknown) => Number.isInteger(x)) : [];
    for (const roleId of role_ids) {
      await query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [id, roleId]);
    }
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API usuarios POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao cadastrar usuário.' }, { status: 500 });
  }
}
