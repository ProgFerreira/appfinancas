import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import type { UsuarioComSenha } from '@/types';


export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, senha } = body as { email?: string; senha?: string };
    if (!email || !senha) {
      return NextResponse.json(
        { success: false, error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const rows = await query<UsuarioComSenha[]>(
      'SELECT id, nome, email, senha_hash, perfil, status, ativo FROM usuarios WHERE email = ? AND ativo = 1 LIMIT 1',
      [email.trim().toLowerCase()]
    );
    const user = Array.isArray(rows) ? rows[0] : null;
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha inválidos.' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(senha, user.senha_hash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha inválidos.' },
        { status: 401 }
      );
    }

    if (user.status !== 'ativo') {
      return NextResponse.json(
        { success: false, error: 'Usuário inativo.' },
        { status: 403 }
      );
    }

    await setSessionCookie(user.id);
    return NextResponse.json({
      success: true,
      data: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil },
    });
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar login.' },
      { status: 500 }
    );
  }
}
